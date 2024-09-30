// src/WebAdmin/ContainerPlatform.js
import React from 'react';
import './containerPlatform.css';

const ContainerPlatform = ({ title, grupo, estado, onMoreInfo }) => {
  return (
    <div className="container-platform">
      <h2 className="servicio-title">{title}</h2>
      <p className="grupo-text"><strong>Grupo:</strong> {grupo}</p>
      <p className="estado-text"><strong>Estado:</strong> {estado}</p>
      {/* Conditionally render the button based on the title */}
      {title !== 'YOUTUBE' && title !== 'SPOTIFY' && (
        <button className="home-button" onClick={onMoreInfo}>
          Más Información
        </button>
      )}
      {/* Display advice message for YOUTUBE and SPOTIFY services */}
      {(title === 'YOUTUBE' || title === 'SPOTIFY') && (
        <p className="advice-message">
          Contacta a Spidibot.
        </p>
      )}
    </div>
  );
};

export default ContainerPlatform;
