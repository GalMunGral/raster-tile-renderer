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

where $`(x, y, w) \sim (\lambda x, \lambda y, \lambda w)`$ for all $`\lambda \in \mathbb{R}_{>0}`$. This is the affine chart $`w > 0`$ of $`\mathbb{RP}^2`$, homeomorphic to $`\mathbb{R}^2`$. A point in $`\mathcal{T}`$ is represented by a triple $`(x, y, w)`$; choosing $`w = 2^z`$ selects the zoom level $`z`$.

The Mercator projection maps each point $`(\lambda, \phi)`$ on the earth's surface into $`\mathcal{T}`$:

```math
M(\lambda, \phi) = \Bigl[\Bigl(\tfrac{128}{\pi}(\lambda + \pi),\; \tfrac{128}{\pi}\bigl(\pi - \ln\tan(\tfrac{\pi}{4} + \tfrac{\phi}{2})\bigr),\; 1\Bigr)\Bigr]
```

The representative at zoom $`z`$ is the canonical one scaled by $`2^z`$. Tiles partition $`\mathcal{T}`$ into regions: tile $`(X, Y, Z)`$ covers

```math
\{[(x, y, 2^Z)] : x \in [256X,\ 256(X+1)),\ y \in [256Y,\ 256(Y+1))\}
```

The camera is likewise a point in $`\mathcal{T}`$.

### Camera movement

For $`\mathbf{p} \in \mathcal{T}`$, write $`\mathbf{p}|_z \in \mathbb{R}^2`$ for its representative at zoom $`z`$ — the first two coordinates of the triple $`(x, y, 2^z)`$ in the equivalence class. Let $`\mathbf{c} = (W/2, H/2)`$ be the canvas center. The camera $`\mathbf{f} \in \mathcal{T}`$ is the point in $`\mathcal{T}`$ corresponding to $`\mathbf{c}`$. At a fixed zoom $`z`$, world-pixel space and screen space share the same scale, so the screen displacement from center equals the difference of $`|_z`$ coordinates. This defines the screen-to-$`\mathcal{T}`$ map $`\varphi_{\mathbf{f},z} : \mathbb{R}^2 \to \mathcal{T}`$:

```math
\varphi_{\mathbf{f},z}(\mathbf{d}) = \bigl[(\mathbf{d} - \mathbf{c} + \mathbf{f}|_z,\ 2^z)\bigr]
```

Its inverse $`\psi_{\mathbf{f},z}(\mathbf{p}) = \mathbf{c} + \mathbf{p}|_z - \mathbf{f}|_z`$ gives the screen position of a world point.

**Panning.** A drag $`\Delta`$ maps 1:1 to world-pixel displacement: $`\mathbf{f}'|_z = \mathbf{f}|_z + \Delta`$.

**Zooming.** Let $`s = 2^{z'-z}`$. The world point under the cursor must be invariant:

```math
\varphi_{\mathbf{f},z}(\mathbf{e}) = \varphi_{\mathbf{f}',z'}(\mathbf{e})
```

Expanding and solving for $`\mathbf{f}|_{z'}`$:

```math
\mathbf{f}|_{z'} = s\,\mathbf{f}|_z + (s - 1)(\mathbf{e} - \mathbf{c})
```

### Tile placement

Tile $`(X, Y, Z)`$ is the class $`[(256X, 256Y, 2^Z)] \in \mathcal{T}`$. Its canvas position, with $`s = 2^{z-Z}`$:

```math
\mathbf{d} = \mathbf{c} + (256sX,\ 256sY) - \mathbf{f}|_z
```

### Tile selection

The tile containing $`\mathbf{f}`$ satisfies $`256sX \leq f_x < 256s(X+1)`$, giving $`X = \lfloor f_x / 256s \rfloor`$ where $`(f_x, f_y) = \mathbf{f}|_z`$. Its left edge is at $`\psi_{\mathbf{f},z}(\mathbf{t})_x = c_x - (f_x \bmod 256s)`$. The visible range extends until tiles cover the full canvas width, and analogously for $`Y`$.