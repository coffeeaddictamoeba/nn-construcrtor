import os
from django.conf import settings
from django.core.files.storage import default_storage
from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Category, Image
from .serializers import CategorySerializer, ImageSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ImageViewSet(viewsets.ModelViewSet):
    queryset = Image.objects.all()
    serializer_class = ImageSerializer
    parser_classes = [MultiPartParser, FormParser]  # Allow file uploads

    def create(self, request, *args, **kwargs):
        category_name = request.data.get('category')
        name = request.data.get('name')
        image_file = request.FILES.get('image')

        if not category_name or not name or not image_file:
            return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)

        # Save the file to /uploads/
        file_path = default_storage.save(os.path.join('uploads', image_file.name), image_file)

        # Get or create the category
        category, _ = Category.objects.get_or_create(name=category_name)

        # Save image metadata to database
        image = Image.objects.create(name=name, category=category, file_name=image_file.name)
        return Response(ImageSerializer(image).data, status=status.HTTP_201_CREATED)

def index(request):
    return render(request, 'index.html')