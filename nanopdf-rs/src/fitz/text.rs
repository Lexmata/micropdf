//! Text spans and pages
use crate::fitz::geometry::Quad;

pub struct TextSpan { chars: Vec<TextChar> }
pub struct TextChar { pub c: char, pub quad: Quad }

impl TextSpan {
    pub fn new() -> Self { Self { chars: Vec::new() } }
    pub fn add_char(&mut self, c: char, quad: Quad) { self.chars.push(TextChar { c, quad }); }
    pub fn text(&self) -> String { self.chars.iter().map(|c| c.c).collect() }
    pub fn len(&self) -> usize { self.chars.len() }
    pub fn is_empty(&self) -> bool { self.chars.is_empty() }
}
impl Default for TextSpan { fn default() -> Self { Self::new() } }

pub struct TextPage { spans: Vec<TextSpan> }
impl TextPage {
    pub fn new() -> Self { Self { spans: Vec::new() } }
    pub fn add_span(&mut self, span: TextSpan) { self.spans.push(span); }
    pub fn spans(&self) -> &[TextSpan] { &self.spans }
    pub fn len(&self) -> usize { self.spans.len() }
    pub fn is_empty(&self) -> bool { self.spans.is_empty() }
}
impl Default for TextPage { fn default() -> Self { Self::new() } }

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fitz::geometry::{Point, Rect};

    fn make_quad(x: f32, y: f32, w: f32, h: f32) -> Quad {
        Quad::from_rect(&Rect::new(x, y, x + w, y + h))
    }

    #[test]
    fn test_text_span_new() {
        let span = TextSpan::new();
        assert!(span.is_empty());
        assert_eq!(span.len(), 0);
        assert_eq!(span.text(), "");
    }

    #[test]
    fn test_text_span_default() {
        let span: TextSpan = Default::default();
        assert!(span.is_empty());
    }

    #[test]
    fn test_text_span_add_char() {
        let mut span = TextSpan::new();
        span.add_char('H', make_quad(0.0, 0.0, 10.0, 12.0));
        span.add_char('i', make_quad(10.0, 0.0, 5.0, 12.0));
        
        assert_eq!(span.len(), 2);
        assert!(!span.is_empty());
        assert_eq!(span.text(), "Hi");
    }

    #[test]
    fn test_text_span_unicode() {
        let mut span = TextSpan::new();
        span.add_char('日', make_quad(0.0, 0.0, 12.0, 12.0));
        span.add_char('本', make_quad(12.0, 0.0, 12.0, 12.0));
        span.add_char('語', make_quad(24.0, 0.0, 12.0, 12.0));
        
        assert_eq!(span.text(), "日本語");
    }

    #[test]
    fn test_text_page_new() {
        let page = TextPage::new();
        assert!(page.is_empty());
        assert_eq!(page.len(), 0);
    }

    #[test]
    fn test_text_page_default() {
        let page: TextPage = Default::default();
        assert!(page.is_empty());
    }

    #[test]
    fn test_text_page_add_span() {
        let mut page = TextPage::new();
        
        let mut span1 = TextSpan::new();
        span1.add_char('A', make_quad(0.0, 0.0, 10.0, 12.0));
        page.add_span(span1);
        
        let mut span2 = TextSpan::new();
        span2.add_char('B', make_quad(0.0, 12.0, 10.0, 12.0));
        page.add_span(span2);
        
        assert_eq!(page.len(), 2);
        assert!(!page.is_empty());
    }

    #[test]
    fn test_text_page_spans() {
        let mut page = TextPage::new();
        
        let mut span = TextSpan::new();
        span.add_char('X', make_quad(0.0, 0.0, 10.0, 12.0));
        page.add_span(span);
        
        let spans = page.spans();
        assert_eq!(spans.len(), 1);
        assert_eq!(spans[0].text(), "X");
    }

    #[test]
    fn test_text_char_fields() {
        let quad = make_quad(5.0, 10.0, 8.0, 12.0);
        let tc = TextChar { c: 'Z', quad };
        
        assert_eq!(tc.c, 'Z');
        assert_eq!(tc.quad.ul.x, 5.0);
        assert_eq!(tc.quad.ul.y, 10.0);
    }
}

