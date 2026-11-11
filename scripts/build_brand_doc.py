"""Build the one-page brand brief from its editable Markdown source."""
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
doc = Document()
section = doc.sections[0]
section.page_width = Inches(8.5)
section.page_height = Inches(11)
section.top_margin = section.bottom_margin = Inches(0.6)
section.left_margin = section.right_margin = Inches(0.72)
normal = doc.styles["Normal"]
normal.font.name = "Calibri"
normal.font.size = Pt(10.5)
normal.font.color.rgb = RGBColor.from_string("20251E")
normal.paragraph_format.space_after = Pt(5)
normal.paragraph_format.line_spacing = 1.04
for name, size in (("Title", 24), ("Heading 1", 10.5)):
    style = doc.styles[name]
    style.font.name = "Calibri"
    style.font.size = Pt(size)
    style.font.color.rgb = RGBColor(0, 0, 0)
    style.font.bold = name != "Title"
    style.paragraph_format.space_before = Pt(7 if name != "Title" else 0)
    style.paragraph_format.space_after = Pt(3 if name != "Title" else 10)
    style.paragraph_format.keep_with_next = True
for paragraph in (ROOT / "docs/brand.md").read_text().strip().split("\n\n"):
    if paragraph.startswith("# "):
        doc.add_paragraph(paragraph[2:], "Title")
    elif paragraph.startswith("## "):
        doc.add_paragraph(paragraph[3:], "Heading 1")
    else:
        doc.add_paragraph(paragraph)
doc.core_properties.title = "AgentsByBrand brand overview"
doc.core_properties.subject = "Brand positioning, audience, language, and first release"
doc.core_properties.author = "Brand Agent Workspace contributors"
doc.core_properties.last_modified_by = "Brand Agent Workspace contributors"
for root in (doc.styles.element, doc.element):
    for border in root.xpath(".//w:pBdr"):
        border.getparent().remove(border)
doc.save(ROOT / "docs/brand-one-page.docx")
print("Created docs/brand-one-page.docx")
