//! Font handling
pub struct Font { name: String }
impl Font {
    pub fn new(name: &str) -> Self { Self { name: name.to_string() } }
    pub fn name(&self) -> &str { &self.name }
}

