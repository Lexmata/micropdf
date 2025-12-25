NanoPDF Python Documentation
============================

.. image:: https://img.shields.io/badge/python-3.8+-blue.svg
   :target: https://www.python.org/downloads/
   :alt: Python Version

.. image:: https://img.shields.io/badge/license-Apache%202.0-blue.svg
   :target: https://github.com/lexmata/nanopdf/blob/main/LICENSE
   :alt: License

High-performance PDF manipulation library for Python with native Rust FFI bindings.

Features
--------

🚀 **Fast** - Powered by Rust and MuPDF

🐍 **Pythonic** - Clean, idiomatic Python API

🔧 **Easy to Use** - Simple API for common tasks

🎯 **Type-Safe** - Full type hints with mypy support

📦 **Zero Dependencies** - Only requires cffi

🔒 **Memory Safe** - Automatic resource management

Quick Start
-----------

Installation
~~~~~~~~~~~~

.. code-block:: bash

   # Build the Rust library first
   cd nanopdf-rs
   cargo build --release

   # Install Python package
   cd ../nanopdf-py
   pip install -e .

Basic Usage
~~~~~~~~~~~

Easy API (One-Liners)
^^^^^^^^^^^^^^^^^^^^^

.. code-block:: python

   from nanopdf import EasyPDF

   # Extract text from all pages
   text = EasyPDF.extract_text('document.pdf')
   print(text)

   # Render page to PNG at 300 DPI
   EasyPDF.render_to_png('document.pdf', 'output.png', page=0, dpi=300)

   # Get document info
   info = EasyPDF.get_info('document.pdf')
   print(f"Pages: {info.page_count}")

Fluent API with Context Manager
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: python

   from nanopdf import EasyPDF

   with EasyPDF.open('document.pdf') as pdf:
       # Get info
       print(f"Pages: {pdf.page_count()}")
       print(f"Metadata: {pdf.get_metadata()}")

       # Extract text
       all_text = pdf.extract_all_text()
       page_text = pdf.extract_page_text(0)

       # Search
       results = pdf.search_all('keyword')

       # Render
       pdf.render_page(0, 'page0.png', dpi=300)
       paths = pdf.render_all_pages('output_dir', dpi=150)

Low-Level API (Advanced)
^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: python

   from nanopdf import Context, Document, Pixmap, Colorspace, Matrix

   with Context() as ctx:
       with Document.open(ctx, 'document.pdf') as doc:
           print(f"Pages: {doc.page_count()}")

           with doc.load_page(0) as page:
               # Get bounds
               bounds = page.bounds()
               print(f"Size: {bounds.width()} x {bounds.height()}")

               # Extract text
               text = page.extract_text()

               # Render to pixmap
               matrix = Matrix.scale(2.0, 2.0)
               colorspace = Colorspace.device_rgb(ctx)

               with Pixmap.from_page(ctx, page, matrix, colorspace) as pix:
                   pix.save_png('output.png')

Table of Contents
-----------------

.. toctree::
   :maxdepth: 2
   :caption: User Guide

   guides/installation
   guides/quickstart
   guides/easy_api
   guides/low_level_api
   guides/examples

.. toctree::
   :maxdepth: 2
   :caption: API Reference

   api/easy
   api/context
   api/document
   api/pixmap
   api/geometry
   api/colorspace
   api/buffer
   api/errors

.. toctree::
   :maxdepth: 2
   :caption: Tutorials

   tutorials/text_extraction
   tutorials/rendering
   tutorials/searching
   tutorials/metadata

.. toctree::
   :maxdepth: 1
   :caption: Development

   development/contributing
   development/testing
   development/architecture

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

