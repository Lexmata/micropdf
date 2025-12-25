Colorspace
==========

Color management for PDF operations.

.. autoclass:: nanopdf.Colorspace
   :members:
   :show-inheritance:

Examples
--------

.. code-block:: python

   from nanopdf import Context, Colorspace

   with Context() as ctx:
       # Device colorspaces
       gray = Colorspace.device_gray(ctx)
       rgb = Colorspace.device_rgb(ctx)
       bgr = Colorspace.device_bgr(ctx)
       cmyk = Colorspace.device_cmyk(ctx)

       # Get info
       print(f"RGB components: {rgb.components()}")  # 3
       print(f"RGB name: {rgb.name()}")  # "DeviceRGB"

       # Check type
       print(f"Is RGB: {rgb.is_rgb()}")  # True
       print(f"Is CMYK: {rgb.is_cmyk()}")  # False

