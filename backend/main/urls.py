from django.contrib.auth.views import LogoutView
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ImageViewSet, register
from . import views

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'images', ImageViewSet)

urlpatterns = [

    path('index/', views.index, name='index'),
    path('', views.register, name='register'),
    path('api/', include(router.urls)),
    path('api/save-network-config/', views.save_network_config, name='save_network_config'),
    path('api/predict/', views.predict, name='predict'),
    path('api/save-image/', views.save_image, name='save_image'),
    path('logout/', LogoutView.as_view(), name='logout'),
]

