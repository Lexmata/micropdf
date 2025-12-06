/**
 * NanoPDF Pixmap Bindings
 *
 * N-API bindings for pixmap operations.
 * Pixmaps are pixel buffers for rendering output.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"

/**
 * Create a new pixmap
 *
 * @param ctx - Context handle
 * @param colorspace - Colorspace handle (or 0 for alpha-only)
 * @param w - Width in pixels
 * @param h - Height in pixels
 * @param alpha - Include alpha channel
 * @returns Pixmap handle
 */
Napi::BigInt NewPixmap(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 5) {
        Napi::TypeError::New(env, "Expected 5 arguments: ctx, colorspace, w, h, alpha")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t cs_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    int32_t w = info[2].As<Napi::Number>().Int32Value();
    int32_t h = info[3].As<Napi::Number>().Int32Value();
    int32_t alpha = info[4].As<Napi::Boolean>().Value() ? 1 : 0;

    uint64_t pixmap_handle = fz_new_pixmap(ctx_handle, cs_handle, w, h, alpha);

    return Napi::BigInt::New(env, pixmap_handle);
}

/**
 * Drop pixmap handle
 *
 * @param ctx - Context handle
 * @param pixmap - Pixmap handle
 */
Napi::Value DropPixmap(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, pixmap")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t pixmap_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_drop_pixmap(ctx_handle, pixmap_handle);

    return env.Undefined();
}

/**
 * Get pixmap width
 *
 * @param ctx - Context handle
 * @param pixmap - Pixmap handle
 * @returns Width in pixels
 */
Napi::Number PixmapWidth(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, pixmap")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t pixmap_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t width = fz_pixmap_width(ctx_handle, pixmap_handle);

    return Napi::Number::New(env, width);
}

/**
 * Get pixmap height
 *
 * @param ctx - Context handle
 * @param pixmap - Pixmap handle
 * @returns Height in pixels
 */
Napi::Number PixmapHeight(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, pixmap")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t pixmap_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t height = fz_pixmap_height(ctx_handle, pixmap_handle);

    return Napi::Number::New(env, height);
}

/**
 * Get pixmap samples (pixel data)
 *
 * @param ctx - Context handle
 * @param pixmap - Pixmap handle
 * @returns Buffer containing pixel data
 */
Napi::Buffer<uint8_t> PixmapSamples(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, pixmap")
            .ThrowAsJavaScriptException();
        return Napi::Buffer<uint8_t>::New(env, 0);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t pixmap_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    uint8_t* data = nullptr;
    size_t size = 0;

    fz_pixmap_samples(ctx_handle, pixmap_handle, &data, &size);

    if (data && size > 0) {
        // Create a copy of the data for Node.js
        return Napi::Buffer<uint8_t>::Copy(env, data, size);
    }

    return Napi::Buffer<uint8_t>::New(env, 0);
}

/**
 * Get pixmap stride (bytes per row)
 *
 * @param ctx - Context handle
 * @param pixmap - Pixmap handle
 * @returns Stride in bytes
 */
Napi::Number PixmapStride(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, pixmap")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t pixmap_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    size_t stride = fz_pixmap_stride(ctx_handle, pixmap_handle);

    return Napi::Number::New(env, static_cast<double>(stride));
}

/**
 * Get number of components (including alpha)
 *
 * @param ctx - Context handle
 * @param pixmap - Pixmap handle
 * @returns Number of components
 */
Napi::Number PixmapComponents(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, pixmap")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t pixmap_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t n = fz_pixmap_components(ctx_handle, pixmap_handle);

    return Napi::Number::New(env, n);
}

/**
 * Clear pixmap to a color
 *
 * @param ctx - Context handle
 * @param pixmap - Pixmap handle
 * @param value - Clear value (0-255)
 */
Napi::Value ClearPixmap(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, pixmap, value")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t pixmap_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    int32_t value = info[2].As<Napi::Number>().Int32Value();

    fz_clear_pixmap(ctx_handle, pixmap_handle, value);

    return env.Undefined();
}

/**
 * Initialize Pixmap module exports
 */
Napi::Object InitPixmap(Napi::Env env, Napi::Object exports) {
    exports.Set("newPixmap", Napi::Function::New(env, NewPixmap));
    exports.Set("dropPixmap", Napi::Function::New(env, DropPixmap));
    exports.Set("pixmapWidth", Napi::Function::New(env, PixmapWidth));
    exports.Set("pixmapHeight", Napi::Function::New(env, PixmapHeight));
    exports.Set("pixmapSamples", Napi::Function::New(env, PixmapSamples));
    exports.Set("pixmapStride", Napi::Function::New(env, PixmapStride));
    exports.Set("pixmapComponents", Napi::Function::New(env, PixmapComponents));
    exports.Set("clearPixmap", Napi::Function::New(env, ClearPixmap));

    return exports;
}

