# -*- coding: utf-8 -*-
"""
Core OpenXML utilities and tokenizer for UTDI thesis generation.
Automatically formats foreign terms in italics and adheres strictly to EYD & FTI UTDI 2026 guidelines.
"""

import xml.etree.ElementTree as ET
import re

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
ET.register_namespace('w', W_NS)
ET.register_namespace('r', "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
ET.register_namespace('m', "http://schemas.openxmlformats.org/officeDocument/2006/math")
ET.register_namespace('wp', "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing")
ET.register_namespace('a', "http://schemas.openxmlformats.org/drawingml/2006/main")
ET.register_namespace('pic', "http://schemas.openxmlformats.org/drawingml/2006/picture")

def w(tag):
    return f"{{{W_NS}}}{tag}"

# Comprehensive list of English and foreign technical terms that must be italicized in academic Indonesian
FOREIGN_WORDS = [
    'coffee shop', 'coffeeshop', 'self-ordering system', 'self-ordering', 'self-service technology', 
    'self-service', 'customer experience', 'peak hours', 'waiting time', 'human error', 
    'Single Page Application', 'single page application', 'Point of Sale', 'point of sale', 
    'Kitchen Display System', 'kitchen display system', 'First-In, First-Out', 'First-In First-Out', 
    'First In First Out', 'Role-Based Access Control', 'Role Based Access Control', 'Black Box Testing', 
    'black box testing', 'Equivalence Partitioning', 'equivalence partitioning', 'Boundary Value Analysis', 
    'boundary value analysis', 'Data Flow Diagram', 'Entity Relationship Diagram', 'Quick Response Code', 
    'QR Code', 'Uniform Resource Locator', 'Application Programming Interface', 'RESTful API', 
    'REST API', 'cross-platform', 'Mobile-First', 'mobile-first', 'mobile web', 'Mobile Web', 
    'client-server', 'client-side', 'server-side', 'server-side rendering', 'full page reload', 
    'front-end', 'frontend', 'back-end', 'backend', 'framework', 'frameworks', 'library', 'libraries', 
    'build tool', 'runtime engine', 'runtime', 'open-source', 'open source', 'decoupling architecture', 
    'decoupling', 'data silo', 'state management', 'virtual DOM', 'Virtual DOM', 'utility-first', 
    'utility first', 'compile-time error checking', 'compile-time checking', 'runtime error', 
    'omnidirectional', 'position detection patterns', 'alignment pattern', 'error correction code', 
    'finder pattern', 'mockup', 'mockups', 'wireframe', 'human-centered', 'reusable', 'hardware', 
    'software', 'in-depth interview', 'field observation', 'literature review', 'requirements analysis', 
    'Primary Key', 'primary key', 'Foreign Key', 'foreign key', 'auto increment', 'timestamp', 
    'not null', 'one-to-one', 'one-to-many', 'many-to-many', 'tuple', 'record', 'records', 
    'field', 'fields', 'attribute', 'attributes', 'constraints', 'takeaway', 'dine-in', 
    'sold-out', 'sold out', 'less sugar', 'more ice', 'no sugar', 'cart', 'checkout', 
    'token', 'tokens', 'session', 'sessions', 'payload', 'payloads', 'cash drawer management', 
    'cash drawer', 'starting cash', 'expected cash', 'actual cash', 'cash difference', 'cash movements', 
    'Purchase Order', 'purchase order', 'supplier', 'suppliers', 'inbound', 'waste', 'safety stock', 
    'stock opname', 'audit trail', 'audit logs', 'audit log', 'anti-fraud', 'payment gateway', 
    'settlement webhook', 'webhook', 'webhooks', 'middleware', 'endpoint', 'endpoints', 
    'dashboard', 'modal', 'badge', 'badges', 'pop-up', 'dropdown', 'web browser', 'browser', 
    'browsers', 'smartphone', 'smartphones', 'online', 'offline', 'real-time', 'state of the art', 
    'strict typing', 'strictly typed', 'waterfall', 'waterfall model', 'agile'
]
FOREIGN_WORDS.sort(key=len, reverse=True)
FOREIGN_PATTERN = re.compile(r'\b(' + '|'.join(re.escape(word) for word in FOREIGN_WORDS) + r')\b', re.IGNORECASE)

def add_runs(elem, text, bold=False, force_italic=False, font_size=24):
    """
    Splits text by recognized foreign terms and adds <w:r> runs.
    Foreign terms are automatically styled with <w:i/> (italic) per UTDI academic guidelines.
    """
    if not text:
        return
        
    if force_italic:
        r = ET.SubElement(elem, w("r"))
        rPr = ET.SubElement(r, w("rPr"))
        rF = ET.SubElement(rPr, w("rFonts"))
        rF.set(w("ascii"), "Times New Roman")
        rF.set(w("hAnsi"), "Times New Roman")
        sz = ET.SubElement(rPr, w("sz"))
        sz.set(w("val"), str(font_size))
        if bold:
            ET.SubElement(rPr, w("b"))
        ET.SubElement(rPr, w("i"))
        t = ET.SubElement(r, w("t"))
        t.text = text
        if text.startswith(" ") or text.endswith(" "):
            t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
        return

    pos = 0
    tokens = []
    for m in FOREIGN_PATTERN.finditer(text):
        start, end = m.span()
        if start > pos:
            tokens.append((text[pos:start], False))
        tokens.append((text[start:end], True))
        pos = end
    if pos < len(text):
        tokens.append((text[pos:], False))
        
    for seg_text, is_foreign in tokens:
        if not seg_text:
            continue
        r = ET.SubElement(elem, w("r"))
        rPr = ET.SubElement(r, w("rPr"))
        rF = ET.SubElement(rPr, w("rFonts"))
        rF.set(w("ascii"), "Times New Roman")
        rF.set(w("hAnsi"), "Times New Roman")
        sz = ET.SubElement(rPr, w("sz"))
        sz.set(w("val"), str(font_size))
        
        if bold:
            ET.SubElement(rPr, w("b"))
        if is_foreign:
            ET.SubElement(rPr, w("i"))
            
        t = ET.SubElement(r, w("t"))
        t.text = seg_text
        if seg_text.startswith(" ") or seg_text.endswith(" "):
            t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")

def p(text, bold=False, italic=False, force_italic=False, align="both", indent_first=True, hanging=False, space_after=120, space_line=360):
    """
    Standard paragraph for thesis body text.
    Font: Times New Roman 12pt (sz=24).
    Spacing: 1.5 lines (line=360) per UTDI standard.
    Indentation: 1.27 cm (firstLine=720) for standard paragraphs, or hanging indent for references.
    """
    is_italic = italic or force_italic
    elem = ET.Element(w("p"))
    pPr = ET.SubElement(elem, w("pPr"))
    if space_after is not None or space_line is not None:
        spc = ET.SubElement(pPr, w("spacing"))
        if space_line is not None:
            spc.set(w("line"), str(space_line))
            spc.set(w("lineRule"), "auto")
        if space_after is not None:
            spc.set(w("after"), str(space_after))
    if hanging:
        ind = ET.SubElement(pPr, w("ind"))
        ind.set(w("left"), "720")
        ind.set(w("hanging"), "720")
    elif indent_first:
        ind = ET.SubElement(pPr, w("ind"))
        ind.set(w("firstLine"), "720") # 1.27 cm
    jc = ET.SubElement(pPr, w("jc"))
    jc.set(w("val"), align)
    
    rPr_p = ET.SubElement(pPr, w("rPr"))
    rF_p = ET.SubElement(rPr_p, w("rFonts"))
    rF_p.set(w("ascii"), "Times New Roman")
    rF_p.set(w("hAnsi"), "Times New Roman")
    sz_p = ET.SubElement(rPr_p, w("sz"))
    sz_p.set(w("val"), "24") # 12pt
    
    add_runs(elem, text, bold=bold, force_italic=is_italic, font_size=24)
    return elem

def chapter_heading(chap_num, chap_title):
    """
    Chapter heading for BAB I, BAB II, BAB III, etc.
    Style: Heading1
    Font: Times New Roman 12pt Bold Centered.
    Formats as:
    BAB I
    PENDAHULUAN
    with a soft break so TOC displays as single entry.
    """
    elem = ET.Element(w("p"))
    pPr = ET.SubElement(elem, w("pPr"))
    pStyle = ET.SubElement(pPr, w("pStyle"))
    pStyle.set(w("val"), "Heading1")
    spc = ET.SubElement(pPr, w("spacing"))
    spc.set(w("before"), "360")
    spc.set(w("after"), "180")
    spc.set(w("line"), "360")
    spc.set(w("lineRule"), "auto")
    jc = ET.SubElement(pPr, w("jc"))
    jc.set(w("val"), "center")
    
    rPr_p = ET.SubElement(pPr, w("rPr"))
    rF_p = ET.SubElement(rPr_p, w("rFonts"))
    rF_p.set(w("ascii"), "Times New Roman")
    rF_p.set(w("hAnsi"), "Times New Roman")
    sz_p = ET.SubElement(rPr_p, w("sz"))
    sz_p.set(w("val"), "24") # 12pt
    ET.SubElement(rPr_p, w("b"))
    
    # Run 1: Chapter Number
    r1 = ET.SubElement(elem, w("r"))
    rPr1 = ET.SubElement(r1, w("rPr"))
    rF1 = ET.SubElement(rPr1, w("rFonts"))
    rF1.set(w("ascii"), "Times New Roman")
    rF1.set(w("hAnsi"), "Times New Roman")
    sz1 = ET.SubElement(rPr1, w("sz"))
    sz1.set(w("val"), "24")
    ET.SubElement(rPr1, w("b"))
    t1 = ET.SubElement(r1, w("t"))
    t1.text = chap_num
    
    # Soft line break
    if chap_title:
        ET.SubElement(r1, w("br"))
        
        # Run 2: Chapter Title
        r2 = ET.SubElement(elem, w("r"))
        rPr2 = ET.SubElement(r2, w("rPr"))
        rF2 = ET.SubElement(rPr2, w("rFonts"))
        rF2.set(w("ascii"), "Times New Roman")
        rF2.set(w("hAnsi"), "Times New Roman")
        sz2 = ET.SubElement(rPr2, w("sz"))
        sz2.set(w("val"), "24")
        ET.SubElement(rPr2, w("b"))
        t2 = ET.SubElement(r2, w("t"))
        t2.text = chap_title
        
    return elem

def heading(text, level=2, space_before=240, space_after=120, align="left"):
    """
    Subheading for sub-sections (Heading2, Heading3, etc.).
    """
    elem = ET.Element(w("p"))
    pPr = ET.SubElement(elem, w("pPr"))
    pStyle = ET.SubElement(pPr, w("pStyle"))
    pStyle.set(w("val"), f"Heading{level}")
    
    spc = ET.SubElement(pPr, w("spacing"))
    spc.set(w("before"), str(space_before))
    spc.set(w("after"), str(space_after))
    spc.set(w("line"), "360")
    spc.set(w("lineRule"), "auto")
    jc = ET.SubElement(pPr, w("jc"))
    jc.set(w("val"), align)
    
    rPr_p = ET.SubElement(pPr, w("rPr"))
    rF_p = ET.SubElement(rPr_p, w("rFonts"))
    rF_p.set(w("ascii"), "Times New Roman")
    rF_p.set(w("hAnsi"), "Times New Roman")
    sz_p = ET.SubElement(rPr_p, w("sz"))
    sz_p.set(w("val"), "24")
    ET.SubElement(rPr_p, w("b"))
    
    add_runs(elem, text, bold=True, force_italic=False, font_size=24)
    return elem

def caption(text, is_table=True):
    """
    Caption for tables (placed above table, centered, bold)
    or figures (placed below figure, centered, bold).
    """
    elem = ET.Element(w("p"))
    pPr = ET.SubElement(elem, w("pPr"))
    spc = ET.SubElement(pPr, w("spacing"))
    if is_table:
        spc.set(w("before"), "180")
        spc.set(w("after"), "60")
    else:
        spc.set(w("before"), "60")
        spc.set(w("after"), "180")
    spc.set(w("line"), "360")
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
    
    add_runs(elem, text, bold=True, force_italic=False, font_size=24)
    return elem

def table(headers, rows, col_widths=None):
    """
    Creates an OpenXML table with elegant formal styling:
    - w:tblGrid child element
    - Centered table alignment
    - Repeat header row (cantSplit + tblHeader)
    - Borders: horizontal lines only (top/bottom table 8pt, header bottom 8pt, inner 4pt)
    - Cell margins: top/bottom 80 dxa, left/right 120 dxa
    - Header text bold 10pt centered
    - Body text 10pt
    """
    tbl = ET.Element(w("tbl"))
    tblPr = ET.SubElement(tbl, w("tblPr"))
    
    tblW = ET.SubElement(tblPr, w("tblW"))
    tblW.set(w("w"), "9500")
    tblW.set(w("type"), "dxa")
    
    tblJc = ET.SubElement(tblPr, w("jc"))
    tblJc.set(w("val"), "center")
    
    tblBorders = ET.SubElement(tblPr, w("tblBorders"))
    topB = ET.SubElement(tblBorders, w("top"))
    topB.set(w("val"), "single")
    topB.set(w("sz"), "8")
    topB.set(w("space"), "0")
    topB.set(w("color"), "2B4C7E")
    
    botB = ET.SubElement(tblBorders, w("bottom"))
    botB.set(w("val"), "single")
    botB.set(w("sz"), "8")
    botB.set(w("space"), "0")
    botB.set(w("color"), "2B4C7E")
    
    for b_name in ["left", "right"]:
        b = ET.SubElement(tblBorders, w(b_name))
        b.set(w("val"), "none")
        
    inH = ET.SubElement(tblBorders, w("insideH"))
    inH.set(w("val"), "single")
    inH.set(w("sz"), "4")
    inH.set(w("space"), "0")
    inH.set(w("color"), "D0D7DE")
    
    inV = ET.SubElement(tblBorders, w("insideV"))
    inV.set(w("val"), "none")
    
    tblCellMar = ET.SubElement(tblPr, w("tblCellMar"))
    for m_side, m_val in [("top", "80"), ("bottom", "80"), ("left", "120"), ("right", "120")]:
        m = ET.SubElement(tblCellMar, w(m_side))
        m.set(w("w"), m_val)
        m.set(w("type"), "dxa")
        
    num_cols = len(headers)
    if not col_widths:
        w_per_col = 9500 // num_cols
        col_widths = [w_per_col] * num_cols
        
    tblGrid = ET.SubElement(tbl, w("tblGrid"))
    for cw in col_widths:
        gc = ET.SubElement(tblGrid, w("gridCol"))
        gc.set(w("w"), str(cw))
        
    header_tr = ET.SubElement(tbl, w("tr"))
    trPr = ET.SubElement(header_tr, w("trPr"))
    ET.SubElement(trPr, w("tblHeader"))
    ET.SubElement(trPr, w("cantSplit"))
    
    for idx, h_text in enumerate(headers):
        tc = ET.SubElement(header_tr, w("tc"))
        tcPr = ET.SubElement(tc, w("tcPr"))
        tcW = ET.SubElement(tcPr, w("tcW"))
        tcW.set(w("w"), str(col_widths[idx]))
        tcW.set(w("type"), "dxa")
        
        shd = ET.SubElement(tcPr, w("shd"))
        shd.set(w("val"), "clear")
        shd.set(w("color"), "auto")
        shd.set(w("fill"), "F0F4F8")
        
        tcBorders = ET.SubElement(tcPr, w("tcBorders"))
        b_bot = ET.SubElement(tcBorders, w("bottom"))
        b_bot.set(w("val"), "single")
        b_bot.set(w("sz"), "8")
        b_bot.set(w("color"), "2B4C7E")
        
        p_node = ET.SubElement(tc, w("p"))
        pPr = ET.SubElement(p_node, w("pPr"))
        spc = ET.SubElement(pPr, w("spacing"))
        spc.set(w("before"), "60")
        spc.set(w("after"), "60")
        spc.set(w("line"), "240")
        spc.set(w("lineRule"), "auto")
        jc_node = ET.SubElement(pPr, w("jc"))
        jc_node.set(w("val"), "center")
        
        add_runs(p_node, h_text, bold=True, font_size=20)
        
    for r_data in rows:
        tr = ET.SubElement(tbl, w("tr"))
        trPr = ET.SubElement(tr, w("trPr"))
        ET.SubElement(trPr, w("cantSplit"))
        
        for idx, val in enumerate(r_data):
            val_str = str(val) if val is not None else ""
            tc = ET.SubElement(tr, w("tc"))
            tcPr = ET.SubElement(tc, w("tcPr"))
            tcW = ET.SubElement(tcPr, w("tcW"))
            tcW.set(w("w"), str(col_widths[idx]))
            tcW.set(w("type"), "dxa")
            
            p_node = ET.SubElement(tc, w("p"))
            pPr = ET.SubElement(p_node, w("pPr"))
            spc = ET.SubElement(pPr, w("spacing"))
            spc.set(w("before"), "40")
            spc.set(w("after"), "40")
            spc.set(w("line"), "240")
            spc.set(w("lineRule"), "auto")
            
            jc_node = ET.SubElement(pPr, w("jc"))
            if idx == 0 and len(val_str) <= 4:
                jc_node.set(w("val"), "center")
            elif val_str.upper() in ["PK", "FK", "-", "YES", "NO"]:
                jc_node.set(w("val"), "center")
            else:
                jc_node.set(w("val"), "left")
                
            add_runs(p_node, val_str, bold=False, font_size=20)
            
    return tbl

def frame_diagram(title, file_source, desc_lines):
    """
    Creates a prominent, elegantly styled placeholder frame for diagrams/figures.
    Includes:
    - 1.5pt solid border (#2B4C7E)
    - Soft blue fill (#F0F4F8)
    - Prominent visual marker header
    - File path and MS Word paste instructions
    - Bullet points of diagram components
    """
    tbl = ET.Element(w("tbl"))
    tblPr = ET.SubElement(tbl, w("tblPr"))
    
    tblW = ET.SubElement(tblPr, w("tblW"))
    tblW.set(w("w"), "9500")
    tblW.set(w("type"), "dxa")
    
    tblJc = ET.SubElement(tblPr, w("jc"))
    tblJc.set(w("val"), "center")
    
    tblBorders = ET.SubElement(tblPr, w("tblBorders"))
    for b_side in ["top", "bottom", "left", "right"]:
        b = ET.SubElement(tblBorders, w(b_side))
        b.set(w("val"), "single")
        b.set(w("sz"), "12") # 1.5 pt
        b.set(w("space"), "0")
        b.set(w("color"), "2B4C7E")
        
    for b_side in ["insideH", "insideV"]:
        b = ET.SubElement(tblBorders, w(b_side))
        b.set(w("val"), "none")
        
    tblCellMar = ET.SubElement(tblPr, w("tblCellMar"))
    for m_side, m_val in [("top", "140"), ("bottom", "140"), ("left", "180"), ("right", "180")]:
        m = ET.SubElement(tblCellMar, w(m_side))
        m.set(w("w"), m_val)
        m.set(w("type"), "dxa")
        
    tblGrid = ET.SubElement(tbl, w("tblGrid"))
    gc = ET.SubElement(tblGrid, w("gridCol"))
    gc.set(w("w"), "9500")
    
    tr = ET.SubElement(tbl, w("tr"))
    trPr = ET.SubElement(tr, w("trPr"))
    ET.SubElement(trPr, w("cantSplit"))
    
    tc = ET.SubElement(tr, w("tc"))
    tcPr = ET.SubElement(tc, w("tcPr"))
    tcW = ET.SubElement(tcPr, w("tcW"))
    tcW.set(w("w"), "9500")
    tcW.set(w("type"), "dxa")
    
    shd = ET.SubElement(tcPr, w("shd"))
    shd.set(w("val"), "clear")
    shd.set(w("color"), "auto")
    shd.set(w("fill"), "F0F4F8")
    
    # 1. Header Marker
    p_hdr = ET.SubElement(tc, w("p"))
    pPr_h = ET.SubElement(p_hdr, w("pPr"))
    spc_h = ET.SubElement(pPr_h, w("spacing"))
    spc_h.set(w("before"), "80")
    spc_h.set(w("after"), "60")
    spc_h.set(w("line"), "240")
    spc_h.set(w("lineRule"), "auto")
    jc_h = ET.SubElement(pPr_h, w("jc"))
    jc_h.set(w("val"), "center")
    
    add_runs(p_hdr, "📍 [ PENANDA TEMPAT PENEMPELAN GAMBAR / DIAGRAM ]", bold=True, font_size=20)
    
    # 2. Diagram Title
    p_title = ET.SubElement(tc, w("p"))
    pPr_t = ET.SubElement(p_title, w("pPr"))
    spc_t = ET.SubElement(pPr_t, w("spacing"))
    spc_t.set(w("before"), "40")
    spc_t.set(w("after"), "60")
    spc_t.set(w("line"), "240")
    spc_t.set(w("lineRule"), "auto")
    jc_t = ET.SubElement(pPr_t, w("jc"))
    jc_t.set(w("val"), "center")
    
    add_runs(p_title, title, bold=True, font_size=22)
    
    # 3. Source File Indicator
    p_src = ET.SubElement(tc, w("p"))
    pPr_s = ET.SubElement(p_src, w("pPr"))
    spc_s = ET.SubElement(pPr_s, w("spacing"))
    spc_s.set(w("before"), "40")
    spc_s.set(w("after"), "60")
    spc_s.set(w("line"), "240")
    spc_s.set(w("lineRule"), "auto")
    jc_s = ET.SubElement(pPr_s, w("jc"))
    jc_s.set(w("val"), "center")
    
    add_runs(p_src, f"Berkas Sumber: {file_source}", bold=False, force_italic=True, font_size=18)
    
    # 4. User Instruction
    p_inst = ET.SubElement(tc, w("p"))
    pPr_i = ET.SubElement(p_inst, w("pPr"))
    spc_i = ET.SubElement(pPr_i, w("spacing"))
    spc_i.set(w("before"), "40")
    spc_i.set(w("after"), "80")
    spc_i.set(w("line"), "240")
    spc_i.set(w("lineRule"), "auto")
    jc_i = ET.SubElement(pPr_i, w("jc"))
    jc_i.set(w("val"), "left")
    
    inst_text = "Petunjuk Pengisian: Hapus bingkai penanda ini atau tempelkan berkas gambar di atas/dalam bingkai melalui menu Insert > Pictures pada Microsoft Word, kemudian sesuaikan ukuran gambar agar simetris di tengah."
    add_runs(p_inst, inst_text, bold=False, force_italic=True, font_size=18)
    
    # 5. Component breakdown lines
    for line in desc_lines:
        p_line = ET.SubElement(tc, w("p"))
        pPr_l = ET.SubElement(p_line, w("pPr"))
        spc_l = ET.SubElement(pPr_l, w("spacing"))
        spc_l.set(w("before"), "20")
        spc_l.set(w("after"), "20")
        spc_l.set(w("line"), "240")
        spc_l.set(w("lineRule"), "auto")
        jc_l = ET.SubElement(pPr_l, w("jc"))
        jc_l.set(w("val"), "left")
        
        add_runs(p_line, line, bold=False, font_size=18)
        
    return tbl

print("build_thesis_full updated with full tokenizer, chapter_heading, and Heading styles.")
