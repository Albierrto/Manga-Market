import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Get manga prices from eBay data
export const getMangaPrices = (series, volumes, totalVolumes) => {
  return api.get('/prices', { 
    params: { series, volumes, totalVolumes } 
  });
};

// Series API
export const fetchSeries = () => api.get('/series');
export const fetchSeriesById = (id) => api.get(`/series/${id}`);

// Price API
export const checkPrice = (data) => api.post('/price/check', data);
export const fetchPriceTrend = (seriesId) => api.get(`/price/trend/${seriesId}`);

// Volume API
export const fetchVolumes = () => api.get('/volumes');
export const fetchVolumesBySeriesId = (seriesId) => api.get(`/volumes/series/${seriesId}`);

// Inventory API
export const fetchInventory = () => api.get('/inventory');
export const fetchInventoryById = (id) => api.get(`/inventory/${id}`);

export default api;