from django.contrib.auth.views import LogoutView
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'images', views.ImageViewSet, basename='image')

urlpatterns = [
    path('index/', views.index, name='index'),
    path('', views.register, name='register'),
    path('login/', views.user_login, name='user_login'),
    path('api/', include(router.urls)),
    path('api/save-network-config/', views.save_network_config, name='save_network_config'),
    path('api/predict/', views.predict, name='predict'),
    path('api/save-image/', views.save_image, name='save_image'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('api/save-categories/', views.save_categories, name='save_categories'),
    path('api/delete-category/', views.delete_category, name='delete_category'),
    path("api/delete-image/", views.delete_image, name="delete-image"),
]

