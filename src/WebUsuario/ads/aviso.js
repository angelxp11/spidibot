import './aviso.css';

const WHATSAPP_NUMBER = '573177639110';

function AvisoVencimiento({ onClose, onRenew }) {
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    'Hola, quiero renovar mi servicio que venció.'
  )}`;

  return (
    <div className="aviso-backdrop" onClick={onClose}>
      <div className="aviso-modal" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="aviso-close"
          onClick={onClose}
          aria-label="Cerrar aviso"
        >
          ×
        </button>

        <h2 className="aviso-title">Servicios vencidos</h2>
        <p className="aviso-text">
          La fecha final del servicio coincide con la fecha actual o ya venció.
          Si deseas renovarlo, puedes hacerlo desde la web o comunicarte por WhatsApp.
        </p>

        <div className="aviso-actions">
          <button type="button" className="aviso-secondary" onClick={onClose}>
            Cerrar
          </button>

          <button type="button" className="aviso-web" onClick={onRenew}>
            Renovar desde la web
          </button>

          <a
            className="aviso-whatsapp"
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
          >
            Renovar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default AvisoVencimiento;
