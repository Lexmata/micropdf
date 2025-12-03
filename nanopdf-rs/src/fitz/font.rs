//! Font handling
pub struct Font { name: String }
impl Font {
    pub fn new(name: &str) -> Self { Self { name: name.to_string() } }
    pub fn name(&self) -> &str { &self.name }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_font_new() {
        let font = Font::new("Helvetica");
        assert_eq!(font.name(), "Helvetica");
    }

    #[test]
    fn test_font_empty_name() {
        let font = Font::new("");
        assert_eq!(font.name(), "");
    }

    #[test]
    fn test_font_unicode_name() {
        let font = Font::new("Arial日本語");
        assert_eq!(font.name(), "Arial日本語");
    }
}

