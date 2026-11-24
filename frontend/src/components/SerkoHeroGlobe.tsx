import React, { useEffect, useRef } from 'react';

interface SerkoHeroGlobeProps {
  className?: string;
}

/**
 * 1:1 Pixel-Perfect TypeScript port of AgentOps / IncidentIQ hero-globe.html
 * Source: D:\Mohan\AgentOps\agentops\src\main\resources\web\hero-globe.html
 */
export const SerkoHeroGlobe: React.FC<SerkoHeroGlobeProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<{
    targetX: number;
    targetY: number;
    currentX: number;
    currentY: number;
  }>({
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

    // Dense charcoal stippled surface dots along Fibonacci sphere (520 dots matching AgentOps)
    const dots: { x: number; y: number; z: number }[] = [];
    const N = 520;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      dots.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
    }

    // Exact 6 global telemetry hubs from AgentOps hero-globe.html
    const hubs = [
      { lat: 37.77, lon: -122.41 },
      { lat: 40.71, lon: -74.00 },
      { lat: 51.50, lon: -0.12 },
      { lat: 50.11, lon: 8.68 },
      { lat: 12.97, lon: 77.59 },
      { lat: 35.67, lon: 139.65 },
    ];

    const routes: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
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
      const cy = height * 0.74;
      const radius = Math.max(240, Math.min(width * 0.36, height * 0.33));
      return { cx, cy, radius };
    }

    function rebuildAura(cx: number, cy: number, radius: number) {
      if (!auraCtx) return;
      auraCanvas.width = Math.max(1, width);
      auraCanvas.height = Math.max(1, height);
      auraCtx.clearRect(0, 0, width, height);

      // Outer soft atmospheric sky halo matching AgentOps
      const outer = auraCtx.createRadialGradient(
        cx,
        cy - radius * 0.15,
        radius * 0.4,
        cx,
        cy,
        radius * 1.18
      );
      outer.addColorStop(0, 'rgba(255, 255, 255, 0.36)');
      outer.addColorStop(0.55, 'rgba(150, 203, 250, 0.18)');
      outer.addColorStop(0.85, 'rgba(207, 105, 224, 0.08)');
      outer.addColorStop(1, 'rgba(255, 255, 255, 0)');
      auraCtx.fillStyle = outer;
      auraCtx.beginPath();
      auraCtx.arc(cx, cy, radius * 1.18, 0, Math.PI * 2);
      auraCtx.fill();

      // Soft translucent glass sphere interior highlight matching AgentOps
      const inner = auraCtx.createRadialGradient(
        cx,
        cy - radius * 0.32,
        radius * 0.06,
        cx,
        cy,
        radius
      );
      inner.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
      inner.addColorStop(0.58, 'rgba(150, 203, 250, 0.22)');
      inner.addColorStop(0.88, 'rgba(27, 152, 242, 0.10)');
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
      height = rect.height || 850;
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
      const nx = ((e.clientX - rect.left) / (rect.width || window.innerWidth) - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / (rect.height || window.innerHeight) - 0.5) * 2;
      pointerRef.current.targetX = Math.max(-1, Math.min(1, nx));
      pointerRef.current.targetY = Math.max(-1, Math.min(1, ny));
    };

    const onMouseLeave = () => {
      pointerRef.current.targetX = 0;
      pointerRef.current.targetY = 0;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    function frame(now: number) {
      if (!ctx) return;
      const dt = Math.min(0.06, (now - lastPaint) / 1000);
      lastPaint = now;
      t += dt * 0.34;

      const p = pointerRef.current;
      p.currentX += (p.targetX - p.currentX) * 0.08;
      p.currentY += (p.targetY - p.currentY) * 0.08;

      ctx.clearRect(0, 0, width, height);

      const geom = getSphereGeometry();
      const cx = geom.cx + p.currentX * 7;
      const cy = geom.cy + p.currentY * 5;
      const radius = geom.radius;
      const rotY = t * 0.42 + p.currentX * 0.24;
      const rotX = -0.28 + p.currentY * 0.14;

      // 1. Atmosphere
      if (auraCanvas.width > 0 && auraCanvas.height > 0) {
        ctx.drawImage(auraCanvas, p.currentX * 7, p.currentY * 5, width, height);
      }

      // 2. Subtle thin dark charcoal outer rim ring
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Latitude wireframe arcs
      ctx.lineWidth = 0.85;
      for (let lat = -60; lat <= 75; lat += 15) {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 8) {
          const pt = rotateVec(latLonToVec(lat, lon), rotY, rotX);
          if (pt.z > -0.02) {
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
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)';
        ctx.stroke();
      }

      // Longitude wireframe arcs
      for (let lon = 0; lon < 180; lon += 18) {
        ctx.beginPath();
        let started = false;
        for (let a = 0; a <= 360; a += 8) {
          const rad = a * DEG;
          const vec = {
            x: Math.cos(rad) * Math.cos(lon * DEG),
            y: Math.sin(rad),
            z: Math.cos(rad) * Math.sin(lon * DEG),
          };
          const pt = rotateVec(vec, rotY, rotX);
          if (pt.z > -0.02) {
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
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.11)';
        ctx.stroke();
      }

      // 4. Charcoal stippled surface dots matching AgentOps
      for (let i = 0; i < dots.length; i++) {
        const pt = rotateVec(dots[i], rotY, rotX);
        if (pt.z > 0.02) {
          const alpha = Math.max(0.18, Math.min(0.88, pt.z * 0.92));
          const sx = cx + pt.x * radius;
          const sy = cy - pt.y * radius;
          ctx.fillStyle = `rgba(17, 24, 39, ${alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, pt.z > 0.48 ? 1.35 : 0.95, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Restrained dark + sky telemetry orbital paths
      routes.forEach((pair, idx) => {
        const va = latLonToVec(hubs[pair[0]].lat, hubs[pair[0]].lon);
        const vb = latLonToVec(hubs[pair[1]].lat, hubs[pair[1]].lon);
        const pts: { sx: number; sy: number; z: number }[] = [];
        const steps = 22;
        for (let s = 0; s <= steps; s++) {
          const f = s / steps;
          let mx = va.x * (1 - f) + vb.x * f;
          let my = va.y * (1 - f) + vb.y * f;
          let mz = va.z * (1 - f) + vb.z * f;
          const len = Math.hypot(mx, my, mz) || 1;
          const lift = 1 + Math.sin(f * Math.PI) * 0.14;
          mx = (mx / len) * lift;
          my = (my / len) * lift;
          mz = (mz / len) * lift;
          const rp = rotateVec({ x: mx, y: my, z: mz }, rotY, rotX);
          pts.push({ sx: cx + rp.x * radius, sy: cy - rp.y * radius, z: rp.z });
        }

        const midZ = pts[Math.floor(steps / 2)].z;
        if (midZ > 0.05) {
          const grad = ctx.createLinearGradient(pts[0].sx, pts[0].sy, pts[steps].sx, pts[steps].sy);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0.22)');
          grad.addColorStop(0.5, 'rgba(27, 152, 242, 0.42)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0.22)');

          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          pts.forEach((pt, k) => {
            if (k === 0) ctx.moveTo(pt.sx, pt.sy);
            else ctx.lineTo(pt.sx, pt.sy);
          });
          ctx.stroke();

          // Packet with subtle fading tail along orbital arc
          const progress = (t * 0.65 + idx * 0.22) % 1;
          const orbIdx = Math.min(steps, Math.floor(progress * steps));
          const orbPt = pts[orbIdx];
          if (orbPt && orbPt.z > 0.1) {
            for (let trail = 2; trail >= 1; trail--) {
              const tIdx = Math.max(0, orbIdx - trail);
              const tPt = pts[tIdx];
              if (tPt && tPt.z > 0.08) {
                ctx.fillStyle = trail === 1 ? 'rgba(27, 152, 242, 0.42)' : 'rgba(207, 105, 224, 0.22)';
                ctx.beginPath();
                ctx.arc(tPt.sx, tPt.sy, trail === 1 ? 1.8 : 1.4, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            ctx.fillStyle = 'rgba(27, 152, 242, 0.24)';
            ctx.beginPath();
            ctx.arc(orbPt.sx, orbPt.sy, 5.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(27, 152, 242, 0.92)';
            ctx.beginPath();
            ctx.arc(orbPt.sx, orbPt.sy, 2.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // 6. Live pulsing hub beacons on visible hemisphere
      const activeAlertHub = Math.floor(t * 0.35) % hubs.length;
      hubs.forEach((hub, hIdx) => {
        const rp = rotateVec(latLonToVec(hub.lat, hub.lon), rotY, rotX);
        if (rp.z > 0.14) {
          const hx = cx + rp.x * radius;
          const hy = cy - rp.y * radius;
          const isWatchHub = hIdx === activeAlertHub;
          const pulse = (t * 1.45 + hIdx * 0.28) % 1;
          const rippleR = 2.5 + pulse * 10.5;
          const rippleAlpha = (1 - pulse) * (isWatchHub ? 0.48 : 0.26);

          ctx.strokeStyle = isWatchHub
            ? `rgba(245, 98, 147, ${rippleAlpha})`
            : `rgba(27, 152, 242, ${rippleAlpha})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(hx, hy, rippleR, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = isWatchHub ? 'rgba(245, 98, 147, 0.92)' : 'rgba(17, 24, 39, 0.78)';
          ctx.beginPath();
          ctx.arc(hx, hy, isWatchHub ? 2.4 : 1.9, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none w-full h-full ${className}`}
      style={{
        background: `
          linear-gradient(to bottom, #E5F2FF 0%, #E5F2FF 36%, rgba(229, 242, 255, 0) 68%),
          radial-gradient(ellipse 220% 88% at 50% 102%,
            #FF8C51 0%,
            #FF897F 9%,
            #F489AD 18%,
            #E388F2 30%,
            #96CBFA 52%,
            #CFE6FC 70%,
            #E5F2FF 88%,
            #FFFFFF 100%
          )
        `,
      }}
    />
  );
};
