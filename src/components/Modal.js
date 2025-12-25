export default function Modal({ header, onClose, children }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="d-flex align-items-center justify-content-between">
          <h3>{header}</h3>
          {onClose && <button className="btn btn-lg p-0" onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>}
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
