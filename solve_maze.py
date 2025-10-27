# solve_maze.py
import json
import heapq
import argparse
import matplotlib.pyplot as plt
import imageio
import os
import numpy as np
from typing import List, Tuple, Optional, Dict
from maze import Dir, DX, DY, render_ascii


def dijkstra_solve(grid: List[List[int]], start: Tuple[int, int], end: Tuple[int, int]):
    """Solve maze using Dijkstra (non-visual version)."""
    h, w = len(grid), len(grid[0])
    dist: Dict[Tuple[int, int], float] = {start: 0}
    prev: Dict[Tuple[int, int], Optional[Tuple[int, int]]] = {start: None}
    pq = [(0, start)]
    visited = set()

    while pq:
        current_dist, (x, y) = heapq.heappop(pq)
        if (x, y) == end:
            break
        if (x, y) in visited:
            continue
        visited.add((x, y))

        for d in (Dir.N, Dir.S, Dir.E, Dir.W):
            if grid[y][x] & int(d):
                nx, ny = x + DX[d], y + DY[d]
                if 0 <= nx < w and 0 <= ny < h:
                    new_dist = current_dist + 1
                    if (nx, ny) not in dist or new_dist < dist[(nx, ny)]:
                        dist[(nx, ny)] = new_dist
                        prev[(nx, ny)] = (x, y)
                        heapq.heappush(pq, (new_dist, (nx, ny)))

    # Reconstruct path
    path = []
    cur = end
    while cur is not None:
        path.append(cur)
        cur = prev.get(cur)
    path.reverse()
    return path


def dijkstra_wavefront_gif(
    grid: List[List[int]],
    start: Tuple[int, int],
    end: Tuple[int, int],
    gif_name="maze_wavefront.gif"
):
    """Solve a maze using Dijkstra’s algorithm and visualize the wavefront propagation."""
    h, w = len(grid), len(grid[0])
    dist: Dict[Tuple[int, int], float] = {start: 0}
    prev: Dict[Tuple[int, int], Optional[Tuple[int, int]]] = {start: None}
    pq = [(0, start)]
    visited = set()
    all_distances = np.full((h, w), np.inf)
    all_distances[start[1], start[0]] = 0

    frames = []
    frame_dir = "_frames"
    os.makedirs(frame_dir, exist_ok=True)
    step = 0

    def draw_frame(current=None, final_path=None):
        fig, ax = plt.subplots(figsize=(6, 6))
        ax.set_aspect('equal')
        ax.axis('off')
        ax.set_xlim(0, w)
        ax.set_ylim(0, h)
        ax.invert_yaxis()

        # Draw maze walls
        for y in range(h):
            for x in range(w):
                cell = grid[y][x]
                if not (cell & int(Dir.N)):
                    ax.plot([x, x + 1], [y, y], color="black", linewidth=1)
                if not (cell & int(Dir.W)):
                    ax.plot([x, x], [y, y + 1], color="black", linewidth=1)
                if y == h - 1 and not (cell & int(Dir.S)):
                    ax.plot([x, x + 1], [y + 1, y + 1], color="black", linewidth=1)
                if x == w - 1 and not (cell & int(Dir.E)):
                    ax.plot([x + 1, x + 1], [y, y + 1], color="black", linewidth=1)

        # Draw color gradient
        max_d = np.nanmax(np.where(np.isfinite(all_distances), all_distances, 0))
        for y in range(h):
            for x in range(w):
                if np.isfinite(all_distances[y, x]) and all_distances[y, x] < np.inf:
                    color_intensity = all_distances[y, x] / max(1, max_d)
                    ax.add_patch(
                        plt.Rectangle((x, y), 1, 1, color=(0.6, 0.8 - 0.5 * color_intensity, 1.0), alpha=0.6)
                    )

        # Current node
        if current:
            ax.add_patch(plt.Rectangle((current[0], current[1]), 1, 1, color="orange", alpha=0.9))

        # Final path
        if final_path:
            for (px, py) in final_path:
                ax.add_patch(plt.Rectangle((px, py), 1, 1, color="lime", alpha=0.8))

        # Mark start & end
        ax.text(start[0] + 0.5, start[1] + 0.5, "S", ha="center", va="center", color="green", fontsize=12, fontweight="bold")
        ax.text(end[0] + 0.5, end[1] + 0.5, "E", ha="center", va="center", color="red", fontsize=12, fontweight="bold")

        frame_path = os.path.join(frame_dir, f"frame_{step:04d}.png")
        plt.savefig(frame_path, dpi=100, bbox_inches="tight")
        plt.close(fig)
        return frame_path

    global_step = 0
    while pq:
        current_dist, (x, y) = heapq.heappop(pq)
        if (x, y) in visited:
            continue
        visited.add((x, y))
        all_distances[y, x] = current_dist
        global_step += 1
        step = global_step
        frames.append(imageio.imread(draw_frame(current=(x, y))))

        if (x, y) == end:
            break

        for d in (Dir.N, Dir.S, Dir.E, Dir.W):
            if grid[y][x] & int(d):
                nx, ny = x + DX[d], y + DY[d]
                if 0 <= nx < w and 0 <= ny < h:
                    new_dist = current_dist + 1
                    if new_dist < all_distances[ny, nx]:
                        all_distances[ny, nx] = new_dist
                        prev[(nx, ny)] = (x, y)
                        heapq.heappush(pq, (new_dist, (nx, ny)))

    # Reconstruct path
    path = []
    cur = end
    while cur is not None:
        path.append(cur)
        cur = prev.get(cur)
    path.reverse()

    # Draw final few frames
    for i in range(len(path)):
        step = global_step + i
        frames.append(imageio.imread(draw_frame(final_path=path[:i + 1])))

    imageio.mimsave(gif_name, frames, duration=0.08)
    print(f"Wavefront GIF saved as {gif_name}")

    for f in os.listdir(frame_dir):
        os.remove(os.path.join(frame_dir, f))
    os.rmdir(frame_dir)

    return path


def save_text_maze(grid, path, file_name="maze_solved.txt"):
    """Generate and save a solved maze in ASCII format."""
    lines = render_ascii(grid, start=path[0], end=path[-1]).splitlines()
    for (x, y) in path[1:-1]:
        line = list(lines[y + 1])
        pos = 1 + 2 * x
        if pos < len(line) and line[pos] in (" ", "_"):
            line[pos] = "."
        lines[y + 1] = "".join(line)
    solved_text = "\n".join(lines)
    with open(file_name, "w", encoding="utf-8") as f:
        f.write(solved_text)
    print(f"Solved maze saved as {file_name}")


def main():
    parser = argparse.ArgumentParser(description="Solve maze using Dijkstra’s algorithm.")
    parser.add_argument("--gif", action="store_true", help="Generate GIF visualization only.")
    parser.add_argument("--txt", action="store_true", help="Generate text solution only.")
    args = parser.parse_args()

    # Load maze
    try:
        with open("maze_grid.json", "r", encoding="utf-8") as f:
            grid = json.load(f)
        print("Maze grid loaded from maze_grid.json")
    except FileNotFoundError:
        print("maze_grid.json not found. Run maze.py first.")
        return

    height = len(grid)
    width = len(grid[0])
    start = (0, 0)
    end = (width - 1, height - 1)

    # Behavior depends on flags
    if args.gif and args.txt:
        print("Generating both GIF and TXT outputs...")
        path = dijkstra_wavefront_gif(grid, start, end)
        save_text_maze(grid, path)

    elif args.gif:
        print("Generating GIF output only...")
        path = dijkstra_wavefront_gif(grid, start, end)

    elif args.txt:
        print("Generating TXT output only...")
        path = dijkstra_solve(grid, start, end)
        save_text_maze(grid, path)

    else:
        print("No output type specified. Use --gif, --txt, or both.")


if __name__ == "__main__":
    main()
