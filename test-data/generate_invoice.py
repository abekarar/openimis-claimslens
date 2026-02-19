"""Generate a sample medical invoice PDF for testing the ClaimLens OCR pipeline."""
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

output_path = "sample-medical-invoice.pdf"

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
bold_style = ParagraphStyle('Bold', parent=normal, fontName='Helvetica-Bold')

elements = []

# Header
elements.append(Paragraph("MEDICAL INVOICE", title_style))
elements.append(Spacer(1, 4))

# Invoice metadata
meta = [
    ["Invoice Number:", "INV-2025-001", "Date:", "2025-01-15"],
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
    ["Provider:", "Central District Hospital"],
    ["Address:", "456 Medical Drive, Health City, HC 12345"],
    ["Phone:", "(555) 123-4567"],
    ["License No:", "HC-2020-7890"],
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
    ["Patient Name:", "Jane Doe"],
    ["Patient ID:", "PAT-2025-0042"],
    ["Date of Birth:", "1985-03-22"],
    ["Insurance ID:", "INS-887654"],
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
    ["General consultation", "Z00.0", "99213", "2025-01-15", "1", "$50.00", "$50.00"],
    ["Complete blood count", "D64.9", "85025", "2025-01-15", "1", "$25.00", "$25.00"],
    ["Urinalysis", "R82.9", "81003", "2025-01-15", "1", "$15.00", "$15.00"],
    ["Amoxicillin 500mg x30", "J06.9", "99070", "2025-01-15", "1", "$12.00", "$12.00"],
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
    ["", "", "", "", "", "Subtotal:", "$102.00"],
    ["", "", "", "", "", "Tax (5%):", "$5.10"],
    ["", "", "", "", "", "Total Amount:", "$107.10"],
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
elements.append(Paragraph("Thank you for choosing Central District Hospital.", normal))

doc.build(elements)
print(f"Generated: {output_path}")
