import React from 'react';
import { Link } from 'react-router-dom';
import { SERVICE_AREAS, LOCATIONS } from '../../data/config';
import './TownList.css';

const TownList = () => {
  // Helper to find the slug for a given town name
  const getTownLink = (townName) => {
    const entry = Object.entries(LOCATIONS).find(([key, data]) => data.name === townName);
    if (entry) {
      // Convert camelCase key to kebab-case slug
      const slug = entry[0].replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      return `/locations/${slug}`;
    }
    return '/quote';
  };

  return (
    <div className="town-list-component">
      <div className="town-column">
        <h4>Nassau County</h4>
        <ul>
          {SERVICE_AREAS.nassau.map(town => (
            <li key={town}><Link to={getTownLink(town)}>{town}</Link></li>
          ))}
        </ul>
      </div>
      <div className="town-column">
        <h4>Suffolk County</h4>
        <ul>
          {SERVICE_AREAS.suffolk.map(town => (
            <li key={town}><Link to={getTownLink(town)}>{town}</Link></li>
          ))}
        </ul>
      </div>
      <div className="town-column">
        <h4>More Service Areas</h4>
        <ul>
          {SERVICE_AREAS.general.map(town => (
            <li key={town}><Link to={getTownLink(town)}>{town}</Link></li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TownList;
