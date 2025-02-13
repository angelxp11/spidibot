import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import Loading from "../../Loada/Carga"; // Importa la pantalla de carga
import "./Bolsillos.css";

const Bolsillos = ({ onClose }) => {
  const [clientes, setClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Estado de carga
  const [selectedService, setSelectedService] = useState(''); // Estado para el servicio seleccionado
  const [clientesAgrupados, setClientesAgrupados] = useState({}); // Estado para clientes agrupados

  useEffect(() => {
    const obtenerClientes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "clientes"));
        const listaClientes = querySnapshot.docs.map((doc) => ({
          docId: doc.id, // Use Firestore document ID as a fallback key
          ...doc.data(),
        })).filter(cliente => cliente.PENDEJOALEJANDRO?.estado !== "😶‍🌫️"); // Filtrar clientes con estado "😶‍🌫️" en PENDEJOALEJANDRO

        setClientes(listaClientes);
        setIsLoading(false); // Oculta la pantalla de carga cuando los datos están listos
      } catch (error) {
        console.error("Error obteniendo clientes:", error);
        setIsLoading(false); // Asegura que la carga se detenga incluso en caso de error
      }
    };

    obtenerClientes();

    const unsubscribe = onSnapshot(collection(db, "clientes"), (snapshot) => {
      const listaClientes = snapshot.docs.map((doc) => ({
        docId: doc.id, // Use Firestore document ID as a fallback key
        ...doc.data(),
      })).filter(cliente => cliente.PENDEJOALEJANDRO?.estado !== "😶‍🌫️"); // Filtrar clientes con estado "😶‍🌫️"

      setClientes(listaClientes);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedService) {
      const agrupados = {};

      clientes.forEach((cliente) => {
        if (cliente.servicio && cliente.grupo && cliente.pagado) {
          cliente.servicio.forEach((servicio, index) => {
            if (servicio === selectedService || (selectedService === "NETFLIX" && ["NETFLIX", "NETFLIXTV", "NETFLIXME"].includes(servicio))) {
              const grupo = cliente.grupo[index];
              const pagado = cliente.pagado[index];
              if (!agrupados[grupo]) {
                agrupados[grupo] = { SI: [], NO: [] };
              }
              if (pagado === "SI") {
                agrupados[grupo].SI.push(cliente.nombre);
              } else if (pagado === "NO") {
                agrupados[grupo].NO.push(cliente.nombre);
              }
            }
          });
        }
      });

      // Ordenar los grupos en orden ascendente
      const agrupadosOrdenados = Object.keys(agrupados)
        .sort((a, b) => {
          const numA = parseInt(a.replace(/[^\d]/g, ''), 10);
          const numB = parseInt(b.replace(/[^\d]/g, ''), 10);
          return numA - numB;
        })
        .reduce((acc, key) => {
          acc[key] = agrupados[key];
          return acc;
        }, {});

      setClientesAgrupados(agrupadosOrdenados);
    }
  }, [selectedService, clientes]);

  if (isLoading) {
    return <Loading />; // Muestra la pantalla de carga
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modals" onClick={(e) => e.stopPropagation()}>
        <h2>Lista de Clientes</h2>
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
        >
          <option value="">Selecciona un servicio</option>
          <option value="NETFLIX">NETFLIX</option>
          <option value="YOUTUBE">YOUTUBE</option>
          <option value="DISNEY">DISNEY</option>
          <option value="MAX">MAX</option>
          <option value="PRIMEVIDEO">PRIMEVIDEO</option>
          <option value="SPOTIFY">SPOTIFY</option>
          <option value="PARAMOUNT">PARAMOUNT</option>
          <option value="CRUNCHY">CRUNCHY</option>
        </select>
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Pagado (SI)</th>
              <th>Pagado (NO)</th>
              <th>Progreso</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(clientesAgrupados).map(([grupo, { SI, NO }]) => {
              const total = SI.length + NO.length;
              const progressSI = total > 0 ? (SI.length / total) * 100 : 0;
              const progressNO = total > 0 ? (NO.length / total) * 100 : 0;
              return (
                <tr key={grupo}>
                  <td>{grupo}</td>
                  <td>{Array.isArray(SI) ? SI.join(', ') : ''}</td>
                  <td>{Array.isArray(NO) ? NO.join(', ') : ''}</td>
                  <td>
                    <div className="progress-bar-container">
                      <div className="progress-bar si" style={{ width: `${progressSI}%` }}></div>
                      <div className="progress-bar no" style={{ width: `${progressNO}%` }}></div>
                      <span>{SI.length}/{total}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button className="btn-cerrar" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default Bolsillos;
