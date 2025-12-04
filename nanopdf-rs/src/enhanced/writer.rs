//! PDF Writer - Create and modify PDF documents
//!
//! Complete implementation for creating new PDFs with pages and content.

use super::error::{EnhancedError, Result};
use crate::pdf::object::{Array, Dict, Name, Object, ObjRef};
use std::fs::File;
use std::io::{BufWriter, Seek, Write};

/// PDF Writer for creating new documents
pub struct PdfWriter {
    /// Objects in the PDF
    objects: Vec<Object>,
    /// Pages array
    pages: Vec<usize>, // Object numbers of page objects
    /// Next object number
    next_obj_num: usize,
}

impl PdfWriter {
    /// Create a new PDF writer
    pub fn new() -> Self {
        Self {
            objects: vec![Object::Null], // Object 0 is null
            pages: Vec::new(),
            next_obj_num: 1,
        }
    }

    /// Add an object and return its object number
    fn add_object(&mut self, obj: Object) -> usize {
        let obj_num = self.next_obj_num;
        self.next_obj_num += 1;
        self.objects.push(obj);
        obj_num
    }

    /// Add a blank page with specified dimensions
    pub fn add_blank_page(&mut self, width: f32, height: f32) -> Result<()> {
        if width <= 0.0 || height <= 0.0 {
            return Err(EnhancedError::InvalidParameter(
                format!("Invalid page dimensions: {}x{}", width, height)
            ));
        }

        if width > 14400.0 || height > 14400.0 {
            return Err(EnhancedError::InvalidParameter(
                format!("Page dimensions too large: {}x{} (max 14400)", width, height)
            ));
        }

        // Create page content stream (empty for blank page)
        let content_data = b"".to_vec();
        let mut content_dict = Dict::new();
        content_dict.insert(Name::new("Length"), Object::Int(content_data.len() as i64));

        let content_obj = Object::Stream {
            dict: content_dict,
            data: content_data,
        };
        let content_ref = self.add_object(content_obj);

        // Create page dictionary
        let mut page_dict = Dict::new();
        page_dict.insert(Name::new("Type"), Object::Name(Name::new("Page")));

        // MediaBox: [0 0 width height]
        let media_box = Object::Array(vec![
            Object::Real(0.0),
            Object::Real(0.0),
            Object::Real(width as f64),
            Object::Real(height as f64),
        ]);
        page_dict.insert(Name::new("MediaBox"), media_box);

        // Resources (empty for now)
        let mut resources = Dict::new();
        resources.insert(Name::new("ProcSet"), Object::Array(vec![
            Object::Name(Name::new("PDF")),
            Object::Name(Name::new("Text")),
        ]));
        page_dict.insert(Name::new("Resources"), Object::Dict(resources));

        // Contents reference
        page_dict.insert(Name::new("Contents"), Object::Ref(ObjRef::new(content_ref as i32, 0)));

        // We'll set Parent later when creating Pages tree
        let page_obj_num = self.add_object(Object::Dict(page_dict));
        self.pages.push(page_obj_num);

        Ok(())
    }

    /// Add a page with content
    pub fn add_page_with_content(&mut self, width: f32, height: f32, content: &str) -> Result<()> {
        if width <= 0.0 || height <= 0.0 {
            return Err(EnhancedError::InvalidParameter(
                format!("Invalid page dimensions: {}x{}", width, height)
            ));
        }

        // Create content stream
        let content_data = content.as_bytes().to_vec();
        let mut content_dict = Dict::new();
        content_dict.insert(Name::new("Length"), Object::Int(content_data.len() as i64));

        let content_obj = Object::Stream {
            dict: content_dict,
            data: content_data,
        };
        let content_ref = self.add_object(content_obj);

        // Create page dictionary
        let mut page_dict = Dict::new();
        page_dict.insert(Name::new("Type"), Object::Name(Name::new("Page")));

        let media_box = Object::Array(vec![
            Object::Real(0.0),
            Object::Real(0.0),
            Object::Real(width as f64),
            Object::Real(height as f64),
        ]);
        page_dict.insert(Name::new("MediaBox"), media_box);

        let mut resources = Dict::new();
        resources.insert(Name::new("ProcSet"), Object::Array(vec![
            Object::Name(Name::new("PDF")),
            Object::Name(Name::new("Text")),
        ]));
        page_dict.insert(Name::new("Resources"), Object::Dict(resources));
        page_dict.insert(Name::new("Contents"), Object::Ref(ObjRef::new(content_ref as i32, 0)));

        let page_obj_num = self.add_object(Object::Dict(page_dict));
        self.pages.push(page_obj_num);

        Ok(())
    }

    /// Get number of pages
    pub fn page_count(&self) -> usize {
        self.pages.len()
    }

    /// Save the PDF to a file
    pub fn save(&self, path: &str) -> Result<()> {
        if self.pages.is_empty() {
            return Err(EnhancedError::InvalidParameter(
                "Cannot save PDF with no pages".into()
            ));
        }

        let file = File::create(path)?;
        let mut writer = BufWriter::new(file);

        // Write PDF header
        writer.write_all(b"%PDF-1.4\n")?;
        writer.write_all(b"%\xE2\xE3\xCF\xD3\n")?; // Binary comment

        // Track object offsets for xref
        let mut offsets = vec![0usize; self.objects.len()];

        // Create Pages tree
        let pages_kids: Array = self.pages.iter()
            .map(|&obj_num| Object::Ref(ObjRef::new(obj_num as i32, 0)))
            .collect();

        let mut pages_dict = Dict::new();
        pages_dict.insert(Name::new("Type"), Object::Name(Name::new("Pages")));
        pages_dict.insert(Name::new("Kids"), Object::Array(pages_kids));
        pages_dict.insert(Name::new("Count"), Object::Int(self.pages.len() as i64));

        let pages_obj_num = self.objects.len();
        let pages_ref = ObjRef::new(pages_obj_num as i32, 0);

        // Create Catalog
        let mut catalog_dict = Dict::new();
        catalog_dict.insert(Name::new("Type"), Object::Name(Name::new("Catalog")));
        catalog_dict.insert(Name::new("Pages"), Object::Ref(pages_ref));

        let catalog_obj_num = pages_obj_num + 1;

        // Write objects (skip object 0)
        for (idx, offset) in offsets.iter_mut().enumerate().skip(1) {
            *offset = writer.stream_position().map(|p| p as usize)?;

            // Add Parent reference to page objects
            let obj = if self.pages.contains(&idx) {
                if let Object::Dict(ref mut dict) = self.objects[idx].clone() {
                    let mut page_dict = dict.clone();
                    page_dict.insert(Name::new("Parent"), Object::Ref(pages_ref));
                    Object::Dict(page_dict)
                } else {
                    self.objects[idx].clone()
                }
            } else {
                self.objects[idx].clone()
            };

            self.write_indirect_object(&mut writer, idx, 0, &obj)?;
        }

        // Write Pages object
        let pages_offset = writer.stream_position().map(|p| p as usize)?;
        self.write_indirect_object(&mut writer, pages_obj_num, 0, &Object::Dict(pages_dict))?;

        // Write Catalog object
        let catalog_offset = writer.stream_position().map(|p| p as usize)?;
        self.write_indirect_object(&mut writer, catalog_obj_num, 0, &Object::Dict(catalog_dict))?;

        // Write xref table
        let xref_offset = writer.stream_position().map(|p| p as usize)?;
        writer.write_all(b"xref\n")?;
        writer.write_all(format!("0 {}\n", catalog_obj_num + 1).as_bytes())?;

        // Object 0 (free)
        writer.write_all(b"0000000000 65535 f \n")?;

        // Regular objects
        for offset in offsets.iter().skip(1) {
            writer.write_all(format!("{:010} 00000 n \n", offset).as_bytes())?;
        }

        // Pages and Catalog
        writer.write_all(format!("{:010} 00000 n \n", pages_offset).as_bytes())?;
        writer.write_all(format!("{:010} 00000 n \n", catalog_offset).as_bytes())?;

        // Write trailer
        writer.write_all(b"trailer\n")?;
        writer.write_all(b"<<\n")?;
        writer.write_all(format!("/Size {}\n", catalog_obj_num + 1).as_bytes())?;
        writer.write_all(format!("/Root {} 0 R\n", catalog_obj_num).as_bytes())?;
        writer.write_all(b">>\n")?;
        writer.write_all(b"startxref\n")?;
        writer.write_all(format!("{}\n", xref_offset).as_bytes())?;
        writer.write_all(b"%%EOF\n")?;

        writer.flush()?;
        Ok(())
    }

    /// Write an indirect object
    fn write_indirect_object<W: Write>(&self, writer: &mut W, obj_num: usize, generation: usize, obj: &Object) -> Result<()> {
        writer.write_all(format!("{} {} obj\n", obj_num, generation).as_bytes())?;
        self.write_object(writer, obj)?;
        writer.write_all(b"\nendobj\n")?;
        Ok(())
    }

    /// Write a PDF object
    fn write_object<W: Write>(&self, writer: &mut W, obj: &Object) -> Result<()> {
        match obj {
            Object::Null => writer.write_all(b"null")?,
            Object::Bool(b) => writer.write_all(if *b { b"true" } else { b"false" })?,
            Object::Int(i) => writer.write_all(i.to_string().as_bytes())?,
            Object::Real(r) => {
                let s = format!("{:.6}", r).trim_end_matches('0').trim_end_matches('.').to_string();
                writer.write_all(s.as_bytes())?;
            }
            Object::String(s) => {
                writer.write_all(b"(")?;
                for &byte in s.as_bytes() {
                    match byte {
                        b'(' | b')' | b'\\' => {
                            writer.write_all(b"\\")?;
                            writer.write_all(&[byte])?;
                        }
                        b'\n' => writer.write_all(b"\\n")?,
                        b'\r' => writer.write_all(b"\\r")?,
                        b'\t' => writer.write_all(b"\\t")?,
                        _ if (32..=126).contains(&byte) => writer.write_all(&[byte])?,
                        _ => writer.write_all(format!("\\{:03o}", byte).as_bytes())?,
                    }
                }
                writer.write_all(b")")?;
            }
            Object::Name(n) => writer.write_all(format!("/{}", n.0).as_bytes())?,
            Object::Array(arr) => {
                writer.write_all(b"[")?;
                for (i, item) in arr.iter().enumerate() {
                    if i > 0 {
                        writer.write_all(b" ")?;
                    }
                    self.write_object(writer, item)?;
                }
                writer.write_all(b"]")?;
            }
            Object::Dict(dict) => {
                writer.write_all(b"<<\n")?;
                for (key, value) in dict.iter() {
                    writer.write_all(format!("/{} ", key.0).as_bytes())?;
                    self.write_object(writer, value)?;
                    writer.write_all(b"\n")?;
                }
                writer.write_all(b">>")?;
            }
            Object::Stream { dict, data } => {
                writer.write_all(b"<<\n")?;
                for (key, value) in dict.iter() {
                    writer.write_all(format!("/{} ", key.0).as_bytes())?;
                    self.write_object(writer, value)?;
                    writer.write_all(b"\n")?;
                }
                writer.write_all(b">>\nstream\n")?;
                writer.write_all(data)?;
                writer.write_all(b"\nendstream")?;
            }
            Object::Ref(r) => writer.write_all(format!("{} {} R", r.num, r.generation).as_bytes())?,
        }
        Ok(())
    }
}

impl Default for PdfWriter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::NamedTempFile;

    #[test]
    fn test_writer_new() {
        let writer = PdfWriter::new();
        assert_eq!(writer.page_count(), 0);
        assert_eq!(writer.next_obj_num, 1);
    }

    #[test]
    fn test_add_blank_page() {
        let mut writer = PdfWriter::new();
        assert!(writer.add_blank_page(612.0, 792.0).is_ok());
        assert_eq!(writer.page_count(), 1);
    }

    #[test]
    fn test_add_blank_page_invalid_dimensions() {
        let mut writer = PdfWriter::new();
        assert!(writer.add_blank_page(0.0, 792.0).is_err());
        assert!(writer.add_blank_page(612.0, 0.0).is_err());
        assert!(writer.add_blank_page(-100.0, 792.0).is_err());
    }

    #[test]
    fn test_add_blank_page_too_large() {
        let mut writer = PdfWriter::new();
        assert!(writer.add_blank_page(20000.0, 792.0).is_err());
    }

    #[test]
    fn test_add_multiple_pages() {
        let mut writer = PdfWriter::new();
        writer.add_blank_page(612.0, 792.0).unwrap();
        writer.add_blank_page(612.0, 792.0).unwrap();
        writer.add_blank_page(612.0, 792.0).unwrap();
        assert_eq!(writer.page_count(), 3);
    }

    #[test]
    fn test_add_page_with_content() {
        let mut writer = PdfWriter::new();
        let content = "BT /F1 12 Tf 100 700 Td (Hello World) Tj ET";
        assert!(writer.add_page_with_content(612.0, 792.0, content).is_ok());
        assert_eq!(writer.page_count(), 1);
    }

    #[test]
    fn test_save_no_pages() {
        let writer = PdfWriter::new();
        let temp = NamedTempFile::new().unwrap();
        let result = writer.save(temp.path().to_str().unwrap());
        assert!(result.is_err());
    }

    #[test]
    fn test_save_with_pages() -> Result<()> {
        let mut writer = PdfWriter::new();
        writer.add_blank_page(612.0, 792.0)?;

        let temp = NamedTempFile::new()
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;
        writer.save(temp.path().to_str().unwrap())?;

        // Verify file was created and starts with %PDF
        let data = std::fs::read(temp.path())?;
        assert!(data.starts_with(b"%PDF-1.4"));
        assert!(data.ends_with(b"%%EOF\n"));

        Ok(())
    }

    #[test]
    fn test_save_multiple_pages() -> Result<()> {
        let mut writer = PdfWriter::new();
        writer.add_blank_page(612.0, 792.0)?;
        writer.add_blank_page(612.0, 792.0)?;
        writer.add_blank_page(612.0, 792.0)?;

        let temp = NamedTempFile::new()
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;
        writer.save(temp.path().to_str().unwrap())?;

        let data = std::fs::read(temp.path())?;
        assert!(data.starts_with(b"%PDF-1.4"));

        // Check that xref and trailer are present
        let content = String::from_utf8_lossy(&data);
        assert!(content.contains("xref"));
        assert!(content.contains("trailer"));
        assert!(content.contains("/Type /Catalog"));
        assert!(content.contains("/Type /Pages"));
        assert!(content.contains("/Count 3"));

        Ok(())
    }

    #[test]
    fn test_save_with_content() -> Result<()> {
        let mut writer = PdfWriter::new();
        let content = "BT /F1 12 Tf 100 700 Td (Test) Tj ET";
        writer.add_page_with_content(612.0, 792.0, content)?;

        let temp = NamedTempFile::new()
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;
        writer.save(temp.path().to_str().unwrap())?;

        let data = std::fs::read(temp.path())?;
        let content_str = String::from_utf8_lossy(&data);
        assert!(content_str.contains("Test"));

        Ok(())
    }
}
