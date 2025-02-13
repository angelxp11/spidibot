import React, { useState, useEffect } from 'react';
import './finance.css';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import nequiImage from "../../recursos/background/NEQUI-SPIDIBOT.png";
import daviplataImage from "../../recursos/background/DAVIPLATA.png";
import jadePlatformImage from "../../recursos/background/NEQUI-JADEPLATFORM.png";
import ahorroalamanoImage from "../../recursos/background/AHORRO-A-LA-MANO.png";
import ahorroImage from "../../recursos/background/AHORRO.png";
import { app } from '../../firebase'; // Asegúrate de importar tu configuración de Firebase

const Finance = () => {
  const [cards, setCards] = useState([]);
  const db = getFirestore(app);

  useEffect(() => {
    // Referencia a la colección 'finance'
    const financeCollection = collection(db, 'finance');

    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(financeCollection, (snapshot) => {
      const financeData = snapshot.docs.map(doc => ({
        id: doc.id,
        saldo: doc.data().saldo,
      }));
      setCards(financeData);
    });

    // Limpiar suscripción cuando el componente se desmonta
    return () => unsubscribe();
  }, [db]);

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
            <div className="card-balance">{formatCurrency(card.saldo)}</div>
          </div>
        ))}
      </div>
      <div className="finance-analiticas">
        <h3>Analiticas</h3>
      </div>
      <div className="finance-movimientos">
        <h3>Movimientos</h3>
      </div>
    </div>
  );
};

export default Finance;
