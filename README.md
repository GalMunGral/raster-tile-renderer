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

At zoom $`z`$, the world maps to a $`256 \cdot 2^z \times 256 \cdot 2^z`$ pixel square, and tile $`(X, Y, Z)`$ occupies the $`256 \times 256`$ block at $`(256X, 256Y)`$ at integer zoom $`Z`$. Two coordinates $`(x, y, z)`$ and $`(x', y', z')`$ refer to the same geographic point iff

```math
x' = 2^{z' - z}\, x, \qquad y' = 2^{z' - z}\, y
```

Setting $`w = 2^z`$, this is the equivalence relation of homogeneous coordinates: $`(x, y, w) \sim (\lambda x, \lambda y, \lambda w)`$. Tile coordinates are projective coordinates — a tile address $`(X, Y, Z)`$ is the homogeneous point $`[256X : 256Y : 2^Z]`$.

### Camera movement

The camera is a focus point $`\mathbf{f} = (f_x, f_y)`$ at zoom $`z`$ — the world-pixel coordinate that maps to the canvas center $`\mathbf{c} = (W/2, H/2)`$. The canvas position of any world-pixel coordinate $`\mathbf{p}`$ is $`\mathbf{c} + \mathbf{p} - \mathbf{f}`$.

**Panning.** A screen-space drag $`\Delta`$ maps 1:1 to world-pixel displacement, so $`\mathbf{f}' = \mathbf{f} + \Delta`$.

**Zooming.** Let $`s = 2^{z' - z}`$. The world point currently under cursor $`\mathbf{e}`$ is $`\mathbf{p} = \mathbf{f} + (\mathbf{e} - \mathbf{c})`$. In homogeneous coordinates, its representative at zoom $`z'`$ is $`\mathbf{p}' = s\mathbf{p}`$. Requiring $`\mathbf{p}'`$ to remain under $`\mathbf{e}`$ — i.e. $`\mathbf{c} + \mathbf{p}' - \mathbf{f}' = \mathbf{e}`$ — gives:

```math
\mathbf{f}' = s\mathbf{f} + (s - 1)(\mathbf{e} - \mathbf{c})
```

### Tile placement

Tile $`(X, Y, Z)`$ has its corner at homogeneous point $`[256X : 256Y : 2^Z]`$. Dehomogenizing to zoom $`z`$ by multiplying by $`2^z / 2^Z = s`$ gives world-pixel coordinate $`(256Xs,\ 256Ys)`$. Its canvas position follows from the camera formula:

```math
d_x = c_x + 256s \cdot X - f_x, \qquad d_y = c_y + 256s \cdot Y - f_y
```

### Tile selection

The tile containing the focus satisfies $`256Xs \leq f_x < 256(X+1)s`$, so $`X = \lfloor f_x / 256s \rfloor`$, and its left edge lands at canvas $`x = c_x - (f_x \bmod 256s)`$. The visible range extends from there until tiles cover the full canvas width, and analogously for $`Y`$.