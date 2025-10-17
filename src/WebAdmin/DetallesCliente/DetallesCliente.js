import React, { useState, useEffect } from 'react';
import './DetallesCliente.css';
import { getFirestore, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import { FaSave, FaTimes, FaFileAlt, FaTrash, FaPlus, FaTimesCircle } from 'react-icons/fa';

const firestore = getFirestore();

const convertirFecha = (fecha) => {
  const [dia, mes, anio] = fecha.split('/');
  return `${anio}-${mes}-${dia}`;
};

const convertirFechaInvertida = (fecha) => {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
};

function DetallesCliente({ client, onClose, onSave, onDelete, fondo }) {
  const [clientData, setClientData] = useState({
    ID: client.ID,
    nombre: client.nombre,
    apellido: client.apellido,
    telefono: client.telefono,
    email: client.email,
    fechaInicial: convertirFecha(client.fechaInicial),
    fechaFinal: convertirFecha(client.fechaFinal),
    pagado: Array.isArray(client.pagado) ? client.pagado : (client.pagado ? client.pagado.split(',').map(x => x.trim()) : []),
    estado: client.PENDEJOALEJANDRO?.estado || '',
    grupo: Array.isArray(client.grupo) ? client.grupo : (client.grupo ? client.grupo.split(',').map(x => x.trim()) : []),
    servicio: Array.isArray(client.servicio) ? client.servicio : (client.servicio ? client.servicio.split(',').map(x => x.trim()) : []),
    notas: Array.isArray(client.notas) ? client.notas : (client.notas ? client.notas.split(',').map(x => x.trim()) : []),
    precio: Array.isArray(client.precio) ? client.precio : (client.precio ? client.precio.split(',').map(x => x.trim()) : []),
    SPOTIFY: {
      email: client.SPOTIFY?.email[0] || '',
      password: client.SPOTIFY?.password[0] || '',
      principal: client.SPOTIFY?.principal || [true]
    }
  });
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const [showSpotifyInfo, setShowSpotifyInfo] = useState(false);
  // Estados para los inputs de nuevos tags
  const [newGrupo, setNewGrupo] = useState('');
  const [newServicio, setNewServicio] = useState('');
  const [newNotas, setNewNotas] = useState('');
  const [newPrecio, setNewPrecio] = useState('');
  const [newPagado, setNewPagado] = useState('');

  // Estados para mostrar input de agregar tag
  const [showAddInput, setShowAddInput] = useState({
    grupo: false,
    servicio: false,
    notas: false,
    precio: false,
    pagado: false
  });

  // Estados para edición de tags
  const [editTag, setEditTag] = useState({
    grupo: { idx: null, value: '' },
    servicio: { idx: null, value: '' },
    notas: { idx: null, value: '' },
    precio: { idx: null, value: '' },
    pagado: { idx: null, value: '' }
  });

  // Sincroniza clientData cuando cambia el cliente recibido por props
  useEffect(() => {
    setClientData({
      ID: client.ID,
      nombre: client.nombre,
      apellido: client.apellido,
      telefono: client.telefono,
      email: client.email,
      fechaInicial: convertirFecha(client.fechaInicial),
      fechaFinal: convertirFecha(client.fechaFinal),
      pagado: Array.isArray(client.pagado) ? client.pagado : (client.pagado ? client.pagado.split(',').map(x => x.trim()) : []),
      estado: client.PENDEJOALEJANDRO?.estado || '',
      grupo: Array.isArray(client.grupo) ? client.grupo : (client.grupo ? client.grupo.split(',').map(x => x.trim()) : []),
      servicio: Array.isArray(client.servicio) ? client.servicio : (client.servicio ? client.servicio.split(',').map(x => x.trim()) : []),
      notas: Array.isArray(client.notas) ? client.notas : (client.notas ? client.notas.split(',').map(x => x.trim()) : []),
      precio: Array.isArray(client.precio) ? client.precio : (client.precio ? client.precio.split(',').map(x => x.trim()) : []),
      SPOTIFY: {
        email: client.SPOTIFY?.email[0] || '',
        password: client.SPOTIFY?.password[0] || '',
        principal: client.SPOTIFY?.principal || [true]
      }
    });
    setNewGrupo('');
    setNewServicio('');
    setNewNotas('');
    setNewPrecio('');
    setNewPagado('');
  }, [client]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const [field, subfield] = name.split('.');

    if (subfield) {
      setClientData((prevData) => ({
        ...prevData,
        [field]: {
          ...prevData[field],
          [subfield]: value
        }
      }));
    } else {
      setClientData((prevData) => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const handleSpotifyCheckboxChange = (event) => {
    setShowSpotifyInfo(event.target.checked);
  };

  const handleSaveChanges = async () => {
    try {
      const clientDocRef = doc(firestore, 'clientes', client.id);

      const grupoArray = Array.isArray(clientData.grupo)
        ? clientData.grupo.map(item => item.toUpperCase())
        : (clientData.grupo ? clientData.grupo.split(',').map(item => item.trim().toUpperCase()) : []);

      const servicioArray = Array.isArray(clientData.servicio)
        ? clientData.servicio.map(item => item.toUpperCase())
        : (clientData.servicio ? clientData.servicio.split(',').map(item => item.trim().toUpperCase()) : []);

      const notasArray = Array.isArray(clientData.notas)
        ? clientData.notas.map(item => item.toUpperCase())
        : (clientData.notas ? clientData.notas.split(',').map(item => item.trim().toUpperCase()) : []);

      const precioArray = Array.isArray(clientData.precio)
        ? clientData.precio.map(item => item.toUpperCase())
        : (clientData.precio ? clientData.precio.split(',').map(item => item.trim().toUpperCase()) : []);

      const pagadoArray = Array.isArray(clientData.pagado)
        ? clientData.pagado
        : (clientData.pagado ? clientData.pagado.split(',').map(item => item.trim()) : []);

      const fechaInicial = clientData.fechaInicial ? convertirFechaInvertida(clientData.fechaInicial) : '';
      const fechaFinal = clientData.fechaFinal ? convertirFechaInvertida(clientData.fechaFinal) : '';

      const updates = {};
      if (clientData.nombre) {
        updates['nombre'] = clientData.nombre.toUpperCase();
      }
      if (clientData.apellido) {
        updates['apellido'] = clientData.apellido.toUpperCase();
      }
      if (clientData.telefono) {
        updates['telefono'] = clientData.telefono.toUpperCase();
      }
      if (clientData.email) {
        updates['email'] = clientData.email.toLowerCase();
      }
      if (fechaInicial) {
        updates['fechaInicial'] = fechaInicial;
      }
      if (fechaFinal) {
        updates['fechaFinal'] = fechaFinal;
      }
      if (pagadoArray.length > 0) {
        updates['pagado'] = pagadoArray;
      }
      if (clientData.estado !== '') {
        updates['PENDEJOALEJANDRO.estado'] = clientData.estado;
      }
      if (grupoArray.length > 0) {
        updates['grupo'] = grupoArray;
      }
      if (servicioArray.length > 0) {
        updates['servicio'] = servicioArray;
      }
      if (notasArray.length > 0) {
        updates['notas'] = notasArray;
      }
      if (precioArray.length > 0) {
        updates['precio'] = precioArray;
      }

      const clienteDoc = await getDoc(clientDocRef);
      const clienteData = clienteDoc.data();
      const updatedSpotify = {
        email: [clientData.SPOTIFY.email],
        password: [clientData.SPOTIFY.password],
        principal: [clientData.SPOTIFY.principal[0]] // ya es booleano
      };

      updates['SPOTIFY'] = updatedSpotify;

      await updateDoc(clientDocRef, updates);
      toast.success('Datos guardados con éxito');
      if (onSave) onSave();
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      toast.error('Error al guardar cambios: ' + error.message);
    }
  };

  const handleDeleteClient = async () => {
    setShowDeleteConfirmationModal(true);
  };

  const confirmDeleteClient = async () => {
    try {
      const clientDocRef = doc(firestore, 'clientes', client.id);
      await deleteDoc(clientDocRef);
      toast.success('Cliente eliminado con éxito');
      setShowDeleteConfirmationModal(false);
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      toast.error('Error al eliminar cliente: ' + error.message);
    }
  };

  const cancelDeleteClient = () => {
    setShowDeleteConfirmationModal(false);
  };

  const handleGenerateComprobante = async () => {
    if (client) {
      const servicios = Array.isArray(client.servicio) ? client.servicio : [];
      const grupo = Array.isArray(client.grupo) ? client.grupo : [];

      const precios = Array.isArray(client.precio)
        ? client.precio.map(Number)
        : [];

      const precioTotal = precios.reduce((acc, curr) => acc + curr, 0).toLocaleString('es-ES');

      const comprobanteContainer = document.createElement('div');
      comprobanteContainer.className = 'comprobante-container';
      comprobanteContainer.style.backgroundImage = `url(${fondo})`;
      comprobanteContainer.style.backgroundSize = 'cover';
      comprobanteContainer.style.width = '1080px';
      comprobanteContainer.style.height = '1080px';
      comprobanteContainer.style.color = 'white';
      comprobanteContainer.style.fontFamily = 'Comic Sans MS';
      comprobanteContainer.style.fontSize = '40px';
      comprobanteContainer.style.lineHeight = '3';
      comprobanteContainer.style.textAlign = 'center';
      comprobanteContainer.style.position = 'absolute';
      comprobanteContainer.style.left = '-9999px';
      comprobanteContainer.style.top = '-9999px';

      const date = new Date();
      const fechaGenerada = date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const serviciosTexto = servicios.length > 0 ? servicios.join(', ') : 'Ninguno';
      const grupoTexto = grupo.length > 0 ? grupo.join(', ') : 'Ninguno';

      comprobanteContainer.innerHTML = `
        <p>Comprobante generado (${fechaGenerada})</p>
        <p>⭐ID: ${client.ID}</p>
        <p>⭐NOMBRE COMPLETO: ${client.nombre} ${client.apellido}</p>
        <p>⭐SERVICIO: ${serviciosTexto}</p>
        <p>⭐GRUPO: ${grupoTexto}</p>
        <p>⭐PRECIO: $${precioTotal}</p>
        <p>⭐FECHA FINAL: ${client.fechaFinal}</p>
        <p>⭐ESTADO: ${client.estado}</p>
      `;

      document.body.appendChild(comprobanteContainer);

      html2canvas(comprobanteContainer).then(async (canvas) => {
        const uniqueFileName = `comprobante_${client.ID}_${Date.now()}.png`;
        const clientFolder = client.ID;

        const dataUrl = canvas.toDataURL('image/png');

        const storage = getStorage();
        const storageRef = ref(storage, `comprobantes/${clientFolder}/${uniqueFileName}`);
        await uploadString(storageRef, dataUrl, 'data_url');

        const downloadURL = await getDownloadURL(storageRef);

        const mensaje = `_*🎉 ¡Gracias por tu Comprobante de Pago y Renovación Exitosa! 🎉*_

Hemos recibido con éxito tu comprobante de pago y renovación. 🎊 Apreciamos tu confianza en *JadePlatform* y estamos encantados de seguir siendo tu elección.

Si tienes alguna pregunta o necesitas asistencia, estamos aquí para ayudarte. ¡Disfruta al máximo de tu servicio renovado! 😊🙌

Haz click aquí para visualizar tu comprobante: ${downloadURL}`;
        await navigator.clipboard.writeText(mensaje);

        toast('El comprobante ha sido generado y guardado en Firebase Storage.');

        document.body.removeChild(comprobanteContainer);
      });
    }
  };

  // Funciones para agregar tags
  const handleAddTag = (field, value) => {
    if (!value.trim()) return;
    setClientData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()]
    }));
    switch (field) {
      case 'grupo': setNewGrupo(''); break;
      case 'servicio': setNewServicio(''); break;
      case 'notas': setNewNotas(''); break;
      case 'precio': setNewPrecio(''); break;
      case 'pagado': setNewPagado(''); break;
      default: break;
    }
  };

  // Funciones para eliminar tags
  const handleRemoveTag = (field, idx) => {
    setClientData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx)
    }));
  };

  // Función para iniciar edición de tag
  const handleEditTag = (field, idx, value) => {
    setEditTag(prev => ({
      ...prev,
      [field]: { idx, value }
    }));
  };

  // Función para guardar edición de tag
  const handleEditTagSave = (field) => {
    if (editTag[field].idx === null) return;
    const value = editTag[field].value.trim();
    if (!value) {
      // Si está vacío, elimina el tag
      handleRemoveTag(field, editTag[field].idx);
    } else {
      setClientData(prev => ({
        ...prev,
        [field]: prev[field].map((t, i) => i === editTag[field].idx ? value : t)
      }));
    }
    setEditTag(prev => ({
      ...prev,
      [field]: { idx: null, value: '' }
    }));
  };

  // Función para cancelar edición de tag
  const handleEditTagCancel = (field) => {
    setEditTag(prev => ({
      ...prev,
      [field]: { idx: null, value: '' }
    }));
  };

  // Función para mostrar input de agregar tag
  const handleShowAddInput = (field) => {
    setShowAddInput(prev => ({
      ...prev,
      [field]: true
    }));
  };

  // Función para ocultar input de agregar tag
  const handleHideAddInput = (field) => {
    setShowAddInput(prev => ({
      ...prev,
      [field]: false
    }));
    // Limpiar input
    switch (field) {
      case 'grupo': setNewGrupo(''); break;
      case 'servicio': setNewServicio(''); break;
      case 'notas': setNewNotas(''); break;
      case 'precio': setNewPrecio(''); break;
      case 'pagado': setNewPagado(''); break;
      default: break;
    }
  };

  return (
    <div className="BuscarCliente-details-panel-container">
      <div className={`BuscarCliente-details-panel show`}>
        <h2>Detalles del Cliente</h2>
        <label>
          ID:
          <input
            type="text"
            name="ID"
            value={clientData.ID}
            onChange={handleChange}
            className="BuscarCliente-detail-input"
            placeholder="ID"
          />
        </label>
        <label>
          Nombre:
          <input
            type="text"
            name="nombre"
            value={clientData.nombre}
            onChange={handleChange}
            className="BuscarCliente-detail-input"
            placeholder="Nombre"
          />
        </label>
        <label>
          Apellido:
          <input
            type="text"
            name="apellido"
            value={clientData.apellido}
            onChange={handleChange}
            className="BuscarCliente-detail-input"
            placeholder="Apellido"
          />
        </label>
        <label>
          Teléfono:
          <input
            type="text"
            name="telefono"
            value={clientData.telefono}
            onChange={handleChange}
            className="BuscarCliente-detail-input"
            placeholder="Teléfono"
          />
        </label>
        <label>
          Email:
          <input
            type="text"
            name="email"
            value={clientData.email}
            onChange={handleChange}
            className="BuscarCliente-detail-input"
            placeholder="Email"
          />
        </label>
        <label>
          Fecha Inicial:
          <input
            type="date"
            name="fechaInicial"
            value={clientData.fechaInicial}
            onChange={handleChange}
            className="BuscarCliente-detail-input"
            placeholder="Fecha Inicial (dd/mm/yyyy)"
          />
        </label>
        <label>
          Fecha Final:
          <input
            type="date"
            name="fechaFinal"
            value={clientData.fechaFinal}
            onChange={handleChange}
            className="BuscarCliente-detail-input"
            placeholder="Fecha Final (dd/mm/yyyy)"
          />
        </label>
        {/* Grupo tags */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ marginBottom: 0, marginRight: 8, minWidth: 70 }}>Grupo:</label>
          <div className="tags-input-container" style={{ margin: 0, padding: 0, minHeight: 0, boxShadow: 'none' }}>
            {clientData.grupo.map((tag, idx) =>
              editTag.grupo.idx === idx ? (
                <input
                  key={idx}
                  className="tag-input"
                  value={editTag.grupo.value}
                  autoFocus
                  onChange={e => setEditTag(prev => ({
                    ...prev,
                    grupo: { idx, value: e.target.value }
                  }))}
                  onBlur={() => handleEditTagSave('grupo')}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleEditTagSave('grupo');
                    if (e.key === 'Escape') handleEditTagCancel('grupo');
                  }}
                  style={{ minWidth: '60px' }}
                />
              ) : (
                <span
                  className="tag"
                  key={idx}
                  onDoubleClick={() => handleEditTag('grupo', idx, tag)}
                  title="Doble click para editar"
                >
                  {tag}
                  <FaTimesCircle className="tag-remove" onClick={() => handleRemoveTag('grupo', idx)} />
                </span>
              )
            )}
            {showAddInput.grupo ? (
              <input
                type="text"
                value={newGrupo}
                autoFocus
                onChange={e => setNewGrupo(e.target.value)}
                onBlur={() => {
                  if (newGrupo.trim()) handleAddTag('grupo', newGrupo);
                  handleHideAddInput('grupo');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (newGrupo.trim()) handleAddTag('grupo', newGrupo);
                    handleHideAddInput('grupo');
                  }
                  if (e.key === 'Escape') handleHideAddInput('grupo');
                }}
                className="tag-input"
                placeholder="Agregar grupo"
              />
            ) : (
              <FaPlus className="tag-add" onClick={() => handleShowAddInput('grupo')} />
            )}
          </div>
        </div>
        {/* Servicio tags */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ marginBottom: 0, marginRight: 8, minWidth: 70 }}>Servicio:</label>
          <div className="tags-input-container" style={{ margin: 0, padding: 0, minHeight: 0, boxShadow: 'none' }}>
            {clientData.servicio.map((tag, idx) =>
              editTag.servicio.idx === idx ? (
                <input
                  key={idx}
                  className="tag-input"
                  value={editTag.servicio.value}
                  autoFocus
                  onChange={e => setEditTag(prev => ({
                    ...prev,
                    servicio: { idx, value: e.target.value }
                  }))}
                  onBlur={() => handleEditTagSave('servicio')}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleEditTagSave('servicio');
                    if (e.key === 'Escape') handleEditTagCancel('servicio');
                  }}
                  style={{ minWidth: '60px' }}
                />
              ) : (
                <span
                  className="tag"
                  key={idx}
                  onDoubleClick={() => handleEditTag('servicio', idx, tag)}
                  title="Doble click para editar"
                >
                  {tag}
                  <FaTimesCircle className="tag-remove" onClick={() => handleRemoveTag('servicio', idx)} />
                </span>
              )
            )}
            {showAddInput.servicio ? (
              <input
                type="text"
                value={newServicio}
                autoFocus
                onChange={e => setNewServicio(e.target.value)}
                onBlur={() => {
                  if (newServicio.trim()) handleAddTag('servicio', newServicio);
                  handleHideAddInput('servicio');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (newServicio.trim()) handleAddTag('servicio', newServicio);
                    handleHideAddInput('servicio');
                  }
                  if (e.key === 'Escape') handleHideAddInput('servicio');
                }}
                className="tag-input"
                placeholder="Agregar servicio"
              />
            ) : (
              <FaPlus className="tag-add" onClick={() => handleShowAddInput('servicio')} />
            )}
          </div>
        </div>
        {/* Notas tags */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ marginBottom: 0, marginRight: 8, minWidth: 70 }}>Notas:</label>
          <div className="tags-input-container" style={{ margin: 0, padding: 0, minHeight: 0, boxShadow: 'none' }}>
            {clientData.notas.map((tag, idx) =>
              editTag.notas.idx === idx ? (
                <input
                  key={idx}
                  className="tag-input"
                  value={editTag.notas.value}
                  autoFocus
                  onChange={e => setEditTag(prev => ({
                    ...prev,
                    notas: { idx, value: e.target.value }
                  }))}
                  onBlur={() => handleEditTagSave('notas')}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleEditTagSave('notas');
                    if (e.key === 'Escape') handleEditTagCancel('notas');
                  }}
                  style={{ minWidth: '60px' }}
                />
              ) : (
                <span
                  className="tag"
                  key={idx}
                  onDoubleClick={() => handleEditTag('notas', idx, tag)}
                  title="Doble click para editar"
                >
                  {tag}
                  <FaTimesCircle className="tag-remove" onClick={() => handleRemoveTag('notas', idx)} />
                </span>
              )
            )}
            {showAddInput.notas ? (
              <input
                type="text"
                value={newNotas}
                autoFocus
                onChange={e => setNewNotas(e.target.value)}
                onBlur={() => {
                  if (newNotas.trim()) handleAddTag('notas', newNotas);
                  handleHideAddInput('notas');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (newNotas.trim()) handleAddTag('notas', newNotas);
                    handleHideAddInput('notas');
                  }
                  if (e.key === 'Escape') handleHideAddInput('notas');
                }}
                className="tag-input"
                placeholder="Agregar nota"
              />
            ) : (
              <FaPlus className="tag-add" onClick={() => handleShowAddInput('notas')} />
            )}
          </div>
        </div>
        {/* Precio tags */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ marginBottom: 0, marginRight: 8, minWidth: 70 }}>Precio:</label>
          <div className="tags-input-container" style={{ margin: 0, padding: 0, minHeight: 0, boxShadow: 'none' }}>
            {clientData.precio.map((tag, idx) =>
              editTag.precio.idx === idx ? (
                <input
                  key={idx}
                  className="tag-input"
                  value={editTag.precio.value}
                  autoFocus
                  onChange={e => setEditTag(prev => ({
                    ...prev,
                    precio: { idx, value: e.target.value }
                  }))}
                  onBlur={() => handleEditTagSave('precio')}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleEditTagSave('precio');
                    if (e.key === 'Escape') handleEditTagCancel('precio');
                  }}
                  style={{ minWidth: '60px' }}
                />
              ) : (
                <span
                  className="tag"
                  key={idx}
                  onDoubleClick={() => handleEditTag('precio', idx, tag)}
                  title="Doble click para editar"
                >
                  {tag}
                  <FaTimesCircle className="tag-remove" onClick={() => handleRemoveTag('precio', idx)} />
                </span>
              )
            )}
            {showAddInput.precio ? (
              <input
                type="text"
                value={newPrecio}
                autoFocus
                onChange={e => setNewPrecio(e.target.value)}
                onBlur={() => {
                  if (newPrecio.trim()) handleAddTag('precio', newPrecio);
                  handleHideAddInput('precio');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (newPrecio.trim()) handleAddTag('precio', newPrecio);
                    handleHideAddInput('precio');
                  }
                  if (e.key === 'Escape') handleHideAddInput('precio');
                }}
                className="tag-input"
                placeholder="Agregar precio"
              />
            ) : (
              <FaPlus className="tag-add" onClick={() => handleShowAddInput('precio')} />
            )}
          </div>
        </div>
        {/* Pagado tags */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ marginBottom: 0, marginRight: 8, minWidth: 70 }}>Pagado:</label>
          <div className="tags-input-container" style={{ margin: 0, padding: 0, minHeight: 0, boxShadow: 'none' }}>
            {clientData.pagado.map((tag, idx) =>
              editTag.pagado.idx === idx ? (
                <input
                  key={idx}
                  className="tag-input"
                  value={editTag.pagado.value}
                  autoFocus
                  onChange={e => setEditTag(prev => ({
                    ...prev,
                    pagado: { idx, value: e.target.value }
                  }))}
                  onBlur={() => handleEditTagSave('pagado')}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleEditTagSave('pagado');
                    if (e.key === 'Escape') handleEditTagCancel('pagado');
                  }}
                  style={{ minWidth: '60px' }}
                />
              ) : (
                <span
                  className="tag"
                  key={idx}
                  onDoubleClick={() => handleEditTag('pagado', idx, tag)}
                  title="Doble click para editar"
                >
                  {tag}
                  <FaTimesCircle className="tag-remove" onClick={() => handleRemoveTag('pagado', idx)} />
                </span>
              )
            )}
            {showAddInput.pagado ? (
              <input
                type="text"
                value={newPagado}
                autoFocus
                onChange={e => setNewPagado(e.target.value)}
                onBlur={() => {
                  if (newPagado.trim()) handleAddTag('pagado', newPagado);
                  handleHideAddInput('pagado');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (newPagado.trim()) handleAddTag('pagado', newPagado);
                    handleHideAddInput('pagado');
                  }
                  if (e.key === 'Escape') handleHideAddInput('pagado');
                }}
                className="tag-input"
                placeholder="Agregar pagado"
              />
            ) : (
              <FaPlus className="tag-add" onClick={() => handleShowAddInput('pagado')} />
            )}
          </div>
        </div>
        <div className="BuscarCliente-checkbox-container">
          <input
            type="checkbox"
            id="spotify-checkbox"
            checked={showSpotifyInfo}
            onChange={handleSpotifyCheckboxChange}
          />
          <label htmlFor="spotify-checkbox">¿Deseas ingresar Spotify information?</label>
        </div>
        {showSpotifyInfo && (
          <>
            <label>
              SPOTIFY Email:
              <input
                type="text"
                name="SPOTIFY.email"
                value={clientData.SPOTIFY.email}
                onChange={handleChange}
                className="BuscarCliente-detail-input"
                placeholder="SPOTIFY Email"
              />
            </label>
            <label>
              SPOTIFY Password:
              <input
                type="text"
                name="SPOTIFY.password"
                value={clientData.SPOTIFY.password}
                onChange={handleChange}
                className="BuscarCliente-detail-input"
                placeholder="SPOTIFY Password"
              />
            </label>
            <label>
              Principal:
              <select
                name="SPOTIFY.principal"
                value={String(clientData.SPOTIFY.principal[0])}
                onChange={(e) => {
                  const val = e.target.value === 'true';
                  setClientData(prev => ({
                    ...prev,
                    SPOTIFY: {
                      ...prev.SPOTIFY,
                      principal: [val]
                    }
                  }));
                }}
                className="BuscarCliente-detail-input"
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </label>
          </>
        )}
        <div className="button-container">
          <button onClick={handleSaveChanges} className="BuscarCliente-save-button">
            <FaSave /> Guardar
          </button>
          <button onClick={onClose} className="BuscarCliente-save-button">
            <FaTimes /> Cerrar
          </button>
          <button onClick={handleGenerateComprobante} className="BuscarCliente-save-button">
            <FaFileAlt /> Generar Comprobante
          </button>
          <button onClick={handleDeleteClient} className="BuscarCliente-save-button">
            <FaTrash /> Eliminar
          </button>
        </div>
        {showDeleteConfirmationModal && (
          <div className="confirmation-modal-overlay">
            <div className="confirmation-modal-content">
              <h2>¿Estás seguro de que deseas eliminar a este cliente? 💀</h2>
              <div className="confirmation-modal-buttons">
                <button className="no-button" onClick={cancelDeleteClient}>No, Quiero Continuar</button>
                <button className="yes-button" onClick={confirmDeleteClient}>Sí, Deseo Eliminarlo</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DetallesCliente;
