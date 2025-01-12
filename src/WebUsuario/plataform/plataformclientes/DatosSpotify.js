import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify'; // Importa toast y ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Asegúrate de importar el CSS de react-toastify
import { FaCopy } from 'react-icons/fa'; // Importa el icono de copiar
import Carga from '../../../Loada/Carga'; // Importa el componente de Carga
import './DatosSpotify.css';

const DatosSpotify = ({ onClose }) => {
  const [enlace, setEnlace] = useState('');
  const [direccion, setDireccion] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [servicios, setServicios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true); // Estado de carga
  const db = getFirestore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
  
        if (user) {
          const clientesRef = collection(db, 'clientes');
          const q = query(clientesRef, where('email', '==', user.email));
          const querySnapshot = await getDocs(q);
  
          if (!querySnapshot.empty) {
            for (const clientDoc of querySnapshot.docs) {
              const data = clientDoc.data();
              setEmail(data.SPOTIFY?.email || '');
              setPassword(data.SPOTIFY?.password || '');
              setServicios(data.servicio || []);
              setGrupos(data.grupo || []);
  
              // Ensure that services and groups are not undefined
              const servicios = data.servicio || [];
              const grupos = data.grupo || [];
  
              // Iterate over each service and group pair by index
              for (const [index, servicio] of servicios.entries()) {
                const grupoItem = grupos[index];  // Ensure we get the correct group from its index
                const docRef = doc(db, 'Servicios', servicio);
                const docSnap = await getDoc(docRef);
  
                if (docSnap.exists()) {
                  const serviceData = docSnap.data();
  
                  if (serviceData[grupoItem]) {
                    const grupoData = serviceData[grupoItem];
                    const enlace = grupoData.enlace || 'No disponible';
                    const direccion = grupoData.direccion || 'No disponible';
  
                    // Select service based on its group index
                    if (servicio.toLowerCase() === 'spotify') {
                      if (grupoItem === 'G1' || grupoItem === 'G2' || grupoItem === 'G3' || grupoItem === 'G6') {
                        setEnlace(enlace);
                        setDireccion(direccion);
                      }
                    }
                  }
                }
              }
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error al obtener los datos de Firestore:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [db]);
  
  
  

  const handleSave = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const clientesRef = collection(db, 'clientes');
        const q = query(clientesRef, where('email', '==', user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const clientDoc = querySnapshot.docs[0]; // Tomar el primer cliente encontrado
          const clientRef = doc(db, 'clientes', clientDoc.id);

          // Actualizar los campos de email y password
          await updateDoc(clientRef, {
            'SPOTIFY.email': email,
            'SPOTIFY.password': password,
          });

          // Mostrar un toast indicando que los datos se han actualizado correctamente
          toast.success('Datos actualizados correctamente', {
            position: 'top-right',
            autoClose: 1000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        }
      }
    } catch (error) {
      console.error('Error al actualizar los datos:', error);
      toast.error('Error al actualizar los datos', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('overlay')) {
      onClose();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success('Texto copiado al portapapeles', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      })
      .catch((error) => {
        console.error('Error al copiar al portapapeles:', error);
        toast.error('Error al copiar al portapapeles', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      });
  };

  return (
    <>
      {loading ? (
        <Carga /> // Este es tu componente de carga
      ) : (
        <div className="overlay" onClick={handleOverlayClick}>
          <div className="modal">
            <h2 className="modal-title">Datos de Spotify</h2>
            <form>
              <div className="form-group">
                <label htmlFor="correo" className="form-label">Correo</label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
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
                    type={showPassword ? 'text' : 'password'} // Toggle password visibility
                    id="contraseña"
                    name="contraseña"
                    className="form-input"
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    className="spotify-password-toggle"
                    onClick={() => setShowPassword(!showPassword)} // Toggle password visibility
                  >
                    {showPassword ? '👁️' : '🙈'} {/* Show Eye or Monkey emoji based on visibility */}
                  </span>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="direccion" className="form-label">Dirección</label>
                <div className="info-container">
                  <p id="direccion" className="info-text">{direccion || 'Cargando dirección...'}</p>
                  <button type="button" className="copy-button" onClick={() => copyToClipboard(direccion)}>
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
                <button type="button" className="close-button" onClick={onClose}>
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer />
    </>
  );
};

export default DatosSpotify;
