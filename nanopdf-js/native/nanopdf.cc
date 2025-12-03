/**
 * NanoPDF Node.js Native Addon
 * 
 * Main entry point for the native addon that binds the NanoPDF Rust library
 * to Node.js via N-API.
 */

#include <napi.h>
#include "include/nanopdf.h"

// Forward declarations from other source files
Napi::Object InitBuffer(Napi::Env env, Napi::Object exports);
Napi::Object InitGeometry(Napi::Env env, Napi::Object exports);

/**
 * Get the NanoPDF library version
 */
Napi::String GetVersion(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    const char* version = nanopdf_version();
    if (version == nullptr) {
        return Napi::String::New(env, "0.1.0");
    }
    return Napi::String::New(env, version);
}

/**
 * Initialize the native addon
 */
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Add version function
    exports.Set("getVersion", Napi::Function::New(env, GetVersion));
    
    // Initialize sub-modules
    InitBuffer(env, exports);
    InitGeometry(env, exports);
    
    return exports;
}

NODE_API_MODULE(nanopdf, Init)

