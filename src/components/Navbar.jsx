import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import BrandLogo from './brand/BrandLogo';
import './Navbar.css';
import { NAV_LINKS, BUSINESS } from '../data/config';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isQuotePage = location.pathname === '/quote';

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      {showBanner && (
        <div style={{
          backgroundColor: '#F4A7B9',
          color: '#2D2D2D',
          fontSize: '14px',
          textAlign: 'center',
          padding: '10px',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: '500'
        }}>
          <span style={{ padding: '0 30px' }}>
            <a href="/mothers-day-gift/" style={{ color: '#2D2D2D', textDecoration: 'none' }}>
              🌸 <strong>Mother's Day Special:</strong> Give Mom the gift of a spotless home! <span style={{ textDecoration: 'underline' }}>View our 3-tier gift packages →</span>
            </a>
          </span>
          <button 
            onClick={() => setShowBanner(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2D2D2D',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              position: 'absolute',
              right: '15px'
            }}
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      )}
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <BrandLogo variant="horizontal" size="sm" />
        </Link>

        {isQuotePage ? (
          <a href="tel:5162988323" className="navbar-phone-btn">
            <span className="phone-icon">📞</span>
            <span className="phone-number">516-298-8323</span>
          </a>
        ) : (
          <>
            <div className={`navbar-links${mobileOpen ? ' navbar-links--open' : ''}`}>
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `navbar-link${link.isHighlight ? ' navbar-link--cta' : ''}${isActive ? ' navbar-link--active' : ''}`
                  }
                  end={link.path === '/'}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            <button
              className={`navbar-hamburger${mobileOpen ? ' navbar-hamburger--open' : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <span /><span /><span />
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
