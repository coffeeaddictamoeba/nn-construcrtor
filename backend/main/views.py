import os
import json
import ast
import numpy as np
import tensorflow as tf

from django.contrib.auth import login, authenticate
from django.shortcuts import render, redirect, get_object_or_404
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view

from .forms import UserRegisterForm, UserLoginForm
from .models import Category, Image, NeuralNetwork
from .serializers import CategorySerializer, ImageSerializer
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated

from PIL import Image as PILImage
from .neural_network import train
#from train import CustomModel, Layer

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

# def save_network_config(request):
#     if request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             layers = data.get('layers', [])
#             parameters = data.get('parameters', {})
#
#             print("Received Layers:", layers)
#             print("Received Parameters:", parameters)
#
#             file_path = os.path.join("network_config.json")
#             with open(file_path, 'w') as f:
#                 json.dump(data, f, indent=4)
#
#             return JsonResponse({'message': 'Configuration saved successfully!'}, status=200)
#         except json.JSONDecodeError:
#             return JsonResponse({'error': 'Invalid JSON'}, status=400)
#     return JsonResponse({'error': 'Invalid request method'}, status=405)
# Import necessary models

def train_network(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))

            user = request.user
            name = data.get('name')
            layers = data.get('layers', {})
            parameters = data.get('parameters', {})
            categories = data.get('categories', [])

            print(f"User: {user}, Name: {name}, Layers: {layers}, Parameters: {parameters}, Categories: {categories}")

            selected_categories = Category.objects.filter(name__in=categories, user=user)

            training_data = []
            for category in selected_categories:
                training_data.extend(category.images)

            if not training_data:
                return JsonResponse({'error': 'No images found for selected categories'}, status=400)

            config = merge_nn_config(layers, parameters)

            nn = NeuralNetwork.objects.create(user=user, params=config, name=name, status="Training")
            set_nn_params(nn, selected_categories)

            return JsonResponse({'accuracy': nn.accuracy, 'loss': nn.loss, 'status': "Trained"}, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

def get_models(request):
    user = request.user
    models = NeuralNetwork.objects.filter(user=user, status="Trained").values('id', 'name', 'accuracy')

    return JsonResponse(list(models), safe=False)

# def load_model():
#     return tf.keras.models.load_model("trained_model.h5")

@csrf_exempt
def predict(request): # TODO: create model loading and predicting logic
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
            image_data = ast.literal_eval(data.get('data'))

            if not image_name or not category_name or not image_data:
                return JsonResponse({'error': 'Missing fields (image_name, category_name or image_data)'}, status=400)

            save_as_png(image_data, path=image_path(image_name, 'png'))

            return JsonResponse({'message': f'Image "{image_name}" saved successfully!'}, status=201)

        except json.JSONDecodeError: return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e: return JsonResponse({'error': str(e)}, status=500)

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
                return redirect("index")
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
                category.images = images
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
    category.save()

    return Response({'message': f'Image "{image_name}" deleted from category "{category_name}".'})

def save_as_png(data: list, path: str):
    """Creates and saves image in .png format
    - Data (list): [["hex color", "hex color", ... "hex color"], ...]
    - Path (str): "path/to/your/image" or "path/to/your/image.png"
    """
    print(f"Image data ({type(data)}): {data}")

    length = len(data)
    width = len(data[0])

    img = PILImage.new('RGB', (length, width))

    for y in range(length):
        for x in range(width):
            hexcol = data[y][x]
            rgb = tuple(int(hexcol[i:i+2], 16) for i in (1, 3, 5))
            img.putpixel((x,y), rgb)
    
    if not '.png' in path:
        img.save(f'{path}.png')
    else:
        img.save(f'{path}')

def image_path(image_name: str, ext: str):
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

    file_path = os.path.join(UPLOAD_DIR, f"{image_name}.{ext}")
    print(f"Image path: {file_path}")

    return file_path

def merge_nn_config(layers, parameters):
    activations = parameters.get('activationFunctions', {})
    merged_layers = []

    for layer in layers:
        merged_layer = {
            'name': layer['name'],
            'neurons': layer['neurons'],
            'activation': activations.get(layer['name'])
        }
        merged_layers.append(merged_layer)

    print({
        'layers': merged_layers,
        'loss': parameters.get('loss')
    })

    return {
        'layers': merged_layers,
        'loss': parameters.get('loss')
    }

def set_nn_params(nn: NeuralNetwork, categories: dict):
    nn.categories.set(categories)
    print("SET NN REACHED")

    user_model = extract_nn_params(nn)

    accuracy, loss = 99, 0.1  # training function here

    nn.accuracy = accuracy
    nn.loss = loss
    nn.status = "Trained"
    nn.save()

def extract_nn_params(nn):
    data = nn.params if isinstance(nn.params, dict) else json.loads(nn.params)
    
    layers = data.get('layers', [])
    print(f"Data for extraction ({type(layers)}): {layers}")
    
    lr = float(data.get('loss'))
    print(f"Learning rate ({type(lr)}): {lr}")

    model_layers = []
    start_shape = 0
    num_classes = 0

    for layer_data in layers:
        lrname = layer_data.get('name')
        neurons = int(layer_data.get('neurons'))
        activation = layer_data.get('activation')

        if lrname == 'Input Layer':
            start_shape = (neurons**0.5, neurons**0.5)
            print(f'Shape: {start_shape}')
        elif lrname == 'Output Layer':
            num_classes = neurons
            print(f'Classes amount: {num_classes}')

        model_layers.append(train.Layer(neurons, activation))

    user_model = train.CustomModel(start_shape, num_classes)
    print(f'Model Layers: {model_layers}')
    user_model.build(model_layers)

    return user_model