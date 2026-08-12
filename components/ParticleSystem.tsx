import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

interface ParticleSystemProps {
  type: 'none' | 'rain' | 'confetti';
  width: number;
  height: number;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ type, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const requestRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (type === 'none') {
      particles.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const createParticle = (): Particle => {
      let x = Math.random() * width;
      let y = Math.random() * height;
      let vx = 0;
      let vy = 0;
      let size = 2;
      let color = '#FFFFFF';
      let maxLife = 100 + Math.random() * 100;

      switch (type) {
        case 'rain':
          y = -10;
          vx = -1;
          vy = 10 + Math.random() * 5;
          size = 1;
          color = '#AACCFF';
          break;
        case 'confetti':
          y = -10;
          vx = (Math.random() - 0.5) * 5;
          vy = 3 + Math.random() * 5;
          size = 5 + Math.random() * 5;
          color = `hsl(${Math.random() * 360}, 100%, 50%)`;
          break;
      }

      return { x, y, vx, vy, size, color, life: 0, maxLife };
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Spawn new particles
      if (particles.current.length < 100) {
        particles.current.push(createParticle());
      }

      particles.current.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        ctx.fillStyle = p.color;
        if (type === 'rain') {
          ctx.fillRect(p.x, p.y, 1, 10);
        } else if (type === 'confetti') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.life * 0.1);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // Remove dead particles
        if (p.life > p.maxLife || p.y > height + 20 || p.x < -20 || p.x > width + 20) {
          particles.current[index] = createParticle();
        }
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [type, width, height]);

  if (type === 'none') return null;

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="absolute inset-0 pointer-events-none z-[50]"
    />
  );
};

export default ParticleSystem;
