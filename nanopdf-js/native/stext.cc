/**
 * NanoPDF Structured Text (SText) Bindings
 *
 * N-API bindings for MuPDF's structured text extraction API.
 * Provides layout-aware text extraction with blocks, lines, and characters.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"

/**
 * Create a structured text page from a document page
 *
 * @param ctx - Context handle
 * @param page - Page handle
 * @param options - Options (reserved for future use, pass 0)
 * @returns SText page handle
 */
Napi::BigInt NewSTextPage(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, page")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, 0);
    }

    // Get context handle
    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);

    // Get page handle
    uint64_t page_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    // Call Rust FFI
    uint64_t stext_handle = fz_new_stext_page_from_page(
        ctx_handle,
        page_handle,
        nullptr  // options - pass nullptr for default
    );

    return Napi::BigInt::New(env, stext_handle);
}

/**
 * Drop a structured text page
 *
 * @param ctx - Context handle
 * @param stext - SText page handle
 */
Napi::Value DropSTextPage(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, stext")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t stext_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_drop_stext_page(ctx_handle, stext_handle);

    return env.Undefined();
}

/**
 * Get plain text from structured text page
 *
 * @param ctx - Context handle
 * @param stext - SText page handle
 * @returns Plain text string
 */
Napi::String GetSTextAsText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, stext")
            .ThrowAsJavaScriptException();
        return Napi::String::New(env, "");
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t stext_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    // Create buffer for text
    uint64_t buffer_handle = fz_new_buffer_from_stext_page(ctx_handle, stext_handle);
    
    if (buffer_handle == 0) {
        return Napi::String::New(env, "");
    }

    // Get buffer data
    size_t len = 0;
    const uint8_t* data = fz_buffer_data(ctx_handle, buffer_handle, &len);

    std::string text;
    if (data && len > 0) {
        text = std::string(reinterpret_cast<const char*>(data), len);
    }

    // Drop buffer
    fz_drop_buffer(ctx_handle, buffer_handle);

    return Napi::String::New(env, text);
}

/**
 * Search text in structured text page
 *
 * @param ctx - Context handle
 * @param stext - SText page handle
 * @param needle - Search string
 * @param maxHits - Maximum number of hits (default 500)
 * @returns Array of quads (bounding boxes for hits)
 */
Napi::Array SearchSTextPage(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array results = Napi::Array::New(env);

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3+ arguments: ctx, stext, needle")
            .ThrowAsJavaScriptException();
        return results;
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t stext_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    std::string needle = info[2].As<Napi::String>().Utf8Value();
    
    int max_hits = 500;
    if (info.Length() > 3 && info[3].IsNumber()) {
        max_hits = info[3].As<Napi::Number>().Int32Value();
    }

    // Allocate array for hit quads
    fz_quad* hit_bbox = new fz_quad[max_hits];

    // Search
    int hit_count = fz_search_stext_page(
        ctx_handle,
        stext_handle,
        needle.c_str(),
        nullptr,  // mark (unused)
        hit_bbox,
        max_hits
    );

    // Convert quads to JS objects
    for (int i = 0; i < hit_count; i++) {
        Napi::Object quad = Napi::Object::New(env);
        
        // Upper-left
        Napi::Object ul = Napi::Object::New(env);
        ul.Set("x", Napi::Number::New(env, hit_bbox[i].x0));
        ul.Set("y", Napi::Number::New(env, hit_bbox[i].y0));
        
        // Upper-right
        Napi::Object ur = Napi::Object::New(env);
        ur.Set("x", Napi::Number::New(env, hit_bbox[i].x1));
        ur.Set("y", Napi::Number::New(env, hit_bbox[i].y1));
        
        // Lower-left
        Napi::Object ll = Napi::Object::New(env);
        ll.Set("x", Napi::Number::New(env, hit_bbox[i].x3));
        ll.Set("y", Napi::Number::New(env, hit_bbox[i].y3));
        
        // Lower-right
        Napi::Object lr = Napi::Object::New(env);
        lr.Set("x", Napi::Number::New(env, hit_bbox[i].x2));
        lr.Set("y", Napi::Number::New(env, hit_bbox[i].y2));
        
        quad.Set("ul", ul);
        quad.Set("ur", ur);
        quad.Set("ll", ll);
        quad.Set("lr", lr);
        
        results.Set(i, quad);
    }

    delete[] hit_bbox;

    return results;
}

/**
 * Get structured text page bounds
 *
 * @param ctx - Context handle
 * @param stext - SText page handle
 * @returns Rectangle object {x0, y0, x1, y1}
 */
Napi::Object GetSTextPageBounds(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object rect = Napi::Object::New(env);

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, stext")
            .ThrowAsJavaScriptException();
        return rect;
    }

    // For now, return a default rect
    // TODO: Implement fz_stext_page_bounds in Rust FFI
    rect.Set("x0", Napi::Number::New(env, 0));
    rect.Set("y0", Napi::Number::New(env, 0));
    rect.Set("x1", Napi::Number::New(env, 612));
    rect.Set("y1", Napi::Number::New(env, 792));

    return rect;
}

/**
 * Initialize SText module exports
 */
Napi::Object InitSText(Napi::Env env, Napi::Object exports) {
    // SText operations
    exports.Set("newSTextPage", Napi::Function::New(env, NewSTextPage));
    exports.Set("dropSTextPage", Napi::Function::New(env, DropSTextPage));
    exports.Set("getSTextAsText", Napi::Function::New(env, GetSTextAsText));
    exports.Set("searchSTextPage", Napi::Function::New(env, SearchSTextPage));
    exports.Set("getSTextPageBounds", Napi::Function::New(env, GetSTextPageBounds));

    return exports;
}

