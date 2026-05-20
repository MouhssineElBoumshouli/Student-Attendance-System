"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Trash2, CalendarClock, Loader2, Upload, FileSpreadsheet, Clock, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface Course { id: string; name: string; code: string }
interface Room { id: string; name: string; building: string | null }
interface ScheduleRule {
  id: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  active: boolean;
  course: { name: string; code: string };
  room: { name: string; building: string | null };
  _count: { sessions: number };
}

const DAY_OPTIONS = [
  { value: "1", label: "Lundi" },
  { value: "2", label: "Mardi" },
  { value: "3", label: "Mercredi" },
  { value: "4", label: "Jeudi" },
  { value: "5", label: "Vendredi" },
  { value: "6", label: "Samedi" },
  { value: "0", label: "Dimanche" },
];

export default function SchedulePage() {
  const [rules, setRules] = useState<ScheduleRule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    courseId: "", roomId: "", dayOfWeek: "", startTime: "08:30", endTime: "10:00",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [r, c, ro] = await Promise.all([
      fetch("/api/schedule-rules").then((x) => x.json()),
      fetch("/api/courses").then((x) => x.json()),
      fetch("/api/rooms").then((x) => x.json()),
    ]);
    setRules(r);
    setCourses(c);
    setRooms(ro);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const updateForm = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/schedule-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Règle créée — ${data.materialized.created} séances générées, ${data.materialized.skipped} ignorées (déjà existantes)`
        );
        setDialogOpen(false);
        setForm({
          courseId: "", roomId: "", dayOfWeek: "", startTime: "08:30",
          endTime: "10:00",
          startDate: new Date().toISOString().split("T")[0], endDate: "",
        });
        fetchAll();
      } else {
        toast.error(data.error || "Erreur");
      }
    } catch { toast.error("Erreur serveur"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    const deleteSessions = confirm(
      "Supprimer aussi les futures séances générées par cette règle ?\n\n" +
      "OK = supprime les séances futures liées\n" +
      "Annuler = supprime juste la règle (les séances restent)"
    );
    try {
      const res = await fetch(
        `/api/schedule-rules?id=${id}&deleteSessions=${deleteSessions}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        toast.success("Règle supprimée");
        fetchAll();
      } else { toast.error("Erreur"); }
    } catch { toast.error("Erreur serveur"); }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const res = await fetch("/api/schedule-rules/import", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `${data.rulesCreated} règles importées · ${data.sessionsCreated} séances générées`
        );
        if (data.results.some((r: { status: string }) => r.status === "skipped")) {
          const skipped = data.results.filter((r: { status: string }) => r.status === "skipped");
          toast.warning(`${skipped.length} ligne(s) ignorée(s) — voir console`);
          console.warn("Lignes ignorées :", skipped);
        }
        fetchAll();
      } else {
        toast.error(data.error || "Erreur d'import");
      }
    } catch { toast.error("Erreur lors de la lecture du fichier"); }
    finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const template = [
      "# Modèle d'import — colonnes obligatoires, séparateur virgule",
      "course_code,room_name,day_of_week,start_time,end_time,start_date,end_date",
      "RO-501,Amphi A,Mardi,08:30,10:00,2026-01-13,2026-05-15",
      "MATH-501,Salle 204,Jeudi,10:30,12:00,2026-01-13,2026-05-15",
    ].join("\n");
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schedule_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emploi du temps</h1>
          <p className="text-gray-500 mt-1">
            Règles d&apos;emploi du temps récurrentes (créneaux hebdomadaires)
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={downloadTemplate}>
            <FileSpreadsheet className="h-4 w-4" /> Modèle CSV
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importer CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvImport}
          />
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4" />
            Règles actives ({rules.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              Aucune règle d&apos;emploi du temps.<br />
              Créez-en une via « Ajouter » ou importez un CSV.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Cours</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Jour</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Créneau</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Salle</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Période</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Séances</th>
                    <th className="text-right py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{r.course.name}</div>
                        <div className="text-xs text-gray-400">{r.course.code}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{r.dayName}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {r.startTime} – {r.endTime}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          {r.room.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {formatDate(r.startDate)} → {formatDate(r.endDate)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline">{r._count.sessions}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-600"
                          onClick={() => handleDelete(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nouveau créneau hebdomadaire</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cours</Label>
                <Select value={form.courseId} onValueChange={(v) => updateForm("courseId", v)}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Salle</Label>
                <Select value={form.roomId} onValueChange={(v) => updateForm("roomId", v)}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}{r.building ? ` (${r.building})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Jour de la semaine</Label>
              <Select value={form.dayOfWeek} onValueChange={(v) => updateForm("dayOfWeek", v)}>
                <SelectTrigger><SelectValue placeholder="Choisir un jour" /></SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Heure de début</Label>
                <Input type="time" value={form.startTime} onChange={(e) => updateForm("startTime", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Heure de fin</Label>
                <Input type="time" value={form.endTime} onChange={(e) => updateForm("endTime", e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input type="date" value={form.startDate} onChange={(e) => updateForm("startDate", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input type="date" value={form.endDate} onChange={(e) => updateForm("endDate", e.target.value)} required />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Le système générera une séance pour chaque {form.dayOfWeek ? DAY_OPTIONS.find((d) => d.value === form.dayOfWeek)?.label.toLowerCase() : "jour"} entre les dates indiquées.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button
                type="submit"
                disabled={submitting || !form.courseId || !form.roomId || !form.dayOfWeek || !form.endDate}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer & générer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
