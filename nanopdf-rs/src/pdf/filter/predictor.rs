//! Predictor Functions for PDF Filters

use crate::fitz::error::{Error, Result};
use super::params::FlateDecodeParams;

/// Apply PNG/TIFF predictor for decoding
pub fn apply_predictor_decode(data: &[u8], params: &FlateDecodeParams) -> Result<Vec<u8>> {
    let predictor = params.predictor;
    let colors = params.colors.max(1) as usize;
    let bits = params.bits_per_component.max(8) as usize;
    let columns = params.columns.max(1) as usize;

    // Calculate bytes per pixel and bytes per row
    let bytes_per_pixel = (colors * bits + 7) / 8;
    let bytes_per_row = (colors * bits * columns + 7) / 8;

    match predictor {
        1 => Ok(data.to_vec()), // No predictor
        2 => apply_tiff_predictor_decode(data, bytes_per_row, bytes_per_pixel),
        10..=15 => apply_png_predictor_decode(data, bytes_per_row, bytes_per_pixel),
        _ => Err(Error::Generic(format!("Unsupported predictor: {}", predictor))),
    }
}

/// Apply TIFF predictor (horizontal differencing)
pub fn apply_tiff_predictor_decode(data: &[u8], bytes_per_row: usize, bytes_per_pixel: usize) -> Result<Vec<u8>> {
    let mut result = Vec::with_capacity(data.len());

    for row in data.chunks(bytes_per_row) {
        let mut prev = vec![0u8; bytes_per_pixel];

        for pixel in row.chunks(bytes_per_pixel) {
            for (i, &byte) in pixel.iter().enumerate() {
                let decoded = byte.wrapping_add(prev[i]);
                result.push(decoded);
                prev[i] = decoded;
            }
        }
    }

    Ok(result)
}

/// Apply PNG predictor
pub fn apply_png_predictor_decode(data: &[u8], bytes_per_row: usize, bytes_per_pixel: usize) -> Result<Vec<u8>> {
    // PNG predictor includes a filter type byte at the start of each row
    let row_size = bytes_per_row + 1;
    let mut result = Vec::with_capacity(data.len());
    let mut prev_row = vec![0u8; bytes_per_row];

    for row_data in data.chunks(row_size) {
        if row_data.is_empty() {
            continue;
        }

        let filter_type = row_data[0];
        let row = &row_data[1..];

        if row.len() < bytes_per_row {
            // Incomplete row, pad with zeros
            let mut padded = row.to_vec();
            padded.resize(bytes_per_row, 0);
            decode_png_filter(filter_type, &padded, &prev_row, bytes_per_pixel, &mut result)?;
        } else {
            decode_png_filter(filter_type, &row[..bytes_per_row], &prev_row, bytes_per_pixel, &mut result)?;
        }

        // Update previous row
        let start = result.len().saturating_sub(bytes_per_row);
        prev_row.copy_from_slice(&result[start..]);
    }

    Ok(result)
}

/// Decode a single PNG filter row
pub fn decode_png_filter(
    filter_type: u8,
    row: &[u8],
    prev_row: &[u8],
    bytes_per_pixel: usize,
    output: &mut Vec<u8>,
) -> Result<()> {
    match filter_type {
        0 => {
            // None
            output.extend_from_slice(row);
        }
        1 => {
            // Sub
            for (i, &byte) in row.iter().enumerate() {
                let left = if i >= bytes_per_pixel {
                    output[output.len() - bytes_per_pixel]
                } else {
                    0
                };
                output.push(byte.wrapping_add(left));
            }
        }
        2 => {
            // Up
            for (i, &byte) in row.iter().enumerate() {
                let up = prev_row.get(i).copied().unwrap_or(0);
                output.push(byte.wrapping_add(up));
            }
        }
        3 => {
            // Average
            for (i, &byte) in row.iter().enumerate() {
                let left = if i >= bytes_per_pixel {
                    output[output.len() - bytes_per_pixel] as u32
                } else {
                    0
                };
                let up = prev_row.get(i).copied().unwrap_or(0) as u32;
                let avg = ((left + up) / 2) as u8;
                output.push(byte.wrapping_add(avg));
            }
        }
        4 => {
            // Paeth
            for (i, &byte) in row.iter().enumerate() {
                let left = if i >= bytes_per_pixel {
                    output[output.len() - bytes_per_pixel]
                } else {
                    0
                };
                let up = prev_row.get(i).copied().unwrap_or(0);
                let up_left = if i >= bytes_per_pixel {
                    prev_row.get(i - bytes_per_pixel).copied().unwrap_or(0)
                } else {
                    0
                };
                let paeth = paeth_predictor(left, up, up_left);
                output.push(byte.wrapping_add(paeth));
            }
        }
        _ => {
            return Err(Error::Generic(format!("Unknown PNG filter type: {}", filter_type)));
        }
    }

    Ok(())
}

/// Paeth predictor function
pub fn paeth_predictor(a: u8, b: u8, c: u8) -> u8 {
    let a = a as i32;
    let b = b as i32;
    let c = c as i32;

    let p = a + b - c;
    let pa = (p - a).abs();
    let pb = (p - b).abs();
    let pc = (p - c).abs();

    if pa <= pb && pa <= pc {
        a as u8
    } else if pb <= pc {
        b as u8
    } else {
        c as u8
    }
}

