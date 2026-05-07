# Mercator

**Live demo:** https://galmungral.github.io/mercator/

## Rhetorical Design

### Purpose

This project continues the argument of [Michelangelo](https://github.com/GalMunGral/michelangelo). Panning a map is scrolling in two dimensions: the world extends beyond the viewport, and moving the camera reveals it. What is invisible is not absent — pan back and it reappears exactly where it was.

Zooming adds a second illusion. A flat map with pan and zoom produces the subjective experience of moving a camera toward or away from a plane in 3D space. And as the zoom level changes, finer tiles replace coarser ones while features remain in exactly the same positions — the coastline, the road, the building do not shift. This cross-scale constancy is what makes the world feel like a single coherent thing rather than a sequence of unrelated images. It is maintained not by the projection but by the tiling scheme: at each zoom level the world is divided into $`2^Z \times 2^Z`$ tiles, and each tile subdivides into exactly four at the next level.

### Strategy

A raster tile renderer built from scratch on a 2D canvas. No mapping library. The implementation is kept minimal so the mechanism is legible: a focus point, a zoom level, and the arithmetic that converts them into tile coordinates and canvas positions.

## Technical Challenges

### Coordinate system

At integer zoom $`Z`$, the world maps to a $`256 \cdot 2^Z \times 256 \cdot 2^Z`$ pixel square. Tile $`(X, Y, Z)`$ occupies the $`256 \times 256`$ block at $`(256X,\ 256Y)`$. At fractional zoom $`z`$, tiles are scaled by $`s = 2^{z-Z}`$, appearing as $`256s`$ pixels wide on screen.

### Camera movement

The camera is a focus point $`\mathbf{f}`$ — the world-pixel coordinate that maps to $`\mathbf{c} = (w/2, h/2)`$, the center of the canvas. Screen-space drag maps 1:1 to world-pixel displacement at the current zoom, so panning is trivial: $`\mathbf{f}' = \mathbf{f} + \Delta`$.

Zooming is more involved. When zoom changes by $`\Delta z`$, world-pixel coordinates scale by $`s = 2^{\Delta z}`$. To keep the point under the cursor $`\mathbf{e}`$ fixed on screen, the world point beneath it before the zoom — $`\mathbf{f} + (\mathbf{e} - \mathbf{c})`$ — must remain under $`\mathbf{e}`$ after. This requires:

```math
\mathbf{f}' = s\mathbf{f} + (s - 1)(\mathbf{e} - \mathbf{c})
```

### Tile placement

Tile $`(X, Y)`$ draws at canvas position:

```math
d_x = c_x + 256s \cdot X - f_x, \quad d_y = c_y + 256s \cdot Y - f_y
```

### Tile selection

The tile containing the focus is $`(\lfloor f_x / 256s \rfloor,\ \lfloor f_y / 256s \rfloor)`$. Its left edge lands at canvas $`x = c_x - (f_x \bmod 256s)`$. The visible range extends left and right from there until tiles cover the full canvas width, and analogously for $`Y`$.