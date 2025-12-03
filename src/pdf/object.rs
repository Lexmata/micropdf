//! PDF object types
use std::collections::HashMap;
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Name(pub String);
impl Name { pub fn new(s: &str) -> Self { Self(s.to_string()) } }
impl fmt::Display for Name { fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "/{}", self.0) } }

#[derive(Debug, Clone)]
pub struct PdfString(Vec<u8>);
impl PdfString {
    pub fn new(data: Vec<u8>) -> Self { Self(data) }
    pub fn as_bytes(&self) -> &[u8] { &self.0 }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ObjRef { pub num: i32, pub generation: i32 }
impl ObjRef { pub fn new(num: i32, generation: i32) -> Self { Self { num, generation } } }

pub type Dict = HashMap<Name, Object>;
pub type Array = Vec<Object>;

#[derive(Debug, Clone)]
pub enum Object {
    Null,
    Bool(bool),
    Int(i64),
    Real(f64),
    String(PdfString),
    Name(Name),
    Array(Array),
    Dict(Dict),
    Stream { dict: Dict, data: Vec<u8> },
    Ref(ObjRef),
}

impl Object {
    pub fn is_null(&self) -> bool { matches!(self, Object::Null) }
    pub fn as_bool(&self) -> Option<bool> { if let Object::Bool(b) = self { Some(*b) } else { None } }
    pub fn as_int(&self) -> Option<i64> { if let Object::Int(i) = self { Some(*i) } else { None } }
    pub fn as_real(&self) -> Option<f64> {
        match self { Object::Real(r) => Some(*r), Object::Int(i) => Some(*i as f64), _ => None }
    }
    pub fn as_name(&self) -> Option<&Name> { if let Object::Name(n) = self { Some(n) } else { None } }
    pub fn as_string(&self) -> Option<&PdfString> { if let Object::String(s) = self { Some(s) } else { None } }
    pub fn as_array(&self) -> Option<&Array> { if let Object::Array(a) = self { Some(a) } else { None } }
    pub fn as_dict(&self) -> Option<&Dict> { if let Object::Dict(d) = self { Some(d) } else { None } }
}

impl Default for Object { fn default() -> Self { Object::Null } }

