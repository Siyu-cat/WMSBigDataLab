import React, { useEffect, useRef } from 'react';

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  speed: number;
  phase: 'line' | 'expand' | 'pause1' | 'float' | 'pause2' | 'shrink' | 'disappear' | 'wait';
  phaseTime: number;
  group: number;
  delay: number;
  targetWidth: number;
  targetHeight: number;
}

const getCanvasWidth = () => window.innerWidth;

const getGroupXRange = (group: number, canvasWidth: number): { min: number; max: number } => {
  const sectionWidth = canvasWidth / 3;
  const blockWidth = group === 1 ? 120 : group === 2 ? 110 : 100;

  switch (group) {
    case 0:  // AB 区域
      return { min: 0, max: sectionWidth * 2 - blockWidth };
    case 1:  // BC 区域
      return { min: sectionWidth, max: canvasWidth - blockWidth };
    case 2:  // 全页
      return { min: 0, max: canvasWidth - blockWidth };
    default:
      return { min: 0, max: canvasWidth - blockWidth };
  }
};

const FloatingBlocks: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blocksRef = useRef<Block[]>([]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const createBlock = (group: number): Block => {
    const vh = window.innerHeight;
    const canvasWidth = getCanvasWidth();
    const { min, max } = getGroupXRange(group, canvasWidth);

    const baseHeight = 2;
    const tw = group === 2 ? 90 + Math.floor(Math.random() * 21) : group === 1 ? 120 : 100;
    const th = group === 2 ? 30 + Math.floor(Math.random() * 21) : group === 1 ? 60 : 40;

    return {
      x: min + Math.random() * (max - min),
      y: vh * (1/3) + Math.random() * (vh * (2/3)),
      width: tw,
      height: baseHeight,
      opacity: 0,
      speed: 3.2,
      phase: 'line',
      phaseTime: 0,
      group,
      delay: group * 2000,
      targetWidth: tw,
      targetHeight: th,
    };
  };

  const initBlocks = () => {
    const blocks: Block[] = [];
    const groupCount = 3;

    for (let g = 0; g < groupCount; g++) {
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        blocks.push(createBlock(g));
      }
    }

    blocksRef.current = blocks;
  };

  const animate = (timestamp: number) => {
    const delta = lastTimeRef.current === 0 ? 16 : Math.min(timestamp - lastTimeRef.current, 50);
    lastTimeRef.current = timestamp;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = getCanvasWidth();
    canvas.width = canvasWidth;
    canvas.height = window.innerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const vh = window.innerHeight;

    blocksRef.current.forEach((block) => {
      block.phaseTime += delta;

      if (block.phaseTime < block.delay) return;

      switch (block.phase) {
        case 'line':
          const maxOpacity = block.group === 2 ? 0.2 : 0.1;
          block.opacity = Math.min(block.opacity + 0.02 * (delta / 16), maxOpacity);
          if (block.phaseTime > 200) {
            block.phase = 'expand';
            block.phaseTime = 0;
          }
          break;

        case 'expand':
          block.width = block.targetWidth;
          const expandDelta = 2 * (delta / 16);
          block.height = Math.min(block.height + expandDelta, block.targetHeight);
          block.y -= expandDelta / 2;
          if (block.height >= block.targetHeight) {
            block.phase = 'pause1';
            block.phaseTime = 0;
          }
          break;

        case 'pause1':
          if (block.phaseTime > 500) {
            block.phase = 'float';
            block.phaseTime = 0;
          }
          break;

        case 'float':
          block.y -= block.speed * (delta / 16);
          if (block.phaseTime > 500) {
            block.phase = 'pause2';
            block.phaseTime = 0;
          }
          break;

        case 'pause2':
          if (block.phaseTime > 500) {
            block.phase = 'shrink';
            block.phaseTime = 0;
          }
          break;

        case 'shrink':
          block.width = block.targetWidth;
          const shrinkDelta = 2 * (delta / 16);
          block.height = Math.max(block.height - shrinkDelta, 2);
          block.y += shrinkDelta / 2;
          if (block.height <= 4) {
            block.opacity = Math.max(block.opacity - 0.02 * (delta / 16), 0);
          }
          if (block.height <= 2) {
            block.opacity = 0;
            block.phase = 'wait';
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
          if (block.phaseTime > 2000) {
            const { min, max } = getGroupXRange(block.group, canvasWidth);
            block.x = min + Math.random() * (max - min);
            block.y = vh * 0.5 + Math.random() * (vh * 0.5);
            block.width = block.targetWidth;
            block.height = 2;
            block.opacity = 0;
            block.phase = 'line';
            block.phaseTime = 0;
            block.delay = 0;
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
    animationRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = getCanvasWidth();
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
