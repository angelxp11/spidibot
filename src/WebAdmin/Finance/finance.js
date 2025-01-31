import React, { useState, useEffect } from 'react';
import './finance.css';
import nequiImage from "../../recursos/background/NEQUI-SPIDIBOT.png";
import daviplataImage from "../../recursos/background/DAVIPLATA.png";
import jadePlatformImage from "../../recursos/background/NEQUI-JADEPLATFORM.png";
import ahorroalamanoImage from "../../recursos/background/AHORRO-A-LA-MANO.png";
import ahorroImage from "../../recursos/background/AHORRO.png";
import { getFinanceDocuments } from '../../firebase';

const Finance = () => {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    const fetchFinanceData = async () => {
      const financeData = await getFinanceDocuments();
      setCards(financeData);
    };

    fetchFinanceData();
  }, []);

  const handleCardClick = () => {
    setCards((prevCards) => {
      const [first, ...rest] = prevCards;
      return [...rest, first];
    });
  };

  const getCardPosition = (index) => {
    const positions = [20, 25, 30, 35];
    return positions[index];
  };

  const getCardStyle = (card, index) => {
    return {
      top: `${getCardPosition(index)}px`,
      zIndex: cards.length - index,
      backgroundColor: ['NEQUI-SPIDIBOT', 'DAVIPLATA', 'NEQUI-JADEPLATFORM', 'AHORRO A LA MANO'].includes(card.id) ? 'transparent' : '#99ccff',
      backgroundImage: card.id === 'NEQUI-SPIDIBOT' ? `url(${nequiImage})` : 
                        card.id === 'DAVIPLATA' ? `url(${daviplataImage})` : 
                        card.id === 'NEQUI-JADEPLATFORM' ? `url(${jadePlatformImage})` : 
                        card.id === 'AHORRO' ? `url(${ahorroImage})` : 
                        card.id === 'AHORRO A LA MANO' ? `url(${ahorroalamanoImage})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
  };

  return (
    <div className="finance-layout">
      <div className="finance-tarjetero">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className={`card card-${index + 1}`}
            onClick={handleCardClick}
            style={getCardStyle(card, index)}
          >
            {/* No text content */}
            <div className="card-balance">{formatCurrency(card.saldo)}</div>
          </div>
        ))}
      </div>
      <div className="finance-analiticas">
        <h3>Analiticas</h3>
        {/* Add content for Analiticas here */}
      </div>
      <div className="finance-movimientos">
        <h3>Movimientos</h3>
        {/* Add content for Movimientos here */}
      </div>
    </div>
  );
};

export default Finance;
