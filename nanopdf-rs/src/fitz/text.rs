//! Text spans and pages
use crate::fitz::geometry::Quad;

pub struct TextSpan { chars: Vec<TextChar> }
pub struct TextChar { pub c: char, pub quad: Quad }

impl TextSpan {
    pub fn new() -> Self { Self { chars: Vec::new() } }
    pub fn add_char(&mut self, c: char, quad: Quad) { self.chars.push(TextChar { c, quad }); }
    pub fn text(&self) -> String { self.chars.iter().map(|c| c.c).collect() }
}
impl Default for TextSpan { fn default() -> Self { Self::new() } }

pub struct TextPage { spans: Vec<TextSpan> }
impl TextPage {
    pub fn new() -> Self { Self { spans: Vec::new() } }
    pub fn add_span(&mut self, span: TextSpan) { self.spans.push(span); }
}
impl Default for TextPage { fn default() -> Self { Self::new() } }

