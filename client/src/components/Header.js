import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };
  
  return (
    <header className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          Manga Market
        </Link>
        
        <button 
          className="navbar-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
        
        <ul className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <li className="navbar-item">
            <Link to="/" className={`navbar-link ${isActive('/')}`}>Home</Link>
          </li>
          <li className="navbar-item">
            <Link to="/series" className={`navbar-link ${isActive('/series')}`}>Series</Link>
          </li>
          <li className="navbar-item">
            <Link to="/sets" className={`navbar-link ${isActive('/sets')}`}>Complete Sets</Link>
          </li>
          <li className="navbar-item">
            <Link to="/price-checker" className={`navbar-link ${isActive('/price-checker')}`}>Price Checker</Link>
          </li>
          <li className="navbar-item">
            <Link to="/sell" className={`navbar-link ${isActive('/sell')}`}>Sell Collection</Link>
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;