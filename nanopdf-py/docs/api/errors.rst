Errors
======

Error handling for NanoPDF operations.

.. automodule:: nanopdf.errors
   :members:
   :undoc-members:
   :show-inheritance:

ErrorCode Enum
--------------

.. autoclass:: nanopdf.ErrorCode
   :members:
   :undoc-members:

NanoPDFError Exception
----------------------

.. autoclass:: nanopdf.NanoPDFError
   :members:
   :show-inheritance:

Error Creation Functions
------------------------

.. autofunction:: nanopdf.errors.generic_error
.. autofunction:: nanopdf.errors.system_error
.. autofunction:: nanopdf.errors.format_error
.. autofunction:: nanopdf.errors.eof_error
.. autofunction:: nanopdf.errors.argument_error
.. autofunction:: nanopdf.errors.limit_error
.. autofunction:: nanopdf.errors.unsupported_error

Examples
--------

.. code-block:: python

   from nanopdf import Context, Document, NanoPDFError, ErrorCode

   try:
       with Context() as ctx:
           doc = Document.open(ctx, 'nonexistent.pdf')
   except NanoPDFError as e:
       print(f"Error code: {e.code}")
       print(f"Message: {e.message}")
       if e.code == ErrorCode.SYSTEM:
           print("File not found or I/O error")

