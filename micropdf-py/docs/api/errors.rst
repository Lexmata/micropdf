Errors
======

Error handling for MicroPDF operations.

.. automodule:: micropdf.errors
   :members:
   :undoc-members:
   :show-inheritance:

ErrorCode Enum
--------------

.. autoclass:: micropdf.ErrorCode
   :members:
   :undoc-members:

MicroPDFError Exception
----------------------

.. autoclass:: micropdf.MicroPDFError
   :members:
   :show-inheritance:

Error Creation Functions
------------------------

.. autofunction:: micropdf.errors.generic_error
.. autofunction:: micropdf.errors.system_error
.. autofunction:: micropdf.errors.format_error
.. autofunction:: micropdf.errors.eof_error
.. autofunction:: micropdf.errors.argument_error
.. autofunction:: micropdf.errors.limit_error
.. autofunction:: micropdf.errors.unsupported_error

Examples
--------

.. code-block:: python

   from micropdf import Context, Document, MicroPDFError, ErrorCode

   try:
       with Context() as ctx:
           doc = Document.open(ctx, 'nonexistent.pdf')
   except MicroPDFError as e:
       print(f"Error code: {e.code}")
       print(f"Message: {e.message}")
       if e.code == ErrorCode.SYSTEM:
           print("File not found or I/O error")

