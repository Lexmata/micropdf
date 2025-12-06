{
  "targets": [
    {
      "target_name": "nanopdf",
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "sources": [
        "native/nanopdf.cc",
        "native/context.cc",
        "native/document.cc",
        "native/page.cc"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "native/include"
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "conditions": [
        ["OS=='linux'", {
          "libraries": [
            "<(module_root_dir)/native/lib/linux-<(target_arch)/libnanopdf.a",
            "-lpthread",
            "-ldl",
            "-lm"
          ],
          "cflags": ["-fPIC"]
        }],
        ["OS=='mac'", {
          "libraries": [
            "<(module_root_dir)/native/lib/darwin-<(target_arch)/libnanopdf.a",
            "-framework CoreFoundation",
            "-framework Security"
          ],
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.15"
          }
        }],
        ["OS=='win'", {
          "libraries": [
            "<(module_root_dir)/native/lib/win32-<(target_arch)/nanopdf.lib",
            "ws2_32.lib",
            "userenv.lib",
            "bcrypt.lib",
            "ntdll.lib"
          ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1
            }
          }
        }]
      ]
    }
  ]
}

