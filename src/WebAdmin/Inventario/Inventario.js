import React, { useEffect, useState } from 'react';
import './Inventario.css';
import spotifyIcon from '../../recursos/svg/SPOTIFY.svg';
import youtubeIcon from '../../recursos/svg/YOUTUBE.svg';
import netflixIcon from '../../recursos/svg/NETFLIX,NETFLIXTV,NETFLIXME.svg';
import primeVideoIcon from '../../recursos/svg/PRIMEVIDEO.svg';
import paramountIcon from '../../recursos/svg/PARAMOUNT.svg';
import disneyIcon from '../../recursos/svg/DISNEY.svg';
import crunchyIcon from '../../recursos/svg/CRUNCHY.svg';
import maxIcon from '../../recursos/svg/MAX.svg';

// Añadidos: funciones de Firestore y db exportado desde src/firebase.js
import { collection, getDocs, doc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const serviceIcons = {
  SPOTIFY: spotifyIcon,
  'YOUTUBE PREMIUM': youtubeIcon,
  YOUTUBE: youtubeIcon,
  NETFLIX: netflixIcon,
  NETFLIXSINTV: netflixIcon,
  NETFLIXTV: netflixIcon,
  'PRIME VIDEO': primeVideoIcon,
  PRIMEVIDEO: primeVideoIcon,
  'PARAMOUNT+': paramountIcon,
  PARAMOUNT: paramountIcon,
  'DISNEY+': disneyIcon,
  DISNEY: disneyIcon,
  CRUNCHYROLL: crunchyIcon,
  MAX: maxIcon,
};

const Inventario = ({ onClose }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // nuevo: selección y campos editables
  const [selectedId, setSelectedId] = useState(null);
  const [editInfo, setEditInfo] = useState('');
  const [editPrecio, setEditPrecio] = useState('');
  const [toast, setToast] = useState(null);

  // nuevo: crear servicio
  const [showCreate, setShowCreate] = useState(false);
  const [newId, setNewId] = useState('');
  const [newInfo, setNewInfo] = useState('');
  const [newPrecio, setNewPrecio] = useState('');

  // formateo / parseo de precio solicitado
  const formatPrice = (value) => {
    if (value === null || value === undefined || value === '') return '$0';
    const stringValue = value.toString();
    const numberValue = parseFloat(stringValue.replace(/[$,]/g, ''));
    if (Number.isNaN(numberValue)) return '$0';
    return `$${numberValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const parsePrice = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[$,]/g, '');
  };

  useEffect(() => {
    let mounted = true;
    let unsubscribe = null;

    async function setupRealtime() {
      setLoading(true);
      try {
        // Intento real: suscripción en tiempo real a la colección "inventario"
        unsubscribe = onSnapshot(collection(db, 'inventario'), (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, data: d.data() }));
          const mapped = docs.map(d => {
            const id = d.id;
            const data = d.data || {};
            return { id, data };
          });
          if (mounted) {
            setItems(mapped);
            setLoading(false);
          }
        }, (err) => {
          // en caso de error de snapshot, caemos a fallback de una sola lectura
          console.error('Snapshot error:', err);
          (async () => {
            try {
              const snap = await getDocs(collection(db, 'inventario'));
              const docs = snap.docs.map(d => ({ id: d.id, data: d.data() }));
              if (mounted) {
                setItems(docs.map(d => ({ id: d.id, data: d.data })));
                setLoading(false);
              }
            } catch (e) {
              // fallback local si todo falla
              if (mounted) {
                const fallback = [
                  { id: 'CRUNCHYROLL', data: { info: 'Cuenta Crunchyroll premium', precio: '3.99' } },
                  { id: 'DISNEY+', data: { info: 'Disney+ Plan mensual', precio: '7.99' } },
                  { id: 'MAX', data: { info: 'MAX HD', precio: '6.49' } },
                  { id: 'NETFLIXSINTV', data: { info: 'Netflix sin TV', precio: '4.99' } },
                  { id: 'NETFLIXTV', data: { info: 'Netflix con TV', precio: '5.99' } },
                  { id: 'PARAMOUNT+', data: { info: 'Paramount+ plan', precio: '4.49' } },
                  { id: 'PRIME VIDEO', data: { info: 'Prime Video acceso', precio: '2.99' } },
                  { id: 'SPOTIFY', data: { info: 'Spotify Premium', precio: '3.49' } },
                  { id: 'YOUTUBE PREMIUM', data: { info: 'YouTube Premium', precio: '4.29' } },
                ];
                setItems(fallback);
                setLoading(false);
              }
            }
          })();
        });
      } catch (err) {
        // fallback local si la suscripción no es posible
        if (mounted) {
          const fallback = [
            { id: 'CRUNCHYROLL', data: { info: 'Cuenta Crunchyroll premium', precio: '3.99' } },
            { id: 'DISNEY+', data: { info: 'Disney+ Plan mensual', precio: '7.99' } },
            { id: 'MAX', data: { info: 'MAX HD', precio: '6.49' } },
            { id: 'NETFLIXSINTV', data: { info: 'Netflix sin TV', precio: '4.99' } },
            { id: 'NETFLIXTV', data: { info: 'Netflix con TV', precio: '5.99' } },
            { id: 'PARAMOUNT+', data: { info: 'Paramount+ plan', precio: '4.49' } },
            { id: 'PRIME VIDEO', data: { info: 'Prime Video acceso', precio: '2.99' } },
            { id: 'SPOTIFY', data: { info: 'Spotify Premium', precio: '3.49' } },
            { id: 'YOUTUBE PREMIUM', data: { info: 'YouTube Premium', precio: '4.29' } },
          ];
          setItems(fallback);
          setLoading(false);
          setError(err.message || 'Error cargando inventario');
        }
      }
    }

    setupRealtime();

    return () => { mounted = false; if (unsubscribe) unsubscribe(); };
  }, []);

  const normalizeKey = (id) => {
    if (!id) return '';
    // mayúsculas, trim y normalización básica (mantener '+' cuando exista)
    return String(id).toUpperCase().trim();
  };

  const prettyName = (id) => {
    if (!id) return '';
    const up = String(id).toUpperCase().trim();
    if (up.includes('DISNEY')) return 'DISNEY+';
    if (up.includes('NETFLIXSINTV')) return 'NETFLIX SIN TV';
    if (up.includes('NETFLIX')) return 'NETFLIX TV';
    if (up.includes('YOUTUBE')) return 'YOUTUBE PREMIUM';
    if (up.includes('PRIME') && up.includes('VIDEO')) return 'PRIME VIDEO';
    if (up.includes('PARAMOUNT')) return up.includes('+') ? 'PARAMOUNT+' : 'PARAMOUNT+';
    if (up.includes('CRUNCHY')) return 'CRUNCHYROLL';
    // Fallback: convierte CAMEL/UPPER a espacios
    return id.replace(/([A-Z])/g, ' $1').trim();
  };

  const getIconForId = (id) => {
    if (!id) return youtubeIcon;
    const up = normalizeKey(id);

    // intentos directos (con espacios / '+')
    if (serviceIcons[up]) return serviceIcons[up];

    // sin espacios
    const nospace = up.replace(/\s+/g, '');
    if (serviceIcons[nospace]) return serviceIcons[nospace];

    // sin '+'
    const noPlus = up.replace(/\+/g, '');
    if (serviceIcons[noPlus]) return serviceIcons[noPlus];

    const noPlusNoSpace = noPlus.replace(/\s+/g, '');
    if (serviceIcons[noPlusNoSpace]) return serviceIcons[noPlusNoSpace];

    // por inclusión de palabra
    if (up.includes('DISNEY')) return disneyIcon;
    if (up.includes('NETFLIX')) return netflixIcon;
    if (up.includes('YOUTUBE')) return youtubeIcon;
    if (up.includes('SPOTIFY')) return spotifyIcon;
    if (up.includes('PRIME')) return primeVideoIcon;
    if (up.includes('PARAMOUNT')) return paramountIcon;
    if (up.includes('CRUNCHY')) return crunchyIcon;
    if (up.includes('MAX')) return maxIcon;

    return youtubeIcon; // fallback
  };

  // nuevo: seleccionar servicio y rellenar campos
  const selectItem = (id, data) => {
    setSelectedId(id);
    setEditInfo(data?.info ?? '');
    setEditPrecio(parsePrice(data?.precio ?? (data?.price ?? '')));
  };

  // nuevo: guardar cambios (intento real con Firestore; fallback local)
  const saveChanges = async () => {
    if (!selectedId) return;
    const prev = items.find(it => it.id === selectedId);
    const prevPrecio = prev?.data?.precio ?? prev?.data?.price ?? null;
    const precioToStore = parsePrice(editPrecio);

    try {
      // actualizar Firestore
      await updateDoc(doc(db, 'inventario', selectedId), { info: editInfo, precio: precioToStore });
      // estado local será actualizado por snapshot en tiempo real; igual mostramos toast
      if (String(prevPrecio) !== String(precioToStore)) {
        showToast(`Precio actualizado a ${formatPrice(precioToStore)}`);
      } else {
        showToast('Información actualizada');
      }
    } catch (e) {
      // fallback: actualizar estado local
      setItems(prevItems => prevItems.map(it => {
        if (it.id !== selectedId) return it;
        return { id: it.id, data: { ...it.data, info: editInfo, precio: precioToStore } };
      }));
      if (String(prevPrecio) !== String(precioToStore)) {
        showToast(`Precio actualizado a ${formatPrice(precioToStore)}`);
      } else {
        showToast('Información actualizada (local)');
      }
    }
  };

  const showToast = (msg, ms = 3000) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  // nuevo: crear servicio (intento real con Firestore; fallback local). ID forzado a mayúsculas.
  const createService = async () => {
    if (!newId) { showToast('Debes indicar un nombre (id)'); return; }
    const id = String(newId).trim().toUpperCase();
    const precioToStore = parsePrice(newPrecio);
    try {
      // crear/reescribir doc en Firestore (id = nombre del servicio)
      await setDoc(doc(db, 'inventario', id), { info: String(newInfo), precio: precioToStore });
      // al usar snapshot realtime, el nuevo documento aparecerá automáticamente.
      setShowCreate(false);
      setNewId(''); setNewInfo(''); setNewPrecio('');
      showToast('Servicio creado');
    } catch (e) {
      // fallback local
      setItems(prev => [...prev, { id, data: { info: newInfo, precio: precioToStore } }]);
      setShowCreate(false);
      setNewId(''); setNewInfo(''); setNewPrecio('');
      showToast('Servicio creado (local)');
    }
  };

  return (
    <div className="inventario-overlay" onClick={onClose}>
      <div className="inventario-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="inventario-title">Inventario de Servicios</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="create-service" onClick={() => setShowCreate(true)}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>+</span>
              <span style={{ fontSize: 13 }}>Crear</span>
            </button>
            <button className="cclose-button" onClick={onClose}>X</button>
          </div>
        </div>

        <div className="inventario-grid">
          {loading && <div style={{ color: '#cdd2d8' }}>Cargando...</div>}
          {error && <div style={{ color: '#ff6b6b' }}>{error}</div>}
          {!loading && !error && items.map(({ id, data }) => {
            const icon = getIconForId(id);
            const name = prettyName(id);
            const restante = data && (data.restante ?? data.remaining ?? data.count ?? null);
            return (
              <div
                className={`inventario-item${selectedId === id ? ' selected' : ''}`}
                key={id}
                onClick={() => selectItem(id, data)}
                role="button"
                tabIndex={0}
              >
                <img src={icon} alt={id} className="inventario-icon" />
                <span className="inventario-label">{name}</span>
                <span className="inventario-remaining">{data?.precio ? `Precio: ${formatPrice(data.precio)}` : (restante ? `Rest: ${restante}` : '')}</span>
              </div>
            );
          })}
        </div>

        <div className="inventario-editor">
          <div className="editor-left">
            <label style={{ color: '#cdd2d8', fontWeight:700 }}>Info</label>
            <textarea value={editInfo} onChange={(e) => setEditInfo(e.target.value)} placeholder="Información del servicio..." />
          </div>

          <div className="editor-right">
            <label style={{ color: '#cdd2d8', fontWeight:700 }}>Precio</label>
            <input
              type="text"
              value={formatPrice(editPrecio)}
              onChange={(e) => setEditPrecio(parsePrice(e.target.value))}
              placeholder="0.00"
            />
            <div className="inventario-actions">
              <button className="btn" onClick={saveChanges}>Guardar</button>
              <button className="btn secondary" onClick={() => { setSelectedId(null); setEditInfo(''); setEditPrecio(''); }}>Limpiar</button>
            </div>

            {/* eliminado: formulario inline de creación */}
          </div>
        </div>

      </div>

      {showCreate && (
        <div
          // create overlay: detiene la propagación para que no cierre todo el inventario,
          // y el click en el backdrop cierra sólo este modal.
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={(e) => { e.stopPropagation(); setShowCreate(false); }}
        >
          <div
            // modal content: evitar que el click cierre el overlay
            style={{
              background: '#0b0f14',
              padding: 18,
              borderRadius: 8,
              width: 420,
              maxWidth: '95%',
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
              color: '#cdd2d8'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Crear servicio</h3>
              <button className="cclose-button" onClick={() => setShowCreate(false)}>X</button>
            </div>

            <label style={{ color: '#cdd2d8', fontWeight:700 }}>Nuevo servicio (id)</label>
            <input
              type="text"
              value={newId}
              onChange={(e) => setNewId(e.target.value.toUpperCase())}
              placeholder="ID del documento"
              style={{ width: '100%', marginTop: 6, marginBottom: 8 }}
            />

            <label style={{ color: '#cdd2d8', fontWeight:700 }}>Info</label>
            <input
              type="text"
              value={newInfo}
              onChange={(e) => setNewInfo(e.target.value)}
              placeholder="Información"
              style={{ width: '100%', marginTop: 6, marginBottom: 8 }}
            />

            <label style={{ color: '#cdd2d8', fontWeight:700 }}>Precio</label>
            <input
              type="text"
              value={formatPrice(newPrecio)}
              onChange={(e) => setNewPrecio(parsePrice(e.target.value))}
              placeholder="Precio"
              style={{ width: '100%', marginTop: 6 }}
            />

            <div className="inventario-actions" style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={createService}>Crear</button>
              <button className="btn secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="inventario-toast">{toast}</div>}
    </div>
  );
};

export default Inventario;
