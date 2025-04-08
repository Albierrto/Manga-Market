// client/src/components/NavBar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavBar = () => {
  const location = useLocation();
  
  // Function to check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav style={{ 
      backgroundColor: 'white', 
      borderBottom: '1px solid #e0e0e0',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      {/* Logo/Brand */}
      <Link to="/" style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold',
        color: '#6a1b9a',
        textDecoration: 'none',
        letterSpacing: '0.5px'
      }}>
        Manga Market
      </Link>
      
      {/* Navigation Links */}
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <Link to="/" style={{ 
          color: isActive('/') ? '#6a1b9a' : '#333',
          textDecoration: 'none',
          borderBottom: isActive('/') ? '2px solid #6a1b9a' : '2px solid transparent',
          paddingBottom: '0.25rem'
        }}>
          Home
        </Link>
        
        <Link to="/series" style={{ 
          color: isActive('/series') ? '#6a1b9a' : '#333',
          textDecoration: 'none',
          borderBottom: isActive('/series') ? '2px solid #6a1b9a' : '2px solid transparent',
          paddingBottom: '0.25rem'
        }}>
          Series
        </Link>
        
        <Link to="/complete-sets" style={{ 
          color: isActive('/complete-sets') ? '#6a1b9a' : '#333',
          textDecoration: 'none',
          borderBottom: isActive('/complete-sets') ? '2px solid #6a1b9a' : '2px solid transparent',
          paddingBottom: '0.25rem'
        }}>
          Complete Sets
        </Link>
        
        <Link to="/price-checker" style={{ 
          color: isActive('/price-checker') ? '#6a1b9a' : '#333',
          textDecoration: 'none',
          borderBottom: isActive('/price-checker') ? '2px solid #6a1b9a' : '2px solid transparent',
          paddingBottom: '0.25rem'
        }}>
          Price Checker
        </Link>
        
        <Link to="/sell-collection" style={{ 
          color: isActive('/sell-collection') ? '#6a1b9a' : '#333',
          textDecoration: 'none',
          borderBottom: isActive('/sell-collection') ? '2px solid #6a1b9a' : '2px solid transparent',
          paddingBottom: '0.25rem'
        }}>
          Sell Collection
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;