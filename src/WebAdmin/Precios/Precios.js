// src/WebAdmin/Precios/Precios.js
import React, { useEffect, useState, useMemo } from 'react';
import './Precios.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { collection, getDocs, query, where, getDoc, doc, updateDoc } from 'firebase/firestore'; // <-- añadido getDoc, doc, updateDoc
import { db } from '../../firebase';

const Precios = ({ onClose }) => {
  // estados para servicios y clientes
  const [servicesList, setServicesList] = useState([]); // { id: docId, label: firstToken, tokens }
  const [selectedService, setSelectedService] = useState('');
  const [clientsList, setClientsList] = useState([]); // { id, nombre, apellido, price, displayId }
  const [selectedClients, setSelectedClients] = useState({}); // id -> bool

  // nuevo: estado para el input de precio y para "seleccionar todos"
  const [newPriceInput, setNewPriceInput] = useState(''); // muestra/formato en UI
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  // control de orden: true = mostrar más frecuentes primero, false = menos frecuentes primero
  const [sortDesc, setSortDesc] = useState(true);

  // Mapa price -> color hex (calculado dinámicamente según frecuencia)
  // const [priceColorMap, setPriceColorMap] = useState({});

  // util: convertir hex a rgba con alpha
  const hexToRgba = (hex, alpha = 1) => {
    if (!hex) return '';
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Reemplazar/añadir las funciones de formateo/parseo y remover las que ya no se usarán
  const formatPrice = (value) => {
    if (value === null || value === undefined || value === '') return '$0';
    const stringValue = value.toString();
    const numberValue = parseFloat(stringValue.replace(/[$,]/g, ''));
    return `$${numberValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const parsePrice = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[$,]/g, '');
  };

  // Formatea la parte entera con separadores (ej: 1234567 -> "1,234,567")
  const formatIntegerPart = (value) => {
    if (value === null || value === undefined || value === '') return '';
    // eliminar cualquier no dígito
    const digits = String(value).replace(/\D/g, '') || '0';
    const n = parseInt(digits, 10) || 0;
    return n.toLocaleString('en-US');
  };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // fetch servicios al montar
  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const serviciosRef = collection(db, 'Servicios');
        const snap = await getDocs(serviciosRef);
        // Filtrar solo servicios que tengan al menos un grupo con estado distinto de '😶‍🌫️'
        const list = [];
        snap.docs.forEach(d => {
          const docId = d.id;
          const data = d.data() || {};
          // buscar claves de grupo (g1,g2,...) y comprobar estados
          const grupos = Object.keys(data).filter(k => /^g\d+/i.test(k));
          // Sólo contar como "útil" si el grupo tiene un estado definido y ese estado NO es el emoji de inactividad.
          const tieneGrupoUtil = grupos.some(g => {
            const estado = data[g]?.estado;
            return estado && estado !== '😶‍🌫️';
          });
          if (tieneGrupoUtil) {
            const tokens = docId.split(',').map(t => t.trim().toUpperCase());
            list.push({ id: docId, label: tokens[0], tokens });
          }
        });
        list.sort((a,b) => a.label.localeCompare(b.label));
        setServicesList(list);
      } catch (err) {
        console.error('Error fetching servicios:', err);
      }
    };
    fetchServicios();
  }, []);

  // cuando cambia servicio seleccionado, buscar clientes que contengan ese servicio
  useEffect(() => {
    if (!selectedService) {
      setClientsList([]);
      setSelectedClients({});
      return;
    }

    const fetchClientsForService = async () => {
      try {
        // selectedService puede ser docId con comas; usamos el primer token para relacionarlo con clientes
        const firstToken = String(selectedService).split(',')[0].trim().toUpperCase();
        const clientesRef = collection(db, 'clientes');
        const q = query(clientesRef, where('servicio', 'array-contains', firstToken));
        const snap = await getDocs(q);
        // Filtrar clientes cuyo estado sea distinto a '😶‍🌫️'
        const visibleDocs = snap.docs.filter(d => {
          const data = d.data() || {};
          // usar mismo acceso que DetallesCliente (PENDEJOALEJANDRO?.estado) y fallback a data.estado
          const estado = (data.PENDEJOALEJANDRO && data.PENDEJOALEJANDRO.estado) || data.estado || '';
          return estado !== '😶‍🌫️';
        });
        const clients = visibleDocs.map(d => {
          const data = d.data();
          // buscar índice donde coincide este token en el arreglo servicio
          const serviciosArr = Array.isArray(data.servicio) ? data.servicio.map(s => String(s).toUpperCase()) : [];
          const idx = serviciosArr.findIndex(s => s === firstToken);
          const precioArr = Array.isArray(data.precio) ? data.precio : [];
          const price = idx !== -1 && precioArr[idx] !== undefined ? precioArr[idx] : '';
          return {
            id: d.id,
            displayId: data.ID || '',
            nombre: data.nombre || '',
            apellido: data.apellido || '',
            price: price
          };
        }).sort((a,b) => (a.nombre + ' ' + a.apellido).localeCompare(b.nombre + ' ' + b.apellido));
        setClientsList(clients);
        setSelectedClients({});
      } catch (err) {
        console.error('Error fetching clients for service:', err);
        setClientsList([]);
      }
    };
    fetchClientsForService();
  }, [selectedService]);

  // Si cambia la lista de clientes, resetear el selectAll
  useEffect(() => {
    setSelectAllChecked(false);
  }, [clientsList]);

  // Calcular frecuencias, mapa de colores y clientes ordenados por moda (desc)
  const { priceColorMap, priceFrequencyList, orderedClients } = useMemo(() => {
    const freq = {};
    clientsList.forEach(c => {
      const p = String(c.price ?? '').trim();
      if (p === '') return;
      freq[p] = (freq[p] || 0) + 1;
    });
    // entries ordenadas por frecuencia descendente
    const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]); // [ [price, count], ... ]
    const palette = [
      '#2ecc71', // verde (más repetido)
      '#f1c40f', // amarillo
      '#e67e22', // naranja
      '#3498db', // azul
      '#9b59b6', // morado
      '#1abc9c', // teal
      '#e74c3c', // rojo
      '#95a5a6'  // gris
    ];
    const map = {};
    entries.forEach(([price], idx) => {
      map[price] = palette[idx % palette.length];
    });
    // ordenar clientsList por la frecuencia del precio (desc), luego por nombre
    const rank = {};
    entries.forEach(([price], idx) => { rank[price] = idx; }); // menor idx => mayor frecuencia
    const ordered = [...clientsList].sort((a, b) => {
       const pa = String(a.price ?? '').trim();
       const pb = String(b.price ?? '').trim();
       const ra = pa === '' ? Number.MAX_SAFE_INTEGER : (rank[pa] !== undefined ? rank[pa] : Object.keys(rank).length);
       const rb = pb === '' ? Number.MAX_SAFE_INTEGER : (rank[pb] !== undefined ? rank[pb] : Object.keys(rank).length);
       if (ra !== rb) return ra - rb; // menor rank primero (más frecuente)
       // si mismo rank, ordenar por nombre
       const na = (a.nombre || '') + ' ' + (a.apellido || '');
       const nb = (b.nombre || '') + ' ' + (b.apellido || '');
       return na.localeCompare(nb);
     });
    // si sortDesc es false, invertimos la lista para mostrar menos frecuentes primero
    if (!sortDesc) ordered.reverse();
    return {
      priceColorMap: map,
      priceFrequencyList: entries.map(([price, count]) => ({ price, count })),
      orderedClients: ordered
    };
  }, [clientsList, sortDesc]);

  // useEffect: sincronizar input cuando cambia la selección de clientes
  useEffect(() => {
    const selectedIds = Object.keys(selectedClients).filter(id => selectedClients[id]);
    if (selectedIds.length === 1) {
      const singleId = selectedIds[0];
      const client = clientsList.find(c => c.id === singleId);
      const priceVal = client ? client.price : '';
      // usar formatPrice como referencia de BuscarCupo
      setNewPriceInput(priceVal === '' || priceVal === null || priceVal === undefined ? '' : formatPrice(priceVal));
    } else if (selectedIds.length === 0) {
      setNewPriceInput('');
    }
    // si hay más de uno, no sobreescribimos lo que el usuario esté tipeando
  }, [selectedClients, clientsList]);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('precios-overlay')) {
      onClose();
    }
  };

  // nuevo: toggle seleccionar todos los clientes visibles
  const handleToggleSelectAll = () => {
    const newVal = !selectAllChecked;
    setSelectAllChecked(newVal);
    if (newVal) {
      const all = {};
      clientsList.forEach(c => { all[c.id] = true; });
      setSelectedClients(all);
    } else {
      setSelectedClients({});
    }
  };

  // Reemplazar las versiones actuales por estas:

  const handleNewPriceChange = (e) => {
    let value = e.target.value;

    // Eliminar cualquier carácter que no sea número
    const numericValue = value.replace(/[^\d]/g, '');

    // Si no hay nada, limpiar
    if (numericValue === '') {
      setNewPriceInput('');
      return;
    }

    // Convertir a número
    const numberValue = parseFloat(numericValue);

    // Aplicar formato en vivo con separadores y símbolo $
    const formatted = `$${numberValue.toLocaleString('en-US')}`;
    setNewPriceInput(formatted);
  };

  // Ya no necesitamos hacer nada en blur, solo mantener coherencia
  const handleNewPriceBlur = () => {
    if (newPriceInput.trim() === '') return;
    const n = parseFloat(parsePrice(newPriceInput));
    setNewPriceInput(Number.isNaN(n) ? '' : formatPrice(n));
  };


  // modificar handleSave para actualizar Firestore con el nuevo precio
  const handleSave = async () => {
    // validaciones
    if (!selectedService) {
      toast.warn('Selecciona un servicio primero.');
      return;
    }
    // usar parsePrice para limpiar $ y comas y convertir a número
    const parsed = parseFloat(parsePrice(newPriceInput));
    if (Number.isNaN(parsed)) {
      toast.warn('Ingresa un precio válido.');
      return;
    }
    // guardaremos el precio como cadena (sin $ ni comas)
    const parsedString = parsePrice(newPriceInput);

    const selectedIds = Object.keys(selectedClients).filter(id => selectedClients[id]);
    if (selectedIds.length === 0) {
      toast.warn('Selecciona al menos un cliente.');
      return;
    }

    const firstToken = String(selectedService).split(',')[0].trim().toUpperCase();
    try {
      // actualizar todos los clientes seleccionados en paralelo
      await Promise.all(selectedIds.map(async clientId => {
        const clientRef = doc(db, 'clientes', clientId);
        const snap = await getDoc(clientRef);
        const data = snap.exists() ? snap.data() : {};
        const serviciosArr = Array.isArray(data.servicio) ? data.servicio.map(s => String(s).toUpperCase()) : [];
        const idx = serviciosArr.findIndex(s => s === firstToken);
        const precioArr = Array.isArray(data.precio) ? [...data.precio] : [];
        // asegurar longitud suficiente
        if (idx === -1) {
          // si por alguna razón el cliente ya no tiene el servicio, agregar al final (como cadena)
          precioArr.push(parsedString);
        } else {
          while (precioArr.length <= idx) precioArr.push('');
          precioArr[idx] = parsedString;
        }
        await updateDoc(clientRef, { precio: precioArr });
      }));

      // actualizar la UI localmente para reflejar nuevos precios
      setClientsList(prev => prev.map(c => selectedClients[c.id] ? { ...c, price: parsedString } : c));
      toast.success('Precios actualizados correctamente.');
    } catch (err) {
      console.error('Error actualizando precios:', err);
      toast.error('Error al actualizar algunos precios.');
    }
  };

  const handleToggleClient = (id) => {
    setSelectedClients(prev => {
      const next = { ...prev, [id]: !prev[id] };
      // si desmarcamos algún cliente, actualizar selectAllChecked
      if (selectAllChecked && !next[id]) setSelectAllChecked(false);
      return next;
    });
  };

  // situado antes del return: calcular selects/total para mostrarlos en la UI
  const selectedCount = Object.values(selectedClients).filter(Boolean).length;
  const totalCount = clientsList.length;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="precios-overlay" onClick={handleOverlayClick}></div>
      <div className="precios-modal" onClick={e => e.stopPropagation()}>
        <h2 className="precios-title">Precios</h2>
        <div className="precios-body">
          {/* Select de servicios */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Servicio:</label>
            <select
              value={selectedService}
              onChange={e => setSelectedService(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: 6, background: '#121212', color: '#fff', border: '1px solid #444' }}
            >
              <option value="">{servicesList.length === 0 ? 'No hay servicios disponibles' : 'Selecciona un servicio'}</option>
              {servicesList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label} {s.id.includes(',') ? `(${s.id})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Vista de clientes: checkbox por cliente con nombre y precio */}
          <div style={{ marginBottom: 12 }}>
            {/* Mostrar label con contador seleccionado/total en una sola línea */}
            <label style={{ display: 'block', marginBottom: 6, color: '#e0e0e0', fontSize: 14 }}>
              Clientes con este servicio:&nbsp;
              <span style={{ color: '#aaa', fontWeight: 700 }}>{selectedCount}/{totalCount}</span>
            </label>

            {/* checkbox seleccionar todos (nuevo) */}
            <div className="precios-select-all" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="precios-select-all"
                checked={selectAllChecked}
                onChange={handleToggleSelectAll}
                className="precios-custom-checkbox"
                aria-label="Seleccionar todos"
              />
              <label htmlFor="precios-select-all" style={{ color: '#ccc', cursor: 'pointer' }}>Seleccionar todos</label>
              {/* botón a la derecha para alternar orden por frecuencia */}
              <button
                type="button"
                className={`precios-toggle-order ${!sortDesc ? 'active' : ''}`}
                onClick={() => setSortDesc(s => !s)}
                title="Cambiar orden: más frecuentes / menos frecuentes"
                aria-pressed={!sortDesc}
                style={{ marginLeft: 'auto' }}
              >
                {sortDesc ? 'Más frecuentes ↓' : 'Menos frecuentes ↑'}
              </button>
             </div>

            {clientsList.length === 0 ? (
              <div style={{ color: '#ccc', padding: 8 }}>No hay clientes para este servicio</div>
            ) : (
              <div className="precios-clients-list">
                {orderedClients.map(c => {
                   const priceKey = String(c.price ?? '').trim();
                   const colorHex = priceColorMap[priceKey];
                   const bg = colorHex ? hexToRgba(colorHex, 0.07) : undefined;
                   const border = colorHex ? `1px solid ${hexToRgba(colorHex, 0.18)}` : undefined;
                   const priceColor = colorHex || undefined;
                    return (
                  <div key={c.id} className="precios-client-item" style={{ background: bg, border }}>
                     <div className="precios-client-left">
                       <input
                         type="checkbox"
                         className="precios-custom-checkbox"
                         checked={!!selectedClients[c.id]}
                         onChange={() => handleToggleClient(c.id)}
                         aria-label={`Seleccionar ${c.nombre} ${c.apellido}`}
                       />
                       <div className="precios-client-name">
                         <div className="precios-client-fullname">{c.nombre} {c.apellido}{c.displayId ? ` (${c.displayId})` : ''}</div>
                       </div>
                     </div>
                    <div className="precios-client-price" style={{ color: priceColor }}>
                      {formatPrice(c.price)}
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>

        {/* nuevo: input para ingresar el nuevo precio que aplicará al guardar */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
          <label style={{ color: '#ccc', minWidth: 110 }}>Nuevo precio:</label>
          <input
            type="text"
            value={newPriceInput}
            onChange={handleNewPriceChange}
            onBlur={handleNewPriceBlur}
            placeholder="$0"
            className="precios-price-input"
            aria-label="Nuevo precio para clientes seleccionados"
          />
        </div>

        <div className="precios-actions">
          <button className="precios-button precios_save" onClick={handleSave}>Guardar</button>
          <button className="precios-button precios_close" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </>
  );
};

export default Precios;