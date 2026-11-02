import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useAlert } from "../hooks/useAlert";
import { deleteVaultItem, listVaultItems } from "../utils/vault/vaultService";
import Alert from "./Alert";
import Loader from "./Loader";
import MigrateVault from "./MigrateVault";
import Navbar from "./Navbar";
import VaultItemChangeHistory from "./VaultItemChangeHistory";
import VaultItemForm from "./VaultItemForm";
import VaultItemList from "./VaultItemList";

export default function Dashboard() {
  const { user } = useAppContext();
  const { alert, showAlert } = useAlert();

  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState({ type: "list", itemId: null });

  const closeSubView = useCallback(() => {
    setActiveView({ type: "list", itemId: null });
  }, []);

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
        showAlert(error.message || "Error deleting passkey", "error");
      } finally {
        setLoading(false);
      }
    },
    [user.uid, showAlert, fetchVaultItems]
  );

  const handleItemSaved = useCallback(() => {
    closeSubView();
    fetchVaultItems();
  }, [closeSubView, fetchVaultItems]);

  if (activeView.type === "history") {
    return (
      <VaultItemChangeHistory
        itemId={activeView.itemId}
        onClose={closeSubView}
      />
    );
  }

  if (activeView.type === "migrate") {
    return (
      <MigrateVault
        onClose={closeSubView}
        onMigrated={fetchVaultItems}
      />
    );
  }

  return (
    <div>
      <Alert alert={alert} />
      <Loader visible={loading} message="Syncing your passwords..." />
      <Navbar
        keys={keys}
        onOpenMigrate={() => setActiveView({ type: "migrate", itemId: null })}
        onEditItem={(itemId) => setActiveView({ type: "edit", itemId })}
      />
      <VaultItemList
        keys={keys}
        onDeleteKey={handleDeleteKey}
        onAddKey={() => setActiveView({ type: "add", itemId: null })}
        onEditKey={(itemId) => setActiveView({ type: "edit", itemId })}
        onViewHistory={(itemId) => setActiveView({ type: "history", itemId })}
      />
      {(activeView.type === "add" || activeView.type === "edit") && (
        <VaultItemForm
          itemId={activeView.type === "edit" ? activeView.itemId : null}
          onClose={closeSubView}
          onSaved={handleItemSaved}
        />
      )}
    </div>
  );
}