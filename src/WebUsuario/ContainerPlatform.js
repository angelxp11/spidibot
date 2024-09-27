// src/WebAdmin/ContainerPlatform.js
import React from 'react';
import './containerPlatform.css';

const ContainerPlatform = ({ title, estado }) => {
  return (
    <div className="container-platform">
      <h2 className="servicio-title">{title}</h2> {/* Muestra el título en negrita */}
      <p className="estado-text"><strong>Estado:</strong> {estado}</p> {/* Muestra el estado */}
    </div>
  );
};

export default ContainerPlatform;
