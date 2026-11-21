# -*- coding: utf-8 -*-
"""
Execution script to integrate INTISARI, ABSTRACT, BAB I, BAB II, BAB III,
and verified DAFTAR PUSTAKA into '2026_FTI_UTDI_Template_Tugas Akhir-Skripsi.docx'.
Ensures all occurrences of 'saya' are replaced with 'penulis', all headings have proper styles,
all foreign terms are italicized, and all diagrams have prominent placeholder markers.
"""

import zipfile
import xml.etree.ElementTree as ET
import os
import shutil
import re

import thesis_content_bab1
import thesis_content_bab2
import thesis_content_bab3

DOCX_PATH = r"C:\laragon\www\coffeeshop-esb-system\2026_FTI_UTDI_Template_Tugas Akhir-Skripsi.docx"
BACKUP_PATH = r"C:\laragon\www\coffeeshop-esb-system\2026_FTI_UTDI_Template_Tugas Akhir-Skripsi_BACKUP_BEFORE_BUILD.docx"
TEMP_DOCX = r"C:\laragon\www\coffeeshop-esb-system\temp_output.docx"

# 1. Create safety backup
shutil.copy2(DOCX_PATH, BACKUP_PATH)
print("Backup created at:", BACKUP_PATH)

# 2. Extract and parse document.xml
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
ET.register_namespace('w', W_NS)
ET.register_namespace('r', "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
ET.register_namespace('m', "http://schemas.openxmlformats.org/officeDocument/2006/math")
ET.register_namespace('wp', "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing")
ET.register_namespace('a', "http://schemas.openxmlformats.org/drawingml/2006/main")
ET.register_namespace('pic', "http://schemas.openxmlformats.org/drawingml/2006/picture")

with zipfile.ZipFile(DOCX_PATH, 'r') as zin:
    xml_content = zin.read('word/document.xml')

root = ET.fromstring(xml_content)
body = root.find(f"{{{W_NS}}}body")

# 3. Clean up front matter text nodes across the entire document:
w_t = f"{{{W_NS}}}t"
saya_count = 0
for t_node in root.iter(w_t):
    if not t_node.text:
        continue
    # Replace 'Ketua Program Studi Program Studi' with 'Ketua Program Studi Sistem Informasi'
    if 'Ketua Program Studi Program Studi' in t_node.text:
        t_node.text = t_node.text.replace('Ketua Program Studi Program Studi', 'Ketua Program Studi Sistem Informasi')
    # Replace any 'saya' with 'penulis'
    if re.search(r'\bsaya\b', t_node.text, re.IGNORECASE):
        def replace_saya(match):
            word = match.group(0)
            if word.istitle():
                return "Penulis"
            elif word.isupper():
                return "PENULIS"
            else:
                return "penulis"
        t_node.text = re.sub(r'\bsaya\b', replace_saya, t_node.text, flags=re.IGNORECASE)
        saya_count += 1

print(f"Replaced {saya_count} occurrence(s) of 'saya' with 'penulis'.")

# 4. Locate target indices in body
w_pStyle = f"{{{W_NS}}}pStyle"
w_val = f"{{{W_NS}}}val"

intisari_idx = None
bab2_idx = None
bab4_idx = None
daftar_pustaka_idx = None
lampiran_idx = None

for idx, child in enumerate(body):
    t = ''.join(child.itertext()).strip()
    pStyle = child.find(f'.//{w_pStyle}')
    style = pStyle.attrib.get(w_val, '') if pStyle is not None else ''
    
    if 'TOC' in t:
        continue
        
    if t == 'INTISARI' and intisari_idx is None:
        intisari_idx = idx
    elif style == 'Heading1' and 'BAB II' in t and 'TINJAUAN PUSTAKA' in t:
        bab2_idx = idx
    elif style == 'Heading1' and 'BAB IV' in t and 'IMPLEMENTASI' in t:
        bab4_idx = idx
    elif style == 'Heading1' and 'DAFTAR PUSTAKA' in t:
        daftar_pustaka_idx = idx
        
    if 'LAMPIRAN' in t and daftar_pustaka_idx is not None and idx > daftar_pustaka_idx:
        if lampiran_idx is None:
            lampiran_idx = idx

print(f"Verified Indices:")
print(f"  INTISARI: {intisari_idx}")
print(f"  BAB II: {bab2_idx}")
print(f"  BAB IV: {bab4_idx}")
print(f"  DAFTAR PUSTAKA: {daftar_pustaka_idx}")
print(f"  LAMPIRAN: {lampiran_idx}")

assert intisari_idx is not None and bab2_idx is not None and bab4_idx is not None and daftar_pustaka_idx is not None and lampiran_idx is not None

# 5. Generate elements
intisari_elements = thesis_content_bab1.get_intisari_elements()
abstract_elements = thesis_content_bab1.get_abstract_elements()
bab1_elements = thesis_content_bab1.get_bab1_elements()
bab2_elements = thesis_content_bab2.get_bab2_elements()
bab3_elements = thesis_content_bab3.get_bab3_elements()
daftar_pustaka_elements = thesis_content_bab3.get_daftar_pustaka_elements()

print(f"Elements generated:")
print(f"  INTISARI: {len(intisari_elements)}")
print(f"  ABSTRACT: {len(abstract_elements)}")
print(f"  BAB I: {len(bab1_elements)}")
print(f"  BAB II: {len(bab2_elements)}")
print(f"  BAB III: {len(bab3_elements)}")
print(f"  DAFTAR PUSTAKA: {len(daftar_pustaka_elements)}")

# 6. Build new body children list
new_children = []

# Part A: Front matter up to (excluding) INTISARI
for i in range(0, intisari_idx):
    new_children.append(body[i])

# Part B: New INTISARI, ABSTRACT, and BAB I elements
new_children.extend(intisari_elements)
new_children.extend(abstract_elements)
new_children.extend(bab1_elements)

# Part C: New BAB II and BAB III elements
new_children.extend(bab2_elements)
new_children.extend(bab3_elements)

# Part D: BAB IV up to DAFTAR PUSTAKA Heading (inclusive)
for i in range(bab4_idx, daftar_pustaka_idx + 1):
    new_children.append(body[i])

# Part E: New DAFTAR PUSTAKA entries
new_children.extend(daftar_pustaka_elements)

# Part F: From LAMPIRAN to the end
for i in range(lampiran_idx, len(body)):
    new_children.append(body[i])

# Clear and rebuild body
body[:] = new_children
print(f"Body successfully updated: new total children={len(body)}")

# 7. Repackage into docx
new_xml_content = ET.tostring(root, encoding='utf-8', xml_declaration=True)

with zipfile.ZipFile(DOCX_PATH, 'r') as zin, zipfile.ZipFile(TEMP_DOCX, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        if item.filename == 'word/document.xml':
            zout.writestr(item, new_xml_content)
        else:
            zout.writestr(item, zin.read(item.filename))

# Replace original docx with new docx
shutil.move(TEMP_DOCX, DOCX_PATH)
print("Thesis document successfully updated and verified at:", DOCX_PATH)
