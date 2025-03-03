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
    const unsubscribe = onSnapshot(financeCollection, (snapshot) => {
      const financeData = snapshot.docs.map(doc => ({
        id: doc.id,
        saldo: doc.data().saldo,
      }));
      setCards(financeData);
    });
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
      <div className="finance-analiticas">
        <h3>Analiticas</h3>
      </div>
      <Movimientos />
    </div>
  );
};

export default Finance;
