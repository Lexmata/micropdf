/**
 * NanoPDF Form Field Bindings
 *
 * N-API bindings for PDF interactive form (AcroForm) operations.
 * Supports creating, reading, and modifying form fields.
 */

#include <napi.h>
#include "include/mupdf_minimal.h"
#include <string>

/**
 * Get first form field widget on page
 *
 * @param ctx - Context handle
 * @param page - Page handle
 * @returns Widget handle (or 0 if none)
 */
Napi::BigInt GetPageWidget(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, page")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t page_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    // Call Rust FFI
    uint64_t widget_handle = pdf_first_widget(ctx_handle, page_handle);

    return Napi::BigInt::New(env, widget_handle);
}

/**
 * Get next widget in list
 *
 * @param ctx - Context handle
 * @param widget - Current widget handle
 * @returns Next widget handle (or 0 if none)
 */
Napi::BigInt GetNextWidget(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, widget")
            .ThrowAsJavaScriptException();
        return Napi::BigInt::New(env, static_cast<uint64_t>(0));
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    uint64_t next_handle = pdf_next_widget(ctx_handle, widget_handle);

    return Napi::BigInt::New(env, next_handle);
}

/**
 * Drop widget handle
 *
 * @param ctx - Context handle
 * @param widget - Widget handle
 */
Napi::Value DropWidget(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, widget")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    pdf_drop_widget(ctx_handle, widget_handle);

    return env.Undefined();
}

/**
 * Get widget field type
 *
 * @param ctx - Context handle
 * @param widget - Widget handle
 * @returns Field type number (0-6)
 */
Napi::Number GetWidgetType(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, widget")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, -1);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t field_type = pdf_widget_type(ctx_handle, widget_handle);

    return Napi::Number::New(env, field_type);
}

/**
 * Get widget field name
 *
 * @param ctx - Context handle
 * @param widget - Widget handle
 * @returns Field name string
 */
Napi::String GetWidgetName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, widget")
            .ThrowAsJavaScriptException();
        return Napi::String::New(env, "");
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    // Allocate buffer for name
    char buffer[256];
    pdf_widget_name(ctx_handle, widget_handle, buffer, sizeof(buffer));

    return Napi::String::New(env, buffer);
}

/**
 * Get widget field value
 *
 * @param ctx - Context handle
 * @param widget - Widget handle
 * @returns Field value string
 */
Napi::String GetWidgetValue(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, widget")
            .ThrowAsJavaScriptException();
        return Napi::String::New(env, "");
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    char buffer[4096];
    pdf_widget_value(ctx_handle, widget_handle, buffer, sizeof(buffer));

    return Napi::String::New(env, buffer);
}

/**
 * Set widget field value
 *
 * @param ctx - Context handle
 * @param widget - Widget handle
 * @param value - Value string
 * @returns Success boolean
 */
Napi::Boolean SetWidgetValue(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, widget, value")
            .ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    std::string value = info[2].As<Napi::String>().Utf8Value();

    int32_t result = pdf_set_widget_value(ctx_handle, widget_handle, value.c_str());

    return Napi::Boolean::New(env, result != 0);
}

/**
 * Get widget rectangle
 *
 * @param ctx - Context handle
 * @param widget - Widget handle
 * @returns Rectangle {x0, y0, x1, y1}
 */
Napi::Object GetWidgetRect(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Object rect = Napi::Object::New(env);

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, widget")
            .ThrowAsJavaScriptException();
        return rect;
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    fz_rect widget_rect = pdf_widget_rect(ctx_handle, widget_handle);

    rect.Set("x0", Napi::Number::New(env, widget_rect.x0));
    rect.Set("y0", Napi::Number::New(env, widget_rect.y0));
    rect.Set("x1", Napi::Number::New(env, widget_rect.x1));
    rect.Set("y1", Napi::Number::New(env, widget_rect.y1));

    return rect;
}

/**
 * Check if widget is read-only
 *
 * @param ctx - Context handle
 * @param widget - Widget handle
 * @returns Boolean
 */
Napi::Boolean IsWidgetReadOnly(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, widget")
            .ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t is_readonly = pdf_widget_is_readonly(ctx_handle, widget_handle);

    return Napi::Boolean::New(env, is_readonly != 0);
}

/**
 * Check if widget is required
 *
 * @param ctx - Context handle
 * @param widget - Widget handle
 * @returns Boolean
 */
Napi::Boolean IsWidgetRequired(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, widget")
            .ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t is_required = pdf_widget_is_required(ctx_handle, widget_handle);

    return Napi::Boolean::New(env, is_required != 0);
}

/**
 * Get widget max length (for text fields)
 *
 * @param ctx - Context handle
 * @param widget - Widget handle
 * @returns Max length (-1 if unlimited)
 */
Napi::Number GetWidgetMaxLen(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, widget")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, -1);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t max_len = pdf_widget_max_len(ctx_handle, widget_handle);

    return Napi::Number::New(env, max_len);
}

/**
 * Get widget choice options (for combo/list boxes)
 *
 * @param ctx - Context handle
 * @param widget - Widget handle
 * @returns Array of option strings
 */
Napi::Array GetWidgetOptions(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array options = Napi::Array::New(env);

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, widget")
            .ThrowAsJavaScriptException();
        return options;
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    // Get option count
    int32_t count = pdf_widget_option_count(ctx_handle, widget_handle);

    // Get each option
    for (int32_t i = 0; i < count; i++) {
        char buffer[256];
        pdf_widget_option(ctx_handle, widget_handle, i, buffer, sizeof(buffer));
        options.Set(static_cast<uint32_t>(i), Napi::String::New(env, buffer));
    }

    return options;
}

/**
 * Update widget appearance
 *
 * @param ctx - Context handle
 * @param widget - Widget handle
 * @returns Success boolean
 */
Napi::Boolean UpdateWidget(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, widget")
            .ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t result = pdf_update_widget(ctx_handle, widget_handle);

    return Napi::Boolean::New(env, result != 0);
}

/**
 * Check if widget is valid
 *
 * @param ctx - Context handle
 * @param widget - Widget handle
 * @returns Boolean
 */
Napi::Boolean IsWidgetValid(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, widget")
            .ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t is_valid = pdf_widget_is_valid(ctx_handle, widget_handle);

    return Napi::Boolean::New(env, is_valid != 0);
}

/**
 * Get widget text format (for text fields)
 *
 * @param ctx - Context handle
 * @param widget - Widget handle
 * @returns Format number (0=None, 1=Number, 2=Special, 3=Date, 4=Time)
 */
Napi::Number GetWidgetTextFormat(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, widget")
            .ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t format = pdf_widget_text_format(ctx_handle, widget_handle);

    return Napi::Number::New(env, format);
}

/**
 * Check if text field is multiline
 *
 * @param ctx - Context handle
 * @param widget - Widget handle
 * @returns Boolean
 */
Napi::Boolean IsWidgetMultiline(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, widget")
            .ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t is_multiline = pdf_widget_is_multiline(ctx_handle, widget_handle);

    return Napi::Boolean::New(env, is_multiline != 0);
}

/**
 * Check if checkbox/radio is checked
 *
 * @param ctx - Context handle
 * @param widget - Widget handle
 * @returns Boolean
 */
Napi::Boolean IsWidgetChecked(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: ctx, widget")
            .ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);

    int32_t is_checked = pdf_widget_is_checked(ctx_handle, widget_handle);

    return Napi::Boolean::New(env, is_checked != 0);
}

/**
 * Set checkbox/radio checked state
 *
 * @param ctx - Context handle
 * @param widget - Widget handle
 * @param checked - Boolean state
 */
Napi::Value SetWidgetChecked(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: ctx, widget, checked")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    bool lossless;
    uint64_t ctx_handle = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
    uint64_t widget_handle = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
    bool checked = info[2].As<Napi::Boolean>().Value();

    pdf_set_widget_checked(ctx_handle, widget_handle, checked ? 1 : 0);

    return env.Undefined();
}

/**
 * Initialize Form module exports
 */
Napi::Object InitForm(Napi::Env env, Napi::Object exports) {
    // Widget navigation
    exports.Set("getPageWidget", Napi::Function::New(env, GetPageWidget));
    exports.Set("getNextWidget", Napi::Function::New(env, GetNextWidget));
    exports.Set("dropWidget", Napi::Function::New(env, DropWidget));

    // Widget properties
    exports.Set("getWidgetType", Napi::Function::New(env, GetWidgetType));
    exports.Set("getWidgetName", Napi::Function::New(env, GetWidgetName));
    exports.Set("getWidgetRect", Napi::Function::New(env, GetWidgetRect));

    // Widget values
    exports.Set("getWidgetValue", Napi::Function::New(env, GetWidgetValue));
    exports.Set("setWidgetValue", Napi::Function::New(env, SetWidgetValue));

    // Widget state
    exports.Set("isWidgetReadOnly", Napi::Function::New(env, IsWidgetReadOnly));
    exports.Set("isWidgetRequired", Napi::Function::New(env, IsWidgetRequired));
    exports.Set("isWidgetValid", Napi::Function::New(env, IsWidgetValid));

    // Text field specific
    exports.Set("getWidgetTextFormat", Napi::Function::New(env, GetWidgetTextFormat));
    exports.Set("getWidgetMaxLen", Napi::Function::New(env, GetWidgetMaxLen));
    exports.Set("isWidgetMultiline", Napi::Function::New(env, IsWidgetMultiline));

    // Checkbox/radio specific
    exports.Set("isWidgetChecked", Napi::Function::New(env, IsWidgetChecked));
    exports.Set("setWidgetChecked", Napi::Function::New(env, SetWidgetChecked));

    // Choice field specific
    exports.Set("getWidgetOptions", Napi::Function::New(env, GetWidgetOptions));

    // Widget updates
    exports.Set("updateWidget", Napi::Function::New(env, UpdateWidget));

    return exports;
}

