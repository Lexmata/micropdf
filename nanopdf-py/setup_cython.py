"""
Cython build script for NanoPDF geometry optimizations.

Usage:
    python setup_cython.py build_ext --inplace

Or with pip:
    pip install -e ".[cython]"

This compiles _geometry_fast.pyx into a native extension module for
significant performance improvements on geometry operations.
"""

import os
import sys

def build_cython_extensions():
    """Build Cython extensions if Cython is available."""
    try:
        from Cython.Build import cythonize
        from setuptools import Extension, setup
    except ImportError:
        print("Cython not found. Install with: pip install cython")
        print("Falling back to pure Python geometry module.")
        return False

    # Define extension
    extensions = [
        Extension(
            "nanopdf._geometry_fast",
            sources=["src/nanopdf/_geometry_fast.pyx"],
            extra_compile_args=["-O3", "-ffast-math"] if sys.platform != "win32" else ["/O2"],
        )
    ]

    # Build
    setup(
        name="nanopdf-cython",
        ext_modules=cythonize(
            extensions,
            compiler_directives={
                "language_level": "3",
                "boundscheck": False,
                "wraparound": False,
                "cdivision": True,
                "initializedcheck": False,
            },
        ),
        script_args=["build_ext", "--inplace"],
    )

    return True


if __name__ == "__main__":
    # If run directly, build the extensions
    if len(sys.argv) > 1:
        # Use setuptools normally
        try:
            from Cython.Build import cythonize
            from setuptools import Extension, setup

            extensions = [
                Extension(
                    "nanopdf._geometry_fast",
                    sources=["src/nanopdf/_geometry_fast.pyx"],
                    extra_compile_args=["-O3", "-ffast-math"] if sys.platform != "win32" else ["/O2"],
                )
            ]

            setup(
                name="nanopdf-cython",
                ext_modules=cythonize(
                    extensions,
                    compiler_directives={
                        "language_level": "3",
                        "boundscheck": False,
                        "wraparound": False,
                        "cdivision": True,
                        "initializedcheck": False,
                    },
                ),
            )
        except ImportError:
            print("Error: Cython is required to build extensions.")
            print("Install with: pip install cython")
            sys.exit(1)
    else:
        # Just try to build
        if build_cython_extensions():
            print("Cython extensions built successfully!")
        else:
            print("Could not build Cython extensions.")

