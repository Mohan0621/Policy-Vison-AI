import React, { useEffect, useRef } from 'react';

interface SerkoHeroGlobeProps {
  className?: string;
}

export const SerkoHeroGlobe: React.FC<SerkoHeroGlobeProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<{ targetX: number; targetY: number; currentX: number; currentY: number }>({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;
    let lastPaint = performance.now();
    let t = 0;

    const auraCanvas = document.createElement('canvas');
    const auraCtx = auraCanvas.getContext('2d');

    const DEG = Math.PI / 180;

    // Fibonacci sphere dots
    const dots: { x: number; y: number; z: number }[] = [];
    const N = 460;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      dots.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
    }

    const hubs = [
      { lat: 28.61, lon: 77.20 }, // New Delhi (IRDAI HQ)
      { lat: 19.07, lon: 72.87 }, // Mumbai
      { lat: 12.97, lon: 77.59 }, // Bengaluru
      { lat: 17.38, lon: 78.48 }, // Hyderabad
      { lat: 13.08, lon: 80.27 }, // Chennai
      { lat: 22.57, lon: 88.36 }, // Kolkata
    ];

    const routes: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
    ];

    function latLonToVec(lat: number, lon: number) {
      const phi = (90 - lat) * DEG;
      const theta = (lon + 180) * DEG;
      return {
        x: -Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta),
      };
    }

    function rotateVec(v: { x: number; y: number; z: number }, rotY: number, rotX: number) {
      const cy = Math.cos(rotY), sy = Math.sin(rotY);
      const x1 = v.x * cy - v.z * sy;
      const z1 = v.x * sy + v.z * cy;
      const cx = Math.cos(rotX), sx = Math.sin(rotX);
      const y2 = v.y * cx - z1 * sx;
      const z2 = v.y * sx + z1 * cx;
      return { x: x1, y: y2, z: z2 };
    }

    function getSphereGeometry() {
      const cx = width * 0.5;
      const cy = Math.max(380, height * 0.58);
      const radius = Math.max(210, Math.min(width * 0.34, 340));
      return { cx, cy, radius };
    }

    function rebuildAura(cx: number, cy: number, radius: number) {
      if (!auraCtx) return;
      auraCanvas.width = Math.max(1, width);
      auraCanvas.height = Math.max(1, height);
      auraCtx.clearRect(0, 0, width, height);

      // Outer soft atmospheric sky halo
      const outer = auraCtx.createRadialGradient(cx, cy - radius * 0.15, radius * 0.35, cx, cy, radius * 1.25);
      outer.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      outer.addColorStop(0.5, 'rgba(150, 203, 250, 0.22)');
      outer.addColorStop(0.8, 'rgba(207, 105, 224, 0.10)');
      outer.addColorStop(1, 'rgba(255, 255, 255, 0)');
      auraCtx.fillStyle = outer;
      auraCtx.beginPath();
      auraCtx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
      auraCtx.fill();

      // Soft translucent glass sphere interior highlight matching live serko.ai dome
      const inner = auraCtx.createRadialGradient(
        cx,
        cy - radius * 0.3,
        radius * 0.08,
        cx,
        cy,
        radius
      );
      inner.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      inner.addColorStop(0.55, 'rgba(150, 203, 250, 0.24)');
      inner.addColorStop(0.85, 'rgba(27, 152, 242, 0.12)');
      inner.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
      auraCtx.fillStyle = inner;
      auraCtx.beginPath();
      auraCtx.arc(cx, cy, radius, 0, Math.PI * 2);
      auraCtx.fill();
    }

    function handleResize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width || window.innerWidth;
      height = rect.height || 700;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const { cx, cy, radius } = getSphereGeometry();
      rebuildAura(cx, cy, radius);
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      pointerRef.current.targetX = Math.max(-1, Math.min(1, nx));
      pointerRef.current.targetY = Math.max(-1, Math.min(1, ny));
    };

    window.addEventListener('mousemove', onMouseMove);

    function frame(now: number) {
      if (!ctx) return;
      const dt = Math.min(0.06, (now - lastPaint) / 1000);
      lastPaint = now;
      t += dt * 0.32;

      const p = pointerRef.current;
      p.currentX += (p.targetX - p.currentX) * 0.06;
      p.currentY += (p.targetY - p.currentY) * 0.06;

      ctx.clearRect(0, 0, width, height);

      const geom = getSphereGeometry();
      const cx = geom.cx + p.currentX * 8;
      const cy = geom.cy + p.currentY * 6;
      const radius = geom.radius;
      const rotY = t * 0.38 + p.currentX * 0.22;
      const rotX = -0.25 + p.currentY * 0.12;

      // 1. Atmosphere
      if (auraCanvas.width > 0 && auraCanvas.height > 0) {
        ctx.drawImage(auraCanvas, p.currentX * 8, p.currentY * 6, width, height);
      }

      // 2. Rim ring
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Latitude wireframe arcs
      ctx.lineWidth = 0.75;
      for (let lat = -60; lat <= 75; lat += 20) {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 10) {
          const pt = rotateVec(latLonToVec(lat, lon), rotY, rotX);
          if (pt.z > -0.05) {
            const sx = cx + pt.x * radius;
            const sy = cy - pt.y * radius;
            if (!started) {
              ctx.moveTo(sx, sy);
              started = true;
            } else {
              ctx.lineTo(sx, sy);
            }
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.stroke();
      }

      // Longitude arcs
      for (let lon = 0; lon < 180; lon += 24) {
        ctx.beginPath();
        let started = false;
        for (let a = 0; a <= 360; a += 10) {
          const rad = a * DEG;
          const vec = {
            x: Math.cos(rad) * Math.cos(lon * DEG),
            y: Math.sin(rad),
            z: Math.cos(rad) * Math.sin(lon * DEG),
          };
          const pt = rotateVec(vec, rotY, rotX);
          if (pt.z > -0.05) {
            const sx = cx + pt.x * radius;
            const sy = cy - pt.y * radius;
            if (!started) {
              ctx.moveTo(sx, sy);
              started = true;
            } else {
              ctx.lineTo(sx, sy);
            }
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
        ctx.stroke();
      }

      // 4. Fibonacci surface dots
      for (let i = 0; i < dots.length; i++) {
        const pt = rotateVec(dots[i], rotY, rotX);
        if (pt.z > 0.02) {
          const alpha = Math.max(0.12, Math.min(0.75, pt.z * 0.85));
          const sx = cx + pt.x * radius;
          const sy = cy - pt.y * radius;
          ctx.fillStyle = `rgba(17, 24, 39, ${alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, pt.z > 0.45 ? 1.25 : 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Orbital routes
      routes.forEach((pair, idx) => {
        const va = latLonToVec(hubs[pair[0]].lat, hubs[pair[0]].lon);
        const vb = latLonToVec(hubs[pair[1]].lat, hubs[pair[1]].lon);
        const pts: { sx: number; sy: number; z: number }[] = [];
        const steps = 18;
        for (let s = 0; s <= steps; s++) {
          const f = s / steps;
          let mx = va.x * (1 - f) + vb.x * f;
          let my = va.y * (1 - f) + vb.y * f;
          let mz = va.z * (1 - f) + vb.z * f;
          const len = Math.hypot(mx, my, mz) || 1;
          const lift = 1 + Math.sin(f * Math.PI) * 0.12;
          mx = (mx / len) * lift;
          my = (my / len) * lift;
          mz = (mz / len) * lift;
          const rp = rotateVec({ x: mx, y: my, z: mz }, rotY, rotX);
          pts.push({ sx: cx + rp.x * radius, sy: cy - rp.y * radius, z: rp.z });
        }

        const midZ = pts[Math.floor(steps / 2)].z;
        if (midZ > 0.02) {
          const grad = ctx.createLinearGradient(pts[0].sx, pts[0].sy, pts[steps].sx, pts[steps].sy);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
          grad.addColorStop(0.5, 'rgba(27, 152, 242, 0.35)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');

          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          pts.forEach((pt, k) => {
            if (k === 0) ctx.moveTo(pt.sx, pt.sy);
            else ctx.lineTo(pt.sx, pt.sy);
          });
          ctx.stroke();

          // Packet
          const progress = (t * 0.55 + idx * 0.2) % 1;
          const orbIdx = Math.min(steps, Math.floor(progress * steps));
          const orbPt = pts[orbIdx];
          if (orbPt && orbPt.z > 0.08) {
            ctx.fillStyle = 'rgba(27, 152, 242, 0.2)';
            ctx.beginPath();
            ctx.arc(orbPt.sx, orbPt.sy, 4.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(27, 152, 242, 0.9)';
            ctx.beginPath();
            ctx.arc(orbPt.sx, orbPt.sy, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // 6. Hub pulses
      const activeAlertHub = Math.floor(t * 0.3) % hubs.length;
      hubs.forEach((hub, hIdx) => {
        const rp = rotateVec(latLonToVec(hub.lat, hub.lon), rotY, rotX);
        if (rp.z > 0.1) {
          const hx = cx + rp.x * radius;
          const hy = cy - rp.y * radius;
          const isAlert = hIdx === activeAlertHub;
          const pulse = (t * 1.3 + hIdx * 0.3) % 1;
          const rippleR = 2 + pulse * 9;
          const rippleAlpha = (1 - pulse) * (isAlert ? 0.45 : 0.22);

          ctx.strokeStyle = isAlert
            ? `rgba(245, 98, 147, ${rippleAlpha})`
            : `rgba(27, 152, 242, ${rippleAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(hx, hy, rippleR, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = isAlert ? 'rgba(245, 98, 147, 0.9)' : 'rgba(17, 24, 39, 0.7)';
          ctx.beginPath();
          ctx.arc(hx, hy, isAlert ? 2.2 : 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none w-full h-full ${className}`}
    />
  );
};
