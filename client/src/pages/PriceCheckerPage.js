import React, { useState } from 'react';
// Import the updated getMangaPrices function
import { getMangaPrices } from '../services/api';

const PriceCheckerPage = () => {
  const [formData, setFormData] = useState({
    series: '',
    startVolume: '',
    endVolume: '',
    condition: 'good'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Basic validation: ensure endVolume >= startVolume if both exist
    if (name === 'startVolume' || name === 'endVolume') {
        const start = name === 'startVolume' ? parseInt(value, 10) : parseInt(formData.startVolume, 10);
        const end = name === 'endVolume' ? parseInt(value, 10) : parseInt(formData.endVolume, 10);
        if (!isNaN(start) && !isNaN(end) && start > end) {
             // Optionally reset endVolume or show a validation message
             // For simplicity, let's just allow it for now, backend might catch range error
        }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null); // Clear previous results

    // Ensure volumes are numbers
    const startVol = parseInt(formData.startVolume, 10);
    const endVol = parseInt(formData.endVolume, 10);

    if (isNaN(startVol) || startVol < 1) {
        setError('Please enter a valid start volume (>= 1).');
        setLoading(false);
        return;
    }
     if (isNaN(endVol) || endVol < startVol) {
        setError('End volume must be a number greater than or equal to start volume.');
        setLoading(false);
        return;
    }

    // Construct the 'volumes' query parameter string
    // Handles single volume or range
    const volumes = (startVol === endVol) ? `${startVol}` : `${startVol}-${endVol}`;

    try {
      // Call API service with the updated parameters structure
      const response = await getMangaPrices({
        seriesName: formData.series,
        volumes: volumes,
        condition: formData.condition
      });

      setResult(response.data); // This now expects the structure from our updated API response

    } catch (err) {
      console.error('Error fetching price data:', err);
      // Try to get error message from backend response, otherwise show generic
      const errorMsg = err.response?.data?.message || err.message || 'Error fetching price data. Please check inputs and try again.';
      setError(errorMsg);
      setResult(null); // Clear results on error
    } finally {
      setLoading(false);
    }
  };

  // Helper to format currency
  const formatCurrency = (value) => {
    // First, try to convert the incoming value to a floating-point number
    const numValue = parseFloat(value);

    // Now check if the conversion resulted in a valid number
    if (numValue === null || numValue === undefined || isNaN(numValue)) {
      return 'N/A';
    }
    // If it's a valid number, use toFixed
    return `$${numValue.toFixed(2)}`;
  };

  // Helper to format trend
  const formatTrend = (value) => {
    // Also good practice to parseFloat here too
    const numValue = parseFloat(value);
    if (numValue === null || numValue === undefined || isNaN(numValue)) {
      return 'N/A';
    }
    return `${numValue > 0 ? '+' : ''}${numValue.toFixed(1)}%`;
  };

  return (
    <div className="section">
      <div className="container">
        <h1 className="section-title">Manga Set Price Checker</h1>

        <div className="row">
          {/* Form Column */}
          <div className="col-8 col-md-12">
            <div className="card p-4">
              <h2 className="mb-4">Check Your Collection's Value</h2>

              <form onSubmit={handleSubmit}>
                {/* Series Input */}
                <div className="mb-3">
                  <label className="form-label">Manga Series</label>
                  <input
                    type="text"
                    name="series"
                    value={formData.series}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter manga series name (e.g., Naruto)"
                    required
                  />
                </div>

                {/* Volumes Input Row */}
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">Start Volume</label>
                    <input
                      type="number"
                      name="startVolume"
                      value={formData.startVolume}
                      onChange={handleChange}
                      className="form-control"
                      min="1"
                      placeholder="e.g., 1"
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">End Volume</label>
                    <input
                      type="number"
                      name="endVolume"
                      value={formData.endVolume}
                      onChange={handleChange}
                      className="form-control"
                      min={formData.startVolume || 1}
                      placeholder="e.g., 10"
                      required
                    />
                  </div>
                </div>

                {/* Condition Select */}
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

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-lg btn-block"
                  disabled={loading}
                >
                  {loading ? 'Checking Prices...' : 'Check Price'}
                </button>

                {/* Error Display */}
                {error && (
                  <div className="alert bg-danger text-white mt-3 p-3">
                    {error}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Result Column */}
          <div className="col-4 col-md-12">
            {/* Use loading state to show placeholder while checking */}
            {loading && (
                <div className="card p-4 text-center">
                    <p>Loading price data...</p>
                    {/* Optional: Add a spinner */}
                </div>
            )}
            {!loading && result ? (
              <div className="card p-4">
                <h2 className="mb-3">Price Analysis</h2>
                <div className="price-result">
                  <div className="mb-2">
                    <strong>{result.series?.name || 'N/A'}</strong>
                    {result.query?.volumes && ` (Vol. ${result.query.volumes}, ${result.query?.condition || 'N/A'})`}
                  </div>

                  {result.pricing ? (
                    <>
                      <div className="d-flex justify-between align-center mb-3">
                        <span>Est. Set Price:</span>
                        <span className="price-value">{formatCurrency(result.pricing.estimatedPrice)}</span>
                      </div>

                      <div className="d-flex justify-between align-center mb-3">
                        <span>Est. Price Per Vol:</span>
                        <span className="price-value">{formatCurrency(result.pricing.pricePerVolume)}</span>
                      </div>

                      <div className="d-flex justify-between align-center mb-3">
                        <span>Volumes in Query:</span>
                        <span>{result.pricing.numVolumes || 'N/A'}</span>
                      </div>

                      {/* Display premium only if non-zero */}
                      {result.pricing.premiumApplied > 0 && (
                          <div className="d-flex justify-between align-center mb-3 text-sm">
                            <span>Premium Applied:</span>
                            <span>+{(result.pricing.premiumApplied * 100).toFixed(0)}% ({result.pricing.matchType === 'exact' ? 'Exact Match' : (result.query?.type === 'volume_range' && result.pricing.numVolumes === result.series?.totalVolumes ? 'Complete Set' : 'Continuous Range')})</span>
                          </div>
                      )}

                      {/* Display discount only if non-zero */}
                      {result.pricing.discontinuityDiscount > 0 && (
                          <div className="d-flex justify-between align-center mb-3 text-sm text-danger">
                             <span>Discontinuity Discount:</span>
                             <span>-{(result.pricing.discontinuityDiscount * 100).toFixed(0)}%</span>
                          </div>
                      )}

                      <div className="d-flex justify-between align-center mb-4">
                        <span>Recent Price Trend:</span>
                        <span className={`${result.trend?.trend > 0 ? 'text-success' : (result.trend?.trend < 0 ? 'text-danger' : '')}`}>
                          {formatTrend(result.trend?.trend)} ({result.trend?.confidence || 'low'} confidence)
                        </span>
                      </div>

                      <div className="text-sm mb-2">
                        Trend based on {result.trend?.recentSamples || 0} recent vs {result.trend?.olderSamples || 0} older samples.
                      </div>
                    </>
                  ) : (
                    <div>No specific pricing data calculated. Check inputs or try later.</div>
                  )}
                </div>
              </div>
            ) : !loading && (
                <div className="card p-4">
                  <h3 className="mb-3">How It Works</h3>
                  <ol style={{ paddingLeft: '1.5rem' }}>
                    <li className="mb-2">Enter your manga series name</li>
                    <li className="mb-2">Specify the volume range (e.g., 1 to 10)</li>
                    <li className="mb-2">Select the condition</li>
                    <li className="mb-2">Get value estimates based on recent sales</li>
                  </ol>
                  <p className="mt-3">Our algorithm analyzes completed sales data from our database to estimate market values.</p>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceCheckerPage;