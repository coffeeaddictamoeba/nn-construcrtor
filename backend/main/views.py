import base64
import os
import json
import numpy as np
import tensorflow as tf

from django.contrib.auth import login, authenticate
from django.shortcuts import render, redirect
from rest_framework import viewsets, status

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