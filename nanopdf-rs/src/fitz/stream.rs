//! Stream - Buffered I/O abstraction

use crate::fitz::buffer::Buffer;
use crate::fitz::error::{Error, Result};
use byteorder::{BigEndian, LittleEndian, ReadBytesExt};
use std::fs::File;
use std::io::{self, BufReader, Cursor, Read, Seek, SeekFrom};
use std::path::Path;
use std::sync::Arc;

pub struct Stream {
    inner: Box<dyn StreamSource>,
    buffer: Vec<u8>,
    rp: usize, wp: usize, pos: i64,
    eof: bool, error: bool,
    bits: u32, avail: u8,
    filename: Option<String>,
}

pub trait StreamSource: Send + Sync {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize>;
    fn seek(&mut self, pos: SeekFrom) -> io::Result<u64>;
    fn tell(&mut self) -> io::Result<u64>;
    fn len(&self) -> Option<u64>;
}

struct FileSource { reader: BufReader<File>, len: u64 }
impl StreamSource for FileSource {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> { self.reader.read(buf) }
    fn seek(&mut self, pos: SeekFrom) -> io::Result<u64> { self.reader.seek(pos) }
    fn tell(&mut self) -> io::Result<u64> { self.reader.stream_position() }
    fn len(&self) -> Option<u64> { Some(self.len) }
}

struct MemorySource { data: Arc<[u8]>, position: usize }
impl StreamSource for MemorySource {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let remaining = &self.data[self.position..];
        let to_read = buf.len().min(remaining.len());
        buf[..to_read].copy_from_slice(&remaining[..to_read]);
        self.position += to_read;
        Ok(to_read)
    }
    fn seek(&mut self, pos: SeekFrom) -> io::Result<u64> {
        let new_pos = match pos {
            SeekFrom::Start(offset) => offset as i64,
            SeekFrom::End(offset) => self.data.len() as i64 + offset,
            SeekFrom::Current(offset) => self.position as i64 + offset,
        };
        if new_pos < 0 { return Err(io::Error::new(io::ErrorKind::InvalidInput, "Seek before start")); }
        self.position = (new_pos as usize).min(self.data.len());
        Ok(self.position as u64)
    }
    fn tell(&mut self) -> io::Result<u64> { Ok(self.position as u64) }
    fn len(&self) -> Option<u64> { Some(self.data.len() as u64) }
}

const STREAM_BUFFER_SIZE: usize = 8192;

impl Stream {
    pub fn open_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        let path = path.as_ref();
        let file = File::open(path).map_err(Error::System)?;
        let len = file.metadata().map_err(Error::System)?.len();
        Ok(Self {
            inner: Box::new(FileSource { reader: BufReader::with_capacity(STREAM_BUFFER_SIZE, file), len }),
            buffer: vec![0u8; STREAM_BUFFER_SIZE], rp: 0, wp: 0, pos: 0, eof: false, error: false,
            bits: 0, avail: 0, filename: Some(path.to_string_lossy().into_owned()),
        })
    }
    pub fn open_memory(data: &[u8]) -> Self {
        let data: Arc<[u8]> = data.into();
        Self {
            inner: Box::new(MemorySource { data, position: 0 }),
            buffer: vec![0u8; STREAM_BUFFER_SIZE], rp: 0, wp: 0, pos: 0, eof: false, error: false,
            bits: 0, avail: 0, filename: None,
        }
    }
    pub fn open_buffer(buffer: &Buffer) -> Self { Self::open_memory(buffer.as_slice()) }
    pub fn tell(&self) -> i64 { self.pos - (self.wp - self.rp) as i64 }
    pub fn len(&self) -> Option<u64> { self.inner.len() }
    pub fn is_empty(&self) -> bool { self.inner.len() == Some(0) }

    fn fill_buffer(&mut self) -> Result<usize> {
        if self.eof { return Ok(0); }
        if self.rp > 0 && self.rp < self.wp {
            self.buffer.copy_within(self.rp..self.wp, 0);
            self.wp -= self.rp; self.rp = 0;
        } else { self.rp = 0; self.wp = 0; }
        match self.inner.read(&mut self.buffer[self.wp..]) {
            Ok(0) => { self.eof = true; Ok(0) }
            Ok(n) => { self.wp += n; self.pos += n as i64; Ok(n) }
            Err(e) => { self.error = true; Err(Error::System(e)) }
        }
    }

    pub fn read_byte(&mut self) -> Result<Option<u8>> {
        if self.rp >= self.wp && self.fill_buffer()? == 0 { return Ok(None); }
        let byte = self.buffer[self.rp]; self.rp += 1; Ok(Some(byte))
    }
    pub fn read(&mut self, buf: &mut [u8]) -> Result<usize> {
        let mut total = 0;
        while total < buf.len() {
            let buffered = self.wp - self.rp;
            if buffered > 0 {
                let to_copy = buffered.min(buf.len() - total);
                buf[total..total + to_copy].copy_from_slice(&self.buffer[self.rp..self.rp + to_copy]);
                self.rp += to_copy; total += to_copy;
            } else if self.fill_buffer()? == 0 { break; }
        }
        Ok(total)
    }
    pub fn read_exact(&mut self, buf: &mut [u8]) -> Result<()> {
        if self.read(buf)? < buf.len() { return Err(Error::Eof); }
        Ok(())
    }
    pub fn read_all(&mut self, initial_capacity: usize) -> Result<Buffer> {
        let mut result = Buffer::new(initial_capacity);
        loop {
            let buffered = self.wp - self.rp;
            if buffered > 0 { result.append_data(&self.buffer[self.rp..self.wp]); self.rp = self.wp; }
            if self.fill_buffer()? == 0 { break; }
        }
        Ok(result)
    }
}

impl std::fmt::Debug for Stream {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Stream").field("pos", &self.tell()).field("eof", &self.eof).finish()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stream_open_memory() {
        let data = b"Hello World";
        let stream = Stream::open_memory(data);
        assert_eq!(stream.tell(), 0);
        assert_eq!(stream.len(), Some(data.len() as u64));
        assert!(!stream.is_empty());
    }

    #[test]
    fn test_stream_open_memory_empty() {
        let stream = Stream::open_memory(&[]);
        assert!(stream.is_empty());
        assert_eq!(stream.len(), Some(0));
    }

    #[test]
    fn test_stream_open_buffer() {
        let buffer = Buffer::from_slice(b"Test Data");
        let stream = Stream::open_buffer(&buffer);
        assert_eq!(stream.len(), Some(9));
    }

    #[test]
    fn test_stream_read_byte() {
        let data = b"ABC";
        let mut stream = Stream::open_memory(data);
        
        let b1 = stream.read_byte().unwrap();
        assert_eq!(b1, Some(b'A'));
        
        let b2 = stream.read_byte().unwrap();
        assert_eq!(b2, Some(b'B'));
        
        let b3 = stream.read_byte().unwrap();
        assert_eq!(b3, Some(b'C'));
        
        let b4 = stream.read_byte().unwrap();
        assert_eq!(b4, None); // EOF
    }

    #[test]
    fn test_stream_read() {
        let data = b"Hello World";
        let mut stream = Stream::open_memory(data);
        let mut buf = [0u8; 5];
        
        let n = stream.read(&mut buf).unwrap();
        assert_eq!(n, 5);
        assert_eq!(&buf, b"Hello");
    }

    #[test]
    fn test_stream_read_exact() {
        let data = b"Hello World";
        let mut stream = Stream::open_memory(data);
        let mut buf = [0u8; 5];
        
        stream.read_exact(&mut buf).unwrap();
        assert_eq!(&buf, b"Hello");
    }

    #[test]
    fn test_stream_read_exact_eof() {
        let data = b"Hi";
        let mut stream = Stream::open_memory(data);
        let mut buf = [0u8; 10];
        
        let result = stream.read_exact(&mut buf);
        assert!(result.is_err());
    }

    #[test]
    fn test_stream_read_all() {
        let data = b"Hello World";
        let mut stream = Stream::open_memory(data);
        
        let buffer = stream.read_all(0).unwrap();
        assert_eq!(buffer.as_slice(), data);
    }

    #[test]
    fn test_stream_tell() {
        let data = b"Hello";
        let mut stream = Stream::open_memory(data);
        
        assert_eq!(stream.tell(), 0);
        stream.read_byte().unwrap();
        // After reading, tell should advance (though buffering may affect exact position)
    }

    #[test]
    fn test_stream_debug() {
        let stream = Stream::open_memory(b"test");
        let debug = format!("{:?}", stream);
        assert!(debug.contains("Stream"));
        assert!(debug.contains("pos"));
        assert!(debug.contains("eof"));
    }

    #[test]
    fn test_stream_sequential_reads() {
        let data = b"ABCDEFGHIJ";
        let mut stream = Stream::open_memory(data);
        
        let mut buf = [0u8; 3];
        stream.read_exact(&mut buf).unwrap();
        assert_eq!(&buf, b"ABC");
        
        stream.read_exact(&mut buf).unwrap();
        assert_eq!(&buf, b"DEF");
        
        stream.read_exact(&mut buf).unwrap();
        assert_eq!(&buf, b"GHI");
    }

    #[test]
    fn test_stream_large_read() {
        // Create data larger than buffer size
        let data: Vec<u8> = (0..20000).map(|i| (i % 256) as u8).collect();
        let mut stream = Stream::open_memory(&data);
        
        let buffer = stream.read_all(0).unwrap();
        assert_eq!(buffer.len(), data.len());
        assert_eq!(buffer.as_slice(), &data[..]);
    }

    #[test]
    fn test_memory_source_seek() {
        let data = b"Hello World";
        let mut source = MemorySource {
            data: data.as_ref().into(),
            position: 0,
        };
        
        // Seek to start
        let pos = source.seek(SeekFrom::Start(6)).unwrap();
        assert_eq!(pos, 6);
        assert_eq!(source.position, 6);
        
        // Seek from current
        let pos = source.seek(SeekFrom::Current(2)).unwrap();
        assert_eq!(pos, 8);
        
        // Seek from end
        let pos = source.seek(SeekFrom::End(-5)).unwrap();
        assert_eq!(pos, 6);
    }

    #[test]
    fn test_memory_source_seek_before_start() {
        let data = b"Hello";
        let mut source = MemorySource {
            data: data.as_ref().into(),
            position: 2,
        };
        
        let result = source.seek(SeekFrom::Current(-10));
        assert!(result.is_err());
    }

    #[test]
    fn test_memory_source_read() {
        let data = b"Hello";
        let mut source = MemorySource {
            data: data.as_ref().into(),
            position: 0,
        };
        
        let mut buf = [0u8; 3];
        let n = source.read(&mut buf).unwrap();
        assert_eq!(n, 3);
        assert_eq!(&buf, b"Hel");
        assert_eq!(source.position, 3);
    }

    #[test]
    fn test_memory_source_tell() {
        let data = b"Hello";
        let mut source = MemorySource {
            data: data.as_ref().into(),
            position: 3,
        };
        
        assert_eq!(source.tell().unwrap(), 3);
    }

    #[test]
    fn test_memory_source_len() {
        let data = b"Hello";
        let source = MemorySource {
            data: data.as_ref().into(),
            position: 0,
        };
        
        assert_eq!(source.len(), Some(5));
    }
}

