import React, { useState } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import './cambiarfechapago.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const firestore = getFirestore();

const normalizarTexto = (texto) => {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// Formatea fecha a DD/MM/YYYY (corrige desfase de zona horaria)
const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '';
  const fecha = new Date(fechaStr + 'T00:00:00');
  if (isNaN(fecha.getTime())) return '';
  // Ajuste para evitar desfase por zona horaria
  const utc = new Date(fecha.getTime() + Math.abs(fecha.getTimezoneOffset()*60000));
  const dia = String(utc.getDate()).padStart(2, '0');
  const mes = String(utc.getMonth() + 1).padStart(2, '0');
  const anio = utc.getFullYear();
  return `${dia}/${mes}/${anio}`;
};

// Formatea el número como $30.000
const formatoMoneda = (valor) => {
  if (isNaN(valor)) return '$0';
  return '$' + Number(valor).toLocaleString('es-CO');
};

// Redondea al múltiplo más cercano de 50
const redondearAPagoColombiano = (valor) => {
  if (isNaN(valor)) return 0;
  return Math.round(valor / 50) * 50;
};

const CambiarFechaPago = ({ onClose }) => {
  const [searchType, setSearchType] = useState('nombre');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');

  const handleSearchTypeChange = (event) => {
    setSearchType(event.target.value);
    setSearchValue('');
  };

  const handleSearchValueChange = (event) => {
    setSearchValue(event.target.value);
  };

  const searchByName = async (searchValue) => {
    try {
      const clientesRef = collection(firestore, 'clientes');
      const searchValueUpper = normalizarTexto(searchValue).toUpperCase();

      const nombreQuery = query(clientesRef, where('nombre', '>=', searchValueUpper), where('nombre', '<=', searchValueUpper + '\uf8ff'));
      const apellidoQuery = query(clientesRef, where('apellido', '>=', searchValueUpper), where('apellido', '<=', searchValueUpper + '\uf8ff'));

      const [nombreSnapshot, apellidoSnapshot] = await Promise.all([
        getDocs(nombreQuery),
        getDocs(apellidoQuery)
      ]);

      const results = [
        ...nombreSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...apellidoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      ];

      const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());

      setSearchResults(uniqueResults);
    } catch (error) {
      setSearchResults([]);
    }
  };

  const searchByField = async (field, searchValue) => {
    try {
      const clientesRef = collection(firestore, 'clientes');
      const q = query(clientesRef, where(field, '==', searchValue));
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSearchResults(results);
    } catch (error) {
      setSearchResults([]);
    }
  };

  const handleSearch = async () => {
    if (!searchValue && searchType !== 'estado') {
      setSearchResults([]);
      return;
    }
    switch (searchType) {
      case 'nombre':
        await searchByName(searchValue);
        break;
      case 'estado':
        await searchByField('PENDEJOALEJANDRO.estado', searchValue);
        break;
      case 'ID':
        await searchByField('ID', searchValue);
        break;
      default:
        setSearchResults([]);
        break;
    }
  };

  const handleSelectCuenta = (cuenta) => {
    setSelectedCuenta(cuenta);
    setNuevaFecha('');
  };

  const handleFechaChange = (e) => {
    setNuevaFecha(e.target.value);
  };

  const handleGuardarFecha = async () => {
    if (!selectedCuenta || !nuevaFecha) return;
    try {
      const docRef = doc(firestore, 'clientes', selectedCuenta.id);
      const fechaFormateada = formatearFecha(nuevaFecha);
      await updateDoc(docRef, { fechaFinal: fechaFormateada });
      toast.success('Fecha de pago actualizada.');
      setSelectedCuenta(null);
      setSearchResults([]);
      setSearchValue('');
      setNuevaFecha('');
    } catch (err) {
      toast.error('Error al actualizar: ' + err.message);
    }
  };

  // Calcula el total del array precio
  const calcularTotal = (cuenta) => {
    if (!cuenta || !Array.isArray(cuenta.precio)) return 0;
    return cuenta.precio.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  };

  // Calcula el proporcional según la nueva fecha
  const calcularProporcional = (cuenta, nuevaFecha) => {
    if (!cuenta || !cuenta.fechaFinal || !nuevaFecha) return null;
    const total = calcularTotal(cuenta);

    const [dia, mes, anio] = cuenta.fechaFinal.split('/');
    const fechaFinal = new Date(`${anio}-${mes}-${dia}`);
    const fechaNueva = new Date(nuevaFecha);

    const diffTime = fechaNueva.getTime() - fechaFinal.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (isNaN(diffDays)) return null;

    const proporcional = (total / 30) * diffDays;
    // Redondear proporcional antes de retornar
    return { diffDays, proporcional: redondearAPagoColombiano(proporcional) };
  };


  const renderCuentaInfo = (cuenta) => {
    // Redondear total antes de mostrar
    const total = redondearAPagoColombiano(calcularTotal(cuenta));
    return (
      <div className="cambiarfechapago-result-item">
        <div className="cambiarfechapago-result-id">ID: {cuenta.ID}</div>
        <div className="cambiarfechapago-result-nombre">Nombre: {cuenta.nombre} {cuenta.apellido}</div>
        <div className="cambiarfechapago-result-estado">Estado: {cuenta.PENDEJOALEJANDRO?.estado || cuenta.estado || ''}</div>
        <div className="cambiarfechapago-field-row">
          <span className="cambiarfechapago-field-label">Fecha inicial:</span>
          {cuenta.fechaInicial || <span className="cambiarfechapago-placeholder">-</span>}
        </div>
        <div className="cambiarfechapago-field-row">
          <span className="cambiarfechapago-field-label">Fecha final:</span>
          {cuenta.fechaFinal || <span className="cambiarfechapago-placeholder">-</span>}
        </div>
        <div className="cambiarfechapago-field-row">
          <span className="cambiarfechapago-field-label">Total a pagar:</span>
          {formatoMoneda(total)}
        </div>
      </div>
    );
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="cambiarfechapago-overlay" onClick={onClose}></div>
      <div className="cambiarfechapago-modal" onClick={e => e.stopPropagation()}>
        <h2 className="cambiarfechapago-title">Cambiar Fecha de Pago</h2>
        {!selectedCuenta && (
          <div className="cambiarfechapago-search-controls">
            <select
              value={searchType}
              onChange={handleSearchTypeChange}
              className="cambiarfechapago-search-select"
            >
              <option value="nombre">Nombre</option>
              <option value="estado">Estado</option>
              <option value="ID">ID</option>
            </select>
            {searchType === 'estado' ? (
              <select
                value={searchValue}
                onChange={handleSearchValueChange}
                className="cambiarfechapago-search-select"
              >
                <option value="">Selecciona estado</option>
                <option value="⚠️">⚠️</option>
                <option value="❌">❌</option>
                <option value="✅">✅</option>
                <option value="😶‍🌫️">😶‍🌫️</option>
              </select>
            ) : (
              <input
                type="text"
                value={searchValue}
                onChange={handleSearchValueChange}
                className="cambiarfechapago-search-input"
                placeholder={`Buscar por ${searchType}`}
                onKeyPress={e => { if (e.key === 'Enter') handleSearch(); }}
              />
            )}
            <button onClick={handleSearch} className="cambiarfechapago-search-button">
              Buscar
            </button>
          </div>
        )}
        {!selectedCuenta && (
          <div className="cambiarfechapago-search-results">
            {searchResults.length > 0 ? (
              <ul className="cambiarfechapago-results-list">
                {searchResults.map((result) => (
                  <li key={result.id} className="cambiarfechapago-result-item" style={{ cursor: 'pointer' }}
                    onClick={() => handleSelectCuenta(result)}>
                    <div className="cambiarfechapago-result-id">ID: {result.ID}</div>
                    <div className="cambiarfechapago-result-nombre">Nombre: {result.nombre} {result.apellido}</div>
                    <div className="cambiarfechapago-result-estado">Estado: {result.PENDEJOALEJANDRO?.estado || result.estado || ''}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cambiarfechapago-no-results" style={{ color: 'var(--color-text, #fff)' }}>No se encontraron resultados</p>
            )}
          </div>
        )}
        {selectedCuenta && (
          <>
            <div className="cambiarfechapago-search-results">
              {renderCuentaInfo(selectedCuenta)}
            </div>
            <div className="cambiarfechapago-field-row cambiarfechapago-fecha-row">
              <span className="cambiarfechapago-field-label">Nueva fecha de pago:</span>
              <input
                type="date"
                value={nuevaFecha}
                onChange={handleFechaChange}
                className="cambiarfechapago-search-input"
              />
            </div>
            {/* Mostrar cálculo debajo del campo de fecha */}
            {selectedCuenta && (
              (() => {
                const proporcionalObj = calcularProporcional(selectedCuenta, nuevaFecha);
                if (nuevaFecha && proporcionalObj !== null) {
                  return (
                    <div className="cambiarfechapago-proporcional-info visible">
                      <span>Días de diferencia: {proporcionalObj.diffDays}</span>
                      <span><b>Costo del cambio de fecha: {formatoMoneda(proporcionalObj.proporcional)}</b></span>
                    </div>
                  );
                }
                return null;
              })()
            )}
            <button className="cambiarfechapago-search-button" onClick={handleGuardarFecha} disabled={!nuevaFecha}>
              Guardar fecha
            </button>
          </>
        )}
        {!selectedCuenta && (
          <p className="cambiarfechapago-soon">Selecciona una cuenta para cambiar la fecha.</p>
        )}
        <button onClick={onClose} className="cambiarfechapago-close-button">Cerrar</button>
      </div>
    </>
  );
};

export default CambiarFechaPago;
