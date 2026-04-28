import React from 'react';
import { Link } from 'react-router-dom';
import { SERVICE_AREAS } from '../../data/config';
import './TownList.css';

const TownList = () => {
  const getTownLink = (town) => {
    // Map specific towns to their SEO landing pages
    const slugMap = {
      'Garden City': '/locations/garden-city',
      'Manhasset': '/locations/manhasset',
      'Dix Hills': '/locations/dix-hills',
    };
    return slugMap[town] || '/quote';
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
        <h4>Other Areas</h4>
        <ul>
          {SERVICE_AREAS.general.slice(0, 6).map(town => (
            <li key={town}><Link to={getTownLink(town)}>{town}</Link></li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TownList;
