import React, { useEffect, useState } from 'react';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import "./CuentasDisponibles.css"

// Inicializa Firestore
const db = getFirestore();

const CuentasDisponibles = ({ onClose }) => {
  const [clientes, setClientes] = useState([]);
  const [clientesAgrupados, setClientesAgrupados] = useState({});

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        // Obtener la colección de clientes desde Firestore
        const clientesCollection = collection(db, 'clientes');
        const clientesSnapshot = await getDocs(clientesCollection);

        // Verificar si la colección está vacía
        if (clientesSnapshot.empty) {
          console.log('No hay clientes en la colección');
          return;
        }

        // Mapear los datos de los clientes
        const clientesList = clientesSnapshot.docs.map(doc => doc.data());

        console.log('Clientes obtenidos:', clientesList);

        // Filtrar clientes cuyo estado en PENDEJOALEJANDRO no sea "😶‍🌫️"
        const clientesFiltrados = clientesList.filter(cliente => {
          const estado = cliente.PENDEJOALEJANDRO?.estado;
          return estado !== "😶‍🌫️";  // Filtramos los clientes con estado "😶‍🌫️"
        });

        // Agrupar clientes por servicio y grupo
        const agrupados = {};

        clientesFiltrados.forEach(cliente => {
          // Verifica si el cliente tiene servicio y grupo
          if (cliente.servicio && cliente.grupo) {
            cliente.servicio.forEach((servicio, index) => {
              const grupo = cliente.grupo[index];

              // Agrupar los servicios "NETFLIX", "NETFLIXTV" y "NETFLIXME" bajo "NETFLIX"
              if (["NETFLIX", "NETFLIXTV", "NETFLIXME"].includes(servicio)) {
                servicio = "NETFLIX"; // Agrupamos todos esos servicios como "NETFLIX"
              }

              // Si ya existe el grupo y servicio, aumentamos la cantidad de clientes
              if (!agrupados[servicio]) {
                agrupados[servicio] = {};
              }
              if (!agrupados[servicio][grupo]) {
                agrupados[servicio][grupo] = 0;
              }
              agrupados[servicio][grupo]++;
            });
          }
        });

        console.log('Clientes agrupados:', agrupados);

        // Ordenar los grupos numéricamente dentro de cada servicio
        const agrupadosOrdenados = {};
        Object.entries(agrupados).forEach(([servicio, grupos]) => {
          // Ordenamos las claves de los grupos numéricamente
          const gruposOrdenados = Object.entries(grupos)
            .sort(([grupoA], [grupoB]) => {
              const numA = parseInt(grupoA.replace(/[^\d]/g, '')); // Extraemos el número del grupo
              const numB = parseInt(grupoB.replace(/[^\d]/g, '')); // Extraemos el número del grupo
              return numA - numB; // Ordenamos de menor a mayor
            })
            .reduce((acc, [grupo, count]) => {
              acc[grupo] = count;
              return acc;
            }, {});

          // Asignamos los grupos ordenados a su servicio correspondiente
          agrupadosOrdenados[servicio] = gruposOrdenados;
        });

        console.log('Clientes agrupados y ordenados:', agrupadosOrdenados);
        setClientesAgrupados(agrupadosOrdenados);

        // Guardar los clientes filtrados (sin los que tienen estado "😶‍🌫️")
        setClientes(clientesFiltrados);

      } catch (error) {
        console.error('Error al obtener los clientes:', error);
      }
    };

    fetchClientes();
  }, []);

  // Función para mostrar el mensaje correcto
  const obtenerMensajeCupo = (count) => {
    if (count === 5) {
      return "El grupo está lleno.";
    } else if (count === 4) {
      return "Hay 1 cupo disponible.";
    }
    return `${count} clientes disponibles.`;
  };

  return (
    <div className="cuentas-disponibles-container">
      <h2>Cuentas Disponibles</h2>
      <p>Aquí puedes ver todas las cuentas disponibles.</p>

      {/* Mostrar clientes agrupados por servicio y grupo */}
      <div className="clientes-agrupados">
        {Object.keys(clientesAgrupados).length > 0 ? (
          Object.entries(clientesAgrupados).map(([servicio, grupos]) => (
            <div key={servicio}>
              <h3>{servicio}</h3>
              {Object.entries(grupos).map(([grupo, count]) => (
                <p key={grupo}>
                  {servicio} {grupo} {obtenerMensajeCupo(count)}
                </p>
              ))}
            </div>
          ))
        ) : (
          <p>No hay clientes agrupados.</p>
        )}
      </div>

      <button onClick={onClose}>Cerrar</button>
    </div>
  );
};

export default CuentasDisponibles;
