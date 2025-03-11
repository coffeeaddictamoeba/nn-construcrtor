const neuralNetworkModule = (() => {

    const canvas = document.getElementById('networkCanvas');
    const ctx = canvas.getContext('2d');

    const neuronRadius = 20;
    const layerSpacing = 150;
    const neuronSpacing = 45;
    const maxHiddenLayers = 3;
    const maxNeurons = 10;

    const layerDropdown = document.getElementById('layer-dropdown');

    let layers = [
        { name: 'Input Layer', neurons: 64, fixed: true },
        { name: 'Output Layer', neurons: 0, fixed: true }
    ];

    const drawNetwork = () => {
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
    };

    const drawNeuron = (x, y) => {
        ctx.beginPath();
        ctx.arc(x, y, neuronRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.stroke();
    };

    const drawText = (text, x, y, font = '14px Arial') => {
        ctx.fillStyle = 'black';
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.fillText(text, x, y + 10);
    };

    const drawConnections = (prevLayer, currentLayer, prevX, currX, currYStart) => {
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
    };

    const updateNetwork = () => {
        layers[0].neurons = gridModule.getCols() * gridModule.getRows();
        layers[layers.length - 1].neurons = galleryModule.getChosenCategories().size;
        document.getElementById('train-nn').disabled = layers[layers.length - 1].neurons < 2; // should be at least 2 categories
        drawNetwork();
    }

    const resetNetwork = () => {
        layers = [
            { name: 'Input Layer', neurons: gridModule.getCols() * gridModule.getRows(), fixed: true },
            { name: 'Output Layer', neurons: galleryModule.getChosenCategories().size, fixed: true }
        ];
        document.getElementById('train-nn').disabled = layers[layers.length - 1].neurons < 2;
        updateLayersDropdown();
        drawNetwork();
    }

    const updateLayersDropdown = () => {
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

    const addLayer = () => {
        if (layers.length - 2 < maxHiddenLayers) {
            const layerCount = layers.length - 1;
            layers.splice(layers.length - 1, 0, {
                name: `Layer ${layerCount + 1}`,
                neurons: 1,
            });
            updateNetwork();
            updateLayersDropdown();
            networkParamsModule.updateActivationParams();
        }
    };

    const removeLayer = () => {
        if (layers.length > 2) {
            layers.splice(layers.length - 2, 1);
            updateNetwork();
        }
    };

    const addNeuron = () => {
        const layerName = layerDropdown.value;
        layers.forEach((layer) => {
            if (layer.name === layerName) layer.neurons++;
        });
        updateNetwork();
    }

    const removeNeuron = () => {
        const layerName = layerDropdown.value;
        layers.forEach((layer) => {
            if (layer.name === layerName) {
                layer.neurons--;
                if (layer.neurons <= 0) removeLayer();
            }
        });
        updateNetwork();
    }

    const getLayers = () => layers;

    return {
        drawNetwork,
        updateNetwork,
        resetNetwork,
        addLayer,
        removeLayer,
        addNeuron,
        removeNeuron,
        getLayers
    };
})();