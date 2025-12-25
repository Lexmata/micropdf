Pixmap
======

Pixel buffer for rendered content and image operations.

.. autoclass:: nanopdf.Pixmap
   :members:
   :special-members: __init__, __enter__, __exit__
   :show-inheritance:

Examples
--------

Creating Pixmaps
~~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import Context, Colorspace, Pixmap

   with Context() as ctx:
       cs = Colorspace.device_rgb(ctx)
       pix = Pixmap.create(ctx, cs, 100, 100, alpha=False)
       pix.clear()  # Clear to white
       pix.drop()

Rendering Pages
~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import Context, Document, Matrix, Pixmap, Colorspace

   with Context() as ctx:
       with Document.open(ctx, 'file.pdf') as doc:
           with doc.load_page(0) as page:
               # Render at 2x scale (144 DPI)
               matrix = Matrix.scale(2.0, 2.0)
               cs = Colorspace.device_rgb(ctx)

               with Pixmap.from_page(ctx, page, matrix, cs) as pix:
                   # Get dimensions
                   print(f"Size: {pix.width()}x{pix.height()}")

                   # Save as PNG
                   pix.save_png('output.png')

                   # Or get PNG bytes
                   png_data = pix.to_png()

Accessing Raw Pixels
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf import Context, Colorspace, Pixmap

   with Context() as ctx:
       cs = Colorspace.device_rgb(ctx)
       pix = Pixmap.create(ctx, cs, 10, 10, alpha=False)

       # Get raw pixel data
       samples = pix.samples()
       print(f"Total bytes: {len(samples)}")

       # Calculate expected size
       size = pix.width() * pix.height() * pix.components()
       assert len(samples) == size

