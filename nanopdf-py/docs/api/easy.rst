Easy API
========

The Easy API provides a simplified, Pythonic interface for common PDF operations.

.. automodule:: nanopdf.easy
   :members:
   :undoc-members:
   :show-inheritance:

EasyPDF Class
-------------

.. autoclass:: nanopdf.EasyPDF
   :members:
   :special-members: __init__, __enter__, __exit__
   :show-inheritance:

   .. rubric:: Static Methods

   .. automethod:: open
   .. automethod:: open_with_password
   .. automethod:: from_bytes
   .. automethod:: extract_text
   .. automethod:: render_to_png
   .. automethod:: get_page_count
   .. automethod:: get_info

   .. rubric:: Instance Methods

   .. automethod:: page_count
   .. automethod:: is_encrypted
   .. automethod:: get_metadata
   .. automethod:: get_info
   .. automethod:: extract_all_text
   .. automethod:: extract_page_text
   .. automethod:: search_all
   .. automethod:: render_page
   .. automethod:: render_all_pages
   .. automethod:: get_page_bounds
   .. automethod:: close

DocumentInfo Class
------------------

.. autoclass:: nanopdf.DocumentInfo
   :members:
   :undoc-members:

Examples
--------

One-Liner Operations
~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import EasyPDF

   # Extract all text
   text = EasyPDF.extract_text('document.pdf')

   # Extract specific page
   text = EasyPDF.extract_text('document.pdf', page=0)

   # Render to PNG
   EasyPDF.render_to_png('in.pdf', 'out.png', page=0, dpi=300)

   # Get page count
   count = EasyPDF.get_page_count('document.pdf')

   # Get document info
   info = EasyPDF.get_info('document.pdf')
   print(f"Title: {info.title}, Pages: {info.page_count}")

Context Manager Usage
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import EasyPDF

   with EasyPDF.open('document.pdf') as pdf:
       # Document info
       print(f"Pages: {pdf.page_count()}")
       print(f"Encrypted: {pdf.is_encrypted()}")

       # Metadata
       metadata = pdf.get_metadata()
       for key, value in metadata.items():
           print(f"{key}: {value}")

       # Text extraction
       all_text = pdf.extract_all_text()
       page_text = pdf.extract_page_text(0)

       # Search
       results = pdf.search_all('Python')
       for result in results:
           print(f"Page {result['page_num']}: {result['bbox']}")

       # Rendering
       pdf.render_page(0, 'page0.png', dpi=300)
       paths = pdf.render_all_pages('output', dpi=150)

Password-Protected PDFs
~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import EasyPDF

   with EasyPDF.open_with_password('secure.pdf', 'password123') as pdf:
       text = pdf.extract_all_text()
       print(text)

Batch Processing
~~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import EasyPDF
   import os

   # Process all PDFs in directory
   for filename in os.listdir('pdfs'):
       if filename.endswith('.pdf'):
           path = os.path.join('pdfs', filename)

           with EasyPDF.open(path) as pdf:
               # Extract text
               text = pdf.extract_all_text()

               # Save to text file
               output = filename.replace('.pdf', '.txt')
               with open(output, 'w') as f:
                   f.write(text)

