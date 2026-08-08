import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import BrandLogo from './brand/BrandLogo';
import './Navbar.css';
import { NAV_LINKS, BUSINESS } from '../data/config';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <BrandLogo variant="horizontal" size="sm" />
        </Link>

        {isQuotePage ? (
          <a href={`tel:${BUSINESS.phone.replace(/[^0-9]/g, '')}`} className="navbar-phone-btn">
            <span className="phone-icon">📞</span>
            <span className="phone-number">{BUSINESS.phone}</span>
          </a>
        ) : (
          <>
            <div className={`navbar-links${mobileOpen ? ' navbar-links--open' : ''}`}>
              <div className="navbar-geo-pill">
                📍 Serving Nassau & Suffolk Counties, Long Island
              </div>
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
