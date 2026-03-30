"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export function useCrud<T extends { id?: string }>(apiUrl: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = async (body: Record<string, unknown>) => {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la création");
        return false;
      }

      toast.success("Créé avec succès");
      setDialogOpen(false);
      await fetchData();
      return true;
    } catch {
      toast.error("Erreur serveur");
      return false;
    }
  };

  const remove = async (id: string, deleteUrl?: string) => {
    try {
      const url = deleteUrl || `${apiUrl}?id=${id}`;
      const res = await fetch(url, { method: "DELETE" });

      if (!res.ok) {
        toast.error("Erreur lors de la suppression");
        return false;
      }

      toast.success("Supprimé avec succès");
      await fetchData();
      return true;
    } catch {
      toast.error("Erreur serveur");
      return false;
    }
  };

  return {
    data,
    loading,
    dialogOpen,
    setDialogOpen,
    create,
    remove,
    refresh: fetchData,
  };
}
