import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  // Template manga sets - NO PRICING DATA
  const featuredSeries = [
    {
      id: 1,
      title: 'Naruto',
      volumes: '1-72',
      condition: 'good',
      isComplete: true,
      image: '/images/naruto.jpg'
    },
    {
      id: 2,
      title: 'One Piece',
      volumes: '1-50',
      condition: 'very good',
      isComplete: false,
      image: '/images/onepiece.jpg'
    },
    {
      id: 3,
      title: 'Demon Slayer',
      volumes: '1-23',
      condition: 'like new',
      isComplete: true,
      image: '/images/demonslayer.jpg'
    },
    {
      id: 4,
      title: 'Attack on Titan',
      volumes: '1-34',
      condition: 'good',
      isComplete: true,
      image: '/images/attackontitan.jpg'
    }
  ];

  // Popular series
  const popularSeries = [
    'Naruto', 'One Piece', 'Demon Slayer', 'Attack on Titan',
    'My Hero Academia', 'Dragon Ball', 'Jujutsu Kaisen', 'Hunter x Hunter'
  ];

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
                    <img src={series.image} alt={series.title} className="manga-card-img" />
                    {series.isComplete && (
                      <span className="manga-card-badge">Complete Set</span>
                    )}
                  </div>
                  <div className="manga-card-body">
                    <h3 className="manga-card-title">{series.title}</h3>
                    <div className="manga-card-details">Volumes: {series.volumes}</div>
                    <div className="manga-card-details">Condition: {series.condition}</div>
                    {/* No price displayed - will be populated from eBay API later */}
                  </div>
                  <div className="card-footer">
                    <Link to={`/series/${series.id}`} className="btn btn-sm">View Details</Link>
                    <Link to="/price-checker" className="btn btn-secondary btn-sm">Check Price</Link>
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
                to={`/series/${series.toLowerCase().replace(/ /g, '-')}`}
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
        <div className="container">
          <h2 style={{ color: 'var(--white)', marginBottom: 'var(--spacing-lg)' }}>Ready to Value Your Collection?</h2>
          <p style={{ color: 'var(--white)', opacity: 0.9, maxWidth: '700px', margin: '0 auto var(--spacing-xl)' }}>
            Whether you're looking to sell, insure, or just know what your manga collection is worth,
            our specialized tools provide accurate valuation for complete and partial sets.
          </p>
          <Link to="/price-checker" className="btn btn-white btn-lg">Get Started</Link>
        </div>
      </section>
    </>
  );
};

export default HomePage;