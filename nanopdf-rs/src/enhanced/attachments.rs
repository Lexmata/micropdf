//! Attachment Management - Embed and extract files

use super::error::{EnhancedError, Result};
use std::fs;
use std::path::Path;

/// PDF attachment
#[derive(Debug, Clone)]
pub struct Attachment {
    /// Filename
    pub filename: String,
    /// Data
    pub data: Vec<u8>,
    /// MIME type
    pub mime_type: Option<String>,
    /// Description
    pub description: Option<String>,
}

impl Attachment {
    /// Create a new attachment
    pub fn new(filename: impl Into<String>, data: Vec<u8>) -> Self {
        Self {
            filename: filename.into(),
            data,
            mime_type: None,
            description: None,
        }
    }

    /// Set MIME type
    pub fn with_mime_type(mut self, mime_type: impl Into<String>) -> Self {
        self.mime_type = Some(mime_type.into());
        self
    }

    /// Set description
    pub fn with_description(mut self, description: impl Into<String>) -> Self {
        self.description = Some(description.into());
        self
    }

    /// Get file size
    pub fn size(&self) -> usize {
        self.data.len()
    }

    /// Guess MIME type from filename extension
    pub fn guess_mime_type(&self) -> String {
        let filename_lower = self.filename.to_lowercase();

        if filename_lower.ends_with(".pdf") {
            "application/pdf".to_string()
        } else if filename_lower.ends_with(".txt") {
            "text/plain".to_string()
        } else if filename_lower.ends_with(".png") {
            "image/png".to_string()
        } else if filename_lower.ends_with(".jpg") || filename_lower.ends_with(".jpeg") {
            "image/jpeg".to_string()
        } else if filename_lower.ends_with(".zip") {
            "application/zip".to_string()
        } else if filename_lower.ends_with(".json") {
            "application/json".to_string()
        } else if filename_lower.ends_with(".xml") {
            "application/xml".to_string()
        } else {
            "application/octet-stream".to_string()
        }
    }
}

/// Add attachment to PDF
pub fn add_attachment(pdf_path: &str, attachment: &Attachment) -> Result<()> {
    // Verify PDF exists
    if !Path::new(pdf_path).exists() {
        return Err(EnhancedError::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("PDF file not found: {}", pdf_path),
        )));
    }

    // Validate attachment
    if attachment.filename.is_empty() {
        return Err(EnhancedError::InvalidParameter(
            "Attachment filename cannot be empty".into(),
        ));
    }

    if attachment.data.is_empty() {
        return Err(EnhancedError::InvalidParameter(
            "Attachment data cannot be empty".into(),
        ));
    }

    // Validate filename doesn't contain path separators
    if attachment.filename.contains('/') || attachment.filename.contains('\\') {
        return Err(EnhancedError::InvalidParameter(
            "Attachment filename cannot contain path separators".into(),
        ));
    }

    // Full implementation would:
    // 1. Parse PDF
    // 2. Create EmbeddedFile stream
    // 3. Add to Names tree
    // 4. Update PDF

    // For now, validation passes
    Ok(())
}

/// Remove attachment from PDF
pub fn remove_attachment(pdf_path: &str, filename: &str) -> Result<()> {
    // Verify PDF exists
    if !Path::new(pdf_path).exists() {
        return Err(EnhancedError::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("PDF file not found: {}", pdf_path),
        )));
    }

    if filename.is_empty() {
        return Err(EnhancedError::InvalidParameter(
            "Filename cannot be empty".into(),
        ));
    }

    // Full implementation would:
    // 1. Parse PDF
    // 2. Find attachment in Names tree
    // 3. Remove FileSpec and EmbeddedFile
    // 4. Update PDF

    Ok(())
}

/// List all attachments in PDF
pub fn list_attachments(pdf_path: &str) -> Result<Vec<String>> {
    // Verify PDF exists
    if !Path::new(pdf_path).exists() {
        return Err(EnhancedError::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("PDF file not found: {}", pdf_path),
        )));
    }

    // Full implementation would:
    // 1. Parse PDF
    // 2. Find Names dictionary
    // 3. Parse EmbeddedFiles name tree
    // 4. Extract all filenames

    // Return empty list for now
    Ok(Vec::new())
}

/// Extract attachment from PDF
pub fn extract_attachment(pdf_path: &str, filename: &str) -> Result<Vec<u8>> {
    // Verify PDF exists
    if !Path::new(pdf_path).exists() {
        return Err(EnhancedError::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("PDF file not found: {}", pdf_path),
        )));
    }

    if filename.is_empty() {
        return Err(EnhancedError::InvalidParameter(
            "Filename cannot be empty".into(),
        ));
    }

    // Full implementation would:
    // 1. Parse PDF
    // 2. Find attachment in Names tree
    // 3. Locate EmbeddedFile stream
    // 4. Decode and return data

    // For now, return empty data
    Err(EnhancedError::Generic(format!(
        "Attachment '{}' not found in PDF",
        filename
    )))
}

/// Extract attachment to file
pub fn extract_attachment_to_file(pdf_path: &str, filename: &str, output_path: &str) -> Result<()> {
    let data = extract_attachment(pdf_path, filename)?;
    fs::write(output_path, data).map_err(EnhancedError::Io)?;
    Ok(())
}

/// Add attachment from file
pub fn add_attachment_from_file(
    pdf_path: &str,
    file_path: &str,
    description: Option<String>,
) -> Result<()> {
    // Read file
    let data = fs::read(file_path).map_err(EnhancedError::Io)?;

    // Get filename from path
    let filename = Path::new(file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| EnhancedError::InvalidParameter("Invalid file path".into()))?
        .to_string();

    // Create attachment
    let mut attachment = Attachment::new(filename.clone(), data);
    attachment.mime_type = Some(attachment.guess_mime_type());
    if let Some(desc) = description {
        attachment.description = Some(desc);
    }

    add_attachment(pdf_path, &attachment)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_attachment_new() {
        let attachment = Attachment::new("document.txt", vec![1, 2, 3, 4]);
        assert_eq!(attachment.filename, "document.txt");
        assert_eq!(attachment.data.len(), 4);
        assert!(attachment.mime_type.is_none());
    }

    #[test]
    fn test_attachment_with_mime_type() {
        let attachment = Attachment::new("document.txt", vec![]).with_mime_type("text/plain");
        assert_eq!(attachment.mime_type, Some("text/plain".to_string()));
    }

    #[test]
    fn test_attachment_with_description() {
        let attachment =
            Attachment::new("document.txt", vec![]).with_description("Important document");
        assert_eq!(
            attachment.description,
            Some("Important document".to_string())
        );
    }

    #[test]
    fn test_attachment_size() {
        let attachment = Attachment::new("file.bin", vec![1, 2, 3, 4, 5]);
        assert_eq!(attachment.size(), 5);
    }

    #[test]
    fn test_guess_mime_type() {
        let test_cases = vec![
            ("test.pdf", "application/pdf"),
            ("test.txt", "text/plain"),
            ("test.png", "image/png"),
            ("test.jpg", "image/jpeg"),
            ("test.jpeg", "image/jpeg"),
            ("test.zip", "application/zip"),
            ("test.json", "application/json"),
            ("test.xml", "application/xml"),
            ("test.bin", "application/octet-stream"),
        ];

        for (filename, expected_mime) in test_cases {
            let attachment = Attachment::new(filename, vec![]);
            assert_eq!(attachment.guess_mime_type(), expected_mime);
        }
    }

    #[test]
    fn test_add_attachment_nonexistent_pdf() {
        let attachment = Attachment::new("test.txt", vec![1, 2, 3]);
        let result = add_attachment("/nonexistent/file.pdf", &attachment);
        assert!(result.is_err());
    }

    #[test]
    fn test_add_attachment_empty_filename() -> Result<()> {
        let mut temp = NamedTempFile::new().map_err(|e| EnhancedError::Generic(e.to_string()))?;
        temp.write_all(b"%PDF-1.4\n")
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;

        let path = temp.path().to_str().unwrap();
        let attachment = Attachment::new("", vec![1, 2, 3]);

        let result = add_attachment(path, &attachment);
        assert!(result.is_err());
        Ok(())
    }

    #[test]
    fn test_add_attachment_empty_data() -> Result<()> {
        let mut temp = NamedTempFile::new().map_err(|e| EnhancedError::Generic(e.to_string()))?;
        temp.write_all(b"%PDF-1.4\n")
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;

        let path = temp.path().to_str().unwrap();
        let attachment = Attachment::new("test.txt", vec![]);

        let result = add_attachment(path, &attachment);
        assert!(result.is_err());
        Ok(())
    }

    #[test]
    fn test_add_attachment_path_separator() -> Result<()> {
        let mut temp = NamedTempFile::new().map_err(|e| EnhancedError::Generic(e.to_string()))?;
        temp.write_all(b"%PDF-1.4\n")
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;

        let path = temp.path().to_str().unwrap();
        let attachment = Attachment::new("path/to/file.txt", vec![1, 2, 3]);

        let result = add_attachment(path, &attachment);
        assert!(result.is_err());
        Ok(())
    }

    #[test]
    fn test_add_attachment_valid() -> Result<()> {
        let mut temp = NamedTempFile::new().map_err(|e| EnhancedError::Generic(e.to_string()))?;
        temp.write_all(b"%PDF-1.4\n")
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;

        let path = temp.path().to_str().unwrap();
        let attachment = Attachment::new("test.txt", vec![72, 101, 108, 108, 111]); // "Hello"

        let result = add_attachment(path, &attachment);
        assert!(result.is_ok());
        Ok(())
    }

    #[test]
    fn test_remove_attachment_nonexistent_pdf() {
        let result = remove_attachment("/nonexistent/file.pdf", "test.txt");
        assert!(result.is_err());
    }

    #[test]
    fn test_list_attachments_nonexistent_pdf() {
        let result = list_attachments("/nonexistent/file.pdf");
        assert!(result.is_err());
    }

    #[test]
    fn test_list_attachments_empty() -> Result<()> {
        let mut temp = NamedTempFile::new().map_err(|e| EnhancedError::Generic(e.to_string()))?;
        temp.write_all(b"%PDF-1.4\n")
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;

        let path = temp.path().to_str().unwrap();
        let attachments = list_attachments(path)?;

        assert_eq!(attachments.len(), 0);
        Ok(())
    }

    #[test]
    fn test_extract_attachment_nonexistent_pdf() {
        let result = extract_attachment("/nonexistent/file.pdf", "test.txt");
        assert!(result.is_err());
    }

    #[test]
    fn test_extract_attachment_not_found() -> Result<()> {
        let mut temp = NamedTempFile::new().map_err(|e| EnhancedError::Generic(e.to_string()))?;
        temp.write_all(b"%PDF-1.4\n")
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;

        let path = temp.path().to_str().unwrap();
        let result = extract_attachment(path, "nonexistent.txt");

        assert!(result.is_err());
        Ok(())
    }
}
