//! PDF-specific parsing and document handling

pub mod object;
pub mod lexer;
pub mod parser;
pub mod xref;
pub mod document;
pub mod crypt;
pub mod page;
pub mod font;
pub mod cmap;
pub mod colorspace;
pub mod image;
pub mod annot;
pub mod form;
pub mod filter;
pub mod interpret;
pub mod write;

