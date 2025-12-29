/**
 * Enhanced API FFI Bindings
 *
 * Implements N-API bindings for MicroPDF-specific enhanced functions.
 */

#include <napi.h>
#include "include/micropdf/enhanced.h"
#include <vector>
#include <cstring>

/**
 * Helper: Extract context handle from object
 */
static int32_t GetContext(const Napi::Object& obj) {
    return obj.Get("_handle").As<Napi::Number>().Int32Value();
}

/**
 * Merge multiple PDFs into one output PDF
 * JavaScript: npMergePDFs(ctx: NativeContext, paths: string[], count: number, outputPath: string): number
 */
Napi::Value MergePDFs(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 4 || 
        !info[0].IsObject() || 
        !info[1].IsArray() || 
        !info[2].IsNumber() || 
        !info[3].IsString()) {
        Napi::TypeError::New(env, "Expected (context, paths: string[], count: number, outputPath: string)")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, -1);
    }

    int32_t ctx = GetContext(info[0].As<Napi::Object>());
    Napi::Array pathsArray = info[1].As<Napi::Array>();
    int32_t count = info[2].As<Napi::Number>().Int32Value();
    std::string outputPath = info[3].As<Napi::String>().Utf8Value();

    // Convert JavaScript string array to C string array
    std::vector<const char*> paths(count);
    std::vector<std::string> pathStrings(count);

    for (int32_t i = 0; i < count; i++) {
        Napi::Value val = pathsArray[i];
        if (!val.IsString()) {
            Napi::TypeError::New(env, "All paths must be strings")
                .ThrowAsJavaScriptException();
            return Napi::Number::New(env, -1);
        }
        pathStrings[i] = val.As<Napi::String>().Utf8Value();
        paths[i] = pathStrings[i].c_str();
    }

    // Call the Rust FFI function
    int32_t result = np_merge_pdfs(ctx, paths.data(), count, outputPath.c_str());

    return Napi::Number::New(env, result);
}

/**
 * Initialize enhanced API exports
 */
Napi::Object InitEnhanced(Napi::Env env, Napi::Object exports) {
    exports.Set("npMergePDFs", Napi::Function::New(env, MergePDFs));
    
    return exports;
}

