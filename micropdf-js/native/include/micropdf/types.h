/**
 * MicroPDF Type Definitions
 *
 * Type aliases for C/C++ compatibility with Rust-generated headers
 */

#ifndef MICROPDF_TYPES_H
#define MICROPDF_TYPES_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// Rust type aliases for C/C++
typedef int8_t i8;
typedef int16_t i16;
typedef int32_t i32;
typedef int64_t i64;
typedef uint8_t u8;
typedef uint16_t u16;
typedef uint32_t u32;
typedef uint64_t u64;
typedef size_t usize;
typedef float f32;
typedef double f64;

#ifdef __cplusplus
}
#endif

#endif /* MICROPDF_TYPES_H */

