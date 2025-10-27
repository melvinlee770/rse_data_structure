# solve_maze.py
import json
import heapq
from typing import List, Tuple, Optional, Dict
from maze import Dir, DX, DY, render_ascii


def solve_maze_dijkstra(grid: List[List[int]], start: Tuple[int, int], end: Tuple[int, int]) -> Optional[List[Tuple[int, int]]]:
    """
    Solve a maze using Dijkstra's algorithm.
    Returns the shortest path as a list of (x, y) tuples.
    """
    h, w = len(grid), len(grid[0])
    dist: Dict[Tuple[int, int], float] = {start: 0}
    prev: Dict[Tuple[int, int], Optional[Tuple[int, int]]] = {start: None}
    pq = [(0, start)]  # (distance, (x, y))

    while pq:
        current_dist, (x, y) = heapq.heappop(pq)
        if (x, y) == end:
            break

        if current_dist > dist[(x, y)]:
            continue

        for d in (Dir.N, Dir.S, Dir.E, Dir.W):
            if grid[y][x] & int(d):  # if passage exists in that direction
                nx, ny = x + DX[d], y + DY[d]
                if 0 <= nx < w and 0 <= ny < h:
                    new_dist = current_dist + 1
                    if (nx, ny) not in dist or new_dist < dist[(nx, ny)]:
                        dist[(nx, ny)] = new_dist
                        prev[(nx, ny)] = (x, y)
                        heapq.heappush(pq, (new_dist, (nx, ny)))

    # Reconstruct path
    if end not in prev:
        return None

    path = []
    cur = end
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    path.reverse()
    return path


def mark_path_in_maze(grid: List[List[int]], path: List[Tuple[int, int]]) -> str:
    """
    Render maze with path marked using '.' characters.
    Start and End remain labeled as S and E.
    """
    ascii_maze = render_ascii(grid, start=path[0], end=path[-1])
    lines = ascii_maze.splitlines()

    # Overlay path points
    for (x, y) in path[1:-1]:  # skip start & end
        if 1 + 2 * x < len(lines[y + 1]):
            line = list(lines[y + 1])
            pos = 1 + 2 * x
            if line[pos] in (" ", "_"):
                line[pos] = "."
            lines[y + 1] = "".join(line)

    return "\n".join(lines)


def main():
    # Load maze grid from JSON file
    try:
        with open("maze_grid.json", "r", encoding="utf-8") as f:
            grid = json.load(f)
        print("Maze grid loaded from maze_grid.json")
    except FileNotFoundError:
        print("maze_grid.json not found. Please run maze.py first to generate it.")
        return

    height = len(grid)
    width = len(grid[0]) if height > 0 else 0
    start = (0, 0)
    end = (width - 1, height - 1)

    # Solve maze
    path = solve_maze_dijkstra(grid, start, end)
    if not path:
        print("No path found.")
        return

    print(f"Path found! Length: {len(path)} steps")

    # Render maze with path
    solved_ascii = mark_path_in_maze(grid, path)
    print("\nSolved Maze:")
    print(solved_ascii)

    # Save solved maze to file
    with open("maze_solved.txt", "w", encoding="utf-8") as f:
        f.write(solved_ascii)
    print("\nSolved maze saved to maze_solved.txt")


if __name__ == "__main__":
    main()
