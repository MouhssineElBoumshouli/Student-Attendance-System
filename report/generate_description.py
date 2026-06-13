#!/usr/bin/env python3
"""
UEMF Présence — document « Fonctionnement du projet » pour la remise USB.

Document de DESCRIPTION (pas de défense) : explique ce que fait le
système, comment y accéder, comment le tester en 5 minutes, et comment
lancer le code localement. Écrit pour un lecteur qui veut des résultats,
pas des détails d'implémentation.

Génération :
    python report/generate_description.py
Sortie :
    report/FONCTIONNEMENT_DU_PROJET.pdf
"""

import os

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    HRFlowable,
)

INK = HexColor("#0d0d0d")
ACCENT = HexColor("#c0392b")
ACCENT2 = HexColor("#2c3e7a")
GOLD = HexColor("#d4a017")
GREEN = HexColor("#27ae60")
MUTED = HexColor("#7a7065")
CARD_BG = HexColor("#faf6ee")
BORDER = HexColor("#d0c8b8")
LIGHT_BLUE = HexColor("#eef3fa")
LIGHT_GREEN = HexColor("#ecf7ec")

ss = getSampleStyleSheet()

ss.add(ParagraphStyle(name="CoverTitle", fontName="Helvetica-Bold",
                      fontSize=30, leading=36, textColor=INK,
                      alignment=TA_CENTER))
ss.add(ParagraphStyle(name="CoverSub", fontName="Helvetica-Bold",
                      fontSize=14, leading=20, textColor=ACCENT2,
                      alignment=TA_CENTER))
ss.add(ParagraphStyle(name="CoverBadge", fontName="Helvetica-Bold",
                      fontSize=9, leading=12, textColor=white,
                      alignment=TA_CENTER, backColor=ACCENT,
                      borderPadding=(4, 8, 4, 8)))
ss.add(ParagraphStyle(name="H1", fontName="Helvetica-Bold",
                      fontSize=19, leading=25, textColor=INK,
                      spaceBefore=16, spaceAfter=10))
ss.add(ParagraphStyle(name="H2", fontName="Helvetica-Bold",
                      fontSize=13.5, leading=19, textColor=ACCENT2,
                      spaceBefore=12, spaceAfter=6))
ss.add(ParagraphStyle(name="uBody", fontName="Helvetica",
                      fontSize=10.5, leading=16, textColor=INK,
                      alignment=TA_JUSTIFY, spaceAfter=8))
ss.add(ParagraphStyle(name="uBullet", fontName="Helvetica",
                      fontSize=10.5, leading=15, textColor=INK,
                      leftIndent=18, bulletIndent=6, spaceAfter=4))
ss.add(ParagraphStyle(name="uStep", fontName="Helvetica",
                      fontSize=10.5, leading=16, textColor=INK,
                      leftIndent=14, spaceAfter=6))
ss.add(ParagraphStyle(name="uBox", fontName="Helvetica",
                      fontSize=10.5, leading=16, textColor=INK,
                      leftIndent=8, rightIndent=8,
                      borderPadding=(10, 12, 10, 12),
                      backColor=LIGHT_BLUE, spaceBefore=4, spaceAfter=10))
ss.add(ParagraphStyle(name="uBoxGreen", parent=ss["uBox"],
                      backColor=LIGHT_GREEN))
ss.add(ParagraphStyle(name="uCode", fontName="Courier-Bold",
                      fontSize=11, leading=16, textColor=ACCENT2,
                      backColor=CARD_BG, leftIndent=12, rightIndent=12,
                      borderPadding=(8, 10, 8, 10),
                      spaceBefore=4, spaceAfter=8))
ss.add(ParagraphStyle(name="THeader", fontName="Helvetica-Bold",
                      fontSize=9.5, leading=13, textColor=white,
                      alignment=TA_LEFT))
ss.add(ParagraphStyle(name="TCell", fontName="Helvetica",
                      fontSize=9.5, leading=13, textColor=INK,
                      alignment=TA_LEFT))
ss.add(ParagraphStyle(name="TCellMono", fontName="Courier",
                      fontSize=9, leading=12, textColor=ACCENT2,
                      alignment=TA_LEFT))


def hr():
    return HRFlowable(width="100%", thickness=0.5, color=BORDER,
                      spaceBefore=6, spaceAfter=10)


def bul(text):
    return Paragraph(f"<bullet>&bull;</bullet> {text}", ss["uBullet"])


def make_table(headers, rows, col_widths, mono_cols=()):
    header_row = [Paragraph(h, ss["THeader"]) for h in headers]
    data = [header_row]
    for r in rows:
        cells = []
        for j, c in enumerate(r):
            style = ss["TCellMono"] if j in mono_cols else ss["TCell"]
            cells.append(Paragraph(str(c), style))
        data.append(cells)
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("TOPPADDING", (0, 0), (-1, 0), 7),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, CARD_BG]),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def add_page_decorations(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(2.2 * cm, 1.2 * cm,
                      "UEMF Présence — Fonctionnement du projet")
    canvas.drawRightString(A4[0] - 2.2 * cm, 1.2 * cm, f"p. {doc.page}")
    canvas.restoreState()


TEAM = ("Mouhssine El Boumshouli · Yassine Hamda Benchkroune · "
        "Badr Lasri · Mohamed Amine Hajji")
LIVE_URL = "https://student-attendance-system-amber.vercel.app"


def build():
    out = os.path.join(os.path.dirname(__file__),
                       "FONCTIONNEMENT_DU_PROJET.pdf")
    doc = SimpleDocTemplate(
        out, pagesize=A4,
        leftMargin=2.2 * cm, rightMargin=2.2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
        title="UEMF Présence — Fonctionnement du projet",
        author=TEAM,
    )
    s = []

    # ═══ COVER ═══
    s.append(Spacer(1, 4 * cm))
    s.append(Paragraph("PROJET · RECHERCHE OPÉRATIONNELLE", ss["CoverBadge"]))
    s.append(Spacer(1, 1.2 * cm))
    s.append(Paragraph("UEMF Présence", ss["CoverTitle"]))
    s.append(Spacer(1, 0.3 * cm))
    s.append(Paragraph("Fonctionnement du projet", ss["CoverSub"]))
    s.append(Spacer(1, 0.5 * cm))
    s.append(Paragraph(
        "Système de gestion automatique des présences par QR code rotatif "
        "et check-in géolocalisé — étudiants ET professeurs.",
        ParagraphStyle("cs", parent=ss["uBody"], alignment=TA_CENTER,
                       fontSize=11.5, leading=16)))
    s.append(Spacer(1, 2.2 * cm))

    info_rows = [
        ("Équipe", TEAM),
        ("Module", "Recherche Opérationnelle"),
        ("Encadrant", "Pr Ahmed El Hilali Alaoui"),
        ("Formation", "EIDIA — UEMF · 2025–2026"),
        ("Site en ligne", LIVE_URL),
        ("Code source", "github.com/MouhssineElBoumshouli/Student-Attendance-System"),
    ]
    info_tbl = Table(
        [[Paragraph(f"<b>{k}</b>", ss["TCell"]),
          Paragraph(v, ss["TCell"])] for k, v in info_rows],
        colWidths=[3.6 * cm, 11.9 * cm])
    info_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
    ]))
    s.append(info_tbl)
    s.append(PageBreak())

    # ═══ 1. EN UNE PAGE ═══
    s.append(Paragraph("1. Le projet en une page", ss["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "<b>Le problème.</b> L'appel manuel coûte 5 à 15 minutes par séance, "
        "produit des erreurs, et n'empêche pas un étudiant de répondre "
        "« présent » pour un absent. Rien ne vérifie non plus la présence du "
        "professeur.",
        ss["uBody"]))
    s.append(Paragraph(
        "<b>Notre solution.</b> Une application web où la présence se prend "
        "en 15 à 30 secondes, sans appel oral. Les séances suivent l'emploi "
        "du temps automatiquement : elles s'ouvrent et se ferment seules, "
        "sans aucune intervention. Les étudiants marquent leur présence "
        "depuis leur téléphone (bouton « Je suis là » ou scan d'un QR code "
        "rotatif), et le système vérifie quatre choses à chaque fois : la "
        "position GPS, l'appareil utilisé, une photo de contrôle, et "
        "l'unicité de l'appareil dans la séance. <b>La présence du professeur "
        "est enregistrée de la même manière, indépendamment de celle des "
        "étudiants</b> — l'administration voit qui était réellement là, des "
        "deux côtés.",
        ss["uBody"]))
    s.append(Paragraph(
        "<b>Lien avec la Recherche Opérationnelle.</b> Le problème est "
        "modélisé comme une optimisation combinatoire : pour chaque couple "
        "(étudiant, séance), une variable binaire x<sub>ij</sub> ∈ {0, 1} "
        "indique la présence. On maximise une fonction objectif multi-critère "
        "Z = α·Z<sub>1</sub> + β·Z<sub>2</sub> + γ·Z<sub>3</sub> (couverture, "
        "vérification, gain de temps) sous cinq familles de contraintes : "
        "unicité (C1), temporelle (C2), géographique — formule de Haversine "
        "(C3), cryptographique — HMAC-SHA256 (C4), et appareil unique (C5). "
        "Chaque contrainte mathématique a sa traduction exacte dans le code.",
        ss["uBody"]))
    s.append(Paragraph(
        "<b>Résultat mesurable :</b> ~96 % de gain de temps par séance, "
        "0 € de coût d'exploitation (hébergement et base de données "
        "gratuits), quatre couches anti-fraude indépendantes.",
        ss["uBoxGreen"]))

    # ═══ 2. ACCÈS DIRECT ═══
    s.append(Paragraph("2. Tester immédiatement (aucune installation)", ss["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "Le projet est déployé en ligne. Il suffit d'ouvrir ce lien dans "
        "n'importe quel navigateur (ordinateur ou téléphone) :",
        ss["uBody"]))
    s.append(Paragraph(LIVE_URL, ss["uCode"]))
    s.append(Paragraph(
        "Comptes de démonstration — <b>le mot de passe est le même pour "
        "tous : <font face='Courier'>password123</font></b>. Tous les noms "
        "(professeurs et étudiants) sont fictifs, créés pour la démonstration.",
        ss["uBody"]))

    s.append(make_table(
        ["Rôle", "Email de connexion", "Ce que vous verrez"],
        [
            ["Administrateur", "admin@eidia.ueuromed.org",
             "Gestion complète : emploi du temps, salles, comptes, "
             "tableau d'anomalies"],
            ["Professeur (RO)", "hicham.tazi@eidia.ueuromed.org",
             "Ses séances, le QR code en direct, la liste de présence, "
             "les rapports"],
            ["Professeur (Maths)", "latifa.mansouri@eidia.ueuromed.org",
             "Idem, pour le cours de mathématiques"],
            ["Étudiant", "imane.saidi@eidia.ueuromed.org",
             "Le bouton « Je suis là », le scan QR, son historique"],
            ["Étudiant", "karim.ouali@eidia.ueuromed.org",
             "Idem — utile pour tester deux étudiants en parallèle"],
        ],
        col_widths=[3 * cm, 6.3 * cm, 6.2 * cm],
        mono_cols=(1,),
    ))
    s.append(PageBreak())

    # ═══ 3. LES TROIS RÔLES ═══
    s.append(Paragraph("3. Les trois rôles", ss["H1"]))
    s.append(hr())
    s.append(make_table(
        ["Rôle", "Capacités"],
        [
            ["Administrateur",
             "Crée l'emploi du temps (créneaux hebdomadaires récurrents ou "
             "import CSV du semestre entier), gère départements, filières, "
             "groupes, salles (avec coordonnées GPS), professeurs, "
             "étudiants et cours. Consulte le tableau des anomalies : "
             "séances sans professeur, classement des absences "
             "professeurs, séances sans étudiants."],
            ["Professeur",
             "Voit ses séances (générées automatiquement par l'emploi du "
             "temps), affiche le QR code rotatif en classe, suit les "
             "arrivées en temps réel, consulte les photos de contrôle, "
             "corrige manuellement un statut, marque sa propre présence, "
             "annule une séance, exporte le rapport CSV."],
            ["Étudiant",
             "Marque sa présence par le bouton « Je suis là » (ou en "
             "scannant le QR affiché en classe), consulte son historique "
             "et son taux de présence par cours."],
        ],
        col_widths=[3.2 * cm, 12.3 * cm],
    ))

    # ═══ 4. FONCTIONNEMENT D'UNE SÉANCE ═══
    s.append(Paragraph("4. Fonctionnement d'une séance, de bout en bout", ss["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "<b>Étape 1 — L'emploi du temps génère les séances.</b> "
        "L'administrateur définit une règle du type « RO-501, tous les "
        "mardis 10h30–12h00, Amphi A, du 15 septembre au 20 janvier » "
        "(formulaire ou import CSV). Le système crée automatiquement toutes "
        "les séances du semestre, avec la liste des étudiants inscrits "
        "pré-remplie.", ss["uStep"]))
    s.append(Paragraph(
        "<b>Étape 2 — La séance s'ouvre toute seule.</b> Le mardi à 10h25 "
        "(5 minutes avant l'heure), la séance passe automatiquement « en "
        "cours ». Personne ne clique sur rien : le statut est calculé en "
        "permanence à partir de l'horloge.", ss["uStep"]))
    s.append(Paragraph(
        "<b>Étape 3 — Chacun marque sa présence depuis son téléphone.</b> "
        "L'étudiant ouvre la page « Je suis là » : l'application détecte "
        "automatiquement la séance en cours et affiche un bouton. Un appui "
        "→ le téléphone capture la position GPS, l'empreinte de l'appareil "
        "et une photo de contrôle, et les envoie au serveur. "
        "<b>Le professeur fait exactement pareil</b> — sa présence est "
        "enregistrée sur la séance, indépendamment des étudiants. "
        "Alternative : le professeur peut afficher un QR code rotatif "
        "(il change toutes les 10 secondes) que les étudiants scannent.",
        ss["uStep"]))
    s.append(Paragraph(
        "<b>Étape 4 — Le serveur vérifie sans jamais bloquer.</b> Quatre "
        "contrôles tournent à chaque check-in (détail en section 5). Si un "
        "contrôle échoue — par exemple un GPS imprécis en intérieur — la "
        "présence est <b>quand même enregistrée</b>, mais marquée « à "
        "vérifier » : le professeur tranche en un clic, photo à l'appui. "
        "Un étudiant honnête n'est jamais pénalisé par un capteur "
        "défaillant.", ss["uStep"]))
    s.append(Paragraph(
        "<b>Étape 5 — La séance se ferme toute seule.</b> À 12h10 (10 "
        "minutes après la fin), la séance passe « terminée ». Qui n'a pas "
        "marqué sa présence est absent — étudiant comme professeur. Arrivée "
        "plus de 15 minutes après le début = « en retard ».", ss["uStep"]))
    s.append(Paragraph(
        "<b>Étape 6 — Les données sont exploitables immédiatement.</b> "
        "Rapport CSV par séance (avec la présence du professeur en "
        "en-tête), historique par étudiant, taux par cours, et tableau "
        "d'anomalies pour la direction : séances tenues sans professeur, "
        "professeurs les plus absents, séances sans étudiants.",
        ss["uStep"]))
    s.append(PageBreak())

    # ═══ 5. ANTI-FRAUDE ═══
    s.append(Paragraph("5. Les quatre vérifications anti-fraude", ss["H1"]))
    s.append(hr())
    s.append(make_table(
        ["#", "Vérification", "Ce qu'elle empêche"],
        [
            ["1", "GPS (formule de Haversine) — la position du téléphone "
                  "doit être dans le rayon de la salle (60 à 150 m selon "
                  "la salle).",
             "Marquer sa présence depuis chez soi ou la cafétéria."],
            ["2", "Appareil de confiance — au premier check-in, le "
                  "téléphone de l'étudiant est mémorisé. Un check-in "
                  "depuis un autre appareil est signalé.",
             "Se connecter au compte d'un ami absent depuis son propre "
             "téléphone."],
            ["3", "Un appareil par séance — le même téléphone ne peut pas "
                  "valider deux comptes différents dans la même séance.",
             "Faire passer son téléphone à un voisin pour qu'il valide "
             "un absent."],
            ["4", "Photo de contrôle — la caméra avant prend une photo au "
                  "moment du check-in, consultable par le professeur.",
             "Toute fraude résiduelle : la photo montre qui a réellement "
             "appuyé sur le bouton."],
        ],
        col_widths=[0.8 * cm, 8 * cm, 6.7 * cm],
    ))
    s.append(Paragraph(
        "Pour le QR code s'ajoute une 5<super>e</super> protection : le code "
        "est régénéré toutes les 10 secondes par cryptographie HMAC-SHA256 "
        "(le schéma de Google Authenticator). Une photo du QR envoyée à un "
        "ami absent expire avant même d'arriver.",
        ss["uBox"]))

    # ═══ 6. TEST EN 5 MINUTES ═══
    s.append(Paragraph("6. Scénario de test en 5 minutes", ss["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "<b>1.</b> Sur votre ordinateur, connectez-vous en "
        "<b>administrateur</b> (admin@eidia.ueuromed.org / password123). "
        "Menu « Emploi du temps » → « Ajouter » → choisissez le cours "
        "Recherche Opérationnelle, la salle Amphi A, le jour d'aujourd'hui, "
        "une heure de début déjà passée de quelques minutes et une heure de "
        "fin dans une heure → « Créer &amp; générer ». Une séance est créée "
        "et <b>déjà en cours</b>.", ss["uStep"]))
    s.append(Paragraph(
        "<b>2.</b> Dans un autre navigateur (ou sur un téléphone), "
        "connectez-vous en <b>étudiant</b> (imane.saidi@eidia.ueuromed.org). "
        "Menu « Je suis là » → la séance s'affiche → appuyez sur le bouton. "
        "Autorisez la caméra et la position si demandé. La présence est "
        "enregistrée.", ss["uStep"]))
    s.append(Paragraph(
        "<b>3.</b> Connectez-vous en <b>professeur</b> "
        "(hicham.tazi@eidia.ueuromed.org) → « Séances » → ouvrez la séance : "
        "Imane est présente, avec l'heure exacte et l'état des "
        "vérifications. L'icône caméra montre la photo de contrôle. Le "
        "professeur peut marquer sa propre présence via « Je suis là », "
        "corriger un statut, ou exporter le CSV.", ss["uStep"]))
    s.append(Paragraph(
        "<b>4.</b> (Optionnel) Reconnectez-vous en administrateur → "
        "« Analytiques » : le tableau de bord d'anomalies montre les "
        "séances terminées sans professeur, le classement des absences, etc.",
        ss["uStep"]))
    s.append(Paragraph(
        "Note : si vous testez loin du campus de Fès, le GPS sortira du "
        "rayon de la salle — la présence sera enregistrée avec la mention "
        "« à vérifier ». C'est le comportement voulu (voir section 5) : "
        "le système signale, le professeur tranche.",
        ss["uBox"]))
    s.append(PageBreak())

    # ═══ 7. LANCER LE CODE LOCALEMENT ═══
    s.append(Paragraph("7. Lancer le code sur votre PC (optionnel)", ss["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "Le site en ligne (section 2) suffit pour tout tester. Si vous "
        "souhaitez néanmoins exécuter le code du dossier "
        "<font face='Courier'>2_CODE</font> sur votre machine :",
        ss["uBody"]))
    s.append(Paragraph(
        "<b>Prérequis (une seule fois) :</b> installer Node.js LTS depuis "
        "nodejs.org (bouton vert, installation par défaut, « Suivant » "
        "partout).", ss["uStep"]))
    s.append(Paragraph(
        "<b>Ensuite :</b> ouvrir le dossier "
        "<font face='Courier'>2_CODE/uemf-attendance</font>, cliquer dans la "
        "barre d'adresse de l'explorateur Windows, taper "
        "<font face='Courier'>cmd</font> puis Entrée, et exécuter ces deux "
        "commandes :", ss["uStep"]))
    s.append(Paragraph("npm install", ss["uCode"]))
    s.append(Paragraph("npm run dev", ss["uCode"]))
    s.append(Paragraph(
        "Puis ouvrir <font face='Courier'>http://localhost:3000</font> dans "
        "le navigateur. Les mêmes comptes que la section 2 fonctionnent : la "
        "base de données est hébergée dans le cloud (Neon PostgreSQL), le "
        "fichier de configuration <font face='Courier'>.env</font> est déjà "
        "inclus — il n'y a rien à configurer.",
        ss["uBody"]))
    s.append(Paragraph(
        "La première commande télécharge les dépendances (2 à 5 minutes "
        "selon la connexion). La seconde démarre le serveur — laissez la "
        "fenêtre ouverte tant que vous testez.",
        ss["uBox"]))

    # ═══ 8. STRUCTURE DU CODE ═══
    s.append(Paragraph("8. Structure du code", ss["H1"]))
    s.append(hr())
    s.append(make_table(
        ["Dossier / fichier", "Rôle"],
        [
            ["src/app/(dashboard)/", "Les pages de l'application : admin, "
             "professeur, étudiant, check-in"],
            ["src/app/api/", "Le serveur : sessions, présences, check-in, "
             "emploi du temps, analytiques"],
            ["src/lib/qr/", "Génération et validation des QR codes "
             "rotatifs (HMAC-SHA256)"],
            ["src/lib/geo/validate.ts", "Formule de Haversine — distance "
             "GPS au centre de la salle"],
            ["src/lib/session-status.ts", "Calcul automatique du statut "
             "des séances à partir de l'horloge"],
            ["src/lib/schedule.ts", "Génération des séances à partir des "
             "règles d'emploi du temps"],
            ["prisma/schema.prisma", "Le modèle de données (11 tables "
             "PostgreSQL)"],
            ["prisma/seed.ts", "Script de remplissage de la base de "
             "démonstration"],
        ],
        col_widths=[6 * cm, 9.5 * cm],
        mono_cols=(0,),
    ))
    s.append(Paragraph(
        "<b>Technologies :</b> Next.js 16 · React 19 · TypeScript · "
        "Prisma 6 · PostgreSQL (Neon) · NextAuth · Tailwind CSS — "
        "déployé sur Vercel, le tout open-source et gratuit.",
        ss["uBody"]))

    s.append(Spacer(1, 0.8 * cm))
    final = Table([[Paragraph(
        f"<b>Équipe :</b> {TEAM}<br/>"
        "<b>Module :</b> Recherche Opérationnelle — "
        "Pr Ahmed El Hilali Alaoui · EIDIA, UEMF · 2025–2026",
        ss["uBody"])]], colWidths=[15.5 * cm])
    final.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
        ("LINEBEFORE", (0, 0), (0, -1), 3, GOLD),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
    ]))
    s.append(final)

    doc.build(s, onFirstPage=add_page_decorations,
              onLaterPages=add_page_decorations)
    print(f"Description generated: {out}")
    return out


if __name__ == "__main__":
    build()
