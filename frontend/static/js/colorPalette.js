const colorPaletteModule = (() => {
    const colorPaletteContainer = document.getElementById('color-palette');
    const colors = ['red', 'orange', 'yellow', 'lightgreen', 'green', 'blue', 'indigo', 'violet', 'gray', 'black', 'white'];

    const createColorPalette = () => {
        colors.forEach((color) => {
            const swatch = document.createElement('div');
            swatch.classList.add('color-swatch');
            swatch.style.backgroundColor = color;

            swatch.addEventListener('click', () => {
                gridModule.setSelectedColor(color);
                document.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('selected'));
                swatch.classList.add('selected');
            });

            colorPaletteContainer.appendChild(swatch);
        });
    };

    return {
        createColorPalette
    };
})();