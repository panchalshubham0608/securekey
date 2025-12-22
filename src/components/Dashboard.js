import { useState } from "react";
import { useAlert } from "../hooks/useAlert";
import Alert from "./Alert";
import KeysList from "./KeysList";
import Navbar from "./Navbar";

export default function Dashboard() {
  const [, setEditItem] = useState(null);
  const { alert } = useAlert();
  return (
    <div>
      <Alert alert={alert} />
      <Navbar />
      <KeysList editItem={setEditItem} />
    </div>
  );
}