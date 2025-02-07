// Object containers
const gridContainer = document.getElementById('grid-container');
const colorPaletteContainer = document.getElementById('color-palette');
const galleryContainer = document.getElementById('gallery');

// Dropdowns
const categoryDropdown = document.getElementById('category-dropdown');
const layerDropdown = document.getElementById('layer-dropdown');

// Grid controls
const smallGridButton = document.getElementById('smallGridButton');
const midGridButton = document.getElementById('midGridButton');
const largeGridButton = document.getElementById('largeGridButton');
const clearGridButton = document.getElementById('clearGridButton');
const validateNNButton = document.getElementById('validateNNButton');

// Gallery (dataset) controls
const addCategoryButton = document.getElementById('addCategoryButton');
const saveAllImagesButton = document.getElementById('saveAllImagesButton')
const confirmAddImageButton = document.getElementById('confirm-add-image');

// Neural Network controls
const addLayerButton = document.getElementById('addLayerButton');
const removeLayerButton = document.getElementById('removeLayerButton');
const addNeuronButton = document.getElementById('confirm-add-neuron');
const removeNeuronButton = document.getElementById('confirm-remove-neuron');
const trainNNButton = document.getElementById('train-nn');

const canvas = document.getElementById('networkCanvas');
const ctx = canvas.getContext('2d');

const maxHiddenLayers = 3;
const maxNeurons = 10;
const neuronRadius = 20;
const layerSpacing = 150;
const neuronSpacing = 45;

let selectedColor = 'black';
let isMouseDown = false;
let currentGrid = [];
let gridSize = { rows: 8, cols: 8 };
let categories = {};
let layers = [
    { name: 'Input Layer', neurons: gridSize.rows * gridSize.rows, fixed: true},
    { name: 'Output Layer', neurons: Object.keys(categories).length, fixed: true},
];

const createEmptyGrid = (rows, cols) => Array.from({ length: rows }, () => Array(cols).fill('white'));

function initialize() {
    document.addEventListener('mousedown', () => (isMouseDown = true));
    document.addEventListener('mouseup', () => (isMouseDown = false));

    createColorPalette();
    createGrid(gridSize.rows, gridSize.cols);
    updateCategoryDropdown();
    renderGallery();

    updateButtons();
    drawNetwork();

    smallGridButton.addEventListener('click', () => resizeGrid(8, 8));
    midGridButton.addEventListener('click', () => resizeGrid(16, 16));
    largeGridButton.addEventListener('click', () => resizeGrid(32, 32));
    clearGridButton.addEventListener('click', () => resizeGrid(gridSize.rows, gridSize.cols));
}

function createGrid(rows, cols) {
    currentGrid = createEmptyGrid(rows, cols);
    gridSize = { rows, cols };
    renderGrid();
    updateNetwork();
}

function renderGrid() {
    gridContainer.innerHTML = '';
    const containerSize = 400;
    gridContainer.style.width = `${containerSize}px`;
    gridContainer.style.height = `${containerSize}px`;
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = `repeat(${gridSize.cols}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${gridSize.rows}, 1fr)`;

    currentGrid.forEach((row, rowIndex) => {
        row.forEach((color, colIndex) => {
            const cell = document.createElement('button');
            cell.classList.add('grid-cell');
            cell.style.backgroundColor = color;

            const changeColor = () => { cell.style.backgroundColor = selectedColor;};

            cell.addEventListener('mousedown', changeColor);
            cell.addEventListener('mouseover', () => {
                if (isMouseDown) changeColor();
            });

            gridContainer.appendChild(cell);
        });
    });
}

function resizeGrid(rows, cols) {
    createGrid(rows, cols);
}

function createColorPalette() {
    const colors = ['red', 'orange', 'yellow', 'lightgreen', 'green', 'blue', 'indigo', 'violet', 'gray', 'black', 'white'];
    colors.forEach((color) => {
        const swatch = document.createElement('div');
        swatch.classList.add('color-swatch');
        swatch.style.backgroundColor = color;

        swatch.addEventListener('click', () => {
            selectedColor = color;
            document.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('selected'));
            swatch.classList.add('selected');
        });

        colorPaletteContainer.appendChild(swatch);

    });
}

function updateCategoryDropdown() {
    categoryDropdown.innerHTML = '';
    Object.keys(categories).forEach((name) => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        categoryDropdown.appendChild(option);
    });

    const hasCategories = !!Object.keys(categories).length;
    categoryDropdown.disabled = !hasCategories;
    confirmAddImageButton.disabled = !hasCategories;
}

function addCategory() {
    const name = prompt('Enter the new category name:', 'Category' + (Object.keys(categories).length + 1));
    if (name && !categories[name]) {
        categories[name] = [];
        updateCategoryDropdown();
        renderGallery();
        updateNetwork();
    } else {
        alert('Invalid or duplicate category name.');
    }
}

function saveImageToCategory() {
    const category = categoryDropdown.value;
    const name = prompt('Enter a name for the image:', 'Untitled Image');
    if (category && name && !categories[category].some((img) => img.name === name)) {
        categories[category].push({ name, grid: JSON.parse(JSON.stringify(currentGrid)) });
        saveAllImagesButton.disabled = false;
        renderGallery();
        alert(`Image "${name}" saved to category "${category}".`);
    } else {
        alert('Invalid name or duplicate image name.');
    }
}

function renderGallery() {
    galleryContainer.innerHTML = '';
    Object.entries(categories).forEach(([categoryName, images]) => {
        const categorySection = document.createElement('div');
        categorySection.classList.add('category-section');
        categorySection.innerHTML = `<h3>${categoryName} 
            <button onclick="renameCategory('${categoryName}')">Rename</button>
            <button onclick="deleteCategory('${categoryName}')">Delete</button>
        </h3>`;

        images.forEach((image, index) => {
            const imageCard = document.createElement('div');
            imageCard.classList.add('image-card');
            imageCard.innerHTML = `
                <span>${image.name}</span>
                <button onclick="loadImage('${categoryName}', ${index})">Load</button>
                <button onclick="deleteImage('${categoryName}', ${index})">Delete</button>`;
            categorySection.appendChild(imageCard);
        });

        galleryContainer.appendChild(categorySection);
    });
}

function renameCategory(oldName) {
    const newName = prompt('Enter the new category name:', oldName);
    if (newName && !categories[newName]) {
        categories[newName] = categories[oldName];
        delete categories[oldName];
        updateCategoryDropdown();
        renderGallery();
    } else {
        alert('Invalid name or category already exists.');
    }
}

function deleteCategory(name) {
    if (confirm(`Delete category "${name}"?`)) {
        delete categories[name];
        updateCategoryDropdown();
        renderGallery();
        updateNetwork();
    }
}

function loadImage(category, index) {
    const image = categories[category][index];
    currentGrid = JSON.parse(JSON.stringify(image.grid));
    renderGrid();
}

function deleteImage(category, index) {
    categories[category].splice(index, 1);
    renderGallery();
}

async function saveImageAsPng(filename, grid, category) {
    const canvas = document.createElement('canvas');
    canvas.width = gridSize.cols;
    canvas.height = gridSize.rows;
    const ctx = canvas.getContext('2d');

    grid.forEach((row, y) => row.forEach((color, x) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
    }));

    const imageData = canvas.toDataURL("image/png");

    await fetch("http://localhost:5000/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            category,
            imageName: filename.replace(/\//g, "_"),
            imageData
        })
    })
    .then(response => response.json())
    .then(data => console.log("Saved:", data.filePath))
    .catch(error => console.error("Upload failed:", error));
}

async function saveAllImagesAsPng() {
    const savePromises = [];

    Object.entries(categories).forEach(([category, images]) => {
        images.forEach((image) => {
            const grid = extractGridColors();
            savePromises.push(saveImageAsPng(image.name, grid, category));
        });
    });
    await Promise.all(savePromises);
}

function extractGridColors() {
    const buttons = gridContainer.querySelectorAll("button");

    const cols = gridSize.cols;
    const rows = gridSize.rows;

    const grid = Array.from({ length: rows }, () => Array(cols).fill("#ffffff"));

    buttons.forEach((button, index) => {
        const x = index % cols;
        const y = Math.floor(index / cols);
        grid[y][x] = window.getComputedStyle(button).backgroundColor;
    });

    return grid;
}


function drawNetwork() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const startX = (canvas.width - layerSpacing * (layers.length - 1)) / 2;

    layers.forEach((layer, layerIndex) => {
        const x = startX + layerIndex * layerSpacing;
        const yStart = (canvas.height - Math.min(layer.neurons, maxNeurons) * neuronSpacing) / 2;

        for (let i = 0; i < Math.min(layer.neurons, maxNeurons); i++) {
            const y = yStart + i * neuronSpacing;
            drawNeuron(x, y);
        }

        if (layer.neurons > maxNeurons) {
        const y = yStart + (maxNeurons / 2) * neuronSpacing - 10;
        drawText('...', x, y, '30px Arial');
        }

        drawText(layer.name, x, canvas.height - 40);
        drawText(`Neurons: ${layer.neurons}`, x, canvas.height - 20);

        if (layerIndex > 0) {
            const prevLayer = layers[layerIndex - 1];
            drawConnections(prevLayer, layer, startX + (layerIndex - 1) * layerSpacing, x, yStart);
        }
    });
}

function drawNeuron(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, neuronRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.stroke();
}

function drawText(text, x, y, font = '14px Arial') {
    ctx.fillStyle = 'black';
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y + 10);
}

function drawConnections(prevLayer, currentLayer, prevX, currX, currYStart) {
    const prevNeuronCount = Math.min(prevLayer.neurons, maxNeurons);
    const currNeuronCount = Math.min(currentLayer.neurons, maxNeurons);

    const prevYStart = (canvas.height - prevNeuronCount * neuronSpacing) / 2;

    for (let i = 0; i < prevNeuronCount; i++) {
        const y1 = prevYStart + i * neuronSpacing;
        for (let j = 0; j < currNeuronCount; j++) {
            const y2 = currYStart + j * neuronSpacing;
            ctx.beginPath();
            ctx.moveTo(prevX + neuronRadius, y1);
            ctx.lineTo(currX - neuronRadius, y2);
            ctx.strokeStyle = 'gray';
            ctx.stroke();
        }
    }
}

function removeLayer() {
    if (layers.length > 2) {
        layers.splice(layers.length - 2, 1);
        updateButtons();
        drawNetwork();
    }
}

function updateButtons() {
    addLayerButton.disabled = layers.length - 2 >= maxHiddenLayers;
    removeLayerButton.disabled = layers.length <= 2;
}

function updateNetwork() {
    layers[0].neurons = gridSize.rows * gridSize.rows;
    layers[layers.length - 1].neurons = Object.keys(categories).length;
    trainNNButton.disabled = layers[layers.length - 1].neurons > 0;
    drawNetwork();
}

function updateLayersDropdown() {
    layerDropdown.innerHTML = '';
    layers.forEach((layer) => {
        if (layer.name !== "Input Layer" && layer.name !== "Output Layer") {
            const option = document.createElement('option');
            option.value = layer.name;
            option.textContent = layer.name;
            layerDropdown.appendChild(option);
        }
    });
    const hasLayers = layers.length > 2;
    layerDropdown.disabled = !hasLayers;
}

initialize();

saveAllImagesButton.disabled = true;
validateNNButton.disabled = true;
trainNNButton.disabled = true;

addCategoryButton.addEventListener('click', addCategory);
confirmAddImageButton.addEventListener('click', saveImageToCategory);
saveAllImagesButton.addEventListener('click', saveAllImagesAsPng);

addLayerButton.addEventListener('click', () => {
    if (layers.length - 2 < maxHiddenLayers) {
        const layerCount = layers.length - 1; // Exclude output layer
        layers.splice(layers.length - 1, 0, {
            name: `Layer ${layerCount + 1}`,
            neurons: 1,
        });
        updateButtons();
        drawNetwork();
        updateLayersDropdown();
    }
});

removeLayerButton.addEventListener('click', removeLayer);

addNeuronButton.addEventListener('click', () => {
    const layerName = layerDropdown.value;
    layers.forEach((layer) => {
        if (layer.name === layerName) layer.neurons++;
    });
    drawNetwork();
});

removeNeuronButton.addEventListener('click', () => {
    const layerName = layerDropdown.value;
    layers.forEach((layer) => {
        if (layer.name === layerName) {
            layer.neurons--;
            if (layer.neurons <= 0) removeLayer();
        }
    });
    drawNetwork();
});

async function sendSettingsToModel() {
    const data = {
        categoriesAmount: Object.keys(categories).length,
        layersAmount: layers.length,
        inputLayerNeuronsAmount: layers[0].neurons,
        midLayerNeuronsAmount1: layers.length >= 3 ? layers[2].neurons : 0,
        midLayerNeuronsAmount2: layers.length >= 4 ? layers[3].neurons : 0,
        midLayerNeuronsAmount3: layers.length >= 5 ? layers[4].neurons : 0,
        // activation function?
        // optimiser function?
    }

    await fetch('http://localhost:5000', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => alert('Server says: ' + data.response));
}

trainNNButton.addEventListener('click', sendSettingsToModel)
