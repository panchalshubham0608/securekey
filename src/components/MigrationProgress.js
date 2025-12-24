import "./MigrationProgress.css";

export default function MigrationProgress({ percentage }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="migration-container">
          <div
            className="progress-ring"
            style={{ "--progress": percentage }}
          >
            <svg width="120" height="120">
              <circle className="bg" cx="60" cy="60" r="52" />
              <circle className="progress" cx="60" cy="60" r="52" />
            </svg>
            <div className="progress-text">{percentage}%</div>
          </div>

          <h3>Migration in progress</h3>
          <p>Securely migrating your passwords.
            This may take a moment.
            Please don&apos;t close the app.</p>
        </div>
      </div>
    </div>
  );
}
