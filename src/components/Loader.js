import React from "react";
export default function Loader(props) {
  let { borderColor } = props;
  if (!borderColor) borderColor = "#0d6efd";
  return (
    <div className="d-flex justify-content-center mt-3" data-testid="loader">
      <div
        className="spinner-border"
        style={{
          borderColor: borderColor,
          borderRightColor: "transparent",
        }}
        role="status"
      ></div>
    </div>
  );
}
