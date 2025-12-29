/**
 * MicroPDF Cookie Bindings
 *
 * N-API bindings for cookie operations.
 * Cookies provide progress tracking and cancellation for long-running operations.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"

/**
 * Create a new cookie
 *
 * @param ctx - Context handle
 * @returns Cookie handle
 */
Napi::BigInt NewCookie(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected 1 argument: ctx")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);

    uint64_t cookie_handle = fz_new_cookie(ctx_handle);

    return Napi::BigInt::New(env, cookie_handle);
}

/**
 * Drop cookie handle
 *
 * @param ctx - Context handle
 * @param cookie - Cookie handle
 */
Napi::Value DropCookie(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, cookie")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t cookie_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_drop_cookie(ctx_handle, cookie_handle);

    return env.Undefined();
}

/**
 * Abort operation via cookie
 *
 * @param ctx - Context handle
 * @param cookie - Cookie handle
 */
Napi::Value AbortCookie(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, cookie")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t cookie_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_abort_cookie(ctx_handle, cookie_handle);

    return env.Undefined();
}

/**
 * Get cookie progress
 *
 * @param ctx - Context handle
 * @param cookie - Cookie handle
 * @returns Object {progress, progressMax, errors}
 */
Napi::Object GetCookieProgress(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object result = Napi::Object::New(env);

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, cookie")
            .ThrowAsJavaScriptException();
        return result;
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t cookie_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t progress = 0;
    int32_t progress_max = 0;
    int32_t errors = 0;

    fz_cookie_progress(ctx_handle, cookie_handle, &progress, &progress_max, &errors);

    result.Set("progress", Napi::Number::New(env, progress));
    result.Set("progressMax", Napi::Number::New(env, progress_max));
    result.Set("errors", Napi::Number::New(env, errors));

    return result;
}

/**
 * Check if cookie has been aborted
 *
 * @param ctx - Context handle
 * @param cookie - Cookie handle
 * @returns Boolean
 */
Napi::Boolean IsCookieAborted(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, cookie")
            .ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t cookie_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t is_aborted = fz_cookie_is_aborted(ctx_handle, cookie_handle);

    return Napi::Boolean::New(env, is_aborted != 0);
}

/**
 * Reset cookie state
 *
 * @param ctx - Context handle
 * @param cookie - Cookie handle
 */
Napi::Value ResetCookie(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, cookie")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t cookie_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_reset_cookie(ctx_handle, cookie_handle);

    return env.Undefined();
}

/**
 * Initialize Cookie module exports
 */
Napi::Object InitCookie(Napi::Env env, Napi::Object exports) {
    exports.Set("newCookie", Napi::Function::New(env, NewCookie));
    exports.Set("dropCookie", Napi::Function::New(env, DropCookie));
    exports.Set("abortCookie", Napi::Function::New(env, AbortCookie));
    exports.Set("getCookieProgress", Napi::Function::New(env, GetCookieProgress));
    exports.Set("isCookieAborted", Napi::Function::New(env, IsCookieAborted));
    exports.Set("resetCookie", Napi::Function::New(env, ResetCookie));
    
    return exports;
}


