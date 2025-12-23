import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useAlert } from "../hooks/useAlert";
import "../styles/KeysList.css";
import { deleteVaultItem, listVaultItems } from "../utils/vault/vaultService";
import Alert from "./Alert";
import KeysList from "./KeysList";
import Loader from "./Loader";
import Navbar from "./Navbar";

export default function Dashboard() {
  const { user } = useAppContext();
  const { alert, showAlert } = useAlert();

  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);

  /** ---------- Fetch Vault Items ---------- **/
  const fetchVaultItems = useCallback(async () => {
    setLoading(true);
    try {
      const vaultKeys = await listVaultItems({ uid: user.uid });
      vaultKeys.sort(
        (a, b) =>
          a.account.localeCompare(b.account) ||
          a.username.localeCompare(b.username)
      );
      setKeys(vaultKeys);
    } catch (error) {
      console.error("Error fetching keys", error);
      showAlert(error.message || "Error fetching keys", "error");
    } finally {
      setLoading(false);
    }
  }, [user.uid, showAlert]);

  useEffect(() => {
    fetchVaultItems();
  }, [fetchVaultItems]);

  const handleDeleteKey = useCallback(
    async (key) => {
      setLoading(true);
      try {
        await deleteVaultItem({ uid: user.uid, itemId: key.id });
        showAlert("Entry deleted successfully", "success");
        fetchVaultItems();
      } catch (error) {
        console.error("Error deleting passkey", error);
        showAlert(error.message || "Error deleting passkey", "error");
      } finally {
        setLoading(false);
      }
    },
    [user.uid, showAlert, fetchVaultItems]
  );

  return (
    <div>
      <Alert alert={alert} />
      <Loader visible={loading} />
      <Navbar />
      <KeysList keys={keys} onDeleteKey={handleDeleteKey} />
    </div>
  );
}