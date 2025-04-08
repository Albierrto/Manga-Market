// src/services/api.js (or similar path) - CORRECTED

import axios from 'axios';

// Use local API URL for development; override via REACT_APP_API_URL if set
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Fetches manga price data from the backend API.
 * (Corrected to match backend query parameters: seriesName, volumes, condition)
 * @param {object} params - The query parameters.
 * @param {string} params.seriesName - The name of the manga series.
 * @param {string} params.volumes - The volume string (e.g., "1", "1-10", "1,3,5").
 * @param {string} params.condition - The condition (e.g., "good").
 * @returns {Promise<object>} The Axios response object.
 */
export const getMangaPrices = (params) => {
  // Construct the request URL with correctly named query parameters
  return api.get('/prices', {
    params: { // Use the names the backend expects
      seriesName: params.seriesName,
      volumes: params.volumes,
      condition: params.condition
    }
  });
};

// --- Other API functions (keep as they are unless backend routes changed) ---

// Get volume by ID
export const fetchVolumeById = (id) => api.get(`/volumes/${id}`);

// Series API
export const fetchSeries = () => api.get('/series');
export const fetchSeriesById = (id) => api.get(`/series/${id}`);

// Price API (Note: '/price/check' and '/price/trend' might need review depending on backend routes)
export const checkPrice = (data) => api.post('/price/check', data); // Assuming this endpoint exists
export const fetchPriceTrend = (seriesId) => api.get(`/price/trend/${seriesId}`); // Assuming this endpoint exists

// Volume API
export const fetchVolumes = () => api.get('/volumes');
export const fetchVolumesBySeriesId = (seriesId) => api.get(`/volumes/series/${seriesId}`);

// Inventory API
export const fetchInventory = () => api.get('/inventory');
export const fetchInventoryById = (id) => api.get(`/inventory/${id}`);

export default api;