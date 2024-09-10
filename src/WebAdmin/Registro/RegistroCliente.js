import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { app } from '../../firebase';
import './RegistroCliente.css';
import fondo from '../../fondo.png'; // Asegúrate de que la imagen fondo.png esté en la carpeta correcta
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage'; // Añadido para manejar Firebase Storage
import html2canvas from 'html2canvas';

const firestore = getFirestore(app);

// Función para dar formato a la fecha
const formatDate = (date) => {
  if (!date) return '';
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

// Función para generar ID con formato de 5 dígitos
const generateId = (maxId) => {
  const newId = (maxId + 1).toString().padStart(5, '0');
  return newId;
};

function RegistroCliente({ onClose }) {
  const [clientData, setClientData] = useState({
    ID: '',
    nombre: '',
    apellido: '',
    telefono: '',
    fechaInicial: '',
    fechaFinal: '',
    pagado: 'NO', // Valor por defecto
    estado: '✅',
    grupo: '',
    servicio: '',
    precio: ''
  });

  const [maxId, setMaxId] = useState(0);

  // Obtiene el ID máximo y actualiza el estado del ID
  useEffect(() => {
    const fetchMaxId = async () => {
      try {
        const clientCollection = collection(firestore, 'clientes');
        const q = query(clientCollection, orderBy('ID', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0].data();
          setMaxId(parseInt(doc.ID, 10) || 0);
        }
      } catch (error) {
        console.error('Error fetching max ID:', error);
      }
    };

    fetchMaxId();
  }, []);

  useEffect(() => {
    // Set the new ID in the clientData state
    setClientData((prevData) => ({
      ...prevData,
      ID: generateId(maxId)
    }));
  }, [maxId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setClientData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSaveClient = async () => {
    try {
      // Definir los arrays de grupo, servicio y precio y convertirlos a mayúsculas
      const grupoArray = Array.isArray(clientData.grupo)
        ? clientData.grupo.map(item => item.toUpperCase())
        : (clientData.grupo ? clientData.grupo.split(',').map(item => item.trim().toUpperCase()) : []);
        
      const servicioArray = Array.isArray(clientData.servicio)
        ? clientData.servicio.map(item => item.toUpperCase())
        : (clientData.servicio ? clientData.servicio.split(',').map(item => item.trim().toUpperCase()) : []);
        
      const precioArray = Array.isArray(clientData.precio)
        ? clientData.precio.map(item => item.toUpperCase())
        : (clientData.precio ? clientData.precio.split(',').map(item => item.trim().toUpperCase()) : []);

      // Construir objeto de cliente
      const newClient = {
        ID: clientData.ID,
        nombre: clientData.nombre.toUpperCase(),
        apellido: clientData.apellido.toUpperCase(),
        telefono: clientData.telefono.toUpperCase(),
        grupo: grupoArray,
        servicio: servicioArray,
        precio: precioArray,
        fechaInicial: formatDate(clientData.fechaInicial),
        fechaFinal: formatDate(clientData.fechaFinal),
        PENDEJOALEJANDRO: { // Campo de tipo mapa
          estado: clientData.estado
        },
        pagado: clientData.pagado.toUpperCase()
      };

      // Guardar en Firestore
      await addDoc(collection(firestore, 'clientes'), newClient);

      alert('Cliente registrado con éxito');
      setClientData({
        ID: '',
        nombre: '',
        apellido: '',
        telefono: '',
        fechaInicial: '',
        fechaFinal: '',
        pagado: 'NO', // Valor por defecto
        estado: '✅',
        grupo: '',
        servicio: '',
        precio: ''
      });
      setMaxId(parseInt(clientData.ID, 10)); // Actualiza el ID máximo
      onClose();

      // Generar comprobante
      await handleGenerateComprobante(newClient);

    } catch (error) {
      console.error('Error al registrar cliente:', error);
      alert('Error al registrar cliente: ' + error.message);
    }
  };

  const handleGenerateComprobante = async (selectedClient) => {
    if (selectedClient) {
      // Verificar que las propiedades necesarias existan y sean arrays
      const servicios = Array.isArray(selectedClient.servicio) ? selectedClient.servicio : [];
      const grupo = Array.isArray(selectedClient.grupo) ? selectedClient.grupo : [];
  
      // Asegurarse de que los precios sean números
      const precios = Array.isArray(selectedClient.precio)
        ? selectedClient.precio.map(Number) // Convertir todos los precios a números
        : [];
  
      // Sumar los precios
      const precioTotal = precios.reduce((acc, curr) => acc + curr, 0).toLocaleString('es-ES');
  
      // Crear el contenedor del comprobante
      const comprobanteContainer = document.createElement('div');
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
  
      // Convertir servicio y grupo en cadenas de texto unidas por comas
      const serviciosTexto = servicios.length > 0 ? servicios.join(', ') : 'Ninguno';
      const grupoTexto = grupo.length > 0 ? grupo.join(', ') : 'Ninguno';
  
      // Obtener estado del mapa PENDEJOALEJANDRO
      const estado = selectedClient.PENDEJOALEJANDRO ? selectedClient.PENDEJOALEJANDRO.estado : 'No definido';
  
      comprobanteContainer.innerHTML = `
        <p>Comprobante generado (${fechaGenerada})</p>
        <p>⭐ID: ${selectedClient.ID}</p>
        <p>⭐NOMBRE COMPLETO: ${selectedClient.nombre} ${selectedClient.apellido}</p>
        <p>⭐SERVICIO: ${serviciosTexto}</p>
        <p>⭐GRUPO: ${grupoTexto}</p>
        <p>⭐PRECIO: $${precioTotal}</p>
        <p>⭐FECHA FINAL: ${selectedClient.fechaFinal}</p>
        <p>⭐ESTADO: ${estado}</p>
      `;
  
      document.body.appendChild(comprobanteContainer);
  
      html2canvas(comprobanteContainer).then(async (canvas) => {
        // Generar un nombre de archivo único de 16 caracteres
        const generateUniqueFileName = () => {
          return Math.random().toString(36).substring(2, 18) + Date.now().toString(36);
        };
  
        const uniqueFileName = `${generateUniqueFileName()}.png`;
  
        // Obtener el URL del archivo como base64
        const dataUrl = canvas.toDataURL('image/png');
  
        // Subir a Firebase Storage
        const storage = getStorage(); // Inicializa Firebase Storage
        const storageRef = ref(storage, `comprobantes/${uniqueFileName}`);
        await uploadString(storageRef, dataUrl, 'data_url');
  
        // Obtener la URL de descarga
        const downloadURL = await getDownloadURL(storageRef);
  
        // WhatsApp Web message
        const mensaje = `_*🎉 ¡Gracias por tu Comprobante de Pago y Renovación Exitosa! 🎉*_

Hemos recibido con éxito tu comprobante de pago y renovación. 🎊 Apreciamos tu confianza en *JadePlatform* y estamos encantados de seguir siendo tu elección.

Si tienes alguna pregunta o necesitas asistencia, estamos aquí para ayudarte. ¡Disfruta al máximo de tu servicio renovado! 😊🙌

Haz click aquí para visualizar tu comprobante: ${downloadURL}`;
        await navigator.clipboard.writeText(mensaje);
        alert('Mensaje copiado al portapapeles');
        const whatsappNumber = selectedClient.telefono; // Obtener el número de WhatsApp del cliente
        const encodedMessage = encodeURIComponent(mensaje);
        const whatsappUrl = `https://web.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
  
        // Abre WhatsApp Web
        window.open(whatsappUrl, '_blank');
  
        alert('El comprobante ha sido generado y enviado por WhatsApp.');
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="form-container">
        <button className="close-button" onClick={onClose}>X</button>
        <h2>Registro de Cliente</h2>
        <div className="form-input">
          <label>ID</label>
          <input
            type="text"
            name="ID"
            value={clientData.ID}
            readOnly
          />
        </div>
        <div className="form-input">
          <label>Nombre</label>
          <input
            type="text"
            name="nombre"
            value={clientData.nombre}
            onChange={handleChange}
          />
        </div>
        <div className="form-input">
          <label>Apellido</label>
          <input
            type="text"
            name="apellido"
            value={clientData.apellido}
            onChange={handleChange}
          />
        </div>
        <div className="form-input">
          <label>Teléfono</label>
          <input
            type="text"
            name="telefono"
            value={clientData.telefono}
            onChange={handleChange}
          />
        </div>
        <div className="form-input">
          <label>Fecha Inicial</label>
          <input
            type="date"
            name="fechaInicial"
            value={clientData.fechaInicial}
            onChange={handleChange}
          />
        </div>
        <div className="form-input">
          <label>Fecha Final</label>
          <input
            type="date"
            name="fechaFinal"
            value={clientData.fechaFinal}
            onChange={handleChange}
          />
        </div>
        <div className="form-input">
          <label>Pagado</label>
          <select
            name="pagado"
            value={clientData.pagado}
            onChange={handleChange}
          >
            <option value="NO">NO</option>
            <option value="SI">SI</option>
          </select>
        </div>
        <div className="form-input">
          <label>Estado</label>
          <input
            type="text"
            name="estado"
            value={clientData.estado}
            onChange={handleChange}
          />
        </div>
        <div className="form-input">
          <label>Grupo</label>
          <input
            type="text"
            name="grupo"
            value={clientData.grupo}
            onChange={handleChange}
          />
        </div>
        <div className="form-input">
          <label>Servicio</label>
          <input
            type="text"
            name="servicio"
            value={clientData.servicio}
            onChange={handleChange}
          />
        </div>
        <div className="form-input">
          <label>Precio</label>
          <input
            type="text"
            name="precio"
            value={clientData.precio}
            onChange={handleChange}
          />
        </div>
        <button className="form-button" onClick={handleSaveClient}>Registrar Cliente</button>
        <button className="form-button" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

export default RegistroCliente;