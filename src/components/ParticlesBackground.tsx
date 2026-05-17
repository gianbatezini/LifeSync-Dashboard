import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  color: string;
}

export const ParticlesBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticle = (): Particle => {
      const isGold = Math.random() > 0.5;
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 100,
        size: Math.random() * 1.5 + 0.5,
        speedY: -(Math.random() * 0.5 + 0.2), // Rising slowly
        speedX: (Math.random() - 0.5) * 0.2, // Slight horizontal drift
        opacity: Math.random() * 0.5 + 0.1,
        color: isGold ? '#e2c08d' : '#00f0ff', // Gold and Cyber Blue
      };
    };

    const init = () => {
      particles = Array.from({ length: 80 }, createParticle);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.y += p.speedY;
        p.x += p.speedX;
        
        // Fading out as they rise
        const lifeRatio = p.y / canvas.height;
        ctx.globalAlpha = p.opacity * lifeRatio;
        
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Reset particle if it goes off screen or becomes too transparent
        if (p.y < -10) {
          particles[i] = createParticle();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    init();
    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-40"
      style={{ background: 'transparent' }}
    />
  );
};
