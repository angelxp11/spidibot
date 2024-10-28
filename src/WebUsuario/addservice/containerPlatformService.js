import React from 'react';
import '../containerPlatform.css';

const ContainerPlatformService = ({ id, precio, info, onBuy }) => {
  
  // Función para formatear el ID del servicio
  const formatId = (id) => {
    switch (id) {
      case 'NETFLIXSINTV':
        return 'NETFLIX SIN TV';
      case 'NETFLIXTV':
        return 'NETFLIX TV';
      default:
        return id; // Retorna el ID original si no es uno de los casos especiales
    }
  };

  // Función para formatear el precio
  const formatPrice = (price) => {
    return `$ ${new Intl.NumberFormat('es-ES').format(price)}`;
  };

  // Manejar clic en el botón de más información
  const handleMoreInfo = () => {
    alert(info); // Muestra la información en un alerta
  };

  return (
    <div className="container-platform-service">
      <h2 className="servicio-title"><strong></strong> {formatId(id)}</h2>
      <p className="precio-text"><strong>Precio:</strong> {formatPrice(precio)}</p>
      
      {/* Botón para más información */}
      <button className="masinfo" onClick={handleMoreInfo}>
        Más Información
      </button>

      {/* Botón para comprar */}
      <button className="buy-button" onClick={onBuy}>
        Comprar
      </button>
    </div>
  );
};

export default ContainerPlatformService;
