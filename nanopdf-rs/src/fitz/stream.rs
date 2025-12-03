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

