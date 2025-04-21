const networkParamsModule = (() => {
    const ACTIVATION_FUNCTIONS = ['sigmoid', 'tanh', 'relu', 'softmax'];

    let learningRate = 1e-3;
    let layersParams = {};

    const activationContainer = document.getElementById('activation-params');
    const lossContainer = document.getElementById('loss-params');

    const createActivationDropdown = (layerName) => {
        const dropdown = document.createElement('select');
        dropdown.id = `${layerName}-activation-dropdown`;

        ACTIVATION_FUNCTIONS.forEach((func) => {
            const option = document.createElement('option');
            option.value = func;
            option.textContent = func;
            dropdown.appendChild(option);
        });

        dropdown.value = layersParams[layerName] || 'relu';
        dropdown.addEventListener('change', () => {
            layersParams[layerName] = dropdown.value;
        });

        return dropdown;
    };

    const setActivationParams = () => {
        activationContainer.innerHTML = ''; // Clear previous dropdowns

        const layers = neuralNetworkModule.getLayers();
        layers.forEach((layer) => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('activation-setting');

            const label = document.createElement('label');
            label.htmlFor = `${layer.name}-activation-dropdown`;
            label.textContent = `${layer.name}  `;

            const dropdown = createActivationDropdown(layer.name);

            wrapper.appendChild(label);
            wrapper.appendChild(dropdown);
            activationContainer.appendChild(wrapper);

            layersParams[layer.name] = dropdown.value;
        });
    };

    const setLossParams = () => {
        lossContainer.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.classList.add('loss-setting');

        const label = document.createElement('label');
        label.htmlFor = 'loss-slider';
        label.textContent = 'Loss:  ';

        const lossSlider = document.createElement('input');
        lossSlider.id = 'loss-slider';
        lossSlider.type = 'range';
        lossSlider.min = -6;
        lossSlider.max = 0;
        lossSlider.step = 1;
        lossSlider.value = Math.log10(learningRate);

        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = learningRate.toExponential(1);

        lossSlider.addEventListener('input', () => {
            learningRate = Math.pow(10, lossSlider.value);
            valueDisplay.textContent = learningRate.toExponential(1);
        });

        wrapper.appendChild(label);
        wrapper.appendChild(lossSlider);
        wrapper.appendChild(valueDisplay);
        lossContainer.appendChild(wrapper);
    };

    const initializeNetworkParams = () => {
        setActivationParams();
        setLossParams();
    };

    const getNetworkParams = () => {
        return {
            activationFunctions: { ...layersParams },
            loss: learningRate
        };
    };

    const updateActivationParams = () => {
        setActivationParams();
    }

    const getCsrfToken = () => {
        return document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    };

    const loadModels = () => {
        fetch('/api/models/')
        .then(response => response.json())
        .then(models => {
            const dropdown = document.getElementById("model-dropdown");
            dropdown.innerHTML = "";

            models.forEach(model => {
                let option = document.createElement("option");
                option.value = model.id;
                option.textContent = `${model.name} (Acc: ${model.accuracy.toFixed(2)})`;
                dropdown.appendChild(option);
            });
        })
        .catch(error => console.error("Error loading models:", error));
    };

    const sendNetworkConfigToBackend = () => {
        const networkConfig = {
            layers: neuralNetworkModule.getLayers(),
            parameters: networkParamsModule.getParameters(),
            categories: galleryModule.getChosenCategories()
        };

        fetch('/train_network/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
            body: JSON.stringify(networkConfig)
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('accuracy-value').textContent = data.accuracy.toFixed(2);
            document.getElementById('loss-value').textContent = data.loss.toFixed(2);
            document.getElementById('status-value').textContent = data.status;
            loadModels();
        })
        .catch(error => console.error('Error:', error));
    };

    return {
        updateActivationParams,
        initializeNetworkParams,
        getNetworkParams,
        loadModels,
        sendNetworkConfigToBackend
    };
})();
