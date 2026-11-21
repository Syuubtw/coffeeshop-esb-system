# -*- coding: utf-8 -*-
"""
Execution script to integrate BAB II, BAB III, and verified DAFTAR PUSTAKA
into '2026_FTI_UTDI_Template_Tugas Akhir-Skripsi.docx'.
"""

import zipfile
import xml.etree.ElementTree as ET
import os
import shutil

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

# 3. Locate target indices in body using strict Heading1 and text matching
w_pStyle = f"{{{W_NS}}}pStyle"
w_val = f"{{{W_NS}}}val"

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
        
    if style == 'Heading1':
        if 'BAB II' in t and 'TINJAUAN PUSTAKA' in t:
            bab2_idx = idx
        elif 'BAB IV' in t and 'IMPLEMENTASI' in t:
            bab4_idx = idx
        elif 'DAFTAR PUSTAKA' in t:
            daftar_pustaka_idx = idx
            
    if 'LAMPIRAN' in t and daftar_pustaka_idx is not None and idx > daftar_pustaka_idx:
        if lampiran_idx is None:
            lampiran_idx = idx

print(f"Verified Indices: BAB II={bab2_idx}, BAB IV={bab4_idx}, DAFTAR PUSTAKA={daftar_pustaka_idx}, LAMPIRAN={lampiran_idx}")
assert bab2_idx == 192, f"Expected BAB II at 192, got {bab2_idx}"
assert bab4_idx == 209, f"Expected BAB IV at 209, got {bab4_idx}"
assert daftar_pustaka_idx == 225, f"Expected DAFTAR PUSTAKA at 225, got {daftar_pustaka_idx}"
assert lampiran_idx == 242, f"Expected LAMPIRAN at 242, got {lampiran_idx}"

# 4. Generate elements
bab2_elements = thesis_content_bab2.get_bab2_elements()
bab3_elements = thesis_content_bab3.get_bab3_elements()
daftar_pustaka_elements = thesis_content_bab3.get_daftar_pustaka_elements()

print(f"Elements generated: BAB II={len(bab2_elements)}, BAB III={len(bab3_elements)}, DAFTAR PUSTAKA={len(daftar_pustaka_elements)}")

# 5. Build new body children list
new_children = []

# Part A: Before BAB II (including BAB II Heading at index 192)
for i in range(0, bab2_idx + 1):
    new_children.append(body[i])

# Part B: New BAB II and BAB III elements
new_children.extend(bab2_elements)
new_children.extend(bab3_elements)

# Part C: From BAB IV to DAFTAR PUSTAKA (inclusive)
for i in range(bab4_idx, daftar_pustaka_idx + 1):
    new_children.append(body[i])

# Part D: New DAFTAR PUSTAKA elements
new_children.extend(daftar_pustaka_elements)

# Part E: From LAMPIRAN to the end
for i in range(lampiran_idx, len(body)):
    new_children.append(body[i])

# Clear and rebuild body
body[:] = new_children
print(f"Body successfully updated: new total children={len(body)}")

# 6. Repackage into docx
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
