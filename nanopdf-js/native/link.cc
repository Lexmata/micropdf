/**
 * NanoPDF Link Bindings
 *
 * N-API bindings for PDF link/hyperlink operations.
 * Links provide navigation within and between PDF documents.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"

/**
 * Get first link on page
 *
 * @param ctx - Context handle
 * @param page - Page handle
 * @returns Link handle (or 0 if none)
 */
Napi::BigInt LoadPageLinks(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, page")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t page_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    uint64_t link_handle = fz_load_links(ctx_handle, page_handle);

    return Napi::BigInt::New(env, link_handle);
}

/**
 * Get next link in list
 *
 * @param ctx - Context handle
 * @param link - Current link handle
 * @returns Next link handle (or 0 if none)
 */
Napi::BigInt GetNextLink(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, link")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t link_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    uint64_t next_handle = fz_next_link(ctx_handle, link_handle);

    return Napi::BigInt::New(env, next_handle);
}

/**
 * Drop link handle
 *
 * @param ctx - Context handle
 * @param link - Link handle
 */
Napi::Value DropLink(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, link")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t link_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_drop_link(ctx_handle, link_handle);

    return env.Undefined();
}

/**
 * Get link rectangle
 *
 * @param ctx - Context handle
 * @param link - Link handle
 * @returns Rectangle {x0, y0, x1, y1}
 */
Napi::Object GetLinkRect(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object rect = Napi::Object::New(env);

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, link")
            .ThrowAsJavaScriptException();
        return rect;
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t link_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_rect link_rect = fz_link_rect(ctx_handle, link_handle);

    rect.Set("x0", Napi::Number::New(env, link_rect.x0));
    rect.Set("y0", Napi::Number::New(env, link_rect.y0));
    rect.Set("x1", Napi::Number::New(env, link_rect.x1));
    rect.Set("y1", Napi::Number::New(env, link_rect.y1));

    return rect;
}

/**
 * Get link URI
 *
 * @param ctx - Context handle
 * @param link - Link handle
 * @returns URI string (or empty if internal)
 */
Napi::String GetLinkURI(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, link")
            .ThrowAsJavaScriptException();
        return Napi::String::New(env, "");
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t link_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    char buffer[2048];
    fz_link_uri(ctx_handle, link_handle, buffer, sizeof(buffer));

    return Napi::String::New(env, buffer);
}

/**
 * Check if link is external
 *
 * @param ctx - Context handle
 * @param link - Link handle
 * @returns Boolean
 */
Napi::Boolean IsLinkExternal(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, link")
            .ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t link_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t is_external = fz_link_is_external(ctx_handle, link_handle);

    return Napi::Boolean::New(env, is_external != 0);
}

/**
 * Resolve link destination page
 *
 * @param ctx - Context handle
 * @param doc - Document handle
 * @param link - Link handle
 * @returns Page number (-1 if external)
 */
Napi::Number ResolveLinkPage(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, doc, link")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, -1);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t doc_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t link_handle = info[2].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t page_num = fz_resolve_link_page(ctx_handle, doc_handle, link_handle);

    return Napi::Number::New(env, page_num);
}

/**
 * Check if link is valid
 *
 * @param ctx - Context handle
 * @param link - Link handle
 * @returns Boolean
 */
Napi::Boolean IsLinkValid(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, link")
            .ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t link_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t is_valid = fz_link_is_valid(ctx_handle, link_handle);

    return Napi::Boolean::New(env, is_valid != 0);
}

/**
 * Initialize Link module exports
 */
Napi::Object InitLink(Napi::Env env, Napi::Object exports) {
    exports.Set("loadPageLinks", Napi::Function::New(env, LoadPageLinks));
    exports.Set("getNextLink", Napi::Function::New(env, GetNextLink));
    exports.Set("dropLink", Napi::Function::New(env, DropLink));
    exports.Set("getLinkRect", Napi::Function::New(env, GetLinkRect));
    exports.Set("getLinkURI", Napi::Function::New(env, GetLinkURI));
    exports.Set("isLinkExternal", Napi::Function::New(env, IsLinkExternal));
    exports.Set("resolveLinkPage", Napi::Function::New(env, ResolveLinkPage));
    exports.Set("isLinkValid", Napi::Function::New(env, IsLinkValid));

    return exports;
}

