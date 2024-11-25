import React, { useState } from 'react';
import '../containerPlatform.css';
import '../../recursos/MensajesSiNo.css'; // Asegúrate de importar el archivo de estilos del modal
import ProcessVent from '../procesodeventa/processvent.js'

const ContainerPlatformService = ({ id, precio, info, onBuy }) => {
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar el modal
  const [showProcessVent, setShowProcessVent] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(null); // Estado para almacenar el precio seleccionado

  // Función para manejar la compra y abrir el proceso de venta
  const handleBuyClick = () => {
    const service = {
      name: formatId(id), // Aquí le asignamos el nombre formateado
      precio: formatPrice(precio), // El precio también puede ser útil en el modal
    };

    setSelectedPrice(precio); // Guardar el precio del servicio
    setShowProcessVent(true); // Mostrar el componente de proceso de venta
  };

  // Función para manejar la apertura y cierre del modal
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // Función para formatear el ID del servicio
  const formatId = (id) => {
    switch (id) {
      case 'NETFLIXSINTV':
        return 'NETFLIX SIN TV';
      case 'NETFLIXTV':
        return 'NETFLIX TV';
      case 'DISNEY+':
        return 'DISNEY+'; // Formato para Disney+
      case 'CRUNCHYROLL':
        return 'CRUNCHYROLL'; // Formato para Crunchyroll
      case 'YOUTUBE PREMIUM':
        return 'YOUTUBE PREMIUM'; // Formato para YouTube Premium
      case 'YOUTUBE+GOOGLE':
        return 'YOUTUBE + GOOGLE'; // Formato para YouTube + Google
      default:
        return id; // Retorna el ID original si no es uno de los casos especiales
    }
  };

  // Función para formatear el precio
  const formatPrice = (price) => {
    const priceStr = price.toString(); // Convertimos el precio a string para facilitar el formato

    // Si el precio tiene exactamente 4 caracteres
    if (priceStr.length === 4) {
      return `$ ${priceStr.slice(0, 1)}.${priceStr.slice(1)}`;
    }

    // Si el precio tiene más de 4 caracteres, usamos el formato de miles estándar
    return `$ ${new Intl.NumberFormat('es-ES').format(price)}`;
  };

  // Función para determinar el fondo del contenedor y asignar los colores
  const getContainerStyle = (id) => {
    if (id === 'DISNEY+') {
      return { backgroundColor: '#1167769f', color: 'white', titleColor: 'white', priceColor: 'white' }; // Colores para DISNEY+
    } else if (id === 'NETFLIXTV' || id === 'NETFLIXSINTV') {
      return {
        backgroundColor: 'black', // Fondo negro para NETFLIX
        color: 'white', // Texto blanco por defecto
        titleColor: 'red', // Título rojo
        priceColor: 'red' // Precio rojo
      };
    } else if (id === 'CRUNCHYROLL') {
      return {
        backgroundColor: '#ff6308', // Fondo naranja para CRUNCHYROLL
        color: 'white', // Texto blanco
        titleColor: 'white', // Título blanco
        priceColor: 'white' // Precio blanco
      };
    } else if (id === 'YOUTUBE PREMIUM' || id === 'YOUTUBE + GOOGLE') {
      return {
        backgroundColor: '#ff08088a', // Fondo rojo para YOUTUBE PREMIUM y YOUTUBE + GOOGLE
        color: 'white', // Texto blanco
        titleColor: 'white', // Título blanco
        priceColor: 'white' // Precio blanco
      };
    } else if (id === 'MAX') {
      return {
        backgroundColor: '#0924e4', // Fondo azul para MAX
        color: 'white', // Texto blanco
        titleColor: 'white', // Título blanco
        priceColor: 'white' // Precio blanco
      };
    } else if (id === 'SPOTIFY') {
      return {
        backgroundColor: '#201a1a', // Fondo oscuro para SPOTIFY
        color: '#08df53', // Texto verde brillante
        titleColor: '#08df53', // Título verde brillante
        priceColor: '#08df53' // Precio verde brillante
      };
    } else if (id === 'PRIME VIDEO') {
      return {
        backgroundColor: '#00050d', // Fondo oscuro para PRIME VIDEO
        color: 'white', // Texto blanco
        titleColor: 'white', // Título blanco
        priceColor: 'white' // Precio blanco
      };
    } else if (id === 'PARAMOUNT+') {
      return {
        backgroundColor: '#121212', // Fondo oscuro para PARAMOUNT+
        color: 'white', // Texto blanco
        titleColor: 'white', // Título blanco
        priceColor: 'white' // Precio blanco
      };
    }
    return { backgroundColor: '#aeacac', color: 'black', titleColor: 'black', priceColor: 'black' }; // Colores por defecto
  };

  // Función para formatear la info en una lista
  const formatInfoList = (info) => {
    return info.split('💀').map((item, index) => <li key={index}>{item.trim()}</li>);
  };

  // Obtener los estilos específicos para el servicio
  const { backgroundColor, color, titleColor, priceColor } = getContainerStyle(id);

  // Determinar si el título debe tener la clase de color rojo
  const titleClass = (id === 'NETFLIXTV' || id === 'NETFLIXSINTV') ? 'netflix-title' : '';

  return (
    <div className="container-platform-service" style={{ backgroundColor, color }}>
      <h2 className={`servicio-title ${titleClass}`} style={{ color: titleColor }}>
        <strong></strong> {formatId(id)}
      </h2>
      <p className="precio-text" style={{ color: priceColor }}>
        <strong>Precio:</strong> {formatPrice(precio)}
      </p>
  
      {/* Botón para más información */}
      <button className="masinfo" onClick={toggleModal}>
        Más Información
      </button>
  
      {/* Botón para comprar */}
      <button className="buy-button" onClick={handleBuyClick}>
        Comprar
      </button>
  
      {/* Modal */}
      {isModalOpen && (
        <div className="overlay">
          <div className="mensaje-container">
            <h2 className="encabezado-user">Información del Servicio</h2>
            <ul>{formatInfoList(info)}</ul>
            <div className="button-group">
              <button className="cerrabutton" onClick={toggleModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
  
      {/* Proceso de Venta */}
      {showProcessVent && (
        <div className="process-vent-container">
          {/* Pasa el servicio al modal */}
          <ProcessVent service={{ name: formatId(id), precio: selectedPrice }} onClose={() => setShowProcessVent(false)} />
        </div>
      )}
    </div>
  );
};

export default ContainerPlatformService;
