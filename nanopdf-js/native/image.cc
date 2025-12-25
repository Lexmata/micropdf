/**
 * NanoPDF Image Bindings
 *
 * N-API bindings for image operations.
 * Images represent raster graphics with various formats and compression.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"

/**
 * Load image from file
 *
 * @param ctx - Context handle
 * @param filename - Path to image file
 * @returns Image handle
 */
Napi::BigInt NewImageFromFile(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, filename")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    std::string filename = info[1].As<Napi::String>().Utf8Value();

    uint64_t image_handle = fz_new_image_from_file(ctx_handle, filename.c_str());

    return Napi::BigInt::New(env, image_handle);
}

/**
 * Load image from buffer
 *
 * @param ctx - Context handle
 * @param data - Buffer containing image data
 * @returns Image handle
 */
Napi::BigInt NewImageFromBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, data")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    Napi::Buffer<uint8_t> buffer = info[1].As<Napi::Buffer<uint8_t>>();

    uint64_t image_handle = fz_new_image_from_buffer_data(
        ctx_handle,
        buffer.Data(),
        buffer.Length()
    );

    return Napi::BigInt::New(env, image_handle);
}

/**
 * Drop image handle
 *
 * @param ctx - Context handle
 * @param image - Image handle
 */
Napi::Value DropImage(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, image")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t image_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_drop_image(ctx_handle, image_handle);

    return env.Undefined();
}

/**
 * Get image width
 *
 * @param ctx - Context handle
 * @param image - Image handle
 * @returns Width in pixels
 */
Napi::Number ImageWidth(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, image")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t image_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t width = fz_image_width(ctx_handle, image_handle);

    return Napi::Number::New(env, width);
}

/**
 * Get image height
 *
 * @param ctx - Context handle
 * @param image - Image handle
 * @returns Height in pixels
 */
Napi::Number ImageHeight(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, image")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t image_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t height = fz_image_height(ctx_handle, image_handle);

    return Napi::Number::New(env, height);
}

/**
 * Get image colorspace
 *
 * @param ctx - Context handle
 * @param image - Image handle
 * @returns Colorspace handle
 */
Napi::BigInt ImageColorspace(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, image")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t image_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    uint64_t cs_handle = fz_image_colorspace(ctx_handle, image_handle);

    return Napi::BigInt::New(env, cs_handle);
}

/**
 * Convert image to pixmap
 *
 * @param ctx - Context handle
 * @param image - Image handle
 * @returns Object {pixmap: BigInt, width: Number, height: Number}
 */
Napi::Object GetPixmapFromImage(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object result = Napi::Object::New(env);

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, image")
            .ThrowAsJavaScriptException();
        return result;
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t image_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t w = 0, h = 0;
    uint64_t pixmap_handle = fz_get_pixmap_from_image(
        ctx_handle,
        image_handle,
        nullptr,
        nullptr,
        &w,
        &h
    );

    result.Set("pixmap", Napi::BigInt::New(env, pixmap_handle));
    result.Set("width", Napi::Number::New(env, w));
    result.Set("height", Napi::Number::New(env, h));

    return result;
}

/**
 * Initialize Image module exports
 */
Napi::Object InitImage(Napi::Env env, Napi::Object exports) {
    exports.Set("newImageFromFile", Napi::Function::New(env, NewImageFromFile));
    exports.Set("newImageFromBuffer", Napi::Function::New(env, NewImageFromBuffer));
    exports.Set("dropImage", Napi::Function::New(env, DropImage));
    exports.Set("imageWidth", Napi::Function::New(env, ImageWidth));
    exports.Set("imageHeight", Napi::Function::New(env, ImageHeight));
    exports.Set("imageColorspace", Napi::Function::New(env, ImageColorspace));
    exports.Set("getPixmapFromImage", Napi::Function::New(env, GetPixmapFromImage));

    return exports;
}

