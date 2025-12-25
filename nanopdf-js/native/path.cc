/**
 * NanoPDF Path Bindings
 *
 * N-API bindings for path operations.
 * Paths represent vector graphics for stroking and filling.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"

/**
 * Create a new empty path
 *
 * @param ctx - Context handle
 * @returns Path handle
 */
Napi::BigInt NewPath(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected 1 argument: ctx")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);

    uint64_t path_handle = fz_new_path(ctx_handle);

    return Napi::BigInt::New(env, path_handle);
}

/**
 * Drop path handle
 *
 * @param ctx - Context handle
 * @param path - Path handle
 */
Napi::Value DropPath(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, path")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t path_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_drop_path(ctx_handle, path_handle);

    return env.Undefined();
}

/**
 * Move to a point (start new subpath)
 *
 * @param ctx - Context handle
 * @param path - Path handle
 * @param x - X coordinate
 * @param y - Y coordinate
 */
Napi::Value PathMoveTo(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected 4 arguments: ctx, path, x, y")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t path_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    float x = info[2].As<Napi::Number>().FloatValue();
    float y = info[3].As<Napi::Number>().FloatValue();

    fz_moveto(ctx_handle, path_handle, x, y);

    return env.Undefined();
}

/**
 * Line to a point
 *
 * @param ctx - Context handle
 * @param path - Path handle
 * @param x - X coordinate
 * @param y - Y coordinate
 */
Napi::Value PathLineTo(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected 4 arguments: ctx, path, x, y")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t path_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    float x = info[2].As<Napi::Number>().FloatValue();
    float y = info[3].As<Napi::Number>().FloatValue();

    fz_lineto(ctx_handle, path_handle, x, y);

    return env.Undefined();
}

/**
 * Cubic Bezier curve to a point
 *
 * @param ctx - Context handle
 * @param path - Path handle
 * @param x1 - Control point 1 X
 * @param y1 - Control point 1 Y
 * @param x2 - Control point 2 X
 * @param y2 - Control point 2 Y
 * @param x3 - End point X
 * @param y3 - End point Y
 */
Napi::Value PathCurveTo(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 8) {
        Napi::TypeError::New(env, "Expected 8 arguments: ctx, path, x1, y1, x2, y2, x3, y3")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t path_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    float x1 = info[2].As<Napi::Number>().FloatValue();
    float y1 = info[3].As<Napi::Number>().FloatValue();
    float x2 = info[4].As<Napi::Number>().FloatValue();
    float y2 = info[5].As<Napi::Number>().FloatValue();
    float x3 = info[6].As<Napi::Number>().FloatValue();
    float y3 = info[7].As<Napi::Number>().FloatValue();

    fz_curveto(ctx_handle, path_handle, x1, y1, x2, y2, x3, y3);

    return env.Undefined();
}

/**
 * Close the current subpath
 *
 * @param ctx - Context handle
 * @param path - Path handle
 */
Napi::Value PathClosePath(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, path")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t path_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_closepath(ctx_handle, path_handle);

    return env.Undefined();
}

/**
 * Add rectangle to path
 *
 * @param ctx - Context handle
 * @param path - Path handle
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param w - Width
 * @param h - Height
 */
Napi::Value PathRect(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 6) {
        Napi::TypeError::New(env, "Expected 6 arguments: ctx, path, x, y, w, h")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t path_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    float x = info[2].As<Napi::Number>().FloatValue();
    float y = info[3].As<Napi::Number>().FloatValue();
    float w = info[4].As<Napi::Number>().FloatValue();
    float h = info[5].As<Napi::Number>().FloatValue();

    fz_rectto(ctx_handle, path_handle, x, y, w, h);

    return env.Undefined();
}

/**
 * Get path bounding box
 *
 * @param ctx - Context handle
 * @param path - Path handle
 * @param stroke - Optional stroke state handle
 * @param ctm - Optional transform matrix
 * @returns Rectangle {x0, y0, x1, y1}
 */
Napi::Object PathBoundPath(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object result = Napi::Object::New(env);

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected at least 2 arguments: ctx, path")
            .ThrowAsJavaScriptException();
        return result;
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t path_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    uint64_t stroke_handle = 0;
    if (info.Length() > 2 && !info[2].IsNull() && !info[2].IsUndefined()) {
        stroke_handle = info[2].As<Napi::BigInt>().Uint64Value(&lossless);
    }

    fz_rect rect = fz_bound_path(ctx_handle, path_handle, stroke_handle);

    result.Set("x0", Napi::Number::New(env, rect.x0));
    result.Set("y0", Napi::Number::New(env, rect.y0));
    result.Set("x1", Napi::Number::New(env, rect.x1));
    result.Set("y1", Napi::Number::New(env, rect.y1));

    return result;
}

/**
 * Initialize Path module exports
 */
Napi::Object InitPath(Napi::Env env, Napi::Object exports) {
    exports.Set("newPath", Napi::Function::New(env, NewPath));
    exports.Set("dropPath", Napi::Function::New(env, DropPath));
    exports.Set("pathMoveTo", Napi::Function::New(env, PathMoveTo));
    exports.Set("pathLineTo", Napi::Function::New(env, PathLineTo));
    exports.Set("pathCurveTo", Napi::Function::New(env, PathCurveTo));
    exports.Set("pathClosePath", Napi::Function::New(env, PathClosePath));
    exports.Set("pathRect", Napi::Function::New(env, PathRect));
    exports.Set("pathBoundPath", Napi::Function::New(env, PathBoundPath));

    return exports;
}

