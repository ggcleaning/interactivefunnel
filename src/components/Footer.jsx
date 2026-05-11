import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import BrandLogo from './brand/BrandLogo';
import TownList from './modular/TownList';
import './Footer.css';
import { BUSINESS } from '../data/config';

const Footer = ({ onOpenPrivacy, onOpenTerms, onOpenEstimate }) => {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-content">
        <div className="footer-column">
          <div className="footer-brand">
            <div style={{ background: '#ffffff', padding: '15px 25px', borderRadius: '8px', display: 'inline-block', marginBottom: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
               <BrandLogo variant="horizontal" size="md" />
            </div>
            <p className="footer-tagline">Family-owned and operated. Dedicated to providing the highest quality residential and commercial cleaning services on Long Island.</p>
          </div>
        </div>

        <div className="footer-column">
          <h3>Quick Links</h3>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/services">Services</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/plans">Recurring Plans</Link>
            <Link to="/reviews">Client Reviews</Link>
            <Link to="/commercial">Commercial</Link>
            <button
              onClick={onOpenEstimate}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-light)', padding: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', transition: 'color 0.2s' }}
              onMouseOver={(e) => e.target.style.color = 'var(--color-secondary, #c9a84c)'}
              onMouseOut={(e) => e.target.style.color = 'var(--color-text-light)'}
            >
              Get a Quote
            </button>
            <button
              onClick={onOpenPrivacy}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-light)', padding: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', transition: 'color 0.2s' }}
              onMouseOver={(e) => e.target.style.color = 'var(--color-secondary, #c9a84c)'}
              onMouseOut={(e) => e.target.style.color = 'var(--color-text-light)'}
            >
              Privacy Policy
            </button>
            <button
              onClick={onOpenTerms}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-light)', padding: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', transition: 'color 0.2s' }}
              onMouseOver={(e) => e.target.style.color = 'var(--color-secondary, #c9a84c)'}
              onMouseOut={(e) => e.target.style.color = 'var(--color-text-light)'}
            >
              Terms of Service
            </button>
          </div>
        </div>

        <div className="footer-column">
          <h3>Services</h3>
          <div className="footer-links">
            <Link to="/services">Residential Cleaning</Link>
            <Link to="/services">Deep Cleaning</Link>
            <Link to="/services/deep-cleaning-checklist">Deep Cleaning Checklist</Link>
            <Link to="/services">Move-In / Move-Out</Link>
            <Link to="/commercial">Commercial Offices</Link>
            <Link to="/plans">Recurring Plans</Link>
          </div>
        </div>

        <div className="footer-column">
          <h3>Contact Us</h3>
          <div className="footer-contact-item">
            <Phone size={18} color="var(--color-secondary, #c9a84c)" />
            <a href={`tel:${BUSINESS.phone.replace(/[^0-9]/g, '')}`} style={{ color: 'inherit', textDecoration: 'none' }}>{BUSINESS.phone.replace('+1 ', '')}</a>
          </div>
          <div className="footer-contact-item">
            <Mail size={18} color="var(--color-secondary, #c9a84c)" />
            <span>{BUSINESS.email}</span>
          </div>
          <div className="footer-contact-item" style={{ alignItems: 'flex-start' }}>
            <MapPin size={18} color="var(--color-secondary, #c9a84c)" style={{ marginTop: '4px' }} />
            <div>
              <div style={{ lineHeight: '1.4' }}>{BUSINESS.address.street}</div>
              <div style={{ lineHeight: '1.4' }}>{BUSINESS.address.city}, {BUSINESS.address.state} {BUSINESS.address.zip}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <a
              href="https://www.facebook.com/ggcleaningli"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GG Cleaning on Facebook"
              style={{ color: 'var(--color-secondary, #c9a84c)', fontSize: '0.85rem', textDecoration: 'none', border: '1px solid var(--color-secondary, #c9a84c)', borderRadius: '6px', padding: '4px 10px' }}
            >
              Facebook
            </a>
            <a
              href="https://www.instagram.com/ggcleaningli"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GG Cleaning on Instagram"
              style={{ color: 'var(--color-secondary, #c9a84c)', fontSize: '0.85rem', textDecoration: 'none', border: '1px solid var(--color-secondary, #c9a84c)', borderRadius: '6px', padding: '4px 10px' }}
            >
              Instagram
            </a>
          </div>
        </div>
      </div>

      <div className="footer-service-areas" style={{ padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '40px' }}>
        <div className="footer-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <TownList />
        </div>
      </div>

      <div className="footer-seo-line">
        House Cleaning Long Island
        &nbsp;|&nbsp; Cleaning Services Nassau County
        &nbsp;|&nbsp; Cleaning Services Suffolk County
      </div>

      <div className="copyright">
        &copy; {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.
        <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '8px', maxWidth: '600px', margin: '8px auto 0' }}>
          We improve our products and advertising by using Microsoft Clarity to see how you use our website. By using our site, you agree that we and Microsoft can collect and use this data.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
