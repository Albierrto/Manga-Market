import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PriceCheckerPage from './pages/PriceCheckerPage';
import SellCollectionPage from './pages/SellCollectionPage';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/price-checker" element={<PriceCheckerPage />} />
            <Route path="/sell" element={<SellCollectionPage />} />
            <Route path="*" element={<div className="container section text-center">Page not found</div>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;