import "./Alert.css";

function Alert({ alert }) {
  if (!alert.visible) return null;

  return (
    <div className={`alert alert-${alert.type}`}>
      {alert.message}
    </div>
  );
}

export default Alert;