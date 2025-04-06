import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSeries } from '../services/api';

const SeriesCatalogPage = () => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  // Example series data (in a real app, this would come from the API)
  const seriesData = [
    {
      id: 1,
      name: 'Naruto',
      publisher: 'VIZ Media',
      volumes: 72,
      status: 'completed',
      averagePrice: 8.99,
      completeSetPrice: 599.99,
      premium: 0.15,
      image: 'https://via.placeholder.com/150x200'
    },
    {
      id: 2,
      name: 'One Piece',
      publisher: 'VIZ Media',
      volumes: 104,
      status: 'ongoing',
      averagePrice: 9.99,
      completeSetPrice: 920.50,
      premium: 0.18,
      image: 'https://via.placeholder.com/150x200'
    },
    {
      id: 3,
      name: 'Demon Slayer',
      publisher: 'VIZ Media',
      volumes: 23,
      status: 'completed',
      averagePrice: 9.99,
      completeSetPrice: 210.75,
      premium: 0.12,
      image: 'https://via.placeholder.com/150x200'
    },
    {
      id: 4,
      name: 'My Hero Academia',
      publisher: 'VIZ Media',
      volumes: 35,
      status: 'ongoing',
      averagePrice: 9.99,
      completeSetPrice: 310.25,
      premium: 0.14,
      image: 'https://via.placeholder.com/150x200'
    },
    {
      id: 5,
      name: 'Death Note',
      publisher: 'VIZ Media',
      volumes: 12,
      status: 'completed',
      averagePrice: 9.99,
      completeSetPrice: 105.50,
      premium: 0.10,
      image: 'https://via.placeholder.com/150x200'
    },
    {
      id: 6,
      name: 'Attack on Titan',
      publisher: 'Kodansha Comics',
      volumes: 34,
      status: 'completed',
      averagePrice: 10.99,
      completeSetPrice: 340.99,
      premium: 0.15,
      image: 'https://via.placeholder.com/150x200'
    }
  ];
  
  useEffect(() => {
    // In a real app, we would fetch from API
    // const fetchData = async () => {
    //   try {
    //     const response = await fetchSeries();
    //     setSeries(response.data.data);
    //   } catch (error) {
    //     console.error('Error fetching series:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchData();
    
    // Using example data for now
    setSeries(seriesData);
    setLoading(false);
  }, []);
  
  const filteredSeries = filter === 'all' ? series : 
                         filter === 'completed' ? series.filter(s => s.status === 'completed') :
                         series.filter(s => s.status === 'ongoing');
  
  return (
    <div>
      <h1 style={{ fontSize: '2rem', margin: '2rem 0', color: '#6a1b9a' }}>Manga Series Catalog</h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <button 
            onClick={() => setFilter('all')} 
            className={`btn ${filter === 'all' ? '' : 'btn-secondary'}`}
            style={{ marginRight: '0.5rem' }}
          >
            All Series
          </button>
          <button 
            onClick={() => setFilter('completed')} 
            className={`btn ${filter === 'completed' ? '' : 'btn-secondary'}`}
            style={{ marginRight: '0.5rem' }}
          >
            Completed Series
          </button>
          <button 
            onClick={() => setFilter('ongoing')} 
            className={`btn ${filter === 'ongoing' ? '' : 'btn-secondary'}`}
          >
            Ongoing Series
          </button>
        </div>
        
        <div>
          <input 
            type="text" 
            placeholder="Search series..." 
            className="form-control" 
            style={{ width: '250px' }}
          />
        </div>
      </div>
      
      {loading ? (
        <div>Loading series...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredSeries.map(series => (
            <div key={series.id} className="card">
              <div style={{ display: 'flex', gap: '1rem' }}>
                <img src={series.image} alt={series.name} style={{ width: '80px', height: '120px', objectFit: 'cover' }} />
                <div>
                  <h3 className="card-title">{series.name}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>{series.publisher}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      background: '#f5f5f5', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px' 
                    }}>
                      {series.volumes} volumes
                    </span>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      background: series.status === 'completed' ? '#e8f5e9' : '#fff3e0', 
                      color: series.status === 'completed' ? '#2e7d32' : '#e65100',
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px' 
                    }}>
                      {series.status === 'completed' ? 'Completed' : 'Ongoing'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #eee', marginTop: '1rem', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>Avg. Volume Price:</span>
                  <span style={{ fontWeight: '500' }}>${series.averagePrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>Complete Set:</span>
                  <span style={{ fontWeight: 'bold', color: '#6a1b9a' }}>${series.completeSetPrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>Set Premium:</span>
                  <span style={{ color: '#2e7d32', fontWeight: '500' }}>+{(series.premium * 100).toFixed(0)}%</span>
                </div>
                
                <Link 
                  to={`/price-checker?series=${series.id}`} 
                  className="btn btn-block"
                >
                  Check Set Price
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeriesCatalogPage;