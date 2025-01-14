import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCopy } from 'react-icons/fa';
import Carga from '../../../Loada/Carga'; // Componente de carga
import './DatosSpotify.css';

const DatosSpotify = ({ onClose, grupo, title, nombreCliente }) => {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [enlace, setEnlace] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [docId, setDocId] = useState(null); // Para almacenar el ID del documento donde se guardarán los datos

  useEffect(() => {
    const fetchData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const db = getFirestore();
        const clientesRef = collection(db, 'clientes');
        const q = query(clientesRef, where('email', '==', user.email));

        try {
          const querySnapshot = await getDocs(q);
          const clienteDocs = [];
          querySnapshot.forEach((doc) => {
            clienteDocs.push({ id: doc.id, ...doc.data() });
          });

          if (clienteDocs.length === 1) {
            // Si solo se obtiene un documento
            setDocId(clienteDocs[0].id);
            setEmail(clienteDocs[0].SPOTIFY?.email || ''); // Mostrar el email del cliente si existe
            setPassword(clienteDocs[0].SPOTIFY?.password || ''); // Mostrar la contraseña si existe
            setDireccion(clienteDocs[0].direccion || 'Dirección no disponible');
            setEnlace(clienteDocs[0].enlace || 'Enlace no disponible');
          } else if (clienteDocs.length > 1) {
            // Si obtenemos más de un documento
            for (let doc of clienteDocs) {
              // Verificamos si el servicio contiene el título
              const servicioArray = doc.servicio || [];

              const servicioIndex = servicioArray.findIndex(serv => serv === title);
              if (servicioIndex !== -1) {
                // Si el servicio existe en el array, revisamos el grupo
                if (doc.grupo && doc.grupo.includes(grupo)) {  // Aquí cambiamos la comparación a `includes`
                  // Si el grupo también coincide, es el documento correcto
                  setDocId(doc.id); // Guardamos el ID del documento
                  setEmail(doc.SPOTIFY?.email || ''); // Mostrar el email del cliente si existe
                  setPassword(doc.SPOTIFY?.password || ''); // Mostrar la contraseña si existe
                  setDireccion(doc.direccion || 'Dirección no disponible');
                  setEnlace(doc.enlace || 'Enlace no disponible');
                  break; // Detenemos el ciclo cuando encontramos el documento correcto
                }
              }
            }
          } else {
            toast.error('No se encontró el cliente en la base de datos.');
          }
        } catch (error) {
          toast.error('Error al obtener los datos del cliente: ' + error.message);
        }
      } else {
        toast.error('No se ha encontrado un usuario autenticado.');
      }

      setLoading(false);
    };

    fetchData();
  }, [grupo, title]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Texto copiado al portapapeles');
  };

  // Función para copiar la plantilla de Spotify
  const copySpotifyTemplate = () => {
    const message = `¡Hola ${nombreCliente}! 👋

¡Ya puedes disfrutar de Spotify! 🎧 Aquí tienes los datos para que ingreses a tu cuenta:

- *Usuario:* ${email} 📧
- *Contraseña:* ${password} 🔐

¡Que disfrutes de la música! 🎵  
El equipo de Jadeplatform 🎶`;

    copyToClipboard(message); // Copia el mensaje al portapapeles
  };

  // Función para copiar la plantilla personalizada
  const copyCustomTemplate = () => {
    const message = `¡Hola ${nombreCliente}! 👋

Aquí tienes la información de tu cuenta personalizada:

- *Dirección de Envío:* ${direccion} 📦
- *Enlace de Acceso:* ${enlace} 🔗

Si tienes alguna pregunta, no dudes en contactarnos. ✨

¡Te deseamos una experiencia increíble! 🎶  
El equipo de Jadeplatform 🎧`;

    copyToClipboard(message); // Copia el mensaje al portapapeles
  };

  const handleSave = async () => {
    if (!docId) {
      toast.error('No se encontró el documento del cliente para guardar los datos.');
      return;
    }

    try {
      const db = getFirestore();
      const clienteRef = doc(db, 'clientes', docId); // Referencia al documento del cliente

      // Actualizamos el campo SPOTIFY con los datos de email y password
      await updateDoc(clienteRef, {
        SPOTIFY: {
          email: email,
          password: password,
        }
      });

      toast.success('Datos guardados con éxito');
    } catch (error) {
      toast.error('Error al guardar los datos: ' + error.message);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('overlay-datos')) {
      onClose();
    }
  };

  useEffect(() => {
    const fetchServiceData = async () => {
      const db = getFirestore();
      const serviciosRef = collection(db, 'Servicios');
      const docRef = doc(serviciosRef, title); // Obtenemos el documento con el ID igual a `title`

      try {
        const serviceDoc = await getDoc(docRef);

        if (serviceDoc.exists()) {
          const serviceData = serviceDoc.data();
          const grupoData = serviceData[grupo]; // Accedemos al campo correspondiente al grupo (por ejemplo, G13)

          if (grupoData) {
            setDireccion(grupoData.direccion || 'Dirección no disponible');
            setEnlace(grupoData.enlace || 'Enlace no disponible');
          } else {
            toast.error('Grupo no encontrado en el servicio.');
          }
        } else {
          toast.error('Servicio no encontrado.');
        }
      } catch (error) {
        toast.error('Error al obtener los datos del servicio: ' + error.message);
      }
    };

    if (title && grupo) {
      fetchServiceData();
    }
  }, [title, grupo]);

  return (
    <>
      {loading ? (
        <Carga />
      ) : (
        <div className="overlay-datos" onClick={handleOverlayClick}>
          <div className="modal">
            <h2 className="modal-title">Datos de Spotify</h2>
            <form>
              <div className="form-group">
                <label htmlFor="correo" className="form-label">Correo</label>
                <input
                  type="email"
                  id="correo"
                  className="form-input"
                  placeholder="Ingresa tu correo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="contraseña" className="form-label">Contraseña</label>
                <div className="password-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="contraseña"
                    className="form-input"
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span className="spotify-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? '👁️' : '🙈'}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="direccion" className="form-label">Dirección</label>
                <div className="info-container">
                  <p id="direccion" className="info-text">{direccion || 'Cargando dirección...'}</p>
                  <button type="button" className="copy-botones" onClick={() => copyToClipboard(direccion)}>
                    <FaCopy className="copy-icon" />
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="enlace" className="form-label">Enlace</label>
                <div className="info-container">
                  <p id="enlace" className="info-text">
                    {enlace ? (
                      <a href={enlace} target="_blank" rel="noopener noreferrer" className="enlace-clicable">
                        {enlace}
                      </a>
                    ) : (
                      'Cargando enlace...'
                    )}
                  </p>
                </div>
              </div>
              <div className="button-group">
                <button type="button" className="save-button" onClick={handleSave}>
                  Guardar
                </button>
                <button type="button" className="saves-button" onClick={onClose}>
                  Cerrar
                </button>
              </div>
            </form>
  
            {/* Botón para copiar la plantilla personalizada */}
            <button type="button" className="copiar-button" onClick={copySpotifyTemplate}>
              Copiar Información de acceso Spotify
            </button>

            {/* Botón para copiar la plantilla personalizada */}
            <button type="button" className="copiar-button" onClick={copyCustomTemplate}>
              Copiar Plantilla Personalizada
            </button>
          </div>
        </div>
      )}
      <ToastContainer />
    </>
  );
};

export default DatosSpotify;
