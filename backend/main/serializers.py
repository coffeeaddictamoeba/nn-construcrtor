from rest_framework import serializers
from .models import Category, Image

class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = ['name', 'created_at', 'image']

class CategorySerializer(serializers.ModelSerializer):
    images = ImageSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['name', 'images']

