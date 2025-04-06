import React, { useState, useEffect } from 'react';
import { getMangaPrices } from '../services/api';

const PriceCheckerPage = () => {
  const [formData, setFormData] = useState({
    series: '',
    startVolume: 1,
    endVolume: '',
    totalVolumes: '',
    condition: 'good'
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const volumes = `${formData.startVolume}-${formData.endVolume}`;
      const totalVolumes = formData.totalVolumes || 
                          (parseInt(formData.endVolume) - parseInt(formData.startVolume) + 1);
      
      const response = await getMangaPrices(
        formData.series, 
        volumes,
        totalVolumes
      );
      
      setResult(response.data);
    } catch (err) {
      console.error('Error fetching price data:', err);
      setError(err.response?.data?.message || 'Error fetching price data');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="section">
      <div className="container">
        <h1 className="section-title">Manga Set Price Checker</h1>
        
        <div className="row">
          <div className="col-8 col-md-12">
            <div className="card p-4">
              <h2 className="mb-4">Check Your Collection's Value</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Manga Series</label>
                  <input 
                    type="text"
                    name="series" 
                    value={formData.series} 
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter a manga series name (e.g. Naruto)"
                    required
                  />
                </div>
                
                <div className="row mb-3">
                  <div className="col-4">
                    <label className="form-label">Start Volume</label>
                    <input 
                      type="number" 
                      name="startVolume" 
                      value={formData.startVolume} 
                      onChange={handleChange}
                      className="form-control"
                      min="1"
                      required
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label">End Volume</label>
                    <input 
                      type="number" 
                      name="endVolume" 
                      value={formData.endVolume} 
                      onChange={handleChange}
                      className="form-control"
                      min={formData.startVolume || 1}
                      required
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label">Total Volumes (Optional)</label>
                    <input 
                      type="number" 
                      name="totalVolumes" 
                      value={formData.totalVolumes} 
                      onChange={handleChange}
                      className="form-control"
                      placeholder="If different from range"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="form-label">Condition</label>
                  <select 
                    name="condition" 
                    value={formData.condition} 
                    onChange={handleChange}
                    className="form-control"
                  >
                    <option value="like_new">Like New</option>
                    <option value="very_good">Very Good</option>
                    <option value="good">Good</option>
                    <option value="acceptable">Acceptable</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-lg btn-block" 
                  disabled={loading}
                >
                  {loading ? 'Checking Prices...' : 'Check Price'}
                </button>
                
                {error && (
                  <div className="alert bg-danger text-white mt-3 p-3">
                    {error}
                  </div>
                )}
              </form>
            </div>
          </div>
          
          <div className="col-4 col-md-12">
            {result ? (
              <div className="card p-4">
                <h2 className="mb-3">Price Analysis</h2>
                
                <div className="price-result">
                  <div className="mb-2">
                    <strong>{result.series}</strong> {result.volumes && `(Vol. ${result.volumes})`}
                  </div>
                  
                  <div className="d-flex justify-between align-center mb-3">
                    <span>Complete Set:</span>
                    <span className="price-value">${result.data.averageSetPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="d-flex justify-between align-center mb-3">
                    <span>Price Per Volume:</span>
                    <span className="price-value">${result.data.pricePerVolume.toFixed(2)}</span>
                  </div>
                  
                  <div className="d-flex justify-between align-center mb-4">
                    <span>Recent Price Trend:</span>
                    <span className={`${result.data.priceTrend > 0 ? 'text-success' : 'text-danger'}`}>
                      {result.data.priceTrend > 0 ? '+' : ''}{result.data.priceTrend.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="text-sm mb-2">
                    Based on {result.data.numberOfListings} recent sales
                  </div>
                </div>
                
                {result.data.recentSales && result.data.recentSales.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-3">Recent Sales</h3>
                    <div className="recent-sales">
                      {result.data.recentSales.map((sale, index) => (
                        <div key={index} className="card mb-2 p-2">
                          <div className="text-sm mb-1 text-truncate">{sale.title}</div>
                          <div className="d-flex justify-between">
                            <span>${sale.price.toFixed(2)}</span>
                            <span className="text-sm">{new Date(sale.endTime).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-4">
                <h3 className="mb-3">How It Works</h3>
                <ol style={{ paddingLeft: '1.5rem' }}>
                  <li className="mb-2">Enter your manga series name</li>
                  <li className="mb-2">Specify the volume range you're interested in</li>
                  <li className="mb-2">Select the condition</li>
                  <li className="mb-2">Get real market data from recent sales</li>
                </ol>
                <p className="mt-3">Our algorithm analyzes eBay sold listings to calculate accurate prices for both complete sets and per-volume values.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceCheckerPage;