//! Buffer - Dynamic byte array wrapper

use crate::fitz::error::{Error, Result};
use byteorder::{BigEndian, LittleEndian, WriteBytesExt};
use bytes::Bytes;
use std::fmt;
use std::io::{self, Cursor, Read, Write};
use std::sync::Arc;

#[derive(Clone)]
pub struct Buffer { inner: Arc<BufferInner> }

#[derive(Clone)]
struct BufferInner { data: Vec<u8>, unused_bits: u8 }

impl Buffer {
    pub fn new(capacity: usize) -> Self {
        Self { inner: Arc::new(BufferInner { data: Vec::with_capacity(capacity), unused_bits: 0 }) }
    }
    pub fn from_data(data: Vec<u8>) -> Self {
        Self { inner: Arc::new(BufferInner { data, unused_bits: 0 }) }
    }
    pub fn from_slice(data: &[u8]) -> Self { Self::from_data(data.to_vec()) }
    pub fn from_base64(data: &str) -> Result<Self> {
        use base64::Engine;
        let decoded = base64::engine::general_purpose::STANDARD.decode(data.as_bytes())
            .map_err(|e| Error::format(format!("Invalid base64: {}", e)))?;
        Ok(Self::from_data(decoded))
    }
    pub fn len(&self) -> usize { self.inner.data.len() }
    pub fn is_empty(&self) -> bool { self.inner.data.is_empty() }
    pub fn capacity(&self) -> usize { self.inner.data.capacity() }
    pub fn as_slice(&self) -> &[u8] { &self.inner.data }
    pub fn as_str(&self) -> Result<&str> {
        std::str::from_utf8(&self.inner.data).map_err(|e| Error::format(format!("Invalid UTF-8: {}", e)))
    }
    pub fn to_vec(&self) -> Vec<u8> { self.inner.data.clone() }
    fn make_mut(&mut self) -> &mut BufferInner { Arc::make_mut(&mut self.inner) }
    pub fn resize(&mut self, capacity: usize) { self.make_mut().data.resize(capacity, 0); }
    pub fn clear(&mut self) { let inner = self.make_mut(); inner.data.clear(); inner.unused_bits = 0; }
    pub fn append_data(&mut self, data: &[u8]) { self.make_mut().data.extend_from_slice(data); }
    pub fn append_byte(&mut self, byte: u8) { self.make_mut().data.push(byte); }
    pub fn append_string(&mut self, s: &str) { self.append_data(s.as_bytes()); }
    pub fn to_bytes(&self) -> Bytes { Bytes::copy_from_slice(&self.inner.data) }
    pub fn md5_digest(&self) -> [u8; 16] {
        use md5::{Digest, Md5};
        let mut hasher = Md5::new();
        hasher.update(&self.inner.data);
        hasher.finalize().into()
    }
    pub fn to_base64(&self) -> String {
        use base64::Engine;
        base64::engine::general_purpose::STANDARD.encode(&self.inner.data)
    }
}

impl Default for Buffer { fn default() -> Self { Self::new(0) } }
impl fmt::Debug for Buffer {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Buffer").field("len", &self.len()).finish()
    }
}
impl AsRef<[u8]> for Buffer { fn as_ref(&self) -> &[u8] { self.as_slice() } }
impl From<Vec<u8>> for Buffer { fn from(data: Vec<u8>) -> Self { Self::from_data(data) } }
impl From<&[u8]> for Buffer { fn from(data: &[u8]) -> Self { Self::from_slice(data) } }
impl From<&str> for Buffer { fn from(s: &str) -> Self { Self::from_slice(s.as_bytes()) } }

pub struct BufferReader { buffer: Buffer, position: usize }
impl BufferReader {
    pub fn new(buffer: Buffer) -> Self { Self { buffer, position: 0 } }
    pub fn position(&self) -> usize { self.position }
    pub fn remaining(&self) -> usize { self.buffer.len().saturating_sub(self.position) }
}
impl Read for BufferReader {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let data = self.buffer.as_slice();
        let remaining = &data[self.position..];
        let to_read = buf.len().min(remaining.len());
        buf[..to_read].copy_from_slice(&remaining[..to_read]);
        self.position += to_read;
        Ok(to_read)
    }
}

pub struct BufferWriter { buffer: Buffer }
impl BufferWriter {
    pub fn new() -> Self { Self { buffer: Buffer::new(256) } }
    pub fn into_buffer(self) -> Buffer { self.buffer }
    pub fn buffer(&self) -> &Buffer { &self.buffer }
}
impl Default for BufferWriter { fn default() -> Self { Self::new() } }
impl Write for BufferWriter {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> { self.buffer.append_data(buf); Ok(buf.len()) }
    fn flush(&mut self) -> io::Result<()> { Ok(()) }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Read, Write};

    // Buffer tests
    #[test]
    fn test_buffer_new() {
        let b = Buffer::new(100);
        assert_eq!(b.len(), 0);
        assert!(b.is_empty());
        assert!(b.capacity() >= 100);
    }

    #[test]
    fn test_buffer_from_data() {
        let data = vec![1, 2, 3, 4, 5];
        let b = Buffer::from_data(data.clone());
        assert_eq!(b.len(), 5);
        assert!(!b.is_empty());
        assert_eq!(b.as_slice(), &[1, 2, 3, 4, 5]);
    }

    #[test]
    fn test_buffer_from_slice() {
        let data = [1u8, 2, 3, 4, 5];
        let b = Buffer::from_slice(&data);
        assert_eq!(b.as_slice(), &data);
    }

    #[test]
    fn test_buffer_from_base64() {
        let b = Buffer::from_base64("SGVsbG8gV29ybGQ=").unwrap();
        assert_eq!(b.as_str().unwrap(), "Hello World");
    }

    #[test]
    fn test_buffer_from_base64_invalid() {
        let result = Buffer::from_base64("!!!invalid!!!");
        assert!(result.is_err());
    }

    #[test]
    fn test_buffer_as_str() {
        let b = Buffer::from_slice(b"Hello World");
        assert_eq!(b.as_str().unwrap(), "Hello World");
    }

    #[test]
    fn test_buffer_as_str_invalid_utf8() {
        let b = Buffer::from_slice(&[0xFF, 0xFE, 0x00, 0x01]);
        assert!(b.as_str().is_err());
    }

    #[test]
    fn test_buffer_to_vec() {
        let data = vec![1, 2, 3];
        let b = Buffer::from_data(data.clone());
        assert_eq!(b.to_vec(), data);
    }

    #[test]
    fn test_buffer_resize() {
        let mut b = Buffer::from_slice(&[1, 2, 3]);
        b.resize(5);
        assert_eq!(b.len(), 5);
        assert_eq!(b.as_slice(), &[1, 2, 3, 0, 0]);
    }

    #[test]
    fn test_buffer_clear() {
        let mut b = Buffer::from_slice(&[1, 2, 3]);
        b.clear();
        assert!(b.is_empty());
    }

    #[test]
    fn test_buffer_append_data() {
        let mut b = Buffer::from_slice(&[1, 2]);
        b.append_data(&[3, 4, 5]);
        assert_eq!(b.as_slice(), &[1, 2, 3, 4, 5]);
    }

    #[test]
    fn test_buffer_append_byte() {
        let mut b = Buffer::new(0);
        b.append_byte(0x42);
        assert_eq!(b.as_slice(), &[0x42]);
    }

    #[test]
    fn test_buffer_append_string() {
        let mut b = Buffer::new(0);
        b.append_string("Hello");
        assert_eq!(b.as_str().unwrap(), "Hello");
    }

    #[test]
    fn test_buffer_to_bytes() {
        let b = Buffer::from_slice(&[1, 2, 3]);
        let bytes = b.to_bytes();
        assert_eq!(&bytes[..], &[1, 2, 3]);
    }

    #[test]
    fn test_buffer_md5_digest() {
        let b = Buffer::from_slice(b"Hello World");
        let digest = b.md5_digest();
        // MD5("Hello World") = b10a8db164e0754105b7a99be72e3fe5
        assert_eq!(digest[0], 0xb1);
        assert_eq!(digest[1], 0x0a);
    }

    #[test]
    fn test_buffer_to_base64() {
        let b = Buffer::from_slice(b"Hello World");
        assert_eq!(b.to_base64(), "SGVsbG8gV29ybGQ=");
    }

    #[test]
    fn test_buffer_default() {
        let b: Buffer = Default::default();
        assert!(b.is_empty());
    }

    #[test]
    fn test_buffer_debug() {
        let b = Buffer::from_slice(&[1, 2, 3, 4, 5]);
        let debug = format!("{:?}", b);
        assert!(debug.contains("Buffer"));
        assert!(debug.contains("len"));
    }

    #[test]
    fn test_buffer_as_ref() {
        let b = Buffer::from_slice(&[1, 2, 3]);
        let slice: &[u8] = b.as_ref();
        assert_eq!(slice, &[1, 2, 3]);
    }

    #[test]
    fn test_buffer_from_vec() {
        let b: Buffer = vec![1, 2, 3].into();
        assert_eq!(b.as_slice(), &[1, 2, 3]);
    }

    #[test]
    fn test_buffer_from_slice_trait() {
        let data: &[u8] = &[1, 2, 3];
        let b: Buffer = data.into();
        assert_eq!(b.as_slice(), &[1, 2, 3]);
    }

    #[test]
    fn test_buffer_from_str() {
        let b: Buffer = "Hello".into();
        assert_eq!(b.as_str().unwrap(), "Hello");
    }

    // BufferReader tests
    #[test]
    fn test_buffer_reader_new() {
        let b = Buffer::from_slice(&[1, 2, 3, 4, 5]);
        let reader = BufferReader::new(b);
        assert_eq!(reader.position(), 0);
        assert_eq!(reader.remaining(), 5);
    }

    #[test]
    fn test_buffer_reader_read() {
        let b = Buffer::from_slice(&[1, 2, 3, 4, 5]);
        let mut reader = BufferReader::new(b);
        let mut buf = [0u8; 3];
        let n = reader.read(&mut buf).unwrap();
        assert_eq!(n, 3);
        assert_eq!(&buf, &[1, 2, 3]);
        assert_eq!(reader.position(), 3);
        assert_eq!(reader.remaining(), 2);
    }

    #[test]
    fn test_buffer_reader_read_all() {
        let b = Buffer::from_slice(&[1, 2, 3]);
        let mut reader = BufferReader::new(b);
        let mut buf = [0u8; 10];
        let n = reader.read(&mut buf).unwrap();
        assert_eq!(n, 3);
        let n2 = reader.read(&mut buf).unwrap();
        assert_eq!(n2, 0);
    }

    // BufferWriter tests
    #[test]
    fn test_buffer_writer_new() {
        let writer = BufferWriter::new();
        assert!(writer.buffer().is_empty());
    }

    #[test]
    fn test_buffer_writer_write() {
        let mut writer = BufferWriter::new();
        writer.write_all(&[1, 2, 3]).unwrap();
        assert_eq!(writer.buffer().as_slice(), &[1, 2, 3]);
    }

    #[test]
    fn test_buffer_writer_into_buffer() {
        let mut writer = BufferWriter::new();
        writer.write_all(b"Hello").unwrap();
        let b = writer.into_buffer();
        assert_eq!(b.as_str().unwrap(), "Hello");
    }

    #[test]
    fn test_buffer_writer_default() {
        let writer: BufferWriter = Default::default();
        assert!(writer.buffer().is_empty());
    }

    #[test]
    fn test_buffer_writer_flush() {
        let mut writer = BufferWriter::new();
        // flush should always succeed and do nothing
        assert!(writer.flush().is_ok());
    }

    // Clone behavior tests
    #[test]
    fn test_buffer_clone_cow_semantics() {
        let b1 = Buffer::from_slice(&[1, 2, 3]);
        let mut b2 = b1.clone();
        b2.append_byte(4);
        // b1 should be unchanged due to Arc clone-on-write
        assert_eq!(b1.as_slice(), &[1, 2, 3]);
        assert_eq!(b2.as_slice(), &[1, 2, 3, 4]);
    }
}

