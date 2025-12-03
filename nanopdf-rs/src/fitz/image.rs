//! Image handling
use crate::fitz::colorspace::Colorspace;
use crate::fitz::pixmap::Pixmap;

pub struct Image { width: i32, height: i32, pixmap: Option<Pixmap> }

impl Image {
    pub fn width(&self) -> i32 { self.width }
    pub fn height(&self) -> i32 { self.height }
    pub fn pixmap(&self) -> Option<&Pixmap> { self.pixmap.as_ref() }
}

