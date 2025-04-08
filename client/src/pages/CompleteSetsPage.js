// client/src/pages/CompleteSetsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Import the same images we're using for the series catalog
// You should adjust these paths to match your project structure
import attackOnTitanImg from '../assets/images/attackontitan.jpg';
import deathNoteImg from '../assets/images/deathnote.jpg';
import demonSlayerImg from '../assets/images/demonslayer.jpg';
import narutoImg from '../assets/images/naruto.jpg';

// Image map using the imported assets
const seriesImages = {
  'Attack on Titan': attackOnTitanImg,
  'Death Note': deathNoteImg,
  'Demon Slayer': demonSlayerImg,
  'Naruto': narutoImg,
};

// Mock data for complete sets
const mockCompleteSets = [
  {
    id: 1,
    name: 'Attack on Titan',
    publisher: 'Kodansha Comics',
    volumes: 34,
    status: 'completed',
    condition: 'Good',
    completeSetPrice: 288.71,
    availability: 'In Stock',
    description: 'Complete set of Attack on Titan manga in good condition. All 34 volumes included.',
  },
  {
    id: 2,
    name: 'Death Note',
    publisher: 'VIZ Media',
    volumes: 12,
    status: 'completed',
    condition: 'Like New',
    completeSetPrice: 120.99,
    availability: 'Coming Soon',
    description: 'Complete set of Death Note manga in like new condition. All 12 volumes with black edition covers.',
  },
  {
    id: 3,
    name: 'Demon Slayer',
    publisher: 'VIZ Media',
    volumes: 23,
    status: 'completed',
    condition: 'Good',
    completeSetPrice: 195.30,
    availability: 'Out of Stock',
    description: 'Complete set of Demon Slayer: Kimetsu no Yaiba in good condition. Includes all 23 volumes.',
  },
  {
    id: 4,
    name: 'Naruto',
    publisher: 'VIZ Media',
    volumes: 72,
    status: 'completed',
    condition: 'Acceptable',
    completeSetPrice: 275.00,
    availability: 'In Stock',
    description: 'Complete Naruto manga set (Vol 1-72) in acceptable condition. Some volumes may show slight wear.',
  }
];

const CompleteSetsPage = () => {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  // Simulate data fetching
  useEffect(() => {
    // Simulate API call delay
    const timer = setTimeout(() => {
      setSets(mockCompleteSets);
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // Filtering logic based on availability and search term
  const filteredSets = sets.filter(set => {
    // Availability filter
    const availabilityMatch = 
      availabilityFilter === 'all' || 
      (availabilityFilter === 'in-stock' && set.availability === 'In Stock') ||
      (availabilityFilter === 'coming-soon' && set.availability === 'Coming Soon');
    
    // Search term filter (case-insensitive)
    const searchMatch = !searchTerm || 
      set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      set.publisher.toLowerCase().includes(searchTerm.toLowerCase());
    
    return availabilityMatch && searchMatch;
  });

  // Helper to format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    return `$${parseFloat(value).toFixed(2)}`;
  };

  // Function to get the appropriate image for a series
  const getSeriesImage = (seriesName) => {
    return seriesImages[seriesName] || '';
  };

  // Function to get color based on availability
  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'In Stock':
        return { bg: '#e8f5e9', text: '#2e7d32' }; // Green
      case 'Out of Stock':
        return { bg: '#ffebee', text: '#c62828' }; // Red
      case 'Coming Soon':
        return { bg: '#e3f2fd', text: '#1565c0' }; // Blue
      default:
        return { bg: '#f5f5f5', text: '#616161' }; // Grey
    }
  };

  return (
    <div className="complete-sets-container">
      <h1 style={{ fontSize: '2rem', margin: '2rem 0', color: '#6a1b9a' }}>Complete Manga Sets</h1>

      {/* Filter and Search Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem', 
        flexWrap: 'wrap', 
        gap: '1rem' 
      }}>
        {/* Filter Buttons */}
        <div>
          <button
            onClick={() => setAvailabilityFilter('all')}
            className={`btn ${availabilityFilter === 'all' ? '' : 'btn-secondary'}`}
            style={{ marginRight: '0.5rem' }}
          >
            All
          </button>
          <button
            onClick={() => setAvailabilityFilter('in-stock')}
            className={`btn ${availabilityFilter === 'in-stock' ? '' : 'btn-secondary'}`}
            style={{ marginRight: '0.5rem' }}
          >
            In Stock
          </button>
          <button
            onClick={() => setAvailabilityFilter('coming-soon')}
            className={`btn ${availabilityFilter === 'coming-soon' ? '' : 'btn-secondary'}`}
          >
            Coming Soon
          </button>
        </div>

        {/* Search Input */}
        <div>
          <input
            type="text"
            placeholder="Search complete sets..."
            className="form-control"
            style={{ width: '250px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content Display */}
      {loading ? (
        <div>Loading complete sets...</div>
      ) : (
        <>
          {filteredSets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>No complete sets found matching your criteria.</p>
              <p style={{ marginTop: '1rem', color: '#666' }}>
                We're constantly updating our inventory. Please check back later or modify your search.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {filteredSets.map(set => {
                const availabilityStyle = getAvailabilityColor(set.availability);
                
                return (
                  <div 
                    key={set.id} 
                    className="card" 
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                    {/* Card Header */}
                    <div style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                      <h3 style={{ fontSize: '1.2rem', margin: '0', color: '#6a1b9a' }}>{set.name}</h3>
                      <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.25rem 0 0 0' }}>{set.publisher}</p>
                    </div>
                    
                    {/* Card Content */}
                    <div style={{ display: 'flex', gap: '1rem', padding: '1rem', flex: '1 0 auto' }}>
                      {/* Image Container */}
                      <div style={{ 
                        width: '80px', 
                        height: '120px', 
                        overflow: 'hidden',
                        borderRadius: '4px',
                        backgroundColor: '#f0f0f0',
                        position: 'relative',
                        flexShrink: 0
                      }}>
                        {getSeriesImage(set.name) ? (
                          <img 
                            src={getSeriesImage(set.name)} 
                            alt={set.name} 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              position: 'absolute',
                              top: 0,
                              left: 0
                            }} 
                          />
                        ) : (
                          <div style={{ 
                            width: '100%', 
                            height: '100%', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            padding: '5px',
                            textAlign: 'center',
                            color: '#666'
                          }}>
                            {set.name}
                          </div>
                        )}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        {/* Set Details */}
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ 
                              fontSize: '0.8rem', 
                              background: '#f5f5f5', 
                              padding: '0.2rem 0.5rem', 
                              borderRadius: '4px' 
                            }}>
                              {set.volumes} volumes
                            </span>
                            <span style={{
                              fontSize: '0.8rem',
                              background: '#f0ebff',
                              color: '#6a1b9a',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px'
                            }}>
                              {set.condition}
                            </span>
                          </div>
                          
                          <span style={{
                            display: 'inline-block',
                            fontSize: '0.8rem',
                            background: availabilityStyle.bg,
                            color: availabilityStyle.text,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            marginBottom: '0.5rem'
                          }}>
                            {set.availability}
                          </span>
                        </div>
                        
                        {/* Description */}
                        <p style={{ 
                          fontSize: '0.9rem', 
                          margin: '0.5rem 0',
                          color: '#444',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {set.description}
                        </p>
                      </div>
                    </div>

                    {/* Price and Action Section */}
                    <div style={{ 
                      borderTop: '1px solid #eee', 
                      padding: '1rem', 
                      marginTop: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      {/* Price */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>Complete Set Price:</span>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: '#6a1b9a',
                          fontSize: '1.2rem'
                        }}>
                          {formatCurrency(set.completeSetPrice)}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link
                          to={`/series/${set.id}`}
                          className="btn"
                          style={{ flex: 1, textAlign: 'center' }}
                        >
                          View Details
                        </Link>
                        {set.availability === 'In Stock' ? (
                          <button
                            className="btn btn-primary"
                            style={{ 
                              flex: 1, 
                              backgroundColor: '#6a1b9a',
                              border: 'none',
                              color: 'white',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            onClick={() => alert(`Added ${set.name} complete set to cart!`)}
                          >
                            Add to Cart
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ 
                              flex: 1, 
                              backgroundColor: '#f0f0f0',
                              border: '1px solid #ddd',
                              color: set.availability === 'Coming Soon' ? '#1565c0' : '#bdbdbd',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              cursor: set.availability === 'Coming Soon' ? 'pointer' : 'not-allowed'
                            }}
                            onClick={set.availability === 'Coming Soon' ? 
                              () => alert(`You'll be notified when ${set.name} complete set becomes available!`) : 
                              undefined
                            }
                          >
                            {set.availability === 'Coming Soon' ? 'Notify Me' : 'Out of Stock'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Additional Information Section */}
          <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#f9f5fc', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#6a1b9a', marginBottom: '1rem' }}>About Our Complete Sets</h2>
            <p>
              Our complete manga sets offer the perfect opportunity to own an entire series at once. 
              Each set is carefully inspected to ensure quality and completeness.
            </p>
            <p style={{ marginTop: '0.75rem' }}>
              We offer various condition grades:
            </p>
            <ul style={{ marginTop: '0.5rem' }}>
              <li><strong>Like New</strong>: Minimal to no signs of wear, appears unread</li>
              <li><strong>Good</strong>: May show minor wear, all pages intact and readable</li>
              <li><strong>Acceptable</strong>: Shows visible wear, may have minor markings, but complete and readable</li>
            </ul>
            <p style={{ marginTop: '1rem' }}>
              Don't see the series you're looking for? <Link to="/contact" style={{ color: '#6a1b9a', textDecoration: 'underline' }}>Contact us</Link> and 
              we'll help you find it.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default CompleteSetsPage;