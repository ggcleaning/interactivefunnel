import React from 'react';
import './BrandLogo.css';

/**
 * Premium G&G Cleaning Services Logo Component
 * Exactly matching the Ultra-Premium Figma designs.
 * 
 * @param {Object} props
 * @param {string} props.variant - 'horizontal', 'stacked', 'icon-only', 'reverse'
 * @param {string} props.size - 'sm', 'md', 'lg'
 * @param {string} props.className - Additional CSS classes
 */
const BrandLogo = ({ variant = 'horizontal', size = 'md', className = '' }) => {
  const isReverse = variant === 'reverse';
  
  const LogoIcon = () => (
    <svg viewBox="0 0 200 160" className="brand-logo__svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: isReverse ? '#FFFFFF' : '#6B3B9C', stopOpacity: 1 }} />
          <stop offset="40%" style={{ stopColor: isReverse ? '#FFFFFF' : '#4B2372', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: isReverse ? '#FFFFFF' : '#2D114A', stopOpacity: 1 }} />
        </linearGradient>
        
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#B8941E', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#B8941E', stopOpacity: 1 }} />
        </linearGradient>
        
        <linearGradient id="windowGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: isReverse ? 'rgba(255,255,255,0.95)' : '#E8F4FF', stopOpacity: 0.9 }} />
          <stop offset="50%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.95 }} />
          <stop offset="100%" style={{ stopColor: isReverse ? 'rgba(255,255,255,0.85)' : '#D4E9FF', stopOpacity: 0.9 }} />
        </linearGradient>

        <radialGradient id="windowShine">
          <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 1 }} />
          <stop offset="60%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.4 }} />
          <stop offset="100%" style={{ stopColor: '#FFFFFF', stopOpacity: 0 }} />
        </radialGradient>

        <radialGradient id="glossGradient">
          <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.6 }} />
          <stop offset="50%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.25 }} />
          <stop offset="100%" style={{ stopColor: '#FFFFFF', stopOpacity: 0 }} />
        </radialGradient>

        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="sparkleGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* LEFT G */}
      <g>
        <path
          d="M 60 25 C 35 25, 15 45, 15 70 C 15 95, 35 115, 60 115 C 70 115, 79 112, 86 107 L 86 85 C 81 88, 73 90, 65 90 C 48 90, 35 77, 35 70 C 35 58, 45 45, 60 45 C 72 45, 82 53, 85 63 L 85 80 L 65 80 L 65 95 L 100 95 L 100 65 C 98 42, 81 25, 60 25 Z"
          fill="url(#gGradient)"
        />
        <circle cx="50" cy="55" r="15" fill="url(#glossGradient)" />
      </g>

      {/* RIGHT G */}
      <g>
        <path
          d="M 140 25 C 165 25, 185 45, 185 70 C 185 95, 165 115, 140 115 C 130 115, 121 112, 114 107 L 114 85 C 119 88, 127 90, 135 90 C 152 90, 165 77, 165 70 C 165 58, 155 45, 140 45 C 128 45, 118 53, 115 63 L 115 80 L 135 80 L 135 95 L 100 95 L 100 65 C 102 42, 119 25, 140 25 Z"
          fill="url(#gGradient)"
        />
        <circle cx="150" cy="55" r="15" fill="url(#glossGradient)" />
      </g>

      {/* WINDOW */}
      <g>
        <rect x="78" y="35" width="44" height="70" rx="3" fill="url(#goldGradient)" />
        <rect x="82" y="39" width="36" height="62" rx="2" fill="url(#windowGlass)" />
        <rect x="99" y="39" width="2" height="62" fill="url(#goldGradient)" opacity="0.7" />
        <rect x="82" y="69" width="36" height="2" fill="url(#goldGradient)" opacity="0.7" />
        <ellipse cx="92" cy="55" rx="12" ry="18" fill="url(#windowShine)" />
        <ellipse cx="108" cy="85" rx="8" ry="12" fill="url(#windowShine)" />
      </g>

      {/* SPARKLES */}
      <g fill="url(#goldGradient)" filter="url(#sparkleGlow)">
        <path d="M 70,30 L 72,34 L 76,36 L 72,38 L 70,42 L 68,38 L 64,36 L 68,34 Z" />
        <path d="M 130,30 L 132,34 L 136,36 L 132,38 L 130,42 L 128,38 L 124,36 L 128,34 Z" />
        <path d="M 100,22 L 102.5,27 L 107.5,29.5 L 102.5,32 L 100,37 L 97.5,32 L 92.5,29.5 L 97.5,27 Z" />
        <path d="M 70,108 L 72,112 L 76,114 L 72,116 L 70,120 L 68,116 L 64,114 L 68,112 Z" opacity="0.95" />
        <path d="M 130,108 L 132,112 L 136,114 L 132,116 L 130,120 L 128,116 L 124,114 L 128,112 Z" opacity="0.95" />
      </g>
      
      {/* MOP */}
      <g>
        <rect x="98" y="125" width="4" height="25" rx="2" fill="url(#goldGradient)" />
        <ellipse cx="100" cy="149" rx="14" ry="4.5" fill="url(#goldGradient)" opacity="0.9" />
      </g>
    </svg>
  );

  return (
    <div className={`brand-logo brand-logo--${variant} brand-logo--${size} ${className}`}>
      <div className="brand-logo__icon">
        <LogoIcon />
      </div>
      
      {variant !== 'icon-only' && (
        <div className="brand-logo__content">
          <h1 className="brand-logo__title">G&G</h1>
          <h2 className="brand-logo__subtitle">CLEANING</h2>
          <div className="brand-logo__divider">
            <div className="brand-logo__line"></div>
            <span className="brand-logo__services">SERVICES</span>
            <div className="brand-logo__line"></div>
          </div>
          <p className="brand-logo__tagline">Family Owned & Operated</p>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
