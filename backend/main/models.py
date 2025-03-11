import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify

class NeuralNetwork(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="neural_networks")
    params = models.JSONField()
    categories = models.ManyToManyField('Category', related_name="neural_networks")

    def __str__(self):
        return f"NeuralNetwork {self.id} by {self.user.username}"

class Category(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True, blank=True)
    images = models.JSONField(default=list)  # Store images directly in JSON format

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} (User: {self.user.username})"

class Image(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    image = models.JSONField()

    def __str__(self):
        return self.name
