import { useCallback, useState } from "react";

// export type AlertType = "success" | "error" | "info";

export const useAlert = () => {
  const [alert, setAlert] = useState({
    message: "",
    type: "info",
    visible: false,
  });

  const showAlert = useCallback((message, type = "info") => {
    setAlert({ message, type, visible: true });

    // hide automatically after 3 seconds
    setTimeout(() => {
      setAlert((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  return { alert, showAlert };
};