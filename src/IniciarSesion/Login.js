import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase'; // Asegúrate de importar Firestore (db)
import { doc, getDoc } from 'firebase/firestore'; // Importa funciones de Firestore
import { useNavigate } from 'react-router-dom'; // Para la redirección
import './Login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Carga from '../Loada/Carga';
import Registro from '../Registrar/Registrar.js'; // Asegúrate de importar el componente de registro
import { toast, ToastContainer } from 'react-toastify'; // Importa Toast para mostrar mensajes

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Estado para manejar la carga
  const [isLoginVisible, setIsLoginVisible] = useState(true); // Estado para manejar la visibilidad
  const navigate = useNavigate(); // Hook para la redirección

  // Cambiar el estilo del body basado en la visibilidad de login o registro
  useEffect(() => {
    if (isLoginVisible) {
      document.body.classList.add('iniciar-sesion');
      document.body.classList.remove('registrar');
    } else {
      document.body.classList.add('registrar');
      document.body.classList.remove('iniciar-sesion');
    }
    return () => {
      document.body.classList.remove('iniciar-sesion');
      document.body.classList.remove('registrar');
    };
  }, [isLoginVisible]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); // Mostrar pantalla de carga al iniciar sesión

    try {
      // Iniciar sesión con Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userEmail = userCredential.user.email;

      // Buscar si el usuario es admin en la colección 'admin'
      const adminDocRef = doc(db, 'admin', userEmail);
      const adminDoc = await getDoc(adminDocRef);

      if (adminDoc.exists()) {
        // Si el documento existe, es admin, redirige a WebAdmin
        navigate('/WebAdmin/home');
      } else {
        // Si no existe, redirige a WebUsuario
        navigate('/spidibot');
      }
    } catch (error) {
      // Muestra el error en un toast
      toast.error('Error en el correo electrónico o la contraseña');
      console.error(error.message);
    } finally {
      setLoading(false); // Ocultar la pantalla de carga cuando termine el proceso
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleVisibility = () => {
    setIsLoginVisible(!isLoginVisible); // Cambia la visibilidad
  };

  // Función para manejar el inicio de sesión con Google
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userEmail = user.email;

      // Buscar si el usuario es admin en la colección 'admin'
      const adminDocRef = doc(db, 'admin', userEmail);
      const adminDoc = await getDoc(adminDocRef);

      if (adminDoc.exists()) {
        // Si el documento existe, es admin, redirige a WebAdmin
        navigate('/WebAdmin/home');
      } else {
        // Si no existe, redirige a WebUsuario
        navigate('/spidibot');
      }
    } catch (error) {
      toast.error('Error al iniciar sesión con Google');
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <ToastContainer autoClose={3000} hideProgressBar />
      {loading && <Carga />}
      {!loading && isLoginVisible && (
        <div className="login-xbox">
          <h1>Iniciar Sesión</h1>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="emails">Correo Electrónico:</label>
              <input
                type="email"
                id="emails"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group password-group">
              <label htmlFor="passwords">Contraseña:</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="passwords"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="password-toggle" onClick={togglePasswordVisibility}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <button type="submit" className="login-buttons">Iniciar Sesión</button>
          </form>
          <button onClick={handleGoogleSignIn} className="google-signin-button">
            <img src={require('../recursos/google-logo.svg').default} alt="Google" className="google-icon" />
            <span>Iniciar sesión con Google</span>
          </button>
          <br />
          <p className="login-link">
            ¿No tienes cuenta? <span onClick={toggleVisibility}>Regístrate</span>
          </p>
        </div>
      )}
      {!isLoginVisible && <Registro toggleVisibility={toggleVisibility} />}
    </div>
  );
}

export default Login;
