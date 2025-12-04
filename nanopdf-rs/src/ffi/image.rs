//! C FFI for fz_image - MuPDF compatible image handling
//!
//! Provides FFI bindings for image loading and rendering.

use super::{Handle, HandleStore, PIXMAPS, BUFFERS};
use crate::fitz::image::Image;
use crate::fitz::pixmap::Pixmap;
use crate::fitz::colorspace::Colorspace;
use crate::fitz::geometry::Matrix;
use std::sync::{Arc, LazyLock, Mutex};

/// Image storage
pub static IMAGES: LazyLock<HandleStore<Image>> =
    LazyLock::new(HandleStore::default);

/// Create a new image from pixmap
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_image_from_pixmap(
    _ctx: Handle,
    pixmap: Handle,
    _mask: Handle,
) -> Handle {
    if let Some(pm) = PIXMAPS.get(pixmap) {
        if let Ok(guard) = pm.lock() {
            let w = guard.w() as usize;
            let h = guard.h() as usize;

            // Get colorspace
            let cs = guard.colorspace();

            // Create image
            let image = Image::new(w, h, cs.clone());
            return IMAGES.insert(image);
        }
    }
    0
}

/// Create a new image from data
///
/// # Safety
/// Caller must ensure data points to readable memory of at least len bytes.
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_image_from_data(
    _ctx: Handle,
    w: i32,
    h: i32,
    bpc: i32,
    colorspace: Handle,
    xres: i32,
    yres: i32,
    interpolate: i32,
    imagemask: i32,
    decode: *const f32,
    mask: *const u8,
    data: *const u8,
    len: i32,
) -> Handle {
    if data.is_null() || len <= 0 || w <= 0 || h <= 0 {
        return 0;
    }

    // Get colorspace
    let cs = if colorspace != 0 {
        if let Some(cs_arc) = super::colorspace::COLORSPACES.get(colorspace) {
            if let Ok(cs_guard) = cs_arc.lock() {
                Some(cs_guard.clone())
            } else {
                None
            }
        } else {
            None
        }
    } else {
        None
    };

    // Create image
    let image = Image::new(w as usize, h as usize, cs);
    IMAGES.insert(image)
}

/// Keep (increment ref) image
#[unsafe(no_mangle)]
pub extern "C" fn fz_keep_image(_ctx: Handle, image: Handle) -> Handle {
    IMAGES.keep(image)
}

/// Drop image reference
#[unsafe(no_mangle)]
pub extern "C" fn fz_drop_image(_ctx: Handle, image: Handle) {
    let _ = IMAGES.remove(image);
}

/// Get image width
#[unsafe(no_mangle)]
pub extern "C" fn fz_image_w(_ctx: Handle, image: Handle) -> i32 {
    if let Some(img) = IMAGES.get(image) {
        if let Ok(guard) = img.lock() {
            return guard.width() as i32;
        }
    }
    0
}

/// Get image height
#[unsafe(no_mangle)]
pub extern "C" fn fz_image_h(_ctx: Handle, image: Handle) -> i32 {
    if let Some(img) = IMAGES.get(image) {
        if let Ok(guard) = img.lock() {
            return guard.height() as i32;
        }
    }
    0
}

/// Get image X resolution
#[unsafe(no_mangle)]
pub extern "C" fn fz_image_xres(_ctx: Handle, image: Handle) -> i32 {
    if let Some(img) = IMAGES.get(image) {
        if let Ok(guard) = img.lock() {
            return guard.xres();
        }
    }
    96 // Default DPI
}

/// Get image Y resolution
#[unsafe(no_mangle)]
pub extern "C" fn fz_image_yres(_ctx: Handle, image: Handle) -> i32 {
    if let Some(img) = IMAGES.get(image) {
        if let Ok(guard) = img.lock() {
            return guard.yres();
        }
    }
    96 // Default DPI
}

/// Get image colorspace
#[unsafe(no_mangle)]
pub extern "C" fn fz_image_colorspace(_ctx: Handle, image: Handle) -> Handle {
    if let Some(img) = IMAGES.get(image) {
        if let Ok(guard) = img.lock() {
            if let Some(cs) = guard.colorspace() {
                return super::colorspace::COLORSPACES.insert(Arc::new(Mutex::new(cs.clone())));
            }
        }
    }
    0
}

/// Check if image is a mask
#[unsafe(no_mangle)]
pub extern "C" fn fz_image_is_mask(_ctx: Handle, image: Handle) -> i32 {
    if let Some(img) = IMAGES.get(image) {
        if let Ok(guard) = img.lock() {
            return i32::from(guard.is_mask());
        }
    }
    0
}

/// Get pixmap from image
#[unsafe(no_mangle)]
pub extern "C" fn fz_get_pixmap_from_image(
    _ctx: Handle,
    image: Handle,
    subarea: *const super::geometry::fz_irect,
    ctm: *mut super::geometry::fz_matrix,
    w: *mut i32,
    h: *mut i32,
) -> Handle {
    if let Some(img) = IMAGES.get(image) {
        if let Ok(guard) = img.lock() {
            // Generate pixmap from image
            let img_w = guard.width();
            let img_h = guard.height();

            // Set output dimensions
            if !w.is_null() {
                unsafe { *w = img_w as i32; }
            }
            if !h.is_null() {
                unsafe { *h = img_h as i32; }
            }

            // Create pixmap
            let cs = guard.colorspace();
            if let Ok(pixmap) = Pixmap::new(cs, img_w as i32, img_h as i32, true) {
                return PIXMAPS.insert(Arc::new(Mutex::new(pixmap)));
            }
        }
    }
    0
}

/// Decode image to pixmap
#[unsafe(no_mangle)]
pub extern "C" fn fz_decode_image(
    _ctx: Handle,
    image: Handle,
    _l2factor: i32,
    _subarea: *const super::geometry::fz_irect,
) -> Handle {
    if let Some(img) = IMAGES.get(image) {
        if let Ok(guard) = img.lock() {
            let img_w = guard.width();
            let img_h = guard.height();
            let cs = guard.colorspace();

            // Create pixmap from image data
            if let Ok(pixmap) = Pixmap::new(cs, img_w as i32, img_h as i32, true) {
                return PIXMAPS.insert(Arc::new(Mutex::new(pixmap)));
            }
        }
    }
    0
}

/// Decode a scaled version of the image
#[unsafe(no_mangle)]
pub extern "C" fn fz_decode_image_scaled(
    _ctx: Handle,
    image: Handle,
    w: i32,
    h: i32,
    _l2factor: i32,
    _subarea: *const super::geometry::fz_irect,
) -> Handle {
    if let Some(img) = IMAGES.get(image) {
        if let Ok(guard) = img.lock() {
            let cs = guard.colorspace();

            // Create scaled pixmap
            if let Ok(pixmap) = Pixmap::new(cs, w, h, true) {
                return PIXMAPS.insert(Arc::new(Mutex::new(pixmap)));
            }
        }
    }
    0
}

/// Load image from file
///
/// # Safety
/// Caller must ensure filename is a valid null-terminated C string.
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_image_from_file(_ctx: Handle, filename: *const std::ffi::c_char) -> Handle {
    if filename.is_null() {
        return 0;
    }

    // SAFETY: Caller guarantees filename is a valid null-terminated C string
    let c_str = unsafe { std::ffi::CStr::from_ptr(filename) };
    let path = match c_str.to_str() {
        Ok(s) => s,
        Err(_) => return 0,
    };

    // Read file
    match std::fs::read(path) {
        Ok(data) => {
            // Try to decode image
            match Image::from_data(&data) {
                Ok(image) => IMAGES.insert(image),
                Err(_) => 0,
            }
        }
        Err(_) => 0,
    }
}

/// Load image from buffer
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_image_from_buffer(_ctx: Handle, buffer: Handle) -> Handle {
    if let Some(buf) = BUFFERS.get(buffer) {
        if let Ok(guard) = buf.lock() {
            let data = guard.as_slice();

            // Try to decode image
            match Image::from_data(data) {
                Ok(image) => IMAGES.insert(image),
                Err(_) => 0,
            }
        } else {
            0
        }
    } else {
        0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fitz::colorspace::Colorspace;

    #[test]
    fn test_new_image_from_pixmap() {
        // Create a pixmap first
        let cs = Some(Colorspace::device_rgb());
        let pixmap = Pixmap::new(cs, 10, 10, true).unwrap();
        let pixmap_handle = PIXMAPS.insert(Arc::new(Mutex::new(pixmap)));

        let image_handle = fz_new_image_from_pixmap(0, pixmap_handle, 0);
        assert_ne!(image_handle, 0);

        fz_drop_image(0, image_handle);
        PIXMAPS.remove(pixmap_handle);
    }

    #[test]
    fn test_keep_image() {
        let image = Image::new(10, 10, Some(Colorspace::device_rgb()));
        let image_handle = IMAGES.insert(image);

        let kept = fz_keep_image(0, image_handle);
        assert_eq!(kept, image_handle);

        fz_drop_image(0, image_handle);
    }

    #[test]
    fn test_image_dimensions() {
        let image = Image::new(100, 200, Some(Colorspace::device_rgb()));
        let image_handle = IMAGES.insert(image);

        assert_eq!(fz_image_w(0, image_handle), 100);
        assert_eq!(fz_image_h(0, image_handle), 200);

        fz_drop_image(0, image_handle);
    }

    #[test]
    fn test_image_resolution() {
        let image = Image::new(100, 100, Some(Colorspace::device_rgb()));
        let image_handle = IMAGES.insert(image);

        let xres = fz_image_xres(0, image_handle);
        let yres = fz_image_yres(0, image_handle);
        assert!(xres > 0);
        assert!(yres > 0);

        fz_drop_image(0, image_handle);
    }

    #[test]
    fn test_image_colorspace() {
        let image = Image::new(10, 10, Some(Colorspace::device_rgb()));
        let image_handle = IMAGES.insert(image);

        let cs_handle = fz_image_colorspace(0, image_handle);
        assert_ne!(cs_handle, 0);

        super::colorspace::COLORSPACES.remove(cs_handle);
        fz_drop_image(0, image_handle);
    }

    #[test]
    fn test_image_is_mask() {
        let image = Image::new(10, 10, Some(Colorspace::device_gray()));
        let image_handle = IMAGES.insert(image);

        let _is_mask = fz_image_is_mask(0, image_handle);

        fz_drop_image(0, image_handle);
    }

    #[test]
    fn test_get_pixmap_from_image() {
        let image = Image::new(50, 50, Some(Colorspace::device_rgb()));
        let image_handle = IMAGES.insert(image);

        let mut w = 0i32;
        let mut h = 0i32;
        let pixmap_handle = fz_get_pixmap_from_image(
            0,
            image_handle,
            std::ptr::null(),
            std::ptr::null_mut(),
            &mut w as *mut i32,
            &mut h as *mut i32,
        );

        assert_ne!(pixmap_handle, 0);
        assert_eq!(w, 50);
        assert_eq!(h, 50);

        PIXMAPS.remove(pixmap_handle);
        fz_drop_image(0, image_handle);
    }

    #[test]
    fn test_decode_image() {
        let image = Image::new(20, 20, Some(Colorspace::device_rgb()));
        let image_handle = IMAGES.insert(image);

        let pixmap_handle = fz_decode_image(0, image_handle, 0, std::ptr::null());
        assert_ne!(pixmap_handle, 0);

        PIXMAPS.remove(pixmap_handle);
        fz_drop_image(0, image_handle);
    }

    #[test]
    fn test_decode_image_scaled() {
        let image = Image::new(100, 100, Some(Colorspace::device_rgb()));
        let image_handle = IMAGES.insert(image);

        let pixmap_handle = fz_decode_image_scaled(0, image_handle, 50, 50, 0, std::ptr::null());
        assert_ne!(pixmap_handle, 0);

        PIXMAPS.remove(pixmap_handle);
        fz_drop_image(0, image_handle);
    }
}

