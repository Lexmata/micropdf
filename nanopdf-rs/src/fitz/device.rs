//! Rendering device trait
use crate::fitz::geometry::{Matrix, Rect};
use crate::fitz::path::Path;
use crate::fitz::text::TextSpan;
use crate::fitz::image::Image;
use crate::fitz::colorspace::Colorspace;

pub trait Device {
    fn fill_path(&mut self, path: &Path, ctm: Matrix, colorspace: &Colorspace, color: &[f32], alpha: f32);
    fn stroke_path(&mut self, path: &Path, stroke: &StrokeState, ctm: Matrix, colorspace: &Colorspace, color: &[f32], alpha: f32);
    fn fill_text(&mut self, text: &TextSpan, ctm: Matrix, colorspace: &Colorspace, color: &[f32], alpha: f32);
    fn fill_image(&mut self, image: &Image, ctm: Matrix, alpha: f32);
}

pub struct StrokeState { pub linewidth: f32, pub linecap: u8, pub linejoin: u8 }
impl Default for StrokeState { fn default() -> Self { Self { linewidth: 1.0, linecap: 0, linejoin: 0 } } }

pub struct NullDevice;
impl Device for NullDevice {
    fn fill_path(&mut self, _: &Path, _: Matrix, _: &Colorspace, _: &[f32], _: f32) {}
    fn stroke_path(&mut self, _: &Path, _: &StrokeState, _: Matrix, _: &Colorspace, _: &[f32], _: f32) {}
    fn fill_text(&mut self, _: &TextSpan, _: Matrix, _: &Colorspace, _: &[f32], _: f32) {}
    fn fill_image(&mut self, _: &Image, _: Matrix, _: f32) {}
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fitz::geometry::Point;

    #[test]
    fn test_stroke_state_default() {
        let ss: StrokeState = Default::default();
        assert_eq!(ss.linewidth, 1.0);
        assert_eq!(ss.linecap, 0);
        assert_eq!(ss.linejoin, 0);
    }

    #[test]
    fn test_stroke_state_custom() {
        let ss = StrokeState {
            linewidth: 2.5,
            linecap: 1,
            linejoin: 2,
        };
        assert_eq!(ss.linewidth, 2.5);
        assert_eq!(ss.linecap, 1);
        assert_eq!(ss.linejoin, 2);
    }

    #[test]
    fn test_null_device_fill_path() {
        let mut device = NullDevice;
        let path = Path::new();
        let cs = Colorspace::device_rgb();
        let color = [1.0, 0.0, 0.0];

        // Should not panic
        device.fill_path(&path, Matrix::IDENTITY, &cs, &color, 1.0);
    }

    #[test]
    fn test_null_device_stroke_path() {
        let mut device = NullDevice;
        let path = Path::new();
        let cs = Colorspace::device_rgb();
        let color = [0.0, 1.0, 0.0];
        let stroke = StrokeState::default();

        // Should not panic
        device.stroke_path(&path, &stroke, Matrix::IDENTITY, &cs, &color, 1.0);
    }

    #[test]
    fn test_null_device_fill_text() {
        use crate::fitz::font::Font;
        use std::sync::Arc;
        
        let mut device = NullDevice;
        let font = Arc::new(Font::new("TestFont"));
        let text = TextSpan::new(font, Matrix::IDENTITY);
        let cs = Colorspace::device_rgb();
        let color = [0.0, 0.0, 0.0];

        // Should not panic
        device.fill_text(&text, Matrix::IDENTITY, &cs, &color, 1.0);
    }

    #[test]
    fn test_null_device_fill_image() {
        let mut device = NullDevice;
        let image = Image::new(100, 100, None);

        // Should not panic
        device.fill_image(&image, Matrix::IDENTITY, 1.0);
    }

    #[test]
    fn test_null_device_implements_device_trait() {
        fn takes_device<D: Device>(_d: &mut D) {}
        let mut device = NullDevice;
        takes_device(&mut device);
    }
}

