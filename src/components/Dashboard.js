import { useState } from "react";
import KeysList from "./KeysList";

export default function Dashboard() {
  const [, setEditItem] = useState(null);
  return (
    <div>
      <KeysList editItem={setEditItem} />
    </div>
  );
}