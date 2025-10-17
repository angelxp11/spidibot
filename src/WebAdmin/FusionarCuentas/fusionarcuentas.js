import React, { useState } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import './fusionarcuentas.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const firestore = getFirestore();

const normalizarTexto = (texto) => {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const FusionarCuentas = ({ onClose }) => {
  const [searchType, setSearchType] = useState('nombre');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCuenta1, setSelectedCuenta1] = useState(null);
  const [selectedCuenta2, setSelectedCuenta2] = useState(null);
  const [showFusionarA, setShowFusionarA] = useState(false);
  const [showVerFusion, setShowVerFusion] = useState(false);

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

      const formattedResults = uniqueResults.map(data => ({
        id: data.id,
        nombre: data.nombre,
        apellido: data.apellido,
        estado: data.PENDEJOALEJANDRO?.estado || '',
        ID: data.ID,
        ...data
      }));

      setSearchResults(formattedResults);
    } catch (error) {
      setSearchResults([]);
    }
  };

  const searchByField = async (field, searchValue) => {
    try {
      const clientesRef = collection(firestore, 'clientes');
      const q = query(clientesRef, where(field, '==', searchValue));
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre,
          apellido: data.apellido,
          estado: data.PENDEJOALEJANDRO?.estado || '',
          ID: data.ID,
          ...data
        };
      });

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

  // Cambia el estado para mostrar la segunda búsqueda
  const handleFusionarAClick = () => {
    setShowFusionarA(true);
    setSearchResults([]);
    setSearchValue('');
    setSelectedCuenta2(null);
  };

  // Selecciona la cuenta 1 o 2 según el flujo
  const handleSelectCuenta = (cuenta) => {
    if (!showFusionarA) {
      setSelectedCuenta1(cuenta);
    } else {
      setSelectedCuenta2(cuenta);
    }
  };

  // Muestra el resumen de la fusión
  const handleVerFusion = () => {
    setShowVerFusion(true);
  };

  // Lógica para aceptar la fusión (real)
  const handleAceptarFusion = async () => {
    if (!selectedCuenta1 || !selectedCuenta2) return;

    // Campos a fusionar
    const campos = [
      { key: 'notas', default: [] },
      { key: 'grupo', default: [] },
      { key: 'servicio', default: [] },
      { key: 'precio', default: [] },
      { key: 'pagado', default: [] }
    ];

    // Construir nuevos valores fusionados
    const nuevosValores = {};
    campos.forEach(({ key, default: def }) => {
      const arr1 = Array.isArray(selectedCuenta1[key]) ? selectedCuenta1[key] : def;
      const arr2 = Array.isArray(selectedCuenta2[key]) ? selectedCuenta2[key] : def;
      nuevosValores[key] = [...arr2, ...arr1];
    });

    try {
      // Actualizar cuenta 2
      const docRef2 = doc(firestore, 'clientes', selectedCuenta2.id);
      await updateDoc(docRef2, nuevosValores);

      // Borrar cuenta 1
      const docRef1 = doc(firestore, 'clientes', selectedCuenta1.id);
      await deleteDoc(docRef1);

      toast.success('Fusión completada correctamente.');

      // Reiniciar estados
      setSelectedCuenta1(null);
      setSelectedCuenta2(null);
      setShowFusionarA(false);
      setShowVerFusion(false);
      setSearchResults([]);
      setSearchValue('');
    } catch (err) {
      toast.error('Error al fusionar: ' + err.message);
    }
  };

  // Utilidad para mostrar arrays como tags
  const renderTags = (arr) => Array.isArray(arr) && arr.length > 0
    ? (
      <div className="fusionarcuentas-tags-row">
        {arr.map((v, i) => (
          <span className="fusionarcuentas-tag" key={i}>{String(v)}</span>
        ))}
      </div>
    )
    : <span style={{ color: '#aaa' }}>-</span>;

  const renderFieldRow = (label, content) => (
    <div className="fusionarcuentas-field-row">
      <span className="fusionarcuentas-field-label">{label}:</span>
      {content}
    </div>
  );

  const renderCuentaInfo = (cuenta, label) => (
    <div className="fusionarcuentas-result-item">
      {label && <strong>{label}</strong>}
      <div className="fusionarcuentas-result-id">ID: {cuenta.ID}</div>
      <div className="fusionarcuentas-result-nombre">Nombre: {cuenta.nombre} {cuenta.apellido}</div>
      <div className="fusionarcuentas-result-estado">Estado: {cuenta.PENDEJOALEJANDRO?.estado || cuenta.estado || ''}</div>
      {renderFieldRow('Fecha inicial', cuenta.fechaInicial || <span style={{ color: '#aaa' }}>-</span>)}
      {renderFieldRow('Fecha final', cuenta.fechaFinal || <span style={{ color: '#aaa' }}>-</span>)}
      {renderFieldRow('Notas', renderTags(cuenta.notas))}
      {renderFieldRow('Grupos', renderTags(cuenta.grupo))}
      {renderFieldRow('Servicios', renderTags(cuenta.servicio))}
      {renderFieldRow('Precios', renderTags(cuenta.precio))}
      {renderFieldRow('Pagado', renderTags(cuenta.pagado))}
      {renderFieldRow('Email', cuenta.email || <span style={{ color: '#aaa' }}>-</span>)}
      {renderFieldRow('Teléfono', cuenta.telefono || <span style={{ color: '#aaa' }}>-</span>)}
      {/* Mostrar info de SPOTIFY si existe */}
      {cuenta.SPOTIFY && (
        <div style={{ marginTop: 8 }}>
          <div><b>SPOTIFY:</b></div>
          {renderFieldRow('Email', renderTags(cuenta.SPOTIFY.email))}
          {renderFieldRow('Password', renderTags(cuenta.SPOTIFY.password))}
          {renderFieldRow('Principal', renderTags(cuenta.SPOTIFY.principal))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="fusionarcuentas-overlay" onClick={onClose}></div>
      <div className="fusionarcuentas-modal" onClick={e => e.stopPropagation()}>
        <h2 className="fusionarcuentas-title">Fusionar Cuentas</h2>
        {/* Primer bloque de búsqueda */}
        {!selectedCuenta1 && (
          <div className="fusionarcuentas-search-controls">
            <select
              value={searchType}
              onChange={e => { setSearchType(e.target.value); setSearchValue(''); }}
              className="fusionarcuentas-search-select"
            >
              <option value="nombre">Nombre</option>
              <option value="estado">Estado</option>
              <option value="ID">ID</option>
            </select>
            {searchType === 'estado' ? (
              <select
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                className="fusionarcuentas-search-select"
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
                onChange={e => setSearchValue(e.target.value)}
                className="fusionarcuentas-search-input"
                placeholder={`Buscar por ${searchType}`}
                onKeyPress={e => { if (e.key === 'Enter') handleSearch(); }}
              />
            )}
            <button onClick={handleSearch} className="fusionarcuentas-search-button">
              Buscar
            </button>
          </div>
        )}

        {/* Resultados de búsqueda para cuenta 1 */}
        {!selectedCuenta1 && (
          <div className="fusionarcuentas-search-results">
            {searchResults.length > 0 ? (
              <ul className="fusionarcuentas-results-list">
                {searchResults.map((result) => (
                  <li key={result.id} className="fusionarcuentas-result-item" style={{ cursor: 'pointer' }}
                    onClick={() => handleSelectCuenta(result)}>
                    <div className="fusionarcuentas-result-id">ID: {result.ID}</div>
                    <div className="fusionarcuentas-result-nombre">Nombre: {result.nombre} {result.apellido}</div>
                    <div className="fusionarcuentas-result-estado">Estado: {result.estado}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="fusionarcuentas-no-results" style={{ color: 'var(--color-text, #fff)' }}>No se encontraron resultados</p>
            )}
          </div>
        )}

        {/* Si ya seleccionamos la cuenta 1, mostrar resumen y botón Fusionar a */}
        {selectedCuenta1 && !showFusionarA && (
          <>
            <div className="fusionarcuentas-search-results">
              {renderCuentaInfo(selectedCuenta1)}
            </div>
            <button className="fusionarcuentas-search-button" onClick={handleFusionarAClick}>
              Fusionar a...
            </button>
          </>
        )}

        {/* Segunda búsqueda para seleccionar cuenta destino */}
        {showFusionarA && !selectedCuenta2 && (
          <>
            <div className="fusionarcuentas-search-controls">
              <select
                value={searchType}
                onChange={e => { setSearchType(e.target.value); setSearchValue(''); }}
                className="fusionarcuentas-search-select"
              >
                <option value="nombre">Nombre</option>
                <option value="estado">Estado</option>
                <option value="ID">ID</option>
              </select>
              {searchType === 'estado' ? (
                <select
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  className="fusionarcuentas-search-select"
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
                  onChange={e => setSearchValue(e.target.value)}
                  className="fusionarcuentas-search-input"
                  placeholder={`Buscar por ${searchType}`}
                  onKeyPress={e => { if (e.key === 'Enter') handleSearch(); }}
                />
              )}
              <button onClick={handleSearch} className="fusionarcuentas-search-button">
                Buscar
              </button>
            </div>
            <div className="fusionarcuentas-search-results">
              {searchResults.length > 0 ? (
                <ul className="fusionarcuentas-results-list">
                  {searchResults
                    .filter(r => r.id !== selectedCuenta1.id)
                    .map((result) => (
                      <li key={result.id} className="fusionarcuentas-result-item" style={{ cursor: 'pointer' }}
                        onClick={() => handleSelectCuenta(result)}>
                        <div className="fusionarcuentas-result-id">ID: {result.ID}</div>
                        <div className="fusionarcuentas-result-nombre">Nombre: {result.nombre} {result.apellido}</div>
                        <div className="fusionarcuentas-result-estado">Estado: {result.estado}</div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="fusionarcuentas-no-results" style={{ color: 'var(--color-text, #fff)' }}>No se encontraron resultados</p>
              )}
            </div>
          </>
        )}

        {/* Mostrar resumen de ambas cuentas y botón Ver fusión */}
        {selectedCuenta1 && selectedCuenta2 && !showVerFusion && (
          <>
            <div className="fusionarcuentas-search-results">
              {renderCuentaInfo(selectedCuenta1, "Cuenta 1:")}
              {renderCuentaInfo(selectedCuenta2, "Cuenta 2:")}
            </div>
            <button className="fusionarcuentas-search-button" onClick={handleVerFusion}>
              Ver fusión
            </button>
          </>
        )}

        {/* Mostrar detalles finales y botón Aceptar fusión */}
        {showVerFusion && (
          <>
            <div className="fusionarcuentas-search-results">
              {renderCuentaInfo(selectedCuenta1, "Cuenta 1:")}
              {renderCuentaInfo(selectedCuenta2, "Cuenta 2:")}
            </div>
            <button className="fusionarcuentas-search-button" onClick={handleAceptarFusion}>
              Aceptar fusión
            </button>
          </>
        )}

        {/* Mensaje por defecto si no hay selección */}
        {!selectedCuenta1 && (
          <p className="fusionarcuentas-soon">Selecciona una cuenta para fusionar.</p>
        )}
        {/* Botón de cierre */}
        <button onClick={onClose} className="fusionarcuentas-close-button">Cerrar</button>
      </div>
    </>
  );
};

export default FusionarCuentas;
