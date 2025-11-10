# api/__init__.py
# This file marks the api directory as a Python package

from api.routes import register_api_routes

__all__ = ['register_api_routes']