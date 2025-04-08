import React from 'react';


const SellCollectionPage = () => {
  return (
    <>
      {/* Hero Banner */}
      <section className="hero sell-hero">
        <div className="container">
          <div className="row">
            <div className="col-md-6 col-sm-12">
              <div className="hero-content">
                <h1>Sell to Manga Market</h1>
                <p>We're always buying manga collections!</p>
                <p>(Complete sets, partial series, and rare editions)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section">
        <div className="container">
          <div className="row">
            {/* Left Content Box */}
            <div className="col-6 col-md-12 mb-4">
              <div className="card p-4">
                <h2 className="mb-3">How It Works</h2>
                <p className="mb-3">If you have a manga collection that you wish to sell, we're interested!</p>
                
                <p className="mb-3">Document your collection by listing all the series and volumes you have. Include details about condition and any special editions.</p>
                
                <p className="mb-3">Submit your collection details using the form on this page.</p>
                
                <p className="mb-4">We'll send you a preliminary quote within an hour or so!</p>
                
                <div className="alert bg-light p-3 mb-3">
                  <p className="mb-1"><strong>Quotes will be sent from contact@mangamarket.com.</strong></p>
                  <p>Please add this address to your saved addresses to ensure it doesn't get marked as spam.</p>
                </div>
                
                <div className="d-flex justify-center mt-4">
                  <a href="#submit-form" className="btn btn-lg">Get Started!</a>
                </div>
              </div>
            </div>
            
            {/* Right Form Box */}
            <div className="col-6 col-md-12" id="submit-form">
              <div className="card p-4">
                <h2 className="mb-4 text-center">Submit Collection</h2>
                
                <form>
                  <div className="mb-3">
                    <label className="form-label">Your Name</label>
                    <input type="text" className="form-control" placeholder="Your name" required />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" placeholder="Your email" required />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Phone (Optional)</label>
                    <input type="tel" className="form-control" placeholder="Your phone number" />
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label">Collection Details</label>
                    <textarea 
                      className="form-control" 
                      rows="6" 
                      placeholder="Please list all manga series, volumes, and their conditions. Example: Naruto Vol 1-72 (complete set), good condition; One Piece Vol 1-50, very good condition..."
                      required
                    ></textarea>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Photos (Optional)</label>
                    <input type="file" className="form-control" multiple accept="image/*" />
                    <div className="text-sm text-medium mt-1">Upload photos of your collection (max 5 images)</div>
                  </div>
                  
                  <button type="submit" className="btn btn-lg btn-block">Send Collection</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="section bg-light">
        <div className="container">
          <div className="row">
            <div className="col-6 col-md-12 mb-4">
              <div className="feature-card text-center">
                <div className="feature-icon">💰</div>
                <h3 className="feature-title">Get Paid Top Dollar For Your Manga!</h3>
                <p className="mb-4">We offer competitive prices for complete and partial sets.</p>
                <a href="#submit-form" className="btn">Get Started!</a>
              </div>
            </div>
            
            <div className="col-6 col-md-12">
              <div className="feature-card text-center">
                <div className="feature-icon">📚</div>
                <h3 className="feature-title">Sell Your Entire Collection</h3>
                <p className="mb-4">Looking to clear out space? We'll buy everything at once!</p>
                <a href="#submit-form" className="btn">Click Here!</a>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Frequently Asked Questions</h2>
          
          <div className="card p-4 mb-3">
            <h3 className="mb-2">What condition do you accept?</h3>
            <p>We accept manga in all conditions from Like New to Poor, though pricing varies based on condition. We prefer sets in Good condition or better.</p>
          </div>
          
          <div className="card p-4 mb-3">
            <h3 className="mb-2">How are quotes calculated?</h3>
            <p>Our quotes are based on current market values, completeness of sets, overall condition, and current demand. Complete sets typically receive premium offers.</p>
          </div>
          
          <div className="card p-4 mb-3">
            <h3 className="mb-2">How soon will I receive payment?</h3>
            <p>Once we receive and verify your collection, payment is sent within 1-2 business days via your preferred payment method.</p>
          </div>
          
          <div className="card p-4">
            <h3 className="mb-2">What payment methods do you offer?</h3>
            <p>We offer payment via PayPal, direct bank transfer, or check by mail.</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default SellCollectionPage;