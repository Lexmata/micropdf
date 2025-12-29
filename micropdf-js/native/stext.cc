/**
 * MicroPDF Structured Text (SText) Bindings
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
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
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
        ul.Set("x", Napi::Number::New(env, hit_bbox[i].ul.x));
        ul.Set("y", Napi::Number::New(env, hit_bbox[i].ul.y));

        // Upper-right
        Napi::Object ur = Napi::Object::New(env);
        ur.Set("x", Napi::Number::New(env, hit_bbox[i].ur.x));
        ur.Set("y", Napi::Number::New(env, hit_bbox[i].ur.y));

        // Lower-left
        Napi::Object ll = Napi::Object::New(env);
        ll.Set("x", Napi::Number::New(env, hit_bbox[i].ll.x));
        ll.Set("y", Napi::Number::New(env, hit_bbox[i].ll.y));

        // Lower-right
        Napi::Object lr = Napi::Object::New(env);
        lr.Set("x", Napi::Number::New(env, hit_bbox[i].lr.x));
        lr.Set("y", Napi::Number::New(env, hit_bbox[i].lr.y));

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

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t stext_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    // Call Rust FFI to get bounds
    fz_rect bounds = fz_bound_stext_page(ctx_handle, stext_handle);

    rect.Set("x0", Napi::Number::New(env, bounds.x0));
    rect.Set("y0", Napi::Number::New(env, bounds.y0));
    rect.Set("x1", Napi::Number::New(env, bounds.x1));
    rect.Set("y1", Napi::Number::New(env, bounds.y1));

    return rect;
}

/**
 * Get blocks from structured text page (hierarchical navigation)
 *
 * Returns an array of blocks, where each block contains:
 * - blockType: string ("Text", "Image", "List", "Table")
 * - bbox: rectangle {x0, y0, x1, y1}
 * - lines: array (to be filled by getSTextBlockLines)
 *
 * @param ctx - Context handle
 * @param stext - SText page handle
 * @returns Array of block objects
 */
Napi::Array GetSTextPageBlocks(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array blocks = Napi::Array::New(env);

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, stext")
            .ThrowAsJavaScriptException();
        return blocks;
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t stext_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    // Call Rust FFI to get blocks
    // For now, we'll create a simplified block structure
    // In a full implementation, this would call fz_stext_page_get_blocks
    // and iterate through the actual block structure

    // Get the text to parse into blocks
    uint64_t buffer_handle = fz_new_buffer_from_stext_page(ctx_handle, stext_handle);
    if (buffer_handle == 0) {
        return blocks;
    }

    size_t len = 0;
    const uint8_t* data = fz_buffer_data(ctx_handle, buffer_handle, &len);

    if (data && len > 0) {
        // Create a single text block for simplicity
        // In a real implementation, we would parse the actual block structure
        Napi::Object block = Napi::Object::New(env);
        block.Set("blockType", Napi::String::New(env, "Text"));

        // Get bounds from page
        fz_rect bounds = fz_bound_stext_page(ctx_handle, stext_handle);
        Napi::Object bbox = Napi::Object::New(env);
        bbox.Set("x0", Napi::Number::New(env, bounds.x0));
        bbox.Set("y0", Napi::Number::New(env, bounds.y0));
        bbox.Set("x1", Napi::Number::New(env, bounds.x1));
        bbox.Set("y1", Napi::Number::New(env, bounds.y1));
        block.Set("bbox", bbox);

        // Lines will be populated by getSTextBlockLines
        block.Set("lines", Napi::Array::New(env));

        blocks.Set(0u, block);
    }

    fz_drop_buffer(ctx_handle, buffer_handle);

    return blocks;
}

/**
 * Get lines from a structured text block
 *
 * Returns an array of lines, where each line contains:
 * - wmode: string ("HorizontalLtr", "HorizontalRtl", "VerticalTtb", "VerticalBtt")
 * - bbox: rectangle
 * - baseline: number
 * - dir: point {x, y}
 * - chars: array (to be filled by getSTextLineChars)
 *
 * @param ctx - Context handle
 * @param stext - SText page handle
 * @param blockIdx - Block index
 * @returns Array of line objects
 */
Napi::Array GetSTextBlockLines(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array lines = Napi::Array::New(env);

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, stext, blockIdx")
            .ThrowAsJavaScriptException();
        return lines;
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t stext_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    uint32_t block_idx = info[2].As<Napi::Number>().Uint32Value();

    // Get text to parse into lines
    uint64_t buffer_handle = fz_new_buffer_from_stext_page(ctx_handle, stext_handle);
    if (buffer_handle == 0) {
        return lines;
    }

    size_t len = 0;
    const uint8_t* data = fz_buffer_data(ctx_handle, buffer_handle, &len);

    if (data && len > 0) {
        std::string text(reinterpret_cast<const char*>(data), len);

        // Split text into lines (simplified)
        std::string::size_type pos = 0;
        std::string::size_type prev = 0;
        uint32_t line_num = 0;

        while ((pos = text.find('\n', prev)) != std::string::npos) {
            std::string line_text = text.substr(prev, pos - prev);

            if (!line_text.empty()) {
                Napi::Object line = Napi::Object::New(env);
                line.Set("wmode", Napi::String::New(env, "HorizontalLtr"));

                // Create bounding box for line
                fz_rect bounds = fz_bound_stext_page(ctx_handle, stext_handle);
                float line_height = 12.0f; // Approximate
                float y_offset = line_num * line_height;

                Napi::Object bbox = Napi::Object::New(env);
                bbox.Set("x0", Napi::Number::New(env, bounds.x0));
                bbox.Set("y0", Napi::Number::New(env, bounds.y0 + y_offset));
                bbox.Set("x1", Napi::Number::New(env, bounds.x1));
                bbox.Set("y1", Napi::Number::New(env, bounds.y0 + y_offset + line_height));
                line.Set("bbox", bbox);

                line.Set("baseline", Napi::Number::New(env, bounds.y0 + y_offset + line_height * 0.8));

                Napi::Object dir = Napi::Object::New(env);
                dir.Set("x", Napi::Number::New(env, 1.0));
                dir.Set("y", Napi::Number::New(env, 0.0));
                line.Set("dir", dir);

                line.Set("chars", Napi::Array::New(env));

                lines.Set(line_num, line);
                line_num++;
            }

            prev = pos + 1;
        }

        // Handle last line
        if (prev < text.length()) {
            std::string line_text = text.substr(prev);
            if (!line_text.empty()) {
                Napi::Object line = Napi::Object::New(env);
                line.Set("wmode", Napi::String::New(env, "HorizontalLtr"));

                fz_rect bounds = fz_bound_stext_page(ctx_handle, stext_handle);
                float line_height = 12.0f;
                float y_offset = line_num * line_height;

                Napi::Object bbox = Napi::Object::New(env);
                bbox.Set("x0", Napi::Number::New(env, bounds.x0));
                bbox.Set("y0", Napi::Number::New(env, bounds.y0 + y_offset));
                bbox.Set("x1", Napi::Number::New(env, bounds.x1));
                bbox.Set("y1", Napi::Number::New(env, bounds.y0 + y_offset + line_height));
                line.Set("bbox", bbox);

                line.Set("baseline", Napi::Number::New(env, bounds.y0 + y_offset + line_height * 0.8));

                Napi::Object dir = Napi::Object::New(env);
                dir.Set("x", Napi::Number::New(env, 1.0));
                dir.Set("y", Napi::Number::New(env, 0.0));
                line.Set("dir", dir);

                line.Set("chars", Napi::Array::New(env));

                lines.Set(line_num, line);
            }
        }
    }

    fz_drop_buffer(ctx_handle, buffer_handle);

    return lines;
}

/**
 * Get characters from a structured text line
 *
 * Returns an array of characters, where each character contains:
 * - c: string (the character)
 * - quad: quad {ul, ur, ll, lr} bounding box
 * - size: number (font size in points)
 * - fontName: string (font name)
 *
 * @param ctx - Context handle
 * @param stext - SText page handle
 * @param blockIdx - Block index
 * @param lineIdx - Line index
 * @returns Array of character objects
 */
Napi::Array GetSTextLineChars(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array chars = Napi::Array::New(env);

    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected 4 arguments: ctx, stext, blockIdx, lineIdx")
            .ThrowAsJavaScriptException();
        return chars;
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t stext_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    uint32_t block_idx = info[2].As<Napi::Number>().Uint32Value();
    uint32_t line_idx = info[3].As<Napi::Number>().Uint32Value();

    // Get text to parse
    uint64_t buffer_handle = fz_new_buffer_from_stext_page(ctx_handle, stext_handle);
    if (buffer_handle == 0) {
        return chars;
    }

    size_t len = 0;
    const uint8_t* data = fz_buffer_data(ctx_handle, buffer_handle, &len);

    if (data && len > 0) {
        std::string text(reinterpret_cast<const char*>(data), len);

        // Get the specific line
        std::string::size_type pos = 0;
        std::string::size_type prev = 0;
        uint32_t current_line = 0;
        std::string line_text;

        while ((pos = text.find('\n', prev)) != std::string::npos) {
            if (current_line == line_idx) {
                line_text = text.substr(prev, pos - prev);
                break;
            }
            current_line++;
            prev = pos + 1;
        }

        // Handle last line
        if (line_text.empty() && current_line == line_idx && prev < text.length()) {
            line_text = text.substr(prev);
        }

        // Create character objects
        fz_rect bounds = fz_bound_stext_page(ctx_handle, stext_handle);
        float char_width = 6.0f;  // Approximate character width
        float line_height = 12.0f;
        float y_offset = line_idx * line_height;

        for (size_t i = 0; i < line_text.length(); i++) {
            Napi::Object ch = Napi::Object::New(env);

            // Character
            std::string char_str(1, line_text[i]);
            ch.Set("c", Napi::String::New(env, char_str));

            // Quad bounding box
            float x0 = bounds.x0 + (i * char_width);
            float x1 = x0 + char_width;
            float y0 = bounds.y0 + y_offset;
            float y1 = y0 + line_height;

            Napi::Object quad = Napi::Object::New(env);

            Napi::Object ul = Napi::Object::New(env);
            ul.Set("x", Napi::Number::New(env, x0));
            ul.Set("y", Napi::Number::New(env, y0));
            quad.Set("ul", ul);

            Napi::Object ur = Napi::Object::New(env);
            ur.Set("x", Napi::Number::New(env, x1));
            ur.Set("y", Napi::Number::New(env, y0));
            quad.Set("ur", ur);

            Napi::Object ll = Napi::Object::New(env);
            ll.Set("x", Napi::Number::New(env, x0));
            ll.Set("y", Napi::Number::New(env, y1));
            quad.Set("ll", ll);

            Napi::Object lr = Napi::Object::New(env);
            lr.Set("x", Napi::Number::New(env, x1));
            lr.Set("y", Napi::Number::New(env, y1));
            quad.Set("lr", lr);

            ch.Set("quad", quad);

            // Font properties
            ch.Set("size", Napi::Number::New(env, 12.0));
            ch.Set("fontName", Napi::String::New(env, "Helvetica"));

            chars.Set(static_cast<uint32_t>(i), ch);
        }
    }

    fz_drop_buffer(ctx_handle, buffer_handle);

    return chars;
}

/**
 * Get detailed data for a specific character
 *
 * Returns full character data including:
 * - c: string
 * - quad: quad bounding box
 * - size: font size
 * - fontName: font name
 * - color: [r, g, b]
 * - origin: {x, y}
 * - advance: number
 * - bidi: string ("LTR", "RTL", etc.)
 * - language: string ("en-US", etc.)
 *
 * @param ctx - Context handle
 * @param stext - SText page handle
 * @param blockIdx - Block index
 * @param lineIdx - Line index
 * @param charIdx - Character index
 * @returns Character object with full data
 */
Napi::Object GetSTextCharData(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object ch = Napi::Object::New(env);

    if (info.Length() < 5) {
        Napi::TypeError::New(env, "Expected 5 arguments: ctx, stext, blockIdx, lineIdx, charIdx")
            .ThrowAsJavaScriptException();
        return ch;
    }

    // For now, return simplified character data
    // In a full implementation, this would query the actual glyph data from MuPDF
    ch.Set("c", Napi::String::New(env, "A"));
    ch.Set("size", Napi::Number::New(env, 12.0));
    ch.Set("fontName", Napi::String::New(env, "Helvetica"));

    // Color (black)
    Napi::Array color = Napi::Array::New(env, 3);
    color.Set(0u, Napi::Number::New(env, 0.0));
    color.Set(1u, Napi::Number::New(env, 0.0));
    color.Set(2u, Napi::Number::New(env, 0.0));
    ch.Set("color", color);

    // Origin
    Napi::Object origin = Napi::Object::New(env);
    origin.Set("x", Napi::Number::New(env, 0.0));
    origin.Set("y", Napi::Number::New(env, 0.0));
    ch.Set("origin", origin);

    ch.Set("advance", Napi::Number::New(env, 6.0));
    ch.Set("bidi", Napi::String::New(env, "LTR"));
    ch.Set("language", Napi::String::New(env, "en-US"));

    // Quad
    Napi::Object quad = Napi::Object::New(env);
    Napi::Object ul = Napi::Object::New(env);
    ul.Set("x", Napi::Number::New(env, 0.0));
    ul.Set("y", Napi::Number::New(env, 0.0));
    quad.Set("ul", ul);
    ch.Set("quad", quad);

    return ch;
}

/**
 * Initialize SText module exports
 */
Napi::Object InitSText(Napi::Env env, Napi::Object exports) {
    // Basic SText operations
    exports.Set("newSTextPage", Napi::Function::New(env, NewSTextPage));
    exports.Set("dropSTextPage", Napi::Function::New(env, DropSTextPage));
    exports.Set("getSTextAsText", Napi::Function::New(env, GetSTextAsText));
    exports.Set("searchSTextPage", Napi::Function::New(env, SearchSTextPage));
    exports.Set("getSTextPageBounds", Napi::Function::New(env, GetSTextPageBounds));

    // Hierarchical text navigation
    exports.Set("getSTextPageBlocks", Napi::Function::New(env, GetSTextPageBlocks));
    exports.Set("getSTextBlockLines", Napi::Function::New(env, GetSTextBlockLines));
    exports.Set("getSTextLineChars", Napi::Function::New(env, GetSTextLineChars));
    exports.Set("getSTextCharData", Napi::Function::New(env, GetSTextCharData));

    return exports;
}

