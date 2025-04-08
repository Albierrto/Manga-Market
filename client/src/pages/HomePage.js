// client/src/pages/HomePage.js - Update the featuredSeries section
import React from 'react';
import { Link } from 'react-router-dom';

// Import the images from their new location in src/assets/images
// Adjust the relative path ('../assets/images/') if HomePage.js
// is located somewhere else within src
import narutoImg from '../assets/images/naruto.jpg';
import onePieceImg from '../assets/images/onepiece.jpg';
import demonSlayerImg from '../assets/images/demonslayer.jpg';
import attackOnTitanImg from '../assets/images/attackontitan.jpg';
// Import other images if needed by popularSeries or elsewhere

const HomePage = () => {
  // Template manga sets - Use imported image variables
  const featuredSeries = [
    {
      id: 1,
      title: 'Naruto',
      volumes: '1-72',
      condition: 'good',
      isComplete: true,
      image: narutoImg // Use imported variable
    },
    {
      id: 2,
      title: 'One Piece',
      volumes: '1-50',
      condition: 'very good',
      isComplete: false,
      image: onePieceImg // Use imported variable
    },
    {
      id: 3,
      title: 'Demon Slayer',
      volumes: '1-23',
      condition: 'like new',
      isComplete: true,
      image: demonSlayerImg // Use imported variable
    },
    {
      id: 4,
      title: 'Attack on Titan',
      volumes: '1-34',
      condition: 'good',
      isComplete: true,
      image: attackOnTitanImg // Use imported variable
    }
  ];

  // Popular series
  const popularSeries = [
    'Naruto', 'One Piece', 'Demon Slayer', 'Attack on Titan',
    'My Hero Academia', 'Dragon Ball', 'Jujutsu Kaisen', 'Hunter x Hunter'
  ];

  // Map popular series to ids for linking
  const seriesNameToId = {
    'Naruto': 1,
    'One Piece': 2,
    'Demon Slayer': 3,
    'My Hero Academia': 4, // Assuming ID 4, adjust if needed
    'Death Note': 5,       // Assuming ID 5, adjust if needed
    'Attack on Titan': 6,
    'Dragon Ball': 7,       // Assuming ID 7, adjust if needed
    'Jujutsu Kaisen': 8,    // Assuming ID 8, adjust if needed
    'Hunter x Hunter': 9   // Assuming ID 9, adjust if needed
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="row">
            <div className="col-md-6 col-sm-12">
              <div className="hero-content">
                <h1>The Manga Set & Collection Specialists</h1>
                <p>Find precise market values for complete manga sets and collections. Our specialized algorithm accounts for set completeness, condition, and current market trends.</p>
                <div className="d-flex" style={{ gap: 'var(--spacing-md)' }}>
                  <Link to="/price-checker" className="btn btn-white btn-lg">Check Set Prices</Link>
                  <Link to="/sell" className="btn btn-secondary btn-lg">Sell Your Collection</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Why Choose Manga Market</h2>
          <div className="features">
            {/* Feature Cards */}
            <div className="feature-card">
              <div className="feature-icon">✓</div>
              <h3 className="feature-title">Complete Set Premium</h3>
              <p>Complete manga sets typically command a 15-25% premium over the sum of individual volumes. Our algorithm precisely calculates this added value.</p>
            </div>
            <div className="feature-card">
               <div className="feature-icon">✓</div>
               <h3 className="feature-title">Near-Complete Valuation</h3>
               <p>Even sets missing 1-2 volumes have special value. We calculate what your collection is worth, even if it's not 100% complete.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✓</div>
              <h3 className="feature-title">Market-Based Pricing</h3>
              <p>Our pricing is based on thousands of real-world sales data points, focusing specifically on how sets are valued differently from individual volumes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Sets Section */}
      <section className="section bg-light">
        <div className="container">
          <h2 className="section-title">Featured Manga Series</h2>
          <div className="row">
            {featuredSeries.map(series => (
              <div key={series.id} className="col-3 col-md-6 col-sm-12 mb-4">
                <div className="card manga-card">
                  <div className="manga-card-header">
                    <Link to={`/series/${series.id}`}>
                      {/* The 'src' now uses the imported variable */}
                      <img src={series.image} alt={series.title} className="manga-card-img" />
                    </Link>
                    {series.isComplete && (
                      <span className="manga-card-badge">Complete Set</span>
                    )}
                  </div>
                  <div className="manga-card-body">
                    <Link to={`/series/${series.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 className="manga-card-title">{series.title}</h3>
                    </Link>
                    <div className="manga-card-details">Volumes: {series.volumes}</div>
                    <div className="manga-card-details">Condition: {series.condition}</div>
                  </div>
                  <div className="card-footer">
                    <Link to={`/series/${series.id}`} className="btn btn-sm">View Details</Link>
                    <Link to={`/price-checker?series=${series.id}`} className="btn btn-secondary btn-sm">Check Price</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link to="/series" className="btn btn-lg">Browse All Series</Link>
          </div>
        </div>
      </section>

      {/* Popular Series */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Popular Series</h2>
          <div className="d-flex flex-wrap justify-center" style={{ gap: 'var(--spacing-md)' }}>
            {popularSeries.map((series, index) => (
              <Link
                key={index}
                to={`/series/${seriesNameToId[series] || index + 1}`} // Fallback to index if name not mapped
                className="btn"
              >
                {series}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-primary text-center" style={{ padding: 'var(--spacing-xxl) 0' }}>
        {/* ... rest of CTA section ... */}
      </section>
    </>
  );
};

export default HomePage;