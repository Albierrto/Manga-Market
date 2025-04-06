import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-col">
            <h3>Manga Market</h3>
            <p>The specialized marketplace for manga collectors, focusing on accurate pricing for complete and partial sets.</p>
          </div>
          
          <div className="footer-col">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/series">Series</Link></li>
              <li><Link to="/sets">Complete Sets</Link></li>
              <li><Link to="/price-checker">Price Checker</Link></li>
            </ul>
          </div>
          
          <div className="footer-col">
            <h3>Collections</h3>
            <ul className="footer-links">
              <li><Link to="/sets/popular">Popular Sets</Link></li>
              <li><Link to="/sets/completed">Completed Series</Link></li>
              <li><Link to="/sets/ongoing">Ongoing Series</Link></li>
            </ul>
          </div>
          
          <div className="footer-col">
            <h3>Customer Service</h3>
            <ul className="footer-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Manga Market. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;