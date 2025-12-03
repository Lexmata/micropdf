//! Error handling for NanoPDF

use std::io;
use thiserror::Error;

/// The main error type for NanoPDF operations
#[derive(Error, Debug)]
pub enum Error {
    #[error("{0}")]
    Generic(String),
    #[error("System error: {0}")]
    System(#[from] io::Error),
    #[error("Invalid argument: {0}")]
    Argument(String),
    #[error("Limit exceeded: {0}")]
    Limit(String),
    #[error("Unsupported: {0}")]
    Unsupported(String),
    #[error("Format error: {0}")]
    Format(String),
    #[error("Syntax error: {0}")]
    Syntax(String),
    #[error("PDF error: {0}")]
    Pdf(String),
    #[error("Encryption error: {0}")]
    Encryption(String),
    #[error("Font error: {0}")]
    Font(String),
    #[error("Image error: {0}")]
    Image(String),
    #[error("Unexpected end of file")]
    Eof,
    #[error("Operation aborted")]
    Abort,
}

impl Error {
    pub fn generic<S: Into<String>>(msg: S) -> Self { Error::Generic(msg.into()) }
    pub fn argument<S: Into<String>>(msg: S) -> Self { Error::Argument(msg.into()) }
    pub fn limit<S: Into<String>>(msg: S) -> Self { Error::Limit(msg.into()) }
    pub fn unsupported<S: Into<String>>(msg: S) -> Self { Error::Unsupported(msg.into()) }
    pub fn format<S: Into<String>>(msg: S) -> Self { Error::Format(msg.into()) }
    pub fn syntax<S: Into<String>>(msg: S) -> Self { Error::Syntax(msg.into()) }
    pub fn pdf<S: Into<String>>(msg: S) -> Self { Error::Pdf(msg.into()) }
    pub fn encryption<S: Into<String>>(msg: S) -> Self { Error::Encryption(msg.into()) }
    pub fn font<S: Into<String>>(msg: S) -> Self { Error::Font(msg.into()) }
    pub fn image<S: Into<String>>(msg: S) -> Self { Error::Image(msg.into()) }
}

pub type Result<T> = std::result::Result<T, Error>;

