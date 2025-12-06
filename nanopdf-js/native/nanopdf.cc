/**
 * NanoPDF Node.js Native Addon
 *
 * Main entry point for the native addon that binds the NanoPDF Rust library
 * to Node.js via N-API.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"

// Forward declarations from other source files
Napi::Object InitContext(Napi::Env env, Napi::Object exports);
Napi::Object InitDocument(Napi::Env env, Napi::Object exports);
Napi::Object InitPage(Napi::Env env, Napi::Object exports);

/**
 * Get the NanoPDF library version
 */
Napi::String GetVersion(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Return version from package.json
    return Napi::String::New(env, "0.1.0");
}

/**
 * Initialize the native addon
 */
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Add version function
    exports.Set("getVersion", Napi::Function::New(env, GetVersion));

    // Initialize sub-modules
    InitContext(env, exports);
    InitDocument(env, exports);
    InitPage(env, exports);

    return exports;
}

NODE_API_MODULE(nanopdf, Init)

