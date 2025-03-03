import React, { useState, useEffect } from 'react';
import './finance.css';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { app } from '../../firebase';
import Movimientos from './Movimientos/movimientos';
import Tarjetero from './Tarjetero/Tarjetero'; // Import Tarjetero component

const Finance = () => {
  const [cards, setCards] = useState([]);
  const db = getFirestore(app);

  useEffect(() => {
    const financeCollection = collection(db, 'finance');

    const unsubscribeFinance = onSnapshot(financeCollection, (snapshot) => {
      const financeData = snapshot.docs.map(doc => {
        const data = doc.data();
        let cardbalance = data.IngresosBrutos || 0;

        if (doc.id === 'AHORRO') {
          const gananciasNetas = Object.values(data).find(value => typeof value === 'object' && value.GananciasNetas);
          cardbalance = gananciasNetas ? gananciasNetas.GananciasNetas : cardbalance;
        }

        return {
          id: doc.id,
          saldo: data.saldo,
          cardbalance: cardbalance,
        };
      });
      setCards(financeData);
    });

    return () => {
      unsubscribeFinance();
    };
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
  };

  return (
    <div className="finance-layout">
      <Tarjetero 
        cards={cards} 
        handleCardClick={handleCardClick} 
        getCardPosition={getCardPosition} 
        formatCurrency={formatCurrency} 
      />
      <Movimientos />
    </div>
  );
};

export default Finance;
