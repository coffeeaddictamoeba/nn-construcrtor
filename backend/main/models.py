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
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    images = models.ManyToManyField('Image', related_name="categories")

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            unique_id = str(uuid.uuid4())[:8]
            self.slug = f"{base_slug}-{unique_id}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} (User: {self.user.username})"

class Image(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
