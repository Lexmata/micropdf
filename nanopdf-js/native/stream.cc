/**
 * NanoPDF Stream Bindings
 *
 * N-API bindings for stream (input) operations.
 * Streams provide sequential data reading from files or memory.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"

/**
 * Open stream from file
 *
 * @param ctx - Context handle
 * @param filename - Path to file
 * @returns Stream handle
 */
Napi::BigInt OpenFile(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, filename")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    std::string filename = info[1].As<Napi::String>().Utf8Value();

    uint64_t stream_handle = fz_open_file(ctx_handle, filename.c_str());

    return Napi::BigInt::New(env, stream_handle);
}

/**
 * Open stream from memory buffer
 *
 * @param ctx - Context handle
 * @param data - Buffer containing data
 * @returns Stream handle
 */
Napi::BigInt OpenMemory(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, data")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    Napi::Buffer<uint8_t> buffer = info[1].As<Napi::Buffer<uint8_t>>();

    uint64_t stream_handle = fz_open_memory(
        ctx_handle,
        buffer.Data(),
        buffer.Length()
    );

    return Napi::BigInt::New(env, stream_handle);
}

/**
 * Drop stream handle
 *
 * @param ctx - Context handle
 * @param stream - Stream handle
 */
Napi::Value DropStream(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, stream")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t stream_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_drop_stream(ctx_handle, stream_handle);

    return env.Undefined();
}

/**
 * Read data from stream
 *
 * @param ctx - Context handle
 * @param stream - Stream handle
 * @param buffer - Buffer to read into
 * @returns Number of bytes read
 */
Napi::Number Read(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, stream, buffer")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t stream_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    Napi::Buffer<uint8_t> buffer = info[2].As<Napi::Buffer<uint8_t>>();

    size_t bytes_read = fz_read(
        ctx_handle,
        stream_handle,
        buffer.Data(),
        buffer.Length()
    );

    return Napi::Number::New(env, bytes_read);
}

/**
 * Read single byte from stream
 *
 * @param ctx - Context handle
 * @param stream - Stream handle
 * @returns Byte value (0-255) or -1 on EOF
 */
Napi::Number ReadByte(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, stream")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, -1);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t stream_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t byte = fz_read_byte(ctx_handle, stream_handle);

    return Napi::Number::New(env, byte);
}

/**
 * Check if stream is at end-of-file
 *
 * @param ctx - Context handle
 * @param stream - Stream handle
 * @returns Boolean indicating EOF
 */
Napi::Boolean IsEOF(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, stream")
            .ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, true);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t stream_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t is_eof = fz_is_eof(ctx_handle, stream_handle);

    return Napi::Boolean::New(env, is_eof != 0);
}

/**
 * Seek to position in stream
 *
 * @param ctx - Context handle
 * @param stream - Stream handle
 * @param offset - Offset to seek to
 * @param whence - 0=SEEK_SET, 1=SEEK_CUR, 2=SEEK_END
 */
Napi::Value Seek(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected 4 arguments: ctx, stream, offset, whence")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t stream_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    int64_t offset = info[2].As<Napi::Number>().Int64Value();
    int32_t whence = info[3].As<Napi::Number>().Int32Value();

    fz_seek(ctx_handle, stream_handle, offset, whence);

    return env.Undefined();
}

/**
 * Get current position in stream
 *
 * @param ctx - Context handle
 * @param stream - Stream handle
 * @returns Current position
 */
Napi::Number Tell(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, stream")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t stream_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int64_t position = fz_tell(ctx_handle, stream_handle);

    return Napi::Number::New(env, position);
}

/**
 * Initialize Stream module exports
 */
Napi::Object InitStream(Napi::Env env, Napi::Object exports) {
    exports.Set("openFile", Napi::Function::New(env, OpenFile));
    exports.Set("openMemory", Napi::Function::New(env, OpenMemory));
    exports.Set("dropStream", Napi::Function::New(env, DropStream));
    exports.Set("read", Napi::Function::New(env, Read));
    exports.Set("readByte", Napi::Function::New(env, ReadByte));
    exports.Set("isEOF", Napi::Function::New(env, IsEOF));
    exports.Set("seek", Napi::Function::New(env, Seek));
    exports.Set("tell", Napi::Function::New(env, Tell));
    
    return exports;
}

