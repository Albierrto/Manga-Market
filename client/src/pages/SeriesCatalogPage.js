// client/src/pages/SeriesCatalogPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSeries } from '../services/api';

// Import your images directly - adjust the paths as needed for your project structure
// These should point to files in your src directory, not public
import attackOnTitanImg from '../assets/images/attackontitan.jpg';
import deathNoteImg from '../assets/images/deathnote.jpg';
import demonSlayerImg from '../assets/images/demonslayer.jpg';
import myHeroAcademiaImg from '../assets/images/myheroacademia.jpg';
import narutoImg from '../assets/images/naruto.jpg';
import onePieceImg from '../assets/images/onepiece.jpg';
// Add any other series images you need

// Image map using the imported assets
const seriesImages = {
  'Attack on Titan': attackOnTitanImg,
  'Death Note': deathNoteImg,
  'Demon Slayer': demonSlayerImg,
  'My Hero Academia': myHeroAcademiaImg,
  'Naruto': narutoImg,
  'One Piece': onePieceImg,
  // Add others as needed
};

const SeriesCatalogPage = () => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadSeries = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchSeries();
        if (response.data && response.data.success) {
          setSeries(response.data.data);
        } else {
          throw new Error(response.data?.message || 'Failed to fetch series');
        }
      } catch (err) {
        console.error("Error loading series data:", err);
        setError(err.message || 'Could not load series catalog.');
      } finally {
        setLoading(false);
      }
    };

    loadSeries();
  }, []);

  // Filtering logic
  const filteredSeries = series.filter(s => {
    const statusMatch = filter === 'all' || s.status === filter;
    const searchMatch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
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
    return seriesImages[seriesName] || ''; // Return empty string if no image found
  };

  return (
    <div className="series-catalog-container">
      <h1 style={{ fontSize: '2rem', margin: '2rem 0', color: '#6a1b9a' }}>Manga Series Catalog</h1>

      {/* Filter and Search Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Filter Buttons */}
        <div>
          <button
            onClick={() => setFilter('all')}
            className={`btn ${filter === 'all' ? '' : 'btn-secondary'}`}
            style={{ marginRight: '0.5rem' }}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`btn ${filter === 'completed' ? '' : 'btn-secondary'}`}
            style={{ marginRight: '0.5rem' }}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('ongoing')}
            className={`btn ${filter === 'ongoing' ? '' : 'btn-secondary'}`}
          >
            Ongoing
          </button>
        </div>

        {/* Search Input */}
        <div>
          <input
            type="text"
            placeholder="Search series..."
            className="form-control"
            style={{ width: '250px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Loading/Error/Content Display */}
      {loading ? (
        <div>Loading series...</div>
      ) : error ? (
        <div className="alert bg-danger text-white p-3">Error: {error}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredSeries.length > 0 ? filteredSeries.map(s => (
            <div key={s.id} className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Card Content */}
              <div style={{ display: 'flex', gap: '1rem', padding: '1rem', flex: '1 0 auto' }}>
                {/* Image Container with Fixed Dimensions */}
                <div style={{ 
                  width: '80px', 
                  height: '120px', 
                  overflow: 'hidden',
                  borderRadius: '4px',
                  backgroundColor: '#f0f0f0',
                  position: 'relative',
                  flexShrink: 0
                }}>
                  <Link to={`/series/${s.id}`}>
                    {getSeriesImage(s.name) ? (
                      <img 
                        src={getSeriesImage(s.name)} 
                        alt={s.name} 
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
                        {s.name}
                      </div>
                    )}
                  </Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Link to={`/series/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 className="card-title" style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{s.name}</h3>
                  </Link>
                  <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>{s.publisher}</p>
                  {/* Tags for Volumes and Status */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', background: '#f5f5f5', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {s.volumes} volumes
                    </span>
                    <span style={{
                      fontSize: '0.8rem',
                      background: s.status === 'completed' ? '#e8f5e9' : '#fff3e0',
                      color: s.status === 'completed' ? '#2e7d32' : '#e65100',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      {s.status === 'completed' ? 'Completed' : 'Ongoing'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing Info Section */}
              <div style={{ borderTop: '1px solid #eee', padding: '1rem', marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>Avg. Vol Price (Good):</span>
                  <span style={{ fontWeight: '500' }}>{formatCurrency(s.averagePricePerVolGood)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>Est. Set (Good):</span>
                  <span style={{ fontWeight: 'bold', color: '#6a1b9a' }}>{formatCurrency(s.completeSetPriceGood)}</span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    to={`/series/${s.id}`}
                    className="btn"
                    style={{ flex: 1, textAlign: 'center' }}
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/price-checker?seriesName=${encodeURIComponent(s.name)}`}
                    className="btn btn-secondary"
                    style={{ flex: 1, textAlign: 'center' }}
                  >
                    Check Price
                  </Link>
                </div>
              </div>
            </div>
          )) : (
            <p>No series found matching your criteria.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SeriesCatalogPage;