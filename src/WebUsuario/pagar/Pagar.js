import React, { useState } from 'react';
import './Pagar.css';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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

const Pagar = ({ onClose, client, selectedServices }) => {
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

  const servicesToShow = selectedServices.length > 0 ? selectedServices : client.servicio;

  const selectedServiceDetails = selectedServices.length > 0 ? {
    servicio: selectedServices,
    precio: client.precio.filter((_, index) => selectedServices.includes(client.servicio[index]))
  } : {
    servicio: client.servicio,
    precio: client.precio
  };

  const totalPrecio = selectedServiceDetails.precio.reduce((acc, curr) => acc + parseFloat(curr), 0)
    .toLocaleString('es-ES', { minimumFractionDigits: 0 });

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

  const handleConfirmPayment = () => {
    setIsPaymentConfirmed(true);
  };

  const handlePaymentCompleted = async () => {
    try {
      await addDoc(collection(db, 'notificaciones'), {
        nombre: client.nombre.toUpperCase(),
        apellido: client.apellido.toUpperCase(),
        email: client.email,
        telefono: client.telefono,
        notas: client.notas,
        grupo: client.grupo,
        fechaInicial: client.fechaInicial, // Guardar la fecha inicial del cliente
        fechaFinal: client.fechaFinal,
        servicio: servicesToShow.map(service => service.toUpperCase()),
        precio: selectedServiceDetails.precio.map(precio => parseInt(precio.replace(/\D/g, ''), 10)),
        renovacion: true,
        clienteId: client.ID, // Guardar el ID del cliente
        clienteDocId: client.docId || '', // Guardar el ID del documento del cliente, asegurando que no sea undefined
        pagado: client.pagado || [], // Guardar los valores del array pagado del cliente, asegurando que no sea undefined
        timestamp: Timestamp.now(),
      });

      toast.success('🎉 Pago realizado con éxito. En breve serás redirigido para enviar el comprobante de pago. 📲💳', {
        autoClose: 1000,
        onClose: () => {
          setTimeout(() => {
            onClose();
          }, 1250);

          setTimeout(() => {
            window.location.href = 'https://wa.me/message/3QL4QO5JTVOTL1';
          }, 1500);
        }
      });
    } catch (error) {
      console.error('Error creando documento: ', error);
      toast.error('Hubo un error al registrar el pago. Intenta de nuevo.');
    }
  };

  return (
    <div className="pagar-overlay" onClick={onClose}>
      <div className="pagar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="mmodal-title">Confirmar Pago</h2>
          <button className="cclose-button" onClick={onClose}>X</button>
        </div>
        {isPaymentConfirmed ? (
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <p className="modal-text">
              Escanea el siguiente código y haz el pago del servicio {servicesToShow.map(service => service).join(', ')} por el valor de ${totalPrecio}, luego de hacer el pago dale clic en Pago Realizado.
            </p>
            <img
              src={getImageForService(servicesToShow[0])}
              alt="Código de pago"
              style={{ width: '100%', maxWidth: '300px', marginTop: '10px' }}
            />
            <button className="confirm-button" onClick={handlePaymentCompleted}>Pago Realizado</button>
          </div>
        ) : (
          <div className="modal-content" style={{ textAlign: 'left' }}>
            <p className="modal-text">Nombre: {client.nombre} {client.apellido}</p>
            <p className="modal-text">Fecha Final: {client.fechaFinal}</p>
            <p className="modal-text"><strong>Precio Total a Pagar: ${totalPrecio}</strong></p>
            <p className="modal-text">Servicios seleccionados:</p>
            <div className="sservice-icons">
              {servicesToShow.map((service, index) => {
                const serviceKey = service.toUpperCase();
                if (serviceKey === 'NETFLIX' || serviceKey === 'NETFLIXTV' || serviceKey === 'NETFLIXME') {
                  return <img key={index} src={serviceIcons['NETFLIX']} alt={service} className="sservice-icon" />;
                }
                return <img key={index} src={serviceIcons[serviceKey]} alt={service} className="sservice-icon" />;
              })}
            </div>
            <button className="confirm-button" onClick={handleConfirmPayment}>Ver metodo de Pago</button>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Pagar;
