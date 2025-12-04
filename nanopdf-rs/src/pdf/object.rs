//! PDF object types
use std::collections::HashMap;
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Name(pub String);
impl Name {
    pub fn new(s: &str) -> Self {
        Self(s.to_string())
    }
}
impl fmt::Display for Name {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "/{}", self.0)
    }
}

#[derive(Debug, Clone)]
pub struct PdfString(Vec<u8>);
impl PdfString {
    pub fn new(data: Vec<u8>) -> Self {
        Self(data)
    }
    pub fn as_bytes(&self) -> &[u8] {
        &self.0
    }
    pub fn as_str(&self) -> Option<&str> {
        std::str::from_utf8(&self.0).ok()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ObjRef {
    pub num: i32,
    pub generation: i32,
}
impl ObjRef {
    pub fn new(num: i32, generation: i32) -> Self {
        Self { num, generation }
    }
}

pub type Dict = HashMap<Name, Object>;
pub type Array = Vec<Object>;

#[derive(Debug, Clone, Default)]
pub enum Object {
    #[default]
    Null,
    Bool(bool),
    Int(i64),
    Real(f64),
    String(PdfString),
    Name(Name),
    Array(Array),
    Dict(Dict),
    Stream {
        dict: Dict,
        data: Vec<u8>,
    },
    Ref(ObjRef),
}

impl Object {
    pub fn is_null(&self) -> bool {
        matches!(self, Object::Null)
    }
    pub fn as_bool(&self) -> Option<bool> {
        if let Object::Bool(b) = self {
            Some(*b)
        } else {
            None
        }
    }
    pub fn as_int(&self) -> Option<i64> {
        if let Object::Int(i) = self {
            Some(*i)
        } else {
            None
        }
    }
    pub fn as_real(&self) -> Option<f64> {
        match self {
            Object::Real(r) => Some(*r),
            Object::Int(i) => Some(*i as f64),
            _ => None,
        }
    }
    pub fn as_name(&self) -> Option<&Name> {
        if let Object::Name(n) = self {
            Some(n)
        } else {
            None
        }
    }
    pub fn as_string(&self) -> Option<&PdfString> {
        if let Object::String(s) = self {
            Some(s)
        } else {
            None
        }
    }
    pub fn as_array(&self) -> Option<&Array> {
        if let Object::Array(a) = self {
            Some(a)
        } else {
            None
        }
    }
    pub fn as_dict(&self) -> Option<&Dict> {
        if let Object::Dict(d) = self {
            Some(d)
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Name tests
    #[test]
    fn test_name_new() {
        let name = Name::new("Type");
        assert_eq!(name.0, "Type");
    }

    #[test]
    fn test_name_display() {
        let name = Name::new("Page");
        assert_eq!(format!("{}", name), "/Page");
    }

    #[test]
    fn test_name_eq() {
        let n1 = Name::new("Test");
        let n2 = Name::new("Test");
        let n3 = Name::new("Other");
        assert_eq!(n1, n2);
        assert_ne!(n1, n3);
    }

    #[test]
    fn test_name_hash() {
        use std::collections::HashSet;
        let mut set = HashSet::new();
        set.insert(Name::new("A"));
        set.insert(Name::new("B"));
        set.insert(Name::new("A")); // duplicate
        assert_eq!(set.len(), 2);
    }

    #[test]
    fn test_name_clone() {
        let n1 = Name::new("Clone");
        let n2 = n1.clone();
        assert_eq!(n1, n2);
    }

    // PdfString tests
    #[test]
    fn test_pdf_string_new() {
        let s = PdfString::new(vec![72, 101, 108, 108, 111]);
        assert_eq!(s.as_bytes(), b"Hello");
    }

    #[test]
    fn test_pdf_string_as_str() {
        let s = PdfString::new(b"Hello World".to_vec());
        assert_eq!(s.as_str(), Some("Hello World"));
    }

    #[test]
    fn test_pdf_string_as_str_invalid_utf8() {
        let s = PdfString::new(vec![0xFF, 0xFE]);
        assert_eq!(s.as_str(), None);
    }

    #[test]
    fn test_pdf_string_clone() {
        let s1 = PdfString::new(b"Test".to_vec());
        let s2 = s1.clone();
        assert_eq!(s1.as_bytes(), s2.as_bytes());
    }

    // ObjRef tests
    #[test]
    fn test_obj_ref_new() {
        let r = ObjRef::new(10, 0);
        assert_eq!(r.num, 10);
        assert_eq!(r.generation, 0);
    }

    #[test]
    fn test_obj_ref_eq() {
        let r1 = ObjRef::new(5, 0);
        let r2 = ObjRef::new(5, 0);
        let r3 = ObjRef::new(5, 1);
        assert_eq!(r1, r2);
        assert_ne!(r1, r3);
    }

    #[test]
    fn test_obj_ref_hash() {
        use std::collections::HashSet;
        let mut set = HashSet::new();
        set.insert(ObjRef::new(1, 0));
        set.insert(ObjRef::new(2, 0));
        set.insert(ObjRef::new(1, 0)); // duplicate
        assert_eq!(set.len(), 2);
    }

    // Object tests
    #[test]
    fn test_object_null() {
        let obj = Object::Null;
        assert!(obj.is_null());
        assert_eq!(obj.as_bool(), None);
        assert_eq!(obj.as_int(), None);
    }

    #[test]
    fn test_object_bool() {
        let obj_true = Object::Bool(true);
        let obj_false = Object::Bool(false);

        assert!(!obj_true.is_null());
        assert_eq!(obj_true.as_bool(), Some(true));
        assert_eq!(obj_false.as_bool(), Some(false));
    }

    #[test]
    fn test_object_int() {
        let obj = Object::Int(42);
        assert_eq!(obj.as_int(), Some(42));
        assert_eq!(obj.as_real(), Some(42.0));
    }

    #[test]
    fn test_object_real() {
        let obj = Object::Real(std::f64::consts::PI);
        assert_eq!(obj.as_real(), Some(std::f64::consts::PI));
        assert_eq!(obj.as_int(), None);
    }

    #[test]
    fn test_object_string() {
        let obj = Object::String(PdfString::new(b"Hello".to_vec()));
        let s = obj.as_string().unwrap();
        assert_eq!(s.as_bytes(), b"Hello");
    }

    #[test]
    fn test_object_name() {
        let obj = Object::Name(Name::new("Type"));
        let n = obj.as_name().unwrap();
        assert_eq!(n.0, "Type");
    }

    #[test]
    fn test_object_array() {
        let arr = vec![Object::Int(1), Object::Int(2), Object::Int(3)];
        let obj = Object::Array(arr);
        let a = obj.as_array().unwrap();
        assert_eq!(a.len(), 3);
    }

    #[test]
    fn test_object_dict() {
        let mut dict = HashMap::new();
        dict.insert(Name::new("Type"), Object::Name(Name::new("Page")));
        let obj = Object::Dict(dict);
        let d = obj.as_dict().unwrap();
        assert_eq!(d.len(), 1);
    }

    #[test]
    fn test_object_stream() {
        let mut dict = HashMap::new();
        dict.insert(Name::new("Length"), Object::Int(5));
        let obj = Object::Stream {
            dict,
            data: b"Hello".to_vec(),
        };

        if let Object::Stream { dict, data } = obj {
            assert_eq!(data, b"Hello");
            assert!(dict.contains_key(&Name::new("Length")));
        } else {
            panic!("Expected Stream");
        }
    }

    #[test]
    fn test_object_ref() {
        let obj = Object::Ref(ObjRef::new(10, 0));
        if let Object::Ref(r) = obj {
            assert_eq!(r.num, 10);
            assert_eq!(r.generation, 0);
        } else {
            panic!("Expected Ref");
        }
    }

    #[test]
    fn test_object_default() {
        let obj: Object = Default::default();
        assert!(obj.is_null());
    }

    #[test]
    fn test_object_clone() {
        let obj = Object::Int(123);
        let cloned = obj.clone();
        assert_eq!(cloned.as_int(), Some(123));
    }

    #[test]
    fn test_object_debug() {
        let obj = Object::Int(42);
        let debug = format!("{:?}", obj);
        assert!(debug.contains("Int"));
        assert!(debug.contains("42"));
    }

    #[test]
    fn test_complex_nested_structure() {
        let mut inner_dict = HashMap::new();
        inner_dict.insert(
            Name::new("Key"),
            Object::String(PdfString::new(b"Value".to_vec())),
        );

        let arr = vec![Object::Int(1), Object::Real(2.5), Object::Dict(inner_dict)];

        let mut outer_dict = HashMap::new();
        outer_dict.insert(Name::new("Array"), Object::Array(arr));

        let obj = Object::Dict(outer_dict);
        let d = obj.as_dict().unwrap();
        let arr_obj = d.get(&Name::new("Array")).unwrap();
        let inner_arr = arr_obj.as_array().unwrap();

        assert_eq!(inner_arr.len(), 3);
        assert_eq!(inner_arr[0].as_int(), Some(1));
        assert_eq!(inner_arr[1].as_real(), Some(2.5));
    }
}
