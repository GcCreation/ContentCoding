document.addEventListener('DOMContentLoaded', () => {
    // Game constants
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    const TETROMINOES = {
        'I': {
            shape: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            color: 'I'
        },
        'J': {
            shape: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 'J'
        },
        'L': {
            shape: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 'L'
        },
        'O': {
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: 'O'
        },
        'S': {
            shape: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            color: 'S'
        },
        'T': {
            shape: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 'T'
        },
        'Z': {
            shape: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            color: 'Z'
        }
    };

    // DOM Elements
    const boardElement = document.getElementById('board');
    const nextPieceElement = document.getElementById('nextPiece');
    const scoreElement = document.getElementById('score');
    const linesElement = document.getElementById('lines');
    const levelElement = document.getElementById('level');
    const gameOverElement = document.getElementById('gameOver');
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');
    const restartButton = document.getElementById('restartButton');

    // Game variables
    let board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    let currentPiece = null;
    let currentPiecePosition = {
        x: 0,
        y: 0
    };
    let nextPiece = null;
    let score = 0;
    let lines = 0;
    let level = 1;
    let gameInterval = null;
    let isPaused = false;
    let gameOver = false;
    let dropInterval = 1000; // Starting speed in ms
    let gameStarted = false;

    // Initialize the game board
    function initBoard() {
        boardElement.innerHTML = '';
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell', 'empty');
                cell.dataset.x = x;
                cell.dataset.y = y;
                boardElement.appendChild(cell);
            }
        }
    }

    // Initialize the next piece preview
    function initNextPiecePreview() {
        nextPieceElement.innerHTML = '';
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell', 'empty');
                nextPieceElement.appendChild(cell);
            }
        }
    }

    // Update the next piece preview
    function updateNextPiecePreview() {
        const cells = nextPieceElement.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.className = 'cell empty';
        });

        if (!nextPiece) return;

        const shape = nextPiece.shape;
        const color = nextPiece.color;

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const index = y * 4 + x;
                    cells[index].classList.remove('empty');
                    cells[index].classList.add('filled', color);
                }
            }
        }
    }

    // Generate a random tetromino
    function getRandomTetromino() {
        const pieces = Object.keys(TETROMINOES);
        const pieceType = pieces[Math.floor(Math.random() * pieces.length)];
        return {
            ...TETROMINOES[pieceType]
        };
    }

    // Update the game board display
    function updateBoard() {
        const cells = boardElement.querySelectorAll('.cell');

        // Clear the board
        cells.forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            cell.className = 'cell';

            if (board[y][x]) {
                cell.classList.add('filled', board[y][x]);
            } else {
                cell.classList.add('empty');
            }
        });

        // Draw the current piece
        if (currentPiece) {
            const shape = currentPiece.shape;
            const color = currentPiece.color;

            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        const boardX = currentPiecePosition.x + x;
                        const boardY = currentPiecePosition.y + y;

                        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX <
                            BOARD_WIDTH) {
                            const cellIndex = boardY * BOARD_WIDTH + boardX;
                            cells[cellIndex].className = 'cell filled ' + color;
                        }
                    }
                }
            }
        }
    }

    // Check if a move is valid
    function isValidMove(pieceShape, position) {
        for (let y = 0; y < pieceShape.length; y++) {
            for (let x = 0; x < pieceShape[y].length; x++) {
                if (pieceShape[y][x]) {
                    const boardX = position.x + x;
                    const boardY = position.y + y;

                    // Check if the position is out of bounds or collides with existing pieces
                    if (
                        boardY >= BOARD_HEIGHT ||
                        boardX < 0 ||
                        boardX >= BOARD_WIDTH ||
                        (boardY >= 0 && board[boardY][boardX])
                    ) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // Rotate a piece
    function rotatePiece(pieceShape) {
        const rotatedPiece = [];
        for (let x = 0; x < pieceShape[0].length; x++) {
            const newRow = [];
            for (let y = pieceShape.length - 1; y >= 0; y--) {
                newRow.push(pieceShape[y][x]);
            }
            rotatedPiece.push(newRow);
        }
        return rotatedPiece;
    }

    // Place the current piece on the board
    function placePiece() {
        const shape = currentPiece.shape;
        const color = currentPiece.color;

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardX = currentPiecePosition.x + x;
                    const boardY = currentPiecePosition.y + y;

                    if (boardY >= 0 && boardY <
                        BOARD_HEIGHT) { // Only add to the board if we're not above the top edge
                        board[boardY][boardX] = color;
                    } else {
                        // Game Over if we're placing a piece above the top edge
                        endGame();
                        return;
                    }
                }
            }
        }

        // Check for completed rows
        checkRows();

        // Generate new piece
        spawnNewPiece();
    }

    // Check for completed rows and remove them
    function checkRows() {
        let completedRows = 0;

        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (board[y].every(cell => cell !== 0)) {
                // Remove row
                board.splice(y, 1);
                // Add new empty row at the top
                board.unshift(Array(BOARD_WIDTH).fill(0));
                completedRows++;
                y++; // Check this row again as it's now a different row
            }
        }

        if (completedRows > 0) {
            // Update score based on number of lines cleared and level
            const linePoints = [0, 40, 100, 300, 1200]; // Points for 0, 1, 2, 3, 4 lines
            score += linePoints[completedRows] * level;
            lines += completedRows;

            // Update level
            level = Math.floor(lines / 10) + 1;

            // Update speed
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);

            // Update UI
            scoreElement.textContent = score;
            linesElement.textContent = lines;
            levelElement.textContent = level;

            // Reset the interval with the new speed
            if (gameInterval) {
                clearInterval(gameInterval);
                if (!isPaused && !gameOver) {
                    gameInterval = setInterval(moveDown, dropInterval);
                }
            }
        }
    }

    // Spawn a new piece
    function spawnNewPiece() {
        if (!nextPiece) {
            nextPiece = getRandomTetromino();
        }

        currentPiece = nextPiece;
        nextPiece = getRandomTetromino();

        // Set initial position (center top)
        currentPiecePosition = {
            x: Math.floor((BOARD_WIDTH - currentPiece.shape[0].length) / 2),
            y: -1 // Start slightly above the board but not too high
        };

        // Update next piece preview
        updateNextPiecePreview();

        // Check if the new piece can be placed
        if (!isValidMove(currentPiece.shape, currentPiecePosition)) {
            endGame();
        }
    }

    // Move the current piece down
    function moveDown() {
        if (!gameStarted) return;

        const newPosition = {
            ...currentPiecePosition,
            y: currentPiecePosition.y + 1
        };

        if (isValidMove(currentPiece.shape, newPosition)) {
            currentPiecePosition = newPosition;
            updateBoard();
        } else {
            // Can't move down anymore, place the piece
            placePiece();
        }
    }

    // Hard drop the current piece
    function hardDrop() {
        if (!gameStarted) return;

        let newPosition = {
            ...currentPiecePosition
        };

        while (isValidMove(currentPiece.shape, {
                ...newPosition,
                y: newPosition.y + 1
            })) {
            newPosition.y++;
        }

        currentPiecePosition = newPosition;
        updateBoard();
        placePiece();
    }

    // Move the current piece left
    function moveLeft() {
        if (!gameStarted) return;

        const newPosition = {
            ...currentPiecePosition,
            x: currentPiecePosition.x - 1
        };

        if (isValidMove(currentPiece.shape, newPosition)) {
            currentPiecePosition = newPosition;
            updateBoard();
        }
    }

    // Move the current piece right
    function moveRight() {
        if (!gameStarted) return;

        const newPosition = {
            ...currentPiecePosition,
            x: currentPiecePosition.x + 1
        };

        if (isValidMove(currentPiece.shape, newPosition)) {
            currentPiecePosition = newPosition;
            updateBoard();
        }
    }

    // Rotate the current piece
    function rotate() {
        if (!gameStarted) return;

        const rotatedShape = rotatePiece(currentPiece.shape);

        if (isValidMove(rotatedShape, currentPiecePosition)) {
            currentPiece.shape = rotatedShape;
            updateBoard();
        } else {
            // Try wall kick - move left if rotation would put us outside the right wall
            let wallKickOffset = 0;

            // Try moving left
            for (let i = 1; i <= 2; i++) {
                if (isValidMove(rotatedShape, {
                        ...currentPiecePosition,
                        x: currentPiecePosition.x - i
                    })) {
                    wallKickOffset = -i;
                    break;
                }
            }

            // Try moving right
            if (wallKickOffset === 0) {
                for (let i = 1; i <= 2; i++) {
                    if (isValidMove(rotatedShape, {
                            ...currentPiecePosition,
                            x: currentPiecePosition.x + i
                        })) {
                        wallKickOffset = i;
                        break;
                    }
                }
            }

            if (wallKickOffset !== 0) {
                currentPiecePosition.x += wallKickOffset;
                currentPiece.shape = rotatedShape;
                updateBoard();
            }
        }
    }

    // Handle keyboard controls
    function handleKeyPress(event) {
        if (gameOver || isPaused) return;

        switch (event.key) {
            case 'ArrowLeft':
                moveLeft();
                break;
            case 'ArrowRight':
                moveRight();
                break;
            case 'ArrowDown':
                moveDown();
                break;
            case 'ArrowUp':
                rotate();
                break;
            case ' ':
                hardDrop();
                break;
            case 'p':
            case 'P':
                togglePause();
                break;
        }
    }

    // Toggle pause state
    function togglePause() {
        if (gameOver || !gameStarted) return;

        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? 'Resume' : 'Pause';

        if (isPaused) {
            clearInterval(gameInterval);
        } else {
            gameInterval = setInterval(moveDown, dropInterval);
        }
    }

    // End the game
    function endGame() {
        gameOver = true;
        gameStarted = false;
        clearInterval(gameInterval);
        gameOverElement.style.display = 'flex';
    }

    // Start a new game
    function startGame() {
        // Reset game state
        board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
        currentPiece = null;
        nextPiece = null;
        score = 0;
        lines = 0;
        level = 1;
        isPaused = false;
        gameOver = false;
        gameStarted = true;
        dropInterval = 1000;

        // Update UI
        scoreElement.textContent = score;
        linesElement.textContent = lines;
        levelElement.textContent = level;
        pauseButton.textContent = 'Pause';
        gameOverElement.style.display = 'none';

        // Clear previous interval
        if (gameInterval) {
            clearInterval(gameInterval);
        }

        // Spawn the first piece
        spawnNewPiece();

        // Start the game loop
        gameInterval = setInterval(moveDown, dropInterval);

        // Update the board
        updateBoard();
    }

    // Initialize
    initBoard();
    initNextPiecePreview();

    // Event listeners
    document.addEventListener('keydown', handleKeyPress);
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
    restartButton.addEventListener('click', startGame);

    // Mobile touch controls (optional feature for better responsiveness)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', function (event) {
        touchStartX = event.changedTouches[0].screenX;
        touchStartY = event.changedTouches[0].screenY;
    }, false);

    document.addEventListener('touchend', function (event) {
        if (gameOver || isPaused || !gameStarted) return;

        touchEndX = event.changedTouches[0].screenX;
        touchEndY = event.changedTouches[0].screenY;

        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        // Detect swipe direction
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (diffX > 50) {
                moveRight();
            } else if (diffX < -50) {
                moveLeft();
            }
        } else {
            // Vertical swipe
            if (diffY > 50) {
                moveDown();
            } else if (diffY < -50) {
                rotate();
            }
        }

        // Detect tap (for hard drop)
        if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
            hardDrop();
        }
    }, false);
});