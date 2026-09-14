"use client";

import { useState } from "react";
import type { Worker } from "@/lib/types";
import { MapPin, User, Check, Zap, Eye } from "lucide-react";

type GeoRadarCandidate = {
  worker: Worker;
  distanceKm: number;
  idleHours?: number;
  score?: number;
  eligible?: boolean;
};

type GeoRadarProps = {
  consumerLocation?: { lat: number; lng: number };
  consumerName?: string;
  candidates: GeoRadarCandidate[];
  activeWorkerId?: string | null;
  onSelectWorker?: (worker: Worker) => void;
};

export default function GeoRadar({
  consumerLocation = { lat: 9.9312, lng: 76.2673 },
  consumerName = "Consumer",
  candidates = [],
  activeWorkerId = null,
  onSelectWorker,
}: GeoRadarProps) {
  const [hoveredCandidate, setHoveredCandidate] = useState<GeoRadarCandidate | null>(null);

  // Radar viewBox dimensions: 400x400, center at (200, 200)
  const cx = 200;
  const cy = 200;
  const maxRadius = 170; // 5 km boundary

  // Scale: 5 km maps to 170px radius => 34 px per km
  const pxPerKm = maxRadius / 5.0;

  // Convert worker delta from consumer lat/lng to radar x,y
  const projectedNodes = candidates.slice(0, 10).map((c) => {
    const dLat = (c.worker.lat - consumerLocation.lat) * 111.0; // ~111 km per lat degree
    const dLng = (c.worker.lng - consumerLocation.lng) * 109.0; // ~109 km per lng degree in Kerala
    const x = cx + dLng * pxPerKm;
    const y = cy - dLat * pxPerKm;

    // Constrain within radar bounds
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxRadius - 10);
    const angle = Math.atan2(dy, dx);
    const finalX = cx + Math.cos(angle) * clampedDist;
    const finalY = cy + Math.sin(angle) * clampedDist;

    const isCurrent = activeWorkerId === c.worker.id;
    return {
      candidate: c,
      x: finalX,
      y: finalY,
      isCurrent,
    };
  });

  const activeNode = projectedNodes.find((n) => n.isCurrent);

  return (
    <div className="relative bg-teal-deep text-white rounded-2xl p-5 shadow-xl border border-teal/40 overflow-hidden select-none">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#2a5c53_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-2">
        <div>
          <div className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live Cooperative Dispatch Radar
          </div>
          <div className="text-sm font-bold text-white font-display">
            Ernakulam Cluster Proximity Visualizer
          </div>
        </div>
        <div className="text-[11px] text-teal-100/70 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
          Range: 5.0 km
        </div>
      </div>

      {/* Interactive Radar SVG Container */}
      <div className="relative flex items-center justify-center my-2">
        <svg
          viewBox="0 0 400 400"
          className="w-full max-w-[340px] aspect-square rounded-full bg-teal-deep/90 border border-teal/40 shadow-inner"
        >
          <defs>
            {/* Pulsing Radar Wave Gradient */}
            <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="80%" stopColor="#10b981" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Concentric Distance Circles */}
          <circle cx={cx} cy={cy} r={maxRadius * 0.2} fill="none" stroke="#2a5c53" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={cx} cy={cy} r={maxRadius * 0.4} fill="none" stroke="#2a5c53" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={cx} cy={cy} r={maxRadius * 0.7} fill="none" stroke="#2a5c53" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={cx} cy={cy} r={maxRadius} fill="url(#radarGlow)" stroke="#3b8276" strokeWidth="1.5" />

          {/* Crosshairs */}
          <line x1={cx} y1={cy - maxRadius} x2={cx} y2={cy + maxRadius} stroke="#234e46" strokeWidth="1" />
          <line x1={cx - maxRadius} y1={cy} x2={cx + maxRadius} y2={cy} stroke="#234e46" strokeWidth="1" />

          {/* Distance Labels */}
          <text x={cx + 6} y={cy - maxRadius * 0.4 + 10} fill="#5eead4" fontSize="9" opacity="0.6">2 km</text>
          <text x={cx + 6} y={cy - maxRadius * 0.7 + 10} fill="#5eead4" fontSize="9" opacity="0.6">3.5 km</text>
          <text x={cx + 6} y={cy - maxRadius + 14} fill="#5eead4" fontSize="9" opacity="0.8">5 km</text>

          {/* Dispatch Beam if Active Worker */}
          {activeNode && (
            <g>
              <line
                x1={cx}
                y1={cy}
                x2={activeNode.x}
                y2={activeNode.y}
                stroke="#e2a13a"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
              <circle cx={activeNode.x} cy={activeNode.y} r="14" fill="#e2a13a" opacity="0.25" className="animate-ping" />
            </g>
          )}

          {/* Center: Consumer Node */}
          <g>
            <circle cx={cx} cy={cy} r="8" fill="#10b981" />
            <circle cx={cx} cy={cy} r="14" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.7" className="animate-pulse" />
            <text x={cx} y={cy + 22} fill="#ecfdf5" fontSize="10" textAnchor="middle" fontWeight="bold">
              {consumerName}
            </text>
          </g>

          {/* Surrounding Worker Nodes */}
          {projectedNodes.map((node, idx) => {
            const { candidate, x, y, isCurrent } = node;
            const w = candidate.worker;
            const isEligible = candidate.eligible !== false;
            const isHovered = hoveredCandidate?.worker.id === w.id;
            const fill = isCurrent
              ? "#e2a13a" // Golden yellow if active offer
              : !isEligible
              ? "#f87171" // Red if upskilling
              : "#38bdf8"; // Blue if ready/available

            return (
              <g
                key={w.id || idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredCandidate(candidate)}
                onMouseLeave={() => setHoveredCandidate(null)}
                onClick={() => onSelectWorker?.(w)}
              >
                {/* Invisible Generous Hitbox Circle (36px wide) */}
                <circle cx={x} cy={y} r={18} fill="transparent" />

                {/* Constant Static Halo - only opacity changes, no DOM addition/removal */}
                <circle
                  cx={x}
                  cy={y}
                  r={12}
                  fill={fill}
                  opacity={isHovered ? 0.35 : 0}
                  pointerEvents="none"
                />

                {/* Visible Worker Dot - strictly stationary cx and cy, no CSS transition */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 7 : isCurrent ? 6.5 : 5}
                  fill={fill}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  pointerEvents="none"
                />

                {/* Worker Name Label - strictly stationary x and y */}
                <text
                  x={x}
                  y={y - 10}
                  fill={isHovered ? "#ffffff" : "#f0fdf4"}
                  fontSize="9"
                  fontWeight={isHovered ? "bold" : "normal"}
                  textAnchor="middle"
                  className="pointer-events-none drop-shadow-sm select-none"
                >
                  {w.name.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Strictly Fixed-Height Tooltip Box (54px) - zero layout shifts */}
      <div className="h-14 flex items-center overflow-hidden">
        {hoveredCandidate ? (
          <div className="w-full relative z-10 bg-black/60 border border-white/20 rounded-xl p-2 text-xs flex items-center justify-between">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>{hoveredCandidate.worker.name}</span>
                <span className="text-[10px] text-amber-300 font-semibold">★ {hoveredCandidate.worker.rating}</span>
              </div>
              <div className="text-[10px] text-teal-100/80 mt-0.5">
                {hoveredCandidate.distanceKm} km away · {hoveredCandidate.idleHours ?? 4}h idle fairness
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectWorker?.(hoveredCandidate.worker)}
              className="px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3 h-3" /> Inspect
            </button>
          </div>
        ) : (
          <div className="w-full relative z-10 flex items-center justify-between text-[10px] text-teal-100/70 pt-1 border-t border-white/10">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Ready
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Active Offer
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> In Upskilling
              </span>
            </div>
            <span>Hover a node for details</span>
          </div>
        )}
      </div>
    </div>
  );
}
