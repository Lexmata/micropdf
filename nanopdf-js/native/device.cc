/**
 * NanoPDF Device Bindings
 *
 * N-API bindings for device operations.
 * Devices are the destination for rendering operations.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"

/**
 * Create a draw device for pixmap rendering
 *
 * @param ctx - Context handle
 * @param pixmap - Pixmap handle
 * @returns Device handle
 */
Napi::BigInt NewDrawDevice(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, pixmap")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t pixmap_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    uint64_t device_handle = fz_new_draw_device(ctx_handle, pixmap_handle);

    return Napi::BigInt::New(env, device_handle);
}

/**
 * Create a display list device
 *
 * @param ctx - Context handle
 * @param list - Display list handle
 * @returns Device handle
 */
Napi::BigInt NewListDevice(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, list")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t list_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    uint64_t device_handle = fz_new_list_device(ctx_handle, list_handle);

    return Napi::BigInt::New(env, device_handle);
}

/**
 * Drop device handle
 *
 * @param ctx - Context handle
 * @param device - Device handle
 */
Napi::Value DropDevice(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, device")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t device_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_drop_device(ctx_handle, device_handle);

    return env.Undefined();
}

/**
 * Close device (finish rendering)
 *
 * @param ctx - Context handle
 * @param device - Device handle
 */
Napi::Value CloseDevice(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, device")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t device_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_close_device(ctx_handle, device_handle);

    return env.Undefined();
}

/**
 * Begin new page on device
 *
 * @param ctx - Context handle
 * @param device - Device handle
 * @param rect - Page rectangle {x0, y0, x1, y1}
 */
Napi::Value DeviceBeginPage(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, device, rect")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t device_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    Napi::Object rect_obj = info[2].As<Napi::Object>();
    fz_rect rect;
    rect.x0 = rect_obj.Get("x0").As<Napi::Number>().FloatValue();
    rect.y0 = rect_obj.Get("y0").As<Napi::Number>().FloatValue();
    rect.x1 = rect_obj.Get("x1").As<Napi::Number>().FloatValue();
    rect.y1 = rect_obj.Get("y1").As<Napi::Number>().FloatValue();

    fz_begin_page(ctx_handle, device_handle, rect);

    return env.Undefined();
}

/**
 * End current page on device
 *
 * @param ctx - Context handle
 * @param device - Device handle
 */
Napi::Value DeviceEndPage(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, device")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t device_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_end_page(ctx_handle, device_handle);

    return env.Undefined();
}

/**
 * Initialize Device module exports
 */
Napi::Object InitDevice(Napi::Env env, Napi::Object exports) {
    exports.Set("newDrawDevice", Napi::Function::New(env, NewDrawDevice));
    exports.Set("newListDevice", Napi::Function::New(env, NewListDevice));
    exports.Set("dropDevice", Napi::Function::New(env, DropDevice));
    exports.Set("closeDevice", Napi::Function::New(env, CloseDevice));
    exports.Set("deviceBeginPage", Napi::Function::New(env, DeviceBeginPage));
    exports.Set("deviceEndPage", Napi::Function::New(env, DeviceEndPage));
    
    return exports;
}


