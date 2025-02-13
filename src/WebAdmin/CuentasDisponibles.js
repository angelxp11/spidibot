import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, getFirestore } from 'firebase/firestore';
import "./CuentasDisponibles.css";

// Inicializa Firestore
const db = getFirestore();

const packageLimits = {
  'PREMIUM4K+HDR+2MIEMBROSEXTRAS': 7,
  'PREMIUM4K+HDR': 5,
  'ESTÁNDAR+1MIEMBROEXTRA': 3,
  'ESTÁNDAR': 2,
};

const serviceIcons = {
  NETFLIX: '📱',
  NETFLIXTV: '📺',
  NETFLIXME: '👾', // Replace with the actual icon for extra members
};

const CuentasDisponibles = ({ onClose }) => {
  const [clientes, setClientes] = useState([]);
  const [clientesAgrupados, setClientesAgrupados] = useState({});
  const [selectedService, setSelectedService] = useState(''); // Estado para el servicio seleccionado
  const [loading, setLoading] = useState(true); // Estado de carga
  const [showExtraMessage, setShowExtraMessage] = useState(false); // Estado para alternar entre raisgroups y extraMessage

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        // Obtener la colección de clientes desde Firestore
        const clientesCollection = collection(db, 'clientes');
        const clientesSnapshot = await getDocs(clientesCollection);

        // Verificar si la colección está vacía
        if (clientesSnapshot.empty) {
          setLoading(false);
          return;
        }

        // Mapear los datos de los clientes
        const clientesList = clientesSnapshot.docs.map(doc => doc.data());

        // Filtrar clientes cuyo estado en PENDEJOALEJANDRO no sea "😶‍🌫️"
        const clientesFiltrados = clientesList.filter(cliente => {
          const estado = cliente.PENDEJOALEJANDRO?.estado;
          return estado !== "😶‍🌫️";  // Filtramos los clientes con estado "😶‍🌫️"
        });

        // Obtener clientes de Netflix y otros servicios
        const clientesNetflix = await ClientesNetflix(clientesFiltrados);
        const clientesOtrosServicios = obtenerClientesOtrosServicios(clientesFiltrados);

        // Agrupar clientes
        const agrupados = { ...clientesNetflix, ...clientesOtrosServicios };

        // Ordenar los grupos numéricamente dentro de cada servicio
        const agrupadosOrdenados = ordenarGrupos(agrupados);

        setClientesAgrupados(agrupadosOrdenados);
        setClientes(clientesFiltrados);
        setLoading(false); // Finalizar la carga
      } catch (error) {
        console.error('Error al obtener los clientes:', error);
        setLoading(false); // Finalizar la carga en caso de error
      }
    };

    fetchClientes();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowExtraMessage(prev => !prev);
    }, 2000); // Alternar cada 10 segundos

    return () => clearInterval(interval); // Limpiar el intervalo al desmontar el componente
  }, []);

  useEffect(() => {
    setSelectedService('DISPONIBLES'); // Set default selected service to "DISPONIBLES"
  }, []);

  // Función para obtener clientes de Netflix (con agrupación de servicios)
  const ClientesNetflix = async (clientes) => {
    const clientesAgrupados = {};

    clientes.forEach((cliente) => {
      if (cliente.servicio && cliente.grupo) {
        cliente.servicio.forEach((servicio, index) => {
          if (["NETFLIX", "NETFLIXTV", "NETFLIXME"].includes(servicio)) {
            const grupo = cliente.grupo[index];
            const paquete = cliente.package || ''; // Ensure package is not undefined

            // Inicializar el grupo si no existe
            if (!clientesAgrupados[grupo]) {
              clientesAgrupados[grupo] = { total: 0, servicios: {}, package: paquete };
            }

            // Inicializar el servicio específico si no existe
            if (!clientesAgrupados[grupo].servicios[servicio]) {
              clientesAgrupados[grupo].servicios[servicio] = 0;
            }

            // Incrementar el conteo para este servicio y grupo
            clientesAgrupados[grupo].servicios[servicio]++;
            clientesAgrupados[grupo].total++;
          }
        });
      }
    });

    // Combinar los servicios para mostrar en una sola fila
    const clientesAgrupadosFinal = {};
    Object.entries(clientesAgrupados).forEach(([grupo, data]) => {
      const servicios = ["NETFLIX", "NETFLIXTV", "NETFLIXME"]
        .map(servicio => data.servicios[servicio] ? `${data.servicios[servicio]}${serviceIcons[servicio]}` : '')
        .filter(Boolean)
        .join(' ');

      // Asegurarnos de agregar múltiples grupos sin sobrescribir
      if (!clientesAgrupadosFinal["NETFLIX"]) {
        clientesAgrupadosFinal["NETFLIX"] = {};
      }

      clientesAgrupadosFinal["NETFLIX"][grupo] = `${data.total}(${servicios})${data.package ? `(${data.package})` : ''}`;
    });

    // Buscar la colección 'Servicios'
    const serviciosCollection = collection(db, 'Servicios');
    const serviciosSnapshot = await getDocs(serviciosCollection);

    // Buscar el documento con el id "NETFLIX" dentro de la colección 'Servicios'
    const netflixDocRef = doc(db, 'Servicios', 'NETFLIX,NETFLIXTV,NETFLIXME');
    const netflixDocSnapshot = await getDoc(netflixDocRef);

    if (netflixDocSnapshot.exists()) {
      const netflixData = netflixDocSnapshot.data();

      // Iterar sobre todos los grupos en netflixData
      Object.keys(netflixData).forEach((grupo) => {
        if (netflixData[grupo].package) {
          const packageValue = netflixData[grupo].package;
          const maxClients = packageLimits[packageValue] || 0;

          clientesAgrupadosFinal.NETFLIX[grupo] = clientesAgrupadosFinal.NETFLIX[grupo] || '';
          const match = clientesAgrupadosFinal.NETFLIX[grupo].match(/(\d+)\(([^)]+)\)/); // Adjusted regex pattern
          let extraMessage = '';
          let total = 0;
          let raisgroups = '';
          if (match) {
            total = parseInt(match[1], 10);
            raisgroups = match[2]; // Extract raisgroups
            if (total > maxClients) {
              const extraCount = total - maxClients;
              extraMessage = `El grupo está lleno y hay ${extraCount} clientes más.`;
            } else if (total === maxClients) {
              extraMessage = "El grupo está lleno.";
            } else {
              extraMessage = `Hay ${maxClients - total} cupos libres`;
            }
          }
          clientesAgrupadosFinal.NETFLIX[grupo] = { raisgroups, extraMessage }; // Store both raisgroups and extraMessage
        }
      });
    }

    return clientesAgrupadosFinal;
  };

  // Función para obtener clientes de otros servicios
  const obtenerClientesOtrosServicios = (clientes) => {
    const otrosServicios = ["YOUTUBE", "DISNEY", "MAX", "PRIMEVIDEO", "SPOTIFY", "PARAMOUNT", "CRUNCHY"];
    const agrupadosOtrosServicios = {};
  
    clientes.forEach(cliente => {
      if (cliente.servicio && cliente.grupo) {
        cliente.servicio.forEach((servicio, index) => {
          const grupo = cliente.grupo[index];
          if (otrosServicios.includes(servicio)) {
            if (!agrupadosOtrosServicios[servicio]) {
              agrupadosOtrosServicios[servicio] = {};
            }
            if (!agrupadosOtrosServicios[servicio][grupo]) {
              agrupadosOtrosServicios[servicio][grupo] = 0;
            }
            agrupadosOtrosServicios[servicio][grupo]++; // Contamos los clientes por grupo
          }
        });
      }
    });
  
    return agrupadosOtrosServicios;
  };

  // Función para ordenar los grupos numéricamente dentro de cada servicio
  const ordenarGrupos = (agrupados) => {
    const agrupadosOrdenados = {};

    Object.entries(agrupados).forEach(([servicio, grupos]) => {
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

      agrupadosOrdenados[servicio] = gruposOrdenados;
    });

    return agrupadosOrdenados;
  };

  const serviceLimits = {
    YOUTUBE: 6,
    DISNEY: 7,
    MAX: 5,
    PRIMEVIDEO: 6,
    SPOTIFY: 6,
    PARAMOUNT: 6, // Added limit for PARAMOUNT
    CRUNCHY: 5, // Added limit for CRUNCHYROLL
  };

  // Función para mostrar el mensaje correcto
  const obtenerMensajeCupo = (count, servicio) => {
  
    const limit = serviceLimits[servicio] || 5; // Default limit is 5 if not specified
    if (count > limit) {
      return `El grupo está lleno y hay ${count - limit} clientes más.`;
    } else if (count === limit) {
      return "El grupo está lleno.";
    } else {
      return `Hay ${limit - count} cupos libres.`;
    }
  };

  return (
    <div className="cuentasdisponibles-overlay" onClick={onClose}>
      <div className="cuentasdisponibles-cuentas-disponibles-container" onClick={(e) => e.stopPropagation()}>
        <button className="cuentasdisponibles-close-button" onClick={onClose}>x</button>
        <h2>Cuentas Disponibles</h2>
  
        <div className="cuentasdisponibles-clientes-agrupados">
          {loading ? (
            <div className="loaderdisponible"></div> // Mostrar loader
          ) : Object.keys(clientesAgrupados).length > 0 ? (
            <>
              <table className="cuentasdisponibles-table">
                <thead>
                  <tr>
                    <th>
                      <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                      >
                        <option value="">Servicios</option>
                        <option value="DISPONIBLES">DISPONIBLES</option> {/* Added option */}
                        <option value="LLENOS">LLENOS</option> {/* Added option */}
                        {Object.keys(clientesAgrupados).map((servicio) => (
                          <option key={servicio} value={servicio}>
                            {servicio}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th>Grupo</th>
                    <th>Disponibilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(clientesAgrupados)
                    .filter(([servicio, grupos]) => {
                      if (selectedService === "DISPONIBLES") {
                        return Object.values(grupos).some(grupo => {
                          if (servicio === "NETFLIX") {
                            return grupo.extraMessage.includes("cupos libres");
                          } else {
                            const count = parseInt(String(grupo).match(/\d+/)[0], 10);
                            return count < (serviceLimits[servicio] || 5);
                          }
                        });
                      } else if (selectedService === "LLENOS") {
                        return Object.values(grupos).some(grupo => {
                          if (servicio === "NETFLIX") {
                            return grupo.extraMessage === "El grupo está lleno.";
                          } else {
                            const count = parseInt(String(grupo).match(/\d+/)[0], 10);
                            return count >= (serviceLimits[servicio] || 5);
                          }
                        });
                      }
                      return !selectedService || servicio === selectedService;
                    })
                    .map(([servicio, grupos]) =>
                      Object.entries(grupos)
                        .filter(([grupo, disponibilidad]) => {
                          if (selectedService === "DISPONIBLES") {
                            if (servicio === "NETFLIX") {
                              return disponibilidad.extraMessage.includes("cupos libres");
                            } else {
                              const count = parseInt(String(disponibilidad).match(/\d+/)[0], 10);
                              return count < (serviceLimits[servicio] || 5);
                            }
                          } else if (selectedService === "LLENOS") {
                            if (servicio === "NETFLIX") {
                              return disponibilidad.extraMessage === "El grupo está lleno.";
                            } else {
                              const count = parseInt(String(disponibilidad).match(/\d+/)[0], 10);
                              return count >= (serviceLimits[servicio] || 5);
                            }
                          }
                          return true;
                        })
                        .map(([grupo, disponibilidad]) => {
                          const disponibilidadStr = String(disponibilidad); // Convert disponibilidad to string
                          let mensajeCupo = '';
                          let displayDisponibilidad = disponibilidadStr;
                          if (servicio !== 'NETFLIX') {
                            const count = parseInt(disponibilidadStr.match(/\d+/)[0], 10); // Extract the count from the disponibilidad string
                            mensajeCupo = obtenerMensajeCupo(count, servicio); // Get the availability message
                            displayDisponibilidad = mensajeCupo.replace(/\(([^)]+)\)/g, ''); // Remove parentheses and their content
                          } else {
                            displayDisponibilidad = (
                              <span className={`fade ${showExtraMessage ? 'fade-out' : 'fade-in'}`}>
                                {showExtraMessage ? disponibilidad.extraMessage : disponibilidad.raisgroups}
                              </span>
                            );
                          }
                          return (
                            <tr key={`${servicio}-${grupo}`}>
                              <td>{servicio}</td><td>{grupo}</td><td>{displayDisponibilidad}</td> {/* Display the message or count */}
                            </tr>
                          );
                        })
                    )}
                </tbody>
              </table>
            </>
          ) : (
            <p>No hay clientes agrupados.</p>
          )}
        </div>
      </div>
    </div>
  );
  
};

export default CuentasDisponibles;
