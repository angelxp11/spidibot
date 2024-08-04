import React from 'react';
import logo from '../spidi512.png';
import './Carga.css';

function Carga() {
  return (
    <div className="carga-overlay">
      <div className="carga-container">
        <img src={logo} className="carga-logo" alt="Cargando..." />
        <p>Cargando...</p>
      </div>
    </div>
  );
}

export default Carga;
