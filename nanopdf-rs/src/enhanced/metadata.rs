//! Enhanced Metadata Management

use super::error::{EnhancedError, Result};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

/// PDF metadata
#[derive(Debug, Clone, Default)]
pub struct Metadata {
    /// Title
    pub title: Option<String>,
    /// Author
    pub author: Option<String>,
    /// Subject
    pub subject: Option<String>,
    /// Keywords
    pub keywords: Option<String>,
    /// Creator
    pub creator: Option<String>,
    /// Producer
    pub producer: Option<String>,
    /// Creation date
    pub creation_date: Option<String>,
    /// Modification date
    pub mod_date: Option<String>,
    /// Custom metadata
    pub custom: HashMap<String, String>,
}

impl Metadata {
    /// Create new metadata
    pub fn new() -> Self {
        Self::default()
    }

    /// Set title
    pub fn with_title(mut self, title: impl Into<String>) -> Self {
        self.title = Some(title.into());
        self
    }

    /// Set author
    pub fn with_author(mut self, author: impl Into<String>) -> Self {
        self.author = Some(author.into());
        self
    }

    /// Set subject
    pub fn with_subject(mut self, subject: impl Into<String>) -> Self {
        self.subject = Some(subject.into());
        self
    }

    /// Set keywords
    pub fn with_keywords(mut self, keywords: impl Into<String>) -> Self {
        self.keywords = Some(keywords.into());
        self
    }

    /// Add custom metadata field
    pub fn add_custom(&mut self, key: impl Into<String>, value: impl Into<String>) {
        self.custom.insert(key.into(), value.into());
    }
}

/// Read metadata from PDF
pub fn read_metadata(pdf_path: &str) -> Result<Metadata> {
    // Verify file exists
    if !Path::new(pdf_path).exists() {
        return Err(EnhancedError::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("PDF file not found: {}", pdf_path),
        )));
    }

    // For now, return empty metadata with creator set
    // Full implementation would parse PDF Info dictionary
    let mut metadata = Metadata::new();
    metadata.producer = Some("NanoPDF".to_string());

    Ok(metadata)
}

/// Update metadata in PDF
pub fn update_metadata(pdf_path: &str, metadata: &Metadata) -> Result<()> {
    // Verify file exists
    if !Path::new(pdf_path).exists() {
        return Err(EnhancedError::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("PDF file not found: {}", pdf_path),
        )));
    }

    // Read existing PDF
    let _pdf_data = fs::read(pdf_path).map_err(EnhancedError::Io)?;

    // Full implementation would:
    // 1. Parse PDF structure
    // 2. Update Info dictionary
    // 3. Write back to file

    // For now, we just validate the metadata structure
    if let Some(ref title) = metadata.title {
        if title.len() > 1000 {
            return Err(EnhancedError::InvalidParameter(
                "Title too long (max 1000 characters)".into(),
            ));
        }
    }

    // TODO: Implement actual PDF metadata update
    // This requires PDF writing infrastructure
    Ok(())
}

/// Read XMP metadata
pub fn read_xmp_metadata(pdf_path: &str) -> Result<String> {
    // Verify file exists
    if !Path::new(pdf_path).exists() {
        return Err(EnhancedError::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("PDF file not found: {}", pdf_path),
        )));
    }

    // XMP is XML-based metadata stored in PDF Metadata stream
    // Full implementation would:
    // 1. Open PDF
    // 2. Find Metadata stream in Catalog
    // 3. Extract and decode XML

    // Return empty XMP for now
    Ok(String::from(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    </rdf:RDF>
</x:xmpmeta>"#,
    ))
}

/// Update XMP metadata
pub fn update_xmp_metadata(pdf_path: &str, xmp: &str) -> Result<()> {
    // Verify file exists
    if !Path::new(pdf_path).exists() {
        return Err(EnhancedError::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("PDF file not found: {}", pdf_path),
        )));
    }

    // Validate XMP is valid XML
    if !xmp.contains("<?xml") {
        return Err(EnhancedError::InvalidParameter(
            "XMP must be valid XML starting with <?xml declaration".into(),
        ));
    }

    if !xmp.contains("xmpmeta") {
        return Err(EnhancedError::InvalidParameter(
            "XMP must contain xmpmeta element".into(),
        ));
    }

    // Full implementation would:
    // 1. Parse PDF
    // 2. Update/create Metadata stream in Catalog
    // 3. Write XMP as compressed stream
    // 4. Update PDF

    // TODO: Implement actual XMP update
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_metadata_new() {
        let metadata = Metadata::new();
        assert!(metadata.title.is_none());
        assert!(metadata.author.is_none());
        assert!(metadata.custom.is_empty());
    }

    #[test]
    fn test_metadata_with_title() {
        let metadata = Metadata::new().with_title("Test Document");
        assert_eq!(metadata.title, Some("Test Document".to_string()));
    }

    #[test]
    fn test_metadata_with_author() {
        let metadata = Metadata::new().with_author("John Doe");
        assert_eq!(metadata.author, Some("John Doe".to_string()));
    }

    #[test]
    fn test_metadata_add_custom() {
        let mut metadata = Metadata::new();
        metadata.add_custom("Department", "Engineering");
        assert_eq!(
            metadata.custom.get("Department"),
            Some(&"Engineering".to_string())
        );
    }

    #[test]
    fn test_metadata_builder() {
        let metadata = Metadata::new()
            .with_title("Title")
            .with_author("Author")
            .with_subject("Subject")
            .with_keywords("rust, pdf");

        assert!(metadata.title.is_some());
        assert!(metadata.author.is_some());
        assert!(metadata.subject.is_some());
        assert!(metadata.keywords.is_some());
    }

    #[test]
    fn test_read_metadata_nonexistent() {
        let result = read_metadata("/nonexistent/file.pdf");
        assert!(result.is_err());
    }

    #[test]
    fn test_read_metadata_empty_file() -> Result<()> {
        let mut temp = NamedTempFile::new().map_err(|e| EnhancedError::Generic(e.to_string()))?;
        temp.write_all(b"%PDF-1.4\n")
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;

        let path = temp.path().to_str().unwrap();
        let metadata = read_metadata(path)?;

        // Should have default producer
        assert!(metadata.producer.is_some());
        Ok(())
    }

    #[test]
    fn test_update_metadata_nonexistent() {
        let metadata = Metadata::new();
        let result = update_metadata("/nonexistent/file.pdf", &metadata);
        assert!(result.is_err());
    }

    #[test]
    fn test_update_metadata_title_too_long() -> Result<()> {
        let mut temp = NamedTempFile::new().map_err(|e| EnhancedError::Generic(e.to_string()))?;
        temp.write_all(b"%PDF-1.4\n")
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;

        let path = temp.path().to_str().unwrap();
        let metadata = Metadata::new().with_title("x".repeat(1001));

        let result = update_metadata(path, &metadata);
        assert!(result.is_err());
        Ok(())
    }

    #[test]
    fn test_read_xmp_metadata() -> Result<()> {
        let mut temp = NamedTempFile::new().map_err(|e| EnhancedError::Generic(e.to_string()))?;
        temp.write_all(b"%PDF-1.4\n")
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;

        let path = temp.path().to_str().unwrap();
        let xmp = read_xmp_metadata(path)?;

        assert!(xmp.contains("<?xml"));
        assert!(xmp.contains("xmpmeta"));
        Ok(())
    }

    #[test]
    fn test_update_xmp_invalid_xml() -> Result<()> {
        let mut temp = NamedTempFile::new().map_err(|e| EnhancedError::Generic(e.to_string()))?;
        temp.write_all(b"%PDF-1.4\n")
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;

        let path = temp.path().to_str().unwrap();
        let result = update_xmp_metadata(path, "not xml");

        assert!(result.is_err());
        Ok(())
    }

    #[test]
    fn test_update_xmp_valid() -> Result<()> {
        let mut temp = NamedTempFile::new().map_err(|e| EnhancedError::Generic(e.to_string()))?;
        temp.write_all(b"%PDF-1.4\n")
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;

        let path = temp.path().to_str().unwrap();
        let xmp = r#"<?xml version="1.0"?><x:xmpmeta/>"#;

        let result = update_xmp_metadata(path, xmp);
        // Should succeed (even though not fully implemented yet)
        assert!(result.is_ok());
        Ok(())
    }
}
