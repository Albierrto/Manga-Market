import axios from 'axios';

// Use local API URL for development; override via REACT_APP_API_URL if set
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Get manga prices from eBay data - Updated to use the correct endpoint
export const getMangaPrices = (params) => {
  return api.post('/check-price', params);
};

// Series API
export const fetchSeries = () => api.get('/api/series');
export const fetchSeriesById = (id) => api.get(`/api/series/${id}`);

// Price API
export const checkPrice = (data) => api.post('/api/price/check', data);
export const fetchPriceTrend = (seriesId) => api.get(`/api/price/trend/${seriesId}`);

// Volume API
export const fetchVolumes = () => api.get('/api/volumes');
export const fetchVolumesBySeriesId = (seriesId) => api.get(`/api/volumes/series/${seriesId}`);

// Inventory API
export const fetchInventory = () => api.get('/api/inventory');
export const fetchInventoryById = (id) => api.get(`/api/inventory/${id}`);

export default api;