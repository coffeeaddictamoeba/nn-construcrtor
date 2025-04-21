const colorPaletteModule = (() => {
    const colorPaletteContainer = document.getElementById('color-palette');
    const colors = {
        red: '#FF0000',
        orange: '#FFA500',
        yellow: '#FFFF00',
        lightgreen: '#90EE90',
        green: '#008000',
        blue: '#0000FF',
        indigo: '#4B0082',
        violet: '#EE82EE',
        gray: '#808080',
        black: '#000000',
        white: '#FFFFFF'
    };

    const createColorPalette = () => {
        for (const colorName in colors) {
            const hexColor = colors[colorName];
            const swatch = document.createElement('div');
            swatch.classList.add('color-swatch');
            swatch.style.backgroundColor = hexColor;

            swatch.addEventListener('click', () => {
                gridModule.setSelectedColor(hexColor);
                document.querySelectorAll('.color-swatch').forEach((s) => s.classList.remove('selected'));
                swatch.classList.add('selected');
            });

            colorPaletteContainer.appendChild(swatch);
        }
    };

    return {
        createColorPalette
    };
})();