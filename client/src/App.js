// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import your pages
import HomePage from './pages/HomePage';
import SeriesCatalogPage from './pages/SeriesCatalogPage';
import CompleteSetsPage from './pages/CompleteSetsPage';
import SeriesDetailPage from './pages/SeriesDetailPage';
import PriceCheckerPage from './pages/PriceCheckerPage';
import SellCollectionPage from './pages/SellCollectionPage';
import NavBar from './components/NavBar';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="app">
        <NavBar />
        <div className="content-container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/series" element={<SeriesCatalogPage />} />
            <Route path="/series/:id" element={<SeriesDetailPage />} />
            <Route path="/complete-sets" element={<CompleteSetsPage />} />
            <Route path="/price-checker" element={<PriceCheckerPage />} />
            <Route path="/sell-collection" element={<SellCollectionPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;