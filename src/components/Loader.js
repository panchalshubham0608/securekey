import "./Loader.css";

const Loader = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="loader-overlay">
      <div className="loader-spinner"></div>
    </div>
  );
};

export default Loader;