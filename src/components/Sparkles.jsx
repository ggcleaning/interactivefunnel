import React, { useEffect, useState } from 'react';
import './Sparkles.css';

const Sparkles = () => {
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    const handleClick = (e) => {
      // Check if we clicked on a button, link, or elements acting as buttons
      const isClickable = e.target.closest('button') || 
                          e.target.closest('a') || 
                          e.target.closest('.hs-link') ||
                          e.target.closest('.pp-pkg-cta') ||
                          e.target.closest('.btn-primary');
                          
      if (!isClickable) return;

      // Generate 3-5 little sparkles per click
      const numSparkles = Math.floor(Math.random() * 3) + 3;
      const newSparkles = Array.from({ length: numSparkles }).map(() => {
        const distance = 30 + Math.random() * 40;
        const angle = Math.random() * Math.PI * 2;
        return {
          id: Date.now() + Math.random(),
          x: e.clientX,
          y: e.clientY,
          tx: `${Math.cos(angle) * distance}px`,
          ty: `${Math.sin(angle) * distance}px`,
          delay: Math.random() * 0.15
        };
      });

      setSparkles(prev => [...prev.slice(-15), ...newSparkles]);
      
      // Cleanup after animation
      setTimeout(() => {
        setSparkles(prev => prev.filter(s => !newSparkles.find(ns => ns.id === s.id)));
      }, 1000);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="sparkles-container">
      {sparkles.map(s => (
        <div 
          key={s.id} 
          className="sparkle-particle" 
          style={{ 
            left: s.x, 
            top: s.y,
            '--tx': s.tx,
            '--ty': s.ty,
            animationDelay: `${s.delay}s`
          }}
        >
          ✨
        </div>
      ))}
    </div>
  );
};

export default Sparkles;
