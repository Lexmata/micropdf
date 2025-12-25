Buffer
======

Dynamic byte buffer operations.

.. autoclass:: nanopdf.Buffer
   :members:
   :special-members: __init__, __enter__, __exit__, __len__, __bytes__
   :show-inheritance:

Examples
--------

.. code-block:: python

   from nanopdf import Context, Buffer

   with Context() as ctx:
       # Create empty buffer
       buf = Buffer(ctx, capacity=1024)

       # Append data
       buf.append(b"Hello, ")
       buf.append_string("PDF!")

       # Get data
       data = buf.data()
       print(data.decode('utf-8'))  # "Hello, PDF!"

       # Length
       length = buf.length()
       # or use len()
       length = len(buf)

       # Convert to bytes
       bytes_data = bytes(buf)

       buf.drop()

