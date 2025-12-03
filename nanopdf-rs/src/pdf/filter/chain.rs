//! Filter Chain Implementation

use crate::fitz::error::{Error, Result};
use super::FilterType;
use super::params::CCITTFaxDecodeParams;
use super::*;

/// A chain of filters to apply
#[derive(Debug, Clone)]
pub struct FilterChain {
    filters: Vec<FilterType>,
}

impl FilterChain {
    pub fn new() -> Self {
        Self { filters: Vec::new() }
    }

    pub fn add(&mut self, filter: FilterType) {
        self.filters.push(filter);
    }

    /// Decode data through the filter chain (in order)
    pub fn decode(&self, mut data: Vec<u8>) -> Result<Vec<u8>> {
        for filter in &self.filters {
            data = match filter {
                FilterType::FlateDecode => decode_flate(&data, None)?,
                FilterType::LZWDecode => decode_lzw(&data, None)?,
                FilterType::ASCII85Decode => decode_ascii85(&data)?,
                FilterType::ASCIIHexDecode => decode_ascii_hex(&data)?,
                FilterType::RunLengthDecode => decode_run_length(&data)?,
                FilterType::CCITTFaxDecode => decode_ccitt_fax(&data, &CCITTFaxDecodeParams::default())?,
                FilterType::DCTDecode => decode_dct(&data, None)?,
                FilterType::JPXDecode => decode_jpx(&data)?,
                FilterType::JBIG2Decode => decode_jbig2(&data, None)?,
                FilterType::Crypt => data, // Encryption handled separately
            };
        }
        Ok(data)
    }

    /// Encode data through the filter chain (in reverse order)
    pub fn encode(&self, mut data: Vec<u8>) -> Result<Vec<u8>> {
        for filter in self.filters.iter().rev() {
            data = match filter {
                FilterType::FlateDecode => encode_flate(&data, 6)?,
                FilterType::LZWDecode => encode_lzw(&data)?,
                FilterType::ASCII85Decode => encode_ascii85(&data)?,
                FilterType::ASCIIHexDecode => encode_ascii_hex(&data)?,
                FilterType::RunLengthDecode => encode_run_length(&data)?,
                FilterType::CCITTFaxDecode => {
                    return Err(Error::Generic("CCITTFaxEncode not supported".into()));
                }
                FilterType::DCTDecode => {
                    return Err(Error::Generic("DCTEncode requires image dimensions".into()));
                }
                FilterType::JPXDecode => {
                    return Err(Error::Generic("JPXEncode not supported".into()));
                }
                FilterType::JBIG2Decode => {
                    return Err(Error::Generic("JBIG2Encode not supported".into()));
                }
                FilterType::Crypt => data,
            };
        }
        Ok(data)
    }
}

impl Default for FilterChain {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_filter_chain_flate() {
        let mut chain = FilterChain::new();
        chain.add(FilterType::FlateDecode);

        let original = b"Hello, FilterChain!";
        let compressed = encode_flate(original, 6).unwrap();
        let decoded = chain.decode(compressed).unwrap();

        assert_eq!(decoded, original);
    }

    #[test]
    fn test_filter_chain_multiple() {
        let mut chain = FilterChain::new();
        chain.add(FilterType::ASCII85Decode);
        chain.add(FilterType::FlateDecode);

        let original = b"Test data";
        
        // Encode manually (reverse order)
        let compressed = encode_flate(original, 6).unwrap();
        let ascii85 = encode_ascii85(&compressed).unwrap();

        // Decode with chain (forward order)
        let decoded = chain.decode(ascii85).unwrap();

        assert_eq!(decoded, original);
    }
}

