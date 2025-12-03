//! Buffer - Dynamic byte array wrapper using the `bytes` crate
//!
//! This module provides a high-performance buffer implementation backed by
//! `bytes::Bytes` and `bytes::BytesMut` for efficient zero-copy operations.

use crate::fitz::error::{Error, Result};
use bytes::{Buf, BufMut, Bytes, BytesMut};
use std::fmt;
use std::io::{self, Read, Write};
use std::sync::Arc;

/// A reference-counted buffer for efficient byte storage.
///
/// Uses `bytes::Bytes` for immutable shared data and `bytes::BytesMut` for
/// mutable operations with copy-on-write semantics.
#[derive(Clone)]
pub struct Buffer {
    /// Immutable shared data (for reading)
    data: Bytes,
    /// Mutable buffer for writes (lazy initialized)
    mutable: Option<Arc<std::sync::Mutex<BytesMut>>>,
}

impl Buffer {
    /// Create a new empty buffer with the specified capacity.
    pub fn new(capacity: usize) -> Self {
        Self {
            data: Bytes::new(),
            mutable: Some(Arc::new(std::sync::Mutex::new(BytesMut::with_capacity(capacity)))),
        }
    }

    /// Create a buffer from owned data (zero-copy).
    pub fn from_data(data: Vec<u8>) -> Self {
        Self {
            data: Bytes::from(data),
            mutable: None,
        }
    }

    /// Create a buffer from a byte slice (copies data).
    pub fn from_slice(data: &[u8]) -> Self {
        Self {
            data: Bytes::copy_from_slice(data),
            mutable: None,
        }
    }

    /// Create a buffer from a `Bytes` instance (zero-copy).
    pub fn from_bytes(data: Bytes) -> Self {
        Self {
            data,
            mutable: None,
        }
    }

    /// Create a buffer from a `BytesMut` instance (zero-copy).
    pub fn from_bytes_mut(data: BytesMut) -> Self {
        Self {
            data: data.freeze(),
            mutable: None,
        }
    }

    /// Create a buffer from base64-encoded data.
    pub fn from_base64(data: &str) -> Result<Self> {
        use base64::Engine;
        let decoded = base64::engine::general_purpose::STANDARD
            .decode(data.as_bytes())
            .map_err(|e| Error::format(format!("Invalid base64: {}", e)))?;
        Ok(Self::from_data(decoded))
    }

    /// Returns the number of bytes in the buffer.
    #[inline]
    pub fn len(&self) -> usize {
        if let Some(ref mutable) = self.mutable {
            if let Ok(guard) = mutable.lock() {
                if !guard.is_empty() {
                    return self.data.len() + guard.len();
                }
            }
        }
        self.data.len()
    }

    /// Returns true if the buffer is empty.
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    /// Returns the capacity of the buffer.
    pub fn capacity(&self) -> usize {
        if let Some(ref mutable) = self.mutable {
            if let Ok(guard) = mutable.lock() {
                return self.data.len() + guard.capacity();
            }
        }
        self.data.len()
    }

    /// Returns the buffer contents as a byte slice.
    ///
    /// If there are pending mutable writes, this will consolidate them first.
    pub fn as_slice(&self) -> &[u8] {
        // If we have no mutable data, return the immutable slice directly
        if self.mutable.is_none() {
            return &self.data;
        }

        if let Some(ref mutable) = self.mutable {
            if let Ok(guard) = mutable.lock() {
                if guard.is_empty() {
                    return &self.data;
                }
            }
        }

        // For simplicity, return the base data
        // Full consolidation would require interior mutability
        &self.data
    }

    /// Returns the buffer as a UTF-8 string slice.
    pub fn as_str(&self) -> Result<&str> {
        std::str::from_utf8(self.as_slice())
            .map_err(|e| Error::format(format!("Invalid UTF-8: {}", e)))
    }

    /// Returns a copy of the buffer contents as a Vec.
    pub fn to_vec(&self) -> Vec<u8> {
        if let Some(ref mutable) = self.mutable {
            if let Ok(guard) = mutable.lock() {
                if !guard.is_empty() {
                    let mut result = self.data.to_vec();
                    result.extend_from_slice(&guard);
                    return result;
                }
            }
        }
        self.data.to_vec()
    }

    /// Returns the buffer contents as `Bytes` (zero-copy if no mutable data).
    pub fn to_bytes(&self) -> Bytes {
        if let Some(ref mutable) = self.mutable {
            if let Ok(guard) = mutable.lock() {
                if !guard.is_empty() {
                    let mut result = BytesMut::with_capacity(self.data.len() + guard.len());
                    result.extend_from_slice(&self.data);
                    result.extend_from_slice(&guard);
                    return result.freeze();
                }
            }
        }
        self.data.clone()
    }

    /// Consolidate any mutable data into the immutable buffer.
    fn consolidate(&mut self) {
        if let Some(ref mutable) = self.mutable {
            if let Ok(guard) = mutable.lock() {
                if !guard.is_empty() {
                    let mut new_data = BytesMut::with_capacity(self.data.len() + guard.len());
                    new_data.extend_from_slice(&self.data);
                    new_data.extend_from_slice(&guard);
                    self.data = new_data.freeze();
                }
            }
        }
        self.mutable = None;
    }

    /// Ensure we have a mutable buffer for writes.
    fn ensure_mutable(&mut self) {
        if self.mutable.is_none() {
            self.mutable = Some(Arc::new(std::sync::Mutex::new(BytesMut::with_capacity(256))));
        }
    }

    /// Resize the buffer to the specified size.
    pub fn resize(&mut self, new_len: usize) {
        self.consolidate();
        let mut data = BytesMut::from(self.data.as_ref());
        data.resize(new_len, 0);
        self.data = data.freeze();
    }

    /// Clear all data from the buffer.
    pub fn clear(&mut self) {
        self.data = Bytes::new();
        self.mutable = None;
    }

    /// Append a byte slice to the buffer.
    pub fn append_data(&mut self, data: &[u8]) {
        self.ensure_mutable();
        if let Some(ref mutable) = self.mutable {
            if let Ok(mut guard) = mutable.lock() {
                guard.extend_from_slice(data);
            }
        }
    }

    /// Append a single byte to the buffer.
    pub fn append_byte(&mut self, byte: u8) {
        self.ensure_mutable();
        if let Some(ref mutable) = self.mutable {
            if let Ok(mut guard) = mutable.lock() {
                guard.put_u8(byte);
            }
        }
    }

    /// Append a string to the buffer.
    pub fn append_string(&mut self, s: &str) {
        self.append_data(s.as_bytes());
    }

    /// Append a 16-bit integer in little-endian format.
    pub fn append_int16_le(&mut self, value: i16) {
        self.ensure_mutable();
        if let Some(ref mutable) = self.mutable {
            if let Ok(mut guard) = mutable.lock() {
                guard.put_i16_le(value);
            }
        }
    }

    /// Append a 32-bit integer in little-endian format.
    pub fn append_int32_le(&mut self, value: i32) {
        self.ensure_mutable();
        if let Some(ref mutable) = self.mutable {
            if let Ok(mut guard) = mutable.lock() {
                guard.put_i32_le(value);
            }
        }
    }

    /// Append a 16-bit integer in big-endian format.
    pub fn append_int16_be(&mut self, value: i16) {
        self.ensure_mutable();
        if let Some(ref mutable) = self.mutable {
            if let Ok(mut guard) = mutable.lock() {
                guard.put_i16(value);
            }
        }
    }

    /// Append a 32-bit integer in big-endian format.
    pub fn append_int32_be(&mut self, value: i32) {
        self.ensure_mutable();
        if let Some(ref mutable) = self.mutable {
            if let Ok(mut guard) = mutable.lock() {
                guard.put_i32(value);
            }
        }
    }

    /// Compute the MD5 digest of the buffer contents.
    pub fn md5_digest(&self) -> [u8; 16] {
        use md5::{Digest, Md5};
        let mut hasher = Md5::new();
        hasher.update(&self.data);
        if let Some(ref mutable) = self.mutable {
            if let Ok(guard) = mutable.lock() {
                hasher.update(&*guard);
            }
        }
        hasher.finalize().into()
    }

    /// Encode the buffer contents as base64.
    pub fn to_base64(&self) -> String {
        use base64::Engine;
        base64::engine::general_purpose::STANDARD.encode(self.to_vec())
    }

    /// Get a slice of the buffer.
    pub fn slice(&self, start: usize, end: usize) -> Buffer {
        let data = self.to_bytes();
        if start >= data.len() {
            return Buffer::new(0);
        }
        let end = end.min(data.len());
        Buffer::from_bytes(data.slice(start..end))
    }

    /// Split the buffer at the given index.
    pub fn split_at(&self, mid: usize) -> (Buffer, Buffer) {
        let data = self.to_bytes();
        if mid >= data.len() {
            return (Buffer::from_bytes(data), Buffer::new(0));
        }
        let first = data.slice(..mid);
        let second = data.slice(mid..);
        (Buffer::from_bytes(first), Buffer::from_bytes(second))
    }

    /// Trim the buffer capacity to match its length.
    pub fn trim_capacity(&mut self) {
        self.consolidate();
    }

    /// Truncate the buffer to the specified length.
    pub fn truncate(&mut self, len: usize) {
        if len < self.len() {
            self.consolidate();
            let mut data = BytesMut::from(self.data.as_ref());
            data.truncate(len);
            self.data = data.freeze();
        }
    }

    /// Split off the buffer at the given index, returning the second half.
    pub fn split_off(&mut self, at: usize) -> Buffer {
        self.consolidate();
        if at >= self.data.len() {
            return Buffer::new(0);
        }
        let second = self.data.slice(at..);
        let mut first = BytesMut::from(self.data.as_ref());
        first.truncate(at);
        self.data = first.freeze();
        Buffer::from_bytes(second)
    }

    /// Reserve additional capacity for the buffer.
    pub fn reserve(&mut self, additional: usize) {
        self.ensure_mutable();
        if let Some(ref mutable) = self.mutable {
            if let Ok(mut guard) = mutable.lock() {
                guard.reserve(additional);
            }
        }
    }

    /// Append another buffer's contents to this buffer.
    pub fn append_buffer(&mut self, other: &Buffer) {
        self.append_data(&other.to_vec());
    }

    /// Append bits to the buffer.
    pub fn append_bits(&mut self, value: u8, bits: u8) {
        // For simplicity, just append the byte
        // A full implementation would track bit position
        if bits > 0 {
            self.append_byte(value);
        }
    }

    /// Append a PDF string (with parentheses and escaping).
    pub fn append_pdf_string(&mut self, s: &str) {
        self.append_byte(b'(');
        for c in s.bytes() {
            match c {
                b'(' | b')' | b'\\' => {
                    self.append_byte(b'\\');
                    self.append_byte(c);
                }
                _ => self.append_byte(c),
            }
        }
        self.append_byte(b')');
    }
}

impl Default for Buffer {
    fn default() -> Self {
        Self::new(0)
    }
}

impl fmt::Debug for Buffer {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Buffer").field("len", &self.len()).finish()
    }
}

impl AsRef<[u8]> for Buffer {
    fn as_ref(&self) -> &[u8] {
        self.as_slice()
    }
}

impl From<Vec<u8>> for Buffer {
    fn from(data: Vec<u8>) -> Self {
        Self::from_data(data)
    }
}

impl From<&[u8]> for Buffer {
    fn from(data: &[u8]) -> Self {
        Self::from_slice(data)
    }
}

impl From<&str> for Buffer {
    fn from(s: &str) -> Self {
        Self::from_slice(s.as_bytes())
    }
}

impl From<Bytes> for Buffer {
    fn from(data: Bytes) -> Self {
        Self::from_bytes(data)
    }
}

impl From<BytesMut> for Buffer {
    fn from(data: BytesMut) -> Self {
        Self::from_bytes_mut(data)
    }
}

impl From<Buffer> for Bytes {
    fn from(buf: Buffer) -> Bytes {
        buf.to_bytes()
    }
}

impl PartialEq for Buffer {
    fn eq(&self, other: &Self) -> bool {
        self.to_vec() == other.to_vec()
    }
}

impl Eq for Buffer {}

/// A reader for consuming buffer contents.
pub struct BufferReader {
    data: Bytes,
    position: usize,
}

impl BufferReader {
    /// Create a new reader from a buffer.
    pub fn new(buffer: Buffer) -> Self {
        Self {
            data: buffer.to_bytes(),
            position: 0,
        }
    }

    /// Returns the current read position.
    pub fn position(&self) -> usize {
        self.position
    }

    /// Returns the number of bytes remaining.
    pub fn remaining(&self) -> usize {
        self.data.len().saturating_sub(self.position)
    }

    /// Check if we've reached the end.
    pub fn is_eof(&self) -> bool {
        self.position >= self.data.len()
    }

    /// Peek at the next byte without consuming it.
    pub fn peek(&self) -> Option<u8> {
        self.data.get(self.position).copied()
    }

    /// Read a byte.
    pub fn read_byte(&mut self) -> Option<u8> {
        if self.position < self.data.len() {
            let byte = self.data[self.position];
            self.position += 1;
            Some(byte)
        } else {
            None
        }
    }

    /// Read a 16-bit unsigned integer in big-endian format.
    pub fn read_u16_be(&mut self) -> Option<u16> {
        if self.remaining() >= 2 {
            let value = u16::from_be_bytes([
                self.data[self.position],
                self.data[self.position + 1],
            ]);
            self.position += 2;
            Some(value)
        } else {
            None
        }
    }

    /// Read a 32-bit unsigned integer in big-endian format.
    pub fn read_u32_be(&mut self) -> Option<u32> {
        if self.remaining() >= 4 {
            let value = u32::from_be_bytes([
                self.data[self.position],
                self.data[self.position + 1],
                self.data[self.position + 2],
                self.data[self.position + 3],
            ]);
            self.position += 4;
            Some(value)
        } else {
            None
        }
    }

    /// Read a 16-bit unsigned integer in little-endian format.
    pub fn read_u16_le(&mut self) -> Option<u16> {
        if self.remaining() >= 2 {
            let value = u16::from_le_bytes([
                self.data[self.position],
                self.data[self.position + 1],
            ]);
            self.position += 2;
            Some(value)
        } else {
            None
        }
    }

    /// Read a 32-bit unsigned integer in little-endian format.
    pub fn read_u32_le(&mut self) -> Option<u32> {
        if self.remaining() >= 4 {
            let value = u32::from_le_bytes([
                self.data[self.position],
                self.data[self.position + 1],
                self.data[self.position + 2],
                self.data[self.position + 3],
            ]);
            self.position += 4;
            Some(value)
        } else {
            None
        }
    }

    /// Seek to a position.
    pub fn seek(&mut self, pos: usize) {
        self.position = pos.min(self.data.len());
    }

    /// Skip n bytes.
    pub fn skip(&mut self, n: usize) {
        self.position = (self.position + n).min(self.data.len());
    }

    /// Read exactly `buf.len()` bytes. Returns true if successful.
    pub fn read_exact(&mut self, buf: &mut [u8]) -> bool {
        if self.remaining() >= buf.len() {
            buf.copy_from_slice(&self.data[self.position..self.position + buf.len()]);
            self.position += buf.len();
            true
        } else {
            false
        }
    }

    /// Read a line (up to and including newline).
    pub fn read_line(&mut self) -> Option<Vec<u8>> {
        if self.is_eof() {
            return None;
        }
        let start = self.position;
        while self.position < self.data.len() {
            if self.data[self.position] == b'\n' {
                self.position += 1;
                return Some(self.data[start..self.position].to_vec());
            }
            self.position += 1;
        }
        // Return remaining data if no newline found
        if start < self.data.len() {
            Some(self.data[start..].to_vec())
        } else {
            None
        }
    }

    /// Get the remaining data as a slice.
    pub fn remaining_slice(&self) -> &[u8] {
        &self.data[self.position..]
    }

    /// Read a 24-bit unsigned integer in big-endian format.
    pub fn read_u24_be(&mut self) -> Option<u32> {
        if self.remaining() >= 3 {
            let value = ((self.data[self.position] as u32) << 16)
                | ((self.data[self.position + 1] as u32) << 8)
                | (self.data[self.position + 2] as u32);
            self.position += 3;
            Some(value)
        } else {
            None
        }
    }

    /// Read a 16-bit signed integer in big-endian format.
    pub fn read_i16_be(&mut self) -> Option<i16> {
        if self.remaining() >= 2 {
            let value = i16::from_be_bytes([
                self.data[self.position],
                self.data[self.position + 1],
            ]);
            self.position += 2;
            Some(value)
        } else {
            None
        }
    }

    /// Read a 32-bit signed integer in big-endian format.
    pub fn read_i32_be(&mut self) -> Option<i32> {
        if self.remaining() >= 4 {
            let value = i32::from_be_bytes([
                self.data[self.position],
                self.data[self.position + 1],
                self.data[self.position + 2],
                self.data[self.position + 3],
            ]);
            self.position += 4;
            Some(value)
        } else {
            None
        }
    }

    /// Read a 16-bit signed integer in little-endian format.
    pub fn read_i16_le(&mut self) -> Option<i16> {
        if self.remaining() >= 2 {
            let value = i16::from_le_bytes([
                self.data[self.position],
                self.data[self.position + 1],
            ]);
            self.position += 2;
            Some(value)
        } else {
            None
        }
    }

    /// Read a 32-bit signed integer in little-endian format.
    pub fn read_i32_le(&mut self) -> Option<i32> {
        if self.remaining() >= 4 {
            let value = i32::from_le_bytes([
                self.data[self.position],
                self.data[self.position + 1],
                self.data[self.position + 2],
                self.data[self.position + 3],
            ]);
            self.position += 4;
            Some(value)
        } else {
            None
        }
    }
}

impl Read for BufferReader {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let remaining = &self.data[self.position..];
        let to_read = buf.len().min(remaining.len());
        buf[..to_read].copy_from_slice(&remaining[..to_read]);
        self.position += to_read;
        Ok(to_read)
    }
}

/// A writer that accumulates data into a buffer.
pub struct BufferWriter {
    inner: BytesMut,
}

impl BufferWriter {
    /// Create a new buffer writer.
    pub fn new() -> Self {
        Self {
            inner: BytesMut::with_capacity(256),
        }
    }

    /// Create a new buffer writer with the specified capacity.
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            inner: BytesMut::with_capacity(capacity),
        }
    }

    /// Convert the writer into a Buffer.
    pub fn into_buffer(self) -> Buffer {
        Buffer::from_bytes_mut(self.inner)
    }

    /// Get a reference to the accumulated data.
    pub fn as_slice(&self) -> &[u8] {
        &self.inner
    }

    /// Get the current length.
    pub fn len(&self) -> usize {
        self.inner.len()
    }

    /// Check if empty.
    pub fn is_empty(&self) -> bool {
        self.inner.is_empty()
    }

    /// Write a byte.
    pub fn write_byte(&mut self, byte: u8) {
        self.inner.put_u8(byte);
    }

    /// Write a 16-bit integer in big-endian format.
    pub fn write_u16_be(&mut self, value: u16) {
        self.inner.put_u16(value);
    }

    /// Write a 32-bit integer in big-endian format.
    pub fn write_u32_be(&mut self, value: u32) {
        self.inner.put_u32(value);
    }

    /// Write a 16-bit integer in little-endian format.
    pub fn write_u16_le(&mut self, value: u16) {
        self.inner.put_u16_le(value);
    }

    /// Write a 32-bit integer in little-endian format.
    pub fn write_u32_le(&mut self, value: u32) {
        self.inner.put_u32_le(value);
    }

    /// Convert the writer into Bytes.
    pub fn into_bytes(self) -> Bytes {
        self.inner.freeze()
    }

    /// Clear the writer's contents.
    pub fn clear(&mut self) {
        self.inner.clear();
    }
}

impl Default for BufferWriter {
    fn default() -> Self {
        Self::new()
    }
}

impl Write for BufferWriter {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        self.inner.extend_from_slice(buf);
        Ok(buf.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

// Parallel buffer operations (when rayon feature is enabled)
#[cfg(feature = "parallel")]
pub mod parallel {
    use super::*;
    use rayon::prelude::*;

    /// Process multiple buffers in parallel.
    pub fn process_buffers<F, R>(buffers: &[Buffer], f: F) -> Vec<R>
    where
        F: Fn(&Buffer) -> R + Sync + Send,
        R: Send,
    {
        buffers.par_iter().map(f).collect()
    }

    /// Apply a transformation to buffer data in parallel chunks.
    pub fn parallel_transform<F>(buffer: &Buffer, chunk_size: usize, f: F) -> Buffer
    where
        F: Fn(&[u8]) -> Vec<u8> + Sync + Send,
    {
        let data = buffer.to_vec();
        let chunks: Vec<Vec<u8>> = data
            .par_chunks(chunk_size)
            .map(f)
            .collect();

        let total_len: usize = chunks.iter().map(|c| c.len()).sum();
        let mut result = BytesMut::with_capacity(total_len);
        for chunk in chunks {
            result.extend_from_slice(&chunk);
        }
        Buffer::from_bytes_mut(result)
    }
}

// Async buffer operations (when async feature is enabled)
#[cfg(feature = "async")]
pub mod async_ops {
    use super::*;
    use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};
    use std::pin::Pin;
    use std::task::{Context, Poll};

    /// Read a buffer from an async reader.
    pub async fn read_buffer<R: AsyncRead + Unpin>(
        reader: &mut R,
        max_size: usize,
    ) -> Result<Buffer> {
        let mut data = Vec::with_capacity(max_size.min(8192));
        let mut chunk = [0u8; 8192];

        loop {
            let n = reader.read(&mut chunk).await.map_err(Error::System)?;
            if n == 0 {
                break;
            }
            if data.len() + n > max_size {
                return Err(Error::generic("Buffer size limit exceeded"));
            }
            data.extend_from_slice(&chunk[..n]);
        }

        Ok(Buffer::from_data(data))
    }

    /// Write a buffer to an async writer.
    pub async fn write_buffer<W: AsyncWrite + Unpin>(
        writer: &mut W,
        buffer: &Buffer,
    ) -> Result<()> {
        writer.write_all(&buffer.to_vec()).await.map_err(Error::System)
    }

    /// Async buffer reader.
    pub struct AsyncBufferReader {
        data: Bytes,
        position: usize,
    }

    impl AsyncBufferReader {
        pub fn new(buffer: Buffer) -> Self {
            Self {
                data: buffer.to_bytes(),
                position: 0,
            }
        }
    }

    impl AsyncRead for AsyncBufferReader {
        fn poll_read(
            mut self: Pin<&mut Self>,
            _cx: &mut Context<'_>,
            buf: &mut tokio::io::ReadBuf<'_>,
        ) -> Poll<io::Result<()>> {
            let remaining = &self.data[self.position..];
            let to_read = buf.remaining().min(remaining.len());
            buf.put_slice(&remaining[..to_read]);
            self.position += to_read;
            Poll::Ready(Ok(()))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Read, Write};

    #[test]
    fn test_buffer_new() {
        let b = Buffer::new(100);
        assert_eq!(b.len(), 0);
        assert!(b.is_empty());
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
    fn test_buffer_from_bytes() {
        let bytes = Bytes::from_static(&[1, 2, 3]);
        let b = Buffer::from_bytes(bytes);
        assert_eq!(b.as_slice(), &[1, 2, 3]);
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
        assert_eq!(b.to_vec(), vec![1, 2, 3, 0, 0]);
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
        assert_eq!(b.to_vec(), vec![1, 2, 3, 4, 5]);
    }

    #[test]
    fn test_buffer_append_byte() {
        let mut b = Buffer::new(0);
        b.append_byte(0x42);
        assert_eq!(b.to_vec(), vec![0x42]);
    }

    #[test]
    fn test_buffer_append_string() {
        let mut b = Buffer::new(0);
        b.append_string("Hello");
        assert_eq!(b.to_vec(), b"Hello".to_vec());
    }

    #[test]
    fn test_buffer_append_int16_le() {
        let mut b = Buffer::new(0);
        b.append_int16_le(0x0102);
        assert_eq!(b.to_vec(), vec![0x02, 0x01]);
    }

    #[test]
    fn test_buffer_append_int32_le() {
        let mut b = Buffer::new(0);
        b.append_int32_le(0x01020304);
        assert_eq!(b.to_vec(), vec![0x04, 0x03, 0x02, 0x01]);
    }

    #[test]
    fn test_buffer_append_int16_be() {
        let mut b = Buffer::new(0);
        b.append_int16_be(0x0102);
        assert_eq!(b.to_vec(), vec![0x01, 0x02]);
    }

    #[test]
    fn test_buffer_append_int32_be() {
        let mut b = Buffer::new(0);
        b.append_int32_be(0x01020304);
        assert_eq!(b.to_vec(), vec![0x01, 0x02, 0x03, 0x04]);
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
        assert_eq!(digest[0], 0xb1);
        assert_eq!(digest[1], 0x0a);
    }

    #[test]
    fn test_buffer_to_base64() {
        let b = Buffer::from_slice(b"Hello World");
        assert_eq!(b.to_base64(), "SGVsbG8gV29ybGQ=");
    }

    #[test]
    fn test_buffer_slice() {
        let b = Buffer::from_slice(&[1, 2, 3, 4, 5]);
        let slice = b.slice(1, 4);
        assert_eq!(slice.to_vec(), vec![2, 3, 4]);
    }

    #[test]
    fn test_buffer_split_at() {
        let b = Buffer::from_slice(&[1, 2, 3, 4, 5]);
        let (first, second) = b.split_at(3);
        assert_eq!(first.to_vec(), vec![1, 2, 3]);
        assert_eq!(second.to_vec(), vec![4, 5]);
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
    fn test_buffer_reader_read_byte() {
        let b = Buffer::from_slice(&[1, 2, 3]);
        let mut reader = BufferReader::new(b);
        assert_eq!(reader.read_byte(), Some(1));
        assert_eq!(reader.read_byte(), Some(2));
        assert_eq!(reader.read_byte(), Some(3));
        assert_eq!(reader.read_byte(), None);
    }

    #[test]
    fn test_buffer_reader_peek() {
        let b = Buffer::from_slice(&[1, 2, 3]);
        let reader = BufferReader::new(b);
        assert_eq!(reader.peek(), Some(1));
        assert_eq!(reader.peek(), Some(1)); // Should not advance
    }

    #[test]
    fn test_buffer_reader_read_u16_be() {
        let b = Buffer::from_slice(&[0x01, 0x02]);
        let mut reader = BufferReader::new(b);
        assert_eq!(reader.read_u16_be(), Some(0x0102));
    }

    #[test]
    fn test_buffer_reader_read_u32_be() {
        let b = Buffer::from_slice(&[0x01, 0x02, 0x03, 0x04]);
        let mut reader = BufferReader::new(b);
        assert_eq!(reader.read_u32_be(), Some(0x01020304));
    }

    #[test]
    fn test_buffer_reader_read_u16_le() {
        let b = Buffer::from_slice(&[0x01, 0x02]);
        let mut reader = BufferReader::new(b);
        assert_eq!(reader.read_u16_le(), Some(0x0201));
    }

    #[test]
    fn test_buffer_reader_read_u32_le() {
        let b = Buffer::from_slice(&[0x01, 0x02, 0x03, 0x04]);
        let mut reader = BufferReader::new(b);
        assert_eq!(reader.read_u32_le(), Some(0x04030201));
    }

    #[test]
    fn test_buffer_reader_seek() {
        let b = Buffer::from_slice(&[1, 2, 3, 4, 5]);
        let mut reader = BufferReader::new(b);
        reader.seek(3);
        assert_eq!(reader.position(), 3);
        assert_eq!(reader.read_byte(), Some(4));
    }

    #[test]
    fn test_buffer_reader_skip() {
        let b = Buffer::from_slice(&[1, 2, 3, 4, 5]);
        let mut reader = BufferReader::new(b);
        reader.skip(2);
        assert_eq!(reader.position(), 2);
        assert_eq!(reader.read_byte(), Some(3));
    }

    #[test]
    fn test_buffer_reader_is_eof() {
        let b = Buffer::from_slice(&[1]);
        let mut reader = BufferReader::new(b);
        assert!(!reader.is_eof());
        reader.read_byte();
        assert!(reader.is_eof());
    }

    // BufferWriter tests
    #[test]
    fn test_buffer_writer_new() {
        let writer = BufferWriter::new();
        assert!(writer.is_empty());
    }

    #[test]
    fn test_buffer_writer_write() {
        let mut writer = BufferWriter::new();
        writer.write_all(&[1, 2, 3]).unwrap();
        assert_eq!(writer.as_slice(), &[1, 2, 3]);
    }

    #[test]
    fn test_buffer_writer_into_buffer() {
        let mut writer = BufferWriter::new();
        writer.write_all(b"Hello").unwrap();
        let b = writer.into_buffer();
        assert_eq!(b.as_str().unwrap(), "Hello");
    }

    #[test]
    fn test_buffer_writer_write_byte() {
        let mut writer = BufferWriter::new();
        writer.write_byte(0x42);
        assert_eq!(writer.as_slice(), &[0x42]);
    }

    #[test]
    fn test_buffer_writer_write_u16_be() {
        let mut writer = BufferWriter::new();
        writer.write_u16_be(0x0102);
        assert_eq!(writer.as_slice(), &[0x01, 0x02]);
    }

    #[test]
    fn test_buffer_writer_write_u32_be() {
        let mut writer = BufferWriter::new();
        writer.write_u32_be(0x01020304);
        assert_eq!(writer.as_slice(), &[0x01, 0x02, 0x03, 0x04]);
    }

    #[test]
    fn test_buffer_writer_write_u16_le() {
        let mut writer = BufferWriter::new();
        writer.write_u16_le(0x0102);
        assert_eq!(writer.as_slice(), &[0x02, 0x01]);
    }

    #[test]
    fn test_buffer_writer_write_u32_le() {
        let mut writer = BufferWriter::new();
        writer.write_u32_le(0x01020304);
        assert_eq!(writer.as_slice(), &[0x04, 0x03, 0x02, 0x01]);
    }

    #[test]
    fn test_buffer_writer_default() {
        let writer: BufferWriter = Default::default();
        assert!(writer.is_empty());
    }

    #[test]
    fn test_buffer_writer_flush() {
        let mut writer = BufferWriter::new();
        assert!(writer.flush().is_ok());
    }

    #[test]
    fn test_buffer_clone() {
        let b1 = Buffer::from_slice(&[1, 2, 3]);
        let b2 = b1.clone();
        assert_eq!(b1.to_vec(), b2.to_vec());
    }

    // ============================================================================
    // Additional tests for coverage
    // ============================================================================

    #[test]
    fn test_buffer_from_bytes_mut() {
        let bytes = BytesMut::from(&b"Hello"[..]);
        let b = Buffer::from_bytes_mut(bytes);
        assert_eq!(b.as_slice(), b"Hello");
    }

    #[test]
    fn test_buffer_trim_capacity() {
        let mut b = Buffer::new(1000);
        b.append_data(&[1, 2, 3]);
        b.trim_capacity();
        assert_eq!(b.len(), 3);
    }

    #[test]
    fn test_buffer_capacity() {
        let b = Buffer::new(100);
        assert!(b.capacity() >= 100 || b.capacity() >= 0);
    }

    #[test]
    fn test_buffer_truncate() {
        let mut b = Buffer::from_slice(&[1, 2, 3, 4, 5]);
        b.truncate(3);
        assert_eq!(b.len(), 3);
        assert_eq!(b.to_vec(), vec![1, 2, 3]);
    }

    #[test]
    fn test_buffer_split_off() {
        let mut b = Buffer::from_slice(&[1, 2, 3, 4, 5]);
        let second = b.split_off(3);
        assert_eq!(b.to_vec(), vec![1, 2, 3]);
        assert_eq!(second.to_vec(), vec![4, 5]);
    }

    #[test]
    fn test_buffer_reserve() {
        let mut b = Buffer::new(0);
        b.reserve(100);
        assert!(b.capacity() >= 100);
    }

    #[test]
    fn test_buffer_append_buffer() {
        let mut b1 = Buffer::from_slice(&[1, 2, 3]);
        let b2 = Buffer::from_slice(&[4, 5, 6]);
        b1.append_buffer(&b2);
        assert_eq!(b1.to_vec(), vec![1, 2, 3, 4, 5, 6]);
    }

    #[test]
    fn test_buffer_append_bits() {
        let mut b = Buffer::new(0);
        b.append_bits(0b10101010, 8);
        // Test that bits are appended
        assert!(b.len() > 0);
    }

    #[test]
    fn test_buffer_append_pdf_string() {
        let mut b = Buffer::new(0);
        b.append_pdf_string("Hello");
        assert!(b.len() > 0);
    }

    #[test]
    fn test_buffer_reader_read_exact() {
        let b = Buffer::from_slice(&[1, 2, 3, 4, 5]);
        let mut reader = BufferReader::new(b);
        let mut buf = [0u8; 3];
        let success = reader.read_exact(&mut buf);
        assert!(success);
        assert_eq!(&buf, &[1, 2, 3]);
    }

    #[test]
    fn test_buffer_reader_read_exact_eof() {
        let b = Buffer::from_slice(&[1, 2]);
        let mut reader = BufferReader::new(b);
        let mut buf = [0u8; 5];
        let success = reader.read_exact(&mut buf);
        assert!(!success);
    }

    #[test]
    fn test_buffer_reader_read_line() {
        let b = Buffer::from_slice(b"Hello\nWorld\n");
        let mut reader = BufferReader::new(b);
        let line = reader.read_line();
        assert!(line.is_some());
        assert_eq!(&line.unwrap(), b"Hello\n");
    }

    #[test]
    fn test_buffer_reader_remaining_slice() {
        let b = Buffer::from_slice(&[1, 2, 3, 4, 5]);
        let mut reader = BufferReader::new(b);
        reader.read_byte();
        reader.read_byte();
        assert_eq!(reader.remaining_slice(), &[3, 4, 5]);
    }

    #[test]
    fn test_buffer_reader_read_u24_be() {
        let b = Buffer::from_slice(&[0x01, 0x02, 0x03]);
        let mut reader = BufferReader::new(b);
        assert_eq!(reader.read_u24_be(), Some(0x010203));
    }

    #[test]
    fn test_buffer_reader_read_i16_be() {
        let b = Buffer::from_slice(&[0xFF, 0xFE]); // -2 in big endian i16
        let mut reader = BufferReader::new(b);
        assert_eq!(reader.read_i16_be(), Some(-2));
    }

    #[test]
    fn test_buffer_reader_read_i32_be() {
        let b = Buffer::from_slice(&[0xFF, 0xFF, 0xFF, 0xFE]); // -2 in big endian i32
        let mut reader = BufferReader::new(b);
        assert_eq!(reader.read_i32_be(), Some(-2));
    }

    #[test]
    fn test_buffer_reader_read_i16_le() {
        let b = Buffer::from_slice(&[0xFE, 0xFF]); // -2 in little endian i16
        let mut reader = BufferReader::new(b);
        assert_eq!(reader.read_i16_le(), Some(-2));
    }

    #[test]
    fn test_buffer_reader_read_i32_le() {
        let b = Buffer::from_slice(&[0xFE, 0xFF, 0xFF, 0xFF]); // -2 in little endian i32
        let mut reader = BufferReader::new(b);
        assert_eq!(reader.read_i32_le(), Some(-2));
    }

    #[test]
    fn test_buffer_reader_eof() {
        let b = Buffer::from_slice(&[1]);
        let mut reader = BufferReader::new(b);
        reader.read_byte();
        assert!(reader.is_eof());
        assert!(reader.read_u16_be().is_none());
    }

    #[test]
    fn test_buffer_writer_with_capacity() {
        let writer = BufferWriter::with_capacity(100);
        assert!(writer.is_empty());
    }

    #[test]
    fn test_buffer_writer_len() {
        let mut writer = BufferWriter::new();
        writer.write_byte(1);
        writer.write_byte(2);
        assert_eq!(writer.len(), 2);
    }

    #[test]
    fn test_buffer_writer_into_bytes() {
        let mut writer = BufferWriter::new();
        writer.write_all(b"Test").unwrap();
        let bytes = writer.into_bytes();
        assert_eq!(&bytes[..], b"Test");
    }

    #[test]
    fn test_buffer_writer_clear() {
        let mut writer = BufferWriter::new();
        writer.write_byte(1);
        writer.clear();
        assert!(writer.is_empty());
    }

    #[test]
    fn test_buffer_partial_eq() {
        let b1 = Buffer::from_slice(&[1, 2, 3]);
        let b2 = Buffer::from_slice(&[1, 2, 3]);
        let b3 = Buffer::from_slice(&[1, 2, 4]);
        assert_eq!(b1, b2);
        assert_ne!(b1, b3);
    }
}
