//! Colorspace definitions

#[derive(Debug, Clone)]
pub struct Colorspace { name: String, n: u8 }

impl Colorspace {
    pub fn device_gray() -> Self { Self { name: "DeviceGray".into(), n: 1 } }
    pub fn device_rgb() -> Self { Self { name: "DeviceRGB".into(), n: 3 } }
    pub fn device_cmyk() -> Self { Self { name: "DeviceCMYK".into(), n: 4 } }
    pub fn name(&self) -> &str { &self.name }
    pub fn n(&self) -> u8 { self.n }
}

