// src/recursos/MensajesSiNo.js

import React from 'react';
import './MensajesSiNo.css'; // Asegúrate de crear este archivo CSS para el estilo

const MensajesSiNo = ({ onClose, onConfirm }) => {
  return (
    <div className="overlay">
      <div className="mensaje-container">
        <h2>¿Estás seguro que quieres cerrar sesión?</h2>
        <p>
          Recuerda que cada vez que vuelvas a entrar la sesión se mantendrá abierta. Al cerrar sesión, la próxima vez que vayas a verificar tus contraseñas te pedirá correo y contraseña.
        </p>
        <div className="button-group">
          <button className="no-button" onClick={onClose}>
            No, quiero continuar con mi sesión
          </button>
          <button className="yes-button" onClick={onConfirm}>
            Sí, deseo cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default MensajesSiNo;
