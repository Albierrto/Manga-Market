// client/src/pages/SeriesDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const SeriesDetailPage = () => {
  const { id } = useParams();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // For now, we'll load mock data based on the ID
    // In a real app, this would fetch from your API
    const seriesData = getMockSeriesData(parseInt(id));
    
    setTimeout(() => {
      setSeries(seriesData);
      setLoading(false);
    }, 500); // Simulate loading
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
                
                <Link to={`/price-checker?series=${id}`} className="btn btn-block mb-2">
                  Check Current Prices
                </Link>
                <Link to={`/sell?series=${id}`} className="btn btn-secondary btn-block">
                  Sell Your Collection
                </Link>
              </div>
            </div>
          </div>
          
          <div className="col-8 col-md-12">
            <div className="card p-4 mb-4">
              <h2 className="mb-3">Series Summary</h2>
              <p style={{ lineHeight: 1.6 }}>{series.summary}</p>
            </div>
            
            <div className="card p-4">
              <div className="d-flex justify-between align-center mb-4">
                <h2 className="mb-0">Volumes</h2>
                {series.status === 'completed' && (
                  <Link to={`/sets?series=${id}`} className="btn btn-sm">
                    View Complete Sets
                  </Link>
                )}
              </div>
              
              <div className="volumes-grid">
                {Array.from({ length: series.volumes }, (_, i) => i + 1).map(volNumber => (
                  <Link 
                    key={volNumber} 
                    to={`/series/${id}/volume/${volNumber}`}
                    className="volume-card"
                  >
                    <div className="volume-number">{volNumber}</div>
                    <div className="volume-info">
                      <div>Price: ${series.averagePrice.toFixed(2)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock data function - in a real app, this would be fetched from your API
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
      image: '/images/naruto.jpg',
      summary: 'Naruto follows the journey of Naruto Uzumaki, a young ninja who seeks to gain recognition from his peers and dreams of becoming the Hokage, the leader of his village. The story is divided into two parts, Naruto\'s pre-teen years, and his teenage years. The series is set in a fictional world where ninja are the ultimate power, and Naruto harbors a fox-like monster spirit within him that complicates his childhood but also gives him enormous power when he learns to control it. Through perseverance and determination, Naruto works to overcome the odds stacked against him.'
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
      image: '/images/onepiece.jpg',
      summary: 'One Piece follows Monkey D. Luffy, a young man whose body gained the properties of rubber after unintentionally eating a Devil Fruit. With his crew of pirates, named the Straw Hat Pirates, Luffy explores the Grand Line in search of the world\'s ultimate treasure known as "One Piece" to become the next Pirate King. The series explores themes of friendship, adventure, and the pursuit of dreams, as Luffy and his diverse crew navigate treacherous waters, battle formidable foes, and uncover the mysteries of a world controlled by a corrupt World Government.'
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
      image: '/images/demonslayer.jpg',
      summary: 'Demon Slayer: Kimetsu no Yaiba tells the story of Tanjiro Kamado, a kind-hearted teenager who becomes a demon slayer after his family is slaughtered by demons and his sister Nezuko is turned into one. Despite her transformation, Nezuko still shows signs of human emotion and thought, which drives Tanjiro to find a cure for her condition. The series follows Tanjiro\'s journey as he joins the Demon Slayer Corps, trains rigorously, and faces increasingly powerful demons, all while protecting his sister and searching for the originator of all demons.'
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
      image: '/images/myhero.jpg',
      summary: 'My Hero Academia is set in a world where superpowers (called "Quirks") have become commonplace. The story follows Izuku Midoriya, a boy who was born without a Quirk but still dreams of becoming a superhero himself. After meeting his idol and the #1 Hero, All Might, Izuku is chosen to be his successor and inherits his Quirk, "One For All." He then enters U.A. High School, a prestigious high school for heroes in training, where he begins his journey to become the greatest hero.'
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
      image: '/images/deathnote.jpg',
      summary: 'Death Note follows Light Yagami, a high school student who discovers a supernatural notebook, the "Death Note", dropped on Earth by a shinigami (a god of death) named Ryuk. The notebook grants its user the ability to kill anyone whose name and face they know by writing the name in the notebook. Light begins a secret crusade to eliminate criminals from the world, while a reclusive detective known as "L" leads an investigation to stop him. The series explores the moral complexities of passing judgment on others and the psychological game of cat and mouse between Light and L.'
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
      image: '/images/attackontitan.jpg',
      summary: 'Attack on Titan is set in a world where humanity lives within cities surrounded by enormous walls due to the Titans, gigantic humanoid creatures who devour humans seemingly without reason. The story centers on Eren Yeager, his adoptive sister Mikasa Ackerman, and their friend Armin Arlert, whose lives are changed forever after a Colossal Titan breaches the wall of their hometown. Vowing revenge and to reclaim the world from the Titans, Eren, Mikasa, and Armin enlist in the military, joining the Scout Regiment—an elite group of soldiers who fight Titans outside the walls and uncover dark secrets about their world.'
    }
  };
  
  return seriesData[id] || null;
}

export default SeriesDetailPage;