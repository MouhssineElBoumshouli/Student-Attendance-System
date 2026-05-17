#!/usr/bin/env python3
"""
UEMF Présence — rapport de Recherche Opérationnelle.

Génère un PDF A4 complet, conçu pour être lu de bout en bout par un
lecteur qui découvre le projet (et qui n'est pas forcément développeur).
Chaque concept technique est expliqué avant d'être utilisé.

Génération :
    python3 report/generate_report.py

Sortie :
    report/UEMF_Presence_Rapport_RO.pdf
"""

import os

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    HRFlowable, KeepTogether,
)

# --- Palette (cohérente avec la page HTML de présentation) ------------------
INK = HexColor("#0d0d0d")
PAPER = HexColor("#f5f0e8")
ACCENT = HexColor("#c0392b")
ACCENT2 = HexColor("#2c3e7a")
GOLD = HexColor("#d4a017")
GREEN = HexColor("#27ae60")
MUTED = HexColor("#7a7065")
CARD_BG = HexColor("#faf6ee")
BORDER = HexColor("#d0c8b8")
CODE_BG = HexColor("#1a1a2e")
CODE_FG = HexColor("#7fd1b9")
LIGHT_BLUE = HexColor("#eef3fa")
LIGHT_GREEN = HexColor("#ecf7ec")
LIGHT_GOLD = HexColor("#fff7e6")
LIGHT_RED = HexColor("#fdecea")

# --- Styles -----------------------------------------------------------------
ss = getSampleStyleSheet()

ss.add(ParagraphStyle(name="CoverTitle", fontName="Helvetica-Bold",
                      fontSize=32, leading=38, textColor=INK,
                      alignment=TA_CENTER, spaceAfter=4))
ss.add(ParagraphStyle(name="CoverSubtitle", fontName="Helvetica",
                      fontSize=14, leading=20, textColor=MUTED,
                      alignment=TA_CENTER, spaceAfter=4))
ss.add(ParagraphStyle(name="CoverBadge", fontName="Helvetica-Bold",
                      fontSize=9, leading=12, textColor=white,
                      alignment=TA_CENTER, backColor=ACCENT,
                      borderPadding=(4, 8, 4, 8)))

ss.add(ParagraphStyle(name="H1", fontName="Helvetica-Bold",
                      fontSize=20, leading=26, textColor=INK,
                      spaceBefore=18, spaceAfter=10))
ss.add(ParagraphStyle(name="H2", fontName="Helvetica-Bold",
                      fontSize=14, leading=20, textColor=ACCENT2,
                      spaceBefore=14, spaceAfter=6))
ss.add(ParagraphStyle(name="H3", fontName="Helvetica-Bold",
                      fontSize=11, leading=15, textColor=ACCENT,
                      spaceBefore=10, spaceAfter=4))

ss.add(ParagraphStyle(name="uBody", fontName="Helvetica",
                      fontSize=10, leading=15, textColor=INK,
                      alignment=TA_JUSTIFY, spaceAfter=8))
ss.add(ParagraphStyle(name="uBodyMuted", parent=ss["uBody"],
                      textColor=MUTED))
ss.add(ParagraphStyle(name="uBullet", fontName="Helvetica",
                      fontSize=10, leading=15, textColor=INK,
                      leftIndent=18, bulletIndent=6, spaceAfter=4))

ss.add(ParagraphStyle(name="uCallout", fontName="Helvetica",
                      fontSize=9.5, leading=14, textColor=INK,
                      leftIndent=8, rightIndent=8,
                      borderPadding=(8, 10, 8, 10), spaceBefore=4,
                      spaceAfter=10))
ss.add(ParagraphStyle(name="uCalloutLabel", fontName="Helvetica-Bold",
                      fontSize=8, leading=10, textColor=ACCENT2,
                      spaceAfter=4))

ss.add(ParagraphStyle(name="uCode", fontName="Courier",
                      fontSize=8.5, leading=12.5, textColor=CODE_FG,
                      backColor=CODE_BG, leftIndent=10, rightIndent=10,
                      borderPadding=(8, 10, 8, 10), spaceBefore=6,
                      spaceAfter=10))
ss.add(ParagraphStyle(name="Formula", fontName="Courier-Bold",
                      fontSize=10, leading=15, textColor=ACCENT2,
                      alignment=TA_CENTER,
                      backColor=LIGHT_BLUE,
                      borderPadding=(8, 10, 8, 10),
                      spaceBefore=6, spaceAfter=10))

ss.add(ParagraphStyle(name="Caption", fontName="Helvetica-Oblique",
                      fontSize=8.5, leading=12, textColor=MUTED,
                      alignment=TA_CENTER, spaceAfter=14))

ss.add(ParagraphStyle(name="THeader", fontName="Helvetica-Bold",
                      fontSize=9, leading=12, textColor=white,
                      alignment=TA_LEFT))
ss.add(ParagraphStyle(name="TCell", fontName="Helvetica",
                      fontSize=9, leading=12, textColor=INK,
                      alignment=TA_LEFT))
ss.add(ParagraphStyle(name="TCellSmall", fontName="Helvetica",
                      fontSize=8.5, leading=11, textColor=INK,
                      alignment=TA_LEFT))


# --- Helpers ----------------------------------------------------------------

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=BORDER,
                      spaceBefore=6, spaceAfter=10)


def bullet(text, style="uBullet"):
    return Paragraph(f"<bullet>&bull;</bullet> {text}", ss[style])


def callout(label, body, bg=LIGHT_BLUE, accent=ACCENT2):
    """Boxed callout — definition / why / example / warning."""
    tbl = Table(
        [[Paragraph(label, ParagraphStyle(
            "cl", parent=ss["uCalloutLabel"], textColor=accent))],
         [Paragraph(body, ss["uCallout"])]],
        colWidths=[15.6 * cm],
    )
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (0, 0), 8),
        ("BOTTOMPADDING", (0, 0), (0, 0), 0),
        ("TOPPADDING", (0, 1), (0, 1), 4),
        ("BOTTOMPADDING", (0, 1), (0, 1), 8),
    ]))
    return tbl


def definition(label, body):
    return callout(label, body, bg=LIGHT_BLUE, accent=ACCENT2)


def why(label, body):
    return callout(label, body, bg=LIGHT_GOLD, accent=HexColor("#a0760a"))


def example(label, body):
    return callout(label, body, bg=LIGHT_GREEN, accent=GREEN)


def warn(label, body):
    return callout(label, body, bg=LIGHT_RED, accent=ACCENT)


def code_block(text):
    """Monospace code block, dark background. Preserve whitespace."""
    # Replace spaces with non-breaking spaces and newlines with <br/>
    text_html = (text
                 .replace("&", "&amp;")
                 .replace("<", "&lt;")
                 .replace(">", "&gt;")
                 .replace(" ", "&nbsp;")
                 .replace("\n", "<br/>"))
    return Paragraph(text_html, ss["uCode"])


def formula(text):
    return Paragraph(text, ss["Formula"])


def make_table(headers, rows, col_widths=None, header_color=INK):
    header_row = [Paragraph(h, ss["THeader"]) for h in headers]
    data = [header_row] + [[Paragraph(str(c), ss["TCell"]) for c in row]
                           for row in rows]
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), header_color),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("TOPPADDING", (0, 0), (-1, 0), 7),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, HexColor("#f5f0e8")]),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return t


# --- Header / footer for page templates -------------------------------------

def add_page_decorations(canvas, doc):
    canvas.saveState()
    # Footer
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(
        2.2 * cm, 1.2 * cm,
        "UEMF Présence — Rapport RO — Mouhssine El Boumshouli")
    canvas.drawRightString(
        A4[0] - 2.2 * cm, 1.2 * cm,
        f"p. {doc.page}")
    canvas.restoreState()


# --- Build report -----------------------------------------------------------

def build_report():
    out = os.path.join(os.path.dirname(__file__),
                       "UEMF_Presence_Rapport_RO.pdf")
    doc = SimpleDocTemplate(
        out, pagesize=A4,
        leftMargin=2.2 * cm, rightMargin=2.2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
        title="UEMF Présence — Rapport Recherche Opérationnelle",
        author="Mouhssine El Boumshouli",
    )

    s = []  # the story (list of flowables)

    # ════════════════════════════════════════════════════════════════════════
    # COVER
    # ════════════════════════════════════════════════════════════════════════
    s.append(Spacer(1, 4.5 * cm))
    s.append(Paragraph("MODULE · RECHERCHE OPÉRATIONNELLE", ss["CoverBadge"]))
    s.append(Spacer(1, 1.5 * cm))
    s.append(Paragraph("UEMF Présence", ss["CoverTitle"]))
    s.append(Spacer(1, 0.2 * cm))
    s.append(Paragraph(
        "Système de gestion des présences par QR&nbsp;code rotatif",
        ParagraphStyle("sub1", parent=ss["CoverSubtitle"],
                       fontSize=14, textColor=ACCENT2,
                       fontName="Helvetica-Bold")))
    s.append(Spacer(1, 0.5 * cm))
    s.append(Paragraph(
        "Modélisation d'un problème universitaire en optimisation "
        "combinatoire, puis transformation en application web complète, "
        "sécurisée, déployée en production.",
        ParagraphStyle("sub2", parent=ss["CoverSubtitle"],
                       fontSize=11, leading=15)))

    s.append(Spacer(1, 3 * cm))

    info_rows = [
        ("Réalisé par", "Mouhssine El Boumshouli"),
        ("Encadrant", "Pr Ahmed El Hilali Alaoui (Directeur académique EIDIA)"),
        ("Formation", "EIDIA — UEMF, Semestre 5"),
        ("Année universitaire", "2025–2026"),
        ("Stack", "Next.js 16 · React 19 · TypeScript · "
                  "Prisma 6 · PostgreSQL (Neon)"),
        ("Déploiement", "Vercel — HTTPS automatique"),
        ("Code source", "github.com/MouhssineElBoumshouli/Student-Attendance-System"),
    ]
    info_tbl = Table(
        [[Paragraph(f"<b>{k}</b>", ss["TCell"]),
          Paragraph(v, ss["TCell"])] for k, v in info_rows],
        colWidths=[4.5 * cm, 11 * cm],
    )
    info_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    s.append(info_tbl)
    s.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════════
    # TABLE DES MATIÈRES
    # ════════════════════════════════════════════════════════════════════════
    s.append(Paragraph("Table des matières", ss["H1"]))
    s.append(hr())

    toc = [
        ("§ 1", "Le problème à résoudre"),
        ("§ 2", "Recherche Opérationnelle — rappels"),
        ("§ 3", "Notre solution — vue d'ensemble"),
        ("§ 4", "Formulation en Recherche Opérationnelle"),
        ("§ 5", "Fonction objectif multi-critère"),
        ("§ 6", "Les cinq contraintes du modèle"),
        ("§ 7", "Le mécanisme QR rotatif"),
        ("§ 8", "Quatre couches anti-fraude"),
        ("§ 9", "Stack technique"),
        ("§ 10", "Architecture et flux de données"),
        ("§ 11", "Modèle de données"),
        ("§ 12", "Sécurité API par rôle"),
        ("§ 13", "Cycle de vie d'une séance"),
        ("§ 14", "Bilan et limites assumées"),
        ("§ 15", "Glossaire technique"),
    ]
    toc_tbl = Table(
        [[Paragraph(f"<b>{n}</b>", ss["uBody"]),
          Paragraph(t, ss["uBody"])] for n, t in toc],
        colWidths=[2 * cm, 13.5 * cm],
    )
    toc_tbl.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    s.append(toc_tbl)
    s.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════════
    # § 1 — LE PROBLÈME
    # ════════════════════════════════════════════════════════════════════════
    s.append(Paragraph("§ 1 — Le problème à résoudre", ss["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "À l'Université Euro-Méditerranéenne de Fès, la présence en cours est "
        "saisie manuellement via la plateforme Konosys&nbsp;: le professeur "
        "appelle chaque étudiant par son nom, attend la réponse, puis coche la "
        "liste. Pour une promotion de 30 à 60 étudiants, cela coûte 5 à 15 "
        "minutes de temps de cours, à <b>chaque séance</b>. Et au-delà du temps "
        "perdu, le procédé est fragile&nbsp;: erreurs, oublis, et surtout "
        "<i>aucun</i> mécanisme contre la fraude — un voisin peut répondre "
        "« présent » pour un absent sans que personne ne le remarque.",
        ss["uBody"]))

    s.append(definition(
        "DÉFINITION — PROBLÈME D'OPTIMISATION",
        "En Recherche Opérationnelle, un <b>problème d'optimisation</b> "
        "consiste à trouver, parmi toutes les solutions possibles, celle qui "
        "maximise (ou minimise) une <i>quantité d'intérêt</i> appelée "
        "<b>fonction objectif</b>, sous un ensemble de <b>contraintes</b> à "
        "respecter. Ici, la quantité à maximiser est la fiabilité du système "
        "de présence&nbsp;; les contraintes sont l'identité de l'étudiant, "
        "sa présence physique en salle, et l'intégrité du token QR."))

    s.append(Paragraph("1.1&nbsp;&nbsp;Les quatre pathologies du système actuel", ss["H2"]))
    pathologies_tbl = make_table(
        ["Pathologie", "Description", "Impact"],
        [
            ["Temps perdu",
             "Appel un par un pour 30 à 60 étudiants au début du cours.",
             "5 à 15 min / séance"],
            ["Erreurs humaines",
             "Homonymes, oublis, prénoms mal entendus, coches décalées.",
             "2 à 5 %"],
            ["Fraude triviale",
             "Un étudiant répond « présent » pour un absent.",
             "0 contrôle"],
            ["Données figées",
             "Aucune agrégation, aucune analyse statistique exploitable.",
             "Manuel uniquement"],
        ],
        col_widths=[3.5 * cm, 8.5 * cm, 3.5 * cm],
    )
    s.append(pathologies_tbl)
    s.append(Paragraph("Tableau 1 — Pathologies de la prise de présence manuelle",
                       ss["Caption"]))

    s.append(Paragraph(
        "Ces quatre pathologies ne sont pas indépendantes&nbsp;: elles se "
        "nourrissent les unes les autres. Le temps perdu pousse le professeur "
        "à expédier l'appel, ce qui augmente les erreurs et la fraude, et "
        "l'absence de données empêche de mesurer le problème pour le corriger. "
        "C'est le profil classique d'un <b>problème de processus mal posé</b> "
        "— donc une cible naturelle pour une approche RO.",
        ss["uBody"]))

    s.append(Paragraph("1.2&nbsp;&nbsp;Comparatif ancien processus vs. notre système", ss["H2"]))
    comp_tbl = make_table(
        ["Critère", "Konosys (actuel)", "UEMF Présence (QR)"],
        [
            ["Temps de prise", "5–15 min / séance", "15–30 secondes"],
            ["Méthode", "Appel vocal manuel", "Scan QR rotatif (smartphone)"],
            ["Anti-fraude", "Aucun", "4 couches indépendantes"],
            ["Mise à jour côté prof", "Différée (fin de cours)",
             "~5 sec après le scan"],
            ["Export rapports", "Manuel", "CSV à un clic (RFC 4180)"],
            ["Taux d'erreur de saisie", "2–5 %", "~0 % (automatisé)"],
            ["Coût annuel", "Licence Konosys", "0 € (Vercel + Neon gratuits)"],
        ],
        col_widths=[4.5 * cm, 5.5 * cm, 5.5 * cm],
    )
    s.append(comp_tbl)
    s.append(Paragraph("Tableau 2 — Comparatif des deux processus",
                       ss["Caption"]))

    s.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════════
    # § 2 — RAPPELS RO
    # ════════════════════════════════════════════════════════════════════════
    s.append(Paragraph("§ 2 — Recherche Opérationnelle : rappels", ss["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "Avant d'attaquer notre modèle, un mot sur la discipline elle-même. "
        "La Recherche Opérationnelle (RO) est l'application des méthodes "
        "scientifiques — mathématiques, statistiques, modélisation — à la "
        "<i>prise de décision</i> dans des organisations complexes. Née "
        "pendant la Seconde Guerre mondiale (logistique militaire), elle "
        "équipe aujourd'hui les compagnies aériennes (planification "
        "d'équipages), les hôpitaux (affectation de blocs opératoires), les "
        "transporteurs (tournées de livraison), etc.",
        ss["uBody"]))

    s.append(Paragraph("2.1&nbsp;&nbsp;Les trois ingrédients d'un modèle RO", ss["H2"]))
    s.append(bullet(
        "<b>Variables de décision</b> — les inconnues que l'on cherche à "
        "fixer. Ce sont les leviers sur lesquels on agit."))
    s.append(bullet(
        "<b>Fonction objectif</b> — la quantité scalaire qui mesure la "
        "qualité d'une solution. On cherche à la maximiser ou à la minimiser."))
    s.append(bullet(
        "<b>Contraintes</b> — les conditions que toute solution acceptable "
        "doit satisfaire."))

    s.append(definition(
        "DÉFINITION — OPTIMISATION COMBINATOIRE",
        "Famille de problèmes RO où les variables de décision prennent "
        "leurs valeurs dans un ensemble <i>fini et discret</i> (souvent "
        "{0, 1}). Exemples classiques&nbsp;: le voyageur de commerce, "
        "l'affectation, le sac à dos. Par opposition à l'<i>optimisation "
        "continue</i> (programmation linéaire, non linéaire), où les "
        "variables prennent des valeurs réelles."))

    s.append(Paragraph("2.2&nbsp;&nbsp;Pourquoi notre problème est combinatoire", ss["H2"]))
    s.append(Paragraph(
        "Pour chaque couple (étudiant, séance), une seule question binaire&nbsp;: "
        "<i>cet étudiant était-il présent à cette séance&nbsp;?</i> La réponse "
        "est dans {0, 1}. Avec 201 étudiants et, disons, 100 séances par "
        "semestre, cela fait <b>20 100 variables binaires</b> à fixer — "
        "chacune contrainte par les règles d'identité (la personne qui scanne "
        "est bien l'étudiant) et de présence physique (il était bien en salle).",
        ss["uBody"]))

    s.append(why(
        "POURQUOI MULTI-OBJECTIF ?",
        "Réduire le temps d'appel est <i>un</i> objectif&nbsp;; vérifier "
        "que chaque scan est authentique en est <i>un autre</i>&nbsp;; et "
        "garder un taux de couverture élevé (peu d'étudiants oubliés) en "
        "est <i>un troisième</i>. Ces trois objectifs sont en partie en "
        "concurrence&nbsp;: ajouter des vérifications (GPS, fingerprint) "
        "ralentit le scan&nbsp;; supprimer les vérifications accélère mais "
        "ouvre la porte à la fraude. La RO multi-critère est l'outil "
        "approprié pour <i>pondérer</i> ces compromis."))

    s.append(Paragraph("2.3&nbsp;&nbsp;La méthode de scalarisation pondérée", ss["H2"]))
    s.append(Paragraph(
        "Quand on a plusieurs objectifs Z₁, Z₂, Z₃, on les combine en un "
        "objectif unique Z par une <b>somme pondérée convexe</b>&nbsp;:",
        ss["uBody"]))
    s.append(formula(
        "Z = α · Z₁ + β · Z₂ + γ · Z₃ ,&nbsp;&nbsp; "
        "avec α + β + γ = 1 ,&nbsp;&nbsp; α, β, γ ≥ 0"))
    s.append(Paragraph(
        "Les coefficients α, β, γ représentent l'<i>importance relative</i> "
        "que le décideur accorde à chaque objectif. Faire varier ces poids "
        "et observer comment la solution optimale change, c'est le cœur de "
        "l'<b>analyse de sensibilité</b> — un classique en RO.",
        ss["uBody"]))

    s.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════════
    # § 3 — SOLUTION
    # ════════════════════════════════════════════════════════════════════════
    s.append(Paragraph("§ 3 — Notre solution en bref", ss["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "Une application web déployée sur Vercel, accessible depuis n'importe "
        "quel navigateur — ordinateur du professeur pour afficher le QR en "
        "classe, smartphone de l'étudiant pour scanner. Trois rôles "
        "distincts, chacun avec son tableau de bord et ses permissions, "
        "vérifiées <i>côté serveur</i> à chaque requête.",
        ss["uBody"]))

    s.append(Paragraph("3.1&nbsp;&nbsp;Les trois rôles", ss["H2"]))
    roles_tbl = make_table(
        ["Rôle", "Capacités"],
        [
            ["Administrateur",
             "Gestion complète&nbsp;: départements, filières, groupes, "
             "salles (avec coordonnées GPS), professeurs, étudiants, cours, "
             "analytiques globales."],
            ["Professeur",
             "Voir ses cours, planifier des séances, activer une séance "
             "(génère le QR rotatif), suivre les scans en temps quasi-réel, "
             "corriger manuellement, exporter le rapport CSV."],
            ["Étudiant",
             "Scanner le QR affiché en classe via la caméra, consulter son "
             "historique et son taux de présence par cours."],
        ],
        col_widths=[3.5 * cm, 12 * cm],
    )
    s.append(roles_tbl)
    s.append(Paragraph("Tableau 3 — Capacités par rôle", ss["Caption"]))

    s.append(Paragraph("3.2&nbsp;&nbsp;Le flux principal en sept étapes", ss["H2"]))
    flow_steps = [
        "Le <b>professeur</b> ouvre son tableau de bord et clique « Activer » "
        "sur la séance prévue.",
        "Le <b>serveur</b> tire un secret cryptographique aléatoire de 32 "
        "octets, le stocke en base, et pré-crée une ligne <i>ABSENT</i> pour "
        "chaque étudiant des groupes du cours.",
        "Le <b>professeur</b> affiche la page QR plein écran. Le QR change "
        "toutes les 10 secondes, calculé à partir du secret.",
        "Chaque <b>étudiant</b> ouvre la page « Scanner » sur son téléphone, "
        "autorise la caméra et le GPS.",
        "Le téléphone <b>décode le QR</b> et envoie au serveur le token, la "
        "position GPS, et une empreinte de l'appareil.",
        "Le <b>serveur</b> vérifie l'authentification, la validité du token "
        "(HMAC), la distance à la salle (Haversine), l'unicité de l'appareil, "
        "puis bascule la ligne <i>ABSENT</i> en <i>PRESENT</i> (ou <i>LATE</i> "
        "si &gt; 15 min).",
        "Le <b>tableau de bord du professeur</b> se met à jour automatiquement "
        "(~5 sec) et affiche le nouveau présent.",
    ]
    for i, step in enumerate(flow_steps, 1):
        s.append(Paragraph(f"<b>{i}.</b>&nbsp;&nbsp;{step}", ss["uBody"]))

    s.append(example(
        "EN PRATIQUE — LA PROMOTION 2025–2026",
        "<b>201 étudiants</b> EIDIA répartis en 8 groupes (4 en Génie "
        "Informatique, 4 en IA et Science des Données), <b>4 professeurs</b> "
        "dont le Pr Ahmed El Hilali Alaoui en Recherche Opérationnelle, "
        "<b>4 cours</b> et <b>4 salles</b> géolocalisées sur le campus UEMF "
        "de Fès. Toutes ces données sont chargées dans la base de production "
        "via un script de seed reproductible (<font face='Courier' "
        "size='8'>prisma/seed.ts</font>)."))

    s.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════════
    # § 4 — MODÉLISATION
    # ════════════════════════════════════════════════════════════════════════
    s.append(Paragraph("§ 4 — Formulation en Recherche Opérationnelle", ss["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "On modélise le problème comme une <b>optimisation combinatoire à "
        "variables binaires sous contraintes</b>. La formulation suit la "
        "structure standard RO en trois étapes&nbsp;: (1) définir les "
        "ensembles, (2) définir les variables de décision, (3) définir "
        "l'objectif et les contraintes (§5 et §6).",
        ss["uBody"]))

    s.append(Paragraph("4.1&nbsp;&nbsp;Les ensembles", ss["H2"]))
    s.append(Paragraph(
        "Un <i>ensemble</i>, en RO, est simplement une liste finie "
        "d'éléments sur lesquels on va indicer nos variables.",
        ss["uBody"]))

    s.append(code_block(
        "-- Ensembles fondamentaux --\n"
        "S = { s₁, s₂, …, sₙ }     // séances planifiées (cours)\n"
        "E = { e₁, e₂, …, eₘ }     // étudiants inscrits\n"
        "T = { t₀, t₁, …, tₖ }     // fenêtres de rotation du QR (Δ = 10 s)\n"
        "R = { r₁, r₂, …, rₚ }     // salles, avec (lat, lon, rayon)\n"
        "G = { g₁, g₂, …, g₈ }     // groupes (par filière, semestre)\n\n"
        "-- Application à notre cas concret --\n"
        "|E| = 201      // étudiants EIDIA S5\n"
        "|G| = 8        // 4 GI + 4 IASD\n"
        "|R| = 4        // Amphi A, Amphi B, Salle 204, Labo Info 1\n"
        "Δ  = 10 s     // fenêtre de validité d'un QR"
    ))

    s.append(Paragraph("4.2&nbsp;&nbsp;Les variables de décision", ss["H2"]))
    s.append(Paragraph(
        "Une <b>variable de décision</b> représente une grandeur que le "
        "système va calculer. Dans notre modèle, elles sont presque toutes "
        "<i>binaires</i> ({0, 1}) — c'est ce qui rend le problème "
        "combinatoire.",
        ss["uBody"]))

    var_tbl = make_table(
        ["Variable", "Domaine", "Signification"],
        [
            ["x<sub>ij</sub>", "{0, 1}",
             "= 1 si l'étudiant e<sub>i</sub> est marqué présent à la séance s<sub>j</sub>"],
            ["ℓ<sub>ij</sub>", "{0, 1}",
             "= 1 si e<sub>i</sub> est arrivé en retard à s<sub>j</sub> (Δt &gt; 15 min)"],
            ["v<sub>ij</sub>", "{0, 1}",
             "= 1 si la présence est vérifiée (GPS dans le rayon ET appareil unique)"],
            ["q<sub>jk</sub>", "hex (8)",
             "token HMAC affiché par s<sub>j</sub> pendant la fenêtre t<sub>k</sub>"],
            ["d<sub>ij</sub>", "R<super>+</super>",
             "distance GPS (m) entre e<sub>i</sub> et la salle de s<sub>j</sub> — Haversine"],
            ["Δt<sub>ij</sub>", "R<super>+</super>",
             "délai d'arrivée de e<sub>i</sub> après le début de s<sub>j</sub> (min)"],
            ["f<sub>ij</sub>", "SHA-256",
             "empreinte de l'appareil utilisé par e<sub>i</sub> pour scanner s<sub>j</sub>"],
        ],
        col_widths=[2 * cm, 2.5 * cm, 11 * cm],
    )
    s.append(var_tbl)
    s.append(Paragraph("Tableau 4 — Variables de décision du modèle",
                       ss["Caption"]))

    s.append(why(
        "POURQUOI DES VARIABLES BINAIRES PLUTÔT QUE CONTINUES ?",
        "Un étudiant est <i>soit</i> présent <i>soit</i> absent — il "
        "n'existe pas de présence « à 73 % ». De même, un token est "
        "valide ou ne l'est pas, un appareil est dans le rayon ou ne l'est "
        "pas. La nature discrète de la décision se reflète dans la nature "
        "binaire des variables. La conséquence est que le problème est "
        "combinatoire et non continu."))

    s.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════════
    # § 5 — FONCTION OBJECTIF
    # ════════════════════════════════════════════════════════════════════════
    s.append(Paragraph("§ 5 — Fonction objectif multi-critère", ss["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "Notre système poursuit trois objectifs simultanés. On les combine via "
        "une somme pondérée convexe pour obtenir un critère unique Z à "
        "maximiser. C'est la <b>méthode de scalarisation</b>, l'approche la "
        "plus classique pour transformer un problème multi-objectif en "
        "problème mono-objectif équivalent.",
        ss["uBody"]))

    s.append(Paragraph("5.1&nbsp;&nbsp;Les trois sous-objectifs", ss["H2"]))
    s.append(bullet(
        "<b>Z₁ — Couverture automatique.</b> La part d'étudiants dont la "
        "présence est saisie sans aucune intervention du professeur."))
    s.append(bullet(
        "<b>Z₂ — Vérification.</b> La part des présences automatiques qui "
        "passent <i>toutes</i> les vérifications (GPS dans le rayon + "
        "appareil unique)."))
    s.append(bullet(
        "<b>Z₃ — Efficacité temporelle.</b> Le gain de temps par rapport à "
        "l'appel manuel."))

    s.append(Paragraph("5.2&nbsp;&nbsp;Forme analytique de Z", ss["H2"]))
    s.append(formula(
        "Maximiser&nbsp; Z = α · Z₁ + β · Z₂ + γ · Z₃ ,&nbsp;&nbsp; "
        "α + β + γ = 1 ,&nbsp;&nbsp; (α=0,4, β=0,3, γ=0,3 par défaut)"))

    s.append(code_block(
        "-- Z₁ : taux de couverture automatique --\n"
        "Z₁ = (1 / |S|) · Σⱼ [ (Σᵢ xᵢⱼ) / |Eⱼ| ]\n"
        "     pour chaque séance, on calcule la fraction d'étudiants présents,\n"
        "     puis on moyenne sur l'ensemble des séances\n\n"
        "-- Z₂ : taux de présences vérifiées (GPS + appareil unique) --\n"
        "Z₂ = (Σᵢ,ⱼ vᵢⱼ) / max(1, Σᵢ,ⱼ xᵢⱼ)\n"
        "     part des scans présents qui ont passé toutes les vérifications\n\n"
        "-- Z₃ : efficacité temporelle --\n"
        "Z₃ = 1 − (T_QR / T_manuel)\n"
        "     avec T_QR ≈ 25 s et T_manuel ≈ 600 s → Z₃ ≈ 0,958"
    ))

    s.append(example(
        "EXEMPLE CHIFFRÉ SUR UNE SÉANCE TYPE",
        "Sur un cours de 50 étudiants, supposons que 48 scannent avec "
        "succès et qu'aucun ne soit retardataire&nbsp;: "
        "<b>Z₁ = 48/50 = 0,96</b>. Si 45 de ces 48 ont aussi un GPS "
        "valide et un appareil unique&nbsp;: <b>Z₂ = 45/48 ≈ 0,938</b>. "
        "Le temps total a été d'environ 25 s contre 8 min en appel "
        "manuel&nbsp;: <b>Z₃ = 1 − 25/480 ≈ 0,948</b>. Avec α=0,4, β=0,3, "
        "γ=0,3&nbsp;: <b>Z ≈ 0,950</b>. Soit une fiabilité globale "
        "estimée de 95,0 %."))

    s.append(Paragraph("5.3&nbsp;&nbsp;Analyse de sensibilité aux poids", ss["H2"]))
    sens_tbl = make_table(
        ["α", "β", "γ", "Priorité", "Z estimé"],
        [
            ["0,40", "0,30", "0,30", "Équilibrée (défaut)", "0,937"],
            ["0,60", "0,20", "0,20", "Privilégie la couverture", "0,943"],
            ["0,20", "0,60", "0,20", "Privilégie la vérification", "0,931"],
            ["0,20", "0,20", "0,60", "Privilégie la rapidité", "0,945"],
        ],
        col_widths=[1.6 * cm, 1.6 * cm, 1.6 * cm, 7 * cm, 3.6 * cm],
    )
    s.append(sens_tbl)
    s.append(Paragraph(
        "Tableau 5 — Sensibilité de Z aux poids (Z₁=0,95 ; Z₂=0,90 ; Z₃=0,958)",
        ss["Caption"]))
    s.append(Paragraph(
        "Les valeurs Z₁, Z₂, Z₃ utilisées ci-dessus sont des "
        "<i>estimations cibles</i>. Elles seront recalibrées à partir des "
        "données réelles après une période d'usage en production.",
        ss["uBodyMuted"]))

    s.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════════
    # § 6 — CONTRAINTES
    # ════════════════════════════════════════════════════════════════════════
    s.append(Paragraph("§ 6 — Les cinq contraintes du modèle", ss["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "Chaque contrainte mathématique du modèle est traduite en mécanisme "
        "<i>vérifiable</i> côté serveur — c'est le pont direct entre la "
        "formalisation RO et le code. Si une contrainte n'est pas respectée, "
        "le scan est refusé ou marqué non-vérifié.",
        ss["uBody"]))

    s.append(definition(
        "DÉFINITION — CONTRAINTE",
        "Condition que toute solution acceptable doit satisfaire. Une "
        "contrainte peut être&nbsp;: (a) une <i>égalité</i>, (b) une "
        "<i>inégalité</i>, ou (c) une <i>contrainte logique</i> reliant "
        "plusieurs variables. La région de l'espace des décisions qui "
        "satisfait toutes les contraintes est dite <b>réalisable</b>."))

    # --- C1 ---
    s.append(Paragraph("6.1&nbsp;&nbsp;C1 — Unicité de la présence", ss["H2"]))
    s.append(Paragraph(
        "Un étudiant ne peut être marqué qu'une seule fois par séance. Si le "
        "même étudiant scanne deux fois, la seconde tentative est rejetée par "
        "la base de données <i>avant</i> même d'atteindre le code applicatif.",
        ss["uBody"]))
    s.append(formula("x<sub>ij</sub> + ℓ<sub>ij</sub> ≤ 1 ,&nbsp;&nbsp; ∀ i ∈ E, ∀ j ∈ S"))
    s.append(Paragraph(
        "<b>Implémentation&nbsp;:</b> contrainte SQL <font face='Courier' "
        "size='8'>UNIQUE(sessionId, studentId)</font> sur la table "
        "<font face='Courier' size='8'>attendances</font>. PostgreSQL "
        "refuse l'insertion en violation de cette contrainte avec le "
        "code d'erreur <font face='Courier' size='8'>P2002</font>.",
        ss["uBody"]))

    # --- C2 ---
    s.append(Paragraph("6.2&nbsp;&nbsp;C2 — Contraintes temporelles", ss["H2"]))
    s.append(Paragraph(
        "Un token QR n'est cryptographiquement valide que pendant sa fenêtre "
        "de 10 secondes. Pour gérer les scans à cheval sur la limite, on "
        "accepte aussi la fenêtre <i>précédente</i> (tolérance d'un cran). "
        "Un scan arrivant plus de 15 minutes après le début programmé "
        "bascule l'étudiant en statut <i>EN RETARD</i>.",
        ss["uBody"]))
    s.append(formula(
        "q<sub>jk</sub> valide ⟺ ⌊t<sub>scan</sub> / Δ⌋ ∈ { k<sub>k</sub>, "
        "k<sub>k</sub> − 1 }<br/>Δt<sub>ij</sub> &gt; 15 min ⟹ "
        "ℓ<sub>ij</sub> = 1"))
    s.append(Paragraph(
        "<b>Implémentation&nbsp;:</b> le serveur recalcule le HMAC pour la "
        "fenêtre courante <i>et</i> la précédente, et compare en temps "
        "constant via <font face='Courier' size='8'>crypto."
        "timingSafeEqual</font>. La tolérance d'horloge client-serveur "
        "est plafonnée à ±60 secondes.",
        ss["uBody"]))

    # --- C3 ---
    s.append(Paragraph("6.3&nbsp;&nbsp;C3 — Contrainte géographique (Haversine)", ss["H2"]))
    s.append(Paragraph(
        "L'étudiant doit se trouver à l'intérieur d'un rayon configurable "
        "autour des coordonnées GPS de la salle. La distance est calculée "
        "par la <b>formule de Haversine</b>, qui donne la longueur du plus "
        "court arc géodésique sur une sphère.",
        ss["uBody"]))
    s.append(formula(
        "a = sin²((φ₂ − φ₁) / 2) + cos(φ₁) · cos(φ₂) · "
        "sin²((λ₂ − λ₁) / 2)<br/>"
        "d<sub>ij</sub> = 2R · arcsin(√a) ,&nbsp;&nbsp; R = 6 371 km<br/>"
        "v<sub>ij</sub> = 1 ⟺ d<sub>ij</sub> ≤ R<sub>salle</sub> ∧ (autres "
        "conditions de C5)"))
    s.append(Paragraph(
        "<b>Pourquoi Haversine et pas Pythagore&nbsp;?</b> Pythagore suppose "
        "un plan euclidien — faux à l'échelle de la Terre. À l'échelle d'un "
        "campus, l'erreur serait négligeable, mais Haversine est tout aussi "
        "simple à coder et correct par construction.",
        ss["uBody"]))
    s.append(Paragraph(
        "<b>Rayons configurés par salle&nbsp;:</b> Amphi A &amp; B = 150 m "
        "(grands amphis, GPS moins précis en intérieur), Salle 204 = 80 m, "
        "Labo Info = 60 m (petite pièce).",
        ss["uBody"]))

    s.append(PageBreak())

    # --- C4 ---
    s.append(Paragraph("6.4&nbsp;&nbsp;C4 — Contrainte cryptographique (HMAC-SHA256)", ss["H2"]))
    s.append(Paragraph(
        "Les tokens sont générés par <b>HMAC-SHA256</b>, schéma inspiré du "
        "protocole TOTP (RFC 6238 — celui qui équipe Google Authenticator). "
        "La clé secrète <i>secret<sub>j</sub></i> est tirée aléatoirement "
        "(32 octets via <font face='Courier' size='8'>crypto.randomBytes"
        "</font>) au moment de l'activation de la séance. Elle reste en "
        "base, jamais transmise au navigateur.",
        ss["uBody"]))
    s.append(formula(
        "q<sub>jk</sub> = HMAC-SHA256(secret<sub>j</sub>, k)[0..7] ,&nbsp;&nbsp; "
        "(8 hex ⇒ 32 bits utiles)<br/>"
        "P(deviner q<sub>jk</sub>) = 1 / 2³² ≈ 2,3 × 10<sup>−10</sup>"))
    s.append(Paragraph(
        "<b>Sécurité&nbsp;:</b> sans le secret, deviner le token sortant "
        "revient à un brute-force sur l'espace de sortie (~4,3 milliards "
        "d'essais). Même à 10 000 requêtes/seconde (déjà bloqué côté "
        "serveur), il faudrait des jours pour deviner un seul token — qui "
        "aurait expiré 10 s plus tard de toute façon.",
        ss["uBody"]))

    # --- C5 ---
    s.append(Paragraph("6.5&nbsp;&nbsp;C5 — Empreinte d'appareil unique", ss["H2"]))
    s.append(Paragraph(
        "Un même appareil physique ne peut pas valider deux étudiants "
        "différents pour la même séance. La détection se fait par <b>"
        "empreinte SHA-256 de (UserAgent + résolution écran + langue)</b>. "
        "Si deux scans présentent la même empreinte dans la même séance, "
        "les <i>deux</i> présences passent en « non vérifiée » — le "
        "professeur tranche manuellement après examen.",
        ss["uBody"]))
    s.append(formula(
        "f<sub>ij</sub> = f<sub>i'j</sub> ∧ i ≠ i' ⟹ v<sub>ij</sub> = 0 "
        "∧ v<sub>i'j</sub> = 0"))
    s.append(warn(
        "LIMITE ASSUMÉE",
        "Deux smartphones de même modèle, même OS, même langue produiront la "
        "<i>même empreinte</i>. C'est donc un mécanisme heuristique qui "
        "décourage la fraude opportuniste, pas une preuve forte. C'est "
        "précisément <i>pour cette raison</i> que la conséquence est « non "
        "vérifiée » (à examiner) et non « refusée »&nbsp;: on ne veut pas "
        "pénaliser deux frères qui ont le même téléphone."))

    s.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════════
    # § 7 — MÉCANISME QR ROTATIF
    # ════════════════════════════════════════════════════════════════════════
    s.append(Paragraph("§ 7 — Le mécanisme QR rotatif", ss["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "C'est la pièce centrale du projet, qui rend la fraude par photo "
        "impossible&nbsp;: <b>le QR change toutes les 10 secondes</b>. Toute "
        "capture d'écran est obsolète avant d'avoir pu être partagée. Le "
        "défi technique a été double&nbsp;: (1) construire un schéma "
        "cryptographique correct pour générer ces tokens, et (2) obtenir un "
        "affichage <i>visuellement stable</i> pendant chaque fenêtre de "
        "10 s — pas de clignotement.",
        ss["uBody"]))

    s.append(definition(
        "DÉFINITION — QR CODE",
        "Un <i>Quick Response code</i> est un code-barres 2D, capable "
        "d'encoder du texte ASCII jusqu'à environ 4 296 caractères. On peut "
        "y embarquer une URL, un JSON, une chaîne signée. Notre QR encode "
        "un JSON minimal&nbsp;: "
        "<font face='Courier' size='8'>{ \"s\": sessionId, \"t\": token, "
        "\"ts\": windowStart }</font>."))

    s.append(Paragraph("7.1&nbsp;&nbsp;Qu'est-ce que HMAC-SHA256&nbsp;?", ss["H2"]))
    s.append(Paragraph(
        "<b>HMAC</b> = <i>Hash-based Message Authentication Code</i>. C'est "
        "un mécanisme cryptographique standardisé qui prend deux entrées — "
        "une <i>clé secrète</i> et un <i>message</i> — et produit une "
        "<i>signature</i> qui prouve simultanément&nbsp;:",
        ss["uBody"]))
    s.append(bullet(
        "L'<b>intégrité</b> du message&nbsp;: il n'a pas été modifié."))
    s.append(bullet(
        "L'<b>authenticité</b>&nbsp;: seul celui qui possède la clé "
        "secrète aurait pu produire cette signature."))
    s.append(Paragraph(
        "<b>SHA-256</b> est la fonction de hachage interne utilisée — elle "
        "produit 256 bits de sortie. HMAC-SHA256 est utilisé partout&nbsp;: "
        "AWS, Stripe, GitHub webhooks, JWT, etc.",
        ss["uBody"]))

    s.append(Paragraph("7.2&nbsp;&nbsp;Comment le token est généré", ss["H2"]))
    s.append(code_block(
        "// À l'activation de la séance, on tire un secret aléatoire de 32 octets\n"
        "secretⱼ = randomBytes(32)              // stocké en base, jamais envoyé\n\n"
        "// À chaque requête /api/sessions/{id}/qr-token\n"
        "now         = floor(Date.now() / 1000) // timestamp courant en s\n"
        "k           = floor(now / 10)          // indice de la fenêtre courante (Δ = 10 s)\n"
        "windowStart = k × 10                   // début de la fenêtre en epoch\n"
        "qⱼₖ         = HMAC-SHA256(secretⱼ, k)[0..7]  // 8 premiers hex\n"
        "expiresAt   = (k + 1) × 10 × 1000      // fin de fenêtre en ms\n\n"
        "// Le payload du QR est stable pendant toute la fenêtre\n"
        "payload = JSON.stringify({ s: sessionId, t: qⱼₖ, ts: windowStart })"
    ))

    s.append(Paragraph("7.3&nbsp;&nbsp;Pourquoi windowStart et non now&nbsp;?", ss["H2"]))
    s.append(Paragraph(
        "Dans la première version, le payload incluait <font face='Courier' "
        "size='8'>ts = now</font>. Conséquence&nbsp;: chaque sondage du "
        "serveur renvoyait un payload <i>différent</i>, même si le token "
        "<font face='Courier' size='8'>t</font> était identique. Le canvas "
        "QR se redessinait à chaque réponse&nbsp;: l'image clignotait "
        "visiblement.",
        ss["uBody"]))

    s.append(warn(
        "LE BUG CORRIGÉ",
        "<b>Symptôme&nbsp;:</b> clignotement du QR toutes les 2 secondes, "
        "désorientant pour les étudiants en train de scanner. "
        "<b>Cause racine&nbsp;:</b> le payload du QR contenait l'horodatage "
        "<i>de la requête</i>, qui change à chaque appel. "
        "<b>Correctif&nbsp;:</b> stocker à la place "
        "<font face='Courier' size='8'>windowStart = k × Δ</font>, "
        "identique pendant toute la fenêtre. Le payload — donc le QR — "
        "devient stable pendant 10 secondes, puis bascule d'un coup à la "
        "fenêtre suivante."))

    s.append(Paragraph("7.4&nbsp;&nbsp;Polling intelligent — un seul fetch par fenêtre", ss["H2"]))
    s.append(Paragraph(
        "Sonder à intervalle fixe est gaspilleur de bande passante et "
        "provoque des micro-décalages d'affichage. Notre approche&nbsp;: "
        "planifier le prochain fetch exactement <b>200 ms après "
        "l'expiration</b> de la fenêtre courante. Le compte à rebours à "
        "l'écran est dérivé continûment de "
        "<font face='Courier' size='8'>expiresAt − Date.now()</font> et "
        "rafraîchi toutes les 200 ms — visuellement fluide.",
        ss["uBody"]))

    s.append(Paragraph("7.5&nbsp;&nbsp;Comment l'étudiant scanne et soumet", ss["H2"]))
    s.append(code_block(
        "Smartphone étudiant          API /attendance              PostgreSQL\n"
        "\n"
        "  caméra → jsQR                 |                            |\n"
        "  décode payload                |                            |\n"
        "  + GPS (navigator.geolocation) |                            |\n"
        "  + fingerprint                 |                            |\n"
        "                                |                            |\n"
        "  POST { token, ts, lat, lon, deviceInfo }                    |\n"
        " ------------------------------->                            |\n"
        "                                |  1. requireApiRole(STUDENT)|\n"
        "                                |  2. studentId ← session JWT|  ← pas du body !\n"
        "                                |  3. recalc HMAC(secret, k) |\n"
        "                                |     timingSafeEqual        |\n"
        "                                |  4. Haversine(stu, salle)  |\n"
        "                                |  5. SHA-256(deviceInfo)    |\n"
        "                                |  6. statut = retard ?      |\n"
        "                                | ---- UPDATE attendance --->|\n"
        " <- { status, verified, distance }                           |"
    ))

    s.append(example(
        "POURQUOI studentId VIENT DU JWT, PAS DU BODY ?",
        "Sans cette protection, un étudiant malin pourrait ouvrir la console "
        "de son navigateur et envoyer une requête POST en spécifiant l'ID "
        "d'un absent. Notre serveur ignore complètement le "
        "<font face='Courier' size='8'>studentId</font> envoyé dans le corps "
        "de la requête — il le lit depuis le token JWT signé qui prouve "
        "l'identité de l'utilisateur connecté. C'est la <b>seule</b> "
        "garantie qu'un scan ne peut marquer présent que la personne "
        "réellement connectée."))

    s.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════════
    # § 8 — ANTI-FRAUDE
    # ════════════════════════════════════════════════════════════════════════
    s.append(Paragraph("§ 8 — Quatre couches anti-fraude", ss["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "Les contraintes C2 à C5 du modèle se traduisent en quatre couches "
        "de défense techniques, <i>indépendantes</i> les unes des autres. "
        "C'est le principe de <b>défense en profondeur</b>&nbsp;: même si "
        "une couche tombe (par exemple, l'étudiant a refusé la "
        "géolocalisation), les autres restent actives et limitent l'impact.",
        ss["uBody"]))

    s.append(definition(
        "DÉFINITION — DÉFENSE EN PROFONDEUR",
        "Stratégie de sécurité héritée du domaine militaire&nbsp;: plutôt "
        "qu'un mur unique, on superpose plusieurs lignes de défense de "
        "natures différentes. Un attaquant qui contourne l'une est arrêté "
        "par la suivante."))

    layers_tbl = make_table(
        ["#", "Couche", "Bloque"],
        [
            ["1", "<b>Rotation des tokens (10 s)</b> — nouveau token HMAC-SHA256 "
                 "toutes les 10 secondes. Le token change avant qu'une photo ne "
                 "puisse circuler.",
             "capture d'écran partagée"],
            ["2", "<b>Géofence GPS (Haversine)</b> — distance au centre de la "
                 "salle calculée à la réception. Hors rayon → présence marquée "
                 "non vérifiée.",
             "scan à distance, visio"],
            ["3", "<b>Empreinte d'appareil</b> — SHA-256 de (UserAgent + "
                 "résolution + langue), comparée aux autres présences de la "
                 "séance.",
             "un téléphone pour deux comptes"],
            ["4", "<b>Comparaison à temps constant</b> — "
                 "<font face='Courier' size='8'>crypto.timingSafeEqual</font>, "
                 "durée indépendante du préfixe correct.",
             "timing attack"],
        ],
        col_widths=[0.8 * cm, 11.2 * cm, 3.5 * cm],
    )
    s.append(layers_tbl)
    s.append(Paragraph("Tableau 6 — Les quatre couches", ss["Caption"]))

    s.append(Paragraph("8.1&nbsp;&nbsp;Scénarios concrets et réponses du système", ss["H2"]))
    scenarios = [
        ("Photo du QR transmise à un absent",
         "L'étudiant prend une photo de l'écran et l'envoie à un ami resté chez lui.",
         "Le QR change toutes les 10 s — la photo est expirée avant que le message n'arrive (C2)."),
        ("Scan en visioconférence depuis l'extérieur",
         "L'ami absent ouvre un appel vidéo et scanne l'écran via la caméra distante.",
         "Le GPS du téléphone scanneur est à plusieurs centaines de mètres → v = 0 (C3)."),
        ("Un seul téléphone, deux comptes",
         "L'étudiant scanne avec son compte, se déconnecte, se reconnecte avec le compte d'un ami, rescanne.",
         "Empreinte identique détectée → les deux présences passent en non vérifiée (C5)."),
        ("Bypass direct de l'API (sans caméra)",
         "L'étudiant ouvre la console du navigateur et envoie un POST avec le studentId d'un absent.",
         "Le serveur ignore le studentId du body et lit l'identité depuis le JWT signé."),
        ("Brute-force du token via le réseau",
         "Un script essaie des millions de tokens hex aléatoires.",
         "2³² ≈ 4,3 milliards de possibilités × fenêtre de 10 s → impossible dans le délai (C4)."),
        ("Manipulation de l'horloge du téléphone",
         "L'étudiant change l'horloge pour faire valider un vieux token capturé hier.",
         "La fenêtre est calculée côté serveur ; tolérance ±60 s seulement."),
    ]
    sc_tbl = make_table(
        ["#", "Attaque", "Défense"],
        [[str(i + 1),
          f"<b>{title}</b><br/>{attack}",
          defense]
         for i, (title, attack, defense) in enumerate(scenarios)],
        col_widths=[0.8 * cm, 8 * cm, 6.7 * cm],
    )
    s.append(sc_tbl)
    s.append(Paragraph("Tableau 7 — Six scénarios de fraude testés",
                       ss["Caption"]))

    s.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════════
    # § 9 — STACK
    # ════════════════════════════════════════════════════════════════════════
    s.append(Paragraph("§ 9 — Stack technique", ss["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "Tous les composants sont open-source. Le déploiement et la base de "
        "données sont sur des offres gratuites&nbsp;: coût d'exploitation nul. "
        "Chaque outil est choisi pour une raison précise — pas par effet de "
        "mode.",
        ss["uBody"]))

    stack_tbl = make_table(
        ["Composant", "Outil", "Pourquoi ce choix"],
        [
            ["Framework", "Next.js 16 (App Router)",
             "Réunit frontend et backend dans un seul projet. Déploiement "
             "Vercel sans configuration."],
            ["UI", "React 19",
             "Bibliothèque standard pour interfaces à base de composants. "
             "Mise à jour ciblée de l'écran sans rechargement."],
            ["Langage", "TypeScript",
             "Typage statique&nbsp;: les erreurs de structure sont attrapées "
             "à l'écriture, pas en production."],
            ["Base de données", "PostgreSQL (Neon)",
             "SGBD relationnel ACID, hébergé serverless. Supporte UNIQUE et "
             "index B-tree pour lookups O(log n)."],
            ["ORM", "Prisma 6",
             "Schéma déclaratif unique, migrations versionnées, requêtes "
             "type-safe&nbsp;: élimine les SQL injection au niveau code."],
            ["Auth", "NextAuth + bcrypt",
             "Sessions JWT signées (24 h), mots de passe bcrypt (coût 10), "
             "comparaison à temps constant."],
            ["Validation", "Zod",
             "Schémas runtime de chaque endpoint. Rejet 400 avant toute "
             "requête SQL."],
            ["QR / Scanner", "qrcode + jsQR",
             "Génération canvas côté prof, décodage temps réel via la caméra. "
             "Tout dans le navigateur."],
            ["UI / Styles", "Tailwind v4 + Radix UI",
             "Design system cohérent, primitives accessibles (a11y), "
             "responsive desktop / mobile."],
            ["Déploiement", "Vercel + GitHub",
             "Build et déploiement automatiques à chaque push. HTTPS "
             "automatique (Let's Encrypt)."],
        ],
        col_widths=[2.8 * cm, 4 * cm, 8.7 * cm],
    )
    s.append(stack_tbl)
    s.append(Paragraph("Tableau 8 — Choix techniques justifiés",
                       ss["Caption"]))

    s.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════════
    # § 10 — ARCHITECTURE
    # ════════════════════════════════════════════════════════════════════════
    s.append(Paragraph("§ 10 — Architecture et flux de données", ss["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "Le système suit l'architecture classique <b>client / serveur</b>. "
        "Le navigateur affiche l'interface (le client) et envoie des requêtes "
        "au serveur Next.js, qui interroge la base PostgreSQL hébergée chez "
        "Neon. Tout passe par HTTPS.",
        ss["uBody"]))

    s.append(Paragraph("10.1&nbsp;&nbsp;Vue d'ensemble du système", ss["H2"]))
    s.append(code_block(
        "+--------------------------+         +--------------------------+\n"
        "|  Navigateur prof         |         |  Smartphone étudiant     |\n"
        "|  (Chrome, Firefox…)      |         |  (iOS, Android)          |\n"
        "|  · React UI              |         |  · React UI + caméra     |\n"
        "|  · canvas QR             |         |  · jsQR + GPS            |\n"
        "+----------+---------------+         +------------+-------------+\n"
        "           |                                      |\n"
        "           |  HTTPS / JSON                        |  HTTPS / JSON\n"
        "           v                                      v\n"
        "   +----------------------------------------------------------+\n"
        "   |             Vercel — Next.js 16 (App Router)              |\n"
        "   |                                                          |\n"
        "   |   Pages (RSC)   ·   API routes   ·   Middleware (auth)   |\n"
        "   |                            |                             |\n"
        "   |                            |  Prisma Client (TS)         |\n"
        "   +----------------------------+-----------------------------+\n"
        "                                |  SQL via TCP/TLS\n"
        "                                v\n"
        "                       +------------------+\n"
        "                       |  PostgreSQL      |\n"
        "                       |  (Neon Cloud)    |\n"
        "                       +------------------+"
    ))

    s.append(Paragraph("10.2&nbsp;&nbsp;Anatomie d'une requête HTTP type", ss["H2"]))
    steps = [
        "L'étudiant scanne. Son navigateur compose un <font face='Courier' "
        "size='8'>POST /api/sessions/{id}/attendance</font> avec un corps JSON.",
        "La requête arrive à Vercel via HTTPS. Vercel sert la route Next.js "
        "correspondante.",
        "Le <b>middleware</b> NextAuth vérifie le cookie de session signé. "
        "Si invalide ou expiré → 401.",
        "Le code de la route appelle <font face='Courier' size='8'>"
        "requireApiRole([\"STUDENT\"])</font> qui lit le JWT et vérifie le rôle.",
        "Zod valide le corps&nbsp;: <font face='Courier' size='8'>token</font> "
        "string, <font face='Courier' size='8'>timestamp</font> entier, "
        "lat/lon optionnels.",
        "Prisma exécute des SELECT/UPDATE en SQL, sur Neon, via TLS.",
        "La réponse JSON est renvoyée — le navigateur la lit et met à jour "
        "l'interface.",
    ]
    for i, st in enumerate(steps, 1):
        s.append(Paragraph(f"<b>{i}.</b>&nbsp;&nbsp;{st}", ss["uBody"]))

    s.append(definition(
        "DÉFINITION — JWT (JSON Web Token)",
        "Format standard de token d'authentification. Un JWT contient trois "
        "parties séparées par des points&nbsp;: <font face='Courier' size='8'>"
        "en-tête.payload.signature</font>. Le serveur signe avec un "
        "secret&nbsp;; le navigateur le renvoie à chaque requête dans un "
        "cookie. Le serveur vérifie la signature avant de faire confiance au "
        "contenu."))

    s.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════════
    # § 11 — MODÈLE DE DONNÉES
    # ════════════════════════════════════════════════════════════════════════
    s.append(Paragraph("§ 11 — Modèle de données", ss["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "Le schéma est conçu pour refléter l'organisation pédagogique réelle "
        "de l'EIDIA. Dix entités principales, reliées par des clés "
        "étrangères&nbsp;; tout est normalisé (pas de duplication "
        "d'information). Le fichier source est "
        "<font face='Courier' size='8'>prisma/schema.prisma</font>.",
        ss["uBody"]))

    entities_tbl = make_table(
        ["Entité", "Rôle", "Champs clés"],
        [
            ["User",
             "Compte utilisateur générique (admin, prof, étudiant).",
             "id, email unique, passwordHash, role, firstName, lastName"],
            ["Department",
             "Faculté ou école (EIDIA).",
             "name, code unique"],
            ["Program",
             "Filière d'études (GI, IASD).",
             "name, code unique, departmentId"],
            ["Group",
             "Classe physique (GI-S5-A, GI-S5-B…).",
             "name, programId, semester"],
            ["Professor",
             "Profil enseignant (1-1 avec User).",
             "userId, employeeId, departmentId"],
            ["Student",
             "Profil étudiant (1-1 avec User).",
             "userId, studentId unique, enrollmentYear"],
            ["Room",
             "Salle de cours géolocalisée.",
             "latitude, longitude, radius, capacity"],
            ["Course",
             "Cours d'un semestre, par filière, par prof.",
             "code unique, professorId, programId"],
            ["Session",
             "Séance planifiée d'un cours.",
             "courseId, roomId, date, status, qrSecret, qrRotationSec"],
            ["Attendance",
             "L'enregistrement de présence d'un étudiant à une séance.",
             "UNIQUE(sessionId, studentId), status, scannedAt, verified, "
             "lat/lon, deviceHash"],
        ],
        col_widths=[2.5 * cm, 5.5 * cm, 7.5 * cm],
    )
    s.append(entities_tbl)
    s.append(Paragraph("Tableau 9 — Les dix entités du modèle",
                       ss["Caption"]))

    s.append(Paragraph("11.1&nbsp;&nbsp;Les relations", ss["H2"]))
    s.append(code_block(
        "Department  --1:N->  Program   --1:N->  Group  --N:N->  Student\n"
        "                          |                                  |\n"
        "                          +---1:N->  Course  --N:N->  Group  |\n"
        "                                        |                    |\n"
        "                                        +---1:N->  Session   |\n"
        "                                                       |     |\n"
        "                                                       +-1:N-> Attendance"
    ))

    s.append(Paragraph(
        "Une seconde lecture utile&nbsp;: les <b>contraintes d'intégrité</b> "
        "(clés étrangères + UNIQUE) sont déclarées une fois pour toutes dans "
        "le schéma. Toute tentative d'écriture violant l'intégrité est "
        "rejetée par PostgreSQL <i>avant</i> d'atteindre la moindre ligne de "
        "code applicatif.",
        ss["uBody"]))

    s.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════════
    # § 12 — SÉCURITÉ API
    # ════════════════════════════════════════════════════════════════════════
    s.append(Paragraph("§ 12 — Sécurité API par rôle", ss["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "Chaque endpoint API exige un rôle minimum et, quand pertinent, une "
        "vérification de propriété (le prof ne peut agir que sur ses "
        "propres séances). Le helper <font face='Courier' size='8'>"
        "requireApiRole</font> est appelé en première ligne de chaque route "
        "et renvoie 401 / 403 si la condition n'est pas remplie.",
        ss["uBody"]))

    s.append(definition(
        "AUTHENTIFICATION VS. AUTORISATION",
        "<b>Authentification</b> = prouver qui on est. <b>Autorisation</b> = "
        "prouver qu'on a le droit de faire telle action. Deux niveaux "
        "distincts, à vérifier indépendamment."))

    auth_tbl = make_table(
        ["Endpoint", "Rôle requis", "Vérifications supplémentaires"],
        [
            ["POST /api/sessions", "PROFESSOR, ADMIN",
             "le prof ne peut créer que pour lui-même"],
            ["POST /api/sessions/[id]/activate", "PROFESSOR, ADMIN",
             "séance doit lui appartenir"],
            ["POST /api/sessions/[id]/deactivate", "PROFESSOR, ADMIN",
             "séance doit lui appartenir"],
            ["GET /api/sessions/[id]/qr-token", "PROFESSOR, ADMIN",
             "séance lui appartient — empêche un étudiant de lire le token"],
            ["POST /api/sessions/[id]/attendance", "STUDENT",
             "studentId lu depuis le JWT, jamais du body"],
            ["PATCH /api/sessions/[id]/attendance", "PROFESSOR, ADMIN",
             "vérifie que la présence appartient à cette séance"],
            ["POST/DELETE /api/departments, programs, …", "ADMIN",
             "réservé aux administrateurs"],
        ],
        col_widths=[6 * cm, 3.5 * cm, 6 * cm],
    )
    s.append(auth_tbl)
    s.append(Paragraph("Tableau 10 — Tableau d'autorisation des endpoints",
                       ss["Caption"]))

    s.append(Paragraph("12.1&nbsp;&nbsp;Mesures complémentaires", ss["H2"]))
    s.append(bullet(
        "<b>Hash bcrypt des mots de passe</b> (coût 10). bcrypt est "
        "volontairement coûteux à calculer."))
    s.append(bullet(
        "<b>Messages de login non-distinctifs.</b> « Email ou mot de "
        "passe incorrect » dans tous les cas."))
    s.append(bullet(
        "<b>bcrypt exécuté même si l'email n'existe pas</b> (contre un hash "
        "factice) — supprime la possibilité de distinguer les cas par "
        "<i>timing oracle</i>."))
    s.append(bullet(
        "<b>Validation Zod stricte.</b> Toute requête malformée est rejetée "
        "avec un 400 avant d'atteindre la base."))
    s.append(bullet(
        "<b>HTTPS partout</b> — fourni gratuitement par Vercel."))

    s.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════════
    # § 13 — CYCLE DE VIE
    # ════════════════════════════════════════════════════════════════════════
    s.append(Paragraph("§ 13 — Cycle de vie d'une séance", ss["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "Une séance traverse trois états&nbsp;: <b>SCHEDULED</b> (planifiée, "
        "pas encore commencée), <b>ACTIVE</b> (en cours, QR rotatif diffusé), "
        "<b>COMPLETED</b> (terminée, QR invalidé, rapport disponible). Les "
        "transitions sont déclenchées par le professeur.",
        ss["uBody"]))

    s.append(code_block(
        "SCHEDULED  -- le prof clique « Activer »  ->  ACTIVE\n"
        "    |                                          |\n"
        "    |  • tirage secretⱼ (32 octets aléatoires)  |\n"
        "    |  • createMany ABSENT pour tous les        |\n"
        "    |    étudiants des groupes du cours         |\n"
        "    |  • skipDuplicates → préserve les scans    |\n"
        "    |    existants en cas de réactivation       |\n"
        "    |                                           v\n"
        "    |                              QR rotatif (Δ = 10 s)\n"
        "    |                                           v\n"
        "    |                          les étudiants scannent\n"
        "    |                                           v\n"
        "    |                  le prof clique « Terminer »\n"
        "    |                                           v\n"
        "    v                              COMPLETED\n"
        "(jamais activée)                   |\n"
        "                                   | • qrSecret ← NULL\n"
        "                                   | • Rapport CSV exportable"
    ))

    s.append(Paragraph("13.1&nbsp;&nbsp;SCHEDULED → ACTIVE (activation)", ss["H2"]))
    s.append(Paragraph(
        "Quand le professeur clique « Activer », le serveur&nbsp;:", ss["uBody"]))
    s.append(bullet(
        "Vérifie l'authentification et l'autorisation (rôle PROFESSOR, "
        "propriétaire de la séance)."))
    s.append(bullet(
        "Génère <i>secret<sub>j</sub></i> via <font face='Courier' size='8'>"
        "crypto.randomBytes(32)</font> — 256 bits d'entropie cryptographique."))
    s.append(bullet(
        "Exécute une transaction&nbsp;: <font face='Courier' size='8'>"
        "UPDATE session SET status='ACTIVE', qrSecret=…</font> + "
        "<font face='Courier' size='8'>INSERT INTO attendances</font> en "
        "masse, un ABSENT par étudiant inscrit aux groupes du cours."))
    s.append(bullet(
        "Le <font face='Courier' size='8'>skipDuplicates</font> garantit "
        "qu'une réactivation accidentelle ne supprime pas les présences "
        "déjà scannées."))

    s.append(Paragraph("13.2&nbsp;&nbsp;ACTIVE → COMPLETED (terminaison)", ss["H2"]))
    s.append(Paragraph(
        "Quand le professeur clique « Terminer »&nbsp;:", ss["uBody"]))
    s.append(bullet("Le serveur passe <font face='Courier' size='8'>status</font> à COMPLETED."))
    s.append(bullet(
        "Surtout&nbsp;: il met <font face='Courier' size='8'>qrSecret</font> "
        "à NULL. Tous les tokens déjà émis deviennent invalidables — il n'y "
        "a plus de référence cryptographique avec laquelle les vérifier."))
    s.append(bullet(
        "Le rapport devient disponible dans la section « Rapports »&nbsp;: "
        "liste filtrable, statistiques par cours, export CSV."))

    s.append(example(
        "POURQUOI EFFACER LE SECRET ?",
        "Le secret est <i>la seule donnée</i> qui permet de valider un "
        "token QR. Tant qu'il existe en base, un attaquant qui réussirait "
        "à le copier pourrait théoriquement valider des tokens. En "
        "l'effaçant à la fermeture, on minimise la fenêtre d'attaque&nbsp;: "
        "<b>aucun secret survivant n'est exploitable</b> une fois la séance "
        "close."))

    s.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════════
    # § 14 — BILAN
    # ════════════════════════════════════════════════════════════════════════
    s.append(Paragraph("§ 14 — Bilan et limites assumées", ss["H1"]))
    s.append(hr())

    s.append(Paragraph(
        "Ce projet illustre comment un problème universitaire concret se "
        "laisse <b>entièrement formaliser dans le langage de la Recherche "
        "Opérationnelle</b> — variables binaires de décision, ensembles, "
        "fonction objectif multi-critère pondérée, contraintes mathéma"
        "tiquement explicites — puis se transforme en application web "
        "complète, déployée et utilisable.",
        ss["uBody"]))

    s.append(Paragraph("14.1&nbsp;&nbsp;Indicateurs clés", ss["H2"]))
    kpi_tbl = make_table(
        ["Indicateur", "Valeur"],
        [
            ["Gain de temps par séance (Z₃)", "~96 %"],
            ["Fenêtre de validité d'un token QR", "10 s"],
            ["Couches anti-fraude indépendantes", "4"],
            ["Étudiants EIDIA dans la base", "201"],
            ["Groupes (4 GI + 4 IASD)", "8"],
            ["Cours actifs", "4 (RO, RSE, MFA, GIN)"],
            ["Coût d'exploitation annuel", "0 €"],
        ],
        col_widths=[10 * cm, 5.5 * cm],
    )
    s.append(kpi_tbl)
    s.append(Paragraph("Tableau 11 — Indicateurs clés", ss["Caption"]))

    s.append(Paragraph("14.2&nbsp;&nbsp;Correspondance théorie ↔ implémentation", ss["H2"]))
    mapping_tbl = make_table(
        ["Concept RO", "Implémentation technique"],
        [
            ["Variable binaire x<sub>ij</sub> ∈ {0,1}",
             "colonne <font face='Courier' size='8'>status</font> "
             "(ABSENT / PRESENT / LATE / EXCUSED)"],
            ["Contrainte d'unicité (C1)",
             "contrainte SQL <font face='Courier' size='8'>UNIQUE(sessionId, studentId)</font>"],
            ["Contrainte temporelle (C2)",
             "HMAC-SHA256 avec compteur de fenêtres k = ⌊t / 10⌋"],
            ["Contrainte géographique (C3)",
             "formule de Haversine + Room.radius par salle"],
            ["Contrainte cryptographique (C4)",
             "secret 32 octets&nbsp;; timingSafeEqual à la vérification"],
            ["Contrainte d'appareil (C5)",
             "SHA-256 de (UserAgent + résolution + langue), dédup par séance"],
            ["Fonction objectif multi-critère Z",
             "tableau de bord prof — couverture, taux vérifié, temps"],
            ["Décomposition par séance",
             "indépendance des séances → scalabilité horizontale"],
        ],
        col_widths=[6 * cm, 9.5 * cm],
    )
    s.append(mapping_tbl)
    s.append(Paragraph("Tableau 12 — De la formalisation au code",
                       ss["Caption"]))

    s.append(Paragraph("14.3&nbsp;&nbsp;Limites assumées", ss["H2"]))
    s.append(bullet(
        "Le <b>GPS smartphone</b> a une précision de 5 à 20 m en intérieur "
        "— d'où le statut « non vérifié » plutôt qu'un rejet automatique."))
    s.append(bullet(
        "Le <b>fingerprint d'appareil</b> est heuristique, pas une preuve "
        "forte&nbsp;: deux modèles identiques produisent la même empreinte. "
        "Décourage la fraude opportuniste, pas un attaquant déterminé."))
    s.append(bullet(
        "L'<b>horloge du smartphone</b> est vérifiée côté serveur "
        "(tolérance ±60 s). Au-delà, le scan est rejeté avec message "
        "explicite."))
    s.append(bullet(
        "Le <b>scan exige la caméra</b> — donc HTTPS. En réseau interne "
        "sans HTTPS, la caméra refuse l'accès dans les navigateurs modernes."))

    s.append(Paragraph("14.4&nbsp;&nbsp;Pistes futures", ss["H2"]))
    s.append(bullet(
        "Analyse temporelle de l'assiduité par cours et par étudiant&nbsp;; "
        "détection automatique des décrochages."))
    s.append(bullet(
        "Alertes au professeur quand un étudiant dépasse un seuil "
        "d'absences."))
    s.append(bullet(
        "Export PDF des feuilles de présence en complément du CSV."))
    s.append(bullet(
        "Mode hors-ligne pour les zones à mauvaise couverture réseau "
        "(synchronisation différée)."))
    s.append(bullet(
        "Intégration directe avec Konosys pour synchronisation automatique "
        "des rosters."))

    s.append(PageBreak())

    # ════════════════════════════════════════════════════════════════════════
    # § 15 — GLOSSAIRE
    # ════════════════════════════════════════════════════════════════════════
    s.append(Paragraph("§ 15 — Glossaire technique", ss["H1"]))
    s.append(hr())

    s.append(Paragraph("15.1&nbsp;&nbsp;Recherche Opérationnelle", ss["H2"]))
    glo_ro = [
        ("Variable de décision",
         "Inconnue que le modèle fixe. Ici, x<sub>ij</sub> ∈ {0,1} = présence."),
        ("Fonction objectif",
         "Quantité scalaire à maximiser ou minimiser."),
        ("Contrainte",
         "Condition à respecter. Inégalité, égalité, ou logique."),
        ("Optimisation combinatoire",
         "Optimisation sur un ensemble fini de solutions discrètes."),
        ("Multi-objectif",
         "Plusieurs critères à optimiser. Approche&nbsp;: scalarisation pondérée."),
        ("Analyse de sensibilité",
         "Étude de la variation de la solution optimale en fonction des paramètres."),
    ]
    s.append(make_table(["Terme", "Définition"], glo_ro,
                        col_widths=[4.5 * cm, 11 * cm]))

    s.append(Paragraph("15.2&nbsp;&nbsp;Cryptographie et sécurité", ss["H2"]))
    glo_crypto = [
        ("HMAC-SHA256",
         "Code d'authentification de message basé sur SHA-256. Prouve intégrité + authenticité."),
        ("TOTP (RFC 6238)",
         "Time-based One-Time Password. Schéma qui dérive un mot de passe court d'un secret partagé et du temps. Notre QR rotatif s'en inspire."),
        ("bcrypt",
         "Fonction de hashage de mots de passe volontairement coûteuse, résiste au brute-force."),
        ("JWT",
         "JSON Web Token&nbsp;: format standard de token d'auth signé par le serveur."),
        ("Timing attack",
         "Attaque qui mesure le temps de réponse pour deviner des informations."),
        ("Défense en profondeur",
         "Stratégie qui superpose plusieurs lignes de défense indépendantes."),
        ("Fingerprint",
         "Empreinte numérique d'un appareil dérivée de ses caractéristiques."),
    ]
    s.append(make_table(["Terme", "Définition"], glo_crypto,
                        col_widths=[4.5 * cm, 11 * cm]))

    s.append(Paragraph("15.3&nbsp;&nbsp;Web et développement", ss["H2"]))
    glo_web = [
        ("Frontend",
         "Partie du logiciel qui tourne dans le navigateur de l'utilisateur."),
        ("Backend",
         "Partie qui tourne sur un serveur (API, BDD, logique métier)."),
        ("API REST",
         "Style d'API où chaque ressource a une URL et où l'on agit dessus via GET, POST, PATCH, DELETE."),
        ("SGBD relationnel",
         "Système de gestion de base de données basé sur les tables et relations."),
        ("ACID",
         "Atomicité, Cohérence, Isolation, Durabilité — propriétés des transactions."),
        ("ORM",
         "Object-Relational Mapper&nbsp;: pont entre objets et tables SQL."),
        ("HTTPS",
         "HTTP chiffré via TLS. Empêche l'écoute du trafic réseau."),
        ("CSV (RFC 4180)",
         "Format texte&nbsp;: lignes de valeurs séparées par des virgules."),
    ]
    s.append(make_table(["Terme", "Définition"], glo_web,
                        col_widths=[4.5 * cm, 11 * cm]))

    s.append(Paragraph("15.4&nbsp;&nbsp;Géolocalisation et QR", ss["H2"]))
    glo_geo = [
        ("Haversine",
         "Formule qui calcule la longueur du plus court arc géodésique entre deux points sur une sphère."),
        ("Geofence",
         "Zone géographique définie par un point central et un rayon."),
        ("QR code",
         "Code-barres 2D capable d'encoder du texte, lu par une caméra."),
        ("Token rotatif",
         "Token cryptographique qui change automatiquement à intervalle régulier."),
    ]
    s.append(make_table(["Terme", "Définition"], glo_geo,
                        col_widths=[4.5 * cm, 11 * cm]))

    # -- Final block -------------------------------------------------------
    s.append(Spacer(1, 1 * cm))
    final = Table([[Paragraph(
        "<b>Code source complet&nbsp;:</b> "
        "github.com/MouhssineElBoumshouli/Student-Attendance-System<br/><br/>"
        "<b>Stack&nbsp;:</b> Next.js 16 · React 19 · TypeScript · "
        "Prisma 6 · PostgreSQL (Neon) · NextAuth · Tailwind v4 · "
        "déployé sur Vercel",
        ss["uBody"])]], colWidths=[15.6 * cm])
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
    print(f"Report generated: {out}")
    return out


if __name__ == "__main__":
    build_report()
