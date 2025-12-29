/**
 * MicroPDF Display List Bindings
 *
 * N-API bindings for PDF display list operations.
 * Display lists cache rendering commands for efficient repeated rendering.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"

/**
 * Create a new display list
 *
 * @param ctx - Context handle
 * @param rect - Bounding rectangle {x0, y0, x1, y1}
 * @returns Display list handle
 */
Napi::BigInt NewDisplayList(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, rect")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);

    Napi::Object rect_obj = info[1].As<Napi::Object>();
    fz_rect rect;
    rect.x0 = rect_obj.Get("x0").As<Napi::Number>().FloatValue();
    rect.y0 = rect_obj.Get("y0").As<Napi::Number>().FloatValue();
    rect.x1 = rect_obj.Get("x1").As<Napi::Number>().FloatValue();
    rect.y1 = rect_obj.Get("y1").As<Napi::Number>().FloatValue();

    uint64_t list_handle = fz_new_display_list(ctx_handle, rect);

    return Napi::BigInt::New(env, list_handle);
}

/**
 * Drop display list handle
 *
 * @param ctx - Context handle
 * @param list - Display list handle
 */
Napi::Value DropDisplayList(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, list")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t list_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_drop_display_list(ctx_handle, list_handle);

    return env.Undefined();
}

/**
 * Get display list bounds
 *
 * @param ctx - Context handle
 * @param list - Display list handle
 * @returns Rectangle {x0, y0, x1, y1}
 */
Napi::Object GetDisplayListBounds(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object rect = Napi::Object::New(env);

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, list")
            .ThrowAsJavaScriptException();
        return rect;
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t list_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_rect bounds = fz_bound_display_list(ctx_handle, list_handle);

    rect.Set("x0", Napi::Number::New(env, bounds.x0));
    rect.Set("y0", Napi::Number::New(env, bounds.y0));
    rect.Set("x1", Napi::Number::New(env, bounds.x1));
    rect.Set("y1", Napi::Number::New(env, bounds.y1));

    return rect;
}

/**
 * Run display list on device
 *
 * @param ctx - Context handle
 * @param list - Display list handle
 * @param device - Device handle
 * @param matrix - Transform matrix {a, b, c, d, e, f}
 * @param rect - Clipping rectangle {x0, y0, x1, y1}
 */
Napi::Value RunDisplayList(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 5) {
        Napi::TypeError::New(env, "Expected 5 arguments: ctx, list, device, matrix, rect")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t list_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t device_handle = info[2].As<Napi::BigInt>().Uint64Value(&lossless);

    Napi::Object matrix_obj = info[3].As<Napi::Object>();
    fz_matrix matrix;
    matrix.a = matrix_obj.Get("a").As<Napi::Number>().FloatValue();
    matrix.b = matrix_obj.Get("b").As<Napi::Number>().FloatValue();
    matrix.c = matrix_obj.Get("c").As<Napi::Number>().FloatValue();
    matrix.d = matrix_obj.Get("d").As<Napi::Number>().FloatValue();
    matrix.e = matrix_obj.Get("e").As<Napi::Number>().FloatValue();
    matrix.f = matrix_obj.Get("f").As<Napi::Number>().FloatValue();

    Napi::Object rect_obj = info[4].As<Napi::Object>();
    fz_rect rect;
    rect.x0 = rect_obj.Get("x0").As<Napi::Number>().FloatValue();
    rect.y0 = rect_obj.Get("y0").As<Napi::Number>().FloatValue();
    rect.x1 = rect_obj.Get("x1").As<Napi::Number>().FloatValue();
    rect.y1 = rect_obj.Get("y1").As<Napi::Number>().FloatValue();

    fz_run_display_list(ctx_handle, list_handle, device_handle, matrix, rect);

    return env.Undefined();
}

/**
 * Create display list from page
 *
 * @param ctx - Context handle
 * @param page - Page handle
 * @returns Display list handle
 */
Napi::BigInt NewDisplayListFromPage(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, page")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t page_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    uint64_t list_handle = fz_new_display_list_from_page(ctx_handle, page_handle);

    return Napi::BigInt::New(env, list_handle);
}

/**
 * Initialize DisplayList module exports
 */
Napi::Object InitDisplayList(Napi::Env env, Napi::Object exports) {
    exports.Set("newDisplayList", Napi::Function::New(env, NewDisplayList));
    exports.Set("dropDisplayList", Napi::Function::New(env, DropDisplayList));
    exports.Set("getDisplayListBounds", Napi::Function::New(env, GetDisplayListBounds));
    exports.Set("runDisplayList", Napi::Function::New(env, RunDisplayList));
    exports.Set("newDisplayListFromPage", Napi::Function::New(env, NewDisplayListFromPage));

    return exports;
}


