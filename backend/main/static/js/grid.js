const gridModule = (() => {
    let currentGrid = [];
    let gridSize = { rows: 8, cols: 8 };
    let selectedColor = 'black';
    let isMouseDown = false;

    document.addEventListener('mousedown', () => isMouseDown = true);
    document.addEventListener('mouseup', () => isMouseDown = false);

    const gridContainer = document.getElementById('grid-container');

    const createEmptyGrid = (rows, cols) =>
        Array.from({ length: rows }, () => Array(cols).fill('white'));

    const createGrid = (rows, cols) => {
        currentGrid = createEmptyGrid(rows, cols);
        gridSize = { rows, cols };
        renderGrid();

        neuralNetworkModule.updateNetwork();
    };

    const renderGrid = () => {
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

                const changeColor = () => {
                    cell.style.backgroundColor = selectedColor;
                    currentGrid[rowIndex][colIndex] = selectedColor;
                };

                cell.addEventListener('mousedown', changeColor);
                cell.addEventListener('mouseover', () => {
                    if (isMouseDown) changeColor();
                });

                gridContainer.appendChild(cell);
            });
        });
    }

    const resizeGrid = (rows, cols) => createGrid(rows, cols);

    const setSelectedColor = (color) => {
        selectedColor = color;
    };

    const getCurrentGrid = () => currentGrid;
    const getCols = () => gridSize.cols;
    const getRows = () => gridSize.rows;

    const setGrid = (newGrid = createEmptyGrid(gridSize.rows, gridSize.cols)) => {
        currentGrid = newGrid;
        renderGrid();
    }

    return {
        createGrid,
        resizeGrid,
        renderGrid,
        setSelectedColor,
        getCurrentGrid,
        setGrid,
        getRows,
        getCols
    };
})();