import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SERVICE_AREAS, LOCATIONS } from '../../data/config';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55 },
};

const ServiceAreasSection = () => {
  // Get all towns from SERVICE_AREAS categories
  const allTowns = Object.values(SERVICE_AREAS).flat();
  
  // Sort them alphabetically
  const sortedTowns = [...allTowns].sort((a, b) => a.localeCompare(b));

  // Helper to find slug for a town name
  const getSlug = (townName) => {
    const entry = Object.entries(LOCATIONS).find(([key, val]) => val.city === townName);
    if (entry) {
      // Convert camelCase key to kebab-case
      return entry[0].replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }
    return null;
  };

  return (
    <section className="home-section home-area-section">
      <div className="home-container">
        <motion.div className="home-section-header" {...fadeUp}>
          <div className="home-label">Where We Clean</div>
          <h2>Serving Nassau &amp; Suffolk County, Long Island</h2>
          <p>
            G&G Cleaning serves homeowners and businesses throughout Nassau and Suffolk County. 
            We have dedicated teams for high-value areas, ensuring reliable, high-quality cleaning on your schedule.
          </p>
        </motion.div>
        
        <motion.div 
          className="home-area-grid" 
          {...fadeUp} 
          transition={{ duration: 0.55, delay: 0.1 }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'center',
            marginTop: '40px'
          }}
        >
          {sortedTowns.map(town => {
            const slug = getSlug(town);
            if (slug) {
              return (
                <Link 
                  key={town} 
                  to={`/locations/${slug}`} 
                  className="home-area-chip"
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50px',
                    fontSize: '0.9rem',
                    color: '#fff',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                >
                  {town}
                </Link>
              );
            }
            return (
              <div 
                key={town} 
                className="home-area-chip"
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '50px',
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.6)'
                }}
              >
                {town}
              </div>
            );
          })}
        </motion.div>
        
        <p className="home-area-note" style={{ marginTop: '30px', textAlign: 'center', opacity: 0.7 }}>
          Don't see your town? <Link to="/quote" className="hs-link">Contact us</Link> — we likely serve your area.
        </p>
      </div>
    </section>
  );
};

export default ServiceAreasSection;
