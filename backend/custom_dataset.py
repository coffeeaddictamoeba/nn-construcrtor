import numpy as np

from tensorflow.keras.preprocessing.image import img_to_array, ImageDataGenerator
from tensorflow.keras.preprocessing import image

class CustomDataset:
    def __init__(self, images, labels):
        self.images = images
        self.labels = labels

    def add(self, image_path, label):
        img = image.load_img(image_path)
        self.images.append(image.img_to_array(img)/255.0)
        self.labels.append(label)

        self.images = np.array(self.images)
        self.labels = np.array(self.labels)

    def augment(self):
        augmented_data = ImageDataGenerator(
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            fill_mode='nearest'
        )
        return augmented_data.fit(x=self.images)