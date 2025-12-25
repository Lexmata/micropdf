Context
=======

The Context class manages memory allocation and error handling for all PDF operations.

.. automodule:: nanopdf.context
   :members:
   :undoc-members:
   :show-inheritance:

Context Class
-------------

.. autoclass:: nanopdf.Context
   :members:
   :special-members: __init__, __enter__, __exit__
   :show-inheritance:

Examples
--------

Basic Usage
~~~~~~~~~~~

.. code-block:: python

   from nanopdf import Context

   # Create with default cache size (256 MB)
   ctx = Context()

   # ... perform operations ...

   ctx.drop()

Context Manager (Recommended)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import Context

   with Context() as ctx:
       # ... perform operations ...
       pass  # Automatic cleanup

Custom Cache Size
~~~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import Context

   # Create with 512 MB cache
   ctx = Context(max_store=512 * 1024 * 1024)

Cloning Context
~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import Context

   with Context() as ctx1:
       # Clone for use in another thread
       ctx2 = ctx1.clone()
       # ctx2 shares the same resources
       ctx2.drop()

