/**
 * NanoPDF Annotation Bindings
 *
 * N-API bindings for PDF annotation operations.
 * Supports creating, modifying, and managing annotations.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"
#include <string>

/**
 * Create a new annotation on a page
 *
 * @param ctx - Context handle
 * @param page - Page handle
 * @param type - Annotation type (0-27)
 * @returns Annotation handle
 */
Napi::BigInt CreateAnnotation(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, page, type")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t page_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    int32_t annot_type = info[2].As<Napi::Number>().Int32Value();

    // Validate annotation type (0-27)
    if (annot_type < 0 || annot_type > 27) {
        Napi::TypeError::New(env, "Invalid annotation type (must be 0-27)")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    // Call Rust FFI
    uint64_t annot_handle = pdf_create_annot(ctx_handle, page_handle, annot_type);

    return Napi::BigInt::New(env, annot_handle);
}

/**
 * Delete an annotation
 *
 * @param ctx - Context handle
 * @param page - Page handle
 * @param annot - Annotation handle
 */
Napi::Value DeleteAnnotation(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, page, annot")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t page_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[2].As<Napi::BigInt>().Uint64Value(&lossless);

    pdf_delete_annot(ctx_handle, page_handle, annot_handle);

    return env.Undefined();
}

/**
 * Drop annotation handle
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 */
Napi::Value DropAnnotation(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, annot")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    pdf_drop_annot(ctx_handle, annot_handle);

    return env.Undefined();
}

/**
 * Get annotation type
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 * @returns Annotation type number
 */
Napi::Number GetAnnotationType(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, annot")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, -1);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t type = pdf_annot_type(ctx_handle, annot_handle);

    return Napi::Number::New(env, type);
}

/**
 * Get annotation rectangle
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 * @returns Rectangle {x0, y0, x1, y1}
 */
Napi::Object GetAnnotationRect(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object rect = Napi::Object::New(env);

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, annot")
            .ThrowAsJavaScriptException();
        return rect;
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_rect annot_rect = pdf_annot_rect(ctx_handle, annot_handle);

    rect.Set("x0", Napi::Number::New(env, annot_rect.x0));
    rect.Set("y0", Napi::Number::New(env, annot_rect.y0));
    rect.Set("x1", Napi::Number::New(env, annot_rect.x1));
    rect.Set("y1", Napi::Number::New(env, annot_rect.y1));

    return rect;
}

/**
 * Set annotation rectangle
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 * @param rect - Rectangle {x0, y0, x1, y1}
 */
Napi::Value SetAnnotationRect(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, annot, rect")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    Napi::Object rect_obj = info[2].As<Napi::Object>();
    fz_rect rect;
    rect.x0 = rect_obj.Get("x0").As<Napi::Number>().FloatValue();
    rect.y0 = rect_obj.Get("y0").As<Napi::Number>().FloatValue();
    rect.x1 = rect_obj.Get("x1").As<Napi::Number>().FloatValue();
    rect.y1 = rect_obj.Get("y1").As<Napi::Number>().FloatValue();

    pdf_set_annot_rect(ctx_handle, annot_handle, rect);

    return env.Undefined();
}

/**
 * Get annotation flags
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 * @returns Flags as number
 */
Napi::Number GetAnnotationFlags(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, annot")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    uint32_t flags = pdf_annot_flags(ctx_handle, annot_handle);

    return Napi::Number::New(env, flags);
}

/**
 * Set annotation flags
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 * @param flags - Flags as number
 */
Napi::Value SetAnnotationFlags(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, annot, flags")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    uint32_t flags = info[2].As<Napi::Number>().Uint32Value();

    pdf_set_annot_flags(ctx_handle, annot_handle, flags);

    return env.Undefined();
}

/**
 * Get annotation contents
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 * @returns Contents string
 */
Napi::String GetAnnotationContents(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, annot")
            .ThrowAsJavaScriptException();
        return Napi::String::New(env, "");
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    // Allocate buffer for contents
    char buffer[4096];
    pdf_annot_contents(ctx_handle, annot_handle, buffer, sizeof(buffer));

    return Napi::String::New(env, buffer);
}

/**
 * Set annotation contents
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 * @param contents - Contents string
 */
Napi::Value SetAnnotationContents(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, annot, contents")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    std::string contents = info[2].As<Napi::String>().Utf8Value();

    pdf_set_annot_contents(ctx_handle, annot_handle, contents.c_str());

    return env.Undefined();
}

/**
 * Get annotation author
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 * @returns Author string
 */
Napi::String GetAnnotationAuthor(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, annot")
            .ThrowAsJavaScriptException();
        return Napi::String::New(env, "");
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    char buffer[256];
    pdf_annot_author(ctx_handle, annot_handle, buffer, sizeof(buffer));

    return Napi::String::New(env, buffer);
}

/**
 * Set annotation author
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 * @param author - Author string
 */
Napi::Value SetAnnotationAuthor(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, annot, author")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    std::string author = info[2].As<Napi::String>().Utf8Value();

    pdf_set_annot_author(ctx_handle, annot_handle, author.c_str());

    return env.Undefined();
}

/**
 * Get annotation opacity
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 * @returns Opacity (0.0-1.0)
 */
Napi::Number GetAnnotationOpacity(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, annot")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, 1.0);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    float opacity = pdf_annot_opacity(ctx_handle, annot_handle);

    return Napi::Number::New(env, opacity);
}

/**
 * Set annotation opacity
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 * @param opacity - Opacity (0.0-1.0)
 */
Napi::Value SetAnnotationOpacity(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, annot, opacity")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    float opacity = info[2].As<Napi::Number>().FloatValue();

    // Clamp opacity to valid range
    if (opacity < 0.0f) opacity = 0.0f;
    if (opacity > 1.0f) opacity = 1.0f;

    pdf_set_annot_opacity(ctx_handle, annot_handle, opacity);

    return env.Undefined();
}

/**
 * Check if annotation is dirty (modified)
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 * @returns Boolean
 */
Napi::Boolean IsAnnotationDirty(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, annot")
            .ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t is_dirty = pdf_annot_has_dirty(ctx_handle, annot_handle);

    return Napi::Boolean::New(env, is_dirty != 0);
}

/**
 * Clear annotation dirty flag
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 */
Napi::Value ClearAnnotationDirty(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, annot")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    pdf_annot_clear_dirty(ctx_handle, annot_handle);

    return env.Undefined();
}

/**
 * Update annotation appearance
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 * @returns Success boolean
 */
Napi::Boolean UpdateAnnotation(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, annot")
            .ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t result = pdf_update_annot(ctx_handle, annot_handle);

    return Napi::Boolean::New(env, result != 0);
}

/**
 * Clone an annotation
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 * @returns New annotation handle
 */
Napi::BigInt CloneAnnotation(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, annot")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    uint64_t new_annot = pdf_clone_annot(ctx_handle, annot_handle);

    return Napi::BigInt::New(env, new_annot);
}

/**
 * Check if annotation is valid
 *
 * @param ctx - Context handle
 * @param annot - Annotation handle
 * @returns Boolean
 */
Napi::Boolean IsAnnotationValid(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, annot")
            .ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t annot_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t is_valid = pdf_annot_is_valid(ctx_handle, annot_handle);

    return Napi::Boolean::New(env, is_valid != 0);
}

/**
 * Initialize Annotation module exports
 */
Napi::Object InitAnnotation(Napi::Env env, Napi::Object exports) {
    // Annotation lifecycle
    exports.Set("createAnnotation", Napi::Function::New(env, CreateAnnotation));
    exports.Set("deleteAnnotation", Napi::Function::New(env, DeleteAnnotation));
    exports.Set("dropAnnotation", Napi::Function::New(env, DropAnnotation));

    // Annotation properties
    exports.Set("getAnnotationType", Napi::Function::New(env, GetAnnotationType));
    exports.Set("getAnnotationRect", Napi::Function::New(env, GetAnnotationRect));
    exports.Set("setAnnotationRect", Napi::Function::New(env, SetAnnotationRect));
    exports.Set("getAnnotationFlags", Napi::Function::New(env, GetAnnotationFlags));
    exports.Set("setAnnotationFlags", Napi::Function::New(env, SetAnnotationFlags));

    // Annotation content
    exports.Set("getAnnotationContents", Napi::Function::New(env, GetAnnotationContents));
    exports.Set("setAnnotationContents", Napi::Function::New(env, SetAnnotationContents));
    exports.Set("getAnnotationAuthor", Napi::Function::New(env, GetAnnotationAuthor));
    exports.Set("setAnnotationAuthor", Napi::Function::New(env, SetAnnotationAuthor));

    // Annotation appearance
    exports.Set("getAnnotationOpacity", Napi::Function::New(env, GetAnnotationOpacity));
    exports.Set("setAnnotationOpacity", Napi::Function::New(env, SetAnnotationOpacity));

    // Annotation state
    exports.Set("isAnnotationDirty", Napi::Function::New(env, IsAnnotationDirty));
    exports.Set("clearAnnotationDirty", Napi::Function::New(env, ClearAnnotationDirty));
    exports.Set("updateAnnotation", Napi::Function::New(env, UpdateAnnotation));

    // Annotation utilities
    exports.Set("cloneAnnotation", Napi::Function::New(env, CloneAnnotation));
    exports.Set("isAnnotationValid", Napi::Function::New(env, IsAnnotationValid));

    return exports;
}

