// solve_maze.js - JavaScript conversion of solve_maze.py
// Maze solving algorithms with visualization support

// Assumes maze.js is loaded (for Dir, DX, DY constants)
// If using as standalone, uncomment the following:
/*
const Dir = { N: 1, S: 2, W: 4, E: 8 };
const DX = { [Dir.E]: 1, [Dir.W]: -1, [Dir.N]: 0, [Dir.S]: 0 };
const DY = { [Dir.E]: 0, [Dir.W]: 0, [Dir.N]: -1, [Dir.S]: 1 };
*/

// ---------------------------
// Dijkstra's Algorithm (Basic)
// ---------------------------

/**
 * Solve maze using Dijkstra's algorithm
 * @param {number[][]} grid - Maze grid
 * @param {number[]} start - Start position [x, y]
 * @param {number[]} end - End position [x, y]
 * @returns {Object} { path: [[x,y],...], distance: number }
 */
function dijkstraSolve(grid, start, end) {
    const h = grid.length;
    const w = grid[0].length;
    
    const dist = {};
    const prev = {};
    const pq = []; // Priority queue: [distance, [x, y]]
    const visited = new Set();
    
    const startKey = `${start[0]},${start[1]}`;
    dist[startKey] = 0;
    prev[startKey] = null;
    pq.push([0, start]);
    
    while (pq.length > 0) {
        // Sort to get minimum distance (simple priority queue)
        pq.sort((a, b) => a[0] - b[0]);
        const [currentDist, [x, y]] = pq.shift();
        const key = `${x},${y}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        // Found the end
        if (x === end[0] && y === end[1]) break;
        
        // Explore neighbors
        for (const d of [Dir.N, Dir.S, Dir.E, Dir.W]) {
            if (grid[y][x] & d) {
                const nx = x + DX[d];
                const ny = y + DY[d];
                
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    const nkey = `${nx},${ny}`;
                    const newDist = currentDist + 1;
                    
                    if (!(nkey in dist) || newDist < dist[nkey]) {
                        dist[nkey] = newDist;
                        prev[nkey] = [x, y];
                        pq.push([newDist, [nx, ny]]);
                    }
                }
            }
        }
    }
    
    // Reconstruct path
    const path = [];
    let cur = end;
    while (cur !== null) {
        path.unshift(cur);
        const key = `${cur[0]},${cur[1]}`;
        cur = prev[key] || null;
    }
    
    const endKey = `${end[0]},${end[1]}`;
    return {
        path: path,
        distance: dist[endKey] || Infinity
    };
}

// ---------------------------
// Dijkstra with Wavefront Tracking
// ---------------------------

/**
 * Solve maze using Dijkstra's algorithm with full exploration tracking
 * @param {number[][]} grid - Maze grid
 * @param {number[]} start - Start position [x, y]
 * @param {number[]} end - End position [x, y]
 * @returns {Object} { path, visitOrder, distances }
 */
function dijkstraWavefront(grid, start, end) {
    const h = grid.length;
    const w = grid[0].length;
    
    const dist = {};
    const prev = {};
    const pq = [];
    const visited = new Set();
    const visitOrder = []; // Track order of cell visits
    const distances = Array(h).fill(0).map(() => Array(w).fill(Infinity));
    
    const startKey = `${start[0]},${start[1]}`;
    dist[startKey] = 0;
    prev[startKey] = null;
    distances[start[1]][start[0]] = 0;
    pq.push([0, start]);
    
    while (pq.length > 0) {
        pq.sort((a, b) => a[0] - b[0]);
        const [currentDist, [x, y]] = pq.shift();
        const key = `${x},${y}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        visitOrder.push([x, y, currentDist]);
        
        if (x === end[0] && y === end[1]) break;
        
        for (const d of [Dir.N, Dir.S, Dir.E, Dir.W]) {
            if (grid[y][x] & d) {
                const nx = x + DX[d];
                const ny = y + DY[d];
                
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    const nkey = `${nx},${ny}`;
                    const newDist = currentDist + 1;
                    
                    if (newDist < distances[ny][nx]) {
                        distances[ny][nx] = newDist;
                        dist[nkey] = newDist;
                        prev[nkey] = [x, y];
                        pq.push([newDist, [nx, ny]]);
                    }
                }
            }
        }
    }
    
    // Reconstruct path
    const path = [];
    let cur = end;
    while (cur !== null) {
        path.unshift(cur);
        const key = `${cur[0]},${cur[1]}`;
        cur = prev[key] || null;
    }
    
    return {
        path: path,
        visitOrder: visitOrder,
        distances: distances
    };
}

// ---------------------------
// A* Algorithm
// ---------------------------

/**
 * Solve maze using A* algorithm with Manhattan distance heuristic
 * @param {number[][]} grid - Maze grid
 * @param {number[]} start - Start position [x, y]
 * @param {number[]} end - End position [x, y]
 * @returns {Object} { path, visitOrder }

function aStarSolve(grid, start, end) {
    const h = grid.length;
    const w = grid[0].length;
    
    // Manhattan distance heuristic
    const heuristic = (x, y) => Math.abs(x - end[0]) + Math.abs(y - end[1]);
    
    const gScore = {};
    const fScore = {};
    const prev = {};
    const pq = [];
    const visited = new Set();
    const visitOrder = [];
    
    const startKey = `${start[0]},${start[1]}`;
    gScore[startKey] = 0;
    fScore[startKey] = heuristic(start[0], start[1]);
    prev[startKey] = null;
    pq.push([fScore[startKey], start]);
    
    while (pq.length > 0) {
        pq.sort((a, b) => a[0] - b[0]);
        const [, [x, y]] = pq.shift();
        const key = `${x},${y}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        visitOrder.push([x, y, gScore[key]]);
        
        if (x === end[0] && y === end[1]) break;
        
        for (const d of [Dir.N, Dir.S, Dir.E, Dir.W]) {
            if (grid[y][x] & d) {
                const nx = x + DX[d];
                const ny = y + DY[d];
                
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    const nkey = `${nx},${ny}`;
                    const tentativeGScore = gScore[key] + 1;
                    
                    if (!(nkey in gScore) || tentativeGScore < gScore[nkey]) {
                        gScore[nkey] = tentativeGScore;
                        fScore[nkey] = tentativeGScore + heuristic(nx, ny);
                        prev[nkey] = [x, y];
                        pq.push([fScore[nkey], [nx, ny]]);
                    }
                }
            }
        }
    }
    
    // Reconstruct path
    const path = [];
    let cur = end;
    while (cur !== null) {
        path.unshift(cur);
        const key = `${cur[0]},${cur[1]}`;
        cur = prev[key] || null;
    }
    
    return {
        path: path,
        visitOrder: visitOrder
    };
}
*/

// ---------------------------
// BFS Algorithm
// ---------------------------
/**
 * Solve maze using Breadth-First Search
 * @param {number[][]} grid - Maze grid
 * @param {number[]} start - Start position [x, y]
 * @param {number[]} end - End position [x, y]
 * @returns {Object} { path, visitOrder }

function bfsSolve(grid, start, end) {
    const h = grid.length;
    const w = grid[0].length;
    
    const queue = [[start, 0]]; // [[position, distance], ...]
    const visited = new Set([`${start[0]},${start[1]}`]);
    const prev = {};
    const visitOrder = [];
    
    prev[`${start[0]},${start[1]}`] = null;
    
    while (queue.length > 0) {
        const [[x, y], dist] = queue.shift();
        visitOrder.push([x, y, dist]);
        
        if (x === end[0] && y === end[1]) break;
        
        for (const d of [Dir.N, Dir.S, Dir.E, Dir.W]) {
            if (grid[y][x] & d) {
                const nx = x + DX[d];
                const ny = y + DY[d];
                const nkey = `${nx},${ny}`;
                
                if (nx >= 0 && nx < w && ny >= 0 && ny < h && !visited.has(nkey)) {
                    visited.add(nkey);
                    prev[nkey] = [x, y];
                    queue.push([[nx, ny], dist + 1]);
                }
            }
        }
    }
    
    // Reconstruct path
    const path = [];
    let cur = end;
    while (cur !== null) {
        path.unshift(cur);
        const key = `${cur[0]},${cur[1]}`;
        cur = prev[key] || null;
    }
    
    return {
        path: path,
        visitOrder: visitOrder
    };
}
*/

// ---------------------------
// Render Solved Maze (ASCII)
// ---------------------------

/**
 * Render maze with solution path
 * @param {number[][]} grid - Maze grid
 * @param {number[][]} path - Solution path [[x,y],...]
 * @returns {string} ASCII representation with path marked
 */
function renderSolvedASCII(grid, path) {
    const h = grid.length;
    const w = grid[0] ? grid[0].length : 0;
    const lines = [];
    
    // Create path set for quick lookup
    const pathSet = new Set(path.slice(1, -1).map(([x, y]) => `${x},${y}`));
    const start = path[0];
    const end = path[path.length - 1];
    
    // Top border
    lines.push(" " + "_".repeat(2 * w - 1));
    
    for (let y = 0; y < h; y++) {
        const line = ["|"];
        for (let x = 0; x < w; x++) {
            const cell = grid[y][x];
            let floor = (cell & Dir.S) ? " " : "_";
            const eastWall = (cell & Dir.E) ? " " : "|";
            
            if (y + 1 < h && !(grid[y + 1][x] & Dir.N)) {
                floor = "_";
            }
            
            // Mark cells
            let cellChar = floor;
            if (start && x === start[0] && y === start[1]) {
                cellChar = "S";
            } else if (end && x === end[0] && y === end[1]) {
                cellChar = "E";
            } else if (pathSet.has(`${x},${y}`)) {
                cellChar = ".";
            }
            
            line.push(cellChar + eastWall);
        }
        lines.push(line.join(""));
    }
    
    return lines.join("\n");
}

// ---------------------------
// Statistics
// ---------------------------

/**
 * Calculate solving statistics
 * @param {Object} result - Result from solving function
 * @returns {Object} Statistics
 */
function calculateStats(result) {
    const { path, visitOrder } = result;
    return {
        pathLength: path.length,
        cellsExplored: visitOrder.length,
        efficiency: ((path.length / visitOrder.length) * 100).toFixed(2) + "%"
    };
}

// ---------------------------
// Export for use in browser or Node.js
// ---------------------------
if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        dijkstraSolve,
        dijkstraWavefront,
        //aStarSolve,
        //bfsSolve,
        renderSolvedASCII,
        calculateStats
    };
}