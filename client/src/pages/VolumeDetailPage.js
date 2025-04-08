// client/src/pages/VolumeDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

// Import the images you need from their new location
import narutoImg from '../assets/images/naruto.jpg'; // Adjust path if needed
import onePieceImg from '../assets/images/onepiece.jpg';
import demonSlayerImg from '../assets/images/demonslayer.jpg';
import myHeroImg from '../assets/images/myheroacademia.jpg';
import deathNoteImg from '../assets/images/deathnote.jpg';
import attackOnTitanImg from '../assets/images/attackontitan.jpg';
// Add imports for any other images used in mock data

const VolumeDetailPage = () => {
  const { seriesId, volumeId } = useParams();
  const navigate = useNavigate();
  const [volume, setVolume] = useState(null);
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const seriesData = getMockSeriesData(parseInt(seriesId));
    if (!seriesData) {
      navigate('/series');
      return;
    }

    const volumeNumber = parseInt(volumeId);
    if (isNaN(volumeNumber) || volumeNumber < 1 || volumeNumber > seriesData.volumes) {
      navigate(`/series/${seriesId}`);
      return;
    }

    // Create mock volume data - uses the imported image variable
    const volumeData = {
      id: volumeNumber,
      number: volumeNumber,
      title: `${seriesData.name} Volume ${volumeNumber}`,
      image: seriesData.image, // Image variable comes from getMockSeriesData now
      isbn: `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      releaseDate: new Date(2010 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      price: seriesData.averagePrice,
      pages: 180 + Math.floor(Math.random() * 40),
      summary: `Volume ${volumeNumber} of ${seriesData.name} continues the exciting story...` // Shortened for brevity
    };

    setSeries(seriesData);
    setVolume(volumeData);
    setLoading(false);
  }, [seriesId, volumeId, navigate]);

  // ... (rest of the loading/error/return JSX remains the same)
  // The <img src={volume.image} ... /> will now correctly use the imported image variable

  if (loading) {
    // ... loading JSX
  }

  if (!volume || !series) {
   // ... not found JSX
  }

  return (
      <div className="section">
         <div className="container">
           {/* Breadcrumb */}
           <div className="breadcrumb mb-4">
              {/* ... links ... */}
              <span>Volume {volume.number}</span>
           </div>

           <div className="row">
              {/* Left Column (Image + Nav) */}
              <div className="col-4 col-md-12 mb-4">
                 <div className="card p-0 overflow-hidden">
                    {/* Use volume.image which now holds the imported variable */}
                    <img
                       src={volume.image}
                       alt={volume.title}
                       className="w-100"
                       style={{ height: '500px', objectFit: 'cover' }}
                    />
                    <div className="overlay-text" style={{ /* ... styles ... */ }}>
                       Volume {volume.number}
                    </div>
                 </div>
                 {/* Volume Navigation */}
                 <div className="mt-4 volume-navigation">
                   {/* ... nav links ... */}
                 </div>
              </div>

              {/* Right Column (Details) */}
              <div className="col-8 col-md-12">
                {/* Volume Title Card */}
                 <div className="card p-4 mb-4">
                    <h1 className="mb-3">{volume.title}</h1>
                    <div className="volume-details">
                      {/* ... detail rows ... */}
                    </div>
                 </div>
                 {/* Summary Card */}
                 <div className="card p-4 mb-4">
                   {/* ... summary ... */}
                 </div>
                 {/* Market Info Card */}
                 <div className="card p-4">
                   {/* ... market info ... */}
                 </div>
              </div>
           </div>
         </div>
      </div>
   );

};

// Updated Mock data function - uses imported image variables
function getMockSeriesData(id) {
  const seriesData = {
    1: {
      id: 1, name: 'Naruto', publisher: 'VIZ Media', volumes: 72, status: 'completed',
      averagePrice: 8.99, completeSetPrice: 599.99, premium: 0.15, image: narutoImg // Use imported variable
    },
    2: {
      id: 2, name: 'One Piece', publisher: 'VIZ Media', volumes: 104, status: 'ongoing',
      averagePrice: 9.99, completeSetPrice: 920.50, premium: 0.18, image: onePieceImg // Use imported variable
    },
    3: {
      id: 3, name: 'Demon Slayer', publisher: 'VIZ Media', volumes: 23, status: 'completed',
      averagePrice: 9.99, completeSetPrice: 210.75, premium: 0.12, image: demonSlayerImg // Use imported variable
    },
    4: {
      id: 4, name: 'My Hero Academia', publisher: 'VIZ Media', volumes: 35, status: 'ongoing',
      averagePrice: 9.99, completeSetPrice: 310.25, premium: 0.14, image: myHeroImg // Use imported variable
    },
    5: {
      id: 5, name: 'Death Note', publisher: 'VIZ Media', volumes: 12, status: 'completed',
      averagePrice: 9.99, completeSetPrice: 105.50, premium: 0.10, image: deathNoteImg // Use imported variable
    },
    6: {
      id: 6, name: 'Attack on Titan', publisher: 'Kodansha Comics', volumes: 34, status: 'completed',
      averagePrice: 10.99, completeSetPrice: 340.99, premium: 0.15, image: attackOnTitanImg // Use imported variable
    }
    // Add other series if needed, importing their images too
  };

  return seriesData[id] || null;
}

export default VolumeDetailPage;