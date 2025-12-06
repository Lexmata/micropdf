/**
 * NanoPDF Font Bindings
 *
 * N-API bindings for font operations.
 * Fonts provide glyph rendering and text metrics.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"

/**
 * Create a new font
 *
 * @param ctx - Context handle
 * @param name - Font name
 * @param isBold - Is font bold
 * @param isItalic - Is font italic
 * @returns Font handle
 */
Napi::BigInt NewFont(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected 4 arguments: ctx, name, isBold, isItalic")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    std::string name = info[1].As<Napi::String>().Utf8Value();
    int32_t is_bold = info[2].As<Napi::Boolean>().Value() ? 1 : 0;
    int32_t is_italic = info[3].As<Napi::Boolean>().Value() ? 1 : 0;

    uint64_t font_handle = fz_new_font(ctx_handle, name.c_str(), is_bold, is_italic, 0);

    return Napi::BigInt::New(env, font_handle);
}

/**
 * Load font from file
 *
 * @param ctx - Context handle
 * @param name - Font name
 * @param path - Path to font file
 * @param index - Font index (for font collections)
 * @returns Font handle
 */
Napi::BigInt NewFontFromFile(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected 4 arguments: ctx, name, path, index")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    std::string name = info[1].As<Napi::String>().Utf8Value();
    std::string path = info[2].As<Napi::String>().Utf8Value();
    int32_t index = info[3].As<Napi::Number>().Int32Value();

    uint64_t font_handle = fz_new_font_from_file(
        ctx_handle,
        name.c_str(),
        path.c_str(),
        index,
        0
    );

    return Napi::BigInt::New(env, font_handle);
}

/**
 * Load font from buffer
 *
 * @param ctx - Context handle
 * @param name - Font name
 * @param data - Buffer containing font data
 * @param index - Font index (for font collections)
 * @returns Font handle
 */
Napi::BigInt NewFontFromMemory(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected 4 arguments: ctx, name, data, index")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    std::string name = info[1].As<Napi::String>().Utf8Value();
    Napi::Buffer<uint8_t> buffer = info[2].As<Napi::Buffer<uint8_t>>();
    int32_t index = info[3].As<Napi::Number>().Int32Value();

    uint64_t font_handle = fz_new_font_from_memory(
        ctx_handle,
        name.c_str(),
        buffer.Data(),
        buffer.Length(),
        index,
        0
    );

    return Napi::BigInt::New(env, font_handle);
}

/**
 * Drop font handle
 *
 * @param ctx - Context handle
 * @param font - Font handle
 */
Napi::Value DropFont(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, font")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t font_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_drop_font(ctx_handle, font_handle);

    return env.Undefined();
}

/**
 * Get font name
 *
 * @param ctx - Context handle
 * @param font - Font handle
 * @returns Font name string
 */
Napi::String FontName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, font")
            .ThrowAsJavaScriptException();
        return Napi::String::New(env, "");
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t font_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    char name_buffer[256] = {0};
    fz_font_name(ctx_handle, font_handle, name_buffer, sizeof(name_buffer));

    return Napi::String::New(env, name_buffer);
}

/**
 * Check if font is bold
 *
 * @param ctx - Context handle
 * @param font - Font handle
 * @returns Boolean
 */
Napi::Boolean FontIsBold(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, font")
            .ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t font_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t is_bold = fz_font_is_bold(ctx_handle, font_handle);

    return Napi::Boolean::New(env, is_bold != 0);
}

/**
 * Check if font is italic
 *
 * @param ctx - Context handle
 * @param font - Font handle
 * @returns Boolean
 */
Napi::Boolean FontIsItalic(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, font")
            .ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t font_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t is_italic = fz_font_is_italic(ctx_handle, font_handle);

    return Napi::Boolean::New(env, is_italic != 0);
}

/**
 * Encode a Unicode character to glyph ID
 *
 * @param ctx - Context handle
 * @param font - Font handle
 * @param unicode - Unicode code point
 * @returns Glyph ID
 */
Napi::Number EncodeCharacter(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, font, unicode")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t font_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    int32_t unicode = info[2].As<Napi::Number>().Int32Value();

    int32_t glyph_id = fz_encode_character(ctx_handle, font_handle, unicode);

    return Napi::Number::New(env, glyph_id);
}

/**
 * Get glyph advance width
 *
 * @param ctx - Context handle
 * @param font - Font handle
 * @param glyphId - Glyph ID
 * @returns Advance width
 */
Napi::Number AdvanceGlyph(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, font, glyphId")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t font_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    int32_t glyph_id = info[2].As<Napi::Number>().Int32Value();

    float advance = fz_advance_glyph(ctx_handle, font_handle, glyph_id, 0);

    return Napi::Number::New(env, advance);
}

/**
 * Initialize Font module exports
 */
Napi::Object InitFont(Napi::Env env, Napi::Object exports) {
    exports.Set("newFont", Napi::Function::New(env, NewFont));
    exports.Set("newFontFromFile", Napi::Function::New(env, NewFontFromFile));
    exports.Set("newFontFromMemory", Napi::Function::New(env, NewFontFromMemory));
    exports.Set("dropFont", Napi::Function::New(env, DropFont));
    exports.Set("fontName", Napi::Function::New(env, FontName));
    exports.Set("fontIsBold", Napi::Function::New(env, FontIsBold));
    exports.Set("fontIsItalic", Napi::Function::New(env, FontIsItalic));
    exports.Set("encodeCharacter", Napi::Function::New(env, EncodeCharacter));
    exports.Set("advanceGlyph", Napi::Function::New(env, AdvanceGlyph));

    return exports;
}


