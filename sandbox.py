import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import matplotlib.colors as mcolors

# --- 1. CONFIGURATION (EDIT HERE) ---
# Change this value manually to see the difference!
# 0.0 = All Coarse (Steep, tall pile)
# 1.0 = All Fine (Flat, water-like pile)
MIX_RATIO = 1.0  

# Simulation Settings
GRID_SIZE = 50
np.random.seed(42) # Fixed seed for reproducibility

# States
EMPTY = 0
FINE = 1
COARSE = 2
WALL = 3

# --- 2. INITIALIZATION ---
grid = np.zeros((GRID_SIZE, GRID_SIZE), dtype=int)

# Create Terrain (Random Floor)
terrain_heights = np.random.randint(1, 10, size=GRID_SIZE)
for x in range(GRID_SIZE):
    h = terrain_heights[x]
    grid[GRID_SIZE - h : GRID_SIZE, x] = WALL

# --- 3. THE PHYSICS ENGINE ---
def update_grid(frame_num, img_plot, current_grid, ax_ref):
    rows, cols = current_grid.shape
    
    # A. EMITTER (Source)
    mid = cols // 2
    if current_grid[0, mid] == EMPTY:
        # Create a mix based on the ratio
        if np.random.random() < MIX_RATIO:
            current_grid[0, mid] = FINE
        else:
            current_grid[0, mid] = COARSE

    # B. UPDATE LOOP (Bottom-Up)
    for y in range(rows - 2, -1, -1):
        # Randomize column order to prevent Left/Right bias
        for x in np.random.permutation(cols):
            state = current_grid[y, x]
            
            # Skip empty or static wall cells
            if state == EMPTY or state == WALL:
                continue
            
            # --- PHYSICS DECISION TREE ---
            
            # 1. TRY MOVE DOWN (Gravity)
            if current_grid[y+1, x] == EMPTY:
                current_grid[y+1, x] = state
                current_grid[y, x] = EMPTY
                continue # Move done, next particle
                
            # 2. TRY SLIDE DIAGONALLY (Avalanche)
            # Define friction: Fine moves easily (100%), Coarse sticks (5%)
            slide_prob = 1.0 if state == FINE else 0.05
            
            if np.random.random() < slide_prob:
                options = []
                # Check Down-Left
                if x > 0 and current_grid[y+1, x-1] == EMPTY:
                    options.append(-1)
                # Check Down-Right
                if x < cols - 1 and current_grid[y+1, x+1] == EMPTY:
                    options.append(1)
                
                if options:
                    dx = np.random.choice(options)
                    current_grid[y+1, x+dx] = state
                    current_grid[y, x] = EMPTY
                    continue # Move done
            
            # 3. TRY FLOW SIDEWAYS (Fluidity - FINE SAND ONLY)
            # This is the secret sauce for the "Flat" pile!
            if state == FINE:
                # If we couldn't go down or diagonal, try moving purely left/right
                side_options = []
                if x > 0 and current_grid[y, x-1] == EMPTY:
                    side_options.append(-1)
                if x < cols - 1 and current_grid[y, x+1] == EMPTY:
                    side_options.append(1)
                
                if side_options:
                    dx = np.random.choice(side_options)
                    current_grid[y, x+dx] = state
                    current_grid[y, x] = EMPTY

    # Update Plot
    img_plot.set_data(current_grid)
    
    # Calculate Delta H at frame 400
    if frame_num == 399:
        calculate_metrics(current_grid)
        
    return [img_plot]

def calculate_metrics(final_grid):
    rows, cols = final_grid.shape
    # Get all sand pixels (Type 1 or 2)
    sand = np.argwhere((final_grid == FINE) | (final_grid == COARSE))
    
    if len(sand) > 0:
        top_y = np.min(sand[:, 0])
        bottom_y = np.max(sand[:, 0])
        height_max = rows - top_y
        height_min = rows - bottom_y
        delta_h = height_max - height_min
        print(f"\n--- REPORT (Mix: {MIX_RATIO}) ---")
        print(f"Pile Top Height: {height_max}")
        print(f"Pile Bottom:     {height_min}")
        print(f"DELTA H:         {delta_h}")
        print("------------------------------\n")

# --- 4. RUN ---
fig, ax = plt.subplots()
type_name = "Fine" if MIX_RATIO > 0.5 else "Coarse"
ax.set_title(f"Ratio: {MIX_RATIO} ({type_name}-dominant)")

cmap = mcolors.ListedColormap(['white', '#FFD700', '#8B4513', '#404040'])
bounds = [0, 1, 2, 3, 4]
norm = mcolors.BoundaryNorm(bounds, cmap.N)

img_plot = ax.imshow(grid, interpolation='nearest', cmap=cmap, norm=norm)

ani = animation.FuncAnimation(fig, update_grid, fargs=(img_plot, grid, ax),
                              frames=450, interval=10, blit=True, repeat=False)

plt.show()