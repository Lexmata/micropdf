/**
 * NanoPDF Buffer Bindings
 * 
 * Node.js bindings for NanoPDF buffer operations.
 */

#include <napi.h>
#include "include/nanopdf.h"

/**
 * Buffer class wrapper
 */
class Buffer : public Napi::ObjectWrap<Buffer> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    Buffer(const Napi::CallbackInfo& info);
    ~Buffer();

private:
    static Napi::FunctionReference constructor;
    nanopdf_buffer_t* buffer_;

    // Methods
    Napi::Value GetLength(const Napi::CallbackInfo& info);
    Napi::Value GetData(const Napi::CallbackInfo& info);
    Napi::Value Append(const Napi::CallbackInfo& info);
    Napi::Value ToNodeBuffer(const Napi::CallbackInfo& info);

    // Static methods
    static Napi::Value FromNodeBuffer(const Napi::CallbackInfo& info);
    static Napi::Value FromString(const Napi::CallbackInfo& info);
};

Napi::FunctionReference Buffer::constructor;

Napi::Object Buffer::Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "Buffer", {
        InstanceMethod("length", &Buffer::GetLength),
        InstanceMethod("getData", &Buffer::GetData),
        InstanceMethod("append", &Buffer::Append),
        InstanceMethod("toBuffer", &Buffer::ToNodeBuffer),
        StaticMethod("fromBuffer", &Buffer::FromNodeBuffer),
        StaticMethod("fromString", &Buffer::FromString),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Buffer", func);
    return exports;
}

Buffer::Buffer(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Buffer>(info) {
    Napi::Env env = info.Env();

    if (info.Length() > 0 && info[0].IsNumber()) {
        size_t capacity = info[0].As<Napi::Number>().Uint32Value();
        buffer_ = nanopdf_buffer_new(capacity);
    } else {
        buffer_ = nanopdf_buffer_new(0);
    }

    if (buffer_ == nullptr) {
        Napi::Error::New(env, "Failed to create buffer").ThrowAsJavaScriptException();
    }
}

Buffer::~Buffer() {
    if (buffer_ != nullptr) {
        nanopdf_buffer_free(buffer_);
        buffer_ = nullptr;
    }
}

Napi::Value Buffer::GetLength(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (buffer_ == nullptr) {
        return Napi::Number::New(env, 0);
    }
    return Napi::Number::New(env, static_cast<double>(nanopdf_buffer_len(buffer_)));
}

Napi::Value Buffer::GetData(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (buffer_ == nullptr) {
        return env.Null();
    }
    
    size_t len = nanopdf_buffer_len(buffer_);
    const uint8_t* data = nanopdf_buffer_data(buffer_);
    
    if (data == nullptr || len == 0) {
        return Napi::Buffer<uint8_t>::New(env, 0);
    }
    
    // Copy data to a new Node.js Buffer
    return Napi::Buffer<uint8_t>::Copy(env, data, len);
}

Napi::Value Buffer::Append(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected Buffer or Uint8Array").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    if (buffer_ == nullptr) {
        Napi::Error::New(env, "Buffer is null").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    if (info[0].IsBuffer()) {
        Napi::Buffer<uint8_t> buf = info[0].As<Napi::Buffer<uint8_t>>();
        nanopdf_error_t err = nanopdf_buffer_append(buffer_, buf.Data(), buf.Length());
        if (err != NANOPDF_OK) {
            Napi::Error::New(env, "Failed to append data").ThrowAsJavaScriptException();
        }
    } else if (info[0].IsTypedArray()) {
        Napi::TypedArray arr = info[0].As<Napi::TypedArray>();
        if (arr.TypedArrayType() == napi_uint8_array) {
            Napi::Uint8Array u8arr = arr.As<Napi::Uint8Array>();
            nanopdf_error_t err = nanopdf_buffer_append(buffer_, u8arr.Data(), u8arr.ElementLength());
            if (err != NANOPDF_OK) {
                Napi::Error::New(env, "Failed to append data").ThrowAsJavaScriptException();
            }
        }
    } else {
        Napi::TypeError::New(env, "Expected Buffer or Uint8Array").ThrowAsJavaScriptException();
    }

    return info.This();
}

Napi::Value Buffer::ToNodeBuffer(const Napi::CallbackInfo& info) {
    return GetData(info);
}

Napi::Value Buffer::FromNodeBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsBuffer()) {
        Napi::TypeError::New(env, "Expected Buffer").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    Napi::Buffer<uint8_t> nodeBuf = info[0].As<Napi::Buffer<uint8_t>>();
    nanopdf_buffer_t* buf = nanopdf_buffer_from_data(nodeBuf.Data(), nodeBuf.Length());
    
    if (buf == nullptr) {
        Napi::Error::New(env, "Failed to create buffer from data").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    // Create a new Buffer instance
    Napi::Object obj = constructor.New({});
    Buffer* wrapper = Napi::ObjectWrap<Buffer>::Unwrap(obj);
    
    // Free the old buffer and set the new one
    if (wrapper->buffer_ != nullptr) {
        nanopdf_buffer_free(wrapper->buffer_);
    }
    wrapper->buffer_ = buf;
    
    return obj;
}

Napi::Value Buffer::FromString(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected string").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    std::string str = info[0].As<Napi::String>().Utf8Value();
    nanopdf_buffer_t* buf = nanopdf_buffer_from_data(
        reinterpret_cast<const uint8_t*>(str.data()), 
        str.length()
    );
    
    if (buf == nullptr) {
        Napi::Error::New(env, "Failed to create buffer from string").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    Napi::Object obj = constructor.New({});
    Buffer* wrapper = Napi::ObjectWrap<Buffer>::Unwrap(obj);
    
    if (wrapper->buffer_ != nullptr) {
        nanopdf_buffer_free(wrapper->buffer_);
    }
    wrapper->buffer_ = buf;
    
    return obj;
}

// Export initialization function
Napi::Object InitBuffer(Napi::Env env, Napi::Object exports) {
    return Buffer::Init(env, exports);
}

