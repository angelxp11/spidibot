import React from 'react';
import './Tarjetero.css';
import nequiImage from "../../../recursos/svg/NEQUI-SPIDIBOT.png";
import daviplataImage from "../../../recursos/svg/DAVIPLATA.png";
import jadePlatformImage from "../../../recursos/svg/NEQUI-JADEPLATFORM.png";
import ahorroalamanoImage from "../../../recursos/svg/AHORRO-A-LA-MANO.png";
import ahorroImage from "../../../recursos/svg/AHORRO.png";

const Tarjetero = ({ cards, handleCardClick, getCardPosition, formatCurrency, selectedOption }) => {
  const getCardStyle = (card, index) => {
    return {
      top: `${getCardPosition(index)}px`,
      zIndex: cards.length - index,
      backgroundColor: ['NEQUI-SPIDIBOT', 'DAVIPLATA', 'NEQUI-JADEPLATFORM', 'AHORRO A LA MANO'].includes(card.id) ? 'transparent' : 'var(--color-container)',
      backgroundImage: card.id === 'NEQUI-SPIDIBOT' ? `url(${nequiImage})` : 
                        card.id === 'DAVIPLATA' ? `url(${daviplataImage})` : 
                        card.id === 'NEQUI-JADEPLATFORM' ? `url(${jadePlatformImage})` : 
                        card.id === 'AHORRO' ? `url(${ahorroImage})` : 
                        card.id === 'AHORRO A LA MANO' ? `url(${ahorroalamanoImage})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  };

  const getCardBalance = (card) => {
    return formatCurrency(card.cardbalance);
  };

  return (
    <div className="finance-tarjetero">
      {cards.map((card, index) => (
        <div
          key={card.id}
          className={`card card-${index + 1}`}
          onClick={handleCardClick}
          style={getCardStyle(card, index)}
        >
          <div className="card-balance">{getCardBalance(card)}</div>
        </div>
      ))}
    </div>
  );
};

export default Tarjetero;
