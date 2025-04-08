// client/src/pages/VolumeDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const VolumeDetailPage = () => {
  const { seriesId, volumeId } = useParams();
  const navigate = useNavigate();
  const [volume, setVolume] = useState(null);
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // For now, we'll load mock data based on the IDs
    // In a real app, this would fetch from your API
    const seriesData = getMockSeriesData(parseInt(seriesId));
    if (!seriesData) {
      navigate('/series');
      return;
    }
    
    const volumeNumber = parseInt(volumeId);
    if (isNaN(volumeNumber) || volumeNumber < 1 || volumeNumber > seriesData.volumes) {
      navigate(`/series/${seriesId}`);
      return;
    }
    
    // Create mock volume data
    const volumeData = {
      id: volumeNumber,
      number: volumeNumber,
      title: `${seriesData.name} Volume ${volumeNumber}`,
      image: seriesData.image, // Use the series image
      isbn: `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      releaseDate: new Date(2010 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      price: seriesData.averagePrice,
      pages: 180 + Math.floor(Math.random() * 40),
      summary: `Volume ${volumeNumber} of ${seriesData.name} continues the exciting story. This volume features intense battles, character development, and plot twists that fans have come to expect from this popular series.`
    };
    
    setSeries(seriesData);
    setVolume(volumeData);
    setLoading(false);
  }, [seriesId, volumeId, navigate]);
  
  if (loading) {
    return (
      <div className="section">
        <div className="container">
          <div className="text-center p-5">Loading volume details...</div>
        </div>
      </div>
    );
  }
  
  if (!volume || !series) {
    return (
      <div className="section">
        <div className="container">
          <div className="text-center p-5">Volume not found.</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="section">
      <div className="container">
        <div className="breadcrumb mb-4">
          <Link to="/">Home</Link> &gt; 
          <Link to="/series">Series</Link> &gt; 
          <Link to={`/series/${seriesId}`}>{series.name}</Link> &gt; 
          <span>Volume {volume.number}</span>
        </div>
        
        <div className="row">
          <div className="col-4 col-md-12 mb-4">
            <div className="card p-0 overflow-hidden">
              <img 
                src={volume.image} 
                alt={volume.title} 
                className="w-100"
                style={{ height: '500px', objectFit: 'cover' }}
              />
              <div className="overlay-text" style={{ 
                position: 'absolute', 
                bottom: '20px', 
                left: '0', 
                right: '0', 
                textAlign: 'center', 
                background: 'rgba(0,0,0,0.7)', 
                color: 'white', 
                padding: '10px',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                Volume {volume.number}
              </div>
            </div>
            
            <div className="mt-4 volume-navigation">
              <div className="d-flex justify-between">
                {volume.number > 1 && (
                  <Link to={`/series/${seriesId}/volume/${volume.number - 1}`} className="btn btn-secondary">
                    &larr; Previous Volume
                  </Link>
                )}
                {volume.number < series.volumes && (
                  <Link to={`/series/${seriesId}/volume/${volume.number + 1}`} className="btn">
                    Next Volume &rarr;
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-8 col-md-12">
            <div className="card p-4 mb-4">
              <h1 className="mb-3">{volume.title}</h1>
              <div className="volume-details">
                <div className="detail-row">
                  <span className="detail-label">Series:</span>
                  <span className="detail-value">
                    <Link to={`/series/${seriesId}`}>{series.name}</Link>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Volume Number:</span>
                  <span className="detail-value">{volume.number} of {series.volumes}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">ISBN:</span>
                  <span className="detail-value">{volume.isbn}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Release Date:</span>
                  <span className="detail-value">{new Date(volume.releaseDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Pages:</span>
                  <span className="detail-value">{volume.pages}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Publisher:</span>
                  <span className="detail-value">{series.publisher}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Retail Price:</span>
                  <span className="detail-value">${volume.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="card p-4 mb-4">
              <h2 className="mb-3">Volume Summary</h2>
              <p style={{ lineHeight: 1.6 }}>{volume.summary}</p>
            </div>
            
            <div className="card p-4">
              <h2 className="mb-3">Market Information</h2>
              <div className="price-info mb-4">
                <div className="d-flex justify-between mb-2">
                  <span>Retail Price:</span>
                  <span className="font-weight-bold">${volume.price.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-between mb-2">
                  <span>Market Price:</span>
                  <span className="font-weight-bold text-primary">${(volume.price * (0.9 + Math.random() * 0.4)).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-between mb-2">
                  <span>Price Trend:</span>
                  <span className={`font-weight-bold ${Math.random() > 0.5 ? 'text-success' : 'text-danger'}`}>
                    {Math.random() > 0.5 ? '+' : '-'}{(Math.random() * 10).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="d-flex gap-2">
                <Link 
                  to={`/price-checker?series=${seriesId}&volume=${volume.number}`} 
                  className="btn"
                  style={{ flex: 1 }}
                >
                  Check Current Price
                </Link>
                <Link 
                  to={`/sell?series=${seriesId}&volume=${volume.number}`} 
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Sell This Volume
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock data function - in a real app, this would be fetched from your API
function getMockSeriesData(id) {
  const seriesData = {
    1: {
      id: 1,
      name: 'Naruto',
      publisher: 'VIZ Media',
      volumes: 72,
      status: 'completed',
      averagePrice: 8.99,
      completeSetPrice: 599.99,
      premium: 0.15,
      image: '/images/naruto.jpg'
    },
    2: {
      id: 2,
      name: 'One Piece',
      publisher: 'VIZ Media',
      volumes: 104,
      status: 'ongoing',
      averagePrice: 9.99,
      completeSetPrice: 920.50,
      premium: 0.18,
      image: '/images/onepiece.jpg'
    },
    3: {
      id: 3,
      name: 'Demon Slayer',
      publisher: 'VIZ Media',
      volumes: 23,
      status: 'completed',
      averagePrice: 9.99,
      completeSetPrice: 210.75,
      premium: 0.12,
      image: '/images/demonslayer.jpg'
    },
    4: {
      id: 4,
      name: 'My Hero Academia',
      publisher: 'VIZ Media',
      volumes: 35,
      status: 'ongoing',
      averagePrice: 9.99,
      completeSetPrice: 310.25,
      premium: 0.14,
      image: '/images/myhero.jpg'
    },
    5: {
      id: 5,
      name: 'Death Note',
      publisher: 'VIZ Media',
      volumes: 12,
      status: 'completed',
      averagePrice: 9.99,
      completeSetPrice: 105.50,
      premium: 0.10,
      image: '/images/deathnote.jpg'
    },
    6: {
      id: 6,
      name: 'Attack on Titan',
      publisher: 'Kodansha Comics',
      volumes: 34,
      status: 'completed',
      averagePrice: 10.99,
      completeSetPrice: 340.99,
      premium: 0.15,
      image: '/images/attackontitan.jpg'
    }
  };
  
  return seriesData[id] || null;
}

export default VolumeDetailPage;