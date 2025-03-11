import base64
import os
import json
import numpy as np
import tensorflow as tf

from django.contrib.auth import login, authenticate
from django.shortcuts import render, redirect, get_object_or_404
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view

from .forms import UserRegisterForm, UserLoginForm
from .models import Category, Image
from .serializers import CategorySerializer, ImageSerializer
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated

#from neural_network import *

UPLOAD_DIR = "uploads"

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        request.data['user'] = request.user.id
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ImageViewSet(viewsets.ModelViewSet):
    serializer_class = ImageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Image.objects.filter(category__user=self.request.user)

# api
def index(request):
    return render(request, 'index.html')

def save_network_config(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            layers = data.get('layers', [])
            parameters = data.get('parameters', {})

            print("Received Layers:", layers)
            print("Received Parameters:", parameters)

            file_path = os.path.join("network_config.json")
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=4)

            return JsonResponse({'message': 'Configuration saved successfully!'}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

def load_model():
    return tf.keras.models.load_model("trained_model.h5")

@csrf_exempt
def predict(request):
    if request.method == 'POST':
        try:
            model = load_model()
            data = json.loads(request.body)
            input_data = np.array(data["input"]).reshape(1, -1)

            prediction = model.predict(input_data).tolist()

            return JsonResponse({"prediction": prediction}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)

@csrf_exempt
def save_image(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            image_name = data.get('name')
            category_name = data.get('category')
            image_data = data.get('data')

            if not image_name or not category_name or not image_data:
                return JsonResponse({'error': 'Missing fields'}, status=400)

            # Decode base64 image
            format, imgstr = image_data.split(';base64,')
            ext = format.split('/')[-1]

            if ext not in ['png', 'jpg', 'jpeg']:
                return JsonResponse({'error': 'Invalid image format'}, status=400)

            # Ensure upload directory exists
            if not os.path.exists(UPLOAD_DIR):
                os.makedirs(UPLOAD_DIR)

            file_path = os.path.join(UPLOAD_DIR, f"{image_name}.{ext}")

            # Save image file
            with open(file_path, "wb") as f:
                f.write(base64.b64decode(imgstr))

            # Save metadata to database
            category, _ = Category.objects.get_or_create(name=category_name)
            image = Image.objects.create(name=image_name, category=category, file_name=f"{image_name}.{ext}")

            return JsonResponse({'message': f'Image "{image_name}" saved successfully!'}, status=201)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)


def register(request):
    if request.method == "POST":
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('index')
    else:
        form = UserRegisterForm()

    return render(request, 'register.html', {'form': form})


def user_login(request):
    if request.method == "POST":
        form = UserLoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(request, username=username, password=password)

            if user is not None:
                login(request, user)
                return redirect("index")  # Redirect to the home page
            else:
                form.add_error(None, "Invalid username or password")

    else:
        form = UserLoginForm()

    return render(request, 'login.html', {'form': form})

@csrf_exempt
def save_categories(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            categories_data = data.get('categories', {})

            user = request.user
            for category_name, images in categories_data.items():
                category, _ = Category.objects.get_or_create(name=category_name, user=user)
                category.images = images  # Store images in JSON field
                category.save()

            return JsonResponse({'message': 'Categories and images saved successfully!'}, status=201)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def fetch_categories(request):
    if request.method == 'GET':
        try:
            categories = Category.objects.filter(user=request.user)
            categories_data = [
                {"name": category.name, "images": category.images} for category in categories
            ]
            return JsonResponse(categories_data, safe=False, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def delete_category(request):
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            category_name = data.get('category')

            if not category_name:
                return JsonResponse({'error': 'Category name is required'}, status=400)

            category = Category.objects.filter(name=category_name).first()
            if not category:
                return JsonResponse({'error': 'Category not found'}, status=404)

            category.delete()
            return JsonResponse({'message': 'Category deleted successfully'})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=400)

@api_view(['DELETE'])
def delete_image(request):
    category_name = request.data.get('category')
    image_name = request.data.get('name')

    if not category_name or not image_name:
        return Response({'error': 'Missing category or image name'}, status=400)

    category = get_object_or_404(Category, name=category_name)

    if not isinstance(category.images, list):
        return Response({'error': 'Invalid images format'}, status=500)

    updated_images = [img for img in category.images if img.get("name") != image_name]

    if len(updated_images) == len(category.images):
        return Response({'error': 'Image not found in this category'}, status=404)

    category.images = updated_images
    category.save()  # Save changes

    return Response({'message': f'Image "{image_name}" deleted from category "{category_name}".'})
