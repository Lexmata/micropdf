/**
 * NanoPDF Output Bindings
 *
 * N-API bindings for output operations.
 * Outputs provide sequential data writing to files or memory.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"

/**
 * Create output to file
 *
 * @param ctx - Context handle
 * @param filename - Path to file
 * @param append - Append mode (0=overwrite, 1=append)
 * @returns Output handle
 */
Napi::BigInt NewOutputWithPath(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, filename, append")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    std::string filename = info[1].As<Napi::String>().Utf8Value();
    int32_t append = info[2].As<Napi::Boolean>().Value() ? 1 : 0;

    uint64_t output_handle = fz_new_output_with_path(ctx_handle, filename.c_str(), append);

    return Napi::BigInt::New(env, output_handle);
}

/**
 * Create output to buffer
 *
 * @param ctx - Context handle
 * @param buffer - Buffer handle
 * @returns Output handle
 */
Napi::BigInt NewOutputWithBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, buffer")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t buffer_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    uint64_t output_handle = fz_new_output_with_buffer(ctx_handle, buffer_handle);

    return Napi::BigInt::New(env, output_handle);
}

/**
 * Drop output handle
 *
 * @param ctx - Context handle
 * @param output - Output handle
 */
Napi::Value DropOutput(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, output")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t output_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_drop_output(ctx_handle, output_handle);

    return env.Undefined();
}

/**
 * Write data to output
 *
 * @param ctx - Context handle
 * @param output - Output handle
 * @param data - Buffer containing data to write
 */
Napi::Value WriteData(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, output, data")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t output_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    Napi::Buffer<uint8_t> buffer = info[2].As<Napi::Buffer<uint8_t>>();

    fz_write_data(ctx_handle, output_handle, buffer.Data(), buffer.Length());

    return env.Undefined();
}

/**
 * Write string to output
 *
 * @param ctx - Context handle
 * @param output - Output handle
 * @param str - String to write
 */
Napi::Value WriteString(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, output, str")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t output_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    std::string str = info[2].As<Napi::String>().Utf8Value();

    fz_write_string(ctx_handle, output_handle, str.c_str());

    return env.Undefined();
}

/**
 * Write single byte to output
 *
 * @param ctx - Context handle
 * @param output - Output handle
 * @param byte - Byte value (0-255)
 */
Napi::Value WriteByte(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, output, byte")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t output_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    uint8_t byte = static_cast<uint8_t>(info[2].As<Napi::Number>().Uint32Value());

    fz_write_byte(ctx_handle, output_handle, byte);

    return env.Undefined();
}

/**
 * Close output (flush and close file)
 *
 * @param ctx - Context handle
 * @param output - Output handle
 */
Napi::Value CloseOutput(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, output")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t output_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_close_output(ctx_handle, output_handle);

    return env.Undefined();
}

/**
 * Tell current position in output
 *
 * @param ctx - Context handle
 * @param output - Output handle
 * @returns Current position
 */
Napi::Number TellOutput(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, output")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t output_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int64_t position = fz_tell_output(ctx_handle, output_handle);

    return Napi::Number::New(env, position);
}

/**
 * Initialize Output module exports
 */
Napi::Object InitOutput(Napi::Env env, Napi::Object exports) {
    exports.Set("newOutputWithPath", Napi::Function::New(env, NewOutputWithPath));
    exports.Set("newOutputWithBuffer", Napi::Function::New(env, NewOutputWithBuffer));
    exports.Set("dropOutput", Napi::Function::New(env, DropOutput));
    exports.Set("writeData", Napi::Function::New(env, WriteData));
    exports.Set("writeString", Napi::Function::New(env, WriteString));
    exports.Set("writeByte", Napi::Function::New(env, WriteByte));
    exports.Set("closeOutput", Napi::Function::New(env, CloseOutput));
    exports.Set("tellOutput", Napi::Function::New(env, TellOutput));

    return exports;
}

