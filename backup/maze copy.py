import random
import argparse
from typing import List, Tuple, Optional
from enum import IntFlag

# ---------------------------
# Direction system (robust)
# ---------------------------
class Dir(IntFlag):
    N = 1
    S = 2
    W = 4
    E = 8

DX = {Dir.E: 1, Dir.W: -1, Dir.N: 0, Dir.S: 0}
DY = {Dir.E: 0, Dir.W: 0, Dir.N: -1, Dir.S: 1}
OPPOSITE = {Dir.E: Dir.W, Dir.W: Dir.E, Dir.N: Dir.S, Dir.S: Dir.N}

def _neighbors(x: int, y: int, w: int, h: int):
    """Yield (nx, ny, direction) for in-bounds neighbors. direction is a Dir member."""
    if y > 0:         yield (x, y - 1, Dir.N)
    if y < h - 1:     yield (x, y + 1, Dir.S)
    if x > 0:         yield (x - 1, y, Dir.W)
    if x < w - 1:     yield (x + 1, y, Dir.E)

# ---------------------------
# Generators
# ---------------------------
def generate_maze_dfs(width: int, height: int, seed: Optional[int] = None) -> List[List[int]]: # "seed" for random reproducibility
    """
    Recursive Backtracker (iterative stack). Returns grid[h][w] of bitmasks (Dir flags).
    Wikipedia: https://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_backtracker
    """
    if width <= 0 or height <= 0:
        raise ValueError("Width and height must be positive integers.")
    if seed is not None: 
        random.seed(seed)

    grid = [[0 for _ in range(width)] for _ in range(height)]
    visited = [[False]*width for _ in range(height)]
    stack: List[Tuple[int,int]] = []

    x = random.randrange(width)
    y = random.randrange(height)
    visited[y][x] = True
    stack.append((x, y))

    while stack:
        x, y = stack[-1]
        options = [(nx, ny, d) for (nx, ny, d) in _neighbors(x, y, width, height) if not visited[ny][nx]]
        if options:
            nx, ny, d = random.choice(options)
            if d not in OPPOSITE:  # extra guardrail
                raise RuntimeError(f"Internal error: direction {d} not recognized.")
            # carve both directions
            grid[y][x]    |= int(d)
            grid[ny][nx]  |= int(OPPOSITE[d])
            visited[ny][nx] = True
            stack.append((nx, ny))
        else:
            stack.pop()

    return grid

def generate_maze_prim(width: int, height: int, seed: Optional[int] = None) -> List[List[int]]:
    """
    Randomized Prim's algorithm.
    Wikipedia: https://en.wikipedia.org/wiki/Maze_generation_algorithm#Randomized_Prim's_algorithm
    """
    if width <= 0 or height <= 0:
        raise ValueError("Width and height must be positive integers.")
    if seed is not None:
        random.seed(seed)

    grid = [[0 for _ in range(width)] for _ in range(height)]
    in_maze = [[False]*width for _ in range(height)]

    x = random.randrange(width)
    y = random.randrange(height)
    in_maze[y][x] = True

    # frontier edges: (x, y, nx, ny, d)
    frontier: List[Tuple[int,int,int,int,Dir]] = []
    for nx, ny, d in _neighbors(x, y, width, height):
        frontier.append((x, y, nx, ny, d))

    while frontier:
        i = random.randrange(len(frontier))
        x, y, nx, ny, d = frontier.pop(i)
        if not in_maze[ny][nx]:
            if d not in OPPOSITE:
                raise RuntimeError(f"Internal error: direction {d} not recognized.")
            in_maze[ny][nx] = True
            grid[y][x]   |= int(d)
            grid[ny][nx] |= int(OPPOSITE[d])
            for fx, fy, fd in _neighbors(nx, ny, width, height):
                if not in_maze[fy][fx]:
                    frontier.append((nx, ny, fx, fy, fd))

    return grid

def generate_maze_wilson(width: int, height: int, seed: Optional[int] = None) -> List[List[int]]:
    """
    Wilson's algorithm (uniform spanning tree via loop-erased random walks).
    Produces a perfect maze using the same Dir-bitmask encoding as DFS/Prim.
    """
    if width <= 0 or height <= 0:
        raise ValueError("Width and height must be positive integers.")
    if seed is not None:
        random.seed(seed)

    grid: List[List[int]] = [[0 for _ in range(width)] for _ in range(height)]
    in_maze = [[False for _ in range(width)] for _ in range(height)]

    # Seed the maze with a single random cell
    start_x = random.randrange(width)
    start_y = random.randrange(height)
    in_maze[start_y][start_x] = True

    def remaining_cells():
        for yy in range(height):
            for xx in range(width):
                if not in_maze[yy][xx]:
                    yield (xx, yy)

    while True:
        pool = list(remaining_cells())
        if not pool:
            break
        sx, sy = random.choice(pool)

        path_order: List[Tuple[int, int]] = []
        # For Python 3.8 support:
        from typing import Dict
        path_next: Dict[Tuple[int, int], Tuple[Tuple[int, int], Dir]] = {}

        cx, cy = sx, sy
        path_order.append((cx, cy))
        visited_in_walk = {(cx, cy): 0}

        while not in_maze[cy][cx]:
            nx, ny, d = random.choice(list(_neighbors(cx, cy, width, height)))

            # Loop erasure
            if (nx, ny) in visited_in_walk:
                loop_start_idx = visited_in_walk[(nx, ny)]
                for px, py in path_order[loop_start_idx + 1:]:
                    visited_in_walk.pop((px, py), None)
                path_order = path_order[: loop_start_idx + 1]
            else:
                path_order.append((nx, ny))
                visited_in_walk[(nx, ny)] = len(path_order) - 1

            path_next[(cx, cy)] = ((nx, ny), d)
            cx, cy = nx, ny

        # Carve the loop-erased path
        for i in range(len(path_order) - 1):
            x0, y0 = path_order[i]
            x1, y1 = path_order[i + 1]
            _, d = path_next[(x0, y0)]
            grid[y0][x0] |= int(d)
            grid[y1][x1] |= int(OPPOSITE[d])
            in_maze[y0][x0] = True
            in_maze[y1][x1] = True

    return grid


# ---------------------------
# Rendering
# ---------------------------
def render_ascii(
    grid: List[List[int]],
    start: Optional[Tuple[int, int]] = None,
    end: Optional[Tuple[int, int]] = None,
) -> str:
    """
    ASCII render with optional colored start/end cells.
    Start shown in green, End in red.
    """
    # ANSI color codes
    COLOR_GREEN = "\033[92m"
    COLOR_RED = "\033[91m"
    COLOR_RESET = "\033[0m"

    h = len(grid)
    w = len(grid[0]) if h else 0
    out = []
    out.append(" " + "_" * (2*w - 1))
    for y in range(h):
        line = ["|"]
        for x in range(w):
            cell = grid[y][x]
            # south opening?
            floor = " " if (cell & int(Dir.S)) else "_"
            # east opening?
            east_wall = " " if (cell & int(Dir.E)) else "|"
            # reinforce bottom if below cell isn't open north
            if (y+1 < h) and not (grid[y+1][x] & int(Dir.N)):
                floor = "_"

            # highlight start or end
            cell_char = floor
            if start == (x, y):
                cell_char = "S" # COLOR_GREEN + "S" + COLOR_RESET
            elif end == (x, y):
                cell_char = "E" # COLOR_RED + "E" + COLOR_RESET

            line.append(cell_char + east_wall)
        out.append("".join(line))
    return "\n".join(out)


def render_matplotlib(grid: List[List[int]], show: bool = True, save_png: Optional[str] = None):
    """
    Draws the maze with matplotlib (no styles or colors specified).
    """
    try:
        import matplotlib.pyplot as plt
    except Exception as e:
        raise RuntimeError("matplotlib is required for plotting. Install with: pip install matplotlib") from e

    h = len(grid)
    w = len(grid[0]) if h else 0
    fig, ax = plt.subplots()
    ax.set_aspect('equal')

    # outer border
    ax.plot([0, w], [0, 0])
    ax.plot([0, w], [h, h])
    ax.plot([0, 0], [0, h])
    ax.plot([w, w], [0, h])

    # internal walls
    for y in range(h):
        for x in range(w):
            cell = grid[y][x]
            if not (cell & int(Dir.N)):
                ax.plot([x, x+1], [y, y])
            if not (cell & int(Dir.W)):
                ax.plot([x, x], [y, y+1])
            if y == h-1 and not (cell & int(Dir.S)):
                ax.plot([x, x+1], [y+1, y+1])
            if x == w-1 and not (cell & int(Dir.E)):
                ax.plot([x+1, x+1], [y, y+1])

    ax.invert_yaxis()
    ax.axis('off')

    if save_png:
        plt.savefig(save_png, dpi=200, bbox_inches="tight")
    if show:
        plt.show()
    plt.close(fig)

# ---------------------------
# Utilities
# ---------------------------
def to_edges(grid: List[List[int]]) -> List[Tuple[Tuple[int,int], Tuple[int,int]]]:
    """
    Return list of carved edges ((x,y),(nx,ny)).
    """
    h = len(grid)
    w = len(grid[0]) if h else 0
    edges = []
    for y in range(h):
        for x in range(w):
            cell = grid[y][x]
            for d in (Dir.N, Dir.E, Dir.S, Dir.W):
                if cell & int(d):
                    nx, ny = x + DX[d], y + DY[d]
                    if 0 <= nx < w and 0 <= ny < h and (x, y) < (nx, ny):
                        edges.append(((x, y), (nx, ny)))
    return edges

# ---------------------------
# CLI
# ---------------------------
def main():
    parser = argparse.ArgumentParser(description="Perfect maze generator (DFS / Prim / Wilson), ASCII + optional plot.")
    parser.add_argument("--algo", choices=["dfs", "prim", "wilson"], default="dfs", help="Algorithm to use")
    parser.add_argument("--width", type=int, default=20, help="Maze width (cells)")
    parser.add_argument("--height", type=int, default=12, help="Maze height (cells)")
    parser.add_argument("--seed", type=int, default=None, help="Random seed (optional)") 
    parser.add_argument("--ascii", action="store_true", help="Print ASCII maze to stdout")
    parser.add_argument("--plot", action="store_true", help="Show matplotlib plot")
    parser.add_argument("--save-text", type=str, default=None, help="File path to save ASCII maze output (e.g., maze.txt)")
    parser.add_argument("--save-png", type=str, default=None, help="File path to save PNG (e.g., maze.png)")

    args = parser.parse_args()

    if args.algo == "dfs": 
        grid = generate_maze_dfs(args.width, args.height, seed=args.seed)
    elif args.algo == "prim":
        grid = generate_maze_prim(args.width, args.height, seed=args.seed)
    elif args.algo == "wilson":                            # ← new branch
        grid = generate_maze_wilson(args.width, args.height, seed=args.seed)
    else:
        raise ValueError(f"Unknown algo: {args.algo}")

    start = (0, 0)
    end = (args.width -1, args.height - 1)

    if args.ascii:
        ascii_maze = render_ascii(grid, start=start, end=end)
        print(ascii_maze)
        if args.save_text:
            with open(args.save_text, "w", encoding="utf-8") as f:
                f.write(ascii_maze)
            print(f"Maze saved to {args.save_text}")

    if args.plot or args.save_png:
        render_matplotlib(grid, show=args.plot, save_png=args.save_png)

if __name__ == "__main__":
    main()


# Command to run the code
#1. python maze.py --ascii
#ex: python maze.py --algo {DFS/Prim/Wilson} --ascii
#2. python maze.py --algo prim --width 30 --height 20 --seed 42 --ascii (change the parameter)
#3. python maze.py --plot --save-png maze.png  (save the maze picture)