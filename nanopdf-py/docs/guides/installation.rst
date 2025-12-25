Installation Guide
==================

Requirements
------------

* Python 3.8 or higher
* cffi >= 1.16.0
* Compiled nanopdf-rs Rust library

Step 1: Build Rust Library
---------------------------

First, build the Rust core library:

.. code-block:: bash

   cd nanopdf-rs
   cargo build --release

This will create the shared library at ``nanopdf-rs/target/release/libnanopdf.so`` (or ``.dylib`` on macOS, ``.dll`` on Windows).

Step 2: Install Python Package
-------------------------------

From Source (Development)
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   cd nanopdf-py
   pip install -e .

This installs in "editable" mode, useful for development.

With Dev Dependencies
~~~~~~~~~~~~~~~~~~~~~

To install with development tools (pytest, mypy, black, ruff):

.. code-block:: bash

   pip install -e ".[dev]"

From PyPI (Future)
~~~~~~~~~~~~~~~~~~

Once published:

.. code-block:: bash

   pip install nanopdf

Verification
------------

Verify the installation:

.. code-block:: python

   import nanopdf
   print(nanopdf.__version__)

If you see the version number, installation was successful!

Troubleshooting
---------------

Library Not Found
~~~~~~~~~~~~~~~~~

If you get ``ImportError: Could not find libnanopdf library``:

1. Make sure you built the Rust library:

   .. code-block:: bash

      cd nanopdf-rs && cargo build --release

2. Check that the library exists:

   .. code-block:: bash

      ls -la nanopdf-rs/target/release/libnanopdf.*

3. The Python bindings search these paths automatically:

   * ``nanopdf-rs/target/release/``
   * ``nanopdf-rs/target/debug/``
   * ``/usr/local/lib``
   * ``/usr/lib``
   * ``~/.local/lib``

CFFI Error
~~~~~~~~~~

If you get cffi-related errors:

.. code-block:: bash

   pip install --upgrade cffi

Python Version
~~~~~~~~~~~~~~

Check your Python version:

.. code-block:: bash

   python --version

NanoPDF requires Python 3.8 or higher.

