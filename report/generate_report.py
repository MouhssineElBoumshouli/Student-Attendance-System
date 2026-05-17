#!/usr/bin/env python3
"""
UEMF Présence — rapport de défense du projet RO.

Document de préparation à la soutenance orale. Pour chaque choix
technique majeur, on défend la décision avec :
  - le choix concret (1 ligne)
  - 3 raisons motivées
  - les alternatives écartées avec leur raison de rejet
  - 1 ou 2 questions probables du jury + réponses modèles

Génération :
    python report/generate_report.py
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

INK = HexColor("#0d0d0d")
ACCENT = HexColor("#c0392b")
ACCENT2 = HexColor("#2c3e7a")
GOLD = HexColor("#d4a017")
GREEN = HexColor("#27ae60")
PURPLE = HexColor("#6b3d8a")
MUTED = HexColor("#7a7065")
CARD_BG = HexColor("#faf6ee")
BORDER = HexColor("#d0c8b8")
QA_BG = HexColor("#f6f1e8")
TRADEOFF_BG = HexColor("#fdf6e7")

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
                      fontSize=20, leading=26, textColor=INK,
                      spaceBefore=18, spaceAfter=10))
ss.add(ParagraphStyle(name="H2", fontName="Helvetica-Bold",
                      fontSize=14, leading=20, textColor=ACCENT2,
                      spaceBefore=14, spaceAfter=6))

ss.add(ParagraphStyle(name="uBody", fontName="Helvetica",
                      fontSize=10, leading=15, textColor=INK,
                      alignment=TA_JUSTIFY, spaceAfter=8))
ss.add(ParagraphStyle(name="uMuted", parent=ss["uBody"], textColor=MUTED))

ss.add(ParagraphStyle(name="uBullet", fontName="Helvetica",
                      fontSize=10, leading=14, textColor=INK,
                      leftIndent=18, bulletIndent=6, spaceAfter=3))

ss.add(ParagraphStyle(name="dNum", fontName="Helvetica-Bold",
                      fontSize=9, leading=12, textColor=ACCENT2,
                      spaceAfter=2))
ss.add(ParagraphStyle(name="dTitle", fontName="Helvetica-Bold",
                      fontSize=14, leading=18, textColor=INK,
                      spaceAfter=4))
ss.add(ParagraphStyle(name="dChoice", fontName="Helvetica",
                      fontSize=10, leading=14, textColor=MUTED,
                      spaceAfter=6))
ss.add(ParagraphStyle(name="dSectionLabel", fontName="Helvetica-Bold",
                      fontSize=8.5, leading=11, textColor=ACCENT,
                      spaceBefore=8, spaceAfter=4))
ss.add(ParagraphStyle(name="dReason", fontName="Helvetica",
                      fontSize=9.5, leading=13, textColor=INK,
                      leftIndent=16, bulletIndent=4, spaceAfter=3))
ss.add(ParagraphStyle(name="dAltName", fontName="Helvetica-Bold",
                      fontSize=9, leading=12, textColor=ACCENT))
ss.add(ParagraphStyle(name="dAltText", fontName="Helvetica",
                      fontSize=9, leading=12, textColor=INK))
ss.add(ParagraphStyle(name="dQuestion", fontName="Helvetica-Bold",
                      fontSize=9.5, leading=13, textColor=PURPLE,
                      spaceBefore=6, spaceAfter=2))
ss.add(ParagraphStyle(name="dAnswer", fontName="Helvetica",
                      fontSize=9.5, leading=13, textColor=INK,
                      spaceAfter=4))

ss.add(ParagraphStyle(name="uDefBody", fontName="Helvetica",
                      fontSize=9.5, leading=14, textColor=INK,
                      leftIndent=8, rightIndent=8,
                      borderPadding=(8, 10, 8, 10),
                      backColor=HexColor("#eef3fa"),
                      spaceBefore=4, spaceAfter=10))

ss.add(ParagraphStyle(name="THeader", fontName="Helvetica-Bold",
                      fontSize=9, leading=12, textColor=white,
                      alignment=TA_LEFT))
ss.add(ParagraphStyle(name="TCell", fontName="Helvetica",
                      fontSize=9, leading=12, textColor=INK,
                      alignment=TA_LEFT))

ss.add(ParagraphStyle(name="qaNum", fontName="Helvetica-Bold",
                      fontSize=9, leading=12, textColor=PURPLE,
                      spaceAfter=2))
ss.add(ParagraphStyle(name="qaQ", fontName="Helvetica-Bold",
                      fontSize=11, leading=15, textColor=INK,
                      spaceAfter=4))
ss.add(ParagraphStyle(name="qaA", fontName="Helvetica",
                      fontSize=10, leading=14, textColor=INK,
                      spaceAfter=4))


def hr():
    return HRFlowable(width="100%", thickness=0.5, color=BORDER,
                      spaceBefore=6, spaceAfter=10)


def bul(text):
    return Paragraph(f"<bullet>&bull;</bullet> {text}", ss["uBullet"])


def decision_card(num, title, choice, reasons, alternatives, qa,
                  tradeoff=None):
    flow = []
    flow.append(Paragraph(f"DÉCISION N°{num}", ss["dNum"]))
    flow.append(Paragraph(title, ss["dTitle"]))
    flow.append(Paragraph(
        f"Notre choix : <b><font color='#27ae60'>{choice}</font></b>",
        ss["dChoice"]))
    flow.append(HRFlowable(width="100%", thickness=0.3, color=BORDER,
                            spaceBefore=2, spaceAfter=6))
    flow.append(Paragraph("POURQUOI CE CHOIX", ss["dSectionLabel"]))
    for i, r in enumerate(reasons, 1):
        flow.append(Paragraph(f"<b>{i}.</b> {r}", ss["dReason"]))

    if alternatives:
        flow.append(Paragraph("CE QU'ON A ÉCARTÉ", ss["dSectionLabel"]))
        for name, rej in alternatives:
            t = Table(
                [[Paragraph(f"x {name}", ss["dAltName"]),
                  Paragraph(rej, ss["dAltText"])]],
                colWidths=[3.8 * cm, 11 * cm])
            t.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("LINEBELOW", (0, 0), (-1, -1), 0.2, HexColor("#e8e2d3")),
            ]))
            flow.append(t)

    if tradeoff:
        tt = Table([[Paragraph(
            f"<b>Trade-off accepté :</b> {tradeoff}", ss["dAltText"])]],
            colWidths=[14.8 * cm])
        tt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), TRADEOFF_BG),
            ("LINEBEFORE", (0, 0), (0, -1), 2, GOLD),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]))
        flow.append(Spacer(1, 6))
        flow.append(tt)

    if qa:
        qa_inner = [Paragraph("QUESTIONS PROBABLES DU JURY",
                              ss["dSectionLabel"])]
        for q, a in qa:
            qa_inner.append(Paragraph(
                f"<font color='#c0392b'><b>Q.</b></font> {q}",
                ss["dQuestion"]))
            qa_inner.append(Paragraph(
                f"<font color='#27ae60'><b>R.</b></font> {a}",
                ss["dAnswer"]))
        qa_tbl = Table([[qa_inner]], colWidths=[14.8 * cm])
        qa_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), QA_BG),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ]))
        flow.append(Spacer(1, 4))
        flow.append(qa_tbl)

    wrapper = Table([[flow]], colWidths=[15.6 * cm])
    wrapper.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), white),
        ("LINEBEFORE", (0, 0), (0, -1), 4, ACCENT2),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
    ]))
    return KeepTogether([Spacer(1, 4), wrapper, Spacer(1, 6)])


def qa_bank_item(num, label, question, answer):
    inner = [
        Paragraph(f"Q{num} - {label}".upper(), ss["qaNum"]),
        Paragraph(question, ss["qaQ"]),
        Paragraph(answer, ss["qaA"]),
    ]
    t = Table([[inner]], colWidths=[15.6 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), white),
        ("LINEABOVE", (0, 0), (-1, 0), 2, PURPLE),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    return KeepTogether([Spacer(1, 2), t, Spacer(1, 4)])


def make_table(headers, rows, col_widths):
    header_row = [Paragraph(h, ss["THeader"]) for h in headers]
    data = [header_row] + [[Paragraph(str(c), ss["TCell"]) for c in r]
                           for r in rows]
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("TOPPADDING", (0, 0), (-1, 0), 7),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, CARD_BG]),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
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
                      "UEMF Présence — Défense du projet RO")
    canvas.drawRightString(A4[0] - 2.2 * cm, 1.2 * cm, f"p. {doc.page}")
    canvas.restoreState()


# Math notation helpers — produce HTML markup that Helvetica can render
def Zsub(n):
    return f"Z<sub>{n}</sub>"


def build_report():
    out = os.path.join(os.path.dirname(__file__),
                       "UEMF_Presence_Rapport_RO.pdf")
    doc = SimpleDocTemplate(
        out, pagesize=A4,
        leftMargin=2.2 * cm, rightMargin=2.2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
        title="UEMF Présence — Défense du projet RO",
        author="Mouhssine El Boumshouli",
    )
    s = []

    # ═══ COVER ═══
    s.append(Spacer(1, 4.5 * cm))
    s.append(Paragraph("MODULE - RECHERCHE OPÉRATIONNELLE", ss["CoverBadge"]))
    s.append(Spacer(1, 1.5 * cm))
    s.append(Paragraph("UEMF Présence", ss["CoverTitle"]))
    s.append(Spacer(1, 0.3 * cm))
    s.append(Paragraph("Défense du projet", ss["CoverSub"]))
    s.append(Spacer(1, 0.5 * cm))
    s.append(Paragraph(
        "Document de préparation à la soutenance orale.<br/>"
        "Chaque choix technique est justifié, comparé aux alternatives, et "
        "accompagné des questions probables avec leurs réponses modèles.",
        ParagraphStyle("cs", parent=ss["uBody"],
                       alignment=TA_CENTER, fontSize=11, leading=15)))
    s.append(Spacer(1, 3 * cm))

    info_rows = [
        ("Étudiant", "Mouhssine El Boumshouli"),
        ("Encadrant", "Pr Ahmed El Hilali Alaoui"),
        ("Formation", "EIDIA — UEMF, Semestre 5"),
        ("Année", "2025–2026"),
        ("Stack", "Next.js 16 · React 19 · TypeScript · "
                  "Prisma 6 · PostgreSQL (Neon) · NextAuth · Vercel"),
        ("Code source", "github.com/MouhssineElBoumshouli/Student-Attendance-System"),
    ]
    info_tbl = Table(
        [[Paragraph(f"<b>{k}</b>", ss["TCell"]),
          Paragraph(v, ss["TCell"])] for k, v in info_rows],
        colWidths=[4 * cm, 11.5 * cm])
    info_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
    ]))
    s.append(info_tbl)
    s.append(PageBreak())

    # ═══ TOC ═══
    s.append(Paragraph("Table des matières", ss["H1"]))
    s.append(hr())
    toc = [
        ("§ 1", "Cadre du projet"),
        ("§ 2", "Pourquoi c'est de la Recherche Opérationnelle"),
        ("§ 3", "Décisions d'architecture (n°1 à n°5)"),
        ("§ 4", "Décisions sur la base de données (n°6 à n°8)"),
        ("§ 5", "Décisions de sécurité (n°9 à n°12)"),
        ("§ 6", "Décisions sur le QR rotatif (n°13 à n°17)"),
        ("§ 7", "Décisions de géolocalisation (n°18 à n°20)"),
        ("§ 8", "Architecture anti-fraude (défense en profondeur)"),
        ("§ 9", "Décisions de modélisation RO (n°21 à n°22)"),
        ("§ 10", "Banque de 20 questions probables du jury"),
        ("§ 11", "Glossaire express"),
    ]
    toc_tbl = Table(
        [[Paragraph(f"<b>{n}</b>", ss["uBody"]),
          Paragraph(t, ss["uBody"])] for n, t in toc],
        colWidths=[2 * cm, 13.5 * cm])
    toc_tbl.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    s.append(toc_tbl)
    s.append(PageBreak())

    # ═══ § 1 — CADRE ═══
    s.append(Paragraph("§ 1 — Le problème en deux phrases", ss["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "À l'UEMF, la prise de présence se fait à l'oral, étudiant par "
        "étudiant, via Konosys. Pour une promotion de 30 à 60, ça prend 5 à "
        "15 minutes par séance, c'est sujet à erreur, et un voisin peut "
        "répondre « présent » pour un absent sans conséquence.", ss["uBody"]))
    s.append(Paragraph(
        "Notre projet remplace ce processus par un <b>QR code rotatif</b> "
        "que le professeur affiche en classe et que les étudiants scannent "
        "depuis leur smartphone. Le système vérifie automatiquement : "
        "identité (compte connecté), validité du QR (cryptographie), "
        "présence physique (GPS), unicité de l'appareil (empreinte "
        "numérique). Temps de prise : <b>15 à 30 secondes</b>.", ss["uBody"]))
    s.append(Paragraph(
        "<b>Pourquoi c'est de la RO :</b> on modélise la prise de présence "
        "comme un problème d'optimisation combinatoire — pour chaque couple "
        "(étudiant, séance), une variable binaire x<sub>ij</sub> ∈ {0, 1} "
        f"indique la présence. On maximise une fonction objectif multi-critère "
        f"(Z = α·{Zsub(1)} + β·{Zsub(2)} + γ·{Zsub(3)}) sous cinq familles de "
        "contraintes. C'est le cadre RO canonique : variables / objectif / "
        "contraintes.", ss["uDefBody"]))
    s.append(PageBreak())

    # ═══ § 2 — POURQUOI RO ═══
    s.append(Paragraph("§ 2 — Pourquoi c'est de la RO", ss["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "Première question probable du jury : « <i>Pourquoi est-ce un projet "
        "de Recherche Opérationnelle et pas un simple projet d'ingénierie "
        "logicielle ?</i> » La réponse est dans la nature mathématique du "
        "problème.", ss["uBody"]))

    s.append(Paragraph("Les trois preuves", ss["H2"]))
    s.append(bul(
        "<b>Variables de décision discrètes.</b> Pour chaque (étudiant, "
        "séance), une décision binaire. Avec 201 étudiants × 100 séances = "
        "<b>20 100 variables binaires</b> à fixer. Cadre classique "
        "d'optimisation combinatoire."))
    s.append(bul(
        f"<b>Fonction objectif quantifiable.</b> Z = α·{Zsub(1)} + β·{Zsub(2)} "
        f"+ γ·{Zsub(3)} avec {Zsub(1)} = couverture, {Zsub(2)} = vérification, "
        f"{Zsub(3)} = efficacité. Grandeurs mesurables, comparables."))
    s.append(bul(
        "<b>Contraintes mathématiquement explicites.</b> Cinq familles "
        "(unicité, temporel, géographique, cryptographique, appareil) avec "
        "formulation algébrique et traduction code vérifiable."))

    s.append(Paragraph(
        "<b>Pourquoi multi-critère ?</b> La « qualité » d'un système de "
        "présence n'est pas une grandeur unique. Si on optimisait seulement "
        "la rapidité, on supprimerait les vérifications. Si on optimisait "
        "seulement la sécurité, ce serait trop lent. La <b>scalarisation "
        "pondérée</b> est la méthode standard pour ramener un problème "
        "multi-objectif à un problème mono-objectif.", ss["uDefBody"]))
    s.append(PageBreak())

    # ═══ § 3 — ARCHITECTURE ═══
    s.append(Paragraph("§ 3 — Décisions d'architecture", ss["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "Cinq décisions structurantes : web vs native, framework, langage, "
        "UI, hébergement.", ss["uBody"]))

    s.append(decision_card(
        1, "Application web (PWA) au lieu d'une app native iOS/Android",
        "application web accessible via le navigateur",
        ["<b>Zéro installation.</b> L'étudiant ouvre une URL. Pas d'App Store.",
         "<b>Une seule base de code.</b> Téléphone et portable lancent le même code. "
         "On évite trois versions (web + Swift iOS + Kotlin Android).",
         "<b>Mises à jour instantanées.</b> Un git push corrige tous les "
         "utilisateurs. Pas de cycle App Store."],
        [("App native iOS + Android",
          "Trois codebases, deux cycles release, frais App Store. "
          "Surcoût injustifiable."),
         ("React Native / Flutter",
          "Reste à packager comme une app. Caméra et GPS déjà disponibles "
          "via API web — bénéfice marginal."),
         ("Application desktop seulement",
          "Le QR doit être scanné par smartphone.")],
        [("Pourquoi pas une app native ? Ce serait plus fluide.",
          "Surcoût pas justifiable. Performances natives pas un goulot "
          "(jsQR à 30fps sur entrée de gamme). Pour prod à grande échelle, "
          "Capacitor envisageable — pas pour un projet académique."),
         ("Et si l'étudiant n'a pas Internet ?",
          "L'app a besoin du réseau pour valider le scan auprès du serveur. "
          "UEMF dispose Wi-Fi + 4G — scénario sans réseau rare. Buffer "
          "offline = piste future.")],
        tradeoff="la caméra exige HTTPS. Gratuit sur Vercel (Let's Encrypt) "
                 "— pas un vrai coût, mais une dépendance à connaître.",
    ))

    s.append(decision_card(
        2, "Next.js 16 (App Router) comme framework full-stack",
        "Next.js — framework React pour front + back dans un seul projet",
        ["<b>Un seul projet pour tout.</b> Front et back cohabitent. "
         "Types TypeScript et helpers partagés.",
         "<b>Rendu hybride.</b> Chaque page choisit son mode : statique, "
         "serveur, ou client. Bonnes performances par cas.",
         "<b>Écosystème Vercel.</b> Next.js construit par Vercel. "
         "Un git push = un déploiement. HTTPS, CDN, serverless par défaut."],
        [("React + Express séparés",
          "Deux projets à synchroniser, duplication de validation."),
         ("Django / Flask (Python)",
          "Excellents en back, mais intégration UI moderne reste manuelle."),
         ("Ruby on Rails",
          "Productif, mais écosystème JS plus dynamique aujourd'hui."),
         ("SvelteKit / Remix / Nuxt",
          "Concurrents directs. Next.js gagne sur l'écosystème.")],
        [("Next.js change vite. Risque pour la maintenance ?",
          "Coût réel. On a directement choisi App Router (API officielle). "
          "Stabilité long terme vient de React."),
         ("Pourquoi pas microservices ?",
          "Pour 201 utilisateurs, surdimensionné. Monolithique plus simple "
          "à raisonner.")],
    ))

    s.append(decision_card(
        3, "TypeScript plutôt que JavaScript",
        "TypeScript — JavaScript avec typage statique vérifié à la compilation",
        ["<b>Erreurs attrapées à l'écriture.</b> Une typo "
         "(<font face='Courier' size='8'>session.user.profesorId</font>) est "
         "signalée immédiatement. En JS pur, ce bug atteindrait l'utilisateur.",
         "<b>Auto-complétion intelligente.</b> L'éditeur propose UNIQUEMENT "
         "les champs qui existent.",
         "<b>Refactoring sûr.</b> Renommer un champ propage l'erreur partout, "
         "immédiatement."],
        [("JavaScript pur",
          "Plus rapide au début, coûte cher à long terme. Aucun garde-fou."),
         ("Flow (Facebook)",
          "Concurrent historique, perdu commercialement."),
         ("JSDoc avec annotations",
          "Typage en commentaires — moins puissant et plus pénible.")],
        [("Le typage à l'exécution n'existe pas en JS. TypeScript ne "
          "sécurise rien au runtime ?",
          "Exact, et c'est pour ça qu'on utilise <b>Zod</b> en complément. "
          "TypeScript vérifie à la compilation, Zod à l'exécution.")],
        tradeoff="étape de compilation TS → JS. Next.js le fait automatiquement.",
    ))

    s.append(decision_card(
        4, "React (via Next.js) comme bibliothèque UI",
        "React 19 — composants réutilisables et mise à jour ciblée",
        ["<b>Standard de fait.</b> Facebook, Netflix, Uber, Airbnb. "
         "Documentation, tutoriels — tout existe.",
         "<b>Virtual DOM.</b> Quand le compteur passe de 7s à 6s, seul ce "
         "nombre est redessiné. Indispensable pour temps réel.",
         "<b>Hooks.</b> Organisent proprement l'état et les effets de bord."],
        [("Vue.js",
          "Excellent, mais écosystème plus petit dans Next.js."),
         ("Angular",
          "Trop lourd pour notre échelle."),
         ("Svelte / Solid",
          "Plus performants. Risque d'apprentissage > gain marginal."),
         ("jQuery / vanilla JS",
          "Pour une UI dynamique, gestion manuelle du DOM ingérable.")],
        [],
    ))

    s.append(decision_card(
        5, "Vercel pour l'hébergement",
        "Vercel — plateforme spécialisée Next.js",
        ["<b>Zéro configuration.</b> Connecte le repo GitHub, tout est "
         "automatique. Aucune ligne de Docker.",
         "<b>HTTPS gratuit obligatoire.</b> Certificat Let's Encrypt. "
         "Indispensable pour caméra et GPS.",
         "<b>Tier gratuit suffisant.</b> Projet entier à 0 €/mois."],
        [("AWS",
          "Config complexe (VPC, IAM). Payant dès quelques requêtes."),
         ("Heroku",
          "Plus de tier gratuit depuis 2022."),
         ("Self-hosted (VPS)",
          "Coût mensuel + maintenance. Risque opérationnel."),
         ("Netlify",
          "Intégration Next.js moins fluide — Next.js DÉVELOPPÉ par Vercel.")],
        [],
    ))
    s.append(PageBreak())

    # ═══ § 4 — BASE DE DONNÉES ═══
    s.append(Paragraph("§ 4 — Décisions sur la base de données", ss["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "Trois décisions : moteur (PostgreSQL), hébergeur (Neon), accès "
        "depuis le code (Prisma).", ss["uBody"]))

    s.append(decision_card(
        6, "PostgreSQL comme moteur de base de données",
        "PostgreSQL — SGBD relationnel ACID, open-source, 30+ ans",
        ["<b>Données fortement relationnelles.</b> Étudiant → groupe → cours "
         "→ séance → présence. Cadre exact d'un SGBD relationnel.",
         "<b>Contraintes d'intégrité automatiques.</b> UNIQUE(sessionId, "
         "studentId) appliqué PAR PostgreSQL, pas par notre code.",
         "<b>ACID.</b> Activation séance = UPDATE statut + INSERT 201 lignes. "
         "Soit tout réussit, soit tout échoue. Pas de demi-état."],
        [("MySQL / MariaDB",
          "Aussi mature, mais PostgreSQL a meilleur support contraintes "
          "complexes, JSONB natif, écosystème serverless plus actif."),
         ("MongoDB (NoSQL)",
          "Nos données relationnelles en documents = duplications ou joins "
          "manuels lents. NoSQL pour données semi-structurées."),
         ("SQLite",
          "Fichier local. Utilisé au début. Ne supporte pas plusieurs "
          "connexions concurrentes — goulot dès 2 profs simultanés."),
         ("Firebase / Firestore",
          "Vendor lock-in Google. Pricing imprévisible. Pas de SQL — "
          "pénalité sur les analytiques.")],
        [("Et si vous avez 100 000 étudiants ?",
          "PostgreSQL gère des centaines de millions de lignes. Index B-tree "
          "sur colonnes critiques en O(log n). À très grande échelle, AWS "
          "RDS Aurora."),
         ("Pourquoi pas de cache (Redis) ?",
          "Pas nécessaire à notre charge. PostgreSQL + index répond en moins "
          "de 10ms. YAGNI."),
         ("RGPD ?",
          "Données minimales, HTTPS, chiffrement Neon (AES-256), device hash "
          "non réversible, suppression cascade par l'admin.")],
    ))

    s.append(decision_card(
        7, "Neon Cloud comme hébergeur PostgreSQL",
        "Neon — PostgreSQL géré, serverless, offre gratuite",
        ["<b>PostgreSQL standard.</b> Aucun lock-in. On peut migrer vers "
         "AWS RDS, Supabase, self-hosted sans toucher au code.",
         "<b>Serverless = gratuit à notre échelle.</b> Pas de machine 24/7. "
         "Le service se réveille à la demande.",
         "<b>Branches de BDD.</b> Comme Git pour la base. Tester des "
         "migrations sans casser la prod — unique à Neon."],
        [("Supabase",
          "Concurrent direct, mais pousse son écosystème (auth, realtime) "
          "qu'on n'utilise pas."),
         ("Railway / Render",
          "Tier gratuit limité dans le temps ou heures CPU."),
         ("AWS RDS / Aurora",
          "Industriel, payant dès le premier jour. Surdimensionné."),
         ("Self-hosted (Docker + VPS)",
          "Coût mensuel + maintenance (sauvegardes, monitoring, patchs).")],
        [("Le serverless ajoute une latence de cold start. Problème ?",
          "Première requête après inactivité ~1s. Invisible pour le prof. "
          "Pour les scans en rafale, les suivantes sont instantanées.")],
    ))

    s.append(decision_card(
        8, "Prisma 6 comme ORM",
        "Prisma — ORM qui traduit notre code TypeScript en SQL",
        ["<b>Schéma déclaratif unique.</b> schema.prisma = source de vérité. "
         "Prisma génère TOUT : migrations, types, requêtes type-safe.",
         "<b>Requêtes type-safe.</b> Une typo dans un nom de colonne attrapée "
         "par TypeScript.",
         "<b>Migrations versionnées.</b> Reproductible sur tous les "
         "environnements.",
         "<b>Pas de SQL injection.</b> Paramètres préparés systématiques."],
        [("SQL brut + pg (driver)",
          "Plus performant, mais perd la sécurité du typage et la "
          "productivité des migrations."),
         ("Drizzle ORM",
          "Concurrent récent, plus léger. Bonne alternative — Prisma reste "
          "majoritaire."),
         ("TypeORM",
          "Plus ancien, moins type-safe. En désuétude."),
         ("Sequelize",
          "ORM JS historique. Pas conçu autour de TypeScript.")],
        [("Les ORM sont lents. Mesuré ?",
          "Pour 99% des requêtes simples, Prisma génère du SQL aussi "
          "efficace qu'à la main. Pour les requêtes très complexes, on "
          "peut basculer en prisma.$queryRaw.")],
    ))
    s.append(PageBreak())

    # ═══ § 5 — SÉCURITÉ ═══
    s.append(Paragraph("§ 5 — Décisions de sécurité", ss["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "Quatre décisions critiques : NextAuth, JWT, bcrypt, RBAC.",
        ss["uBody"]))

    s.append(decision_card(
        9, "NextAuth.js pour gérer les sessions",
        "NextAuth — bibliothèque d'auth standard de Next.js",
        ["<b>On ne réinvente pas la sécurité.</b> Auth custom = source "
         "majeure de vulnérabilités. NextAuth audité par milliers de projets.",
         "<b>Cookies signés gratuits.</b> JWT en cookie httpOnly, Secure, "
         "SameSite=Lax — protection XSS et CSRF par défaut.",
         "<b>Extensible.</b> Sign in with Google UEMF = une ligne de config."],
        [("Système d'auth custom",
          "Bombe à retardement. On oublie toujours un détail."),
         ("Auth0 / Clerk",
          "Services payants au-delà d'un seuil. Excellents pour startups, "
          "dépendance inutile pour académique."),
         ("Firebase Auth",
          "Lock-in Google. Migration des comptes pénible.")],
        [],
    ))

    s.append(decision_card(
        10, "JWT (sessions stateless) plutôt que sessions serveur",
        "JWT — token signé contenant les infos utilisateur, en cookie",
        ["<b>Stateless = scalable.</b> Le serveur ne mémorise rien entre "
         "requêtes. Si on multiplie les serveurs, pas de mémoire à partager.",
         "<b>Signature cryptographique.</b> Le serveur vérifie la signature "
         "à chaque requête. Modifier son rôle = casser la signature.",
         "<b>Expiration automatique.</b> 24h. Pas de job de nettoyage."],
        [("Sessions serveur (table SQL)",
          "Marche, mais une requête BDD par appel."),
         ("Sessions en mémoire (Redis)",
          "Plus rapide, mais demande Redis en plus."),
         ("JWT en localStorage",
          "Mauvaise idée : XSS peut lire. Cookie httpOnly l'empêche.")],
        [("Si le JWT est volé ? Vous ne pouvez pas révoquer.",
          "Critique valide. Mitigation : cookie httpOnly (bloque XSS), "
          "expiration 24h, et tournage de NEXTAUTH_SECRET en cas de "
          "compromission — invalide tous les JWT instantanément."),
         ("Pourquoi 24h et pas plus court ?",
          "Compromis UX vs sécurité. 1h = friction inutile. 30j = fenêtre "
          "dangereuse. 24h standard.")],
    ))

    s.append(decision_card(
        11, "bcrypt pour hasher les mots de passe",
        "bcrypt avec coût 10 — fonction de hash volontairement lente (100ms)",
        ["<b>Volontairement lent.</b> Tester 10M mots de passe = 12 jours. "
         "Brute-force impossible en pratique.",
         "<b>Salt automatique intégré.</b> Deux utilisateurs avec même mot "
         "de passe = hashes différents.",
         "<b>Coût ajustable.</b> 10 → 12 → 14 quand les CPU s'accélèrent."],
        [("MD5 / SHA-1",
          "Trop rapide. Brute-force trivial."),
         ("SHA-256 / SHA-512",
          "Idem : rapide. Pour signer (HMAC) oui, pour mots de passe non."),
         ("Argon2",
          "Plus récent, techniquement supérieur. Pour un nouveau projet — "
          "bcrypt reste très acceptable."),
         ("scrypt",
          "Alternative à bcrypt, plus de mémoire. Adoption moindre.")],
        [("Le mot de passe par défaut password123 est faible.",
          "Vrai, intentionnel pour la démo. En prod : mot de passe aléatoire "
          "à chaque création + obligation de changement à la 1re connexion.")],
    ))

    s.append(decision_card(
        12, "Contrôle d'accès par rôle (RBAC) côté serveur",
        "RBAC strict — chaque endpoint vérifie le rôle, helper centralisé",
        ["<b>Défense en profondeur.</b> Même si le front cache un bouton, "
         "l'API refuse indépendamment. JAMAIS de confiance au client.",
         "<b>Centralisé = uniforme.</b> Une fonction implémente la vérif.",
         "<b>Vérification de propriété.</b> Un prof peut activer SES "
         "séances, pas celles d'un autre prof."],
        [("Vérif seulement côté frontend",
          "Erreur classique. Frontend modifiable. N'importe qui peut "
          "requêter l'API directement."),
         ("Vérif ad-hoc dans chaque route",
          "Répétitif et fragile. On finit par oublier une route."),
         ("ABAC (attribute-based)",
          "Plus granulaire, surkill pour nos trois rôles.")],
        [("Démontrez que je ne peux pas marquer un autre étudiant présent.",
          "L'API exige STUDENT et IGNORE le studentId du body — lit "
          "l'identité depuis le JWT. Démo : fetch avec studentId='absent' "
          "dans le body — c'est MOI qui suis marqué présent.")],
    ))
    s.append(PageBreak())

    # ═══ § 6 — QR ROTATIF ═══
    s.append(Paragraph("§ 6 — Décisions sur le QR rotatif", ss["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "Cinq décisions imbriquées : algo crypto, durée rotation, longueur "
        "token, mode polling, stabilité visuelle.", ss["uBody"]))

    s.append(decision_card(
        13, "HMAC-SHA256 comme schéma de génération de tokens",
        "HMAC-SHA256 — inspiré de TOTP (RFC 6238, Google Authenticator)",
        ["<b>Déterministe côté serveur uniquement.</b> À partir du secret et "
         "de l'indice k, le serveur recalcule le token. Le client n'a pas le "
         "secret — ne peut prédire les tokens futurs.",
         "<b>Cryptographiquement sûr.</b> SHA-256 = fonction hash "
         "industrielle, sans collision connue. HMAC ajoute l'authenticité.",
         "<b>Coût négligeable.</b> Microsecondes. Milliers de scans/s sans "
         "difficulté."],
        [("UUID aléatoire à chaque cycle",
          "Oblige le serveur à STOCKER le token. HMAC = calculable à la "
          "demande. Pas d'état."),
         ("RSA / signature asymétrique",
          "100x plus coûteux. RSA utile quand plusieurs parties vérifient "
          "sans partager. Ici, une seule partie."),
         ("SHA-256 seul (sans HMAC)",
          "Sans clé secrète, n'importe qui calcule le hash."),
         ("Compteur incrémental",
          "Trivialement devinable. Aucune sécurité.")],
        [("Pourquoi pas TOTP exactement comme Google Authenticator ?",
          "Notre schéma est très proche. TOTP = 6 chiffres lisibles humain. "
          "Notre QR lu par caméra = on se permet 8 hex (plus d'entropie).")],
    ))

    s.append(decision_card(
        14, "Fenêtre de rotation de 10 secondes",
        "Δ = 10 secondes, validité fenêtre courante + précédente",
        ["<b>Trop court (≤ 3s) :</b> les étudiants n'ont pas le temps. "
         "Échecs, frustration.",
         "<b>Trop long (≥ 60s) :</b> photo a le temps de circuler en "
         "messagerie. Fraude.",
         "<b>10s :</b> confortable pour scanner, trop court pour partager."],
        [("5 secondes",
          "Trop serré. Premiers tests : scans rataient (latence GPS+caméra)."),
         ("20 secondes (valeur initiale)",
          "Notre choix de départ. Réduit à 10s pour resserrer."),
         ("QR statique pour toute la séance",
          "Impossible à protéger contre la photo.")],
        [("Pourquoi vous acceptez aussi la fenêtre précédente ?",
          "Pour gérer les scans À CHEVAL sur la limite. L'étudiant scanne "
          "à la 9,8e seconde : capture, GPS, requête réseau… arrive après "
          "le changement. Sans tolérance, refusé.")],
    ))

    s.append(decision_card(
        15, "Token de 8 caractères hexadécimaux (32 bits)",
        "8 premiers hex de HMAC-SHA256 — 32 bits = 4,3 milliards de "
        "possibilités",
        ["<b>Suffisant contre brute-force réseau.</b> Fenêtre 10s, "
         "rate-limit : brute-force impossible.",
         "<b>QR plus rapide à scanner.</b> Moins dense = caméra décode plus "
         "vite.",
         "<b>Lisibilité de debug.</b> 8 caractères tiennent dans les logs."],
        [("16 caractères hex (64 bits)",
          "Surdimensionné. Protège contre menace inexistante."),
         ("4 caractères hex (16 bits)",
          "Insuffisant : 65 536 possibilités. Brute-force trivial."),
         ("6 chiffres décimaux (comme TOTP)",
          "1M possibilités — limite acceptable, moins solide.")],
        [("32 bits semble peu pour de la cryptographie moderne.",
          "En crypto de transit (TLS), 256 bits — autre contexte. Ici : "
          "(1) token jetable expire en 10s, (2) chaque essai = requête HTTP "
          "rate-limitée. À 1000 req/s, deviner 2<super>32</super> = 50 "
          "jours. Impossible.")],
    ))

    s.append(decision_card(
        16, "Polling intelligent plutôt que WebSocket/SSE",
        "polling planifié 200ms après l'expiration de la fenêtre",
        ["<b>Un seul fetch par fenêtre.</b> 6/minute au lieu de 30. "
         "Économie 80% bande passante.",
         "<b>Affichage fluide.</b> Compte à rebours dérivé de (expiresAt - "
         "Date.now()).",
         "<b>Pas d'infra persistante.</b> WebSocket/SSE = connexion ouverte, "
         "complique le serverless."],
        [("WebSocket bidirectionnel",
          "Surdimensionné pour flux server vers client. Mal supporté "
          "serverless."),
         ("SSE (Server-Sent Events)",
          "Plus simple, même problème de connexion persistante."),
         ("Polling à intervalle fixe (2s)",
          "Version initiale. Trafic inutile + clignotement (bug corrigé).")],
        [("Pourquoi pas en temps réel ?",
          "Moderne n'est pas un critère. Nos données changent toutes les "
          "10s par construction — rien à pousser en sub-seconde.")],
    ))

    s.append(decision_card(
        17, "Timestamp windowStart dans le payload, pas Date.now()",
        "windowStart = k × Δ (début de fenêtre, fixe 10s)",
        ["<b>QR visuellement stable.</b> Si le payload change à chaque "
         "seconde, le canvas redessine, ça clignote. Avec windowStart, "
         "payload identique sur toute la fenêtre — QR dessiné une seule fois.",
         "<b>Validation reste correcte.</b> Le timestamp sert au contrôle "
         "de dérive (±60s). windowStart au plus 10s plus vieux — dans la "
         "tolérance."],
        [],
        [("Pourquoi avoir mentionné ce bug dans le rapport ?",
          "Montre qu'on a (1) testé avec vrais utilisateurs, (2) identifié "
          "la cause racine, (3) corrigé proprement. Trace d'un cycle de dev "
          "honnête.")],
    ))
    s.append(PageBreak())

    # ═══ § 7 — GÉOLOCALISATION ═══
    s.append(Paragraph("§ 7 — Décisions de géolocalisation", ss["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "Trois décisions : formule de calcul, configurabilité du rayon, "
        "statut « non vérifié ».", ss["uBody"]))

    s.append(decision_card(
        18, "Formule de Haversine pour calculer la distance",
        "Haversine — distance entre deux points GPS sur une sphère",
        ["<b>Modèle sphérique simple et correct.</b> Erreur sub-métrique à "
         "l'échelle d'un campus.",
         "<b>Pas de dépendance externe.</b> ~10 lignes de code. Gratuit, "
         "pas de rate limit.",
         "<b>Standard universel.</b> Tout le monde la connaît."],
        [("Théorème de Pythagore",
          "Suppose un plan plat. Pour campus l'erreur est négligeable, mais "
          "Haversine aussi simple ET correct par construction."),
         ("Formule de Vincenty (ellipsoïde)",
          "Plus précise, surdimensionnée pour quelques centaines de mètres."),
         ("Google Maps Distance API",
          "Externalise un calcul trivial. Dépendance, coût, latence.")],
        [],
    ))

    s.append(decision_card(
        19, "Rayon de geofence configurable par salle",
        "Chaque salle a son Room.radius — 60m Labo, 80m Salle, 150m amphis",
        ["<b>Précision GPS varie.</b> Plein air ±5m, intérieur ±10-30m, "
         "grand amphi ±50m. Un rayon unique exclurait ou inclurait à tort.",
         "<b>Taille physique des salles.</b> Labo 5x6m mérite 60m. Amphi "
         "30x40m mérite 150m.",
         "<b>Réglable par l'admin.</b> Sans redéploiement."],
        [],
        [("Et si quelqu'un usurpe sa position GPS ?",
          "Vrai sur téléphone rooté. Mitigations : (1) fraude active "
          "compétente, (2) la couche fingerprint détecte, (3) marqué non "
          "vérifié et arbitré par le prof."),
         ("Pourquoi pas vérifier le Wi-Fi campus à la place ?",
          "Complémentaire — mais ne dit pas dans quelle salle. GPS donne "
          "la position fine.")],
    ))

    s.append(decision_card(
        20, "Marquer « non vérifié » plutôt que refuser le scan",
        "GPS hors rayon ou absent → présence marquée non vérifiée, prof décide",
        ["<b>GPS imprécis en intérieur.</b> Étudiant près d'un mur peut "
         "dériver 30m. Rejet automatique = injuste.",
         "<b>Le prof a le contexte que le système n'a pas.</b> Il voit "
         "l'étudiant en classe. 1 clic.",
         "<b>L'information est conservée.</b> Trace gardée — audit possible."],
        [("Rejet automatique hors rayon",
          "Trop binaire. Faux négatifs qui ruinent la confiance."),
         ("Ignorer le GPS complètement",
          "Couche anti-fraude disparaît.")],
        [("Cela donne l'impression que le système doute des étudiants.",
          "Étudiant lambda en classe verra GPS OK 99% du temps. Non vérifié "
          "concerne surtout refus permission GPS, erreur exceptionnelle, "
          "cas suspect réel.")],
    ))
    s.append(PageBreak())

    # ═══ § 8 — ANTI-FRAUDE ═══
    s.append(Paragraph("§ 8 — Architecture anti-fraude", ss["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "Quatre couches indépendantes. L'attaquant doit contourner les "
        "QUATRE en même temps pour réussir une fraude sans laisser de trace.",
        ss["uBody"]))

    s.append(Paragraph(
        "<b>Défense en profondeur.</b> Plutôt qu'un mur unique « parfait », "
        "on superpose plusieurs lignes de défense de natures différentes. "
        "Un attaquant qui passe l'une est arrêté par la suivante.",
        ss["uDefBody"]))

    s.append(Paragraph("Attaques et neutralisations", ss["H2"]))
    s.append(make_table(
        ["Attaque", "Neutralisée par"],
        [["Photo du QR → ami absent",
          "C2 — rotation 10s, photo expirée à l'arrivée"],
         ["Appel vidéo → scan à distance",
          "C3 — GPS hors rayon, marqué non vérifié"],
         ["Un téléphone pour deux comptes",
          "C5 — empreinte d'appareil identique détectée"],
         ["Bypass API direct (POST faux ID)",
          "JWT — studentId lu de la session, pas du body"],
         ["Brute-force du token",
          "C4 — 2<super>32</super> possibilités, fenêtre 10s, rate limit"],
         ["Manipulation horloge téléphone",
          "C2 — fenêtre calculée côté serveur, ±60s"]],
        col_widths=[8 * cm, 7.5 * cm]))

    s.append(Paragraph(
        "Aucune SEULE couche ne résiste à toutes ces attaques. Combinées, "
        "l'attaquant doit : prédire un token en 10s, usurper GPS, avoir un "
        "téléphone unique, être connecté avec un compte légitime. "
        "Négligeable pour fraude opportuniste.", ss["uBody"]))

    s.append(Paragraph(
        "<b>Q. Un étudiant motivé peut quand même contourner. Pourquoi alors ?</b><br/>"
        "<b>R.</b> Vrai. Mais : (1) profil rare, (2) la barre d'effort rend "
        "la fraude PRÉMÉDITÉE (plus opportuniste), (3) on conserve les "
        "traces — audit possible. Le système n'est pas parfaitement "
        "incassable, il est ÉCONOMIQUEMENT DÉFAVORABLE à la fraude.",
        ss["uBody"]))
    s.append(PageBreak())

    # ═══ § 9 — MODÉLISATION RO ═══
    s.append(Paragraph("§ 9 — Décisions de modélisation RO", ss["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "S = {séances}, E = {étudiants}, T = {fenêtres QR, Δ=10s}, "
        "R = {salles}. Variables : x<sub>ij</sub> présence, "
        "<i>L</i><sub>ij</sub> retard, v<sub>ij</sub> vérifié — toutes "
        "binaires.<br/>"
        f"Objectif : Maximiser Z = α·{Zsub(1)} + β·{Zsub(2)} + γ·{Zsub(3)} "
        "(α=0,4, β=γ=0,3).<br/>"
        "Contraintes : C1 unicité, C2 temporel, C3 géographique (Haversine), "
        "C4 cryptographique (HMAC), C5 appareil.", ss["uBody"]))

    s.append(decision_card(
        21, "Variables binaires plutôt que continues",
        "x<sub>ij</sub> ∈ {0, 1} — présent ou pas, pas un degré",
        ["<b>Réalité métier binaire.</b> Un étudiant est présent ou absent "
         "au sens administratif. Pas de 70%.",
         "<b>Décision claire.</b> Statut PRESENT/ABSENT déclenche des "
         "actions distinctes (assiduité, alertes)."],
        [("x<sub>ij</sub> ∈ [0, 1] (probabilité)",
          "Aurait du sens si on agrégeait plusieurs sources d'évidence — "
          "surdimensionné."),
         ("Variable multinomiale",
          "Reflète notre cas : statut = PRESENT, ABSENT, LATE, EXCUSED — "
          "encodé en plusieurs variables binaires.")],
        [],
    ))

    s.append(decision_card(
        22, "Scalarisation pondérée plutôt que front de Pareto",
        f"combinaison convexe Z = α·{Zsub(1)} + β·{Zsub(2)} + γ·{Zsub(3)} "
        "avec α+β+γ=1",
        ["<b>Une seule fonction à interpréter.</b> Z = score entre 0 et 1, "
         "facile à communiquer.",
         "<b>Préférences explicites.</b> α, β, γ encodent les préférences "
         "du décideur.",
         "<b>Calculable en temps réel.</b> Pas besoin d'un solveur à chaque "
         "scan."],
        [("Front de Pareto",
          "Utile quand on ne connaît pas ses préférences. Ici, on les connaît."),
         ("Ordre lexicographique",
          "Marche si un objectif domine absolument. Notre cas plus nuancé."),
         ("Min-max",
          "Approche équité — pas adapté.")],
        [("Comment vous avez choisi α=0,4, β=γ=0,3 ?",
          "Calibrage métier initial. α=0,4 (couverture) = priorité n°1. "
          "β=γ=0,3 (vérification et efficacité) à égalité, importants mais "
          "secondaires. CONFIGURABLES — calibrage empirique après usage "
          "prod. Analyse de sensibilité classique en RO.")],
    ))
    s.append(PageBreak())

    # ═══ § 10 — BANQUE Q&A ═══
    s.append(Paragraph("§ 10 — Banque de 20 questions probables", ss["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "Vingt questions courantes qu'un jury RO posera. Pour chacune, "
        "une réponse modèle à mémoriser — adaptée à votre projet.",
        ss["uBody"]))

    qa_data = [
        ("cadrage",
         "En quoi votre projet est-il un projet de Recherche Opérationnelle "
         "et pas un simple projet d'informatique ?",
         "Trois preuves : <b>(1)</b> 20 100 variables binaires de décision "
         "(201 x ~100 séances) — optimisation combinatoire. <b>(2)</b> "
         f"fonction objectif quantifiable Z = α·{Zsub(1)} + β·{Zsub(2)} + γ·{Zsub(3)}. "
         "<b>(3)</b> cinq familles de contraintes mathématiquement "
         "explicites. Structure canonique RO."),
        ("base de données",
         "Pourquoi PostgreSQL et pas MongoDB ?",
         "Données fortement relationnelles (étudiant → groupe → cours → "
         "séance → présence). En documents JSON : duplications ou joins "
         "manuels lents. PostgreSQL conçu pour ce cas : contraintes UNIQUE "
         "et FK garanties, JOIN performants."),
        ("cryptographie",
         "Pourquoi HMAC-SHA256 et pas un simple UUID aléatoire ?",
         "UUID = oblige le serveur à STOCKER le token. HMAC = CALCULABLE à "
         "la demande à partir du secret et de l'indice. Pas d'état "
         "supplémentaire. HMAC garantit aussi l'authenticité."),
        ("rotation",
         "Pourquoi 10 secondes et pas 5 ou 60 ?",
         "5s = trop court (latence GPS+caméra). 60s = photo a le temps de "
         "circuler. 10s = confortable pour scanner, trop court pour "
         "partager. Itération initiale à 20s."),
        ("token",
         "32 bits semble peu pour de la cryptographie. Justifiez.",
         "Le facteur limitant n'est pas la longueur mais le DÉBIT D'ATTAQUE. "
         "Chaque essai = requête HTTP rate-limitée. 2<super>32</super> = "
         "4,3 milliards à 1000 req/s → 50 jours. Token expire en 10s. "
         "Impossible."),
        ("GPS",
         "Le GPS peut être falsifié. Quelle est la vraie sécurité ?",
         "Vrai sur téléphone rooté. Mais : (1) fraude PRÉMÉDITÉE, pas "
         "« réponse présent », (2) autres couches actives (fingerprint), "
         "(3) GPS suspect → marqué non vérifié, prof arbitre. Système "
         "ÉCONOMIQUEMENT DÉFAVORABLE à la fraude."),
        ("sécurité",
         "Comment empêchez-vous un étudiant de marquer un autre présent "
         "via l'API directement ?",
         "L'API exige STUDENT et IGNORE le studentId du body. Identité "
         "lue depuis le JWT signé. Démo : fetch avec studentId='absent' "
         "dans le body — le serveur me marque MOI, pas l'absent."),
        ("scalabilité",
         "Combien d'étudiants votre système peut supporter ?",
         "Aujourd'hui 201, scalable à des dizaines de milliers. PostgreSQL "
         "gère centaines de millions de lignes, requêtes indexées en "
         "O(log n). Vercel scale horizontalement, Neon verticalement."),
        ("multi-critère",
         "Justifiez le choix des poids α=0,4, β=γ=0,3.",
         "Calibrage métier initial. α=0,4 (couverture) = priorité n°1. "
         "β=γ=0,3 (vérification et efficacité) à égalité. Poids "
         "CONFIGURABLES. Calibrage empirique après usage prod."),
        ("stack",
         "Pourquoi Next.js et pas une autre stack ?",
         "(1) Front+back dans un seul projet — pas de synchro. "
         "(2) Déploiement Vercel trivial avec HTTPS gratuit. (3) Écosystème "
         "React le plus mature."),
        ("maintenance",
         "Qu'est-ce qui rend votre code maintenable sur 5 ans ?",
         "TypeScript = cohérence types, refactoring sûr. Prisma = schéma "
         "BDD centralisé. API REST claire avec Zod. Composants UI isolés. "
         "GitHub avec historique."),
        ("RGPD",
         "RGPD ? Vous collectez la position GPS des étudiants.",
         "(1) Données minimales (email, nom, ID, GPS pendant séance). "
         "(2) HTTPS en transit. (3) Chiffrement Neon AES-256. (4) Device "
         "hash non réversible (SHA-256). (5) Suppression cascade par "
         "l'admin."),
        ("panne",
         "Que se passe-t-il si Neon (la BDD) tombe pendant un cours ?",
         "Erreur 500 aux scans. Le prof voit immédiatement. Mitigations : "
         "Neon SLA 99,9%, sauvegardes horaires. En cas de panne, le prof "
         "bascule en mode manuel."),
        ("ergonomie",
         "Et si un étudiant n'a pas de smartphone ?",
         "Le prof peut le marquer présent manuellement depuis son tableau "
         "de bord — fonctionnalité testée. Le système ACCÉLÈRE le cas "
         "standard, sans bloquer les cas particuliers."),
        ("architecture",
         "Pourquoi pas une architecture en microservices ?",
         "Pour 201 utilisateurs, surdimensionné. Microservices = complexité "
         "opérationnelle pour bénéfice nul à notre échelle. Monolithique "
         "plus simple à raisonner."),
        ("tests",
         "Comment vous testez le système ?",
         "Tests manuels sur flux critiques. TypeScript = premier filet. "
         "Validation Zod sur tous les endpoints. Build CI/CD à chaque push. "
         "Roadmap V2 : Playwright pour intégration, Vitest pour unitaires."),
        ("coût",
         "Combien ça coûte à exploiter par an ?",
         "<b>Zéro euro.</b> Vercel + Neon + Let's Encrypt + GitHub tous "
         "gratuits sous nos seuils. Au pire ~20€/mois si on dépasse."),
        ("interop",
         "Comment intégrer ça avec Konosys ?",
         "Export CSV (RFC 4180, importable Konosys). Si Konosys expose une "
         "API REST, on écrirait un connecteur pour pousser les présences."),
        ("futur",
         "Quelles améliorations à court terme ?",
         "(1) Alertes profs si seuil d'absences. (2) Analyse temporelle "
         "d'assiduité par cours. (3) Mode hors-ligne. (4) Notification au "
         "prof si scan non vérifié. (5) Intégration Konosys via API."),
        ("démo",
         "Faites-moi une démo en direct.",
         "Plan 3 min : (1) connexion Pr Ahmed. (2) activation séance RO — "
         "201 ABSENT pré-créés. (3) téléphone : scan QR. (4) dashboard prof "
         "se met à jour, étudiant à PRESENT en ~5s. (5) override manuel. "
         "(6) terminer, export CSV."),
    ]

    for i, (label, q, a) in enumerate(qa_data, 1):
        s.append(qa_bank_item(i, label, q, a))

    s.append(PageBreak())

    # ═══ § 11 — GLOSSAIRE ═══
    s.append(Paragraph("§ 11 — Glossaire express", ss["H1"]))
    s.append(hr())
    s.append(Paragraph(
        "Trente termes pour rafraîchir la mémoire pendant la soutenance.",
        ss["uBody"]))

    glossary = [
        ("ACID", "Atomicité, Cohérence, Isolation, Durabilité — garanties "
                 "des transactions BDD."),
        ("ADMIN/PROFESSOR/STUDENT", "Les trois rôles utilisateurs."),
        ("App Router", "Le système de routage moderne de Next.js."),
        ("bcrypt", "Hash de mot de passe volontairement coûteux."),
        ("B-tree", "Index BDD, lookups en O(log n)."),
        ("CSV (RFC 4180)", "Format texte tabulaire, champs entre guillemets."),
        ("Défense en profondeur", "Plusieurs couches indépendantes."),
        ("Fingerprint", "Empreinte numérique d'un appareil (UA + résolution "
                        "+ langue → SHA-256)."),
        ("Haversine", "Formule de distance géodésique sur une sphère."),
        ("HMAC-SHA256", "Code d'authentification basé sur SHA-256."),
        ("HTTPS", "HTTP chiffré par TLS — obligatoire pour caméra + GPS."),
        ("JWT", "JSON Web Token — token d'auth signé."),
        ("NextAuth", "Bibliothèque d'authentification Next.js."),
        ("Optimisation combinatoire", "Optimisation sur variables discrètes."),
        ("ORM", "Object-Relational Mapper — pont code vers tables SQL."),
        ("Pareto", "Solutions non-dominées en multi-objectif."),
        ("Polling", "Client interroge le serveur à intervalle régulier."),
        ("PostgreSQL", "SGBD relationnel ACID open-source."),
        ("Prisma", "Notre ORM TypeScript — schéma déclaratif, type-safe."),
        ("RBAC", "Role-Based Access Control."),
        ("React", "Bibliothèque UI à composants, mise à jour ciblée."),
        ("Scalarisation", "Méthode multi-critère vers scalaire unique."),
        ("Serverless", "Architecture sans serveur persistant."),
        ("TOTP (RFC 6238)", "Time-based One-Time Password — Google "
                            "Authenticator."),
        ("TypeScript", "JavaScript avec typage statique."),
        ("UNIQUE(a, b)", "Contrainte SQL interdisant doublons (a, b)."),
        ("Vercel", "Plateforme d'hébergement, auteurs de Next.js."),
        ("WebSocket", "Connexion bidirectionnelle persistante (écartée)."),
        ("Zod", "Validation runtime des données entrantes."),
        (f"Z = α·{Zsub(1)}+β·{Zsub(2)}+γ·{Zsub(3)}",
         "Fonction objectif scalaire — fiabilité globale."),
    ]
    s.append(make_table(["Terme", "Définition courte"], glossary,
                        col_widths=[4.5 * cm, 11 * cm]))

    s.append(Spacer(1, 1 * cm))
    final = Table([[Paragraph(
        "<b>Code source :</b> "
        "github.com/MouhssineElBoumshouli/Student-Attendance-System<br/><br/>"
        "<b>Stack :</b> Next.js 16 · React 19 · TypeScript · Prisma 6 · "
        "PostgreSQL (Neon) · NextAuth · Tailwind v4 · Vercel",
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
