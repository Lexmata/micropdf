/**
 * NanoPDF Geometry Bindings
 * 
 * Node.js bindings for NanoPDF geometry operations.
 */

#include <napi.h>
#include "include/nanopdf.h"

/**
 * Create a Point object from nanopdf_point_t
 */
Napi::Object PointToObject(Napi::Env env, nanopdf_point_t p) {
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("x", Napi::Number::New(env, p.x));
    obj.Set("y", Napi::Number::New(env, p.y));
    return obj;
}

/**
 * Create nanopdf_point_t from a JS object
 */
nanopdf_point_t ObjectToPoint(Napi::Object obj) {
    nanopdf_point_t p;
    p.x = obj.Get("x").As<Napi::Number>().FloatValue();
    p.y = obj.Get("y").As<Napi::Number>().FloatValue();
    return p;
}

/**
 * Create a Rect object from nanopdf_rect_t
 */
Napi::Object RectToObject(Napi::Env env, nanopdf_rect_t r) {
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("x0", Napi::Number::New(env, r.x0));
    obj.Set("y0", Napi::Number::New(env, r.y0));
    obj.Set("x1", Napi::Number::New(env, r.x1));
    obj.Set("y1", Napi::Number::New(env, r.y1));
    return obj;
}

/**
 * Create nanopdf_rect_t from a JS object
 */
nanopdf_rect_t ObjectToRect(Napi::Object obj) {
    nanopdf_rect_t r;
    r.x0 = obj.Get("x0").As<Napi::Number>().FloatValue();
    r.y0 = obj.Get("y0").As<Napi::Number>().FloatValue();
    r.x1 = obj.Get("x1").As<Napi::Number>().FloatValue();
    r.y1 = obj.Get("y1").As<Napi::Number>().FloatValue();
    return r;
}

/**
 * Create a Matrix object from nanopdf_matrix_t
 */
Napi::Object MatrixToObject(Napi::Env env, nanopdf_matrix_t m) {
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("a", Napi::Number::New(env, m.a));
    obj.Set("b", Napi::Number::New(env, m.b));
    obj.Set("c", Napi::Number::New(env, m.c));
    obj.Set("d", Napi::Number::New(env, m.d));
    obj.Set("e", Napi::Number::New(env, m.e));
    obj.Set("f", Napi::Number::New(env, m.f));
    return obj;
}

/**
 * Create nanopdf_matrix_t from a JS object
 */
nanopdf_matrix_t ObjectToMatrix(Napi::Object obj) {
    nanopdf_matrix_t m;
    m.a = obj.Get("a").As<Napi::Number>().FloatValue();
    m.b = obj.Get("b").As<Napi::Number>().FloatValue();
    m.c = obj.Get("c").As<Napi::Number>().FloatValue();
    m.d = obj.Get("d").As<Napi::Number>().FloatValue();
    m.e = obj.Get("e").As<Napi::Number>().FloatValue();
    m.f = obj.Get("f").As<Napi::Number>().FloatValue();
    return m;
}

// Point functions
Napi::Value CreatePoint(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    float x = 0, y = 0;
    if (info.Length() >= 2) {
        x = info[0].As<Napi::Number>().FloatValue();
        y = info[1].As<Napi::Number>().FloatValue();
    }
    
    nanopdf_point_t p = {x, y};
    return PointToObject(env, p);
}

Napi::Value TransformPoint(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
        Napi::TypeError::New(env, "Expected (point, matrix)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    nanopdf_point_t p = ObjectToPoint(info[0].As<Napi::Object>());
    nanopdf_matrix_t m = ObjectToMatrix(info[1].As<Napi::Object>());
    nanopdf_point_t result = nanopdf_point_transform(p, m);
    
    return PointToObject(env, result);
}

// Rect functions
Napi::Value CreateRect(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    float x0 = 0, y0 = 0, x1 = 0, y1 = 0;
    if (info.Length() >= 4) {
        x0 = info[0].As<Napi::Number>().FloatValue();
        y0 = info[1].As<Napi::Number>().FloatValue();
        x1 = info[2].As<Napi::Number>().FloatValue();
        y1 = info[3].As<Napi::Number>().FloatValue();
    }
    
    nanopdf_rect_t r = {x0, y0, x1, y1};
    return RectToObject(env, r);
}

Napi::Value RectEmpty(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return RectToObject(env, nanopdf_rect_empty());
}

Napi::Value RectUnit(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return RectToObject(env, nanopdf_rect_unit());
}

Napi::Value IsRectEmpty(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected rect object").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    nanopdf_rect_t r = ObjectToRect(info[0].As<Napi::Object>());
    return Napi::Boolean::New(env, nanopdf_rect_is_empty(r) != 0);
}

Napi::Value RectUnion(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
        Napi::TypeError::New(env, "Expected (rect, rect)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    nanopdf_rect_t a = ObjectToRect(info[0].As<Napi::Object>());
    nanopdf_rect_t b = ObjectToRect(info[1].As<Napi::Object>());
    
    return RectToObject(env, nanopdf_rect_union(a, b));
}

Napi::Value RectIntersect(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
        Napi::TypeError::New(env, "Expected (rect, rect)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    nanopdf_rect_t a = ObjectToRect(info[0].As<Napi::Object>());
    nanopdf_rect_t b = ObjectToRect(info[1].As<Napi::Object>());
    
    return RectToObject(env, nanopdf_rect_intersect(a, b));
}

// Matrix functions
Napi::Value MatrixIdentity(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return MatrixToObject(env, nanopdf_matrix_identity());
}

Napi::Value MatrixTranslate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    float tx = 0, ty = 0;
    if (info.Length() >= 2) {
        tx = info[0].As<Napi::Number>().FloatValue();
        ty = info[1].As<Napi::Number>().FloatValue();
    }
    
    return MatrixToObject(env, nanopdf_matrix_translate(tx, ty));
}

Napi::Value MatrixScale(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    float sx = 1, sy = 1;
    if (info.Length() >= 2) {
        sx = info[0].As<Napi::Number>().FloatValue();
        sy = info[1].As<Napi::Number>().FloatValue();
    }
    
    return MatrixToObject(env, nanopdf_matrix_scale(sx, sy));
}

Napi::Value MatrixRotate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    float degrees = 0;
    if (info.Length() >= 1) {
        degrees = info[0].As<Napi::Number>().FloatValue();
    }
    
    return MatrixToObject(env, nanopdf_matrix_rotate(degrees));
}

Napi::Value MatrixConcat(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
        Napi::TypeError::New(env, "Expected (matrix, matrix)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    nanopdf_matrix_t a = ObjectToMatrix(info[0].As<Napi::Object>());
    nanopdf_matrix_t b = ObjectToMatrix(info[1].As<Napi::Object>());
    
    return MatrixToObject(env, nanopdf_matrix_concat(a, b));
}

// Export initialization function
Napi::Object InitGeometry(Napi::Env env, Napi::Object exports) {
    // Point
    exports.Set("createPoint", Napi::Function::New(env, CreatePoint));
    exports.Set("transformPoint", Napi::Function::New(env, TransformPoint));
    
    // Rect
    exports.Set("createRect", Napi::Function::New(env, CreateRect));
    exports.Set("rectEmpty", Napi::Function::New(env, RectEmpty));
    exports.Set("rectUnit", Napi::Function::New(env, RectUnit));
    exports.Set("isRectEmpty", Napi::Function::New(env, IsRectEmpty));
    exports.Set("rectUnion", Napi::Function::New(env, RectUnion));
    exports.Set("rectIntersect", Napi::Function::New(env, RectIntersect));
    
    // Matrix
    exports.Set("matrixIdentity", Napi::Function::New(env, MatrixIdentity));
    exports.Set("matrixTranslate", Napi::Function::New(env, MatrixTranslate));
    exports.Set("matrixScale", Napi::Function::New(env, MatrixScale));
    exports.Set("matrixRotate", Napi::Function::New(env, MatrixRotate));
    exports.Set("matrixConcat", Napi::Function::New(env, MatrixConcat));
    
    return exports;
}

