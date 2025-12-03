//! Vector paths
use crate::fitz::geometry::{Point, Rect};

pub struct Path { elements: Vec<PathElement> }
pub enum PathElement { MoveTo(Point), LineTo(Point), CurveTo(Point, Point, Point), Close }

impl Path {
    pub fn new() -> Self { Self { elements: Vec::new() } }
    pub fn move_to(&mut self, p: Point) { self.elements.push(PathElement::MoveTo(p)); }
    pub fn line_to(&mut self, p: Point) { self.elements.push(PathElement::LineTo(p)); }
    pub fn curve_to(&mut self, p1: Point, p2: Point, p3: Point) {
        self.elements.push(PathElement::CurveTo(p1, p2, p3));
    }
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
    pub fn len(&self) -> usize { self.elements.len() }
    pub fn is_empty(&self) -> bool { self.elements.is_empty() }
}
impl Default for Path { fn default() -> Self { Self::new() } }

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_path_new() {
        let path = Path::new();
        assert!(path.is_empty());
        assert_eq!(path.len(), 0);
    }

    #[test]
    fn test_path_default() {
        let path: Path = Default::default();
        assert!(path.is_empty());
    }

    #[test]
    fn test_path_move_to() {
        let mut path = Path::new();
        path.move_to(Point::new(10.0, 20.0));
        assert_eq!(path.len(), 1);
        assert!(!path.is_empty());
    }

    #[test]
    fn test_path_line_to() {
        let mut path = Path::new();
        path.move_to(Point::new(0.0, 0.0));
        path.line_to(Point::new(10.0, 10.0));
        assert_eq!(path.len(), 2);
    }

    #[test]
    fn test_path_curve_to() {
        let mut path = Path::new();
        path.move_to(Point::new(0.0, 0.0));
        path.curve_to(
            Point::new(5.0, 10.0),
            Point::new(15.0, 10.0),
            Point::new(20.0, 0.0),
        );
        assert_eq!(path.len(), 2);
    }

    #[test]
    fn test_path_close() {
        let mut path = Path::new();
        path.move_to(Point::new(0.0, 0.0));
        path.line_to(Point::new(10.0, 0.0));
        path.line_to(Point::new(10.0, 10.0));
        path.close();
        assert_eq!(path.len(), 4);
    }

    #[test]
    fn test_path_bounds_simple() {
        let mut path = Path::new();
        path.move_to(Point::new(0.0, 0.0));
        path.line_to(Point::new(100.0, 50.0));
        
        let bounds = path.bounds();
        assert_eq!(bounds.x0, 0.0);
        assert_eq!(bounds.y0, 0.0);
        assert_eq!(bounds.x1, 100.0);
        assert_eq!(bounds.y1, 50.0);
    }

    #[test]
    fn test_path_bounds_with_curve() {
        let mut path = Path::new();
        path.move_to(Point::new(0.0, 0.0));
        path.curve_to(
            Point::new(50.0, 100.0),
            Point::new(100.0, 100.0),
            Point::new(150.0, 0.0),
        );
        
        let bounds = path.bounds();
        assert_eq!(bounds.x0, 0.0);
        assert_eq!(bounds.y0, 0.0);
        assert_eq!(bounds.x1, 150.0);
        assert_eq!(bounds.y1, 100.0);
    }

    #[test]
    fn test_path_bounds_empty() {
        let path = Path::new();
        let bounds = path.bounds();
        assert!(bounds.is_empty());
    }

    #[test]
    fn test_path_bounds_with_close() {
        let mut path = Path::new();
        path.move_to(Point::new(0.0, 0.0));
        path.line_to(Point::new(10.0, 10.0));
        path.close();
        
        let bounds = path.bounds();
        assert_eq!(bounds.x0, 0.0);
        assert_eq!(bounds.y0, 0.0);
        assert_eq!(bounds.x1, 10.0);
        assert_eq!(bounds.y1, 10.0);
    }

    #[test]
    fn test_path_rectangle() {
        let mut path = Path::new();
        path.move_to(Point::new(0.0, 0.0));
        path.line_to(Point::new(100.0, 0.0));
        path.line_to(Point::new(100.0, 50.0));
        path.line_to(Point::new(0.0, 50.0));
        path.close();
        
        let bounds = path.bounds();
        assert_eq!(bounds.width(), 100.0);
        assert_eq!(bounds.height(), 50.0);
    }
}

