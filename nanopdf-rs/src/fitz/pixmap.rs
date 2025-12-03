//! Pixmap - Pixel buffer for rendering

use crate::fitz::colorspace::Colorspace;
use crate::fitz::error::{Error, Result};
use crate::fitz::geometry::IRect;
use std::sync::Arc;

#[derive(Clone)]
pub struct Pixmap { inner: Arc<PixmapInner> }

#[derive(Clone)]
struct PixmapInner {
    x: i32, y: i32, w: i32, h: i32, n: u8, alpha: u8,
    stride: usize, colorspace: Option<Colorspace>, samples: Vec<u8>,
}

impl Pixmap {
    pub fn new(colorspace: Option<Colorspace>, w: i32, h: i32, alpha: bool) -> Result<Self> {
        if w <= 0 || h <= 0 { return Err(Error::argument("Invalid dimensions")); }
        let n = match &colorspace {
            Some(cs) => cs.n() + if alpha { 1 } else { 0 },
            None if alpha => 1,
            None => return Err(Error::argument("Pixmap must have colorspace or alpha")),
        };
        let stride = (w as usize) * (n as usize);
        Ok(Self { inner: Arc::new(PixmapInner {
            x: 0, y: 0, w, h, n, alpha: if alpha { 1 } else { 0 },
            stride, colorspace, samples: vec![0; stride * (h as usize)],
        }) })
    }
    pub fn width(&self) -> i32 { self.inner.w }
    pub fn height(&self) -> i32 { self.inner.h }
    pub fn n(&self) -> u8 { self.inner.n }
    pub fn has_alpha(&self) -> bool { self.inner.alpha > 0 }
    pub fn stride(&self) -> usize { self.inner.stride }
    pub fn colorspace(&self) -> Option<&Colorspace> { self.inner.colorspace.as_ref() }
    pub fn samples(&self) -> &[u8] { &self.inner.samples }
    pub fn samples_mut(&mut self) -> &mut [u8] { &mut Arc::make_mut(&mut self.inner).samples }
    pub fn clear(&mut self, value: u8) {
        let inner = Arc::make_mut(&mut self.inner);
        inner.samples.fill(value);
    }
    pub fn get_pixel(&self, x: i32, y: i32) -> Option<&[u8]> {
        if x < 0 || x >= self.inner.w || y < 0 || y >= self.inner.h { return None; }
        let offset = (y as usize) * self.inner.stride + (x as usize) * (self.inner.n as usize);
        Some(&self.inner.samples[offset..offset + self.inner.n as usize])
    }
}

