import React, { useEffect, useRef } from 'react';

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  speed: number;
  phase: 'line' | 'expand' | 'stay' | 'shrink' | 'disappear' | 'wait';
  phaseTime: number;
  group: number;
}

const FloatingBlocks: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blocksRef = useRef<Block[]>([]);
  const animationRef = useRef<number>(0);

  const createBlock = (group: number): Block => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    const baseWidth = vw * 0.015;
    const baseHeight = vw * 0.015;
    const targetWidth = vw * (0.03 + Math.random() * 0.04);
    const targetHeight = vw * (0.04 + Math.random() * 0.05);

    return {
      x: Math.random() * (vw - targetWidth),
      y: vh * 0.5 + Math.random() * (vh * 0.5),
      width: baseWidth,
      height: baseHeight,
      opacity: 0,
      speed: 0.3 + Math.random() * 0.3,
      phase: 'line',
      phaseTime: 0,
      group,
    };
  };

  const initBlocks = () => {
    const blocks: Block[] = [];
    const groupCount = 3 + Math.floor(Math.random() * 3);

    for (let g = 0; g < groupCount; g++) {
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        blocks.push(createBlock(g));
      }
    }

    blocksRef.current = blocks;
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const targetWidth = vw * 0.06;
    const targetHeight = vw * 0.08;

    blocksRef.current.forEach((block) => {
      block.phaseTime += 16;

      switch (block.phase) {
        case 'line':
          block.opacity = Math.min(block.opacity + 0.02, 0.6);
          block.height = Math.min(block.height + vh * 0.002, vh * 0.02);
          block.y -= block.speed;
          if (block.height >= vh * 0.02) {
            block.phase = 'expand';
            block.phaseTime = 0;
          }
          break;

        case 'expand':
          block.width = Math.min(block.width + vw * 0.002, targetWidth);
          block.height = Math.min(block.height + vh * 0.003, targetHeight);
          block.y -= block.speed;
          if (block.width >= targetWidth && block.height >= targetHeight) {
            block.phase = 'stay';
            block.phaseTime = 0;
          }
          break;

        case 'stay':
          block.y -= block.speed * 0.5;
          if (block.phaseTime > 2000) {
            block.phase = 'shrink';
            block.phaseTime = 0;
          }
          break;

        case 'shrink':
          block.width = Math.max(block.width - vw * 0.003, vw * 0.015);
          block.height = Math.max(block.height - vh * 0.003, vh * 0.01);
          block.y -= block.speed * 0.3;
          block.opacity = Math.max(block.opacity - 0.015, 0);
          if (block.opacity <= 0) {
            block.phase = 'disappear';
            block.phaseTime = 0;
          }
          break;

        case 'disappear':
          if (block.phaseTime > 500) {
            block.phase = 'wait';
            block.phaseTime = 0;
          }
          break;

        case 'wait':
          if (block.phaseTime > 1000 + Math.random() * 2000) {
            block.x = Math.random() * (vw - targetWidth);
            block.y = vh * 0.5 + Math.random() * (vh * 0.5);
            block.width = vw * 0.015;
            block.height = vh * 0.01;
            block.opacity = 0;
            block.phase = 'line';
            block.phaseTime = 0;
          }
          break;
      }

      if (block.opacity > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${block.opacity})`;
        const radius = Math.min(block.width, block.height) * 0.15;
        ctx.beginPath();
        ctx.moveTo(block.x + radius, block.y);
        ctx.lineTo(block.x + block.width - radius, block.y);
        ctx.quadraticCurveTo(block.x + block.width, block.y, block.x + block.width, block.y + radius);
        ctx.lineTo(block.x + block.width, block.y + block.height - radius);
        ctx.quadraticCurveTo(block.x + block.width, block.y + block.height, block.x + block.width - radius, block.y + block.height);
        ctx.lineTo(block.x + radius, block.y + block.height);
        ctx.quadraticCurveTo(block.x, block.y + block.height, block.x, block.y + block.height - radius);
        ctx.lineTo(block.x, block.y + radius);
        ctx.quadraticCurveTo(block.x, block.y, block.x + radius, block.y);
        ctx.closePath();
        ctx.fill();
      }
    });

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    initBlocks();
    animate();

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default FloatingBlocks;