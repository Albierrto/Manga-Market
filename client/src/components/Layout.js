import React from 'react';
import { Link } from 'react-router-dom';

const Layout = ({ children }) => {
  return (
    <div>
      <nav>
        <div className="container">
          <Link to="/" className="logo">Manga Market</Link>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/price-checker">Price Checker</Link>
          </div>
        </div>
      </nav>
      
      <main className="container">
        {children}
      </main>
      
      <footer>
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Manga Market. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;