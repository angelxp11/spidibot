// Notificaciones.jsx
import React from 'react';
import './notificaciones.css'; // Asegúrate de crear estilos para el modal

const Notificaciones = ({ onClose }) => {
  return (
    <div className="notificaciones-overlay">
      <div className="notificaciones-modal">
        <h2>Notificaciones Pendientes</h2>
        <ul>
          <li>Notificación 1: Tienes una nueva solicitud.</li>
          <li>Notificación 2: Revisa el informe mensual.</li>
          <li>Notificación 3: Tienes un mensaje nuevo.</li>
          {/* Agrega más notificaciones según sea necesario */}
        </ul>
        <button onClick={onClose} className="close-button">Cerrar</button>
      </div>
    </div>
  );
};

export default Notificaciones;
