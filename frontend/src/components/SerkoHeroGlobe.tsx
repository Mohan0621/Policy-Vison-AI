import React, { useEffect, useRef } from 'react';

interface SerkoHeroGlobeProps {
  className?: string;
}

export const SerkoHeroGlobe: React.FC<SerkoHeroGlobeProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<{
    targetX: number;
    targetY: number;
    currentX: number;
    currentY: number;
    mouseX: number;
    mouseY: number;
  }>({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    mouseX: -1000,
    mouseY: -1000,
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
      { name: 'IRDAI HQ (New Delhi)', tag: 'Regulatory Grounding', lat: 28.61, lon: 77.20 },
      { name: 'Mumbai Financial Hub', tag: 'Underwriting Desk', lat: 19.07, lon: 72.87 },
      { name: 'Bengaluru Tech Node', tag: 'Diffusion Engine 150 DPI', lat: 12.97, lon: 77.59 },
      { name: 'Hyderabad TPA Grid', tag: '60-min Cashless SLA', lat: 17.38, lon: 78.48 },
      { name: 'Chennai Insurance Hub', tag: 'Claims Adjudication', lat: 13.08, lon: 80.27 },
      { name: 'Kolkata Regional Desk', tag: 'Indic Multi-Script', lat: 22.57, lon: 88.36 },
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
      const cy = height * 0.74;
      const radius = Math.max(240, Math.min(width * 0.36, height * 0.33));
      return { cx, cy, radius };
    }

    function rebuildAura(cx: number, cy: number, radius: number) {
      if (!auraCtx) return;
      auraCanvas.width = Math.max(1, width);
      auraCanvas.height = Math.max(1, height);
      auraCtx.clearRect(0, 0, width, height);

      // Outer soft atmospheric sky halo
      const outer = auraCtx.createRadialGradient(cx, cy - radius * 0.15, radius * 0.4, cx, cy, radius * 1.18);
      outer.addColorStop(0, 'rgba(255, 255, 255, 0.36)');
      outer.addColorStop(0.55, 'rgba(150, 203, 250, 0.18)');
      outer.addColorStop(0.85, 'rgba(207, 105, 224, 0.08)');
      outer.addColorStop(1, 'rgba(255, 255, 255, 0)');
      auraCtx.fillStyle = outer;
      auraCtx.beginPath();
      auraCtx.arc(cx, cy, radius * 1.18, 0, Math.PI * 2);
      auraCtx.fill();

      // Soft translucent glass sphere interior highlight matching live serko.ai dome
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
      const nx = ((e.clientX - rect.left) / (rect.width || window.innerWidth) - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / (rect.height || window.innerHeight) - 0.5) * 2;
      pointerRef.current.targetX = Math.max(-1, Math.min(1, nx));
      pointerRef.current.targetY = Math.max(-1, Math.min(1, ny));
      pointerRef.current.mouseX = e.clientX - rect.left;
      pointerRef.current.mouseY = e.clientY - rect.top;
    };

    const onMouseLeave = () => {
      pointerRef.current.targetX = 0;
      pointerRef.current.targetY = 0;
      pointerRef.current.mouseX = -1000;
      pointerRef.current.mouseY = -1000;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    function frame(now: number) {
      if (!ctx) return;
      const dt = Math.min(0.06, (now - lastPaint) / 1000);
      lastPaint = now;
      t += dt * 0.68;

      const p = pointerRef.current;
      p.currentX += (p.targetX - p.currentX) * 0.1;
      p.currentY += (p.targetY - p.currentY) * 0.1;

      ctx.clearRect(0, 0, width, height);

      const geom = getSphereGeometry();
      const cx = geom.cx + p.currentX * 36;
      const cy = geom.cy + p.currentY * 24;
      const radius = geom.radius;
      const rotY = t * 0.65 + p.currentX * 0.95;
      const rotX = -0.22 + p.currentY * 0.55;

      // 1. Atmosphere
      if (auraCanvas.width > 0 && auraCanvas.height > 0) {
        ctx.drawImage(auraCanvas, p.currentX * 12, p.currentY * 8, width, height);
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
          grad.addColorStop(0.5, 'rgba(27, 152, 242, 0.45)');
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
          const progress = (t * 0.65 + idx * 0.2) % 1;
          const orbIdx = Math.min(steps, Math.floor(progress * steps));
          const orbPt = pts[orbIdx];
          if (orbPt && orbPt.z > 0.08) {
            ctx.fillStyle = 'rgba(27, 152, 242, 0.25)';
            ctx.beginPath();
            ctx.arc(orbPt.sx, orbPt.sy, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(27, 152, 242, 0.95)';
            ctx.beginPath();
            ctx.arc(orbPt.sx, orbPt.sy, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // 6. Hub pulses & Interactive Hover Highlighting
      const activeAlertHub = Math.floor(t * 0.35) % hubs.length;
      let hoveredHub: { name: string; tag: string; sx: number; sy: number } | null = null;

      for (let hIdx = 0; hIdx < hubs.length; hIdx++) {
        const hub = hubs[hIdx];
        const rp = rotateVec(latLonToVec(hub.lat, hub.lon), rotY, rotX);
        if (rp.z > 0.1) {
          const hx = cx + rp.x * radius;
          const hy = cy - rp.y * radius;
          const isAlert = hIdx === activeAlertHub;
          const pulse = (t * 1.5 + hIdx * 0.3) % 1;
          const rippleR = 2.5 + pulse * 11;
          const rippleAlpha = (1 - pulse) * (isAlert ? 0.55 : 0.28);

          // Check if cursor is hovering near this hub
          const distToMouse = Math.hypot(p.mouseX - hx, p.mouseY - hy);
          const isHovered = distToMouse < 45;
          if (isHovered && !hoveredHub) {
            hoveredHub = { name: hub.name, tag: hub.tag, sx: hx, sy: hy };
          }

          ctx.strokeStyle = isHovered
            ? 'rgba(27, 152, 242, 0.9)'
            : isAlert
            ? `rgba(245, 98, 147, ${rippleAlpha})`
            : `rgba(27, 152, 242, ${rippleAlpha})`;
          ctx.lineWidth = isHovered ? 1.8 : 1;
          ctx.beginPath();
          ctx.arc(hx, hy, isHovered ? 14 : rippleR, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = isHovered
            ? '#1B98F2'
            : isAlert
            ? 'rgba(245, 98, 147, 0.95)'
            : 'rgba(17, 24, 39, 0.85)';
          ctx.beginPath();
          ctx.arc(hx, hy, isHovered ? 3.5 : isAlert ? 2.5 : 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Render interactive hover tooltip for hovered hub
      if (hoveredHub) {
        const { name, tag, sx, sy } = hoveredHub;
        const boxW = Math.max(160, name.length * 6.5 + 40);
        const boxH = 40;
        const boxX = Math.max(10, Math.min(width - boxW - 10, sx - boxW / 2));
        const boxY = Math.max(10, sy - 54);

        ctx.fillStyle = 'rgba(9, 9, 11, 0.9)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name, boxX + boxW / 2, boxY + 16);

        ctx.fillStyle = '#C0F2B5';
        ctx.font = '9px monospace';
        ctx.fillText(`• ${tag}`, boxX + boxW / 2, boxY + 30);
      }

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
    />
  );
};
