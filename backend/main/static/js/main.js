document.addEventListener('DOMContentLoaded', () => {
    // Initialization
    colorPaletteModule.createColorPalette();
    gridModule.createGrid(8, 8);
    neuralNetworkModule.drawNetwork();
    networkParamsModule.initializeNetworkParams();
    networkParamsModule.loadModels();
    galleryModule.syncDatabaseAndStorage();

    // Grid controls
    document.getElementById('smallGridButton').addEventListener('click', () => gridModule.resizeGrid(8, 8));
    document.getElementById('midGridButton').addEventListener('click', () => gridModule.resizeGrid(16, 16));
    document.getElementById('largeGridButton').addEventListener('click', () => gridModule.resizeGrid(32, 32));
    document.getElementById('clearGridButton').addEventListener('click', () => gridModule.setGrid());

    // Gallery (categories) controls
    document.getElementById('addCategoryButton').addEventListener('click', galleryModule.addCategory);
    document.getElementById('confirm-add-image').addEventListener('click', galleryModule.saveImageToCategory);

    // Neural Network controls
    document.getElementById('addLayerButton').addEventListener('click', neuralNetworkModule.addLayer);
    document.getElementById('removeLayerButton').addEventListener('click', neuralNetworkModule.removeLayer);
    document.getElementById('confirm-add-neuron').addEventListener('click', neuralNetworkModule.addNeuron);
    document.getElementById('confirm-remove-neuron').addEventListener('click', neuralNetworkModule.removeNeuron);
    document.getElementById('reset-nn').addEventListener('click', neuralNetworkModule.resetNetwork);

    document.getElementById('saveAllImagesButton').addEventListener('click', galleryModule.sendAllImagesData);
    document.getElementById('train-nn').addEventListener('click', networkParamsModule.sendNetworkConfigToBackend);

    // TODO: add model logic
    document.getElementById('validateNNButton').addEventListener('click', networkParamsModule.sendPredictionRequest) // validation of nn by real-time created image on the grid

    galleryModule.fetchUserCategories();
});