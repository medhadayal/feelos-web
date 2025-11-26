import React from 'react';
import './LoadingScreen.css';

const LoadingScreen: React.FC = () => {
  return (
    <div className="loading-screen">
      <div className="loading-container">
        <div className="spinner"></div>
        <h1>FeelOS</h1>
        <p>Loading...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
