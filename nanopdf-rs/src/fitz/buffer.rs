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

