Quick Start Guide
=================

This guide will get you started with NanoPDF in minutes.

Your First Program
------------------

Create a file ``hello_pdf.py``:

.. code-block:: python

   from nanopdf import EasyPDF

   # Extract text from a PDF
   text = EasyPDF.extract_text('sample.pdf')
   print(text)

Run it:

.. code-block:: bash

   python hello_pdf.py

That's it! You've extracted text from a PDF.

Common Tasks
------------

Extract Text
~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import EasyPDF

   # All pages
   text = EasyPDF.extract_text('document.pdf')

   # Specific page
   text = EasyPDF.extract_text('document.pdf', page=0)

Render to PNG
~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import EasyPDF

   # Render first page at 300 DPI
   EasyPDF.render_to_png('document.pdf', 'output.png', page=0, dpi=300)

Get Document Info
~~~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import EasyPDF

   info = EasyPDF.get_info('document.pdf')
   print(f"Title: {info.title}")
   print(f"Pages: {info.page_count}")
   print(f"Author: {info.author}")

Search Text
~~~~~~~~~~~

.. code-block:: python

   from nanopdf import EasyPDF

   with EasyPDF.open('document.pdf') as pdf:
       results = pdf.search_all('Python')
       for result in results:
           print(f"Found on page {result['page_num']}")

Password-Protected PDFs
~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import EasyPDF

   with EasyPDF.open_with_password('secure.pdf', 'password') as pdf:
       text = pdf.extract_all_text()

Next Steps
----------

* Read the :doc:`easy_api` guide for more features
* Learn about :doc:`low_level_api` for advanced control
* Check out :doc:`examples` for real-world use cases

