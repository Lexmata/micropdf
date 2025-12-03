//! Image handling
use crate::fitz::colorspace::Colorspace;
use crate::fitz::pixmap::Pixmap;

pub struct Image { width: i32, height: i32, pixmap: Option<Pixmap> }

impl Image {
    pub fn new(width: i32, height: i32, pixmap: Option<Pixmap>) -> Self {
        Self { width, height, pixmap }
    }
    pub fn width(&self) -> i32 { self.width }
    pub fn height(&self) -> i32 { self.height }
    pub fn pixmap(&self) -> Option<&Pixmap> { self.pixmap.as_ref() }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_image_new_without_pixmap() {
        let img = Image::new(100, 50, None);
        assert_eq!(img.width(), 100);
        assert_eq!(img.height(), 50);
        assert!(img.pixmap().is_none());
    }

    #[test]
    fn test_image_new_with_pixmap() {
        let cs = Colorspace::device_rgb();
        let pm = Pixmap::new(Some(cs), 100, 50, false).unwrap();
        let img = Image::new(100, 50, Some(pm));
        
        assert_eq!(img.width(), 100);
        assert_eq!(img.height(), 50);
        assert!(img.pixmap().is_some());
        
        let pm_ref = img.pixmap().unwrap();
        assert_eq!(pm_ref.width(), 100);
        assert_eq!(pm_ref.height(), 50);
    }

    #[test]
    fn test_image_dimensions() {
        let img = Image::new(1920, 1080, None);
        assert_eq!(img.width(), 1920);
        assert_eq!(img.height(), 1080);
    }
}

