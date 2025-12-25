Geometry
========

Geometry primitives for PDF operations.

.. automodule:: nanopdf.geometry
   :members:
   :undoc-members:
   :show-inheritance:

Point Class
-----------

.. autoclass:: nanopdf.Point
   :members:
   :special-members: __init__

Rect Class
----------

.. autoclass:: nanopdf.Rect
   :members:
   :special-members: __init__

IRect Class
-----------

.. autoclass:: nanopdf.IRect
   :members:
   :special-members: __init__

Matrix Class
------------

.. autoclass:: nanopdf.Matrix
   :members:
   :special-members: __init__, __matmul__

Quad Class
----------

.. autoclass:: nanopdf.Quad
   :members:
   :special-members: __init__

Examples
--------

Working with Points
~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf.geometry import Point, Matrix

   p1 = Point(10, 20)
   p2 = Point(30, 40)

   # Distance
   distance = p1.distance(p2)

   # Transform
   matrix = Matrix.translate(5, 10)
   p3 = p1.transform(matrix)

Working with Rectangles
~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf.geometry import Rect, Point

   r = Rect(0, 0, 100, 200)

   # Dimensions
   width = r.width()
   height = r.height()
   area = r.area()

   # Containment
   p = Point(50, 100)
   contains = r.contains(p)

   # Operations
   r2 = Rect(50, 50, 150, 150)
   intersection = r.intersect(r2)
   union = r.union(r2)

Matrix Transformations
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf.geometry import Matrix

   # Create matrices
   identity = Matrix.identity()
   scale = Matrix.scale(2.0, 2.0)
   translate = Matrix.translate(10, 20)
   rotate = Matrix.rotate(90)  # degrees

   # Concatenate
   combined = scale.concat(translate)

   # Or use @ operator
   combined = scale @ translate @ rotate

Quadrilaterals
~~~~~~~~~~~~~~

.. code-block:: python

   from nanopdf.geometry import Rect, Quad

   # From rectangle
   rect = Rect(0, 0, 100, 100)
   quad = Quad.from_rect(rect)

   # Back to rectangle (bounding box)
   bbox = quad.to_rect()

