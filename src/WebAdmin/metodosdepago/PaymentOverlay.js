import React from 'react';
import './PaymentOverlay.css';
import '../../recursos/colors-dark.css'; // Import the color palette
import nequiImage from "../../recursos/svg/NEQUI-SPIDIBOT.png";
import daviplataImage from "../../recursos/svg/DAVIPLATA.png";
import jadePlatformImage from "../../recursos/svg/NEQUI-JADEPLATFORM.png";
import ahorroalamanoImage from "../../recursos/svg/AHORRO-A-LA-MANO.png";
import ahorroImage from "../../recursos/svg/AHORRO.png";

const paymentImages = {
  'nequi-spidibot': nequiImage,
  'daviplata': daviplataImage,
  'nequi-jadeplatform': jadePlatformImage,
  'ahorro a la mano': ahorroalamanoImage,
  'ahorro': ahorroImage
};

function PaymentOverlay({ paymentMethods, onSelect, onClose }) {
  return (
    <div className="payment-overlay" onClick={onClose}>
      <div className="payment-overlay-content" onClick={(e) => e.stopPropagation()}>
        <h2>Selecciona el método de pago</h2>
        <div className="payment-overlay-images">
          {paymentMethods.map((method) => (
            <img
              key={method}
              src={paymentImages[method.toLowerCase()]}
              alt={method}
              className="payment-method-image"
              onClick={() => onSelect(method)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PaymentOverlay;
