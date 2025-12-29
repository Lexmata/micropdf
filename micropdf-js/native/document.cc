/**
 * Document FFI Bindings
 *
 * Implements N-API bindings for PDF document functions.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"
#include <cstring>

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
 * Open document from file path
 * JavaScript: openDocumentFromPath(ctx: NativeContext, path: string): NativeDocument
 */
Napi::Value OpenDocumentFromPath(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected (context, path)").ThrowAsJavaScriptException();
        return env.Null();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    std::string path = info[1].As<Napi::String>().Utf8Value();

    fz_document doc = fz_open_document(ctx, path.c_str());
    if (doc == 0) {
        Napi::Error::New(env, "Failed to open document").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Object obj = Napi::Object::New(env);
    obj.Set("_handle", Napi::Number::New(env, doc));
    return obj;
}

/**
 * Open document from memory buffer
 * JavaScript: openDocument(ctx: NativeContext, data: Buffer, magic: string): NativeDocument
 */
Napi::Value OpenDocument(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3 || !info[0].IsObject() || !info[1].IsBuffer() || !info[2].IsString()) {
        Napi::TypeError::New(env, "Expected (context, buffer, magic)").ThrowAsJavaScriptException();
        return env.Null();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    Napi::Buffer<uint8_t> buffer = info[1].As<Napi::Buffer<uint8_t>>();
    std::string magic = info[2].As<Napi::String>().Utf8Value();

    fz_document doc = fz_open_document_with_buffer(ctx, magic.c_str(), buffer.Data(), buffer.Length());
    if (doc == 0) {
        Napi::Error::New(env, "Failed to open document").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Object obj = Napi::Object::New(env);
    obj.Set("_handle", Napi::Number::New(env, doc));
    return obj;
}

/**
 * Drop/free a document
 * JavaScript: dropDocument(ctx: NativeContext, doc: NativeDocument): void
 */
Napi::Value DropDocument(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
        Napi::TypeError::New(env, "Expected (context, document)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_document doc = GetDocument(info[1].As<Napi::Object>());

    fz_drop_document(ctx, doc);

    return env.Undefined();
}

/**
 * Count pages in document
 * JavaScript: countPages(ctx: NativeContext, doc: NativeDocument): number
 */
Napi::Value CountPages(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
        Napi::TypeError::New(env, "Expected (context, document)").ThrowAsJavaScriptException();
        return env.Null();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_document doc = GetDocument(info[1].As<Napi::Object>());

    int count = fz_count_pages(ctx, doc);

    return Napi::Number::New(env, count);
}

/**
 * Check if document needs password
 * JavaScript: needsPassword(ctx: NativeContext, doc: NativeDocument): boolean
 */
Napi::Value NeedsPassword(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
        Napi::TypeError::New(env, "Expected (context, document)").ThrowAsJavaScriptException();
        return env.Null();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_document doc = GetDocument(info[1].As<Napi::Object>());

    int needs = fz_needs_password(ctx, doc);

    return Napi::Boolean::New(env, needs != 0);
}

/**
 * Authenticate document with password
 * JavaScript: authenticatePassword(ctx: NativeContext, doc: NativeDocument, password: string): boolean
 */
Napi::Value AuthenticatePassword(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3 || !info[0].IsObject() || !info[1].IsObject() || !info[2].IsString()) {
        Napi::TypeError::New(env, "Expected (context, document, password)").ThrowAsJavaScriptException();
        return env.Null();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_document doc = GetDocument(info[1].As<Napi::Object>());
    std::string password = info[2].As<Napi::String>().Utf8Value();

    int success = fz_authenticate_password(ctx, doc, password.c_str());

    return Napi::Boolean::New(env, success != 0);
}

/**
 * Check document permission
 * JavaScript: hasPermission(ctx: NativeContext, doc: NativeDocument, permission: number): boolean
 */
Napi::Value HasPermission(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3 || !info[0].IsObject() || !info[1].IsObject() || !info[2].IsNumber()) {
        Napi::TypeError::New(env, "Expected (context, document, permission)").ThrowAsJavaScriptException();
        return env.Null();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_document doc = GetDocument(info[1].As<Napi::Object>());
    int permission = info[2].As<Napi::Number>().Int32Value();

    int has = fz_has_permission(ctx, doc, permission);

    return Napi::Boolean::New(env, has != 0);
}

/**
 * Get document metadata
 * JavaScript: getMetadata(ctx: NativeContext, doc: NativeDocument, key: string): string | null
 */
Napi::Value GetMetadata(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3 || !info[0].IsObject() || !info[1].IsObject() || !info[2].IsString()) {
        Napi::TypeError::New(env, "Expected (context, document, key)").ThrowAsJavaScriptException();
        return env.Null();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_document doc = GetDocument(info[1].As<Napi::Object>());
    std::string key = info[2].As<Napi::String>().Utf8Value();

    char buf[1024] = {0};
    int len = fz_lookup_metadata(ctx, doc, key.c_str(), buf, sizeof(buf));

    if (len > 0) {
        return Napi::String::New(env, buf);
    }

    return env.Null();
}

/**
 * Save document to file
 * JavaScript: saveDocument(ctx: NativeContext, doc: NativeDocument, path: string): void
 */
Napi::Value SaveDocument(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3 || !info[0].IsObject() || !info[1].IsObject() || !info[2].IsString()) {
        Napi::TypeError::New(env, "Expected (context, document, path)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_document doc = GetDocument(info[1].As<Napi::Object>());
    std::string path = info[2].As<Napi::String>().Utf8Value();

    pdf_save_document(ctx, doc, path.c_str(), nullptr);

    return env.Undefined();
}

/**
 * Resolve named destination
 * JavaScript: resolveLink(ctx: NativeContext, doc: NativeDocument, name: string): number | null
 */
Napi::Value ResolveLink(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3 || !info[0].IsObject() || !info[1].IsObject() || !info[2].IsString()) {
        Napi::TypeError::New(env, "Expected (context, document, name)").ThrowAsJavaScriptException();
        return env.Null();
    }

    fz_context ctx = GetContext(info[0].As<Napi::Object>());
    fz_document doc = GetDocument(info[1].As<Napi::Object>());
    std::string name = info[2].As<Napi::String>().Utf8Value();

    int page = pdf_lookup_named_dest(ctx, doc, name.c_str());

    if (page >= 0) {
        return Napi::Number::New(env, page);
    }

    return env.Null();
}

/**
 * Initialize document exports
 */
Napi::Object InitDocument(Napi::Env env, Napi::Object exports) {
    exports.Set("openDocumentFromPath", Napi::Function::New(env, OpenDocumentFromPath));
    exports.Set("openDocument", Napi::Function::New(env, OpenDocument));
    exports.Set("dropDocument", Napi::Function::New(env, DropDocument));
    exports.Set("countPages", Napi::Function::New(env, CountPages));
    exports.Set("needsPassword", Napi::Function::New(env, NeedsPassword));
    exports.Set("authenticatePassword", Napi::Function::New(env, AuthenticatePassword));
    exports.Set("hasPermission", Napi::Function::New(env, HasPermission));
    exports.Set("getMetadata", Napi::Function::New(env, GetMetadata));
    exports.Set("saveDocument", Napi::Function::New(env, SaveDocument));
    exports.Set("resolveLink", Napi::Function::New(env, ResolveLink));
    return exports;
}

