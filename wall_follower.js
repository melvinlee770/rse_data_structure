// wall_follower.js - Wall Follower Algorithm for Maze Solving
// Implements both left-hand and right-hand rule algorithms

// Assumes maze.js is loaded (for Dir, DX, DY constants)

// ---------------------------
// Helper Functions
// ---------------------------

/**
 * Get the direction to the left of current direction
 * @param {number} dir - Current direction (Dir.N, Dir.S, Dir.E, Dir.W)
 * @returns {number} Direction to the left
 */
function turnLeft(dir) {
    const leftTurns = {
        [Dir.N]: Dir.W,
        [Dir.W]: Dir.S,
        [Dir.S]: Dir.E,
        [Dir.E]: Dir.N
    };
    return leftTurns[dir];
}

/**
 * Get the direction to the right of current direction
 * @param {number} dir - Current direction (Dir.N, Dir.S, Dir.E, Dir.W)
 * @returns {number} Direction to the right
 */
function turnRight(dir) {
    const rightTurns = {
        [Dir.N]: Dir.E,
        [Dir.E]: Dir.S,
        [Dir.S]: Dir.W,
        [Dir.W]: Dir.N
    };
    return rightTurns[dir];
}

/**
 * Get the opposite direction
 * @param {number} dir - Current direction
 * @returns {number} Opposite direction
 */
function turnAround(dir) {
    const opposite = {
        [Dir.N]: Dir.S,
        [Dir.S]: Dir.N,
        [Dir.E]: Dir.W,
        [Dir.W]: Dir.E
    };
    return opposite[dir];
}

/**
 * Check if we can move in a given direction from current position
 * @param {number[][]} grid - Maze grid
 * @param {number} x - Current x position
 * @param {number} y - Current y position
 * @param {number} dir - Direction to check
 * @returns {boolean} True if movement is possible
 */
function canMove(grid, x, y, dir) {
    return (grid[y][x] & dir) !== 0;
}

/**
 * Move in a given direction
 * @param {number} x - Current x position
 * @param {number} y - Current y position
 * @param {number} dir - Direction to move
 * @returns {number[]} New position [x, y]
 */
function move(x, y, dir) {
    return [x + DX[dir], y + DY[dir]];
}

// ---------------------------
// Wall Follower Algorithm (Left-Hand Rule)
// ---------------------------

/**
 * Solve maze using left-hand wall following algorithm
 * @param {number[][]} grid - Maze grid
 * @param {number[]} start - Start position [x, y]
 * @param {number[]} end - End position [x, y]
 * @returns {Object} { path, visitOrder }
 */
function wallFollowerLeft(grid, start, end) {
    const h = grid.length;
    const w = grid[0].length;
    
    const path = [[start[0], start[1]]];
    const visitOrder = [];
    let [x, y] = start;
    let stepCount = 0;
    
    // Initial direction - try to go right first, then down, left, up
    let currentDir = null;
    const initialDirs = [Dir.E, Dir.S, Dir.W, Dir.N];
    for (const dir of initialDirs) {
        if (canMove(grid, x, y, dir)) {
            currentDir = dir;
            break;
        }
    }
    
    if (currentDir === null) {
        // No valid moves from start
        return { path: [start], visitOrder: [[start[0], start[1], 0]] };
    }
    
    visitOrder.push([x, y, stepCount]);
    const visited = new Set([`${x},${y}`]);
    const maxSteps = w * h * 4; // Prevent infinite loops
    
    while (stepCount < maxSteps) {
        // Check if we reached the end
        if (x === end[0] && y === end[1]) {
            break;
        }
        
        // Left-hand rule: Try left, then straight, then right, then back
        const directionsToTry = [
            turnLeft(currentDir),    // Try left first
            currentDir,              // Then straight
            turnRight(currentDir),   // Then right
            turnAround(currentDir)   // Then back
        ];
        
        let moved = false;
        for (const dir of directionsToTry) {
            if (canMove(grid, x, y, dir)) {
                currentDir = dir;
                [x, y] = move(x, y, dir);
                stepCount++;
                
                path.push([x, y]);
                const key = `${x},${y}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    visitOrder.push([x, y, stepCount]);
                }
                
                moved = true;
                break;
            }
        }
        
        if (!moved) {
            // Stuck - shouldn't happen in a perfect maze
            console.warn('Wall follower got stuck at', x, y);
            break;
        }
    }
    
    if (stepCount >= maxSteps) {
        console.warn('Wall follower exceeded maximum steps');
    }
    
    return {
        path: path,
        visitOrder: visitOrder
    };
}

// ---------------------------
// Wall Follower Algorithm (Right-Hand Rule)
// ---------------------------

/**
 * Solve maze using right-hand wall following algorithm
 * @param {number[][]} grid - Maze grid
 * @param {number[]} start - Start position [x, y]
 * @param {number[]} end - End position [x, y]
 * @returns {Object} { path, visitOrder }
 */
function wallFollowerRight(grid, start, end) {
    const h = grid.length;
    const w = grid[0].length;
    
    const path = [[start[0], start[1]]];
    const visitOrder = [];
    let [x, y] = start;
    let stepCount = 0;
    
    // Initial direction - try to go right first, then down, left, up
    let currentDir = null;
    const initialDirs = [Dir.E, Dir.S, Dir.W, Dir.N];
    for (const dir of initialDirs) {
        if (canMove(grid, x, y, dir)) {
            currentDir = dir;
            break;
        }
    }
    
    if (currentDir === null) {
        // No valid moves from start
        return { path: [start], visitOrder: [[start[0], start[1], 0]] };
    }
    
    visitOrder.push([x, y, stepCount]);
    const visited = new Set([`${x},${y}`]);
    const maxSteps = w * h * 4; // Prevent infinite loops
    
    while (stepCount < maxSteps) {
        // Check if we reached the end
        if (x === end[0] && y === end[1]) {
            break;
        }
        
        // Right-hand rule: Try right, then straight, then left, then back
        const directionsToTry = [
            turnRight(currentDir),   // Try right first
            currentDir,              // Then straight
            turnLeft(currentDir),    // Then left
            turnAround(currentDir)   // Then back
        ];
        
        let moved = false;
        for (const dir of directionsToTry) {
            if (canMove(grid, x, y, dir)) {
                currentDir = dir;
                [x, y] = move(x, y, dir);
                stepCount++;
                
                path.push([x, y]);
                const key = `${x},${y}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    visitOrder.push([x, y, stepCount]);
                }
                
                moved = true;
                break;
            }
        }
        
        if (!moved) {
            // Stuck - shouldn't happen in a perfect maze
            console.warn('Wall follower got stuck at', x, y);
            break;
        }
    }
    
    if (stepCount >= maxSteps) {
        console.warn('Wall follower exceeded maximum steps');
    }
    
    return {
        path: path,
        visitOrder: visitOrder
    };
}

// ---------------------------
// Main Wall Follower Function
// ---------------------------

/**
 * Solve maze using wall follower algorithm (defaults to left-hand rule)
 * @param {number[][]} grid - Maze grid
 * @param {number[]} start - Start position [x, y]
 * @param {number[]} end - End position [x, y]
 * @param {string} hand - 'left' or 'right' (default: 'left')
 * @returns {Object} { path, visitOrder }
 */
function wallFollowerSolve(grid, start, end, hand = 'left') {
    if (hand === 'right') {
        return wallFollowerRight(grid, start, end);
    }
    return wallFollowerLeft(grid, start, end);
}

// ---------------------------
// Export for use in browser or Node.js
// ---------------------------
if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        wallFollowerSolve,
        wallFollowerLeft,
        wallFollowerRight,
        turnLeft,
        turnRight,
        turnAround
    };
}