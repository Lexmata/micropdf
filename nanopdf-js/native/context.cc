/**
 * Context FFI Bindings
 *
 * Implements N-API bindings for MuPDF context functions (fz_context).
 * Context manages memory allocation, error handling, and resource tracking.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"

/**
 * Create a new context
 * JavaScript: createContext(): NativeContext
 */
Napi::Value CreateContext(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    fz_context ctx = fz_new_context(nullptr, nullptr, FZ_STORE_DEFAULT);
    if (ctx == 0) {
        Napi::Error::New(env, "Failed to create context").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Object obj = Napi::Object::New(env);
    obj.Set("_handle", Napi::Number::New(env, ctx));
    return obj;
}

/**
 * Drop/free a context
 * JavaScript: dropContext(ctx: NativeContext): void
 */
Napi::Value DropContext(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected context object").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    Napi::Object ctxObj = info[0].As<Napi::Object>();
    if (!ctxObj.Has("_handle")) {
        Napi::TypeError::New(env, "Invalid context object").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    fz_context ctx = ctxObj.Get("_handle").As<Napi::Number>().Int32Value();
    fz_drop_context(ctx);

    return env.Undefined();
}

/**
 * Clone a context (create a reference)
 * JavaScript: cloneContext(ctx: NativeContext): NativeContext
 */
Napi::Value CloneContext(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected context object").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Object ctxObj = info[0].As<Napi::Object>();
    fz_context ctx = ctxObj.Get("_handle").As<Napi::Number>().Int32Value();

    fz_context newCtx = fz_clone_context(ctx);

    Napi::Object obj = Napi::Object::New(env);
    obj.Set("_handle", Napi::Number::New(env, newCtx));
    return obj;
}

/**
 * Initialize context exports
 */
Napi::Object InitContext(Napi::Env env, Napi::Object exports) {
    exports.Set("createContext", Napi::Function::New(env, CreateContext));
    exports.Set("dropContext", Napi::Function::New(env, DropContext));
    exports.Set("cloneContext", Napi::Function::New(env, CloneContext));
    return exports;
}

