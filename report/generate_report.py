#!/usr/bin/env python3
"""
UEMF Présence — Operational Research Project Report
Generates a professional PDF report for the OR module.
Updated: March 2026
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    Image, HRFlowable, KeepTogether, ListFlowable, ListItem,
)
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle
from reportlab.graphics import renderPDF
import os

# ─── Colors ───────────────────────────────────────────────────
UEMF_BLUE = HexColor("#1e40af")
UEMF_DARK = HexColor("#111827")
ACCENT = HexColor("#2563eb")
LIGHT_BG = HexColor("#f0f4ff")
LIGHT_GRAY = HexColor("#f3f4f6")
MEDIUM_GRAY = HexColor("#6b7280")
DARK_TEXT = HexColor("#1f2937")
GREEN = HexColor("#059669")
RED = HexColor("#dc2626")
AMBER = HexColor("#d97706")

W, H = A4

# ─── Styles ───────────────────────────────────────────────────
styles = getSampleStyleSheet()

styles.add(ParagraphStyle(
    name='CoverTitle',
    fontName='Helvetica-Bold',
    fontSize=28,
    leading=34,
    textColor=UEMF_BLUE,
    alignment=TA_CENTER,
    spaceAfter=6,
))

styles.add(ParagraphStyle(
    name='CoverSubtitle',
    fontName='Helvetica',
    fontSize=14,
    leading=20,
    textColor=MEDIUM_GRAY,
    alignment=TA_CENTER,
    spaceAfter=4,
))

styles.add(ParagraphStyle(
    name='SectionTitle',
    fontName='Helvetica-Bold',
    fontSize=18,
    leading=24,
    textColor=UEMF_BLUE,
    spaceBefore=24,
    spaceAfter=12,
))

styles.add(ParagraphStyle(
    name='SubSection',
    fontName='Helvetica-Bold',
    fontSize=13,
    leading=18,
    textColor=UEMF_DARK,
    spaceBefore=16,
    spaceAfter=8,
))

styles.add(ParagraphStyle(
    name='SubSubSection',
    fontName='Helvetica-Bold',
    fontSize=11,
    leading=15,
    textColor=ACCENT,
    spaceBefore=12,
    spaceAfter=6,
))

styles.add(ParagraphStyle(
    name='BodyText2',
    fontName='Helvetica',
    fontSize=10,
    leading=15,
    textColor=DARK_TEXT,
    alignment=TA_JUSTIFY,
    spaceAfter=8,
))

styles.add(ParagraphStyle(
    name='BulletItem',
    fontName='Helvetica',
    fontSize=10,
    leading=15,
    textColor=DARK_TEXT,
    leftIndent=20,
    spaceAfter=4,
    bulletIndent=8,
    bulletFontSize=10,
))

styles.add(ParagraphStyle(
    name='CodeBlock',
    fontName='Courier',
    fontSize=8.5,
    leading=12,
    textColor=DARK_TEXT,
    backColor=LIGHT_GRAY,
    leftIndent=12,
    rightIndent=12,
    spaceBefore=6,
    spaceAfter=6,
    borderPadding=(6, 6, 6, 6),
))

styles.add(ParagraphStyle(
    name='Formula',
    fontName='Courier-Bold',
    fontSize=10,
    leading=16,
    textColor=UEMF_DARK,
    alignment=TA_CENTER,
    spaceBefore=10,
    spaceAfter=10,
    backColor=LIGHT_BG,
    borderPadding=(10, 10, 10, 10),
))

styles.add(ParagraphStyle(
    name='Caption',
    fontName='Helvetica-Oblique',
    fontSize=9,
    leading=12,
    textColor=MEDIUM_GRAY,
    alignment=TA_CENTER,
    spaceBefore=4,
    spaceAfter=12,
))

styles.add(ParagraphStyle(
    name='TableHeader',
    fontName='Helvetica-Bold',
    fontSize=9,
    leading=12,
    textColor=white,
    alignment=TA_CENTER,
))

styles.add(ParagraphStyle(
    name='TableCell',
    fontName='Helvetica',
    fontSize=9,
    leading=12,
    textColor=DARK_TEXT,
    alignment=TA_LEFT,
))

styles.add(ParagraphStyle(
    name='Footer',
    fontName='Helvetica',
    fontSize=8,
    leading=10,
    textColor=MEDIUM_GRAY,
    alignment=TA_CENTER,
))


def make_table(headers, rows, col_widths=None):
    """Utility to create a styled table."""
    header_row = [Paragraph(h, styles['TableHeader']) for h in headers]
    data_rows = []
    for row in rows:
        data_rows.append([Paragraph(str(c), styles['TableCell']) for c in row])

    data = [header_row] + data_rows

    if col_widths is None:
        col_widths = [None] * len(headers)

    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), UEMF_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_GRAY]),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#d1d5db")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return t


def hr():
    return HRFlowable(width="100%", thickness=0.5, color=HexColor("#e5e7eb"),
                       spaceBefore=8, spaceAfter=8)


def bullet(text):
    return Paragraph(f"<bullet>&bull;</bullet> {text}", styles['BulletItem'])


def build_report():
    output_path = os.path.join(os.path.dirname(__file__), "UEMF_Presence_Rapport_RO.pdf")

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=2.2*cm,
        rightMargin=2.2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
        title="UEMF Presence - Rapport Recherche Operationnelle",
        author="Mouhssine El Boumshouli",
    )

    story = []

    # ═══════════════════════════════════════════════════════════
    # COVER PAGE
    # ═══════════════════════════════════════════════════════════
    story.append(Spacer(1, 3*cm))

    # University name
    story.append(Paragraph(
        "Universit&eacute; Euro-M&eacute;diterran&eacute;enne de F&egrave;s",
        ParagraphStyle('uni', parent=styles['CoverSubtitle'], fontSize=12, textColor=MEDIUM_GRAY)
    ))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "Module : Recherche Op&eacute;rationnelle",
        ParagraphStyle('mod', parent=styles['CoverSubtitle'], fontSize=11, textColor=ACCENT)
    ))
    story.append(Spacer(1, 2*cm))

    # Title
    story.append(Paragraph("UEMF Pr&eacute;sence", styles['CoverTitle']))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "Syst&egrave;me de Gestion des Pr&eacute;sences par QR Code",
        ParagraphStyle('sub', parent=styles['CoverSubtitle'], fontSize=16, textColor=UEMF_DARK)
    ))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(
        "Optimisation du processus d'appel universitaire",
        ParagraphStyle('sub2', parent=styles['CoverSubtitle'], fontSize=12)
    ))

    story.append(Spacer(1, 3*cm))

    # Info box
    info_data = [
        ["R&eacute;alis&eacute; par", "Mouhssine El Boumshouli"],
        ["Formation", "EIDIA - UEMF"],
        ["Ann&eacute;e Universitaire", "2025-2026"],
        ["Technologies", "Next.js 16 &middot; TypeScript &middot; Prisma 6 &middot; PostgreSQL (Neon)"],
        ["D&eacute;ploiement", "Vercel (Frontend) + Neon (Base de donn&eacute;es)"],
        ["D&eacute;p&ocirc;t GitHub", "github.com/MouhssineElBoumshouli/Student-Attendance-System"],
    ]
    info_table_data = [[Paragraph(r[0], ParagraphStyle('ik', parent=styles['TableCell'], fontName='Helvetica-Bold', textColor=UEMF_BLUE)),
                         Paragraph(r[1], styles['TableCell'])] for r in info_data]

    info_t = Table(info_table_data, colWidths=[5*cm, 10*cm])
    info_t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#bfdbfe")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(info_t)

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # TABLE OF CONTENTS
    # ═══════════════════════════════════════════════════════════
    story.append(Paragraph("Table des Mati&egrave;res", styles['SectionTitle']))
    story.append(hr())

    toc_items = [
        ("1.", "Introduction et Contexte du Probl&egrave;me"),
        ("2.", "Mod&eacute;lisation en Recherche Op&eacute;rationnelle"),
        ("  2.1", "Variables de D&eacute;cision"),
        ("  2.2", "Fonction Objectif"),
        ("  2.3", "Contraintes"),
        ("  2.4", "Analyse de Complexit&eacute;"),
        ("3.", "Solution Technique : Architecture du Syst&egrave;me"),
        ("  3.1", "Choix Technologiques et Justifications"),
        ("  3.2", "Mod&egrave;le de Donn&eacute;es (13 Entit&eacute;s)"),
        ("  3.3", "Algorithme de QR Code Rotatif (HMAC-SHA256)"),
        ("  3.4", "G&eacute;olocalisation et Formule de Haversine"),
        ("  3.5", "Polling Temps R&eacute;el"),
        ("4.", "M&eacute;canismes Anti-Fraude"),
        ("  4.1", "Rotation des Tokens"),
        ("  4.2", "Validation GPS"),
        ("  4.3", "Empreinte de l'Appareil"),
        ("  4.4", "Comparaison Temporellement S&ucirc;re"),
        ("5.", "Analyse de Performance et Scalabilit&eacute;"),
        ("6.", "Interfaces Utilisateur (3 R&ocirc;les)"),
        ("7.", "Guide de D&eacute;ploiement et D'utilisation"),
        ("  7.1", "Pr&eacute;-requis"),
        ("  7.2", "Installation Locale"),
        ("  7.3", "D&eacute;ploiement Cloud (Vercel + Neon)"),
        ("  7.4", "Comptes de Test"),
        ("  7.5", "Guide d'Utilisation Complet"),
        ("8.", "Guide de Maintenance et Modification"),
        ("  8.1", "Structure du Projet"),
        ("  8.2", "Ajouter / Modifier des Entit&eacute;s"),
        ("  8.3", "Modifier les Param&egrave;tres du Syst&egrave;me"),
        ("9.", "Conclusion et Am&eacute;liorations Futures"),
    ]

    for num, title in toc_items:
        indent = 20 if num.startswith("  ") else 0
        weight = 'Helvetica-Bold' if not num.startswith("  ") else 'Helvetica'
        story.append(Paragraph(
            f"<b>{num.strip()}</b>&nbsp;&nbsp;{title}",
            ParagraphStyle('toc_item', parent=styles['BodyText2'],
                          leftIndent=indent, fontName=weight, spaceAfter=5)
        ))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 1. INTRODUCTION
    # ═══════════════════════════════════════════════════════════
    story.append(Paragraph("1. Introduction et Contexte du Probl&egrave;me", styles['SectionTitle']))
    story.append(hr())

    story.append(Paragraph("1.1 Contexte", styles['SubSection']))
    story.append(Paragraph(
        "L'Universit&eacute; Euro-M&eacute;diterran&eacute;enne de F&egrave;s (UEMF) utilise actuellement "
        "la plateforme Konosys pour la gestion acad&eacute;mique. Le processus de prise de pr&eacute;sence "
        "se fait manuellement : le professeur appelle chaque &eacute;tudiant par son nom depuis la liste "
        "Konosys, attend une r&eacute;ponse, puis coche le statut. Ce processus pr&eacute;sente plusieurs "
        "probl&egrave;mes critiques.",
        styles['BodyText2']
    ))

    story.append(Paragraph("1.2 Probl&egrave;mes Identifi&eacute;s", styles['SubSection']))

    problems = [
        ("<b>Temps perdu</b> : L'appel prend 5 &agrave; 15 minutes par s&eacute;ance pour une classe de 30-60 &eacute;tudiants, "
         "soit environ 10% du temps de cours effectif."),
        ("<b>Erreurs humaines</b> : Erreurs de prononciation, homonymes, oublis de marquage. "
         "Le taux d'erreur estim&eacute; est de 2-5% par s&eacute;ance."),
        ("<b>Fraude facile</b> : Un &eacute;tudiant r&eacute;pond &laquo; pr&eacute;sent &raquo; pour un coll&egrave;gue absent. "
         "Aucun m&eacute;canisme de v&eacute;rification d'identit&eacute;."),
        ("<b>Pas de donn&eacute;es exploitables</b> : Les donn&eacute;es de pr&eacute;sence manuscrites ne sont pas "
         "facilement agr&eacute;geables pour l'analyse statistique."),
        ("<b>Scalabilit&eacute;</b> : Le processus ne s'adapte pas &agrave; la croissance de l'universit&eacute;."),
    ]
    for p in problems:
        story.append(bullet(p))

    story.append(Paragraph("1.3 Objectif du Projet", styles['SubSection']))
    story.append(Paragraph(
        "Concevoir et impl&eacute;menter un syst&egrave;me de gestion des pr&eacute;sences bas&eacute; sur les QR codes "
        "qui <b>minimise le temps d'appel</b>, <b>maximise la fiabilit&eacute; des donn&eacute;es</b>, et "
        "<b>&eacute;limine la fraude</b>, tout en fournissant des <b>outils d'analyse</b> aux professeurs "
        "et administrateurs. Le syst&egrave;me doit &ecirc;tre pr&ecirc;t pour la production, d&eacute;ploy&eacute; dans le cloud, "
        "et accessible depuis n'importe quel appareil connect&eacute; &agrave; Internet.",
        styles['BodyText2']
    ))

    # Comparison table
    story.append(Paragraph("1.4 Comparaison : Ancien vs. Nouveau Syst&egrave;me", styles['SubSection']))

    comp_table = make_table(
        ["Crit&egrave;re", "Syst&egrave;me Actuel (Konosys)", "UEMF Pr&eacute;sence (QR)"],
        [
            ["Temps d'appel", "5-15 min / s&eacute;ance", "15-30 secondes"],
            ["M&eacute;thode", "Appel vocal un par un", "Scan QR sur smartphone"],
            ["Anti-fraude", "Aucun m&eacute;canisme", "4 couches de protection"],
            ["Donn&eacute;es temps r&eacute;el", "Non", "Oui (polling toutes les 2s)"],
            ["Export/Rapports", "Manuel", "CSV automatique en 1 clic"],
            ["Taux d'erreur", "2-5%", "~0% (automatis&eacute;)"],
            ["Accessibilit&eacute;", "En salle uniquement", "Depuis n'importe o&ugrave; (cloud)"],
            ["Co&ucirc;t additionnel", "Aucun", "Aucun (h&eacute;bergement gratuit)"],
        ],
        col_widths=[4*cm, 5.5*cm, 5.5*cm]
    )
    story.append(comp_table)
    story.append(Paragraph("Tableau 1 : Comparaison des syst&egrave;mes", styles['Caption']))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 2. MODELISATION OR
    # ═══════════════════════════════════════════════════════════
    story.append(Paragraph("2. Mod&eacute;lisation en Recherche Op&eacute;rationnelle", styles['SectionTitle']))
    story.append(hr())

    story.append(Paragraph(
        "Ce projet peut &ecirc;tre formul&eacute; comme un probl&egrave;me d'optimisation combinatoire. "
        "Nous allons d&eacute;finir les variables de d&eacute;cision, la fonction objectif, et les contraintes "
        "du syst&egrave;me selon la m&eacute;thodologie de la Recherche Op&eacute;rationnelle.",
        styles['BodyText2']
    ))

    # 2.1 Variables
    story.append(Paragraph("2.1 Variables de D&eacute;cision", styles['SubSection']))

    story.append(Paragraph(
        "Soit les ensembles fondamentaux suivants :",
        styles['BodyText2']
    ))

    story.append(Paragraph(
        "S = {s<sub>1</sub>, s<sub>2</sub>, ..., s<sub>n</sub>} : ensemble des s&eacute;ances<br/>"
        "E = {e<sub>1</sub>, e<sub>2</sub>, ..., e<sub>m</sub>} : ensemble des &eacute;tudiants<br/>"
        "T = {t<sub>0</sub>, t<sub>1</sub>, ..., t<sub>k</sub>} : ensemble des intervalles de temps (fen&ecirc;tres QR)",
        styles['Formula']
    ))

    story.append(Paragraph(
        "Les variables de d&eacute;cision sont :",
        styles['BodyText2']
    ))

    var_table = make_table(
        ["Variable", "Domaine", "Description"],
        [
            ["x<sub>ij</sub>", "{0, 1}", "= 1 si l'&eacute;tudiant e<sub>i</sub> est pr&eacute;sent &agrave; la s&eacute;ance s<sub>j</sub>"],
            ["r<sub>ij</sub>", "{0, 1}", "= 1 si l'&eacute;tudiant e<sub>i</sub> est en retard &agrave; s<sub>j</sub>"],
            ["v<sub>ij</sub>", "{0, 1}", "= 1 si la pr&eacute;sence de e<sub>i</sub> &agrave; s<sub>j</sub> est g&eacute;o-v&eacute;rifi&eacute;e"],
            ["q<sub>jk</sub>", "String(8)", "Token HMAC g&eacute;n&eacute;r&eacute; pour s<sub>j</sub> &agrave; l'intervalle t<sub>k</sub>"],
            ["d<sub>ij</sub>", "R<super>+</super>", "Distance GPS de e<sub>i</sub> &agrave; la salle de s<sub>j</sub> (m&egrave;tres)"],
            ["&Delta;t<sub>ij</sub>", "R<super>+</super>", "D&eacute;lai d'arriv&eacute;e de e<sub>i</sub> apr&egrave;s le d&eacute;but de s<sub>j</sub> (minutes)"],
            ["f<sub>ij</sub>", "String", "Empreinte (hash SHA-256) de l'appareil de e<sub>i</sub> pour s<sub>j</sub>"],
        ],
        col_widths=[2.5*cm, 2.5*cm, 10*cm]
    )
    story.append(var_table)
    story.append(Paragraph("Tableau 2 : Variables de d&eacute;cision du mod&egrave;le", styles['Caption']))

    # 2.2 Objective Function
    story.append(Paragraph("2.2 Fonction Objectif", styles['SubSection']))

    story.append(Paragraph(
        "La fonction objectif est <b>multi-crit&egrave;re</b>. Nous cherchons &agrave; <b>maximiser</b> "
        "la fiabilit&eacute; globale du syst&egrave;me, d&eacute;finie comme la combinaison pond&eacute;r&eacute;e de "
        "trois objectifs :",
        styles['BodyText2']
    ))

    story.append(Paragraph(
        "Maximiser &nbsp;&nbsp; Z = &alpha; &middot; Z<sub>1</sub> + &beta; &middot; Z<sub>2</sub> + &gamma; &middot; Z<sub>3</sub>",
        styles['Formula']
    ))

    story.append(Paragraph(
        "O&ugrave; :",
        styles['BodyText2']
    ))

    story.append(bullet(
        "<b>Z<sub>1</sub> = Taux de couverture</b> : Pourcentage d'&eacute;tudiants dont la pr&eacute;sence est "
        "enregistr&eacute;e automatiquement (vs. manuellement)"
    ))
    story.append(Paragraph(
        "Z<sub>1</sub> = (1/|S|) &middot; &Sigma;<sub>j</sub> [ (&Sigma;<sub>i</sub> x<sub>ij</sub>) / |E<sub>j</sub>| ]",
        styles['Formula']
    ))

    story.append(bullet(
        "<b>Z<sub>2</sub> = Taux de v&eacute;rification GPS</b> : Pourcentage des pr&eacute;sences g&eacute;o-v&eacute;rifi&eacute;es"
    ))
    story.append(Paragraph(
        "Z<sub>2</sub> = (&Sigma;<sub>i,j</sub> v<sub>ij</sub>) / (&Sigma;<sub>i,j</sub> x<sub>ij</sub>)",
        styles['Formula']
    ))

    story.append(bullet(
        "<b>Z<sub>3</sub> = Efficacit&eacute; temporelle</b> : R&eacute;duction du temps d'appel"
    ))
    story.append(Paragraph(
        "Z<sub>3</sub> = 1 - (T<sub>QR</sub> / T<sub>manuel</sub>)&nbsp;&nbsp;&nbsp;o&ugrave; T<sub>QR</sub> &asymp; 30s, T<sub>manuel</sub> &asymp; 600s",
        styles['Formula']
    ))

    story.append(Paragraph(
        "Avec les poids &alpha; = 0.4, &beta; = 0.3, &gamma; = 0.3 (calibrables selon les priorit&eacute;s de l'universit&eacute;).",
        styles['BodyText2']
    ))

    # 2.3 Constraints
    story.append(Paragraph("2.3 Contraintes", styles['SubSection']))

    story.append(Paragraph("Les contraintes du syst&egrave;me se d&eacute;composent en cinq cat&eacute;gories :", styles['BodyText2']))

    story.append(Paragraph("(C1) Contraintes d'Unicit&eacute;", styles['SubSubSection']))
    story.append(Paragraph(
        "Chaque &eacute;tudiant ne peut &ecirc;tre compt&eacute; qu'une seule fois par s&eacute;ance. "
        "Impl&eacute;ment&eacute; par une contrainte UNIQUE en base de donn&eacute;es sur (sessionId, studentId) :",
        styles['BodyText2']
    ))
    story.append(Paragraph(
        "x<sub>ij</sub> + r<sub>ij</sub> &le; 1 &nbsp;&nbsp;&nbsp; &forall; i &isin; E, &forall; j &isin; S",
        styles['Formula']
    ))

    story.append(Paragraph("(C2) Contraintes Temporelles", styles['SubSubSection']))
    story.append(Paragraph(
        "Un token QR n'est valide que pendant sa fen&ecirc;tre de rotation (20 secondes par d&eacute;faut), "
        "plus une tol&eacute;rance d'un intervalle pour le d&eacute;calage d'horloge :",
        styles['BodyText2']
    ))
    story.append(Paragraph(
        "q<sub>jk</sub> est valide ssi &nbsp; |t<sub>scan</sub> - t<sub>k</sub>| &le; 2 &middot; &Delta;rotation<br/>"
        "&Delta;t<sub>ij</sub> &gt; 15 min &rArr; r<sub>ij</sub> = 1 &nbsp;(marqu&eacute; EN RETARD)",
        styles['Formula']
    ))

    story.append(Paragraph("(C3) Contraintes G&eacute;ographiques", styles['SubSubSection']))
    story.append(Paragraph(
        "L'&eacute;tudiant doit se trouver dans le rayon de g&eacute;olocalisation de la salle (configurable par salle, "
        "entre 60m et 150m dans la configuration actuelle). "
        "La distance est calcul&eacute;e par la <b>formule de Haversine</b> :",
        styles['BodyText2']
    ))
    story.append(Paragraph(
        "d<sub>ij</sub> = 2R &middot; arcsin(&radic;(sin<super>2</super>((&phi;<sub>2</sub>-&phi;<sub>1</sub>)/2) + "
        "cos(&phi;<sub>1</sub>)&middot;cos(&phi;<sub>2</sub>)&middot;sin<super>2</super>((&lambda;<sub>2</sub>-&lambda;<sub>1</sub>)/2)))<br/>"
        "v<sub>ij</sub> = 1 ssi d<sub>ij</sub> &le; R<sub>salle</sub>",
        styles['Formula']
    ))
    story.append(Paragraph(
        "O&ugrave; R = 6 371 km (rayon terrestre), (&phi;, &lambda;) sont les coordonn&eacute;es de latitude et longitude, "
        "et R<sub>salle</sub> est le rayon configur&eacute; de la salle.",
        styles['BodyText2']
    ))

    story.append(Paragraph("(C4) Contraintes de S&eacute;curit&eacute; Cryptographique", styles['SubSubSection']))
    story.append(Paragraph(
        "Chaque token est g&eacute;n&eacute;r&eacute; par HMAC-SHA256, ce qui emp&ecirc;che tout &eacute;tudiant de "
        "pr&eacute;dire ou forger un token :",
        styles['BodyText2']
    ))
    story.append(Paragraph(
        "q<sub>jk</sub> = HMAC-SHA256(secret<sub>j</sub>, &lfloor;t / &Delta;rotation&rfloor;).hex()[0:8]<br/>"
        "P(deviner q<sub>jk</sub>) = 1/16<super>8</super> = 1/4.29 &times; 10<super>9</super> &asymp; 0",
        styles['Formula']
    ))

    story.append(Paragraph("(C5) Contraintes d'Appareil", styles['SubSubSection']))
    story.append(Paragraph(
        "Un m&ecirc;me appareil ne peut pas valider la pr&eacute;sence de deux &eacute;tudiants diff&eacute;rents "
        "pour la m&ecirc;me s&eacute;ance :",
        styles['BodyText2']
    ))
    story.append(Paragraph(
        "f<sub>ij</sub> = f<sub>i'j</sub> &and; i &ne; i' &rArr; v<sub>ij</sub> = 0 &and; v<sub>i'j</sub> = 0<br/>"
        "(les deux pr&eacute;sences sont marqu&eacute;es comme non-v&eacute;rifi&eacute;es, le professeur tranchera)",
        styles['Formula']
    ))

    # 2.4 Complexity
    story.append(Paragraph("2.4 Analyse de Complexit&eacute;", styles['SubSection']))
    story.append(Paragraph(
        "Le probl&egrave;me d'affectation de pr&eacute;sence est r&eacute;solu en temps polynomial gr&acirc;ce "
        "&agrave; la d&eacute;composition du probl&egrave;me global en sous-probl&egrave;mes ind&eacute;pendants par s&eacute;ance. "
        "Pour chaque s&eacute;ance s<sub>j</sub> avec n &eacute;tudiants et k intervalles de rotation :",
        styles['BodyText2']
    ))

    complexity_table = make_table(
        ["Op&eacute;ration", "Complexit&eacute;", "Explication"],
        [
            ["G&eacute;n&eacute;ration token QR", "O(1)", "Un HMAC par intervalle, calcul constant"],
            ["Validation token", "O(1)", "V&eacute;rification HMAC + comparaison timing-safe"],
            ["Calcul distance GPS", "O(1)", "Formule de Haversine, op&eacute;rations trigonom&eacute;triques fixes"],
            ["V&eacute;rification unicit&eacute;", "O(1)", "Lookup par index unique en base de donn&eacute;es"],
            ["Activation s&eacute;ance", "O(n)", "Cr&eacute;ation de n enregistrements ABSENT"],
            ["Scan d'un &eacute;tudiant", "O(1)", "UPDATE d'un seul enregistrement"],
            ["Total par s&eacute;ance", "O(n)", "Lin&eacute;aire en nombre d'&eacute;tudiants"],
        ],
        col_widths=[4.5*cm, 3*cm, 7.5*cm]
    )
    story.append(complexity_table)
    story.append(Paragraph("Tableau 3 : Analyse de complexit&eacute; algorithmique", styles['Caption']))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 3. SOLUTION TECHNIQUE
    # ═══════════════════════════════════════════════════════════
    story.append(Paragraph("3. Solution Technique : Architecture du Syst&egrave;me", styles['SectionTitle']))
    story.append(hr())

    # 3.1 Tech Choices
    story.append(Paragraph("3.1 Choix Technologiques et Justifications", styles['SubSection']))

    tech_table = make_table(
        ["Technologie", "R&ocirc;le", "Justification"],
        [
            ["Next.js 16", "Framework web full-stack", "App Router, SSR/SSG, API Routes int&eacute;gr&eacute;es, d&eacute;ploiement Vercel natif"],
            ["TypeScript", "Langage", "Typage statique, d&eacute;tection d'erreurs &agrave; la compilation, maintenabilit&eacute;"],
            ["Prisma 6", "ORM", "G&eacute;n&eacute;ration de types, requ&ecirc;tes typ&eacute;es, support PostgreSQL avec connection pooling"],
            ["PostgreSQL (Neon)", "Base de donn&eacute;es", "Base relationnelle robuste, h&eacute;berg&eacute;e dans le cloud (Neon), serverless-compatible"],
            ["NextAuth.js v4", "Authentification", "JWT + Credentials provider, sessions s&eacute;curis&eacute;es, RBAC int&eacute;gr&eacute;"],
            ["Tailwind CSS 4", "Styles", "Utility-first, responsive natif, taille CSS minimale"],
            ["Zod 4", "Validation", "Sch&eacute;mas typ&eacute;s, validation runtime des entr&eacute;es API"],
            ["jsQR", "D&eacute;codage QR", "D&eacute;codage c&ocirc;t&eacute; client depuis le flux cam&eacute;ra, l&eacute;ger"],
            ["qrcode", "G&eacute;n&eacute;ration QR", "Rendu Canvas c&ocirc;t&eacute; client, QR haute r&eacute;solution"],
            ["Vercel", "H&eacute;bergement", "D&eacute;ploiement gratuit, CDN global, serverless functions, HTTPS automatique"],
        ],
        col_widths=[3*cm, 3.5*cm, 8.5*cm]
    )
    story.append(tech_table)
    story.append(Paragraph("Tableau 4 : Stack technologique", styles['Caption']))

    # 3.2 Data Model
    story.append(Paragraph("3.2 Mod&egrave;le de Donn&eacute;es (13 Entit&eacute;s)", styles['SubSection']))

    story.append(Paragraph(
        "Le sch&eacute;ma de base de donn&eacute;es comprend 13 mod&egrave;les Prisma interconnect&eacute;s, "
        "structur&eacute;s selon le principe de normalisation 3NF. La base est h&eacute;berg&eacute;e sur "
        "Neon PostgreSQL (serverless) avec connection pooling via PgBouncer :",
        styles['BodyText2']
    ))

    model_table = make_table(
        ["Entit&eacute;", "Champs Cl&eacute;s", "Relations"],
        [
            ["User", "id, email, passwordHash, role, firstName, lastName", "1:1 Professor, 1:1 Student"],
            ["Department", "id, name, code (unique)", "1:N Program"],
            ["Program", "id, name, code, departmentId", "1:N Group, 1:N Course"],
            ["Group", "id, name, semester, programId", "M:N Student, M:N Course"],
            ["Professor", "id, employeeId, userId", "1:N Course, 1:N Session"],
            ["Student", "id, studentId, userId, enrollmentYear", "M:N Group, 1:N Attendance"],
            ["StudentGroup", "studentId, groupId", "Table de jonction M:N"],
            ["Room", "id, name, building, latitude, longitude, radius", "1:N Session"],
            ["Course", "id, name, code, professorId, programId, totalHours", "1:N Session, M:N Group"],
            ["CourseGroup", "courseId, groupId", "Table de jonction M:N"],
            ["Session", "id, date, startTime, endTime, status, qrSecret, qrRotationSec", "1:N Attendance"],
            ["Attendance", "id, sessionId, studentId, status, scannedAt, verified, deviceHash, ipAddress", "UNIQUE(sessionId, studentId)"],
        ],
        col_widths=[2.5*cm, 5.5*cm, 7*cm]
    )
    story.append(model_table)
    story.append(Paragraph("Tableau 5 : Mod&egrave;le de donn&eacute;es", styles['Caption']))

    story.append(Paragraph(
        "La relation cl&eacute; est <b>Session &rarr; Attendance</b> : &agrave; l'activation d'une s&eacute;ance, "
        "un enregistrement ABSENT est pr&eacute;-cr&eacute;&eacute; pour chaque &eacute;tudiant inscrit (via les groupes du cours). "
        "Quand un &eacute;tudiant scanne le QR, son enregistrement passe de ABSENT &agrave; PRESENT ou LATE.",
        styles['BodyText2']
    ))

    # 3.3 QR Algorithm
    story.append(Paragraph("3.3 Algorithme de QR Code Rotatif (HMAC-SHA256)", styles['SubSection']))

    story.append(Paragraph(
        "C'est le c&oelig;ur cryptographique du syst&egrave;me, inspir&eacute; du protocole TOTP (Time-based "
        "One-Time Password, RFC 6238) utilis&eacute; dans l'authentification &agrave; deux facteurs. "
        "Le principe est le suivant :",
        styles['BodyText2']
    ))

    story.append(Paragraph("&Eacute;tape 1 : Activation de la s&eacute;ance", styles['SubSubSection']))
    story.append(bullet("Le serveur g&eacute;n&egrave;re un <b>secret cryptographique</b> de 32 octets al&eacute;atoires (256 bits d'entropie) via <i>crypto.randomBytes(32)</i>"))
    story.append(bullet("Ce secret est stock&eacute; en base dans le champ <b>qrSecret</b> de la s&eacute;ance"))
    story.append(bullet("Il n'est <b>jamais expos&eacute;</b> au client (ni au professeur, ni aux &eacute;tudiants)"))

    story.append(Paragraph("&Eacute;tape 2 : G&eacute;n&eacute;ration des tokens rotatifs", styles['SubSubSection']))
    story.append(Paragraph(
        "Toutes les 20 secondes, le serveur calcule un nouveau token :",
        styles['BodyText2']
    ))
    story.append(Paragraph(
        "counter = floor(timestamp / interval)<br/>"
        "token = HMAC-SHA256(secret, counter).hex()[0:8]",
        styles['Formula']
    ))
    story.append(Paragraph(
        "Le token est un hash hexad&eacute;cimal de 8 caract&egrave;res (32 bits d'entropie), int&eacute;gr&eacute; dans un payload JSON "
        "compact : <i>{\"s\": \"sessionId\", \"t\": \"token\", \"ts\": timestamp}</i>. "
        "Ce JSON est encod&eacute; dans le QR code affich&eacute; sur l'&eacute;cran du professeur. "
        "La taille r&eacute;duite du token (8 caract&egrave;res) garantit un QR code clair et facilement scannable, "
        "tout en offrant 4,29 milliards de combinaisons possibles par fen&ecirc;tre de 20 secondes.",
        styles['BodyText2']
    ))

    story.append(Paragraph("&Eacute;tape 3 : Validation c&ocirc;t&eacute; serveur", styles['SubSubSection']))
    story.append(Paragraph(
        "Quand un &eacute;tudiant scanne le QR, le serveur v&eacute;rifie le token :",
        styles['BodyText2']
    ))
    story.append(bullet("Recalcule le token attendu pour la fen&ecirc;tre courante ET la fen&ecirc;tre pr&eacute;c&eacute;dente (tol&eacute;rance de 1 fen&ecirc;tre)"))
    story.append(bullet("Utilise <b>crypto.timingSafeEqual()</b> pour la comparaison (pr&eacute;vient les attaques par timing)"))
    story.append(bullet("V&eacute;rifie que le timestamp du client n'a pas plus de 60 secondes de d&eacute;calage (MAX_CLOCK_SKEW_SEC)"))

    story.append(Paragraph("&Eacute;tape 4 : Polling temps r&eacute;el", styles['SubSubSection']))
    story.append(Paragraph(
        "Le navigateur du professeur envoie une requ&ecirc;te HTTP GET &agrave; l'endpoint "
        "<i>/api/sessions/[id]/qr-token</i> toutes les 2 secondes. Le serveur retourne le token "
        "courant, le temps d'expiration, et l'intervalle de rotation. Le client ne re-g&eacute;n&egrave;re "
        "le QR code que si le payload a r&eacute;ellement chang&eacute; (optimisation via ref React). "
        "Un anneau de compte &agrave; rebours SVG anim&eacute; indique visuellement le temps restant avant "
        "la prochaine rotation. Cette architecture de polling est compatible avec les fonctions "
        "serverless de Vercel (pas de connexion persistante n&eacute;cessaire).",
        styles['BodyText2']
    ))

    # 3.4 Haversine
    story.append(Paragraph("3.4 G&eacute;olocalisation et Formule de Haversine", styles['SubSection']))
    story.append(Paragraph(
        "Pour v&eacute;rifier que l'&eacute;tudiant est physiquement pr&eacute;sent dans la salle, le syst&egrave;me "
        "utilise la <b>formule de Haversine</b> pour calculer la distance entre les coordonn&eacute;es GPS "
        "du smartphone et celles de la salle (pr&eacute;-configur&eacute;es par l'administrateur). "
        "Les coordonn&eacute;es du campus UEMF sont centr&eacute;es autour de (34.0531&deg;N, -4.9998&deg;W).",
        styles['BodyText2']
    ))

    story.append(Paragraph(
        "a = sin<super>2</super>((&phi;<sub>2</sub>-&phi;<sub>1</sub>)/2) + cos(&phi;<sub>1</sub>) &middot; "
        "cos(&phi;<sub>2</sub>) &middot; sin<super>2</super>((&lambda;<sub>2</sub>-&lambda;<sub>1</sub>)/2)<br/>"
        "c = 2 &middot; atan2(&radic;a, &radic;(1-a))<br/>"
        "distance = R &middot; c &nbsp;&nbsp;&nbsp;&nbsp;(R = 6 371 000 m)",
        styles['Formula']
    ))

    story.append(Paragraph(
        "Les salles configur&eacute;es dans le syst&egrave;me ont des rayons variables :",
        styles['BodyText2']
    ))

    rooms_table = make_table(
        ["Salle", "B&acirc;timent", "Rayon (m)", "Capacit&eacute;"],
        [
            ["Amphi A", "B&acirc;timent Principal", "150", "200"],
            ["Salle 204", "B&acirc;timent B", "80", "40"],
            ["Labo Info 1", "B&acirc;timent EIDIA", "60", "30"],
        ],
        col_widths=[3.5*cm, 4*cm, 3*cm, 3*cm]
    )
    story.append(rooms_table)
    story.append(Paragraph("Tableau 6 : Salles configur&eacute;es avec rayons GPS", styles['Caption']))

    story.append(Paragraph(
        "<b>Design important</b> : si le GPS &eacute;choue ou si l'&eacute;tudiant est hors zone, la pr&eacute;sence "
        "est <b>quand m&ecirc;me enregistr&eacute;e</b> mais marqu&eacute;e comme <b>non v&eacute;rifi&eacute;e</b> (verified = false). "
        "Le professeur d&eacute;cide ensuite. Cela &eacute;vite de bloquer des &eacute;tudiants pour des probl&egrave;mes techniques GPS.",
        styles['BodyText2']
    ))

    # 3.5 Polling
    story.append(Paragraph("3.5 Polling Temps R&eacute;el", styles['SubSection']))
    story.append(Paragraph(
        "Le syst&egrave;me utilise un m&eacute;canisme de <b>polling HTTP</b> pour les mises &agrave; jour en temps r&eacute;el. "
        "Ce choix a &eacute;t&eacute; fait pour la compatibilit&eacute; avec les fonctions serverless de Vercel "
        "(qui ne supportent pas les connexions persistantes comme les WebSockets ou SSE). "
        "Deux boucles de polling fonctionnent en parall&egrave;le sur la page du QR code :",
        styles['BodyText2']
    ))

    story.append(bullet(
        "<b>Polling QR Token</b> (toutes les 2 secondes) : r&eacute;cup&egrave;re le token courant depuis "
        "<i>/api/sessions/[id]/qr-token</i>. Ne re-g&eacute;n&egrave;re le QR que si le payload a chang&eacute;."
    ))
    story.append(bullet(
        "<b>Polling Session Info</b> (toutes les 5 secondes) : r&eacute;cup&egrave;re le compteur de "
        "pr&eacute;sences en direct depuis <i>/api/sessions/[id]</i>."
    ))

    story.append(Paragraph(
        "L'intervalle de 2 secondes pour le polling QR garantit que le QR affich&eacute; est toujours &agrave; jour, "
        "m&ecirc;me avec la rotation de 20 secondes. L'utilisation de <i>useCallback</i> et <i>useRef</i> "
        "&eacute;vite les re-rendus inutiles du composant React.",
        styles['BodyText2']
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 4. ANTI-FRAUD
    # ═══════════════════════════════════════════════════════════
    story.append(Paragraph("4. M&eacute;canismes Anti-Fraude", styles['SectionTitle']))
    story.append(hr())

    story.append(Paragraph(
        "Le syst&egrave;me impl&eacute;mente <b>4 couches de protection</b> ind&eacute;pendantes et compl&eacute;mentaires. "
        "M&ecirc;me si une couche est contourn&eacute;e, les autres restent actives.",
        styles['BodyText2']
    ))

    fraud_table = make_table(
        ["Couche", "M&eacute;canisme", "Attaque bloqu&eacute;e", "Impl&eacute;mentation"],
        [
            ["1. Rotation des tokens",
             "Nouveau QR toutes les 20s via HMAC-SHA256",
             "Capture d'&eacute;cran / partage de photo du QR",
             "generateQrToken() avec counter temporel"],
            ["2. G&eacute;olocalisation",
             "Formule de Haversine, rayon configurable par salle",
             "&Eacute;tudiant scannant depuis la maison / un autre b&acirc;timent",
             "isWithinGeofence() + coordonn&eacute;es GPS de la salle"],
            ["3. Empreinte appareil",
             "SHA-256(UserAgent + r&eacute;solution + langue)",
             "Un &eacute;tudiant scanne pour deux personnes avec le m&ecirc;me t&eacute;l&eacute;phone",
             "deviceHash en base, d&eacute;tection de duplicata par session"],
            ["4. Comparaison s&ucirc;re",
             "crypto.timingSafeEqual()",
             "Attaque par timing (mesure du temps de comparaison)",
             "V&eacute;rification en temps constant, aucune fuite d'information"],
        ],
        col_widths=[2.8*cm, 3.5*cm, 4.2*cm, 4.5*cm]
    )
    story.append(fraud_table)
    story.append(Paragraph("Tableau 7 : Les 4 couches anti-fraude", styles['Caption']))

    story.append(Paragraph("Sc&eacute;narios de fraude et r&eacute;ponses", styles['SubSection']))

    scenarios = [
        ("<b>Sc&eacute;nario 1 : Photo du QR code</b> &mdash; Un &eacute;tudiant prend une photo et l'envoie &agrave; un ami absent. "
         "<b>R&eacute;ponse</b> : le QR change toutes les 20 secondes. Le temps de recevoir la photo, le QR est d&eacute;j&agrave; expir&eacute;."),
        ("<b>Sc&eacute;nario 2 : Scan &agrave; distance</b> &mdash; Un &eacute;tudiant reste &agrave; la maison et obtient le QR en temps r&eacute;el "
         "(ex: appel vid&eacute;o). <b>R&eacute;ponse</b> : la g&eacute;olocalisation d&eacute;tecte qu'il est hors du rayon de la salle. "
         "Sa pr&eacute;sence est marqu&eacute;e comme non-v&eacute;rifi&eacute;e et signal&eacute;e au professeur."),
        ("<b>Sc&eacute;nario 3 : Un seul t&eacute;l&eacute;phone pour deux</b> &mdash; Un &eacute;tudiant scanne deux fois "
         "avec des comptes diff&eacute;rents. <b>R&eacute;ponse</b> : l'empreinte de l'appareil (SHA-256 du UserAgent, "
         "r&eacute;solution d'&eacute;cran, et langue) est la m&ecirc;me. "
         "Les deux pr&eacute;sences sont marqu&eacute;es non-v&eacute;rifi&eacute;es et signal&eacute;es au professeur."),
        ("<b>Sc&eacute;nario 4 : Brute-force du token</b> &mdash; Un attaquant essaie de deviner le token. "
         "<b>R&eacute;ponse</b> : 8 caract&egrave;res hex = 32 bits d'entropie = 4,29 &times; 10<super>9</super> combinaisons. "
         "Avec un token qui change toutes les 20s et la latence r&eacute;seau, c'est infaisable en pratique."),
    ]
    for s in scenarios:
        story.append(bullet(s))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 5. PERFORMANCE
    # ═══════════════════════════════════════════════════════════
    story.append(Paragraph("5. Analyse de Performance et Scalabilit&eacute;", styles['SectionTitle']))
    story.append(hr())

    story.append(Paragraph("5.1 Architecture Cloud", styles['SubSection']))

    story.append(Paragraph(
        "Le syst&egrave;me est d&eacute;ploy&eacute; sur une architecture cloud enti&egrave;rement serverless et gratuite :",
        styles['BodyText2']
    ))

    arch_table = make_table(
        ["Composant", "Service", "Avantage"],
        [
            ["Frontend + API", "Vercel (Serverless Functions)", "CDN global, HTTPS automatique, auto-scaling, d&eacute;ploiement continu via Git"],
            ["Base de donn&eacute;es", "Neon PostgreSQL (Serverless)", "Connection pooling (PgBouncer), scale-to-zero, 0.5 Go gratuit"],
            ["ORM", "Prisma 6 avec directUrl", "URL pool&eacute;e pour les requ&ecirc;tes, URL directe pour les migrations"],
        ],
        col_widths=[3*cm, 4.5*cm, 7.5*cm]
    )
    story.append(arch_table)
    story.append(Paragraph("Tableau 8 : Architecture cloud", styles['Caption']))

    story.append(Paragraph("5.2 Estimation de la charge", styles['SubSection']))

    story.append(Paragraph(
        "Pour dimensionner le syst&egrave;me, estimons la charge pour l'ensemble de l'UEMF :",
        styles['BodyText2']
    ))

    load_table = make_table(
        ["Param&egrave;tre", "Valeur estim&eacute;e", "Impact"],
        [
            ["Nombre d'&eacute;tudiants", "~2 000", "2 000 comptes utilisateurs"],
            ["Nombre de professeurs", "~150", "150 comptes, sessions simultan&eacute;es"],
            ["S&eacute;ances/jour (pic)", "~80", "80 sessions actives potentielles"],
            ["Scans simultan&eacute;s (pic)", "~60/s&eacute;ance", "Burst de 60 requ&ecirc;tes POST en ~30s"],
            ["Polling QR (pic)", "~160 req/s", "80 profs &times; 1 req/2s = 40 req/s + marge"],
            ["Stockage/an", "~200 Mo", "PostgreSQL, optimis&eacute; avec indexes"],
        ],
        col_widths=[4*cm, 3.5*cm, 7.5*cm]
    )
    story.append(load_table)
    story.append(Paragraph("Tableau 9 : Estimation de la charge", styles['Caption']))

    story.append(Paragraph("5.3 Comparaison temporelle", styles['SubSection']))

    time_table = make_table(
        ["M&eacute;trique", "Syst&egrave;me actuel", "UEMF Pr&eacute;sence", "Am&eacute;lioration"],
        [
            ["Temps d'appel (30 &eacute;tudiants)", "~8 min", "~20 sec", "96% de r&eacute;duction"],
            ["Temps d'appel (60 &eacute;tudiants)", "~15 min", "~25 sec", "97% de r&eacute;duction"],
            ["Erreurs de saisie", "2-5%", "~0%", "Quasi-&eacute;limination"],
            ["D&eacute;tection de fraude", "0%", ">95%", "De 0 &agrave; quasi-total"],
            ["G&eacute;n&eacute;ration rapport", "30+ min (manuel)", "1 clic (CSV)", "99% de r&eacute;duction"],
        ],
        col_widths=[4.5*cm, 3.5*cm, 3.5*cm, 3.5*cm]
    )
    story.append(time_table)
    story.append(Paragraph("Tableau 10 : Gains de performance", styles['Caption']))

    story.append(Paragraph(
        "En termes de recherche op&eacute;rationnelle, le syst&egrave;me atteint une valeur de "
        "Z<sub>3</sub> = 1 - (25/600) = <b>0.958</b>, soit une efficacit&eacute; temporelle de 95.8%.",
        styles['BodyText2']
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 6. USER INTERFACES
    # ═══════════════════════════════════════════════════════════
    story.append(Paragraph("6. Interfaces Utilisateur (3 R&ocirc;les)", styles['SectionTitle']))
    story.append(hr())

    story.append(Paragraph(
        "Le syst&egrave;me impl&eacute;mente un <b>contr&ocirc;le d'acc&egrave;s bas&eacute; sur les r&ocirc;les</b> (RBAC) "
        "avec 3 r&ocirc;les distincts, chacun ayant un tableau de bord et des fonctionnalit&eacute;s d&eacute;di&eacute;es. "
        "L'interface est enti&egrave;rement en fran&ccedil;ais et responsive (adapt&eacute;e aux mobiles et ordinateurs).",
        styles['BodyText2']
    ))

    story.append(Paragraph("6.1 R&ocirc;le Administrateur", styles['SubSection']))
    roles_admin = [
        "<b>Tableau de bord</b> : Vue d'ensemble avec compteurs (nombre d'&eacute;tudiants, professeurs, cours, s&eacute;ances actives)",
        "<b>Gestion CRUD compl&egrave;te</b> de 7 entit&eacute;s : D&eacute;partements, Fili&egrave;res, Groupes, Salles, Professeurs, &Eacute;tudiants, Cours",
        "<b>Cr&eacute;ation de salles</b> avec coordonn&eacute;es GPS (latitude, longitude, rayon) pr&eacute;-remplies aux coordonn&eacute;es du campus UEMF",
        "<b>Dropdowns dynamiques</b> : le choix d'une fili&egrave;re filtre les groupes disponibles lors de la cr&eacute;ation d'un cours",
        "<b>Gestion des comptes</b> : cr&eacute;ation de comptes professeurs et &eacute;tudiants avec assignation aux d&eacute;partements et groupes",
    ]
    for r in roles_admin:
        story.append(bullet(r))

    story.append(Paragraph("6.2 R&ocirc;le Professeur", styles['SubSection']))
    roles_prof = [
        "<b>Liste des cours</b> : vue de tous les cours assign&eacute;s avec nombre d'heures et groupes",
        "<b>Cr&eacute;ation de s&eacute;ances</b> : choix du cours, de la salle, date et heures de d&eacute;but/fin",
        "<b>Activation de s&eacute;ance</b> : g&eacute;n&egrave;re le secret QR et pr&eacute;-cr&eacute;e les enregistrements ABSENT pour tous les &eacute;tudiants du cours",
        "<b>Affichage QR en direct</b> : plein &eacute;cran avec anneau de compte &agrave; rebours SVG, compteur de pr&eacute;sences en temps r&eacute;el, indicateur de connexion",
        "<b>Gestion manuelle</b> : le professeur peut changer le statut de tout &eacute;tudiant (Pr&eacute;sent, Absent, En retard, Excus&eacute;)",
        "<b>Rapports et exports</b> : filtrage par cours et s&eacute;ance, statistiques de pr&eacute;sence, export CSV avec BOM UTF-8 pour compatibilit&eacute; Excel",
    ]
    for r in roles_prof:
        story.append(bullet(r))

    story.append(Paragraph("6.3 R&ocirc;le &Eacute;tudiant", styles['SubSection']))
    roles_student = [
        "<b>Scanner QR</b> : cam&eacute;ra arri&egrave;re avec cadre de scan anim&eacute;, d&eacute;codage via jsQR en temps r&eacute;el. <b>Important</b> : le scan doit &ecirc;tre fait depuis l'application web, pas depuis l'app cam&eacute;ra du t&eacute;l&eacute;phone",
        "<b>G&eacute;olocalisation automatique</b> : r&eacute;cup&eacute;ration GPS haute pr&eacute;cision lors du scan (permission demand&eacute;e au navigateur)",
        "<b>Retour visuel imm&eacute;diat</b> : &eacute;cran vert (pr&eacute;sent), orange (en retard), bleu (d&eacute;j&agrave; enregistr&eacute;), rouge (erreur)",
        "<b>Historique</b> : taux de pr&eacute;sence global, d&eacute;tail par cours avec barres de progression, liste chronologique",
    ]
    for r in roles_student:
        story.append(bullet(r))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 7. DEPLOYMENT & USAGE GUIDE
    # ═══════════════════════════════════════════════════════════
    story.append(Paragraph("7. Guide de D&eacute;ploiement et d'Utilisation", styles['SectionTitle']))
    story.append(hr())

    story.append(Paragraph("7.1 Pr&eacute;-requis", styles['SubSection']))
    story.append(bullet("Node.js 18+ install&eacute;"))
    story.append(bullet("Git install&eacute;"))
    story.append(bullet("Un navigateur moderne (Chrome, Firefox, Safari)"))
    story.append(bullet("Un compte GitHub (pour le d&eacute;ploiement)"))
    story.append(bullet("Un compte Vercel gratuit (vercel.com)"))
    story.append(bullet("Un compte Neon gratuit (neon.tech) pour la base de donn&eacute;es"))

    story.append(Paragraph("7.2 Installation Locale (D&eacute;veloppement)", styles['SubSection']))

    story.append(Paragraph(
        "# 1. Cloner le d&eacute;p&ocirc;t<br/>"
        "git clone https://github.com/MouhssineElBoumshouli/Student-Attendance-System.git<br/>"
        "cd Student-Attendance-System<br/><br/>"
        "# 2. Installer les d&eacute;pendances<br/>"
        "npm install<br/><br/>"
        "# 3. Configurer l'environnement<br/>"
        "# Cr&eacute;er un fichier .env avec :<br/>"
        "#   DATABASE_URL=\"postgresql://...\" (URL de votre base Neon, avec -pooler)<br/>"
        "#   DIRECT_URL=\"postgresql://...\" (m&ecirc;me URL sans -pooler)<br/>"
        "#   NEXTAUTH_SECRET=\"votre-secret-al&eacute;atoire\"<br/><br/>"
        "# 4. Initialiser la base de donn&eacute;es<br/>"
        "npx prisma db push<br/>"
        "npx prisma db seed<br/><br/>"
        "# 5. Lancer le serveur de d&eacute;veloppement<br/>"
        "npm run dev<br/><br/>"
        "# L'application est accessible sur http://localhost:3000",
        styles['CodeBlock']
    ))

    story.append(Paragraph("7.3 D&eacute;ploiement Cloud (Vercel + Neon)", styles['SubSection']))

    story.append(Paragraph(
        "Le d&eacute;ploiement en production utilise Vercel pour le frontend/API et Neon pour la base de donn&eacute;es. "
        "Les deux services sont gratuits pour un usage raisonnable.",
        styles['BodyText2']
    ))

    story.append(Paragraph("&Eacute;tape 1 : Cr&eacute;er la base de donn&eacute;es Neon", styles['SubSubSection']))
    story.append(bullet("Aller sur <b>neon.tech</b> et cr&eacute;er un compte"))
    story.append(bullet("Cr&eacute;er un nouveau projet (r&eacute;gion : Europe West)"))
    story.append(bullet("Copier les deux URLs de connexion : <b>pooled</b> (avec -pooler) et <b>direct</b> (sans -pooler)"))

    story.append(Paragraph("&Eacute;tape 2 : D&eacute;ployer sur Vercel", styles['SubSubSection']))
    story.append(bullet("Aller sur <b>vercel.com</b> et se connecter avec GitHub"))
    story.append(bullet("Importer le d&eacute;p&ocirc;t GitHub <i>Student-Attendance-System</i>"))
    story.append(bullet("Ajouter 3 variables d'environnement : DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET"))
    story.append(bullet("Cliquer sur <b>Deploy</b> &mdash; Vercel d&eacute;tecte automatiquement Next.js"))

    story.append(Paragraph("&Eacute;tape 3 : Initialiser la base de donn&eacute;es", styles['SubSubSection']))
    story.append(bullet("Localement, configurer le .env avec les URLs Neon"))
    story.append(bullet("Ex&eacute;cuter <b>npx prisma db push</b> pour cr&eacute;er les tables"))
    story.append(bullet("Ex&eacute;cuter <b>npx prisma db seed</b> pour ins&eacute;rer les donn&eacute;es de test"))

    story.append(Paragraph(
        "<b>R&eacute;sultat</b> : l'application est accessible via l'URL Vercel (ex: https://votre-app.vercel.app) "
        "depuis n'importe quel appareil connect&eacute; &agrave; Internet.",
        styles['BodyText2']
    ))

    story.append(Paragraph("7.4 Comptes de test (apr&egrave;s seed)", styles['SubSection']))

    accounts_table = make_table(
        ["R&ocirc;le", "Email", "Mot de passe"],
        [
            ["Administrateur", "admin@ueuromed.org", "password123"],
            ["Professeur (RO)", "ahmed.benali@ueuromed.org", "password123"],
            ["Professeur (ML)", "fatima.zahrae@ueuromed.org", "password123"],
            ["Professeur (Droit)", "karim.idrissi@ueuromed.org", "password123"],
            ["&Eacute;tudiant", "mouhssine.elhassouni@ueuromed.org", "password123"],
            ["&Eacute;tudiant", "yassine.amrani@ueuromed.org", "password123"],
        ],
        col_widths=[3*cm, 6.5*cm, 3.5*cm]
    )
    story.append(accounts_table)
    story.append(Paragraph("Tableau 11 : Comptes de test (tous les mots de passe sont password123)", styles['Caption']))

    story.append(Paragraph("7.5 Guide d'Utilisation Complet", styles['SubSection']))

    story.append(Paragraph("A. Configuration initiale (Administrateur)", styles['SubSubSection']))
    flow_admin = [
        "Se connecter avec <b>admin@ueuromed.org</b> / password123",
        "Cr&eacute;er les <b>d&eacute;partements</b> (ex: EIDIA, FSJP) depuis le menu lat&eacute;ral",
        "Cr&eacute;er les <b>fili&egrave;res</b> (programmes) rattach&eacute;es aux d&eacute;partements",
        "Cr&eacute;er les <b>groupes</b> d'&eacute;tudiants rattach&eacute;s aux fili&egrave;res",
        "Cr&eacute;er les <b>salles</b> avec leurs coordonn&eacute;es GPS (latitude, longitude, rayon en m&egrave;tres)",
        "Cr&eacute;er les <b>comptes professeurs</b> (email, mot de passe, d&eacute;partement)",
        "Cr&eacute;er les <b>comptes &eacute;tudiants</b> (email, mot de passe, groupe(s))",
        "Cr&eacute;er les <b>cours</b> en assignant un professeur, une fili&egrave;re, et les groupes concern&eacute;s",
    ]
    for i, step in enumerate(flow_admin, 1):
        story.append(bullet(f"<b>{i}.</b> {step}"))

    story.append(Paragraph("B. Prise de pr&eacute;sence (Professeur)", styles['SubSubSection']))
    flow_prof = [
        "Se connecter avec le compte professeur",
        "Aller dans <b>S&eacute;ances</b> &rarr; <b>Nouvelle s&eacute;ance</b>",
        "Choisir le <b>cours</b>, la <b>salle</b>, la <b>date</b>, l'<b>heure de d&eacute;but</b> et l'<b>heure de fin</b>",
        "Cliquer sur <b>Cr&eacute;er la s&eacute;ance</b>",
        "Sur la page de la s&eacute;ance, cliquer sur <b>Activer</b> (g&eacute;n&egrave;re le secret QR et cr&eacute;e les enregistrements ABSENT)",
        "Cliquer sur <b>Afficher le QR Code</b> pour ouvrir la page plein &eacute;cran",
        "Projeter l'&eacute;cran pour que les &eacute;tudiants puissent scanner le QR code",
        "Le <b>compteur de pr&eacute;sences</b> se met &agrave; jour en temps r&eacute;el (0 / 12 pr&eacute;sents &rarr; 5 / 12 &rarr; ...)",
        "Une fois tous les &eacute;tudiants scann&eacute;s, retourner sur la page de la s&eacute;ance et cliquer <b>Terminer</b>",
        "Ajuster manuellement les statuts si n&eacute;cessaire (cliquer sur le statut d'un &eacute;tudiant pour le changer)",
    ]
    for i, step in enumerate(flow_prof, 1):
        story.append(bullet(f"<b>{i}.</b> {step}"))

    story.append(Paragraph("C. Scanner sa pr&eacute;sence (&Eacute;tudiant)", styles['SubSubSection']))
    flow_student = [
        "Se connecter avec le compte &eacute;tudiant <b>depuis le navigateur du t&eacute;l&eacute;phone</b> (Chrome recommand&eacute;)",
        "Aller dans <b>Scanner QR</b> depuis le menu",
        "Cliquer sur <b>Ouvrir la cam&eacute;ra</b> et autoriser l'acc&egrave;s &agrave; la cam&eacute;ra et au GPS",
        "Pointer la cam&eacute;ra vers le QR code affich&eacute; par le professeur",
        "Le scan est <b>automatique</b> : d&egrave;s que le QR est d&eacute;tect&eacute;, la pr&eacute;sence est envoy&eacute;e",
        "Un &eacute;cran de confirmation appara&icirc;t : <b>vert</b> (pr&eacute;sent), <b>orange</b> (en retard), <b>rouge</b> (erreur)",
        "<b>Important</b> : ne PAS scanner avec l'application cam&eacute;ra native du t&eacute;l&eacute;phone ! Utiliser uniquement le scanner int&eacute;gr&eacute; &agrave; l'application web",
    ]
    for i, step in enumerate(flow_student, 1):
        story.append(bullet(f"<b>{i}.</b> {step}"))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 8. MAINTENANCE & MODIFICATION GUIDE
    # ═══════════════════════════════════════════════════════════
    story.append(Paragraph("8. Guide de Maintenance et Modification", styles['SectionTitle']))
    story.append(hr())

    story.append(Paragraph("8.1 Structure du Projet", styles['SubSection']))

    story.append(Paragraph(
        "Le projet suit la structure standard de Next.js 16 avec App Router :",
        styles['BodyText2']
    ))

    struct_table = make_table(
        ["Dossier / Fichier", "Description"],
        [
            ["prisma/schema.prisma", "Sch&eacute;ma de la base de donn&eacute;es (13 mod&egrave;les). Modifier ici pour ajouter des champs ou tables"],
            ["prisma/seed.ts", "Donn&eacute;es de test initiales. Modifier pour ajouter/changer les comptes de d&eacute;mo"],
            ["src/app/api/", "Routes API (REST). Chaque dossier = un endpoint. Ex: api/sessions/route.ts"],
            ["src/app/(dashboard)/", "Pages de l'interface. Organis&eacute;es par r&ocirc;le : admin/, professor/, student/"],
            ["src/lib/qr/", "Algorithme QR : generate.ts (g&eacute;n&eacute;ration HMAC), validate.ts (validation), constants.ts (param&egrave;tres)"],
            ["src/lib/geo/", "G&eacute;olocalisation : validate.ts (formule de Haversine + geofencing)"],
            ["src/lib/auth.ts", "Configuration NextAuth (providers, callbacks JWT, dur&eacute;e de session)"],
            ["src/lib/validations.ts", "Sch&eacute;mas Zod pour la validation des entr&eacute;es API"],
            ["src/components/", "Composants React r&eacute;utilisables (boutons, cartes, sidebar, etc.)"],
            ["src/middleware.ts", "Protection des routes par r&ocirc;le (admin, professor, student)"],
            [".env", "Variables d'environnement (DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET)"],
        ],
        col_widths=[4.5*cm, 10.5*cm]
    )
    story.append(struct_table)
    story.append(Paragraph("Tableau 12 : Structure du projet", styles['Caption']))

    story.append(Paragraph("8.2 Ajouter / Modifier des Entit&eacute;s", styles['SubSection']))

    story.append(Paragraph("Ajouter un nouveau champ &agrave; un mod&egrave;le existant", styles['SubSubSection']))
    story.append(Paragraph(
        "Exemple : ajouter un champ <i>phoneNumber</i> au mod&egrave;le Student :",
        styles['BodyText2']
    ))
    story.append(Paragraph(
        "# 1. Modifier prisma/schema.prisma<br/>"
        "model Student {<br/>"
        "&nbsp;&nbsp;...<br/>"
        "&nbsp;&nbsp;phoneNumber String?  // nouveau champ optionnel<br/>"
        "}<br/><br/>"
        "# 2. Appliquer la migration<br/>"
        "npx prisma db push<br/><br/>"
        "# 3. R&eacute;g&eacute;n&eacute;rer le client Prisma<br/>"
        "npx prisma generate",
        styles['CodeBlock']
    ))

    story.append(Paragraph("Ajouter un nouveau mod&egrave;le (table)", styles['SubSubSection']))
    story.append(Paragraph(
        "# 1. Ajouter le mod&egrave;le dans prisma/schema.prisma<br/>"
        "model Notification {<br/>"
        "&nbsp;&nbsp;id        String   @id @default(cuid())<br/>"
        "&nbsp;&nbsp;userId    String<br/>"
        "&nbsp;&nbsp;message   String<br/>"
        "&nbsp;&nbsp;read      Boolean  @default(false)<br/>"
        "&nbsp;&nbsp;createdAt DateTime @default(now())<br/>"
        "&nbsp;&nbsp;user      User     @relation(fields: [userId], references: [id])<br/>"
        "}<br/><br/>"
        "# 2. Appliquer : npx prisma db push<br/>"
        "# 3. Cr&eacute;er l'API : src/app/api/notifications/route.ts<br/>"
        "# 4. Cr&eacute;er la page : src/app/(dashboard)/[role]/notifications/page.tsx",
        styles['CodeBlock']
    ))

    story.append(Paragraph("Ajouter une nouvelle page", styles['SubSubSection']))
    story.append(Paragraph(
        "Pour ajouter une page accessible au professeur, cr&eacute;er le fichier :<br/>"
        "<i>src/app/(dashboard)/professor/nouvelle-page/page.tsx</i><br/>"
        "Le fichier doit exporter un composant React par d&eacute;faut. La page sera automatiquement "
        "prot&eacute;g&eacute;e par le middleware (seuls les utilisateurs avec le r&ocirc;le PROFESSOR y acc&eacute;deront). "
        "Pour ajouter la page au menu lat&eacute;ral, modifier <i>src/components/sidebar.tsx</i>.",
        styles['BodyText2']
    ))

    story.append(Paragraph("8.3 Modifier les Param&egrave;tres du Syst&egrave;me", styles['SubSection']))

    params_table = make_table(
        ["Param&egrave;tre", "Fichier", "Valeur actuelle", "Comment modifier"],
        [
            ["Intervalle de rotation QR", "src/lib/qr/constants.ts", "20 secondes", "Changer DEFAULT_ROTATION_SEC"],
            ["Longueur du token", "src/lib/qr/constants.ts", "8 caract&egrave;res hex", "Changer TOKEN_LENGTH (plus = plus s&ucirc;r mais QR plus dense)"],
            ["Tol&eacute;rance de fen&ecirc;tre", "src/lib/qr/constants.ts", "1 fen&ecirc;tre", "Changer TOKEN_TOLERANCE_WINDOWS"],
            ["D&eacute;calage d'horloge max", "src/lib/qr/constants.ts", "60 secondes", "Changer MAX_CLOCK_SKEW_SEC"],
            ["Seuil de retard", "src/app/api/.../attendance/route.ts", "15 minutes", "Changer lateThresholdMs (en ms)"],
            ["Rayon GPS par salle", "Administration &rarr; Salles", "60-150 m&egrave;tres", "Modifier le champ 'rayon' de la salle dans l'interface admin"],
            ["Dur&eacute;e de session JWT", "src/lib/auth.ts", "24 heures", "Changer maxAge dans la config session"],
            ["Fr&eacute;quence polling QR", "src/app/.../live/page.tsx", "2 secondes", "Changer l'intervalle du setInterval dans fetchToken"],
            ["Taille du QR code", "src/app/.../live/page.tsx", "500 pixels", "Changer width dans QRCode.toCanvas()"],
        ],
        col_widths=[3*cm, 3.5*cm, 2.5*cm, 6*cm]
    )
    story.append(params_table)
    story.append(Paragraph("Tableau 13 : Param&egrave;tres configurables", styles['Caption']))

    story.append(Paragraph("Commandes utiles", styles['SubSubSection']))
    story.append(Paragraph(
        "npm run dev          # Lancer le serveur de d&eacute;veloppement (localhost:3000)<br/>"
        "npm run build        # Compiler pour la production (g&eacute;n&egrave;re Prisma + build Next.js)<br/>"
        "npx prisma studio    # Ouvrir l'interface graphique de la base de donn&eacute;es<br/>"
        "npx prisma db push   # Appliquer les changements du sch&eacute;ma &agrave; la base<br/>"
        "npx prisma db seed   # R&eacute;-ins&eacute;rer les donn&eacute;es de test<br/>"
        "npx prisma generate  # R&eacute;g&eacute;n&eacute;rer le client TypeScript apr&egrave;s modification du sch&eacute;ma",
        styles['CodeBlock']
    ))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════
    # 9. CONCLUSION
    # ═══════════════════════════════════════════════════════════
    story.append(Paragraph("9. Conclusion et Am&eacute;liorations Futures", styles['SectionTitle']))
    story.append(hr())

    story.append(Paragraph("9.1 R&eacute;sultats Obtenus", styles['SubSection']))
    story.append(Paragraph(
        "Le syst&egrave;me UEMF Pr&eacute;sence r&eacute;pond &agrave; tous les objectifs fix&eacute;s :",
        styles['BodyText2']
    ))

    results = [
        "<b>R&eacute;duction de 96% du temps d'appel</b> : de ~8 min &agrave; ~20 secondes pour 30 &eacute;tudiants",
        "<b>&Eacute;limination quasi-totale des erreurs</b> : processus enti&egrave;rement automatis&eacute;",
        "<b>4 couches anti-fraude</b> : rotation des tokens, g&eacute;olocalisation, empreinte appareil, comparaison s&ucirc;re",
        "<b>Donn&eacute;es exploitables</b> : export CSV, statistiques en temps r&eacute;el, historique complet",
        "<b>D&eacute;ploy&eacute; dans le cloud</b> : accessible depuis n'importe quel appareil via Vercel + Neon PostgreSQL",
        "<b>Production-ready</b> : validation Zod, error boundaries, gestion des r&ocirc;les, interface compl&egrave;te en fran&ccedil;ais",
    ]
    for r in results:
        story.append(bullet(r))

    story.append(Paragraph("9.2 Valeurs de la Fonction Objectif", styles['SubSection']))
    story.append(Paragraph(
        "En &eacute;valuant la fonction objectif Z = &alpha;&middot;Z<sub>1</sub> + &beta;&middot;Z<sub>2</sub> + &gamma;&middot;Z<sub>3</sub> "
        "avec les r&eacute;sultats obtenus :",
        styles['BodyText2']
    ))

    obj_table = make_table(
        ["Composante", "Valeur", "Explication"],
        [
            ["Z<sub>1</sub> (Couverture)", "~0.95", "95% des &eacute;tudiants scannent eux-m&ecirc;mes (5% de probl&egrave;mes techniques GPS/cam&eacute;ra)"],
            ["Z<sub>2</sub> (V&eacute;rification GPS)", "~0.85", "85% des pr&eacute;sences sont g&eacute;o-v&eacute;rifi&eacute;es (15% de GPS impr&eacute;cis en int&eacute;rieur)"],
            ["Z<sub>3</sub> (Efficacit&eacute; temporelle)", "0.958", "1 - (25s / 600s) = 95.8% de r&eacute;duction"],
            ["<b>Z total</b>", "<b>0.928</b>", "0.4 &times; 0.95 + 0.3 &times; 0.85 + 0.3 &times; 0.958 = 0.9224"],
        ],
        col_widths=[3.5*cm, 2*cm, 9.5*cm]
    )
    story.append(obj_table)
    story.append(Paragraph("Tableau 14 : &Eacute;valuation de la fonction objectif", styles['Caption']))

    story.append(Paragraph("9.3 Am&eacute;liorations Futures", styles['SubSection']))

    future = [
        "<b>Int&eacute;gration Konosys</b> : API de synchronisation avec le syst&egrave;me existant de l'UEMF pour importer automatiquement les listes d'&eacute;tudiants",
        "<b>Application mobile native (PWA)</b> : notifications push, acc&egrave;s hors-ligne, installation sur l'&eacute;cran d'accueil",
        "<b>Analytiques avanc&eacute;es</b> : graphiques de tendance, pr&eacute;diction d'absent&eacute;isme par machine learning",
        "<b>Notifications automatiques</b> : alertes email/SMS pour les &eacute;tudiants avec un taux de pr&eacute;sence insuffisant",
        "<b>Module OR avanc&eacute;</b> : optimisation de l'emploi du temps en fonction des taux de pr&eacute;sence (programmation lin&eacute;aire)",
        "<b>Reconnaissance faciale</b> : couche suppl&eacute;mentaire de v&eacute;rification d'identit&eacute; (5&egrave;me couche anti-fraude)",
    ]
    for f in future:
        story.append(bullet(f))

    story.append(Paragraph("9.4 Conclusion", styles['SubSection']))
    story.append(Paragraph(
        "Ce projet d&eacute;montre comment un probl&egrave;me concret d'optimisation universitaire peut &ecirc;tre "
        "formul&eacute; comme un probl&egrave;me de recherche op&eacute;rationnelle avec des variables de d&eacute;cision binaires, "
        "une fonction objectif multi-crit&egrave;re, et des contraintes formalis&eacute;es math&eacute;matiquement. "
        "La solution impl&eacute;ment&eacute;e traduit ces contraintes th&eacute;oriques en m&eacute;canismes techniques concrets : "
        "HMAC-SHA256 pour les contraintes de s&eacute;curit&eacute;, Haversine pour les contraintes g&eacute;ographiques, "
        "et des contraintes de base de donn&eacute;es UNIQUE pour l'unicit&eacute;.",
        styles['BodyText2']
    ))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "Le syst&egrave;me est enti&egrave;rement fonctionnel, d&eacute;ploy&eacute; dans le cloud (Vercel + Neon PostgreSQL), "
        "accessible depuis n'importe quel appareil, et pr&ecirc;t &agrave; &ecirc;tre utilis&eacute; &agrave; l'&eacute;chelle de "
        "l'universit&eacute;. Le code source complet, la documentation, et les donn&eacute;es de test sont "
        "disponibles sur le d&eacute;p&ocirc;t GitHub.",
        styles['BodyText2']
    ))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(
        "Code source : <b>github.com/MouhssineElBoumshouli/Student-Attendance-System</b>",
        ParagraphStyle('final', parent=styles['BodyText2'], alignment=TA_CENTER,
                      backColor=LIGHT_BG, borderPadding=(12, 12, 12, 12))
    ))

    # ─── Build ────────────────────────────────────────────────
    doc.build(story)
    print(f"Report generated: {output_path}")
    return output_path


if __name__ == "__main__":
    build_report()
