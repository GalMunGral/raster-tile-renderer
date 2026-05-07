# Raster Tile Renderer

**Live demo:** https://galmungral.github.io/raster-tile-renderer/

## Rhetorical Design

### Purpose

This project continues the argument of [Michelangelo](https://github.com/GalMunGral/michelangelo). Panning a map is scrolling in two dimensions: the world extends beyond the viewport, and moving the camera reveals it. What is invisible is not absent — pan back and it reappears exactly where it was.

Zooming adds a second illusion. A flat map with pan and zoom produces the subjective experience of moving a camera toward or away from a plane in 3D space. And as the zoom level changes, finer tiles replace coarser ones while features remain in exactly the same positions — the coastline, the road, the building do not shift. This cross-scale constancy is what makes the world feel like a single coherent thing rather than a sequence of unrelated images. It is maintained not by the projection but by the tiling scheme: at each zoom level the world is divided into $`2^Z \times 2^Z`$ tiles, and each tile subdivides into exactly four at the next level.

### Strategy

A raster tile renderer built from scratch on a 2D canvas. No mapping library. The implementation is kept minimal so the mechanism is legible: a focus point, a zoom level, and the arithmetic that converts them into tile coordinates and canvas positions.

## Technical Challenges

### Coordinate system

Let the world coordinate space be

```math
\mathcal{W} = \bigl(\mathbb{R}^2 \times \mathbb{R}_{>0}\bigr) \;/\; \sim
```

where $`(x, y, w) \sim (\lambda x, \lambda y, \lambda w)`$ for all $`\lambda \in \mathbb{R}_{>0}`$. This is the affine chart $`w > 0`$ of $`\mathbb{RP}^2`$, homeomorphic to $`\mathbb{R}^2`$. A point in $`\mathcal{W}`$ is represented by a triple $`(x, y, w)`$; choosing $`w = 2^z`$ selects the zoom level $`z`$.

The Mercator projection maps each point $`(\lambda, \phi)`$ on the earth's surface to a class in $`\mathcal{W}`$:

```math
M(\lambda, \phi) = \bigl[(x, y, 2^z)\bigr] \quad \text{where} \quad x = \tfrac{128}{\pi} 2^z (\lambda + \pi), \quad y = \tfrac{128}{\pi} 2^z \Bigl(\pi - \ln\tan\bigl(\tfrac{\pi}{4} + \tfrac{\phi}{2}\bigr)\Bigr)
```

The class is independent of the choice of $`z`$: scaling $`z`$ by $`2^{z'-z}`$ scales $`x`$ and $`y`$ by the same factor, leaving the equivalence class unchanged. Tiles partition $`\mathcal{W}`$ into regions: tile $`(X, Y, Z)`$ covers the set of classes whose representative at zoom $`Z`$ lies in $`[256X,\ 256(X+1)) \times [256Y,\ 256(Y+1))`$. The camera is likewise a point in $`\mathcal{W}`$.

### Camera movement

The camera is a point $`[(f_x, f_y, 2^z)] \in \mathcal{W}`$, whose representative at zoom $`z`$ places $`(f_x, f_y)`$ at the canvas center $`\mathbf{c} = (W/2, H/2)`$. The canvas position of any point $`\mathbf{p} \in \mathbb{R}^2`$ at the same representative is $`\mathbf{c} + \mathbf{p} - \mathbf{f}`$.

**Panning.** A screen-space drag $`\Delta`$ maps 1:1 to world-pixel displacement at the current representative: $`\mathbf{f}' = \mathbf{f} + \Delta`$.

**Zooming.** Changing zoom selects a new representative scaled by $`s = 2^{z'-z}`$. The world point under cursor $`\mathbf{e}`$ is $`\mathbf{p} = \mathbf{f} + (\mathbf{e} - \mathbf{c})`$; its representative at $`z'`$ is $`\mathbf{p}' = s\mathbf{p}`$. Requiring $`\mathbf{p}'`$ to remain under $`\mathbf{e}`$, i.e. $`\mathbf{c} + \mathbf{p}' - \mathbf{f}' = \mathbf{e}`$, gives:

```math
\mathbf{f}' = s\mathbf{f} + (s - 1)(\mathbf{e} - \mathbf{c})
```

### Tile placement

Tile $`(X, Y, Z)`$ has representative $`(256X,\ 256Y)`$ at zoom $`z`$ where $`s = 2^{z-Z}`$. Its canvas position follows from the camera formula:

```math
d_x = c_x + 256s \cdot X - f_x, \qquad d_y = c_y + 256s \cdot Y - f_y
```

### Tile selection

The tile containing the focus satisfies $`256sX \leq f_x < 256s(X+1)`$, giving $`X = \lfloor f_x / 256s \rfloor`$, with its left edge at canvas $`x = c_x - (f_x \bmod 256s)`$. The visible range extends until tiles cover the full canvas width, and analogously for $`Y`$.