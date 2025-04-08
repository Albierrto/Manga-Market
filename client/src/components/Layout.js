import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Function to check if a link is active
  const isActive = (path) => {
    return location.pathname === path ? 'active-link' : '';
  };

  return (
    <div>
      <nav>
        <div className="container">
          <Link to="/" className="logo">Manga Market</Link>
          <div className="nav-links">
            <Link to="/" className={isActive('/')}>Home</Link>
            <Link to="/price-checker" className={isActive('/price-checker')}>Price Checker</Link>
            <Link to="/series" className={isActive('/series')}>Series Catalog</Link>
            <Link to="/how-it-works" className={isActive('/how-it-works')}>How It Works</Link>
            <Link to="/sell" className={isActive('/sell')}>Sell Your Collection</Link>
          </div>
        </div>
      </nav>
      
      <main className="container">
        {children}
      </main>
      
      <footer>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.25rem' }}>Manga Market</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                The specialized marketplace for manga collectors, focusing on accurate pricing for complete and partial sets.
              </p>
            </div>
            
            <div>
              <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.25rem' }}>Quick Links</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/price-checker" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Check Prices</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/series" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Browse Series</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/sell" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Sell Collection</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.25rem' }}>About</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}><Link to="/how-it-works" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>How It Works</Link></li>
                <li style={{ marginBottom: '0.5rem' }}><a href="#" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Contact Us</a></li>
                <li style={{ marginBottom: '0.5rem' }}><a href="#" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>FAQ</a></li>
              </ul>
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', textAlign: 'center' }}>
            <p>&copy; {new Date().getFullYear()} Manga Market. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;