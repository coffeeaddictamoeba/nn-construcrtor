const galleryModule = (() => {
    const galleryContainer = document.getElementById('gallery');
    const categoryDropdown = document.getElementById('category-dropdown');
    let categories = {};

    const updateCategoryDropdown = () => {
        categoryDropdown.innerHTML = '';
        Object.keys(categories).forEach((name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            categoryDropdown.appendChild(option);
        });

        categoryDropdown.disabled = Object.keys(categories).length === 0;
    };

    const addCategory = () => {
        const name = prompt('Enter the new category name:', 'Category' + (Object.keys(categories).length + 1));
        if (name && !categories[name]) {
            categories[name] = [];
            updateCategoryDropdown();
            renderGallery();
        } else {
            alert('Invalid or duplicate category name.');
        }
        neuralNetworkModule.updateNetwork();
    };

    const removeCategory = () => {
        const category = categoryDropdown.value;

        if (!category || !categories[category]) {
            alert('No category selected or category does not exist.');
            return;
        }

        const hasImages = categories[category].length > 0;
        if (!hasImages || confirm("You are deleting a category with existing images. Proceed?")) {
            delete categories[category];
            updateCategoryDropdown();
            renderGallery();
            neuralNetworkModule.updateNetwork();
        }
    };

    const saveImageToCategory = () => {
        const category = categoryDropdown.value;
        const name = prompt('Enter a name for the image:', 'Untitled Image');
        const currentGrid = gridModule.getCurrentGrid();

        if (category && name && !categories[category].some((img) => img.name === name)) {
            categories[category].push({ name, grid: JSON.parse(JSON.stringify(currentGrid)) });
            renderGallery();
            alert(`Image "${name}" saved to category "${category}".`);
        } else {
            alert('Invalid name or duplicate image name.');
        }
    };

    const renderGallery = () => {
        galleryContainer.innerHTML = '';
        Object.entries(categories).forEach(([categoryName, images]) => {
            const categorySection = document.createElement('div');
            categorySection.classList.add('category-section');
            categorySection.innerHTML = `<h3>${categoryName}</h3>`;

            images.forEach((image, index) => {
                const imageCard = document.createElement('div');
                imageCard.classList.add('image-card');
                imageCard.innerHTML = `
                    <span>${image.name}</span>
                    <button onclick="galleryModule.loadImage('${categoryName}', ${index})">Load</button>
                    <button onclick="galleryModule.deleteImage('${categoryName}', ${index})">Delete</button>`;
                categorySection.appendChild(imageCard);
            });

            const removeCategoryButton = document.createElement('button');
            removeCategoryButton.classList.add('remove-category');
            removeCategoryButton.textContent = 'Remove category';
            removeCategoryButton.addEventListener('click', () => removeCategory());

            categorySection.appendChild(removeCategoryButton);
            galleryContainer.appendChild(categorySection);
        });
    };

    const loadImage = (category, index) => {
        const image = categories[category][index];
        if (image) {
            if (confirm('Your current image will be reset. Proceed?')) {
                const newGrid = JSON.parse(JSON.stringify(image.grid));
                gridModule.setGrid(newGrid);
            }
        } else {
            alert('Image not found.');
        }
    };


    const deleteImage = (category, index) => {
        if (categories[category]) {
            categories[category].splice(index, 1);
            renderGallery();
        }
    };

    const getCategories = () => categories;

    const sendImageData = async (category, index) => {
        const imageData = {
            name: categories[category][index].name,
            category: category,
            data: JSON.stringify(categories[category][index])
        };

        try {
            const response = await fetch('http://127.0.0.1:8000/api/images/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(imageData)
            });

            if (response.ok) {
                console.log(`Image "${name}" saved successfully.`);
            } else {
                const errorData = await response.json();
                console.log(`Error: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Error saving image:', error);
            console.log('Failed to save image.');
        }
    };

    const sendAllImagesData = async () => {
        Object.entries(categories).forEach(([category, images]) => {
            images.forEach((image, index) => {
                sendImageData(category, index);
            });
        });
    };

    return {
        addCategory,
        removeCategory,
        saveImageToCategory,
        renderGallery,
        loadImage,
        deleteImage,
        getCategories,
        sendAllImagesData
    };
})();
