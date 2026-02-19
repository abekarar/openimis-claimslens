"""Generate sample medical invoice #3 — French-language variant."""
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

output_path = "sample-medical-invoice-3.pdf"

doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    rightMargin=2 * cm,
    leftMargin=2 * cm,
    topMargin=2 * cm,
    bottomMargin=2 * cm,
)

styles = getSampleStyleSheet()
title_style = ParagraphStyle('InvoiceTitle', parent=styles['Title'], fontSize=20, spaceAfter=6)
heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=12, spaceAfter=4)
normal = styles['Normal']

elements = []

# Header
elements.append(Paragraph("FACTURE MEDICALE", title_style))
elements.append(Spacer(1, 4))

# Invoice metadata
meta = [
    ["N\u00b0 Facture:", "FACT-2025-0203", "Date:", "15/01/2025"],
]
meta_table = Table(meta, colWidths=[3 * cm, 5 * cm, 2 * cm, 4 * cm])
meta_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
]))
elements.append(meta_table)
elements.append(Spacer(1, 16))

# Provider info
elements.append(Paragraph("Prestataire de soins", heading_style))
provider_data = [
    ["\u00c9tablissement:", "H\u00f4pital R\u00e9gional de Bamako"],
    ["Adresse:", "Avenue de la Libert\u00e9, Bamako, Mali"],
    ["T\u00e9l\u00e9phone:", "+223 20 22 33 44"],
    ["N\u00b0 Agr\u00e9ment:", "MS-MLI-2021-0456"],
]
provider_table = Table(provider_data, colWidths=[3.5 * cm, 13 * cm])
provider_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
]))
elements.append(provider_table)
elements.append(Spacer(1, 12))

# Patient info
elements.append(Paragraph("Informations du patient", heading_style))
patient_data = [
    ["Nom du patient:", "Aminata Diallo"],
    ["N\u00b0 Patient:", "PAT-MLI-2025-0089"],
    ["Date de naissance:", "14/06/1990"],
    ["N\u00b0 Assurance:", "CANAM-220198"],
]
patient_table = Table(patient_data, colWidths=[3.5 * cm, 13 * cm])
patient_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
]))
elements.append(patient_table)
elements.append(Spacer(1, 16))

# Line items
elements.append(Paragraph("Prestations fournies", heading_style))
line_items_header = [
    "Description", "CIM-10", "Date", "Qt\u00e9", "Prix unit.", "Total"
]
line_items = [
    ["Consultation g\u00e9n\u00e9rale", "Z00.0", "15/01/2025", "1", "5 000 FCFA", "5 000 FCFA"],
    ["Test paludisme (TDR)", "B54", "15/01/2025", "1", "2 500 FCFA", "2 500 FCFA"],
    ["Perfusion intraveineuse", "B54", "15/01/2025", "2", "3 000 FCFA", "6 000 FCFA"],
    ["Artemether-Lumefantrine", "B54", "15/01/2025", "1", "4 500 FCFA", "4 500 FCFA"],
    ["Parac\u00e9tamol 500mg x20", "R50.9", "15/01/2025", "1", "1 200 FCFA", "1 200 FCFA"],
]

table_data = [line_items_header] + line_items
line_table = Table(
    table_data,
    colWidths=[5.5 * cm, 1.8 * cm, 2.5 * cm, 1 * cm, 2.8 * cm, 2.8 * cm],
)
line_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5276')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#d6eaf8')]),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))
elements.append(line_table)
elements.append(Spacer(1, 16))

# Totals
totals_data = [
    ["", "", "", "", "Sous-total:", "19 200 FCFA"],
    ["", "", "", "", "Montant total:", "19 200 FCFA"],
]
totals_table = Table(
    totals_data,
    colWidths=[5.5 * cm, 1.8 * cm, 2.5 * cm, 1 * cm, 2.8 * cm, 2.8 * cm],
)
totals_table.setStyle(TableStyle([
    ('FONTNAME', (4, 0), (4, -1), 'Helvetica-Bold'),
    ('FONTNAME', (4, 1), (-1, 1), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('ALIGN', (4, 0), (-1, -1), 'RIGHT'),
    ('LINEABOVE', (4, 1), (-1, 1), 1, colors.black),
]))
elements.append(totals_table)
elements.append(Spacer(1, 24))

# Footer
elements.append(Paragraph("Conditions de paiement: 30 jours", normal))
elements.append(Paragraph("Merci de votre confiance.", normal))

doc.build(elements)
print(f"Generated: {output_path}")
