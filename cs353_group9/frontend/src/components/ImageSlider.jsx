import React, { useState } from "react";
import "./ImageSlider.css";

function ImageSlider({ images }) {
  const [index, setIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState(new Set());

  if (!images || images.length === 0) return null;

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  const handleImageLoad = (i) => {
    setLoadedImages(prev => new Set(prev).add(i));
  };

  return (
    <div className="insta-slider-container">

      {/* Sliding Track */}
      <div
        className="insta-track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((src, i) => (
          <div key={i} className="insta-slide-wrapper">
            {!loadedImages.has(i) && <div className="insta-skeleton" />}
            <img 
              key={i} 
              src={src} 
              className={`insta-slide ${loadedImages.has(i) ? 'loaded' : ''}`}
              alt={`slide-${i}`}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              onLoad={() => handleImageLoad(i)}
            />
          </div>
        ))}
      </div>

      {/* Arrows */}
      {images.length > 1 && (
        <>
          <button className="insta-arrow insta-left" onClick={(e) => { e.stopPropagation(); prev(); }}>
            ❮
          </button>

          <button className="insta-arrow insta-right" onClick={(e) => { e.stopPropagation(); next(); }}>
            ❯
          </button>
        </>
      )}

      {/* Dots */}
      <div className="insta-dots">
        {images.map((_, i) => (
          <div key={i} className={`insta-dot ${i === index ? "active" : ""}`} />
        ))}
      </div>
    </div>
  );
}

export default ImageSlider;
