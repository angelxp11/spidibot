import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { app } from '../../../firebase';
import './movimientos.css';

const Movimientos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const db = getFirestore(app);

  const fetchMovimientos = async (nextPage = false) => {
    setLoading(true);
    const movimientosRef = collection(db, 'Movimientos');
    let q = query(movimientosRef, orderBy('timestamp', 'desc'), limit(10));

    if (nextPage && lastVisible) {
      q = query(movimientosRef, orderBy('timestamp', 'desc'), startAfter(lastVisible), limit(10));
    }

    const querySnapshot = await getDocs(q);
    const newMovimientos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setMovimientos(nextPage ? [...movimientos, ...newMovimientos] : newMovimientos);
    setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
    setLoading(false);
  };

  useEffect(() => {
    fetchMovimientos();
  }, []);

  const formatDateLabel = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  const formatAmount = (amount, type) => {
    return `${type === 'Ingreso' ? '+' : '-'}$${amount.toLocaleString('en-US')}`;
  };

  return (
    <div className="movimientos-container">
      <h2>Movimientos</h2>
      {movimientos.length > 0 && (
        <div className="movimientos-date-label">
          {formatDateLabel(movimientos[0].timestamp)}
        </div>
      )}
      <ul className="movimientos-list">
        {movimientos.map(movimiento => (
          <li key={movimiento.id} className="movimiento-item">
            <div className="movimiento-left">
              <span className="movimiento-arrow">↑</span>
              <span>{movimiento.metodoPago}</span>
            </div>
            <div className="movimiento-right">
              <strong>{formatAmount(movimiento.monto, movimiento.tipo)}</strong>
            </div>
          </li>
        ))}
      </ul>
      <button onClick={() => fetchMovimientos(true)} disabled={loading}>
        {loading ? 'Cargando...' : 'Cargar más'}
      </button>
    </div>
  );
};

export default Movimientos;
