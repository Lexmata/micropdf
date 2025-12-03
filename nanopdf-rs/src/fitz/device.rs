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

