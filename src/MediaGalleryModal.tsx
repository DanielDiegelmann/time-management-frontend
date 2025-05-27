import React, { useState } from 'react';
import './MediaGalleryModal.css';

interface MediaGalleryModalProps {
  mediaFiles: string[];
  initialIndex: number;
  onClose: () => void;
}

const MediaGalleryModal: React.FC<MediaGalleryModalProps> = ({ mediaFiles, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + mediaFiles.length) % mediaFiles.length);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % mediaFiles.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="media-gallery-modal-overlay" tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="media-gallery-modal-content">
        <button className="close-btn" onClick={onClose}>×</button>
        <button className="nav-btn prev" onClick={handlePrev}>‹</button>
        <div className="media-container">
          <img src={mediaFiles[currentIndex]} alt={`Media ${currentIndex + 1}`} />
        </div>
        <button className="nav-btn next" onClick={handleNext}>›</button>
      </div>
    </div>
  );
};

export default MediaGalleryModal;