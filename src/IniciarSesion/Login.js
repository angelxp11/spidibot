import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase'; // Asegúrate de importar Firestore (db)
import { doc, getDoc } from 'firebase/firestore'; // Importa funciones de Firestore
import { useNavigate } from 'react-router-dom'; // Para la redirección
import './Login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Carga from '../Loada/Carga';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Estado para manejar la carga
  const navigate = useNavigate(); // Hook para la redirección

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
        navigate('/WebUsuario/home');
      }
    } catch (error) {
      setError('Error en el correo electrónico o la contraseña');
      console.error(error.message);
    } finally {
      setLoading(false); // Ocultar la pantalla de carga cuando termine el proceso
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      {/* Mostrar la pantalla de carga si loading es true */}
      {loading && <Carga />}
      {!loading && (
        <div className="login-box">
          <h1>Iniciar Sesión</h1>
          {error && <p className="error-message">{error}</p>}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Correo Electrónico:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group password-group">
              <label htmlFor="password">Contraseña:</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="password-toggle" onClick={togglePasswordVisibility}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <button type="submit" className="login-button">Iniciar Sesión</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Login;
