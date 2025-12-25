Architecture
============

NanoPDF Python bindings use cffi to interface with the Rust core library.

Layers:

1. **FFI Layer** (``ffi.py``) - Low-level C bindings
2. **Core Classes** - Pythonic wrappers
3. **Easy API** (``easy.py``) - High-level interface
