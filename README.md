# UEMF Présence

Système de gestion automatique des présences universitaires — QR code
rotatif, check-in géolocalisé « Je suis là », présence des étudiants
**et** des professeurs, emploi du temps récurrent, tableau d'anomalies
pour l'administration.

Projet du module **Recherche Opérationnelle** (Pr Ahmed El Hilali Alaoui)
— EIDIA, Université Euro-Méditerranéenne de Fès, 2025–2026.

**Équipe :** Mouhssine El Boumshouli · Yassine Hamda Benchkroune ·
Badr Lasri · Mohamed Amine Hajji

## Tester sans rien installer

Le projet est déployé en ligne :

**https://student-attendance-system-amber.vercel.app**

Comptes de démonstration (mot de passe : `password123`) :

| Rôle | Email |
|---|---|
| Administrateur | `admin@eidia.ueuromed.org` |
| Professeur (RO) | `hicham.tazi@eidia.ueuromed.org` |
| Étudiant | `imane.saidi@eidia.ueuromed.org` |

Tous les noms (professeurs, étudiants) sont fictifs.

## Lancer en local

Prérequis : [Node.js LTS](https://nodejs.org).

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000. Copier `.env.example` vers `.env`,
puis renseigner sa propre base PostgreSQL et un secret NextAuth local.

## Fonctionnement en bref

1. L'admin définit l'emploi du temps (créneaux hebdomadaires récurrents
   ou import CSV) — les séances du semestre sont générées automatiquement.
2. Chaque séance **s'ouvre et se ferme toute seule** à l'heure prévue
   (statut calculé depuis l'horloge, aucun clic).
3. Étudiants et professeur marquent leur présence depuis leur téléphone :
   bouton « Je suis là » (GPS + appareil + photo de contrôle) ou scan du
   QR rotatif (HMAC-SHA256, change toutes les 10 s).
4. Quatre vérifications anti-fraude tournent à chaque check-in — un échec
   ne bloque jamais : la présence est marquée « à vérifier » et le
   professeur tranche, photo à l'appui.
5. Rapports CSV, historique par étudiant, et tableau d'anomalies pour la
   direction (séances sans professeur, classement des absences…).

## Modélisation RO

Optimisation combinatoire : variables binaires x_ij ∈ {0, 1} (présence de
l'étudiant i à la séance j), fonction objectif multi-critère
Z = α·Z₁ + β·Z₂ + γ·Z₃ (couverture, vérification, gain de temps),
sous cinq contraintes — unicité (C1), temporelle (C2), géographique /
Haversine (C3), cryptographique / HMAC (C4), appareil unique (C5).
Voir `report/` pour le rapport complet.

## Stack

Next.js 16 · React 19 · TypeScript · Prisma 6 · PostgreSQL (Neon) ·
NextAuth · Tailwind CSS v4 — déployé sur Vercel.

## Structure

| Dossier | Rôle |
|---|---|
| `src/app/(dashboard)/` | Pages admin / professeur / étudiant / check-in |
| `src/app/api/` | API : sessions, présences, check-in, emploi du temps, analytiques |
| `src/lib/qr/` | Tokens QR rotatifs (HMAC-SHA256) |
| `src/lib/geo/` | Géofence GPS (formule de Haversine) |
| `src/lib/session-status.ts` | Statut des séances dérivé de l'horloge |
| `src/lib/schedule.ts` | Matérialisation de l'emploi du temps |
| `prisma/` | Schéma de données + seed de démonstration |
| `report/` | Générateurs des rapports PDF (défense + description) |
