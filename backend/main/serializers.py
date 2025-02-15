from rest_framework import serializers
from .models import Category, Image

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Image
        fields = ['id', 'name', 'category', 'file_name', 'image_url', 'created_at']

    def get_image_url(self, obj):
        return f"/media/{obj.file_name}"
