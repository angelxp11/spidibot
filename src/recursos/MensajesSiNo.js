// src/recursos/MensajesSiNo.js

import React from 'react';
import './MensajesSiNo.css'; // Asegúrate de crear este archivo CSS para el estilo

const MensajesSiNo = ({ onClose, onConfirm, header = '', message = '', buttons = { no: '', yes: '' } }) => {
  return (
    <div className="overlay">
      <div className="mensaje-container">
        <h2 className="encabezado-user">{header}</h2>
        <p style={{ marginTop: '20px' }}>{message}</p>
        <div className="button-group">
          <button className="no-button" onClick={onClose}>
            {buttons.no}
          </button>
          <button className="yes-button" onClick={onConfirm}>
            {buttons.yes}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MensajesSiNo;
