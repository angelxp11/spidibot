import React, { useState } from 'react';
import './processvent.css'; // Importa los estilos para el modal
import FormAparte from '../procesodeventa/formshop/formaparte.js'; // Asegúrate de importar el componente FormAparte

// Función para capitalizar la primera letra de una cadena
const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const ProcessVent = ({ service, onClose }) => {
  // Estado para controlar si el modal FormAparte debe mostrarse
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);

  // Maneja la opción "Deseo que sea aparte en mi factura"
  const handleSeparateInvoice = () => {
    setIsFormModalVisible(true); // Muestra el modal del formulario cuando se elige esta opción
  };

  // Maneja la opción "Deseo unirlo a mi factura mensual"
  const handleMonthlyInvoice = () => {
    alert('Por el momento no disponible unirlo a la factura');
    onClose(); // Cierra el modal principal si elige la opción de factura mensual
  };

  // Cierra ambos modales y muestra el toast en el componente FormAparte
  const handleCloseBothModals = () => {
    setIsFormModalVisible(false); // Cierra solo el modal de FormAparte
    onClose(); // Cierra el modal principal de ProcessVent
  };

  return (
    <div className="venta-overlay-unique">
      <div className="venta-modal-unique">
        <h2>Servicio a obtener: {capitalizeFirstLetter(service.name)}</h2>
        <br />
        <p className="p-venta-unique">
          🔹 Factura Aparte 🧾 – Se generará un cobro independiente y no se añadirá a tu factura mensual actual (si es que existe). Ideal si quieres probar el servicio por un mes sin afectar tu plan actual.
          <br />
          <br />
          🔹 Unir al Plan Actual 🔄 – El servicio se añadirá a tu factura mensual (si es que existe), manteniendo una única fecha de pago para todos tus servicios.(pronto)
        </p>

        <div className="venta-button-group-unique">
          <button onClick={handleSeparateInvoice} className="factura-aparte-button">FACTURA APARTE</button>
          <button className="hidden">Deseo unirlo a mi factura mensual</button> {/* Botón oculto */}
          <button className="cerrarventabutton-unique" onClick={onClose}>Cerrar</button>
        </div>
      </div>

      {/* Mostrar el modal del formulario si isFormModalVisible es true */}
      {isFormModalVisible && (
        <div className="formaparte-overlay-unique">
          <div className="formaparte-modal-unique">
            <button onClick={handleCloseBothModals} className="formaparte-close-btn-unique">Cerrar</button>
            <FormAparte service={service} onClose={handleCloseBothModals} /> {/* Pasamos el servicio aquí */}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessVent;
