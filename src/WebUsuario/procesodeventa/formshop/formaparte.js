import React, { useState, useEffect } from 'react';
import './formaparte.css'; // Asegúrate de importar los estilos para el modal
import { addDoc , collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Importamos el auth para obtener el usuario autenticado
import { db } from '../../../firebase'; // Asegúrate de importar 'db' desde tu configuración de Firebase
import { toast } from 'react-toastify'; // Importamos el toast para mostrar el mensaje


const FormAparte = ({ service, onClose }) => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [usarInfo, setUsarInfo] = useState(false); // Estado para el checkbox
  const [clienteData, setClienteData] = useState(null); // Estado para almacenar la información del cliente
  const [spotifyOption, setSpotifyOption] = useState('si'); // Estado para opciones de Spotify
  const [nombrePerfil, setNombrePerfil] = useState(''); // Estado para nombre de perfil
  const [pinPerfil, setPinPerfil] = useState(''); // Estado para PIN del perfil
  const precio = service?.precio || ''; // Obtener el precio desde el prop `service`

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Convertir nombre, apellido y notas a mayúsculas
    const nombreFormateado = nombre.toUpperCase();
    const apellidoFormateado = apellido.toUpperCase();
    const notasFormateadas = pinPerfil ? [`${nombrePerfil.toUpperCase()}, ${pinPerfil.toUpperCase()}`] : [nombrePerfil.toUpperCase()];
  
    // Convertir el precio a número (sin el signo $ y comas) y guardarlo en un array
    const precioNumerico = parseInt(precio.replace(/\D/g, ''), 10); // Elimina caracteres no numéricos
  
    try {
      // Crear el documento en Firestore
      const docRef = await addDoc(collection(db, 'notificaciones'), {
        nombre: nombreFormateado,
        apellido: apellidoFormateado,
        email: email,
        telefono: telefono,
        notas: notasFormateadas, // Guardamos como array
        servicio: [service?.name], // Guardamos el servicio como array
        precio: [precioNumerico], // Guardamos el precio como array
      });
  
      // Mostrar un toast de éxito
      toast.success('🎉 Tu pedido ha sido creado con éxito. En breve serás redirigido para enviar el comprobante de pago. 📲💳');
      // Desplazar hacia el toast para asegurarse de que sea visible
setTimeout(() => {
  const toastElement = document.querySelector('.Toastify__toast');
  if (toastElement) {
      toastElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}, 100);
  
      // Cerrar ambos modales
      onClose(); // Cierra el modal de FormAparte y el modal principal en ProcessVent
  
      // Redirigir a la URL de WhatsApp
      setTimeout(() => {
        window.location.href = 'https://wa.me/message/3QL4QO5JTVOTL1';
      }, 2000); // Esperar 2 segundos antes de redirigir
    } catch (error) {
      console.error('Error creando documento: ', error);
      toast.error('Hubo un error al crear el pedido. Intenta de nuevo.');
    }
  };
  
  

  // Función para capitalizar la primera letra de una cadena
  const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Función para verificar si el correo del usuario autenticado existe en la base de datos
  const checkIfCliente = async () => {
    const auth = getAuth(); // Obtenemos el auth de Firebase
    const user = auth.currentUser; // Obtenemos el usuario autenticado
    const userEmail = user?.email; // Obtenemos el email del usuario autenticado

    if (userEmail) {
      const clientesRef = collection(db, 'clientes'); // Aquí usamos db exportado desde firebase.js
      const q = query(clientesRef, where('email', '==', userEmail)); // Consultamos la colección 'clientes'
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const clienteData = querySnapshot.docs[0].data();
        setClienteData(clienteData); // Guardamos la información del cliente
      } else {
        // Si no es cliente, vaciar los campos
        setClienteData(null);
      }
    } else {
      // Si no hay un usuario autenticado, vaciar los campos
      setClienteData(null);
    }
  };
  // Función para actualizar el teléfono
const handleTelefonoChange = (e) => {
  let telefonoValue = e.target.value;
  
  // Verificar si el número ya tiene el prefijo +57
  if (!telefonoValue.startsWith('+57')) {
    telefonoValue = '+57 ' + telefonoValue;
  }
  
  // Asegurarse de que el número tiene exactamente 10 dígitos (excluyendo el prefijo +57)
  if (telefonoValue.length > 13) {
    telefonoValue = telefonoValue.slice(0, 13);
  }

  setTelefono(telefonoValue);
};

  // Efecto que se ejecuta cuando se monta el componente (abriendo el formulario)
  useEffect(() => {
    checkIfCliente(); // Realiza la consulta cuando se abre el formulario
  }, []); // Solo se ejecuta una vez cuando se monta el componente

  // Función para manejar el cambio del checkbox
  const handleCheckboxChange = () => {
    setUsarInfo((prevState) => {
      const newState = !prevState;
      if (!newState) {
        // Si el checkbox se desmarca, vaciar los campos
        setNombre('');
        setApellido('');
        setEmail('');
        setTelefono('');
      } else {
        // Si el checkbox se marca, llenar los campos con la información del cliente
        if (clienteData) {
          setNombre(clienteData.nombre);
          setApellido(clienteData.apellido);
          setEmail(clienteData.email);
          setTelefono(clienteData.telefono);
        }
      }
      return newState;
    });
  };

  // Determinar la imagen a mostrar según el servicio
  const getImageForService = (serviceName) => {
    if (
      serviceName === 'SPOTIFY' ||
      serviceName === 'NETFLIX TV' ||
      serviceName === 'NETFLIX SIN TV' ||
      serviceName === 'YOUTUBE PREMIUM' ||
      serviceName === 'YOUTUBE + GOOGLE'
    ) {
      return 'https://firebasestorage.googleapis.com/v0/b/spidijade.appspot.com/o/spidibo.png?alt=media&token=11295a61-032c-4a8d-999c-021249de794a';
    } else {
      return 'https://firebasestorage.googleapis.com/v0/b/spidijade.appspot.com/o/jade.png?alt=media&token=f676b445-137a-4407-ac05-10827def52ec';
    }
  };

  // Función para formatear el precio
  const formatPrice = (price) => {
    const priceStr = price.toString(); // Convertimos el precio a string para facilitar el formato

    // Si el precio tiene exactamente 4 caracteres
    if (priceStr.length === 4) {
      return `$ ${priceStr.slice(0, 1)}.${priceStr.slice(1)}`;
    }

    // Si el precio tiene más de 4 caracteres, usamos el formato de miles estándar
    return `$ ${new Intl.NumberFormat('es-ES').format(price)}`;
  };

  return (
    <div className="formaparte-overlay">
      <div className="formaparte-modal">
        <button className="formaparte-close-btn" onClick={onClose}>
          X
        </button>
        <h2>Servicio a adquirir aparte: {capitalizeFirstLetter(service?.name || 'Servicio')}</h2>
        <br />
        <form onSubmit={handleSubmit}>
          
          {/* Casilla "Usar mi información personal" movida arriba */}
          <div className="formaparte-group">
            <label className="checkformcheckbox">
              <input
                type="checkbox"
                checked={usarInfo}
                onChange={handleCheckboxChange}
                className="checkbox-input"
              />
              <span>Usar mi información personal</span>
            </label>
          </div>
  
          <div className="formaparte-group">
            <label htmlFor="nombre" className="labelform">Nombre:</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              readOnly={usarInfo}
              placeholder="Ej. Javier"
            />
          </div>
          <div className="formaparte-group">
            <label htmlFor="apellido" className="labelform">Apellido:</label>
            <input
              type="text"
              id="apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
              readOnly={usarInfo}
              placeholder="Ej. Martinez"
            />
          </div>
          <div className="formaparte-group">
            <label htmlFor="email" className="labelform">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={usarInfo}
              placeholder="Ej. javiermartinez@gmail.com"
            />
          </div>
          <div className="formaparte-group">
  <label htmlFor="telefono" className="labelform">
    Teléfono:
  </label>
  <input
    type="text"
    id="telefono"
    name="telefono"
    value={telefono}
    onChange={handleTelefonoChange}
    className="input-form"
    placeholder="Ej. 3001234567"
    maxLength={13} // Limitar a 13 caracteres (incluyendo el prefijo)
  />
</div>
  
          {/* Inputs adicionales para Netflix, Max, Disney+, Prime Video, Paramount+ y Crunchyroll */}
          {['NETFLIX TV', 'NETFLIX SIN TV', 'MAX', 'DISNEY+', 'PRIME VIDEO', 'PARAMOUNT+', 'CRUNCHYROLL'].includes(service?.name) && (
            <>
              <div className="formaparte-group">
                <label htmlFor="nombrePerfil" className="labelform">Nombre de Perfil:</label>
                <input
                  type="text"
                  id="nombrePerfil"
                  value={nombrePerfil}
                  onChange={(e) => setNombrePerfil(e.target.value)}
                  required
                />
              </div>
  
              {/* Mostrar PIN solo si el servicio no es Paramount+ ni Crunchyroll */}
              {['NETFLIX TV', 'NETFLIX SIN TV', 'MAX', 'DISNEY+', 'PRIME VIDEO'].includes(service?.name) && (
                <div className="formaparte-group">
                  <label htmlFor="pinPerfil" className="labelform">PIN de {service?.name === 'PRIME VIDEO' ? '5' : '4'} dígitos:</label>
                  <input
                    type="text"
                    id="pinPerfil"
                    value={pinPerfil}
                    onChange={(e) => setPinPerfil(e.target.value)}
                    maxLength={service?.name === 'PRIME VIDEO' ? 5 : 4}
                    pattern={service?.name === 'PRIME VIDEO' ? "\\d{5}" : "\\d{4}"} // Acepta solo números de 5 o 4 dígitos
                    required
                  />
                </div>
              )}
            </>
          )}
  
          <div className="formaparte-group">
            <label className="labelform">
              Escanea el siguiente código y haz el pago del servicio {capitalizeFirstLetter(service?.name)} por el valor de {formatPrice(precio)}, luego de hacer el pago dale clic en Comprar.
            </label>
            <img
              src={getImageForService(service?.name)}
              alt="Código de pago"
              style={{ width: '100%', maxWidth: '300px', marginTop: '10px' }}
            />
          </div>
  
          <button type="submit">Comprar</button>
        </form>
      </div>
    </div>
  );
  
};

export default FormAparte;
