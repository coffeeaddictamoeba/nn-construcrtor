from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ImageViewSet
from . import views

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'images', ImageViewSet)

urlpatterns = [
    path('', views.index),
    path('api/', include(router.urls)),
]
