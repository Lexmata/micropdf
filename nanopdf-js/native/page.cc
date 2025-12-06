/**
 * Page FFI Bindings
 *
 * Implements N-API bindings for PDF page functions including rendering and text extraction.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"
#include <vector>

/**
 * Helper: Extract context from object
 */
static fz_context GetContext(const Napi::Object& obj) {
    return obj.Get("_handle").As<Napi::Number>().Int32Value();
}

/**
 * Helper: Extract document handle from object
 */
static fz_document GetDocument(const Napi::Object& obj) {
    return obj.Get("_handle").As<Napi::Number>().Int32Value();
}

/**
 * Helper: Extract page handle from object
 */
static fz_page GetPage(const Napi::Object& obj) {
    return obj.Get("_handle").As<Napi::Number>().Int32Value();
}

/**
 * Helper: Extract matrix from object
 */
static fz_matrix GetMatrix(const Napi::Object& obj) {
    fz_matrix m;
    m.a = obj.Get("a").As<Napi::Number>().FloatValue();
    m.b = obj.Get("b").As<Napi::Number>().FloatValue();
    m.c = obj.Get("c").As<Napi::Number>().FloatValue();
    m.d = obj.Get("d").As<Napi::Number>().FloatValue();
    m.e = obj.Get("e").As<Napi::Number>().FloatValue();
    m.f = obj.Get("f").As<Napi::Number>().FloatValue();
    return m;
}

/**
 * Helper: Create rect object
 */
static Napi::Object CreateRect(Napi::Env env, const fz_rect& r) {
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("x0", Napi::Number::New(env, r.x0));
    obj.Set("y0", Napi::Number::New(env, r.y0));
    obj.Set("x1", Napi::Number::New(env, r.x1));
    obj.Set("y1", Napi::Number::New(env, r.y1));
    return obj;
}

/**
 * Load page from document
 * JavaScript: loadPage(ctx: NativeContext, doc: NativeDocument, pageNum: number): NativePage
 */
Napi::Value LoadPage(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3 || !info[0].IsObject() || !info[1].IsObject() || !info[2].IsNumber()) {
        Napi::TypeError::New(env, "Expected (context, document, pageNum)").ThrowAsJavaScriptException();
        return env.Null();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_document doc = GetDocument(info[1].As<Napi::Object>());
    int pageNum = info[2].As<Napi::Number>().Int32Value();

    fz_page page = fz_load_page(ctx, doc, pageNum);
    if (page == 0) {
        Napi::Error::New(env, "Failed to load page").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Object obj = Napi::Object::New(env);
    obj.Set("_handle", Napi::Number::New(env, page));
    return obj;
}

/**
 * Drop/free a page
 * JavaScript: dropPage(ctx: NativeContext, page: NativePage): void
 */
Napi::Value DropPage(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
        Napi::TypeError::New(env, "Expected (context, page)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_page page = GetPage(info[1].As<Napi::Object>());

    fz_drop_page(ctx, page);

    return env.Undefined();
}

/**
 * Get page bounds
 * JavaScript: boundPage(ctx: NativeContext, page: NativePage): NativeRect
 */
Napi::Value BoundPage(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
        Napi::TypeError::New(env, "Expected (context, page)").ThrowAsJavaScriptException();
        return env.Null();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_page page = GetPage(info[1].As<Napi::Object>());

    fz_rect bounds = fz_bound_page(ctx, page);

    return CreateRect(env, bounds);
}

/**
 * Render page to pixmap
 * JavaScript: renderPage(ctx: NativeContext, page: NativePage, matrix: NativeMatrix, colorspace: NativeColorspace, alpha: boolean): NativePixmap
 */
Napi::Value RenderPage(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 5) {
        Napi::TypeError::New(env, "Expected (context, page, matrix, colorspace, alpha)").ThrowAsJavaScriptException();
        return env.Null();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_page page = GetPage(info[1].As<Napi::Object>());
    fz_matrix matrix = GetMatrix(info[2].As<Napi::Object>());
    bool alpha = info[4].As<Napi::Boolean>().Value();

    // Get colorspace (simplified - assume RGB for now)
    fz_colorspace cs = fz_device_rgb(ctx);

    fz_pixmap pix = fz_new_pixmap_from_page(ctx, page, matrix, cs, alpha ? 1 : 0);
    if (pix == 0) {
        Napi::Error::New(env, "Failed to render page").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Object obj = Napi::Object::New(env);
    obj.Set("_handle", Napi::Number::New(env, pix));
    obj.Set("width", Napi::Number::New(env, fz_pixmap_width(ctx, pix)));
    obj.Set("height", Napi::Number::New(env, fz_pixmap_height(ctx, pix)));
    return obj;
}

/**
 * Render page to PNG buffer
 * JavaScript: renderPageToPNG(ctx: NativeContext, page: NativePage, dpi: number, colorspace: NativeColorspace): Buffer
 */
Napi::Value RenderPageToPNG(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected (context, page, dpi, colorspace)").ThrowAsJavaScriptException();
        return env.Null();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_page page = GetPage(info[1].As<Napi::Object>());
    float dpi = info[2].As<Napi::Number>().FloatValue();

    // Create transform matrix for DPI
    fz_matrix matrix = fz_scale(dpi / 72.0f, dpi / 72.0f);
    fz_colorspace cs = fz_device_rgb(ctx);

    // Render to pixmap
    fz_pixmap pix = fz_new_pixmap_from_page(ctx, page, matrix, cs, 0);
    if (pix == 0) {
        Napi::Error::New(env, "Failed to render page").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Encode to PNG
    fz_buffer buf = fz_new_buffer_from_pixmap_as_png(ctx, pix, 0);
    fz_drop_pixmap(ctx, pix);

    if (buf == 0) {
        Napi::Error::New(env, "Failed to encode PNG").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Get buffer data
    size_t len;
    const unsigned char* data = fz_buffer_data(ctx, buf, &len);

    // Create Node.js buffer
    Napi::Buffer<uint8_t> result = Napi::Buffer<uint8_t>::Copy(env, data, len);

    fz_drop_buffer(ctx, buf);

    return result;
}

/**
 * Extract text from page
 * JavaScript: extractText(ctx: NativeContext, page: NativePage): string
 */
Napi::Value ExtractText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
        Napi::TypeError::New(env, "Expected (context, page)").ThrowAsJavaScriptException();
        return env.Null();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_page page = GetPage(info[1].As<Napi::Object>());

    // Create text page
    fz_stext_page stext = fz_new_stext_page_from_page(ctx, page, nullptr);
    if (stext == 0) {
        Napi::Error::New(env, "Failed to extract text").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Extract text to buffer
    fz_buffer buf = fz_new_buffer_from_stext_page(ctx, stext);
    fz_drop_stext_page(ctx, stext);

    if (buf == 0) {
        Napi::Error::New(env, "Failed to create text buffer").ThrowAsJavaScriptException();
        return env.Null();
    }

    size_t len;
    const char* data = (const char*)fz_buffer_data(ctx, buf, &len);
    std::string text(data, len);

    fz_drop_buffer(ctx, buf);

    return Napi::String::New(env, text);
}

/**
 * Extract text blocks from page
 * JavaScript: extractTextBlocks(ctx: NativeContext, page: NativePage): Array<{text: string, bbox: NativeRect}>
 */
Napi::Value ExtractTextBlocks(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
        Napi::TypeError::New(env, "Expected (context, page)").ThrowAsJavaScriptException();
        return env.Null();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_page page = GetPage(info[1].As<Napi::Object>());

    // Create text page
    fz_stext_page stext = fz_new_stext_page_from_page(ctx, page, nullptr);
    if (stext == 0) {
        Napi::Error::New(env, "Failed to extract text").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Array blocks = Napi::Array::New(env);
    uint32_t blockIndex = 0;

    // Iterate through blocks (simplified - would need to access stext_page internals)
    // For now, return a single block with all text
    fz_buffer buf = fz_new_buffer_from_stext_page(ctx, stext);
    size_t len;
    const char* data = (const char*)fz_buffer_data(ctx, buf, &len);

    Napi::Object block = Napi::Object::New(env);
    block.Set("text", Napi::String::New(env, data, len));
    block.Set("bbox", CreateRect(env, fz_bound_page(ctx, page)));

    blocks[blockIndex++] = block;

    fz_drop_buffer(ctx, buf);
    fz_drop_stext_page(ctx, stext);

    return blocks;
}

/**
 * Get page links
 * JavaScript: getPageLinks(ctx: NativeContext, page: NativePage): Array<{rect: NativeRect, uri?: string, page?: number}>
 */
Napi::Value GetPageLinks(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
        Napi::TypeError::New(env, "Expected (context, page)").ThrowAsJavaScriptException();
        return env.Null();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_page page = GetPage(info[1].As<Napi::Object>());

    Napi::Array links = Napi::Array::New(env);

    // Get links from page
    fz_link link = fz_load_links(ctx, page);
    uint32_t linkIndex = 0;

    while (link != 0) {
        Napi::Object linkObj = Napi::Object::New(env);

        fz_rect rect = fz_link_rect(ctx, link);
        linkObj.Set("rect", CreateRect(env, rect));

        const char* uri = fz_link_uri(ctx, link);
        if (uri != nullptr) {
            linkObj.Set("uri", Napi::String::New(env, uri));
        }

        links[linkIndex++] = linkObj;
        link = fz_link_next(ctx, link);
    }

    return links;
}

/**
 * Search text on page
 * JavaScript: searchText(ctx: NativeContext, page: NativePage, needle: string, hitMax: boolean): Array<NativeRect>
 */
Napi::Value SearchText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected (context, page, needle, hitMax)").ThrowAsJavaScriptException();
        return env.Null();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_page page = GetPage(info[1].As<Napi::Object>());
    std::string needle = info[2].As<Napi::String>().Utf8Value();

    // Create text page for searching
    fz_stext_page stext = fz_new_stext_page_from_page(ctx, page, nullptr);
    if (stext == 0) {
        Napi::Error::New(env, "Failed to create text page").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Array results = Napi::Array::New(env);

    // Search for text (simplified - would need proper quad array handling)
    fz_quad hits[512];
    int hitCount = fz_search_stext_page(ctx, stext, needle.c_str(), nullptr, hits, 512);

    for (int i = 0; i < hitCount; i++) {
        fz_rect rect;
        rect.x0 = hits[i].ll.x;
        rect.y0 = hits[i].ll.y;
        rect.x1 = hits[i].ur.x;
        rect.y1 = hits[i].ur.y;
        results[i] = CreateRect(env, rect);
    }

    fz_drop_stext_page(ctx, stext);

    return results;
}

/**
 * Initialize page exports
 */
Napi::Object InitPage(Napi::Env env, Napi::Object exports) {
    exports.Set("loadPage", Napi::Function::New(env, LoadPage));
    exports.Set("dropPage", Napi::Function::New(env, DropPage));
    exports.Set("boundPage", Napi::Function::New(env, BoundPage));
    exports.Set("renderPage", Napi::Function::New(env, RenderPage));
    exports.Set("renderPageToPNG", Napi::Function::New(env, RenderPageToPNG));
    exports.Set("extractText", Napi::Function::New(env, ExtractText));
    exports.Set("extractTextBlocks", Napi::Function::New(env, ExtractTextBlocks));
    exports.Set("getPageLinks", Napi::Function::New(env, GetPageLinks));
    exports.Set("searchText", Napi::Function::New(env, SearchText));
    return exports;
}

