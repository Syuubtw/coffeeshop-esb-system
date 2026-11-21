# -*- coding: utf-8 -*-
"""
Script to populate BAB II, BAB III, and update DAFTAR PUSTAKA
in '2026_FTI_UTDI_Template_Tugas Akhir-Skripsi.docx'.
"""

import zipfile
import xml.etree.ElementTree as ET
import os
import shutil

DOCX_PATH = r"C:\laragon\www\coffeeshop-esb-system\2026_FTI_UTDI_Template_Tugas Akhir-Skripsi.docx"
BACKUP_PATH = r"C:\laragon\www\coffeeshop-esb-system\2026_FTI_UTDI_Template_Tugas Akhir-Skripsi_PRE_BAB2_3.docx"

if not os.path.exists(BACKUP_PATH):
    shutil.copy2(DOCX_PATH, BACKUP_PATH)
    print("Backup created at:", BACKUP_PATH)

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
ET.register_namespace('w', W_NS)
ET.register_namespace('r', "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
ET.register_namespace('m', "http://schemas.openxmlformats.org/officeDocument/2006/math")
ET.register_namespace('wp', "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing")
ET.register_namespace('a', "http://schemas.openxmlformats.org/drawingml/2006/main")
ET.register_namespace('pic', "http://schemas.openxmlformats.org/drawingml/2006/picture")

def w(tag):
    return f"{{{W_NS}}}{tag}"

def p(text, bold=False, italic=False, align="both", indent_first=True, space_after=120, space_line=360):
    elem = ET.Element(w("p"))
    pPr = ET.SubElement(elem, w("pPr"))
    spc = ET.SubElement(pPr, w("spacing"))
    spc.set(w("line"), str(space_line))
    spc.set(w("lineRule"), "auto")
    if space_after > 0:
        spc.set(w("after"), str(space_after))
    if indent_first:
        ind = ET.SubElement(pPr, w("ind"))
        ind.set(w("firstLine"), "720")
    jc = ET.SubElement(pPr, w("jc"))
    jc.set(w("val"), align)
    
    rPr_p = ET.SubElement(pPr, w("rPr"))
    rF_p = ET.SubElement(rPr_p, w("rFonts"))
    rF_p.set(w("ascii"), "Times New Roman")
    rF_p.set(w("hAnsi"), "Times New Roman")
    sz_p = ET.SubElement(rPr_p, w("sz"))
    sz_p.set(w("val"), "24") # 12pt
    
    r = ET.SubElement(elem, w("r"))
    rPr = ET.SubElement(r, w("rPr"))
    rF = ET.SubElement(rPr, w("rFonts"))
    rF.set(w("ascii"), "Times New Roman")
    rF.set(w("hAnsi"), "Times New Roman")
    sz = ET.SubElement(rPr, w("sz"))
    sz.set(w("val"), "24")
    if bold:
        ET.SubElement(rPr, w("b"))
    if italic:
        ET.SubElement(rPr, w("i"))
    t = ET.SubElement(r, w("t"))
    t.text = text
    if text.startswith(" ") or text.endswith(" "):
        t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    return elem

def heading(text, level=2, space_before=240, space_after=120):
    elem = ET.Element(w("p"))
    pPr = ET.SubElement(elem, w("pPr"))
    spc = ET.SubElement(pPr, w("spacing"))
    spc.set(w("before"), str(space_before))
    spc.set(w("after"), str(space_after))
    spc.set(w("line"), "360")
    spc.set(w("lineRule"), "auto")
    jc = ET.SubElement(pPr, w("jc"))
    jc.set(w("val"), "left")
    
    rPr_p = ET.SubElement(pPr, w("rPr"))
    rF_p = ET.SubElement(rPr_p, w("rFonts"))
    rF_p.set(w("ascii"), "Times New Roman")
    rF_p.set(w("hAnsi"), "Times New Roman")
    sz_p = ET.SubElement(rPr_p, w("sz"))
    sz_p.set(w("val"), "24")
    ET.SubElement(rPr_p, w("b"))
    
    r = ET.SubElement(elem, w("r"))
    rPr = ET.SubElement(r, w("rPr"))
    rF = ET.SubElement(rPr, w("rFonts"))
    rF.set(w("ascii"), "Times New Roman")
    rF.set(w("hAnsi"), "Times New Roman")
    sz = ET.SubElement(rPr, w("sz"))
    sz.set(w("val"), "24")
    ET.SubElement(rPr, w("b"))
    t = ET.SubElement(r, w("t"))
    t.text = text
    return elem

def caption(text, is_table=True):
    elem = ET.Element(w("p"))
    pPr = ET.SubElement(elem, w("pPr"))
    spc = ET.SubElement(pPr, w("spacing"))
    if is_table:
        spc.set(w("before"), "180")
        spc.set(w("after"), "60")
    else:
        spc.set(w("before"), "60")
        spc.set(w("after"), "180")
    spc.set(w("line"), "240")
    spc.set(w("lineRule"), "auto")
    jc = ET.SubElement(pPr, w("jc"))
    jc.set(w("val"), "center")
    
    rPr_p = ET.SubElement(pPr, w("rPr"))
    rF_p = ET.SubElement(rPr_p, w("rFonts"))
    rF_p.set(w("ascii"), "Times New Roman")
    rF_p.set(w("hAnsi"), "Times New Roman")
    sz_p = ET.SubElement(rPr_p, w("sz"))
    sz_p.set(w("val"), "24")
    ET.SubElement(rPr_p, w("b"))
    
    r = ET.SubElement(elem, w("r"))
    rPr = ET.SubElement(r, w("rPr"))
    rF = ET.SubElement(rPr, w("rFonts"))
    rF.set(w("ascii"), "Times New Roman")
    rF.set(w("hAnsi"), "Times New Roman")
    sz = ET.SubElement(rPr, w("sz"))
    sz.set(w("val"), "24")
    ET.SubElement(rPr, w("b"))
    t = ET.SubElement(r, w("t"))
    t.text = text
    return elem

def table(headers, rows, col_widths=None):
    tbl = ET.Element(w("tbl"))
    tblPr = ET.SubElement(tbl, w("tblPr"))
    tblW = ET.SubElement(tblPr, w("tblW"))
    tblW.set(w("w"), "9500")
    tblW.set(w("type"), "dxa")
    jc = ET.SubElement(tblPr, w("jc"))
    jc.set(w("val"), "center")
    
    tblBorders = ET.SubElement(tblPr, w("tblBorders"))
    for border_name in ["top", "left", "bottom", "right", "insideH"]:
        b = ET.SubElement(tblBorders, w(border_name))
        b.set(w("val"), "single")
        b.set(w("sz"), "4")
        b.set(w("space"), "0")
        b.set(w("color"), "000000")
    b_v = ET.SubElement(tblBorders, w("insideV"))
    b_v.set(w("val"), "none")
    
    tblGrid = ET.SubElement(tbl, w("tblGrid"))
    if not col_widths:
        w_per_col = 9500 // len(headers)
        col_widths = [w_per_col] * len(headers)
    for cw in col_widths:
        gridCol = ET.SubElement(tblGrid, w("gridCol"))
        gridCol.set(w("w"), str(cw))
        
    tr_h = ET.SubElement(tbl, w("tr"))
    trPr_h = ET.SubElement(tr_h, w("trPr"))
    ET.SubElement(trPr_h, w("tblHeader"))
    
    for i, h_text in enumerate(headers):
        tc = ET.SubElement(tr_h, w("tc"))
        tcPr = ET.SubElement(tc, w("tcPr"))
        tcW = ET.SubElement(tcPr, w("tcW"))
        tcW.set(w("w"), str(col_widths[i]))
        tcW.set(w("type"), "dxa")
        shd = ET.SubElement(tcPr, w("shd"))
        shd.set(w("val"), "clear")
        shd.set(w("color"), "auto")
        shd.set(w("fill"), "F0F0F0")
        
        tcMar = ET.SubElement(tcPr, w("tcMar"))
        for m in ["top", "bottom"]:
            node = ET.SubElement(tcMar, w(m))
            node.set(w("w"), "120")
            node.set(w("type"), "dxa")
        for m in ["left", "right"]:
            node = ET.SubElement(tcMar, w(m))
            node.set(w("w"), "160")
            node.set(w("type"), "dxa")
            
        p_node = ET.SubElement(tc, w("p"))
        pPr = ET.SubElement(p_node, w("pPr"))
        spc = ET.SubElement(pPr, w("spacing"))
        spc.set(w("line"), "240")
        spc.set(w("lineRule"), "auto")
        jc_node = ET.SubElement(pPr, w("jc"))
        jc_node.set(w("val"), "center")
        
        r = ET.SubElement(p_node, w("r"))
        rPr = ET.SubElement(r, w("rPr"))
        rF = ET.SubElement(rPr, w("rFonts"))
        rF.set(w("ascii"), "Times New Roman")
        rF.set(w("hAnsi"), "Times New Roman")
        sz = ET.SubElement(rPr, w("sz"))
        sz.set(w("val"), "20") # 10pt
        ET.SubElement(rPr, w("b"))
        t = ET.SubElement(r, w("t"))
        t.text = h_text
        
    for r_data in rows:
        tr = ET.SubElement(tbl, w("tr"))
        for i, val in enumerate(r_data):
            tc = ET.SubElement(tr, w("tc"))
            tcPr = ET.SubElement(tc, w("tcPr"))
            tcW = ET.SubElement(tcPr, w("tcW"))
            tcW.set(w("w"), str(col_widths[i]))
            tcW.set(w("type"), "dxa")
            
            tcMar = ET.SubElement(tcPr, w("tcMar"))
            for m in ["top", "bottom"]:
                node = ET.SubElement(tcMar, w(m))
                node.set(w("w"), "100")
                node.set(w("type"), "dxa")
            for m in ["left", "right"]:
                node = ET.SubElement(tcMar, w(m))
                node.set(w("w"), "140")
                node.set(w("type"), "dxa")
                
            p_node = ET.SubElement(tc, w("p"))
            pPr = ET.SubElement(p_node, w("pPr"))
            spc = ET.SubElement(pPr, w("spacing"))
            spc.set(w("line"), "240")
            spc.set(w("lineRule"), "auto")
            jc_node = ET.SubElement(pPr, w("jc"))
            
            val_str = str(val)
            if len(val_str) <= 8 or val_str in ["PK", "FK", "INT", "BIGINT", "VARCHAR", "BOOLEAN", "TEXT", "ENUM", "TIMESTAMP", "DECIMAL(12,2)"]:
                jc_node.set(w("val"), "center")
            else:
                jc_node.set(w("val"), "left")
                
            r = ET.SubElement(p_node, w("r"))
            rPr = ET.SubElement(r, w("rPr"))
            rF = ET.SubElement(rPr, w("rFonts"))
            rF.set(w("ascii"), "Times New Roman")
            rF.set(w("hAnsi"), "Times New Roman")
            sz = ET.SubElement(rPr, w("sz"))
            sz.set(w("val"), "20") # 10pt
            t = ET.SubElement(r, w("t"))
            t.text = val_str
            
    return tbl

def frame_diagram(title, file_source, desc_lines):
    """
    Creates a prominent, beautifully styled image placeholder box so the student
    can immediately see where to insert images and which source file to use.
    """
    tbl = ET.Element(w("tbl"))
    tblPr = ET.SubElement(tbl, w("tblPr"))
    tblW = ET.SubElement(tblPr, w("tblW"))
    tblW.set(w("w"), "9500")
    tblW.set(w("type"), "dxa")
    jc = ET.SubElement(tblPr, w("jc"))
    jc.set(w("val"), "center")
    
    tblBorders = ET.SubElement(tblPr, w("tblBorders"))
    for b_name in ["top", "left", "bottom", "right"]:
        b = ET.SubElement(tblBorders, w(b_name))
        b.set(w("val"), "single")
        b.set(w("sz"), "12") # 1.5 pt border
        b.set(w("space"), "0")
        b.set(w("color"), "2B4C7E") # Dark academic blue border
    for b_name in ["insideH", "insideV"]:
        b = ET.SubElement(tblBorders, w(b_name))
        b.set(w("val"), "none")
        
    tblGrid = ET.SubElement(tbl, w("tblGrid"))
    gridCol = ET.SubElement(tblGrid, w("gridCol"))
    gridCol.set(w("w"), "9500")
        
    tr = ET.SubElement(tbl, w("tr"))
    tc = ET.SubElement(tr, w("tc"))
    tcPr = ET.SubElement(tc, w("tcPr"))
    tcW = ET.SubElement(tcPr, w("tcW"))
    tcW.set(w("w"), "9500")
    tcW.set(w("type"), "dxa")
    shd = ET.SubElement(tcPr, w("shd"))
    shd.set(w("val"), "clear")
    shd.set(w("fill"), "F0F4F8") # Soft blue-gray background
    
    tcMar = ET.SubElement(tcPr, w("tcMar"))
    for m in ["top", "bottom"]:
        node = ET.SubElement(tcMar, w(m))
        node.set(w("w"), "220")
        node.set(w("type"), "dxa")
    for m in ["left", "right"]:
        node = ET.SubElement(tcMar, w(m))
        node.set(w("w"), "260")
        node.set(w("type"), "dxa")
        
    # 1. Header Badge: [ 📍 PENANDA TEMPAT PENEMPELAN GAMBAR / DIAGRAM ]
    p_badge = ET.SubElement(tc, w("p"))
    pPr_b = ET.SubElement(p_badge, w("pPr"))
    jc_b = ET.SubElement(pPr_b, w("jc"))
    jc_b.set(w("val"), "center")
    spc_b = ET.SubElement(pPr_b, w("spacing"))
    spc_b.set(w("after"), "80")
    spc_b.set(w("line"), "240")
    r_b = ET.SubElement(p_badge, w("r"))
    rPr_b = ET.SubElement(r_b, w("rPr"))
    ET.SubElement(rPr_b, w("b"))
    sz_b = ET.SubElement(rPr_b, w("sz"))
    sz_b.set(w("val"), "22")
    col_b = ET.SubElement(rPr_b, w("color"))
    col_b.set(w("val"), "1E3A8A")
    t_b = ET.SubElement(r_b, w("t"))
    t_b.text = "📍 [ PENANDA TEMPAT PENEMPELAN GAMBAR / DIAGRAM ]"
    
    # 2. Judul Gambar
    p_title = ET.SubElement(tc, w("p"))
    pPr_t = ET.SubElement(p_title, w("pPr"))
    jc_t = ET.SubElement(pPr_t, w("jc"))
    jc_t.set(w("val"), "center")
    spc_t = ET.SubElement(pPr_t, w("spacing"))
    spc_t.set(w("after"), "100")
    spc_t.set(w("line"), "240")
    r_t = ET.SubElement(p_title, w("r"))
    rPr_t = ET.SubElement(r_t, w("rPr"))
    ET.SubElement(rPr_t, w("b"))
    sz_t = ET.SubElement(rPr_t, w("sz"))
    sz_t.set(w("val"), "22")
    t_t = ET.SubElement(r_t, w("t"))
    t_t.text = title
    
    # 3. Kotak Petunjuk Berkas Sumber
    p_hint = ET.SubElement(tc, w("p"))
    pPr_h = ET.SubElement(p_hint, w("pPr"))
    jc_h = ET.SubElement(pPr_h, w("jc"))
    jc_h.set(w("val"), "left")
    spc_h = ET.SubElement(pPr_h, w("spacing"))
    spc_h.set(w("after"), "60")
    spc_h.set(w("line"), "240")
    r_h = ET.SubElement(p_hint, w("r"))
    rPr_h = ET.SubElement(r_h, w("rPr"))
    ET.SubElement(rPr_h, w("b"))
    sz_h = ET.SubElement(rPr_h, w("sz"))
    sz_h.set(w("val"), "20")
    col_h = ET.SubElement(rPr_h, w("color"))
    col_h.set(w("val"), "065F46") # Emerald green
    t_h = ET.SubElement(r_h, w("t"))
    t_h.text = f"📁 Berkas Sumber Disiapkan: {file_source}"
    
    # 4. Petunjuk Praktis Word
    p_guide = ET.SubElement(tc, w("p"))
    pPr_g = ET.SubElement(p_guide, w("pPr"))
    jc_g = ET.SubElement(pPr_g, w("jc"))
    jc_g.set(w("val"), "left")
    spc_g = ET.SubElement(pPr_g, w("spacing"))
    spc_g.set(w("after"), "120")
    spc_g.set(w("line"), "240")
    r_g = ET.SubElement(p_guide, w("r"))
    rPr_g = ET.SubElement(r_g, w("rPr"))
    ET.SubElement(rPr_g, w("i"))
    sz_g = ET.SubElement(rPr_g, w("sz"))
    sz_g.set(w("val"), "18")
    t_g = ET.SubElement(r_g, w("t"))
    t_g.text = "👉 Petunjuk Word: Klik pada area kotak ini, pilih menu Insert -> Pictures -> This Device -> pilih berkas di atas, lalu atur format posisi Rata Tengah (Center) dengan lebar sekitar 13 - 15 cm."
    
    # 5. Header Rincian
    p_sub = ET.SubElement(tc, w("p"))
    pPr_s = ET.SubElement(p_sub, w("pPr"))
    spc_s = ET.SubElement(pPr_s, w("spacing"))
    spc_s.set(w("after"), "40")
    spc_s.set(w("line"), "240")
    r_s = ET.SubElement(p_sub, w("r"))
    rPr_s = ET.SubElement(r_s, w("rPr"))
    ET.SubElement(rPr_s, w("b"))
    sz_s = ET.SubElement(rPr_s, w("sz"))
    sz_s.set(w("val"), "19")
    t_s = ET.SubElement(r_s, w("t"))
    t_s.text = "Rincian Komponen / Aliran yang Dimuat pada Gambar Ini:"
    
    # 6. Rincian Baris Deskripsi
    for line in desc_lines:
        p_line = ET.SubElement(tc, w("p"))
        pPr_l = ET.SubElement(p_line, w("pPr"))
        spc_l = ET.SubElement(pPr_l, w("spacing"))
        spc_l.set(w("after"), "40")
        spc_l.set(w("line"), "240")
        jc_l = ET.SubElement(pPr_l, w("jc"))
        jc_l.set(w("val"), "left")
        r_l = ET.SubElement(p_line, w("r"))
        rPr_l = ET.SubElement(r_l, w("rPr"))
        sz_l = ET.SubElement(rPr_l, w("sz"))
        sz_l.set(w("val"), "18")
        t_l = ET.SubElement(r_l, w("t"))
        t_l.text = line
        
    return tbl

print("build_thesis_full updated with enhanced frame_diagram.")
