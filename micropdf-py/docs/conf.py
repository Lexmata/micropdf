"""Sphinx configuration for MicroPDF Python documentation."""

import os
import sys

# Add the source directory to the path
sys.path.insert(0, os.path.abspath('../src'))

# Project information
project = 'MicroPDF Python'
copyright = '2024, Lexmata'
author = 'Lexmata'
version = '0.1.3'
release = '0.1.0'

# General configuration
extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.autosummary',
    'sphinx.ext.napoleon',
    'sphinx.ext.viewcode',
    'sphinx.ext.intersphinx',
    'sphinx.ext.todo',
    'sphinx.ext.coverage',
]

# Napoleon settings
napoleon_google_docstring = True
napoleon_numpy_docstring = True
napoleon_include_init_with_doc = True
napoleon_include_private_with_doc = False
napoleon_include_special_with_doc = True
napoleon_use_admonition_for_examples = True
napoleon_use_admonition_for_notes = True
napoleon_use_admonition_for_references = True
napoleon_use_ivar = False
napoleon_use_param = True
napoleon_use_rtype = True

# Autodoc settings
autodoc_default_options = {
    'members': True,
    'member-order': 'bysource',
    'special-members': '__init__',
    'undoc-members': True,
    'exclude-members': '__weakref__'
}

# Autosummary settings
autosummary_generate = True

# Templates path
templates_path = ['_templates']

# Source file suffix
source_suffix = '.rst'

# Master document
master_doc = 'index'

# Language
language = 'en'

# Exclude patterns
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

# Pygments style
pygments_style = 'monokai'

# HTML output options
html_theme = 'sphinx_rtd_theme'
html_theme_options = {
    'logo_only': False,
    'display_version': True,
    'prev_next_buttons_location': 'bottom',
    'style_external_links': True,
    'style_nav_header_background': '#8b5cf6',
    'collapse_navigation': False,
    'sticky_navigation': True,
    'navigation_depth': 4,
    'includehidden': True,
    'titles_only': False
}

html_static_path = ['_static']
html_css_files = ['custom.css']

# HTML context
html_context = {
    'display_github': True,
    'github_user': 'lexmata',
    'github_repo': 'micropdf',
    'github_version': 'main',
    'conf_py_path': '/micropdf-py/docs/',
}

# HTML options
html_title = f"{project} {version}"
html_short_title = project
html_show_sourcelink = True
html_show_sphinx = False
html_show_copyright = True

# Output directory (relative to docs/)
# Will output to ../../docs/api/python/
html_output_dir = '../../docs/api/python'

# Intersphinx mapping
intersphinx_mapping = {
    'python': ('https://docs.python.org/3', None),
}

# Todo extension
todo_include_todos = True

# Coverage options
coverage_show_missing_items = True
