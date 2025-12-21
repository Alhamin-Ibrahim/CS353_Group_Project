import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Placeholder images for slideshow - you can replace these with actual app screenshots later
  const slides = [
    {
      url: 'https://images.ctfassets.net/v78wipeni189/CPjGFnJEidhtJQwVbejsg/b42d27b6e8994e0101a77d137235b83f/content-hub__content-hub-banner__Best_Places_to_Buy_and_Sell_Second_Hand_Books_Online_banner.jpeg?fm=webp&w=1920&q=80&h=563&fit=fill',
      alt: 'Marketplace Preview 1'
    },
    {
      url: 'https://revival-strapi.s3.eu-west-2.amazonaws.com/Woman_selling_piles_of_secondhand_books_from_home_bbb5b169b2.png',
      alt: 'Marketplace Preview 2'
    },
    {
      url: 'https://cdn.mos.cms.futurecdn.net/Kw44pbUp8k8jQtZvm6uLzM.jpg',
      alt: 'Marketplace Preview 3'
    },
    {
      url: 'https://www.tovima.com/wp-content/uploads/2024/05/02/shutterstock_1845897748-1-scaled.jpg',
      alt: 'Marketplace Preview 4'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="slideshow-container">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.url})` }}
            >
              <div className="slide-overlay"></div>
            </div>
          ))}
          </div>
          </section>

          <section className="bottom-panel">
            <h1 className="sellify-logo">Sellify</h1>
            <p className="sellify-tagline">A student based marketplace</p>


            <div className='button-group'>
              <Link to = "/register" className='btn btn-light'> Sign Up </Link>
              <Link to = "/login" className='btn btn-dark'>Login</Link>
            </div>
          </section>
    </div>
  );
};

export default Landing;
