import React, { useState, useEffect } from 'react';
import './formaparte.css'; // Asegúrate de importar los estilos para el modal
import { addDoc , collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Importamos el auth para obtener el usuario autenticado
import { db } from '../../../firebase'; // Asegúrate de importar 'db' desde tu configuración de Firebase
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import emojiFlags from 'emoji-flags';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false); // Estado para verificar si es cliente
  const [countryCode, setCountryCode] = useState('+57'); // Estado para el código de país

  const countryCodes = [
    { code: '+1', flag: emojiFlags.US.emoji }, { code: '+502', flag: emojiFlags.GT.emoji }, { code: '+503', flag: emojiFlags.SV.emoji }, { code: '+504', flag: emojiFlags.HN.emoji },
    { code: '+505', flag: emojiFlags.NI.emoji }, { code: '+506', flag: emojiFlags.CR.emoji }, { code: '+507', flag: emojiFlags.PA.emoji }, { code: '+509', flag: emojiFlags.HT.emoji },
    { code: '+51', flag: emojiFlags.PE.emoji }, { code: '+52', flag: emojiFlags.MX.emoji }, { code: '+53', flag: emojiFlags.CU.emoji }, { code: '+54', flag: emojiFlags.AR.emoji },
    { code: '+55', flag: emojiFlags.BR.emoji }, { code: '+56', flag: emojiFlags.CL.emoji }, { code: '+57', flag: emojiFlags.CO.emoji }, { code: '+58', flag: emojiFlags.VE.emoji },
    { code: '+591', flag: emojiFlags.BO.emoji }, { code: '+592', flag: emojiFlags.GY.emoji }, { code: '+593', flag: emojiFlags.EC.emoji }, { code: '+594', flag: emojiFlags.GF.emoji },
    { code: '+595', flag: emojiFlags.PY.emoji }, { code: '+596', flag: emojiFlags.MQ.emoji }, { code: '+597', flag: emojiFlags.SR.emoji }, { code: '+598', flag: emojiFlags.UY.emoji },
    { code: '+599', flag: emojiFlags.CW.emoji }
  ];

  const handleSubmit = async (e) => { 
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
  
    // Convertir nombre, apellido y notas a mayúsculas
    const nombreFormateado = nombre.toUpperCase();
    const apellidoFormateado = apellido.toUpperCase();
  
    // Validar que el pin solo sea numérico
    const pinNumerico = /^[0-9]+$/.test(pinPerfil) ? pinPerfil : ''; // Si no es numérico, se asigna un string vacío
  
    // Crear el formato de las notas según el pin y nombre de perfil
    const notasFormateadas = pinNumerico ? [`PERFIL ${nombrePerfil.toUpperCase()} PIN ${pinNumerico}`] : [`PERFIL ${nombrePerfil.toUpperCase()}`];
  
    // Convertir el precio a número (sin el signo $ y comas) y guardarlo en un array
    const precioNumerico = parseInt(precio.replace(/\D/g, ''), 10); // Elimina caracteres no numéricos
  
    // Función para formatear el nombre del servicio
    const getServiceName = (servicio) => {
      switch (servicio.toUpperCase()) {
        case 'CRUNCHYROLL':
          return 'CRUNCHY';
        case 'DISNEY+':
          return 'DISNEY';
        case 'NETFLIX SIN TV':
          return 'NETFLIX';
        case 'NETFLIX TV':
          return 'NETFLIXTV';
        case 'PARAMOUNT+':
          return 'PARAMOUNT';
        case 'PRIME VIDEO':
          return 'PRIMEVIDEO';
        case 'YOUTUBE + GOOGLE':
          return 'YOUTUBE+';
        case 'YOUTUBE PREMIUM':
          return 'YOUTUBE';
        default:
          return servicio.toUpperCase(); // Devuelve el servicio tal cual si no coincide con ninguno de los casos
      }
    };
  
    // Obtener el servicio formateado
    const servicioFormateado = getServiceName(service?.name);
  
    try {
      // Crear el documento en Firestore
      const docRef = await addDoc(collection(db, 'notificaciones'), {
        nombre: nombreFormateado,
        apellido: apellidoFormateado,
        email: email,
        telefono: `${countryCode} ${telefono}`, // Guardar el teléfono con el prefijo
        notas: notasFormateadas, // Guardamos como array
        servicio: [servicioFormateado], // Guardamos el servicio como array
        precio: [precioNumerico], // Guardamos el precio como array
        compra: true, // Campo nuevo para indicar si la compra ha sido realizada
        timestamp: Timestamp.now(), // Campo timestamp con la fecha y hora actual
      });
  
      toast.success('🎉 Tu pedido ha sido creado con éxito. En breve serás redirigido para enviar el comprobante de pago. 📲💳', {
        autoClose: 1000, // Tiempo del toast
        onClose: () => {
          // Redirigir y cerrar después del toast
          setTimeout(() => {
            onClose(); // Cierra el modal de FormAparte
          }, 1250); // Espera un poco para asegurarse de que el toast desaparezca
  
          setTimeout(() => {
            window.location.href = 'https://wa.me/message/3QL4QO5JTVOTL1'; // Redirección
          }, 1500); // Espera para redirigir después de cerrar el modal
        }
      });
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
        setIsClient(true); // Es cliente
      } else {
        // Si no es cliente, vaciar los campos
        setClienteData(null);
        setIsClient(false); // No es cliente
      }
    } else {
      // Si no hay un usuario autenticado, vaciar los campos
      setClienteData(null);
      setIsClient(false); // No hay usuario autenticado
    }
  };
  // Función para actualizar el teléfono
const handleTelefonoChange = (e) => {
  let telefonoValue = e.target.value.replace(/\D/g, ''); // Eliminar caracteres no numéricos
  if (telefonoValue.length > 10) {
    telefonoValue = telefonoValue.slice(0, 10); // Limitar a 10 dígitos
  }
  setTelefono(telefonoValue);
};

const handleNombreChange = (e) => {
  const value = e.target.value.replace(/[0-9]/g, ''); // Eliminar números
  setNombre(value);
};

const handleApellidoChange = (e) => {
  const value = e.target.value.replace(/[0-9]/g, ''); // Eliminar números
  setApellido(value);
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
          // Formatear el teléfono para eliminar el prefijo del país si existe
          const telefonoSinPrefijo = clienteData.telefono.replace(/^\+\d+\s/, '');
          setTelefono(telefonoSinPrefijo);
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
      return 'https://firebasestorage.googleapis.com/v0/b/spidijade.appspot.com/o/spidibo.png?alt=media&token=11295a61-032c-4a8d-999c-021249de794a';
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
          
          {/* Mostrar checkbox solo si es cliente */}
          {isClient && (
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
          )}
  
          <div className="formaparte-group">
            <label htmlFor="nombre" className="labelform">Nombre:</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={handleNombreChange}
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
              onChange={handleApellidoChange}
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
            <label htmlFor="telefono" className="labelform">Teléfono:</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                style={{ marginRight: '5px', width: '90px' }} // Set width to 90px
              >
                {countryCodes.map(({ code, flag }) => (
                  <option key={code} value={code}>{flag} {code}</option>
                ))}
              </select>
              <input
                type="text"
                id="telefono"
                name="telefono"
                value={telefono}
                onChange={handleTelefonoChange}
                className="input-form"
                placeholder="Ej. 3001234567"
                maxLength={10} // Limitar a 10 caracteres
              />
            </div>
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
                  <label htmlFor="pinPerfil" className="labelform">PIN de {service?.name === 'PRIME VIDEO' ? '5' : '4'} dígitos (numéricos):</label>
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
  
          <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Procesando...' : 'Comprar'}
        </button>
        </form>
      </div>
      {/* Agrega el ToastContainer aquí para mostrar los mensajes */}
      <ToastContainer />
    </div>
  );
  
};

export default FormAparte;
