import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase'; // Asegúrate de que la ruta a firebase.js sea correcta
import './Pruebas.css';

const backupclientes = () => {
  const [clientes, setClientes] = useState([]);

  // Función para obtener los clientes desde Firestore
  const obtenerClientes = async () => {
    const clientesCol = collection(db, "clientes");
    const clientesSnapshot = await getDocs(clientesCol);
    const clientesList = clientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setClientes(clientesList);
  };

  // Función para crear un archivo JSON y descargarlo
  const descargarBackup = () => {
    const dataStr = JSON.stringify(clientes, null, 2); // Convertir a JSON
    const blob = new Blob([dataStr], { type: 'application/json' }); // Crear un blob
    const url = URL.createObjectURL(blob); // Crear un enlace para la descarga

    const link = document.createElement('a'); // Crear un enlace
    link.href = url;
    link.download = 'backup_clientes.json'; // Nombre del archivo
    document.body.appendChild(link); // Agregar el enlace al DOM
    link.click(); // Hacer clic en el enlace para iniciar la descarga
    document.body.removeChild(link); // Remover el enlace del DOM
  };

  useEffect(() => {
    obtenerClientes(); // Obtener los clientes al montar el componente
  }, []);

  return (
    <div className="pruebas">
      <h1>Copia de Seguridad de Clientes</h1>
      <button onClick={descargarBackup}>Descargar Backup</button>
    </div>
  );
};

export default backupclientes;
