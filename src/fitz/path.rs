//! Vector paths
use crate::fitz::geometry::{Point, Rect};

pub struct Path { elements: Vec<PathElement> }
pub enum PathElement { MoveTo(Point), LineTo(Point), CurveTo(Point, Point, Point), Close }

impl Path {
    pub fn new() -> Self { Self { elements: Vec::new() } }
    pub fn move_to(&mut self, p: Point) { self.elements.push(PathElement::MoveTo(p)); }
    pub fn line_to(&mut self, p: Point) { self.elements.push(PathElement::LineTo(p)); }
    pub fn close(&mut self) { self.elements.push(PathElement::Close); }
    pub fn bounds(&self) -> Rect {
        let mut bbox = Rect::EMPTY;
        for el in &self.elements {
            match el {
                PathElement::MoveTo(p) | PathElement::LineTo(p) => bbox.include_point(*p),
                PathElement::CurveTo(p1, p2, p3) => {
                    bbox.include_point(*p1); bbox.include_point(*p2); bbox.include_point(*p3);
                }
                PathElement::Close => {}
            }
        }
        bbox
    }
}
impl Default for Path { fn default() -> Self { Self::new() } }

