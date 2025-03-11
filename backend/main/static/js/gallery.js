const galleryModule = (() => {
    const galleryContainer = document.getElementById('gallery');
    const categoryDropdown = document.getElementById('category-dropdown');
    let categories = {};

    let chosenCategories = new Set();

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

    const removeCategory = async (categoryName) => {

        if (!categoryName || !categories[categoryName]) {
            alert('No category selected or category does not exist.');
            return;
        }

        const hasImages = categories[categoryName].length > 0;
        if (!hasImages || confirm("You are deleting a category with existing images. Proceed?")) {
            const csrfToken = getCSRFToken(); // Get CSRF token

            try {
                const response = await fetch('/api/delete-category/', {
                    method: 'DELETE',
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfToken
                    },
                    credentials: 'include',
                    body: JSON.stringify({ category: categoryName })
                });

                if (response.ok) {
                    delete categories[categoryName];
                    chosenCategories.delete(categoryName);
                    saveCategoriesToStorage();
                    updateCategoryDropdown();
                    renderGallery();
                    console.log(`Category "${categoryName}" deleted successfully.`);
                } else {
                    const errorData = await response.json();
                    console.error("Error deleting category:", errorData);
                }
            } catch (error) {
                console.error("Error deleting category:", error);
            }
        }
    };

    const createCategorySection = (categoryName, images) => {
        const categorySection = document.createElement('div');
        categorySection.classList.add('category-section');

        if (chosenCategories.has(categoryName)) {
            categorySection.classList.add('selected-category');
        }

        categorySection.innerHTML = `<h3>${categoryName}</h3>`;

        categorySection.addEventListener('click', () => toggleCategorySelection(categoryName));

        images.forEach((image, index) => categorySection.appendChild(createImageCard(categoryName, image, index)));

        categorySection.appendChild(createRemoveCategoryButton(categoryName));

        return categorySection;
    };

    const createImageCard = (categoryName, image, index) => {
        const imageCard = document.createElement('div');
        imageCard.classList.add('image-card');
        imageCard.innerHTML = `
            <span>${image.name}</span>
            <button onclick="galleryModule.loadImage('${categoryName}', ${index})">Load</button>
            <button onclick="galleryModule.deleteImage('${categoryName}', ${index})">Delete</button>`;
        return imageCard;
    };

    const createRemoveCategoryButton = (categoryName) => {
        const removeCategoryButton = document.createElement('button');
        removeCategoryButton.classList.add('remove-category');
        removeCategoryButton.textContent = 'Remove category';
        removeCategoryButton.addEventListener('click', (e) => {
            e.stopPropagation();
            removeCategory(categoryName);
        });
        return removeCategoryButton;
    };

    const toggleCategorySelection = (categoryName) => {
        chosenCategories.has(categoryName) ? chosenCategories.delete(categoryName) : chosenCategories.add(categoryName);
        renderGallery();
    };

    const renderGallery = () => {
        galleryContainer.innerHTML = '';
        Object.entries(categories).forEach(([categoryName, images]) => {
            galleryContainer.appendChild(createCategorySection(categoryName, images));
        });
        neuralNetworkModule.updateNetwork();
    };

    const loadImage = (category, index) => {
        const image = categories[category][index];
        if (image) {
            if (confirm('Your current image will be reset. Proceed?')) {
                const newGrid = JSON.parse(JSON.stringify(image.grid));
                gridModule.resizeGrid(newGrid.length, newGrid.length);
                gridModule.setGrid(newGrid);
            }
        } else {
            alert('Image not found.');
        }
    };

    const getCSRFToken = () => {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
    };

    const deleteImage = async (category, index) => {
        const imageName = categories[category][index].name;
        const csrfToken = getCSRFToken(); // Get the CSRF token

        try {
            const response = await fetch('/api/delete-image/', {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken
                },
                credentials: "include",
                body: JSON.stringify({ category: category, name: imageName })
            });

            if (response.ok) {
                console.log(category, imageName, index);
                categories[category].splice(index, 1);
                saveCategoriesToStorage();
                renderGallery();
                console.log(`Image "${imageName}" deleted successfully.`);
            } else {
                const errorData = await response.json();
                console.error("Error deleting image:", errorData);
            }
        } catch (error) {
            console.error("Error deleting image:", error);
        }
    };

    const syncLocalStorageWithServer = async () => {
        try {
            const response = await fetch('/api/categories/', { credentials: 'include' });
            if (response.ok) {
                const serverCategories = await response.json();
                const serverImagesMap = {};

                serverCategories.forEach(category => {
                    serverImagesMap[category.name] = new Set(category.images.map(img => img.name));
                });

                let updated = false;

                Object.keys(categories).forEach(category => {
                    if (!serverImagesMap[category]) {
                        delete categories[category];
                        updated = true;
                    } else {
                        categories[category] = categories[category].filter(image => {
                            if (!serverImagesMap[category].has(image.name)) {
                                updated = true;
                                return false;
                            }
                            return true;
                        });
                    }
                });

                if (updated) {
                    saveCategoriesToStorage();
                    renderGallery();
                    console.log("Local storage synced with server.");
                }
            } else {
                console.error("Failed to fetch categories from server.");
            }
        } catch (error) {
            console.error("Error syncing with server:", error);
        }
    };

    const syncDatabaseAndStorage = async() => {
        await syncLocalStorageWithServer();
        renderGallery();
    };

    const getCategories = () => categories;
    const getChosenCategories = () => chosenCategories;

    const saveCategoriesToStorage = () => {
        localStorage.setItem('categories', JSON.stringify(categories));
    };

    const saveImageToCategory = () => {
        const category = categoryDropdown.value;
        const name = prompt('Enter a name for the image:', 'Untitled Image');
        const currentGrid = gridModule.getCurrentGrid();

        if (category && name && !categories[category].some((img) => img.name === name)) {
            categories[category].push({ name, grid: JSON.parse(JSON.stringify(currentGrid)) });
            saveCategoriesToStorage();
            saveCategoriesData();
            renderGallery();
            console.log(`Image "${name}" saved to category "${category}".`);
        } else {
            alert('Invalid name or duplicate image name.');
        }
    };

    const sendImageData = async (category, index) => {
        const imageData = {
            name: categories[category][index].name,
            category: category,
            data: JSON.stringify(categories[category][index].grid)
        };

        try {
           const response = await fetch('/api/save-image/', {
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

    const saveCategoriesData = async () => {
        try {
            const response = await fetch('/api/save-categories/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categories })
            });

            if (response.ok) {
                console.log("Categories and images saved successfully.");
            } else {
                const errorData = await response.json();
                console.log(`Error: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error("Error saving categories:", error);
        }
    };

    const loadCategories = (categoriesData) => {
        categories = {};
        categoriesData.forEach(category => {
            categories[category.name] = category.images || [];
        });
        updateCategoryDropdown();
        renderGallery();
    };

    const loadCategoriesFromStorage = () => {
        const storedCategories = localStorage.getItem('categories');
        if (storedCategories) {
            categories = JSON.parse(storedCategories);
            updateCategoryDropdown();
            renderGallery();
        }
    };

    const fetchUserCategories = async () => {
        loadCategoriesFromStorage();

        try {
            const response = await fetch('/api/categories/', { credentials: 'include' });
            if (response.ok) {
                const categoriesData = await response.json();
                loadCategories(categoriesData);
                saveCategoriesToStorage();
            } else {
                console.error("Failed to load categories:", response.statusText);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    return {
        addCategory,
        removeCategory,
        saveImageToCategory,
        renderGallery,
        loadImage,
        deleteImage,
        getCategories,
        getChosenCategories,
        sendAllImagesData,
        fetchUserCategories,
        syncDatabaseAndStorage
    };
})();
