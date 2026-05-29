/**
 * lib/spatial/iso.tsx — ORACLE Spatial Layer 0 (Isometric helpers)
 * ------------------------------------------------------------------
 * Extracted verbatim (behavior-preserving) from Campus3DIsometric.jsx so
 * the 2D plan, the iso SVG, and the future Three.js renderer all share ONE
 * projection. No renderer may define its own iso() / IsoBox again.
 *
 * Projection: standard 2:1 isometric.
 *   x-axis → right-down,  y-axis → left-down,  z-axis → up.
 */
import React from 'react';
import { ISO_ORIGIN } from './grid';

export const ISO_SCALE = 1;

/** Raw isometric projection: (x, y, z) grid → screen offset (no origin). */
export function iso(x: number, y: number, z = 0): { x: number; y: number } {
  const sx = (x - y) * 0.866 * ISO_SCALE;
  const sy = ((x + y) * 0.5 - z) * ISO_SCALE;
  return { x: sx, y: sy };
}

/**
 * Project a grid point (in unit-coords already multiplied by a scale) to
 * absolute SVG coords using the shared scene origin.
 */
export function isoProject(
  gx: number,
  gy: number,
  gz = 0,
  origin = ISO_ORIGIN,
): { x: number; y: number } {
  const p = iso(gx, gy, gz);
  return { x: p.x + origin.x, y: p.y + origin.y };
}

/** Build an SVG path string from a list of projected points (closed). */
export function isoPath(points: Array<{ x: number; y: number }>): string {
  return (
    points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ') + ' Z'
  );
}

export interface IsoBoxProps {
  gx: number;
  gy: number;
  gz?: number;
  w: number;
  d: number;
  h: number;
  roofColor: string;
  wallColorLeft: string;
  wallColorRight: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  children?: React.ReactNode;
}

/**
 * Isometric box primitive. Draws the 4 visible faces (left wall, front wall,
 * right wall, roof). Coordinates are raw iso-space (caller pre-scales/offsets
 * via the parent <g transform> or by feeding scaled gx/gy/gz).
 *
 * Behavior preserved from the original private IsoBox in Campus3DIsometric.
 */
export function IsoBox({
  gx,
  gy,
  gz = 0,
  w,
  d,
  h,
  roofColor,
  wallColorLeft,
  wallColorRight,
  stroke = 'var(--color-gray-700)',
  strokeWidth = 0.8,
  opacity = 1,
  children,
}: IsoBoxProps) {
  const corners = {
    blf: iso(gx, gy, gz),
    brf: iso(gx + w, gy, gz),
    brd: iso(gx + w, gy + d, gz),
    bld: iso(gx, gy + d, gz),
    tlf: iso(gx, gy, gz + h),
    trf: iso(gx + w, gy, gz + h),
    trd: iso(gx + w, gy + d, gz + h),
    tld: iso(gx, gy + d, gz + h),
  };

  return (
    <g opacity={opacity}>
      {/* Left wall */}
      <path
        d={isoPath([corners.bld, corners.blf, corners.tlf, corners.tld])}
        fill={wallColorLeft}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Right wall */}
      <path
        d={isoPath([corners.brf, corners.brd, corners.trd, corners.trf])}
        fill={wallColorRight}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Front face */}
      <path
        d={isoPath([corners.blf, corners.brf, corners.trf, corners.tlf])}
        fill={wallColorLeft}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {/* Roof */}
      <path
        d={isoPath([corners.tlf, corners.trf, corners.trd, corners.tld])}
        fill={roofColor}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {children}
    </g>
  );
}
