export default function Modal({ header, onClose, children }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="m-0 fw-bold">{header}</h5>
          {onClose && (
            <button
              type="button"
              className="sk-icon-btn"
              aria-label="Close modal"
              onClick={onClose}
            >
              <i className="fa-solid fa-times" />
            </button>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

