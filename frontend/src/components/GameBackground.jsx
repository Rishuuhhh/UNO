import React, { useEffect, useRef } from 'react';

// Draws the entire background on a canvas:
// - Deep dark base with subtle color zones
// - Animated floating particles
// - Slow drifting light streaks
// - Center spotlight
// - Edge vignette
export default function GameBackground() {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const stateRef  = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // ── Resize ──────────────────────────────────────────────────────────────
    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Particles ────────────────────────────────────────────────────────────
    const PARTICLE_COUNT = 55;
    const COLORS = [
      'rgba(239,68,68,',    // red
      'rgba(59,130,246,',   // blue
      'rgba(34,197,94,',    // green
      'rgba(234,179,8,',    // yellow
      'rgba(168,85,247,',   // purple
      'rgba(255,255,255,',  // white
    ];

    function mkParticle() {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      return {
        x:     Math.random() * window.innerWidth,
        y:     Math.random() * window.innerHeight,
        r:     Math.random() * 1.8 + 0.4,
        vx:    (Math.random() - 0.5) * 0.25,
        vy:    -(Math.random() * 0.35 + 0.08),
        alpha: Math.random() * 0.5 + 0.1,
        color,
        life:  Math.random(),        // 0–1 phase offset
        speed: Math.random() * 0.004 + 0.002,
      };
    }

    const particles = Array.from({ length: PARTICLE_COUNT }, mkParticle);

    // ── Light streaks ────────────────────────────────────────────────────────
    const STREAK_COUNT = 6;
    function mkStreak() {
      return {
        x:     Math.random() * window.innerWidth,
        y:     Math.random() * window.innerHeight,
        len:   Math.random() * 120 + 60,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.06 + 0.02,
        width: Math.random() * 1.2 + 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        drift: (Math.random() - 0.5) * 0.002,
      };
    }
    const streaks = Array.from({ length: STREAK_COUNT }, mkStreak);

    // ── Slow color orbs (background blobs) ───────────────────────────────────
    const orbs = [
      { x: 0.15, y: 0.5,  r: 0.35, color: 'rgba(120,40,200,',  alpha: 0.10 },
      { x: 0.85, y: 0.2,  r: 0.30, color: 'rgba(220,40,40,',   alpha: 0.08 },
      { x: 0.65, y: 0.85, r: 0.28, color: 'rgba(40,100,220,',  alpha: 0.08 },
      { x: 0.5,  y: 0.5,  r: 0.20, color: 'rgba(34,197,94,',   alpha: 0.04 },
    ];

    stateRef.current = { particles, streaks, orbs, t: 0 };

    // ── Draw loop ────────────────────────────────────────────────────────────
    function draw() {
      const W = canvas.width;
      const H = canvas.height;
      const { t } = stateRef.current;

      // 1. Base fill
      ctx.fillStyle = '#080810';
      ctx.fillRect(0, 0, W, H);

      // 2. Slow-moving color orbs
      for (const orb of orbs) {
        const ox = orb.x * W + Math.sin(t * 0.0003 + orb.x * 10) * W * 0.04;
        const oy = orb.y * H + Math.cos(t * 0.0004 + orb.y * 10) * H * 0.04;
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.r * Math.max(W, H));
        grad.addColorStop(0,   orb.color + orb.alpha + ')');
        grad.addColorStop(1,   orb.color + '0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      // 3. Center spotlight
      const cx = W / 2, cy = H * 0.48;
      const spotR = Math.min(W, H) * 0.38;
      const spot = ctx.createRadialGradient(cx, cy, 0, cx, cy, spotR);
      spot.addColorStop(0,   'rgba(255,255,255,0.045)');
      spot.addColorStop(0.4, 'rgba(255,255,255,0.018)');
      spot.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, W, H);

      // 4. Table felt texture ring (subtle ellipse)
      const feltGrad = ctx.createRadialGradient(cx, cy, spotR * 0.1, cx, cy, spotR * 1.1);
      feltGrad.addColorStop(0,   'rgba(20,40,20,0)');
      feltGrad.addColorStop(0.6, 'rgba(10,30,15,0.18)');
      feltGrad.addColorStop(1,   'rgba(5,15,8,0)');
      ctx.fillStyle = feltGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, spotR * 1.4, spotR * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      // 5. Light streaks
      for (const s of streaks) {
        s.angle += s.drift;
        s.x     += Math.cos(s.angle) * s.speed;
        s.y     += Math.sin(s.angle) * s.speed;
        // Wrap
        if (s.x < -s.len) s.x = W + s.len;
        if (s.x > W + s.len) s.x = -s.len;
        if (s.y < -s.len) s.y = H + s.len;
        if (s.y > H + s.len) s.y = -s.len;

        const ex = s.x + Math.cos(s.angle) * s.len;
        const ey = s.y + Math.sin(s.angle) * s.len;
        const lg = ctx.createLinearGradient(s.x, s.y, ex, ey);
        lg.addColorStop(0,   s.color + '0)');
        lg.addColorStop(0.5, s.color + s.alpha + ')');
        lg.addColorStop(1,   s.color + '0)');
        ctx.strokeStyle = lg;
        ctx.lineWidth   = s.width;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }

      // 6. Particles
      for (const p of particles) {
        p.life += p.speed;
        if (p.life > 1) {
          // Respawn at bottom
          p.x    = Math.random() * W;
          p.y    = H + 10;
          p.life = 0;
        }
        p.x += p.vx;
        p.y += p.vy;

        const pulse = 0.5 + 0.5 * Math.sin(p.life * Math.PI * 2);
        const a     = p.alpha * pulse;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.8 + 0.4 * pulse), 0, Math.PI * 2);
        ctx.fillStyle = p.color + a + ')';
        ctx.fill();

        // Tiny glow halo on larger particles
        if (p.r > 1.2) {
          const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          halo.addColorStop(0,   p.color + (a * 0.4) + ')');
          halo.addColorStop(1,   p.color + '0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 7. Vignette
      const vig = ctx.createRadialGradient(cx, cy, Math.min(W,H) * 0.3, cx, cy, Math.max(W,H) * 0.85);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.72)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      stateRef.current.t = t + 1;
      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
