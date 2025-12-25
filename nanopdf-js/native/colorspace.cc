/**
 * NanoPDF Colorspace Bindings
 *
 * N-API bindings for colorspace operations.
 * Colorspaces define color interpretation for images and graphics.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"

/**
 * Get device gray colorspace handle
 *
 * @param ctx - Context handle
 * @returns Colorspace handle (1)
 */
Napi::BigInt DeviceGray(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected 1 argument: ctx")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);

    uint64_t cs_handle = fz_device_gray(ctx_handle);

    return Napi::BigInt::New(env, cs_handle);
}

/**
 * Get device RGB colorspace handle
 *
 * @param ctx - Context handle
 * @returns Colorspace handle (2)
 */
Napi::BigInt DeviceRGB(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected 1 argument: ctx")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);

    uint64_t cs_handle = fz_device_rgb(ctx_handle);

    return Napi::BigInt::New(env, cs_handle);
}

/**
 * Get device BGR colorspace handle
 *
 * @param ctx - Context handle
 * @returns Colorspace handle (3)
 */
Napi::BigInt DeviceBGR(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected 1 argument: ctx")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);

    uint64_t cs_handle = fz_device_bgr(ctx_handle);

    return Napi::BigInt::New(env, cs_handle);
}

/**
 * Get device CMYK colorspace handle
 *
 * @param ctx - Context handle
 * @returns Colorspace handle (4)
 */
Napi::BigInt DeviceCMYK(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected 1 argument: ctx")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);

    uint64_t cs_handle = fz_device_cmyk(ctx_handle);

    return Napi::BigInt::New(env, cs_handle);
}

/**
 * Get number of components in colorspace
 *
 * @param ctx - Context handle
 * @param cs - Colorspace handle
 * @returns Number of components (1 for Gray, 3 for RGB, 4 for CMYK)
 */
Napi::Number ColorspaceN(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, cs")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t cs_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t n = fz_colorspace_n(ctx_handle, cs_handle);

    return Napi::Number::New(env, n);
}

/**
 * Get colorspace name
 *
 * @param ctx - Context handle
 * @param cs - Colorspace handle
 * @returns Colorspace name string
 */
Napi::String ColorspaceName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, cs")
            .ThrowAsJavaScriptException();
        return Napi::String::New(env, "");
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t cs_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    const char* name = fz_colorspace_name(ctx_handle, cs_handle);

    return Napi::String::New(env, name ? name : "");
}

/**
 * Initialize Colorspace module exports
 */
Napi::Object InitColorspace(Napi::Env env, Napi::Object exports) {
    exports.Set("deviceGray", Napi::Function::New(env, DeviceGray));
    exports.Set("deviceRGB", Napi::Function::New(env, DeviceRGB));
    exports.Set("deviceBGR", Napi::Function::New(env, DeviceBGR));
    exports.Set("deviceCMYK", Napi::Function::New(env, DeviceCMYK));
    exports.Set("colorspaceN", Napi::Function::New(env, ColorspaceN));
    exports.Set("colorspaceName", Napi::Function::New(env, ColorspaceName));
    
    return exports;
}

