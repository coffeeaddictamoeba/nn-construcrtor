from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Image(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    file_name = models.CharField(max_length=255)  # Only store file name
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name