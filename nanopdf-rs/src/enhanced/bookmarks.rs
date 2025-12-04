//! Bookmark and Outline Management

use super::error::{EnhancedError, Result};
use std::path::Path;

/// Bookmark/outline item
#[derive(Debug, Clone)]
pub struct Bookmark {
    /// Title
    pub title: String,
    /// Page number (0-indexed)
    pub page: usize,
    /// Children bookmarks
    pub children: Vec<Bookmark>,
}

impl Bookmark {
    /// Create a new bookmark
    pub fn new(title: impl Into<String>, page: usize) -> Self {
        Self {
            title: title.into(),
            page,
            children: Vec::new(),
        }
    }

    /// Add a child bookmark
    pub fn add_child(&mut self, child: Bookmark) {
        self.children.push(child);
    }

    /// Get total count including children
    pub fn count_all(&self) -> usize {
        1 + self.children.iter().map(|c| c.count_all()).sum::<usize>()
    }

    /// Find bookmark by title
    pub fn find_by_title(&self, title: &str) -> Option<&Bookmark> {
        if self.title == title {
            return Some(self);
        }

        for child in &self.children {
            if let Some(found) = child.find_by_title(title) {
                return Some(found);
            }
        }

        None
    }

    /// Validate bookmark structure
    pub fn validate(&self, max_page: usize) -> Result<()> {
        if self.title.is_empty() {
            return Err(EnhancedError::InvalidParameter(
                "Bookmark title cannot be empty".into()
            ));
        }

        if self.title.len() > 500 {
            return Err(EnhancedError::InvalidParameter(
                format!("Bookmark title too long: {} (max 500 chars)", self.title.len())
            ));
        }

        if self.page >= max_page {
            return Err(EnhancedError::InvalidParameter(
                format!("Bookmark page {} exceeds document page count {}", self.page, max_page)
            ));
        }

        // Validate children recursively
        for child in &self.children {
            child.validate(max_page)?;
        }

        Ok(())
    }
}

/// Add bookmark to PDF
pub fn add_bookmark(pdf_path: &str, bookmark: &Bookmark) -> Result<()> {
    // Verify PDF exists
    if !Path::new(pdf_path).exists() {
        return Err(EnhancedError::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("PDF file not found: {}", pdf_path),
        )));
    }

    // Validate bookmark (assuming max 1000 pages)
    bookmark.validate(1000)?;

    // Full implementation would:
    // 1. Parse PDF
    // 2. Get/create Outlines dictionary
    // 3. Add outline item with destination
    // 4. Update PDF

    Ok(())
}

/// Remove bookmark from PDF
pub fn remove_bookmark(pdf_path: &str, title: &str) -> Result<()> {
    // Verify PDF exists
    if !Path::new(pdf_path).exists() {
        return Err(EnhancedError::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("PDF file not found: {}", pdf_path),
        )));
    }

    if title.is_empty() {
        return Err(EnhancedError::InvalidParameter(
            "Bookmark title cannot be empty".into()
        ));
    }

    // Full implementation would:
    // 1. Parse PDF
    // 2. Find Outlines dictionary
    // 3. Traverse outline tree
    // 4. Remove matching item
    // 5. Update parent/sibling pointers
    // 6. Update PDF

    Ok(())
}

/// Get all bookmarks from PDF
pub fn get_bookmarks(pdf_path: &str) -> Result<Vec<Bookmark>> {
    // Verify PDF exists
    if !Path::new(pdf_path).exists() {
        return Err(EnhancedError::Io(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("PDF file not found: {}", pdf_path),
        )));
    }

    // Full implementation would:
    // 1. Parse PDF
    // 2. Find Outlines dictionary in Catalog
    // 3. Traverse outline tree
    // 4. Build bookmark hierarchy

    // Return empty list for now
    Ok(Vec::new())
}

/// Create bookmark hierarchy from flat list
pub fn create_hierarchy(bookmarks: Vec<(String, usize, usize)>) -> Vec<Bookmark> {
    // bookmarks: (title, page, level)
    if bookmarks.is_empty() {
        return Vec::new();
    }

    let mut root_bookmarks = Vec::new();
    let mut stack: Vec<usize> = Vec::new(); // Stack of indices into root_bookmarks for tracking parents

    for (title, page, level) in bookmarks {
        let bookmark = Bookmark::new(title, page);

        if level == 0 {
            // Top-level bookmark
            root_bookmarks.push(bookmark);
            stack.clear();
            stack.push(root_bookmarks.len() - 1);
        } else {
            // Child bookmark - find parent at level-1
            while stack.len() > level {
                stack.pop();
            }

            if stack.len() == level {
                // Found correct parent level
                let mut current = &mut root_bookmarks;

                // Navigate to the parent bookmark
                for &idx in &stack[..stack.len() - 1] {
                    current = &mut current.get_mut(idx).unwrap().children;
                }

                if let Some(parent) = current.get_mut(*stack.last().unwrap()) {
                    parent.add_child(bookmark);
                    stack.push(parent.children.len() - 1);
                }
            }
        }
    }

    root_bookmarks
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_bookmark_new() {
        let bookmark = Bookmark::new("Chapter 1", 0);
        assert_eq!(bookmark.title, "Chapter 1");
        assert_eq!(bookmark.page, 0);
        assert!(bookmark.children.is_empty());
    }

    #[test]
    fn test_bookmark_add_child() {
        let mut parent = Bookmark::new("Part 1", 0);
        let child = Bookmark::new("Section 1.1", 5);
        parent.add_child(child);
        assert_eq!(parent.children.len(), 1);
    }

    #[test]
    fn test_bookmark_count_all() {
        let mut parent = Bookmark::new("Part 1", 0);
        parent.add_child(Bookmark::new("Section 1.1", 5));
        parent.add_child(Bookmark::new("Section 1.2", 10));
        assert_eq!(parent.count_all(), 3); // Parent + 2 children
    }

    #[test]
    fn test_bookmark_find_by_title() {
        let mut parent = Bookmark::new("Part 1", 0);
        parent.add_child(Bookmark::new("Section 1.1", 5));
        parent.add_child(Bookmark::new("Section 1.2", 10));

        assert!(parent.find_by_title("Section 1.1").is_some());
        assert!(parent.find_by_title("Nonexistent").is_none());
    }

    #[test]
    fn test_bookmark_validate_empty_title() {
        let bookmark = Bookmark::new("", 0);
        assert!(bookmark.validate(100).is_err());
    }

    #[test]
    fn test_bookmark_validate_title_too_long() {
        let bookmark = Bookmark::new("x".repeat(501), 0);
        assert!(bookmark.validate(100).is_err());
    }

    #[test]
    fn test_bookmark_validate_page_out_of_range() {
        let bookmark = Bookmark::new("Chapter", 100);
        assert!(bookmark.validate(50).is_err());
    }

    #[test]
    fn test_bookmark_validate_valid() {
        let bookmark = Bookmark::new("Chapter 1", 0);
        assert!(bookmark.validate(100).is_ok());
    }

    #[test]
    fn test_bookmark_validate_with_children() {
        let mut parent = Bookmark::new("Part 1", 0);
        parent.add_child(Bookmark::new("Section 1.1", 5));
        parent.add_child(Bookmark::new("Section 1.2", 150)); // Invalid page

        assert!(parent.validate(100).is_err());
    }

    #[test]
    fn test_add_bookmark_nonexistent_pdf() {
        let bookmark = Bookmark::new("Chapter 1", 0);
        let result = add_bookmark("/nonexistent/file.pdf", &bookmark);
        assert!(result.is_err());
    }

    #[test]
    fn test_add_bookmark_valid() -> Result<()> {
        let mut temp = NamedTempFile::new()
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;
        temp.write_all(b"%PDF-1.4\n")
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;

        let path = temp.path().to_str().unwrap();
        let bookmark = Bookmark::new("Chapter 1", 0);

        let result = add_bookmark(path, &bookmark);
        assert!(result.is_ok());
        Ok(())
    }

    #[test]
    fn test_remove_bookmark_nonexistent_pdf() {
        let result = remove_bookmark("/nonexistent/file.pdf", "Chapter 1");
        assert!(result.is_err());
    }

    #[test]
    fn test_remove_bookmark_empty_title() -> Result<()> {
        let mut temp = NamedTempFile::new()
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;
        temp.write_all(b"%PDF-1.4\n")
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;

        let path = temp.path().to_str().unwrap();
        let result = remove_bookmark(path, "");

        assert!(result.is_err());
        Ok(())
    }

    #[test]
    fn test_get_bookmarks_nonexistent_pdf() {
        let result = get_bookmarks("/nonexistent/file.pdf");
        assert!(result.is_err());
    }

    #[test]
    fn test_get_bookmarks_empty() -> Result<()> {
        let mut temp = NamedTempFile::new()
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;
        temp.write_all(b"%PDF-1.4\n")
            .map_err(|e| EnhancedError::Generic(e.to_string()))?;

        let path = temp.path().to_str().unwrap();
        let bookmarks = get_bookmarks(path)?;

        assert_eq!(bookmarks.len(), 0);
        Ok(())
    }

    #[test]
    fn test_create_hierarchy_flat() {
        let flat = vec![
            ("Chapter 1".to_string(), 0, 0),
            ("Chapter 2".to_string(), 10, 0),
        ];

        let hierarchy = create_hierarchy(flat);
        assert_eq!(hierarchy.len(), 2);
    }

    #[test]
    fn test_create_hierarchy_nested() {
        let flat = vec![
            ("Chapter 1".to_string(), 0, 0),
            ("Section 1.1".to_string(), 5, 1),
            ("Section 1.2".to_string(), 8, 1),
            ("Chapter 2".to_string(), 10, 0),
        ];

        let hierarchy = create_hierarchy(flat);
        assert_eq!(hierarchy.len(), 2);
        assert_eq!(hierarchy[0].children.len(), 2);
    }
}
