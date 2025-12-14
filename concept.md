# Task 1: Concept & Model Design

## 1. General Concept
For this exercise, we are building a **Stochastic Cellular Automaton** to simulate falling sand. The main goal is to model the physical differences between "round" particles (like desert sand) and "edgy" particles (like crushed stone) to see how they mix and stack.

The core idea is that while both types of sand obey gravity, they interact differently with their neighbors. "Round" sand flows almost like a liquid (high flowability), while "edgy" sand has high friction and builds steep piles.

## 2. Assumptions
To make this simulation work on a discrete grid, I am making a few simplifying assumptions:
1.  **The Grid:** The world is a simple 2D matrix where $(x,y)$ represents a position.
2.  **Exclusion:** Two sand grains cannot occupy the same pixel at the same time.
3.  **Gravity:** Gravity is constant and acts downwards (increasing $y$).
4.  **Material Properties:** Since I can't simulate actual particle geometry (every pixel is a square), I will simulate "roundness" and "edginess" using **probabilities**. Round sand will have a very high probability of slipping into gaps, while edgy sand will mostly get stuck.

## 3. Model Parameters
These are the variables I will use to control the simulation:

| Parameter | Symbol | Purpose |
| :--- | :--- | :--- |
| **Grid Size** | $N \times M$ | The height and width of the simulation box. |
| **Mixture Ratio** | $R_{mix}$ | Controls the composition of the source. E.g., $0.3$ means 30% Fine Sand and 70% Coarse Sand. |
| **Friction (Fine)** | $P_{fine}$ | The probability that Fine sand slides diagonally. I'll set this close to $1.0$ (very slippery). |
| **Friction (Coarse)** | $P_{coarse}$ | The probability that Coarse sand slides diagonally. I'll set this low ($\approx 0.05$) to mimic high friction. |

## 4. Grid States
Every cell in the grid will be assigned an integer to represent its material:
* **0:** Empty (Air)
* **1:** Fine Sand (Round/Yellow)
* **2:** Coarse Sand (Edgy/Brown)
* **3:** Wall/Ground (Static Obstacle)

## 5. Update Rules (The Logic)
For every frame of the simulation, we update the particles based on the following logic rules.

### Rule 1: Gravity (Free Fall)
*Applies to both types.*
I check the cell directly below the particle $(x, y+1)$. If it is **EMPTY**, the particle falls down one step. This is the primary movement.

### Rule 2: Diagonal Sliding (The Friction Check)
*Applies to both types if Rule 1 fails.*
If the path straight down is blocked, the particle tries to slide to the side (bottom-left or bottom-right).
* **The Difference:** This is where the physics happen. I use a random number generator to decide if the slide happens.
    * **Fine Sand:** Has a ~100% chance to take the diagonal slot if it's open.
    * **Coarse Sand:** Has a ~5% chance to take the slot. Most of the time, it just stays on top of the other particle, creating a steep stack.

### Rule 3: Lateral Flow (High Flowability)
*Applies ONLY to Fine Sand.*
To simulate the "too high flowability" of desert sand mentioned in the motivation, I am adding a special rule for Fine sand. If it is stuck (blocked down and diagonals), it can slip horizontally (left or right) into an empty space. This forces the fine sand to flatten out completely like a fluid, rather than building a pyramid.

## 6. Implementation Strategy
To make sure the code runs correctly:
* **Bottom-Up Update:** I will iterate through the grid from the bottom row up to the top. This prevents a sand grain from "teleporting" from top to bottom in a single frame. Alternatively it would be possible to copy the state over in a second two-dimensional array. This would gather more Space complexity but it would also allow simulations to have sand moving against gravity.
* **Randomized Columns:** I will process the columns in a random order (permutation) each frame. If I didn't do this, the sand would have a bias to always fall to the left (or right) first.
* **Measurement:** At the end of the simulation, I will scan the grid to find the highest and lowest points of the sand pile to calculate $\Delta h$ (the height difference).