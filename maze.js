// maze.js - JavaScript conversion of maze.py
// Perfect maze generator with multiple algorithms

// ---------------------------
// Direction system (robust)
// ---------------------------
const Dir = {
    N: 1,
    S: 2,
    W: 4,
    E: 8
};

const DX = {
    [Dir.E]: 1,
    [Dir.W]: -1,
    [Dir.N]: 0,
    [Dir.S]: 0
};

const DY = {
    [Dir.E]: 0,
    [Dir.W]: 0,
    [Dir.N]: -1,
    [Dir.S]: 1
};

const OPPOSITE = {
    [Dir.E]: Dir.W,
    [Dir.W]: Dir.E,
    [Dir.N]: Dir.S,
    [Dir.S]: Dir.N
};

// ---------------------------
// Seeded Random Number Generator
// ---------------------------
function createSeededRandom(seed) {
    let value = seed || Date.now();
    return function() {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
    };
}

// ---------------------------
// Helper Functions
// ---------------------------
function getNeighbors(x, y, width, height) {
    /**
     * Yield (nx, ny, direction) for in-bounds neighbors.
     * direction is a Dir member.
     */
    const neighbors = [];
    if (y > 0) neighbors.push([x, y - 1, Dir.N]);
    if (y < height - 1) neighbors.push([x, y + 1, Dir.S]);
    if (x > 0) neighbors.push([x - 1, y, Dir.W]);
    if (x < width - 1) neighbors.push([x + 1, y, Dir.E]);
    return neighbors;
}

// ---------------------------
// Maze Generation Algorithms
// ---------------------------

/**
 * DFS (Recursive Backtracker) - Iterative with stack
 * @param {number} width - Maze width in cells
 * @param {number} height - Maze height in cells
 * @param {number} seed - Random seed (optional)
 * @returns {number[][]} 2D grid where each cell contains direction flags
 */
function generateMazeDFS(width, height, seed = null) {
    if (width <= 0 || height <= 0) {
        throw new Error("Width and height must be positive integers.");
    }

    const random = createSeededRandom(seed);
    const grid = Array(height).fill(0).map(() => Array(width).fill(0));
    const visited = Array(height).fill(0).map(() => Array(width).fill(false));
    const stack = [];

    let x = Math.floor(random() * width);
    let y = Math.floor(random() * height);
    visited[y][x] = true;
    stack.push([x, y]);

    while (stack.length > 0) {
        [x, y] = stack[stack.length - 1];
        const options = getNeighbors(x, y, width, height)
            .filter(([nx, ny]) => !visited[ny][nx]);

        if (options.length > 0) {
            const [nx, ny, d] = options[Math.floor(random() * options.length)];
            grid[y][x] |= d;
            grid[ny][nx] |= OPPOSITE[d];
            visited[ny][nx] = true;
            stack.push([nx, ny]);
        } else {
            stack.pop();
        }
    }

    return grid;
}

/**
 * Prim's Algorithm - Randomized version
 * @param {number} width - Maze width in cells
 * @param {number} height - Maze height in cells
 * @param {number} seed - Random seed (optional)
 * @returns {number[][]} 2D grid where each cell contains direction flags
 */
function generateMazePrim(width, height, seed = null) {
    if (width <= 0 || height <= 0) {
        throw new Error("Width and height must be positive integers.");
    }

    const random = createSeededRandom(seed);
    const grid = Array(height).fill(0).map(() => Array(width).fill(0));
    const inMaze = Array(height).fill(0).map(() => Array(width).fill(false));

    const x = Math.floor(random() * width);
    const y = Math.floor(random() * height);
    inMaze[y][x] = true;

    const frontier = [];
    getNeighbors(x, y, width, height).forEach(([nx, ny, d]) => {
        frontier.push([x, y, nx, ny, d]);
    });

    while (frontier.length > 0) {
        const i = Math.floor(random() * frontier.length);
        const [x, y, nx, ny, d] = frontier.splice(i, 1)[0];

        if (!inMaze[ny][nx]) {
            inMaze[ny][nx] = true;
            grid[y][x] |= d;
            grid[ny][nx] |= OPPOSITE[d];

            getNeighbors(nx, ny, width, height).forEach(([fx, fy, fd]) => {
                if (!inMaze[fy][fx]) {
                    frontier.push([nx, ny, fx, fy, fd]);
                }
            });
        }
    }

    return grid;
}

/**
 * Wilson's Algorithm - Loop-erased random walk
 * @param {number} width - Maze width in cells
 * @param {number} height - Maze height in cells
 * @param {number} seed - Random seed (optional)
 * @returns {number[][]} 2D grid where each cell contains direction flags
 */
function generateMazeWilson(width, height, seed = null) {
    if (width <= 0 || height <= 0) {
        throw new Error("Width and height must be positive integers.");
    }

    const random = createSeededRandom(seed);
    const grid = Array(height).fill(0).map(() => Array(width).fill(0));
    const inMaze = Array(height).fill(0).map(() => Array(width).fill(false));

    const startX = Math.floor(random() * width);
    const startY = Math.floor(random() * height);
    inMaze[startY][startX] = true;

    function getRemainingCells() {
        const remaining = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (!inMaze[y][x]) {
                    remaining.push([x, y]);
                }
            }
        }
        return remaining;
    }

    while (true) {
        const remaining = getRemainingCells();
        if (remaining.length === 0) break;

        let [sx, sy] = remaining[Math.floor(random() * remaining.length)];
        const pathOrder = [[sx, sy]];
        const pathNext = {};
        const visitedInWalk = { [`${sx},${sy}`]: 0 };

        while (!inMaze[sy][sx]) {
            const neighbors = getNeighbors(sx, sy, width, height);
            const [nx, ny, d] = neighbors[Math.floor(random() * neighbors.length)];
            const key = `${nx},${ny}`;

            if (key in visitedInWalk) {
                // Loop detected - erase it
                const loopStartIdx = visitedInWalk[key];
                for (let i = loopStartIdx + 1; i < pathOrder.length; i++) {
                    delete visitedInWalk[`${pathOrder[i][0]},${pathOrder[i][1]}`];
                }
                pathOrder.splice(loopStartIdx + 1);
            } else {
                pathOrder.push([nx, ny]);
                visitedInWalk[key] = pathOrder.length - 1;
            }

            pathNext[`${sx},${sy}`] = [[nx, ny], d];
            [sx, sy] = [nx, ny];
        }

        // Add the path to the maze
        for (let i = 0; i < pathOrder.length - 1; i++) {
            const [x0, y0] = pathOrder[i];
            const [x1, y1] = pathOrder[i + 1];
            const [, d] = pathNext[`${x0},${y0}`];
            grid[y0][x0] |= d;
            grid[y1][x1] |= OPPOSITE[d];
            inMaze[y0][x0] = true;
            inMaze[y1][x1] = true;
        }
    }

    return grid;
}

// ---------------------------
// Rendering Functions
// ---------------------------

/**
 * Render maze as ASCII art
 * @param {number[][]} grid - Maze grid
 * @param {number[]} start - Start position [x, y]
 * @param {number[]} end - End position [x, y]
 * @returns {string} ASCII representation of the maze
 */
function renderASCII(grid, start = null, end = null) {
    const h = grid.length;
    const w = grid[0] ? grid[0].length : 0;
    const lines = [];

    // Top border
    lines.push(" " + "_".repeat(2 * w - 1));

    for (let y = 0; y < h; y++) {
        const line = ["|"];
        for (let x = 0; x < w; x++) {
            const cell = grid[y][x];
            let floor = (cell & Dir.S) ? " " : "_";
            const eastWall = (cell & Dir.E) ? " " : "|";

            // Check if cell below has north wall
            if (y + 1 < h && !(grid[y + 1][x] & Dir.N)) {
                floor = "_";
            }

            // Mark special cells
            let cellChar = floor;
            if (start && x === start[0] && y === start[1]) {
                cellChar = "S";
            } else if (end && x === end[0] && y === end[1]) {
                cellChar = "E";
            }

            line.push(cellChar + eastWall);
        }
        lines.push(line.join(""));
    }

    return lines.join("\n");
}

/**
 * Convert grid to JSON string
 * @param {number[][]} grid - Maze grid
 * @returns {string} JSON representation
 */
function gridToJSON(grid) {
    return JSON.stringify(grid);
}

/**
 * Load grid from JSON string
 * @param {string} jsonString - JSON representation of grid
 * @returns {number[][]} Maze grid
 */
function gridFromJSON(jsonString) {
    return JSON.parse(jsonString);
}

// ---------------------------
// Export for use in browser or Node.js
// ---------------------------
if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        Dir,
        DX,
        DY,
        OPPOSITE,
        generateMazeDFS,
        generateMazePrim,
        generateMazeWilson,
        renderASCII,
        gridToJSON,
        gridFromJSON,
        getNeighbors
    };
}

// For browser usage, functions are already in global scope