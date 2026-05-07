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

Let the tile coordinate space be

```math
\mathcal{T} = \bigl(\mathbb{R}^2 \times \mathbb{R}_{>0}\bigr) \;/\; \sim
```

where $`(x, y, w) \sim (\lambda x, \lambda y, \lambda w)`$ for all $`\lambda \in \mathbb{R}_{>0}`$. This is the affine chart $`w > 0`$ of $`\mathbb{RP}^2`$, homeomorphic to $`\mathbb{R}^2`$. A point in $`\mathcal{T}`$ is represented by a triple $`(x, y, w)`$; choosing $`w = 2^z`$ selects the zoom level $`z`$. For $`\mathbf{p} \in \mathcal{T}`$, write $`\mathbf{p}|_z \in \mathbb{R}^2`$ for the first two coordinates of its representative at zoom $`z`$.

The Mercator projection maps each point $`(\lambda, \phi)`$ on the earth's surface into $`\mathcal{T}`$:

```math
M(\lambda, \phi) = \Bigl[\Bigl(\tfrac{128}{\pi}(\lambda + \pi),\; \tfrac{128}{\pi}\bigl(\pi - \ln\tan(\tfrac{\pi}{4} + \tfrac{\phi}{2})\bigr),\; 1\Bigr)\Bigr]
```

Let $`N`$ be the tile size in pixels. Tiles partition $`\mathcal{T}`$ into regions: tile $`(X, Y, Z)`$ covers

```math
\{[(x, y, 2^Z)] \mid NX \leq x < N(X+1),\ NY \leq y < N(Y+1)\}
```

### Camera movement

Let $`\mathbf{c} = (W/2, H/2)`$ be the canvas center and $`\mathbf{f} \in \mathcal{T}`$ the point currently centered on screen. Define the screen-to-$`\mathcal{T}`$ map $`\varphi_{\mathbf{f},z} : \mathbb{R}^2 \to \mathcal{T}`$:

```math
\varphi_{\mathbf{f},z}(\mathbf{d}) = \bigl[(\mathbf{d} - \mathbf{c} + \mathbf{f}|_z,\ 2^z)\bigr]
```

Its inverse $`\psi_{\mathbf{f},z}(\mathbf{p}) = \mathbf{c} + \mathbf{p}|_z - \mathbf{f}|_z`$ gives the screen position of a point in $`\mathcal{T}`$.

**Panning.** A drag $`\Delta`$ maps 1:1 to displacement in $`|_z`$ coordinates: $`\mathbf{f}'|_z = \mathbf{f}|_z + \Delta`$.

**Zooming.** Let $`s = 2^{z'-z}`$. The point in $`\mathcal{T}`$ under the cursor must be invariant:

```math
\varphi_{\mathbf{f},z}(\mathbf{e}) = \varphi_{\mathbf{f}',z'}(\mathbf{e})
```

Expanding and solving for $`\mathbf{f}|_{z'}`$:

```math
\mathbf{f}|_{z'} = s\,\mathbf{f}|_z + (s - 1)(\mathbf{e} - \mathbf{c})
```

### Tile placement

The top-left corner of tile $`(X, Y, Z)`$ is the class $`[(NX, NY, 2^Z)] \in \mathcal{T}`$. Its canvas position $`\mathbf{d}`$ satisfies $`\varphi_{\mathbf{f},z}(\mathbf{d}) = [(NX, NY, 2^Z)]`$. Taking $`|_z`$ of both sides:

```math
\mathbf{d} - \mathbf{c} + \mathbf{f}|_z = (N \cdot 2^{z-Z} X,\ N \cdot 2^{z-Z} Y) \implies \mathbf{d} = \mathbf{c} + (N \cdot 2^{z-Z} X,\ N \cdot 2^{z-Z} Y) - \mathbf{f}|_z
```

### Tile selection

Let $`(x, y, 2^z)`$ be the representative of $`\mathbf{f}`$ at zoom $`z`$. The tile containing $`\mathbf{f}`$ satisfies $`N \cdot 2^{z-Z} X \leq x < N \cdot 2^{z-Z}(X+1)`$, giving $`X = \lfloor x / (N \cdot 2^{z-Z}) \rfloor`$. Its left edge is at canvas $`c_x - (x \bmod N \cdot 2^{z-Z})`$. From the placement formula, tile $`(X + \Delta X, Y + \Delta Y, Z)`$ is offset by $`(N \cdot 2^{z-Z} \cdot \Delta X,\ N \cdot 2^{z-Z} \cdot \Delta Y)`$ from tile $`(X, Y, Z)`$ on screen. The visible range is all $`(\Delta X, \Delta Y)`$ for which that offset still intersects the canvas.