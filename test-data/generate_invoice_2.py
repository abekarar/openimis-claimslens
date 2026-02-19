"""Generate sample medical invoice #2 — different patient, provider, and services."""
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

output_path = "sample-medical-invoice-2.pdf"

doc = SimpleDocTemplate(
    output_path,
    pagesize=letter,
    rightMargin=0.75 * inch,
    leftMargin=0.75 * inch,
    topMargin=0.75 * inch,
    bottomMargin=0.75 * inch,
)

styles = getSampleStyleSheet()
title_style = ParagraphStyle('InvoiceTitle', parent=styles['Title'], fontSize=20, spaceAfter=6)
heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=12, spaceAfter=4)
normal = styles['Normal']

elements = []

# Header
elements.append(Paragraph("MEDICAL INVOICE", title_style))
elements.append(Spacer(1, 4))

# Invoice metadata
meta = [
    ["Invoice Number:", "INV-2025-047", "Date:", "2025-02-10"],
]
meta_table = Table(meta, colWidths=[1.5 * inch, 2.5 * inch, 1 * inch, 2 * inch])
meta_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
]))
elements.append(meta_table)
elements.append(Spacer(1, 16))

# Provider info
elements.append(Paragraph("Provider Information", heading_style))
provider_data = [
    ["Provider:", "Riverside Family Clinic"],
    ["Address:", "12 Elm Street, Greenville, GV 54321"],
    ["Phone:", "(555) 987-6543"],
    ["License No:", "FC-2019-3456"],
]
provider_table = Table(provider_data, colWidths=[1.5 * inch, 5.5 * inch])
provider_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
]))
elements.append(provider_table)
elements.append(Spacer(1, 12))

# Patient info
elements.append(Paragraph("Patient Information", heading_style))
patient_data = [
    ["Patient Name:", "Robert Mensah"],
    ["Patient ID:", "PAT-2025-0118"],
    ["Date of Birth:", "1972-11-05"],
    ["Insurance ID:", "INS-334210"],
]
patient_table = Table(patient_data, colWidths=[1.5 * inch, 5.5 * inch])
patient_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
]))
elements.append(patient_table)
elements.append(Spacer(1, 16))

# Line items
elements.append(Paragraph("Services Rendered", heading_style))
line_items_header = [
    "Description", "ICD-10", "CPT Code", "Date", "Qty", "Unit Price", "Total"
]
line_items = [
    ["X-Ray chest (PA view)", "J18.9", "71046", "2025-02-10", "1", "$85.00", "$85.00"],
    ["Nebulizer treatment", "J45.20", "94640", "2025-02-10", "2", "$35.00", "$70.00"],
    ["Follow-up visit", "J45.20", "99214", "2025-02-10", "1", "$75.00", "$75.00"],
    ["Prednisolone 20mg x14", "J45.20", "99070", "2025-02-10", "1", "$18.50", "$18.50"],
    ["Salbutamol inhaler", "J45.20", "99070", "2025-02-10", "1", "$22.00", "$22.00"],
]

table_data = [line_items_header] + line_items
line_table = Table(
    table_data,
    colWidths=[2.2 * inch, 0.8 * inch, 0.8 * inch, 1.0 * inch, 0.5 * inch, 0.9 * inch, 0.8 * inch],
)
line_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('ALIGN', (4, 0), (-1, -1), 'RIGHT'),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#ecf0f1')]),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))
elements.append(line_table)
elements.append(Spacer(1, 16))

# Totals
totals_data = [
    ["", "", "", "", "", "Subtotal:", "$270.50"],
    ["", "", "", "", "", "Tax (5%):", "$13.53"],
    ["", "", "", "", "", "Total Amount:", "$284.03"],
]
totals_table = Table(
    totals_data,
    colWidths=[2.2 * inch, 0.8 * inch, 0.8 * inch, 1.0 * inch, 0.5 * inch, 0.9 * inch, 0.8 * inch],
)
totals_table.setStyle(TableStyle([
    ('FONTNAME', (5, 0), (5, -1), 'Helvetica-Bold'),
    ('FONTNAME', (5, 2), (-1, 2), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('ALIGN', (5, 0), (-1, -1), 'RIGHT'),
    ('LINEABOVE', (5, 2), (-1, 2), 1, colors.black),
]))
elements.append(totals_table)
elements.append(Spacer(1, 24))

# Footer
elements.append(Paragraph("Payment Terms: Net 30 days", normal))
elements.append(Paragraph("Thank you for choosing Riverside Family Clinic.", normal))

doc.build(elements)
print(f"Generated: {output_path}")
