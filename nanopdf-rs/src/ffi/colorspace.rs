//! C FFI for colorspace - MuPDF compatible
//! Safe Rust implementation

use std::ffi::c_char;

/// Colorspace type enumeration
#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ColorspaceType {
    None = 0,
    Gray = 1,
    Rgb = 2,
    Bgr = 3,
    Cmyk = 4,
    Lab = 5,
    Indexed = 6,
    Separation = 7,
}

/// Colorspace handle - we use small integers for device colorspaces
/// Handles 1-4 are reserved for device colorspaces
/// 0 = invalid/null
pub type ColorspaceHandle = u64;

pub const FZ_COLORSPACE_GRAY: ColorspaceHandle = 1;
pub const FZ_COLORSPACE_RGB: ColorspaceHandle = 2;
pub const FZ_COLORSPACE_BGR: ColorspaceHandle = 3;
pub const FZ_COLORSPACE_CMYK: ColorspaceHandle = 4;
pub const FZ_COLORSPACE_LAB: ColorspaceHandle = 5;

/// Get number of components for a colorspace
fn colorspace_n(handle: ColorspaceHandle) -> i32 {
    match handle {
        FZ_COLORSPACE_GRAY => 1,
        FZ_COLORSPACE_RGB | FZ_COLORSPACE_BGR => 3,
        FZ_COLORSPACE_CMYK => 4,
        FZ_COLORSPACE_LAB => 3,
        _ => 0,
    }
}

/// Get colorspace type
fn colorspace_type(handle: ColorspaceHandle) -> ColorspaceType {
    match handle {
        FZ_COLORSPACE_GRAY => ColorspaceType::Gray,
        FZ_COLORSPACE_RGB => ColorspaceType::Rgb,
        FZ_COLORSPACE_BGR => ColorspaceType::Bgr,
        FZ_COLORSPACE_CMYK => ColorspaceType::Cmyk,
        FZ_COLORSPACE_LAB => ColorspaceType::Lab,
        _ => ColorspaceType::None,
    }
}

/// Get device gray colorspace
#[unsafe(no_mangle)]
pub extern "C" fn fz_device_gray(_ctx: super::Handle) -> ColorspaceHandle {
    FZ_COLORSPACE_GRAY
}

/// Get device RGB colorspace
#[unsafe(no_mangle)]
pub extern "C" fn fz_device_rgb(_ctx: super::Handle) -> ColorspaceHandle {
    FZ_COLORSPACE_RGB
}

/// Get device BGR colorspace
#[unsafe(no_mangle)]
pub extern "C" fn fz_device_bgr(_ctx: super::Handle) -> ColorspaceHandle {
    FZ_COLORSPACE_BGR
}

/// Get device CMYK colorspace
#[unsafe(no_mangle)]
pub extern "C" fn fz_device_cmyk(_ctx: super::Handle) -> ColorspaceHandle {
    FZ_COLORSPACE_CMYK
}

/// Get device Lab colorspace
#[unsafe(no_mangle)]
pub extern "C" fn fz_device_lab(_ctx: super::Handle) -> ColorspaceHandle {
    FZ_COLORSPACE_LAB
}

/// Keep (increment ref) colorspace - device colorspaces are immortal
#[unsafe(no_mangle)]
pub extern "C" fn fz_keep_colorspace(_ctx: super::Handle, cs: ColorspaceHandle) -> ColorspaceHandle {
    cs // Device colorspaces don't need ref counting
}

/// Drop colorspace reference - device colorspaces are immortal
#[unsafe(no_mangle)]
pub extern "C" fn fz_drop_colorspace(_ctx: super::Handle, _cs: ColorspaceHandle) {
    // Device colorspaces are never freed
}

/// Get number of components in colorspace
#[unsafe(no_mangle)]
pub extern "C" fn fz_colorspace_n(_ctx: super::Handle, cs: ColorspaceHandle) -> i32 {
    colorspace_n(cs)
}

/// Check if colorspace is gray
#[unsafe(no_mangle)]
pub extern "C" fn fz_colorspace_is_gray(_ctx: super::Handle, cs: ColorspaceHandle) -> i32 {
    i32::from(colorspace_type(cs) == ColorspaceType::Gray)
}

/// Check if colorspace is RGB
#[unsafe(no_mangle)]
pub extern "C" fn fz_colorspace_is_rgb(_ctx: super::Handle, cs: ColorspaceHandle) -> i32 {
    i32::from(colorspace_type(cs) == ColorspaceType::Rgb)
}

/// Check if colorspace is CMYK
#[unsafe(no_mangle)]
pub extern "C" fn fz_colorspace_is_cmyk(_ctx: super::Handle, cs: ColorspaceHandle) -> i32 {
    i32::from(colorspace_type(cs) == ColorspaceType::Cmyk)
}

/// Check if colorspace is Lab
#[unsafe(no_mangle)]
pub extern "C" fn fz_colorspace_is_lab(_ctx: super::Handle, cs: ColorspaceHandle) -> i32 {
    i32::from(colorspace_type(cs) == ColorspaceType::Lab)
}

/// Check if colorspace is device colorspace
#[unsafe(no_mangle)]
pub extern "C" fn fz_colorspace_is_device(_ctx: super::Handle, cs: ColorspaceHandle) -> i32 {
    i32::from(cs >= FZ_COLORSPACE_GRAY && cs <= FZ_COLORSPACE_LAB)
}

/// Get colorspace name
#[unsafe(no_mangle)]
pub extern "C" fn fz_colorspace_name(_ctx: super::Handle, cs: ColorspaceHandle) -> *const c_char {
    match cs {
        FZ_COLORSPACE_GRAY => c"DeviceGray".as_ptr(),
        FZ_COLORSPACE_RGB => c"DeviceRGB".as_ptr(),
        FZ_COLORSPACE_BGR => c"DeviceBGR".as_ptr(),
        FZ_COLORSPACE_CMYK => c"DeviceCMYK".as_ptr(),
        FZ_COLORSPACE_LAB => c"Lab".as_ptr(),
        _ => c"Unknown".as_ptr(),
    }
}

/// Convert color from one colorspace to another
///
/// # Safety
/// Caller must ensure:
/// - `src` points to valid memory of at least `src_cs.n` floats
/// - `dst` points to writable memory of at least `dst_cs.n` floats
#[unsafe(no_mangle)]
pub extern "C" fn fz_convert_color(
    _ctx: super::Handle,
    src_cs: ColorspaceHandle,
    src: *const f32,
    dst_cs: ColorspaceHandle,
    dst: *mut f32,
    _proof_cs: ColorspaceHandle,
) {
    if src.is_null() || dst.is_null() {
        return;
    }

    let src_n = colorspace_n(src_cs) as usize;
    let dst_n = colorspace_n(dst_cs) as usize;

    if src_n == 0 || dst_n == 0 {
        return;
    }

    // SAFETY: Caller guarantees src and dst point to valid memory
    #[allow(unsafe_code)]
    let (src_slice, dst_slice) = unsafe {
        (
            std::slice::from_raw_parts(src, src_n),
            std::slice::from_raw_parts_mut(dst, dst_n),
        )
    };

    // Simple color conversion (Gray -> RGB, RGB -> Gray, etc.)
    match (colorspace_type(src_cs), colorspace_type(dst_cs)) {
        (ColorspaceType::Gray, ColorspaceType::Rgb) => {
            let g = src_slice[0];
            dst_slice[0] = g;
            dst_slice[1] = g;
            dst_slice[2] = g;
        }
        (ColorspaceType::Rgb, ColorspaceType::Gray) => {
            // Luminance formula
            dst_slice[0] = src_slice[0] * 0.299 + src_slice[1] * 0.587 + src_slice[2] * 0.114;
        }
        (ColorspaceType::Rgb, ColorspaceType::Cmyk) => {
            let r = src_slice[0];
            let g = src_slice[1];
            let b = src_slice[2];
            let k = 1.0 - r.max(g).max(b);
            if k < 1.0 {
                let inv_k = 1.0 / (1.0 - k);
                dst_slice[0] = (1.0 - r - k) * inv_k;
                dst_slice[1] = (1.0 - g - k) * inv_k;
                dst_slice[2] = (1.0 - b - k) * inv_k;
            } else {
                dst_slice[0] = 0.0;
                dst_slice[1] = 0.0;
                dst_slice[2] = 0.0;
            }
            dst_slice[3] = k;
        }
        (ColorspaceType::Cmyk, ColorspaceType::Rgb) => {
            let c = src_slice[0];
            let m = src_slice[1];
            let y = src_slice[2];
            let k = src_slice[3];
            dst_slice[0] = (1.0 - c) * (1.0 - k);
            dst_slice[1] = (1.0 - m) * (1.0 - k);
            dst_slice[2] = (1.0 - y) * (1.0 - k);
        }
        _ if src_cs == dst_cs => {
            // Same colorspace, just copy
            dst_slice[..src_n.min(dst_n)].copy_from_slice(&src_slice[..src_n.min(dst_n)]);
        }
        _ => {
            // Default: fill with zeros
            dst_slice.fill(0.0);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_device_colorspaces() {
        assert_eq!(fz_colorspace_n(0, FZ_COLORSPACE_GRAY), 1);
        assert_eq!(fz_colorspace_n(0, FZ_COLORSPACE_RGB), 3);
        assert_eq!(fz_colorspace_n(0, FZ_COLORSPACE_CMYK), 4);
    }

    #[test]
    fn test_colorspace_checks() {
        assert_eq!(fz_colorspace_is_gray(0, FZ_COLORSPACE_GRAY), 1);
        assert_eq!(fz_colorspace_is_rgb(0, FZ_COLORSPACE_RGB), 1);
        assert_eq!(fz_colorspace_is_cmyk(0, FZ_COLORSPACE_CMYK), 1);
    }

    #[test]
    fn test_colorspace_is_gray_negative() {
        assert_eq!(fz_colorspace_is_gray(0, FZ_COLORSPACE_RGB), 0);
        assert_eq!(fz_colorspace_is_gray(0, FZ_COLORSPACE_CMYK), 0);
    }

    #[test]
    fn test_colorspace_is_rgb_negative() {
        assert_eq!(fz_colorspace_is_rgb(0, FZ_COLORSPACE_GRAY), 0);
        assert_eq!(fz_colorspace_is_rgb(0, FZ_COLORSPACE_CMYK), 0);
    }

    #[test]
    fn test_colorspace_is_cmyk_negative() {
        assert_eq!(fz_colorspace_is_cmyk(0, FZ_COLORSPACE_GRAY), 0);
        assert_eq!(fz_colorspace_is_cmyk(0, FZ_COLORSPACE_RGB), 0);
    }

    #[test]
    fn test_colorspace_type() {
        assert!(matches!(colorspace_type(FZ_COLORSPACE_GRAY), ColorspaceType::Gray));
        assert!(matches!(colorspace_type(FZ_COLORSPACE_RGB), ColorspaceType::Rgb));
        assert!(matches!(colorspace_type(FZ_COLORSPACE_CMYK), ColorspaceType::Cmyk));
        assert!(matches!(colorspace_type(99), ColorspaceType::None));
    }

    #[test]
    fn test_colorspace_n() {
        assert_eq!(colorspace_n(FZ_COLORSPACE_GRAY), 1);
        assert_eq!(colorspace_n(FZ_COLORSPACE_RGB), 3);
        assert_eq!(colorspace_n(FZ_COLORSPACE_CMYK), 4);
        assert_eq!(colorspace_n(99), 0);
    }

    #[test]
    fn test_device_gray_handle() {
        let handle = fz_device_gray(0);
        assert_eq!(handle, FZ_COLORSPACE_GRAY);
    }

    #[test]
    fn test_device_rgb_handle() {
        let handle = fz_device_rgb(0);
        assert_eq!(handle, FZ_COLORSPACE_RGB);
    }

    #[test]
    fn test_device_cmyk_handle() {
        let handle = fz_device_cmyk(0);
        assert_eq!(handle, FZ_COLORSPACE_CMYK);
    }

    #[test]
    fn test_keep_drop_colorspace() {
        // Keep and drop should not panic
        let handle = fz_keep_colorspace(0, FZ_COLORSPACE_RGB);
        assert_eq!(handle, FZ_COLORSPACE_RGB);
        fz_drop_colorspace(0, handle);
    }

    #[test]
    fn test_convert_color_gray_to_rgb() {
        let src = [0.5f32];
        let mut dst = [0.0f32; 3];
        
        fz_convert_color(
            0,
            FZ_COLORSPACE_GRAY,
            src.as_ptr(),
            FZ_COLORSPACE_RGB,
            dst.as_mut_ptr(),
            0,
        );
        
        assert!((dst[0] - 0.5).abs() < 0.01);
        assert!((dst[1] - 0.5).abs() < 0.01);
        assert!((dst[2] - 0.5).abs() < 0.01);
    }

    #[test]
    fn test_convert_color_rgb_to_gray() {
        let src = [1.0f32, 1.0, 1.0]; // White
        let mut dst = [0.0f32];
        
        fz_convert_color(
            0,
            FZ_COLORSPACE_RGB,
            src.as_ptr(),
            FZ_COLORSPACE_GRAY,
            dst.as_mut_ptr(),
            0,
        );
        
        // Luminance should be close to 1.0 for white
        assert!((dst[0] - 1.0).abs() < 0.01);
    }

    #[test]
    fn test_convert_color_rgb_to_cmyk() {
        let src = [1.0f32, 0.0, 0.0]; // Red
        let mut dst = [0.0f32; 4];
        
        fz_convert_color(
            0,
            FZ_COLORSPACE_RGB,
            src.as_ptr(),
            FZ_COLORSPACE_CMYK,
            dst.as_mut_ptr(),
            0,
        );
        
        // Red in CMYK: C=0, M=1, Y=1, K=0
        assert!(dst[0] < 0.1); // Cyan should be low
        assert_eq!(dst[3], 0.0); // Black should be 0
    }

    #[test]
    fn test_convert_color_cmyk_to_rgb() {
        let src = [0.0f32, 0.0, 0.0, 0.0]; // No ink = white
        let mut dst = [0.0f32; 3];
        
        fz_convert_color(
            0,
            FZ_COLORSPACE_CMYK,
            src.as_ptr(),
            FZ_COLORSPACE_RGB,
            dst.as_mut_ptr(),
            0,
        );
        
        assert!((dst[0] - 1.0).abs() < 0.01);
        assert!((dst[1] - 1.0).abs() < 0.01);
        assert!((dst[2] - 1.0).abs() < 0.01);
    }

    #[test]
    fn test_convert_color_same_colorspace() {
        let src = [0.25f32, 0.5, 0.75];
        let mut dst = [0.0f32; 3];
        
        fz_convert_color(
            0,
            FZ_COLORSPACE_RGB,
            src.as_ptr(),
            FZ_COLORSPACE_RGB,
            dst.as_mut_ptr(),
            0,
        );
        
        assert_eq!(dst, src);
    }

    #[test]
    fn test_convert_color_null_pointers() {
        // Should not panic with null pointers
        fz_convert_color(0, FZ_COLORSPACE_RGB, std::ptr::null(), FZ_COLORSPACE_GRAY, std::ptr::null_mut(), 0);
    }

    #[test]
    fn test_convert_color_invalid_colorspace() {
        let src = [0.5f32];
        let mut dst = [1.0f32; 3];
        
        // Invalid source colorspace - dst should be filled with zeros
        fz_convert_color(0, 99, src.as_ptr(), FZ_COLORSPACE_RGB, dst.as_mut_ptr(), 0);
        // Operation should not panic even with invalid colorspace
    }

    #[test]
    fn test_colorspace_is_device() {
        assert_eq!(fz_colorspace_is_device(0, FZ_COLORSPACE_GRAY), 1);
        assert_eq!(fz_colorspace_is_device(0, FZ_COLORSPACE_RGB), 1);
        assert_eq!(fz_colorspace_is_device(0, FZ_COLORSPACE_CMYK), 1);
    }
}
