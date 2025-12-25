Document and Page
=================

Document and Page classes for PDF operations.

Document Class
--------------

.. autoclass:: nanopdf.Document
   :members:
   :special-members: __init__, __enter__, __exit__
   :show-inheritance:

Page Class
----------

.. autoclass:: nanopdf.Page
   :members:
   :special-members: __init__, __enter__, __exit__
   :show-inheritance:

Examples
--------

Opening Documents
~~~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import Context, Document

   with Context() as ctx:
       # From file
       doc = Document.open(ctx, 'file.pdf')

       # From bytes
       with open('file.pdf', 'rb') as f:
           data = f.read()
       doc = Document.from_bytes(ctx, data)

Document Operations
~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import Context, Document

   with Context() as ctx:
       with Document.open(ctx, 'file.pdf') as doc:
           # Get page count
           pages = doc.page_count()

           # Check encryption
           if doc.needs_password():
               success = doc.authenticate('password')

           # Get metadata
           title = doc.get_metadata('Title')
           author = doc.get_metadata('Author')

           # Save
           doc.save('output.pdf')

Page Operations
~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import Context, Document

   with Context() as ctx:
       with Document.open(ctx, 'file.pdf') as doc:
           with doc.load_page(0) as page:
               # Get bounds
               bounds = page.bounds()
               print(f"Size: {bounds.width()} x {bounds.height()}")

               # Extract text
               text = page.extract_text()

               # Search
               results = page.search_text('keyword', max_hits=100)
               for quad in results:
                   rect = quad.to_rect()
                   print(f"Found at: {rect}")

