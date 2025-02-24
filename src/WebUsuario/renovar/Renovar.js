import React, { useEffect, useState } from 'react';
import './Renovar.css';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../../firebase';
import { getAuth } from 'firebase/auth';
import Pagar from '../pagar/Pagar';
import spotifyIcon from '../../recursos/svg/SPOTIFY.svg';
import youtubeIcon from '../../recursos/svg/YOUTUBE.svg';
import netflixIcon from '../../recursos/svg/NETFLIX,NETFLIXTV,NETFLIXME.svg';
import primeVideoIcon from '../../recursos/svg/PRIMEVIDEO.svg';
import paramountIcon from '../../recursos/svg/PARAMOUNT.svg';
import disneyIcon from '../../recursos/svg/DISNEY.svg';
import crunchyIcon from '../../recursos/svg/CRUNCHY.svg';
import maxIcon from '../../recursos/svg/MAX.svg';

const serviceIcons = {
  SPOTIFY: spotifyIcon,
  YOUTUBE: youtubeIcon,
  NETFLIX: netflixIcon,
  PRIMEVIDEO: primeVideoIcon,
  PARAMOUNT: paramountIcon,
  DISNEY: disneyIcon,
  CRUNCHY: crunchyIcon,
  MAX: maxIcon,
};

const firestore = getFirestore(app);

const Renovar = ({ onClose, clientId, clientName, serviceName }) => {
  const [clientsWithSameEmailAndService, setClientsWithSameEmailAndService] = useState([]);
  const [expandedClientIndex, setExpandedClientIndex] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [showPagarModal, setShowPagarModal] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (user && user.email) {
      const fetchClientsWithSameEmailAndService = async () => {
        try {
          const clientCollection = collection(firestore, 'clientes');
          let q;
          if (serviceName.toUpperCase() === 'NETFLIX') {
            q = query(clientCollection, where('email', '==', user.email), where('servicio', 'array-contains-any', ['NETFLIX', 'NETFLIXTV', 'NETFLIXME']));
          } else {
            q = query(clientCollection, where('email', '==', user.email), where('servicio', 'array-contains', serviceName));
          }
          const querySnapshot = await getDocs(q);

          const clients = querySnapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
          setClientsWithSameEmailAndService(clients);
        } catch (error) {
          console.error('Error fetching clients with same email and service:', error);
        }
      };

      fetchClientsWithSameEmailAndService();
    }
  }, [user, serviceName]);

  const toggleClientDetails = (index) => {
    setExpandedClientIndex(expandedClientIndex === index ? null : index);
  };

  const toggleServiceSelection = (service) => {
    setSelectedServices((prevSelectedServices) =>
      prevSelectedServices.includes(service)
        ? prevSelectedServices.filter((s) => s !== service)
        : [...prevSelectedServices, service]
    );
  };

  const handlePagarClick = (client, docId) => {
    setCurrentClient({ ...client, docId });
    setShowPagarModal(true);
  };

  return (
    <div className="renovar-overlay" onClick={onClose}>
      <div className="renovar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modaal-header">
          <h2 className="modaal-title">Renovar Suscripción</h2>
          <button className="closse-button" onClick={onClose}>X</button>
        </div>
        <p className="renovar-text">
          Selecciona aquel servicio que deseas renovar, si son todos los que estan en la factura entonces simplemente dale click a pagar
        </p>
        <ul>
          {clientsWithSameEmailAndService.map((client, index) => (
            <li key={index} className={`sclient-item ${expandedClientIndex === index ? 'expanded' : ''}`}>
              <div className="client-info">
                <span className="client-id">{client.ID}</span>
                <span>{client.nombre} {client.apellido}</span>
                <button className="togggle-arrow-button" onClick={() => toggleClientDetails(index)}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" className={`arrow-icon ${expandedClientIndex === index ? 'rotated' : ''}`}>
                    <path d="m18 9.28-6.35 6.35-6.37-6.35.72-.71 5.64 5.65 5.65-5.65z" fill="white"></path>
                  </svg>
                </button>
              </div>
              {expandedClientIndex === index && (
                <div className="ssservice-icons">
                  {client.servicio.map((service) => {
                    const serviceKey = service.toUpperCase();
                    const isSelected = selectedServices.includes(serviceKey);
                    if (serviceKey === 'NETFLIX' || serviceKey === 'NETFLIXTV' || serviceKey === 'NETFLIXME') {
                      return (
                        <img
                          key={serviceKey}
                          src={serviceIcons['NETFLIX']}
                          alt={service}
                          className={`ssservice-icon ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleServiceSelection(serviceKey)}
                        />
                      );
                    }
                    return (
                      <img
                        key={serviceKey}
                        src={serviceIcons[serviceKey]}
                        alt={service}
                        className={`ssservice-icon ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleServiceSelection(serviceKey)}
                      />
                    );
                  })}
                </div>
              )}
              {expandedClientIndex === index && (
                <button className="renovar-button" onClick={() => handlePagarClick(client, client.docId)}>Pagar</button>
              )}
            </li>
          ))}
        </ul>
      </div>
      {showPagarModal && (
        <Pagar onClose={() => setShowPagarModal(false)} client={currentClient} selectedServices={selectedServices} />
      )}
    </div>
  );
};

export default Renovar;