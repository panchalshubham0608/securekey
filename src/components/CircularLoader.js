import "./Loader.css";

const CircularLoader = (props) => {
  const { borderColor = "#6366f1" } = props;
  return (
    <div
      className="sk-inline-loader"
      data-testid="loader"
      style={{ "--inline-loader-accent": borderColor }}
      role="status"
    >
      <div className="sk-inline-loader-icon">
        <div className="sk-inline-loader-ring" />
        <i className="fa-solid fa-key" />
      </div>
      <span className="sk-inline-loader-label font-mono">Decrypting key...</span>
    </div>
  );
};

export default CircularLoader;
