"use client";

import { useState } from "react";
import { useCrud } from "@/hooks/use-crud";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, DoorOpen, MapPin, Loader2 } from "lucide-react";

interface Room {
  id: string; name: string; building: string | null;
  latitude: number; longitude: number; radius: number; capacity: number | null;
}

export default function RoomsPage() {
  const { data, loading, dialogOpen, setDialogOpen, create, remove } =
    useCrud<Room>("/api/rooms");

  const [form, setForm] = useState({
    name: "", building: "", latitude: "34.0531", longitude: "-4.9998", radius: "100", capacity: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const updateForm = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await create(form);
    if (ok) setForm({ name: "", building: "", latitude: "34.0531", longitude: "-4.9998", radius: "100", capacity: "" });
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salles</h1>
          <p className="text-gray-500 mt-1">Gérez les salles avec leurs coordonnées GPS</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : data.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
          <DoorOpen className="h-12 w-12 mb-4 text-gray-300" /><p className="font-medium">Aucune salle</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((room) => (
            <Card key={room.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                      <DoorOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{room.name}</h3>
                      {room.building && <p className="text-sm text-gray-500">{room.building}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon"
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                    onClick={() => { if (confirm("Supprimer cette salle ?")) remove(room.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap text-sm text-gray-500">
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="h-3 w-3" /> {room.radius}m
                  </Badge>
                  {room.capacity && <Badge variant="secondary">{room.capacity} places</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle salle</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom de la salle</Label>
                <Input placeholder="Ex: Amphi A" value={form.name} onChange={(e) => updateForm("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Batiment</Label>
                <Input placeholder="Ex: Batiment B" value={form.building} onChange={(e) => updateForm("building", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input type="number" step="any" value={form.latitude} onChange={(e) => updateForm("latitude", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input type="number" step="any" value={form.longitude} onChange={(e) => updateForm("longitude", e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rayon GPS (metres)</Label>
                <Input type="number" value={form.radius} onChange={(e) => updateForm("radius", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Capacite</Label>
                <Input type="number" placeholder="Optionnel" value={form.capacity} onChange={(e) => updateForm("capacity", e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-gray-400">Les coordonnees par defaut sont celles du campus UEMF</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
