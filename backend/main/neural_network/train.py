import tensorflow as tf
import numpy as np

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam

class Layer:
    def __init__(self, neurons_amount, activation_function):
        self.neurons_amount = neurons_amount
        self.activation_function = activation_function

class CustomModel:
    def __init__(self, input_shape, num_classes, model = None, model_name = None):
        self.input_shape = input_shape
        self.num_classes = num_classes
        self.model = model
        self.model_name = model_name

    def build(self, layers):
        self.model = Sequential()
        for layer in layers:
            self.model.add(Dense(layer.neurons_amount, activation=layer.activation_function))

    def create_checkpoint(self, filepath):
        checkpoint = tf.keras.callbacks.ModelCheckpoint(
            filepath=filepath,
            monitor='accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        )
        return checkpoint

    def train(self, train_data, learning_rate = 1e-3, epochs = 10, batch_size = 4):
        self.model.compile(loss='binary_crossentropy', optimizer=Adam(learning_rate=learning_rate), metrics=['accuracy'])
        callback = self.create_checkpoint("models")
        history = self.model.fit(
            train_data,
            epochs = epochs,
            batch_size = batch_size,
            validation_split = 0.2,
            callbacks = [callback]
        )
        return history

    def evaluate(self, test_data):
        score = self.model.evaluate(test_data, verbose=False)
        print('Test loss:', score[0])
        print('Test accuracy:', score[1])
        return score

    def predict(self, test_data, model = None, model_name = None):
        if model:
            self.model = tf.keras.models.load_model(model)
        elif model_name:
            self.model = tf.keras.models.load_model(f"{model_name}.h5")
        else:
            print("No model specified!")
            return
        return self.model.predict(test_data)
