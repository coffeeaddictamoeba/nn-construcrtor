from django.contrib import admin
from .models import NeuralNetwork, Category, Image

admin.site.register(NeuralNetwork)
admin.site.register(Category)
admin.site.register(Image)