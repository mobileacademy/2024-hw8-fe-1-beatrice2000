/*
*
* "board" is a matrix that holds data about the
* game board, in a form of BoardSquare objects
*
* openedSquares holds the position of the opened squares
*
* flaggedSquares holds the position of the flagged squares
*
 */
let board = [];
let openedSquares = [];
let flaggedSquares = [];
let bombCount = 0;
let squaresLeft = 0;
let gameOver = false; // Variabilă care indică dacă jocul s-a terminat


/*
*
* the probability of a bomb in each square
*
 */
let bombProbability = 3;
let maxProbability = 15;

let difficulties = {
    easy: {
        rowCount: 9,
        colCount: 9,
        bombProbability: 3
    },
    medium: {
        rowCount: 12,
        colCount: 12,
        bombProbability: 5
    },
    expert: {
        rowCount: 16,
        colCount: 16,
        bombProbability: 8
    }
};

function minesweeperGameBootstrapper(rowCount, colCount, difficulty) {
    let chosenDifficulty = difficulties[difficulty] || difficulties['easy'];

    if (rowCount == null && colCount == null) {
        rowCount = chosenDifficulty.rowCount;
        colCount = chosenDifficulty.colCount;
        bombProbability = chosenDifficulty.bombProbability;
    } else {
        bombProbability = chosenDifficulty.bombProbability;
    }

    // Reset game state
    gameOver = false; 
    openedSquares = [];
    flaggedSquares = [];
    bombCount = 0;
    squaresLeft = 0;

    // Generate the new board
    generateBoard({'rowCount': rowCount, 'colCount': colCount});
}


function renderBoard() {
    let gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = ''; // Golește tabla veche

    for (let i = 0; i < board.length; i++) {
        let row = document.createElement('div');
        row.classList.add('row');
        for (let j = 0; j < board[i].length; j++) {
            let square = document.createElement('button');
            square.classList.add('square');
            square.dataset.row = i;
            square.dataset.col = j;

            square.onclick = function() {
                discoverSquare(i, j, square); // Transmite și elementul square pentru a fi actualizat
            };
            row.appendChild(square);
        }
        gameBoard.appendChild(row);
                
    }
}


function generateBoard(boardMetadata) {
    squaresLeft = boardMetadata.colCount * boardMetadata.rowCount;
    bombCount = 0;

    /*
    *
    * "generate" an empty matrix
    *
     */
    board = [];

    for (let i = 0; i < boardMetadata.colCount; i++) {
        board[i] = new Array(boardMetadata.rowCount);
    }

    /*
    *
    * TODO fill the matrix with "BoardSquare" objects, that are in a pre-initialized state
    *
    */
    for (let i = 0; i < boardMetadata.colCount; i++) {
        for (let j = 0; j < boardMetadata.rowCount; j++) {
            let hasBomb = Math.random() * maxProbability < bombProbability;
            if (hasBomb) bombCount++;
            board[i][j] = new BoardSquare(hasBomb, 0);
        }
    }


    /*
    *
    * "place" bombs according to the probabilities declared at the top of the file
    * those could be read from a config file or env variable, but for the
    * simplicity of the solution, I will not do that
    *
    */
    for (let i = 0; i < boardMetadata.colCount; i++) {
        for (let j = 0; j < boardMetadata.rowCount; j++) {
            // TODO place the bomb, you can use the following formula: Math.random() * maxProbability < bombProbability
            if (!board[i][j].hasBomb) {
                board[i][j].bombsAround = countBombsAround(i, j, boardMetadata);
            }
        }
    }

    renderBoard();
}

    /*
    *
    * TODO set the state of the board, with all the squares closed
    * and no flagged squares
    *
     */


    //BELOW THERE ARE SHOWCASED TWO WAYS OF COUNTING THE VICINITY BOMBS

    /*
    *
    * TODO count the bombs around each square
    *
    */

    /*
    *
    * print the board to the console to see the result
    *
    */

/*
*
* simple object to keep the data for each square
* of the board
*
*/
function countBombsAround(x, y, boardMetadata) {
    let bombsAround = 0;
    let directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],         [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    directions.forEach(direction => {
        let newX = x + direction[0];
        let newY = y + direction[1];
        if (newX >= 0 && newX < boardMetadata.colCount && newY >= 0 && newY < boardMetadata.rowCount) {
            if (board[newX][newY].hasBomb) {
                bombsAround++;
            }
        }
    });

    return bombsAround;
}

class BoardSquare {
    constructor(hasBomb, bombsAround) {
        this.hasBomb = hasBomb;
        this.bombsAround = bombsAround;
    }
}

class Pair {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}


/*
* call the function that "handles the game"
* called at the end of the file, because if called at the start,
* all the global variables will appear as undefined / out of scope
*
 */

// TODO create the other required functions such as 'discovering' a tile, and so on (also make sure to handle the win/loss cases)
function discoverSquare(x, y, squareElement) {
    if (gameOver) return;

    console.log(`Square clicked at Row=${x}, Col=${y}. Disabled status:`, squareElement.disabled);

    // If the square has already been opened, return
    if (openedSquares.some(pair => pair.x === x && pair.y === y)) {
        return;
    }

    openedSquares.push(new Pair(x, y)); // Mark as opened
    squareElement.style.backgroundColor = '#d3d3d3'; // Change background for opened square
    squareElement.disabled = true; // Disable the button after it's opened
    squaresLeft--; // Decrement squaresLeft ONLY for new opened squares

    // If the player opens a bomb, the game is over
    if (board[x][y].hasBomb) {
        squareElement.innerHTML = '💣'; // Show bomb
        gameOver = true;
        document.getElementById('gameMessage').innerHTML = "You hit a bomb! Game over.";
        return;
    }

    // Check if the game is won (no more squares left except bombs)
    if (squaresLeft === bombCount) {
        gameOver = true;
        document.getElementById('gameMessage').innerHTML = "You win!";
        return;
    }

    // Display number of bombs around the square, or nothing if it's 0
    if (board[x][y].bombsAround === 0) {
        squareElement.innerHTML = ''; // Empty square
        openAdjacentSquares(x, y); // Automatically reveal adjacent squares if this square is empty
    } else {
        squareElement.innerHTML = board[x][y].bombsAround; // Show number of bombs around
    }
}

function openAdjacentSquares(x, y) {
    let directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],         [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    directions.forEach(direction => {
        let newX = x + direction[0];
        let newY = y + direction[1];

        // Check if the new coordinates are valid (within board limits)
        if (newX >= 0 && newX < board.length && newY >= 0 && newY < board[0].length) {
            let squareElement = document.querySelector(`[data-row='${newX}'][data-col='${newY}']`);
            
            // Log for debugging adjacent opening
            console.log(`Opening adjacent square at Row=${newX}, Col=${newY}`);

            // If it's not a bomb and hasn't been opened, recursively discover the square
            if (!board[newX][newY].hasBomb && !openedSquares.some(pair => pair.x === newX && pair.y === newY)) {
                discoverSquare(newX, newY, squareElement); // Recursively open neighboring squares
            }
        }
    });
}

// Function to start a new game
function startGame() {
    let difficulty = document.getElementById('difficulty').value;
    bombProbability = parseInt(document.getElementById('bombProbability').value);
    maxProbability = parseInt(document.getElementById('maxProbability').value);

    // Reset game message
    document.getElementById('gameMessage').innerHTML = '';

    // Start a new game
    minesweeperGameBootstrapper(null, null, difficulty);
}
