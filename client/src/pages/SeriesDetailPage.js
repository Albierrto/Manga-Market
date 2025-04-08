import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

// Import series images
import narutoImg from '../assets/images/naruto.jpg';
import onePieceImg from '../assets/images/onepiece.jpg';
import demonSlayerImg from '../assets/images/demonslayer.jpg';
import myHeroAcademiaImg from '../assets/images/myheroacademia.jpg';
import deathNoteImg from '../assets/images/deathnote.jpg';
import attackOnTitanImg from '../assets/images/attackontitan.jpg';

// Image mapping for easy reference
const seriesImages = {
  'Naruto': narutoImg,
  'One Piece': onePieceImg,
  'Demon Slayer': demonSlayerImg,
  'My Hero Academia': myHeroAcademiaImg,
  'Death Note': deathNoteImg,
  'Attack on Titan': attackOnTitanImg
};

const SeriesDetailPage = () => {
  const { id } = useParams();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate data loading
    const seriesData = getMockSeriesData(parseInt(id));
    
    setTimeout(() => {
      setSeries(seriesData);
      setLoading(false);
    }, 500); // Simulate async loading
  }, [id]);
  
  if (loading) {
    return (
      <div className="section">
        <div className="container">
          <div className="text-center p-5">Loading series details...</div>
        </div>
      </div>
    );
  }
  
  if (!series) {
    return (
      <div className="section">
        <div className="container">
          <div className="text-center p-5">Series not found.</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="section">
      <div className="container">
        <div className="breadcrumb mb-4">
          <Link to="/">Home</Link> &gt; 
          <Link to="/series">Series</Link> &gt; 
          <span>{series.name}</span>
        </div>
        
        <div className="row">
          <div className="col-4 col-md-12 mb-4">
            <div className="card p-0 overflow-hidden">
              <img 
                src={series.image} 
                alt={series.name} 
                className="w-100"
                style={{ height: '400px', objectFit: 'cover' }}
              />
              
              <div className="p-4">
                <h1 className="mb-2">{series.name}</h1>
                <div className="mb-3 d-flex flex-wrap" style={{ gap: '0.5rem' }}>
                  <span className="badge bg-primary">{series.publisher}</span>
                  <span className={`badge ${series.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                    {series.status === 'completed' ? 'Completed' : 'Ongoing'}
                  </span>
                  <span className="badge bg-light text-dark">{series.volumes} volumes</span>
                </div>
                
                {/* Rest of the component remains the same */}
                <div className="price-info my-4">
                  <div className="d-flex justify-between mb-2">
                    <span>Average Volume Price:</span>
                    <span className="font-weight-bold">${series.averagePrice.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-between mb-2">
                    <span>Complete Set Price:</span>
                    <span className="font-weight-bold text-primary">${series.completeSetPrice.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-between mb-2">
                    <span>Set Premium:</span>
                    <span className="text-success font-weight-bold">+{(series.premium * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                {/* Existing buttons */}
                <Link to={`/price-checker?series=${id}`} className="btn btn-block mb-2">
                  Check Current Prices
                </Link>
                <Link to={`/sell?series=${id}`} className="btn btn-secondary btn-block">
                  Sell Your Collection
                </Link>
              </div>
            </div>
          </div>
          
          {/* Remaining columns stay the same */}
        </div>
      </div>
    </div>
  );
};

// Updated mock data function with image mapping
function getMockSeriesData(id) {
  const seriesData = {
    1: {
      id: 1,
      name: 'Naruto',
      publisher: 'VIZ Media',
      volumes: 72,
      status: 'completed',
      averagePrice: 8.99,
      completeSetPrice: 599.99,
      premium: 0.15,
      image: narutoImg, // Use imported image
      summary: 'Naruto follows the journey of Naruto Uzumaki, a young ninja who seeks to gain recognition from his peers and dreams of becoming the Hokage, the leader of his village.'
    },
    2: {
      id: 2,
      name: 'One Piece',
      publisher: 'VIZ Media',
      volumes: 104,
      status: 'ongoing',
      averagePrice: 9.99,
      completeSetPrice: 920.50,
      premium: 0.18,
      image: onePieceImg, // Use imported image
      summary: 'One Piece follows Monkey D. Luffy, a young man whose body gained the properties of rubber after unintentionally eating a Devil Fruit. With his crew of pirates, named the Straw Hat Pirates, Luffy explores the Grand Line in search of the world\'s ultimate treasure known as "One Piece" to become the next Pirate King.'
    },
    3: {
      id: 3,
      name: 'Demon Slayer',
      publisher: 'VIZ Media',
      volumes: 23,
      status: 'completed',
      averagePrice: 9.99,
      completeSetPrice: 210.75,
      premium: 0.12,
      image: demonSlayerImg, // Use imported image
      summary: 'Demon Slayer: Kimetsu no Yaiba tells the story of Tanjiro Kamado, a kind-hearted teenager who becomes a demon slayer after his family is slaughtered by demons and his sister Nezuko is turned into one.'
    },
    4: {
      id: 4,
      name: 'My Hero Academia',
      publisher: 'VIZ Media',
      volumes: 35,
      status: 'ongoing',
      averagePrice: 9.99,
      completeSetPrice: 310.25,
      premium: 0.14,
      image: myHeroAcademiaImg, // Use imported image
      summary: 'My Hero Academia is set in a world where superpowers (called "Quirks") have become commonplace. The story follows Izuku Midoriya, a boy who was born without a Quirk but still dreams of becoming a superhero himself.'
    },
    5: {
      id: 5,
      name: 'Death Note',
      publisher: 'VIZ Media',
      volumes: 12,
      status: 'completed',
      averagePrice: 9.99,
      completeSetPrice: 105.50,
      premium: 0.10,
      image: deathNoteImg, // Use imported image
      summary: 'Death Note follows Light Yagami, a high school student who discovers a supernatural notebook, the "Death Note", which grants its user the ability to kill anyone whose name and face they know by writing the name in the notebook.'
    },
    6: {
      id: 6,
      name: 'Attack on Titan',
      publisher: 'Kodansha Comics',
      volumes: 34,
      status: 'completed',
      averagePrice: 10.99,
      completeSetPrice: 340.99,
      premium: 0.15,
      image: attackOnTitanImg, // Use imported image
      summary: 'Attack on Titan is set in a world where humanity lives within cities surrounded by enormous walls due to the Titans, gigantic humanoid creatures who devour humans seemingly without reason.'
    }
  };

  return seriesData[id] || null;
}

export default SeriesDetailPage;