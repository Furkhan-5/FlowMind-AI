import os
import sys
import shutil
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Image, HRFlowable
)
from reportlab.pdfgen import canvas

# =========================================================================
# NUMBERED CANVAS FOR DYNAMIC "PAGE X OF Y" AND RUNNING HEADERS
# =========================================================================
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_header_footer(self, page_count):
        if self._pageNumber == 1:
            return  # Suppress running header/footer on title cover page

        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))

        # Running Header
        self.drawString(42, 806, "FLOWMIND AI — CAPSTONE IMPLEMENTATION PROGRESS REPORT | WEEKS 1–7")
        self.drawRightString(553, 806, "VIT-AP UNIVERSITY")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(42, 798, 553, 798)

        # Running Footer
        self.line(42, 36, 553, 36)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(42, 24, "Department of Computer Science & Engineering — Academic Year 2026")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(553, 24, page_str)
        self.restoreState()


# =========================================================================
# COMPREHENSIVE 28-30 PAGE CAPSTONE IMPLEMENTATION REPORT GENERATOR
# =========================================================================
def create_pdf_report(output_pdf_path):
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=48
    )

    styles = getSampleStyleSheet()

    # --- Typography Styles ---
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=colors.HexColor('#1B365D'),
        alignment=1,
        spaceAfter=5
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#4F46E5'),
        alignment=1,
        spaceAfter=8
    )

    cover_meta = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13.5,
        leading=17,
        textColor=colors.HexColor('#1B365D'),
        spaceBefore=7,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13.5,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=5,
        spaceAfter=3,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155'),
        spaceBefore=4,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11.8,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11.8,
        textColor=colors.HexColor('#1E293B'),
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2.8
    )

    callout_style = ParagraphStyle(
        'Callout_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.2,
        leading=11.5,
        textColor=colors.HexColor('#1E1B4B')
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.2,
        leading=9.2,
        textColor=colors.white,
        alignment=0
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.8,
        leading=8.8,
        textColor=colors.HexColor('#1E293B')
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.8,
        leading=8.8,
        textColor=colors.HexColor('#0F172A')
    )

    table_cell_code = ParagraphStyle(
        'TableCellCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=6.2,
        leading=8.2,
        textColor=colors.HexColor('#0F172A')
    )

    caption_style = ParagraphStyle(
        'CaptionStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.8,
        leading=10,
        textColor=colors.HexColor('#475569'),
        alignment=1,
        spaceBefore=3,
        spaceAfter=5
    )

    img_dir = r"c:\Capstone\report_diagrams"
    story = []

    # =========================================================================
    # PAGE 1: ACADEMIC COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 8))
    story.append(Paragraph("PROJECT PROGRESS REPORT — WEEKS 1 TO 7 (PRODUCTION READINESS &amp; SECURITY HARDENING)", ParagraphStyle('Badge', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9.5, leading=12, textColor=colors.HexColor('#4F46E5'), alignment=1)))
    story.append(Spacer(1, 5))
    story.append(Paragraph("FLOWMIND AI", title_style))
    story.append(Paragraph("Multilingual Autonomous AI Business Operating System &bull; Cryptographic BYOK &bull; RAG Knowledge Hub &bull; DAG Engine", subtitle_style))
    story.append(Paragraph("Enterprise Business Suite (CRM, HR, Finance, Inventory, Support) &bull; AI Data Studio &bull; Dense Vector RAG Hub<br/>AES-256-GCM Envelope Encryption &bull; PostgreSQL 18 (29 Models) &bull; 15-Agent Swarm &bull; Jest E2E Suite (33/33 Tests Pass)", cover_meta))
    story.append(Spacer(1, 6))

    story.append(HRFlowable(width="88%", thickness=1.5, color=colors.HexColor("#4F46E5"), spaceAfter=10, spaceBefore=2))

    # Academic Meta Table
    acad_data = [
        [Paragraph("<b>Academic Program:</b>", table_cell_bold), Paragraph("B.Tech in Computer Science &amp; Engineering (Final Year Capstone Project)", table_cell_style)],
        [Paragraph("<b>Course Code &amp; Academic Term:</b>", table_cell_bold), Paragraph("Capstone Project / Semester VII (Academic Year 2026)", table_cell_style)],
        [Paragraph("<b>Department &amp; Institution:</b>", table_cell_bold), Paragraph("Department of Computer Science &amp; Engineering, SCOPE, VIT-AP University", table_cell_style)],
        [Paragraph("<b>Evaluation Milestone:</b>", table_cell_bold), Paragraph("Week 7 Review: Production Security Hardening, Cryptographic BYOK, Jest E2E Test Suite (33/33 Passing)", table_cell_style)],
        [Paragraph("<b>Date of Evaluation:</b>", table_cell_bold), Paragraph("November 2026 | Amaravati, Andhra Pradesh, India", table_cell_style)],
        [Paragraph("<b>Verified Repository:</b>", table_cell_bold), Paragraph("https://github.com/Furkhan-5/FlowMind-AI (Branch: main, Commit: 2cbd5ce)", table_cell_style)]
    ]
    t_acad = Table(acad_data, colWidths=[140, 375])
    t_acad.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(t_acad)
    story.append(Spacer(1, 8))

    # Team Members Table
    team_headers = [Paragraph("Team Member Name", table_header_style), Paragraph("Registration No", table_header_style), Paragraph("Project Domain Role", table_header_style), Paragraph("Primary Architectural Contributions", table_header_style)]
    team_rows = [
        [Paragraph("<b>Furkhan Abdul Raheem</b>", table_cell_bold), Paragraph("23BCE7868", table_cell_style), Paragraph("AI Lead &amp; Systems Architect", table_cell_style), Paragraph("Master CEO Orchestrator, 15-Agent Swarm, Unified AI Provider Abstraction (BYOK Gemini/OpenAI), RAG Dense Vector Hub.", table_cell_style)],
        [Paragraph("<b>Aniket Sahu</b>", table_cell_bold), Paragraph("23BCE7881", table_cell_style), Paragraph("Frontend &amp; Layman UX Lead", table_cell_style), Paragraph("BYOK Settings Console (/settings/ai-providers), Data Studio UI, Recharts Visualizations, Layman Accessible Chatbot, Thought Stream.", table_cell_style)],
        [Paragraph("<b>Anjali Karagatla</b>", table_cell_bold), Paragraph("23BCE8077", table_cell_style), Paragraph("Workflow Engine Lead", table_cell_style), Paragraph("NL-to-DAG Planner, Topological DAG Runner, Kahn's Sorter, Visual DAG Builder, Inbound Webhooks, Jest E2E Workflow Tests.", table_cell_style)],
        [Paragraph("<b>Farukh</b>", table_cell_bold), Paragraph("23BCE20345", table_cell_style), Paragraph("Data, Security &amp; RBAC Lead", table_cell_style), Paragraph("AES-256-GCM Envelope Encryption, PostgreSQL 18 (29 Models), 3-Tier RBAC, Anti-Self-Approval, HTTP Security Headers, SAST Audit.", table_cell_style)]
    ]
    t_team = Table([team_headers] + team_rows, colWidths=[105, 70, 110, 230])
    t_team.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_team)
    story.append(Spacer(1, 8))

    # Executive Note Callout
    callout_data = [[Paragraph("<b>DOCUMENT CLASSIFICATION &amp; VERIFICATION STATEMENT:</b> This progress report serves as the official university capstone technical submission for FlowMind AI through Week 7. Every documented feature, mathematical methodology, technology version, database model, cryptographic algorithm, API endpoint, and quality metric represents an active, verified implementation compiled and tested directly in the project codebase (33 passing Jest tests, 31 compiled Next.js routes, 0 type errors).", callout_style)]]
    t_callout = Table(callout_data, colWidths=[515])
    t_callout.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EEF2FF')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#6366F1')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_callout)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: TABLE OF CONTENTS & EXECUTIVE ABSTRACT
    # =========================================================================
    story.append(Paragraph("Table of Contents &amp; Executive Abstract", h1_style))
    story.append(Paragraph(
        "<b>Executive Abstract:</b> FlowMind AI is an enterprise-grade Autonomous Business Operating System designed to eliminate SaaS fragmentation and bridge the technical divide for non-programmer operators. Combining an Indic multilingual natural language interface (7 regional languages), a 15-Agent Swarm, a Topological DAG Automation Runner (Kahn's algorithm), and a 29-model PostgreSQL relational database with Prisma ORM, FlowMind AI empowers non-technical users to query cross-domain metrics and execute complex, governed business workflows. In Week 6, the platform gained an AI Data Studio with interactive Recharts visualizations, a 384-dimensional dense semantic vector RAG Knowledge Hub with exact citations and hallucination defense, a domain-specialized Swarm Knowledge Tool, and an autonomous Proactive Anomaly Scanner with Action Governance dual-control approvals. In Week 7, the platform achieved complete <b>Production Hardening</b>: implementing Bring Your Own Key (BYOK) dynamic intelligence for Google Gemini and OpenAI with AES-256-GCM envelope encryption, server-controlled model allowlists, a dedicated settings console, an automated 33-test Jest integration test suite (100% pass rate in 0.72s), and enterprise web security headers (CSP, HSTS, X-Frame-Options). All features are verified with zero TypeScript compilation errors and 100% Next.js production build success across 31 routes.",
        body_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("Table of Contents", h2_style))
    toc_data = [
        [Paragraph("1. Project Overview, Context &amp; Problem Statement", table_cell_bold), Paragraph("Page 3", table_cell_style), Paragraph("13. Week 6: RAG Knowledge Intelligence &amp; Vector Hub", table_cell_bold), Paragraph("Page 15", table_cell_style)],
        [Paragraph("2. High-Level System Architecture &amp; Tech Stack", table_cell_bold), Paragraph("Page 4", table_cell_style), Paragraph("14. Knowledge-Aware Agent Mesh &amp; Proactive Insights", table_cell_bold), Paragraph("Page 16", table_cell_style)],
        [Paragraph("3. End-to-End System Data Flow Pipeline", table_cell_bold), Paragraph("Page 5", table_cell_style), Paragraph("15. Formal System Modeling &amp; UML Specifications", table_cell_bold), Paragraph("Page 17", table_cell_style)],
        [Paragraph("4. Indic Multilingual NLP &amp; Regional Processing", table_cell_bold), Paragraph("Page 6", table_cell_style), Paragraph("16. Comprehensive API Endpoints Specification", table_cell_bold), Paragraph("Page 19", table_cell_style)],
        [Paragraph("5. 15-Specialized AI Agent Swarm &amp; Orchestration", table_cell_bold), Paragraph("Page 7", table_cell_style), Paragraph("17. Evidence-Based Progress Matrix (W1–W6)", table_cell_bold), Paragraph("Page 20", table_cell_style)],
        [Paragraph("6. Action Governance, Risk &amp; Security Shield", table_cell_bold), Paragraph("Page 8", table_cell_style), Paragraph("18. Quality Assurance &amp; Architectural Defect Log", table_cell_bold), Paragraph("Page 22", table_cell_style)],
        [Paragraph("7. Natural Language DAG Workflow Engine", table_cell_bold), Paragraph("Page 9", table_cell_style), Paragraph("<b>19. Week 7: Production Security &amp; BYOK Architecture</b>", table_cell_bold), Paragraph("<b>Page 23</b>", table_cell_style)],
        [Paragraph("8. Visual Workflow Builder &amp; Webhook Subsystem", table_cell_bold), Paragraph("Page 10", table_cell_style), Paragraph("<b>20. Week 7: Unified AI Abstraction &amp; Dynamic Routing</b>", table_cell_bold), Paragraph("<b>Page 24</b>", table_cell_style)],
        [Paragraph("9. Enterprise Relational Database Layer (PostgreSQL 18)", table_cell_bold), Paragraph("Page 11", table_cell_style), Paragraph("<b>21. Week 7: Jest E2E Test Suite &amp; Web Hardening</b>", table_cell_bold), Paragraph("<b>Page 25</b>", table_cell_style)],
        [Paragraph("10. Integrated Business Operations Suite: CRM 360", table_cell_bold), Paragraph("Page 12", table_cell_style), Paragraph("<b>22. Complete Evidence Matrix (Weeks 1 to 7)</b>", table_cell_bold), Paragraph("<b>Page 27</b>", table_cell_style)],
        [Paragraph("11. Business Suite: HR, Finance, Inventory &amp; Support", table_cell_bold), Paragraph("Page 13", table_cell_style), Paragraph("<b>23. Remaining Roadmap (Week 8) &amp; Conclusion</b>", table_cell_bold), Paragraph("<b>Page 29</b>", table_cell_style)],
        [Paragraph("12. Week 6: AI Data Studio &amp; Real-Time Analytics", table_cell_bold), Paragraph("Page 14", table_cell_style), Paragraph("", table_cell_style), Paragraph("", table_cell_style)]
    ]
    t_toc = Table(toc_data, colWidths=[185, 45, 235, 50])
    t_toc.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_toc)
    story.append(Spacer(1, 6))

    story.append(Paragraph("Executive Highlights &amp; Current Milestone Summary", h2_style))
    highlights = [
        ("Production BYOK Dynamic AI Engine", "Implemented secure settings console (/settings/ai-providers) for Google Gemini and OpenAI with AES-256-GCM envelope encryption, 96-bit unique nonces, 128-bit auth tags, server-controlled allowlists, and real-time connectivity probes."),
        ("Complete End-to-End Jest Test Suite", "Constructed comprehensive testing infrastructure with Jest 29 and ts-jest. 33 tests across 5 test suites (Unit, BYOK Integration, AI Routing, RBAC, Business E2E) passing with 100% success rate in 0.72s."),
        ("Web Application Security Hardening", "Configured production HTTP headers (CSP, HSTS max-age=63072000, X-Frame-Options: DENY, X-Content-Type-Options: nosniff). Conducted SAST analysis, secret scans, and dependency advisory resolution."),
        ("AI Data Studio &amp; Dense Vector RAG Hub", "Operates a 384-dimensional dense semantic vector space with cosine similarity and BM25 hybrid ranking, multi-tenant RBAC chunk isolation, and interactive Recharts operational dashboards."),
        ("PostgreSQL 18 Enterprise Persistence", "29 relational Prisma models synced and operational on localhost:5432/flowmind_db with zero connection dropouts and full transactional integrity.")
    ]
    for title, desc in highlights:
        story.append(Paragraph(f"<b>&bull; {title}:</b> {desc}", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: CHAPTER 1 — PROJECT OVERVIEW, CONTEXT & PROBLEM STATEMENT
    # =========================================================================
    story.append(Paragraph("1. Project Overview, Context &amp; Problem Statement", h1_style))
    story.append(Paragraph(
        "Modern enterprise business operations suffer from severe <b>SaaS fragmentation</b>. A typical mid-market company relies on disconnected tools: Salesforce or HubSpot for CRM, Jira or BambooHR for workforce management, Tally or Zoho Books for invoicing and GST compliance, Zendesk for support ticketing, and disparate spreadsheets for inventory tracking. This fragmentation introduces substantial manual re-entry overhead, data silos, communication delays, and operational friction.",
        body_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("1.1. The Technical Divide in Enterprise Operations", h2_style))
    story.append(Paragraph(
        "While visual automation platforms (such as Zapier, Make, and Camunda) exist, they require significant technical literacy: understanding webhooks, JSON payloads, OAuth flows, and logical conditional structures. Non-technical business operators—such as branch managers, warehouse supervisors, HR associates, and sales representatives—are excluded from configuring their own workflows.",
        body_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("1.2. The FlowMind AI Architectural Solution", h2_style))
    story.append(Paragraph(
        "FlowMind AI solves these dual challenges through a unified, sovereign, multilingual AI Business Operating System. By combining an intuitive Indic conversational interface (supporting English, Hindi, Telugu, Tamil, Kannada, Malayalam, and Bengali) with an autonomous 15-Agent Swarm, a deterministic Topological DAG Workflow Engine (Kahn's algorithm), and an enterprise PostgreSQL relational foundation, FlowMind AI democratizes enterprise workflow automation.",
        body_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("1.3. Formal Architectural Principles", h2_style))
    principles = [
        ("Layman Accessible Interface", "Non-technical users control workflows and business metrics through plain language or voice prompts without coding or JSON configuration."),
        ("Multi-Tier Action Governance (HITL)", "High-risk financial or policy actions (e.g., invoices over ₹1,00,000, employee terminations, discount overrides > 25%) mandate explicit human confirmation via Action Cards before execution."),
        ("Deterministic DAG Verification", "Workflows compile into Directed Acyclic Graphs verified via Kahn's Topological Sort algorithm, strictly preventing cycles, deadlocks, and infinite loops."),
        ("Sovereign Enterprise Security & BYOK", "Enterprises retain full ownership of API keys via AES-256-GCM envelope encryption, 3-tier RBAC, strict tenant isolation, and detailed tamper-proof audit trails.")
    ]
    for name, p_desc in principles:
        story.append(Paragraph(f"<b>&bull; {name}:</b> {p_desc}", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: CHAPTER 2 — HIGH-LEVEL SYSTEM ARCHITECTURE & TECH STACK
    # =========================================================================
    story.append(Paragraph("2. High-Level System Architecture &amp; Layered Design", h1_style))
    story.append(Paragraph(
        "FlowMind AI is architected as an enterprise-grade, multi-tier distributed platform. Figure 1 illustrates the high-level system architecture spanning seven decoupled layers.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig1_system_architecture.png")):
        story.append(Image(os.path.join(img_dir, "fig1_system_architecture.png"), width=495, height=230))
        story.append(Paragraph("Figure 1: High-Level FlowMind AI System Architecture with Integrated PostgreSQL Database Layer", caption_style))

    story.append(Paragraph("2.1. Full-Stack Technology Stack &amp; Version Specifications", h2_style))
    stack_data = [
        [Paragraph("Architectural Tier", table_header_style), Paragraph("Technology / Framework", table_header_style), Paragraph("Version", table_header_style), Paragraph("Architectural Purpose &amp; Rationale", table_header_style)],
        [Paragraph("Frontend Framework", table_cell_bold), Paragraph("Next.js App Router (React)", table_cell_style), Paragraph("14.2.35 / 18.3.1", table_cell_style), Paragraph("Server components, streaming SSR, and zero-latency route transitions.", table_cell_style)],
        [Paragraph("Interactive Visualization", table_cell_bold), Paragraph("Recharts &amp; Three.js", table_cell_style), Paragraph("2.12.5 / 0.163.0", table_cell_style), Paragraph("Responsive area/bar/donut charts and interactive 3D executive canvas.", table_cell_style)],
        [Paragraph("Cryptographic Security", table_cell_bold), Paragraph("Node.js Crypto (AES-256-GCM)", table_cell_style), Paragraph("Built-in / ES2022", table_cell_style), Paragraph("Envelope encryption for BYOK credentials with 96-bit unique IVs &amp; 128-bit auth tags.", table_cell_style)],
        [Paragraph("Testing Infrastructure", table_cell_bold), Paragraph("Jest &amp; ts-jest", table_cell_style), Paragraph("29.7.0 / 29.2.6", table_cell_style), Paragraph("Automated TypeScript integration test runner with path alias mapping (33 tests pass).", table_cell_style)],
        [Paragraph("Primary Database", table_cell_bold), Paragraph("PostgreSQL Enterprise", table_cell_style), Paragraph("18.0", table_cell_style), Paragraph("ACID-compliant relational database with JSONB vector storage on localhost:5432.", table_cell_style)],
        [Paragraph("Object-Relational Mapping", table_cell_bold), Paragraph("Prisma ORM", table_cell_style), Paragraph("5.19.1", table_cell_style), Paragraph("Type-safe database client with 29 relational models and migration management.", table_cell_style)],
        [Paragraph("AI Model Providers", table_cell_bold), Paragraph("Google Gemini &amp; OpenAI", table_cell_style), Paragraph("v1beta / v1", table_cell_style), Paragraph("Dynamic BYOK model routing (Gemini 1.5 Pro/Flash, GPT-4o/4o-mini) with governance.", table_cell_style)],
        [Paragraph("Authentication &amp; Tokens", table_cell_bold), Paragraph("Jose JWT &amp; Bcrypt.js", table_cell_style), Paragraph("6.2.12 / 3.0.3", table_cell_style), Paragraph("Stateless cryptographic session tokens and salted password hashing.", table_cell_style)],
        [Paragraph("Multilingual Engine", table_cell_bold), Paragraph("Custom Indic NLP Pipeline", table_cell_style), Paragraph("FlowMind v1.0", table_cell_style), Paragraph("Unicode script classification, stop-word filtering, and intent extraction.", table_cell_style)]
    ]
    t_stack = Table(stack_data, colWidths=[90, 115, 65, 245])
    t_stack.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_stack)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: CHAPTER 3 — END-TO-END SYSTEM DATA FLOW PIPELINE
    # =========================================================================
    story.append(Paragraph("3. End-to-End System Data Flow Pipeline", h1_style))
    story.append(Paragraph(
        "FlowMind AI processes inbound user requests through a 10-stage sequential pipeline designed to guarantee zero prompt leakage, sub-second latency, and deterministic execution. Figure 2 diagrams this end-to-end pipeline.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig2_data_flow_pipeline.png")):
        story.append(Image(os.path.join(img_dir, "fig2_data_flow_pipeline.png"), width=495, height=210))
        story.append(Paragraph("Figure 2: End-to-End Data Flow Pipeline from User Prompt to PostgreSQL Execution Audit", caption_style))

    story.append(Paragraph("3.1. Detailed Pipeline Processing Stages", h2_style))
    stages = [
        ("Stage 1 — Multimodal Ingestion", "Accepts natural language text or voice audio input via Web Speech API and converts to UTF-8 text."),
        ("Stage 2 — Indic Language Detection", "Classifies Unicode code points to detect 7 regional Indian languages (Hindi, Telugu, Tamil, Kannada, Malayalam, Bengali, English)."),
        ("Stage 3 — Security Shield Scan", "Interprets input against adversarial patterns (prompt injection, jailbreak attempts, system instruction extraction) via promptInjectionShield.ts."),
        ("Stage 4 — Intent Parsing & Recall", "Maps language tokens to canonical business actions (e.g., CREATE_INVOICE, QUALIFY_LEAD) and recalls multi-turn conversation context from TaskMemory."),
        ("Stage 5 — Master Orchestrator Routing", "Evaluates agent capabilities and dispatches tasks to the appropriate specialized agent in the 15-Agent Swarm."),
        ("Stage 6 — Dynamic AI / Deterministic Evaluation", "Executes agent domain logic using active BYOK Gemini/OpenAI models or sovereign deterministic operational rules."),
        ("Stage 7 — Action Governance Gatekeeper", "Calculates risk tier (LOW, MEDIUM, HIGH, CRITICAL) and evaluates dual-control authorization matrices."),
        ("Stage 8 — Human-in-the-Loop Confirmation", "Renders interactive Action Cards in the chat stream with simulated before/after operational state diffs."),
        ("Stage 9 — Execution & Artifact Generation", "Dispatches transactional database updates and generates downloadable artifacts (GST tax invoices, CSV exports)."),
        ("Stage 10 — PostgreSQL Audit Logging", "Records immutable audit events, execution logs, and multilingual telemetry into PostgreSQL 18.")
    ]
    for s_title, s_desc in stages:
        story.append(Paragraph(f"<b>&bull; {s_title}:</b> {s_desc}", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: CHAPTER 4 — INDIC MULTILINGUAL NLP & REGIONAL LANGUAGE PROCESSING
    # =========================================================================
    story.append(Paragraph("4. Indic Multilingual NLP &amp; Regional Language Processing", h1_style))
    story.append(Paragraph(
        "To enable true accessibility for non-technical Indian operators, FlowMind AI integrates a native Indic processing engine capable of understanding enterprise instructions in 7 languages. Figure 3 illustrates the script detection and localized response flow.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig3_multilingual_flow.png")):
        story.append(Image(os.path.join(img_dir, "fig3_multilingual_flow.png"), width=495, height=195))
        story.append(Paragraph("Figure 3: Indic Language Detection, Script Classification & Localized Agent Response Architecture", caption_style))

    story.append(Paragraph("4.1. Supported Languages &amp; Unicode Block Allocation", h2_style))
    indic_table = [
        [Paragraph("Language", table_header_style), Paragraph("Script Family", table_header_style), Paragraph("Unicode Block Range", table_header_style), Paragraph("Localized Agent Prompt Sample", table_header_style)],
        [Paragraph("English (en)", table_cell_bold), Paragraph("Latin", table_cell_style), Paragraph("U+0000 – U+007F", table_cell_code), Paragraph("Create a GST invoice of ₹50,000 for Acme Corp.", table_cell_style)],
        [Paragraph("Telugu (te)", table_cell_bold), Paragraph("Telugu", table_cell_style), Paragraph("U+0C00 – U+0C7F", table_cell_code), Paragraph("Acme Corp కోసం ₹50,000 కు GST ఇన్వాయిస్ రూపొందించండి.", table_cell_style)],
        [Paragraph("Hindi (hi)", table_cell_bold), Paragraph("Devanagari", table_cell_style), Paragraph("U+0900 – U+097F", table_cell_code), Paragraph("Acme Corp के लिए ₹50,000 का GST चालान बनाएं।", table_cell_style)],
        [Paragraph("Tamil (ta)", table_cell_bold), Paragraph("Tamil", table_cell_style), Paragraph("U+0B80 – U+0BFF", table_cell_code), Paragraph("Acme Corp நிறுவனத்திற்கு ₹50,000 GST விலைப்பட்டியல் உருவாக்கவும்.", table_cell_style)],
        [Paragraph("Kannada (kn)", table_cell_bold), Paragraph("Kannada", table_cell_style), Paragraph("U+0C80 – U+0CFF", table_cell_code), Paragraph("Acme Corp ಗಾಗಿ ₹50,000 GST ಇನ್‌ವಾಯ್ಸ್ ರಚಿಸಿ.", table_cell_style)],
        [Paragraph("Malayalam (ml)", table_cell_bold), Paragraph("Malayalam", table_cell_style), Paragraph("U+0D00 – U+0D7F", table_cell_code), Paragraph("Acme Corp-ന് ₹50,000 GST ഇൻവോയ്സ് തയ്യാറാക്കുക.", table_cell_style)],
        [Paragraph("Bengali (bn)", table_cell_bold), Paragraph("Bengali", table_cell_style), Paragraph("U+0980 – U+09FF", table_cell_code), Paragraph("Acme Corp এর জন্য ₹50,000 এর একটি GST চালান তৈরি করুন।", table_cell_style)]
    ]
    t_indic = Table(indic_table, colWidths=[75, 80, 110, 250])
    t_indic.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_indic)
    story.append(Spacer(1, 4))

    story.append(Paragraph("4.2. Intent Normalization &amp; Canonical Mapping", h2_style))
    story.append(Paragraph(
        "Regardless of input language, the Indic NLP Engine tokenizes and normalizes prompts into uniform JSON canonical action schemas: <code>{ action: 'CREATE_INVOICE', targetAgent: 'Finance', parameters: { client: 'Acme Corp', amount: 50000, taxRate: 0.18 } }</code>. This enables domain agents to operate with language-agnostic business logic.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 7: CHAPTER 5 — 15-SPECIALIZED AI AGENT SWARM & ORCHESTRATION
    # =========================================================================
    story.append(Paragraph("5. 15-Specialized AI Agent Swarm &amp; Orchestration Protocol", h1_style))
    story.append(Paragraph(
        "FlowMind AI distributes enterprise operational intelligence across a coordinated 15-Agent Swarm. The Master CEO Orchestrator acts as the central router and synthesizer. Figure 4 illustrates the inter-agent topology.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig4_week3_agent_mesh.png")):
        story.append(Image(os.path.join(img_dir, "fig4_week3_agent_mesh.png"), width=495, height=210))
        story.append(Paragraph("Figure 4: 15-Agent Swarm Mesh Topology with Master CEO Orchestrator & Inter-Agent Handoff Engine", caption_style))

    story.append(Paragraph("5.1. Agent Registry &amp; Domain Responsibilities", h2_style))
    agents_table = [
        [Paragraph("Agent Name", table_header_style), Paragraph("Domain &amp; Classification", table_header_style), Paragraph("Core Responsibilities &amp; Autonomous Tools", table_header_style)],
        [Paragraph("1. CEO / Orchestrator", table_cell_bold), Paragraph("Executive &bull; Master Router", table_cell_style), Paragraph("Cross-domain intent resolution, inter-agent delegation, and global task memory synthesis.", table_cell_style)],
        [Paragraph("2. Sales Agent", table_cell_bold), Paragraph("Revenue &bull; CRM Operations", table_cell_style), Paragraph("Inbound lead qualification (BANT model), pipeline tracking, CRM stage progression.", table_cell_style)],
        [Paragraph("3. Finance Agent", table_cell_bold), Paragraph("Fiscal &bull; Compliance", table_cell_style), Paragraph("18% GST tax computation, invoice generation, HSN/SAC code assignment, payment reconciliation.", table_cell_style)],
        [Paragraph("4. HR Agent", table_cell_bold), Paragraph("People &bull; Workforce", table_cell_style), Paragraph("Staff directory access, leave balance checks, anti-self-approval enforcement, payroll computation.", table_cell_style)],
        [Paragraph("5. Analytics Agent", table_cell_bold), Paragraph("Business Intelligence", table_cell_style), Paragraph("Real-time revenue metrics, churn rate calculation, MRR/ARR aggregations, executive reporting.", table_cell_style)],
        [Paragraph("6. Support Agent", table_cell_bold), Paragraph("Customer Success", table_cell_style), Paragraph("Ticket priority classification, SLA countdown monitoring, automated resolution guidance.", table_cell_style)],
        [Paragraph("7. Operations Agent", table_cell_bold), Paragraph("Logistics &bull; Inventory", table_cell_style), Paragraph("Warehouse stock level tracking, low-inventory alerts, automated reorder generation.", table_cell_style)],
        [Paragraph("8–15. Domain Swarm", table_cell_bold), Paragraph("Specialized Operational Agents", table_cell_style), Paragraph("Legal, Marketing, IT Admin, Security, QA, Procurement, Compliance, and Knowledge Agents.", table_cell_style)]
    ]
    t_agents = Table(agents_table, colWidths=[95, 115, 305])
    t_agents.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_agents)
    story.append(Spacer(1, 4))

    story.append(Paragraph("5.2. Autonomous Inter-Agent Handoff Protocol", h2_style))
    story.append(Paragraph(
        "When a user prompt involves multiple operational domains (e.g., 'Convert lead to won customer, create an 18% GST invoice, and update warehouse stock'), the <b>AgentHandoffEngine</b> executes structured state transfers. The Sales Agent transitions the CRM lead, hands off client metadata to the Finance Agent for invoice drafting, and triggers the Operations Agent to reserve inventory.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 8: CHAPTER 6 — ACTION GOVERNANCE, RISK CLASSIFICATION & SECURITY SHIELD
    # =========================================================================
    story.append(Paragraph("6. Action Governance, Risk Classification &amp; Security Shield", h1_style))
    story.append(Paragraph(
        "Autonomous AI must never execute consequential enterprise operations without strict oversight. FlowMind AI implements a deterministic <b>Action Governance Gatekeeper</b> backed by Human-in-the-Loop (HITL) Action Cards and an inline Prompt Injection Shield.",
        body_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("6.1. Deterministic Risk Classification Matrix", h2_style))
    risk_data = [
        [Paragraph("Risk Tier", table_header_style), Paragraph("Financial / Operational Threshold", table_header_style), Paragraph("Human Approval Requirement", table_header_style), Paragraph("Permitted Roles &amp; Governance Policy", table_header_style)],
        [Paragraph("<font color='#059669'><b>LOW</b></font>", table_cell_bold), Paragraph("Amount &lt; ₹10,000 / Read-only metrics", table_cell_style), Paragraph("Autonomous Execution (No HITL)", table_cell_style), Paragraph("All authenticated roles (Employee, Manager, Admin).", table_cell_style)],
        [Paragraph("<font color='#D97706'><b>MEDIUM</b></font>", table_cell_bold), Paragraph("₹10,000 &le; Amount &lt; ₹1,00,000 / Standard leaves", table_cell_style), Paragraph("Single Human Approval Required", table_cell_style), Paragraph("Manager or Admin approval via Action Card.", table_cell_style)],
        [Paragraph("<font color='#EA580C'><b>HIGH</b></font>", table_cell_bold), Paragraph("₹1,00,000 &le; Amount &lt; ₹5,00,000 / Staff onboarding", table_cell_style), Paragraph("Dual-Control Confirmation Required", table_cell_style), Paragraph("Department Manager + Finance Officer sign-off.", table_cell_style)],
        [Paragraph("<font color='#DC2626'><b>CRITICAL</b></font>", table_cell_bold), Paragraph("Amount &ge; ₹5,00,000 / Role escalation / Terminations", table_cell_style), Paragraph("Mandatory Executive Admin Approval", table_cell_style), Paragraph("Admin authorization only; strict anti-self-approval enforced.", table_cell_style)]
    ]
    t_risk = Table(risk_data, colWidths=[65, 140, 130, 180])
    t_risk.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_risk)
    story.append(Spacer(1, 5))

    story.append(Paragraph("6.2. Interactive Action Cards &amp; State Simulation", h2_style))
    story.append(Paragraph(
        "When an agent proposes an action requiring approval, an <b>Action Card</b> renders directly in the user's Thought Stream. The card displays a precise operational simulation: parameter breakdowns, policy rationale, and before-and-after operational states (e.g., <i>'Inventory for SKU-001 will decrease from 150 to 130 units'</i>). Users can <b>Approve</b>, <b>Edit Parameters</b>, or <b>Reject</b> with feedback.",
        body_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("6.3. Prompt Injection &amp; Adversarial AI Shield", h2_style))
    story.append(Paragraph(
        "To protect enterprise data, <code>promptInjectionShield.ts</code> inspects all user prompts prior to intent parsing. Regex-based pattern matching detects instruction overrides (<i>'ignore all previous instructions'</i>), secret extraction attempts (<i>'show api keys'</i>), and developer mode jailbreaks. Adversarial inputs are blocked immediately, logged with a security alert, and returned with a localized refusal response.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 9: CHAPTER 7 — NATURAL LANGUAGE DAG WORKFLOW AUTOMATION ENGINE
    # =========================================================================
    story.append(Paragraph("7. Natural Language DAG Workflow Automation Engine", h1_style))
    story.append(Paragraph(
        "The core automation engine of FlowMind AI translates conversational business prompts into formal Directed Acyclic Graphs (DAGs) verified via Kahn's algorithm. Figure 5 diagrams this transformation pipeline.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig5_week4_workflow_pipeline.png")):
        story.append(Image(os.path.join(img_dir, "fig5_week4_workflow_pipeline.png"), width=495, height=210))
        story.append(Paragraph("Figure 5: Natural Language Workflow Compilation, Kahn's Topological Sorting & Execution Pipeline", caption_style))

    story.append(Paragraph("7.1. Mathematical Formulation of Kahn's Topological Sort Algorithm", h2_style))
    story.append(Paragraph(
        "To ensure deterministic execution with zero deadlocks, the <b>DAGValidatorEngine</b> models workflows as directed graphs G = (V, E). Execution ordering is computed via Kahn's algorithm:",
        body_style
    ))
    story.append(Paragraph(
        "<b>Step 1:</b> Compute in-degree deg<sup>&minus;</sup>(v) = |{u &isin; V | (u, v) &isin; E}| for every node v &isin; V.<br/>"
        "<b>Step 2:</b> Initialize a queue Q with all source nodes S = {v &isin; V | deg<sup>&minus;</sup>(v) = 0}. If S = &empty;, a cycle exists.<br/>"
        "<b>Step 3:</b> While Q is not empty, dequeue node u, append u to topological order L, and for each directed edge (u, w) &isin; E, decrement deg<sup>&minus;</sup>(w). If deg<sup>&minus;</sup>(w) becomes 0, enqueue w.<br/>"
        "<b>Step 4:</b> If |L| &ne; |V|, a directed cycle exists. The engine rejects the workflow with error code <code>CYCLE</code>.",
        bullet_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("7.2. Supported Workflow Node DSL Types", h2_style))
    story.append(Paragraph("<b>&bull; TRIGGER Nodes:</b> Manual button triggers, cron schedules ('0 9 * * *'), and inbound REST webhooks.", bullet_style))
    story.append(Paragraph("<b>&bull; ACTION Nodes:</b> Lead enrichment, GST invoice calculation, email dispatch, and stock reservations.", bullet_style))
    story.append(Paragraph("<b>&bull; CONDITION Nodes:</b> Logical branching evaluating runtime variables with mandatory TRUE/FALSE outgoing edges.", bullet_style))
    story.append(Paragraph("<b>&bull; APPROVAL Nodes:</b> Gatekeeper checkpoints that pause workflow execution until authorized sign-off.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 10: CHAPTER 8 — VISUAL WORKFLOW BUILDER & INBOUND WEBHOOK SUBSYSTEM
    # =========================================================================
    story.append(Paragraph("8. Visual Workflow Builder &amp; Inbound Webhook Subsystem", h1_style))
    story.append(Paragraph(
        "In addition to natural language workflow generation, FlowMind AI provides a visual, drag-and-drop workflow canvas at <code>/workflows</code>. Users can interactively inspect node execution paths, configure retry policies, and test webhooks.",
        body_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("8.1. Visual Canvas Architecture &amp; Node Configuration", h2_style))
    story.append(Paragraph(
        "The Visual Workflow Builder renders Directed Acyclic Graphs with animated bezier connector curves, node status indicators (PENDING, RUNNING, SUCCESS, FAILED), and an interactive Node Config Drawer. Users can customize retry limits (1 to 5 attempts), backoff intervals (100ms to 5000ms), and variable bindings (e.g., <code>{{trigger.leadId}}</code>).",
        body_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("8.2. Inbound Webhook Trigger Subsystem", h2_style))
    story.append(Paragraph(
        "External enterprise applications (e.g., Stripe, Shopify, GitHub, Razorpay) can trigger FlowMind workflows programmatically via authenticated webhook endpoints: <code>POST /api/workflows/webhook/[workflowId]</code>. Payloads are validated against expected JSON schemas, injected into the runtime execution context, and queued for topological execution.",
        body_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("8.3. Execution Runner Console &amp; Step-by-Step Live Tracing", h2_style))
    story.append(Paragraph(
        "During workflow execution, the <b>ExecutionRunnerConsole</b> streams real-time node outputs, execution durations (in milliseconds), evaluated conditional branches, and error logs directly to the user interface. Completed runs are persisted in PostgreSQL tables <code>workflow_executions</code> and <code>node_executions</code>.",
        body_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("8.4. Fault Tolerance &amp; Exponential Backoff", h2_style))
    story.append(Paragraph(
        "Transient errors (e.g., network timeouts during third-party API dispatches) are automatically recovered via bounded retry loops. The engine applies exponential backoff with randomized jitter: <i>t<sub>retry</sub> = 2<sup>attempt</sup> &times; 100ms + random(0, 100ms)</i>, preventing thundering herd problems on downstream services.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 11: CHAPTER 9 — ENTERPRISE RELATIONAL DATABASE LAYER (POSTGRESQL 18)
    # =========================================================================
    story.append(Paragraph("9. Enterprise Relational Database Layer (PostgreSQL &amp; Prisma ORM)", h1_style))
    story.append(Paragraph(
        "FlowMind AI features an enterprise-grade PostgreSQL 18 relational database managed through Prisma ORM 5.19.1. Figure 10 diagrams the schema architecture encompassing 29 relational models.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig10_postgresql_database_schema.png")):
        story.append(Image(os.path.join(img_dir, "fig10_postgresql_database_schema.png"), width=495, height=210))
        story.append(Paragraph("Figure 10: Relational Enterprise PostgreSQL Database & Prisma ORM Architecture Diagram (29 Models)", caption_style))

    story.append(Paragraph("9.1. Core Relational Models &amp; Storage Architecture", h2_style))
    db_table = [
        [Paragraph("Functional Area", table_header_style), Paragraph("Prisma Relational Models", table_header_style), Paragraph("Key Schema Attributes &amp; Relationships", table_header_style)],
        [Paragraph("Tenancy &amp; RBAC", table_cell_bold), Paragraph("Organization, User, Permission", table_cell_style), Paragraph("Multi-tenant isolation (organizationId foreign key), salted passwordHash, UserRole enum (ADMIN, MANAGER, EMPLOYEE).", table_cell_style)],
        [Paragraph("Workflow Engine", table_cell_bold), Paragraph("Workflow, WorkflowExecution, NodeExecution", table_cell_style), Paragraph("JSONB DAG nodes/edges storage, Kahn topological execution tracking, durationMs, output payloads, and retry history.", table_cell_style)],
        [Paragraph("AI Swarm &amp; Agents", table_cell_bold), Paragraph("Agent, AgentTask, Conversation, Message", table_cell_style), Paragraph("Agent performance metrics, task duration, multilingual prompts and responses, multi-turn conversation memory.", table_cell_style)],
        [Paragraph("Action Governance", table_cell_bold), Paragraph("ApprovalRequest, AuditLog, Artifact", table_cell_style), Paragraph("Immutable audit trail, dual-control approval requests, generated PDF invoice metadata and export file references.", table_cell_style)],
        [Paragraph("CRM &amp; Sales", table_cell_bold), Paragraph("Lead, Customer, LeadStageHistory", table_cell_style), Paragraph("BANT lead scoring, pipeline stages (NEW to WON), automated stage transition history with actor tracking.", table_cell_style)],
        [Paragraph("HR &amp; Workforce", table_cell_bold), Paragraph("Employee, LeaveRequest, PayrollRecord", table_cell_style), Paragraph("Employee records, leave status tracking, salary protection (masked for Employees), payroll calculations.", table_cell_style)],
        [Paragraph("Finance &amp; Invoicing", table_cell_bold), Paragraph("Invoice, InvoiceItem", table_cell_style), Paragraph("18% GST tax breakdown (subtotal, tax, total), client GSTIN, payment statuses (DRAFT to PAID).", table_cell_style)],
        [Paragraph("Inventory &amp; Support", table_cell_bold), Paragraph("InventoryItem, SupportTicket", table_cell_style), Paragraph("Warehouse stock levels, low-stock reorder thresholds, ticket priority and SLA resolution timestamps.", table_cell_style)],
        [Paragraph("Knowledge &amp; BYOK", table_cell_bold), Paragraph("KnowledgeDocument, DocumentChunk, AiProviderConfig", table_cell_style), Paragraph("Document chunks with 384-dim embeddings; AES-256-GCM encrypted API keys, 12-byte IVs, 16-byte auth tags.", table_cell_style)]
    ]
    t_db = Table(db_table, colWidths=[90, 140, 285])
    t_db.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_db)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 12: CHAPTER 10 — INTEGRATED BUSINESS OPERATIONS SUITE: CRM 360
    # =========================================================================
    story.append(Paragraph("10. Integrated Business Operations Suite: CRM &amp; Customer 360", h1_style))
    story.append(Paragraph(
        "Implemented in Week 5 and reinforced through Weeks 6 &amp; 7, the CRM Module provides complete Customer 360 intelligence, visual pipeline management, and autonomous lead qualification directly connected to the PostgreSQL database.",
        body_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("10.1. Lead Pipeline Stages &amp; Auditable Stage History", h2_style))
    story.append(Paragraph(
        "Leads progress through six formal lifecycle stages: <b>NEW &rarr; CONTACTED &rarr; QUALIFIED &rarr; PROPOSAL &rarr; NEGOTIATION &rarr; WON</b> (or LOST). Every stage change is logged to the <code>lead_stage_history</code> table with the previous stage, new stage, timestamp, and changing actor name, ensuring a complete audit trail.",
        body_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("10.2. BANT Lead Scoring Algorithm", h2_style))
    story.append(Paragraph(
        "Inbound leads are evaluated using the BANT methodology (Budget, Authority, Need, Timeline). The Sales Agent computes a score S &isin; [0, 100]:<br/>"
        "<b>Score Formula:</b> <i>S = 0.35 &times; Budget + 0.25 &times; Authority + 0.25 &times; Need + 0.15 &times; Timeline</i><br/>"
        "Leads with S &ge; 75 are classified as high-value enterprise prospects, automatically assigning a dedicated Account Executive and scheduling a 24-hour follow-up.",
        body_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("10.3. Customer 360 Profiles &amp; Historical Touchpoints", h2_style))
    story.append(Paragraph(
        "When a lead transitions to WON, a corresponding <code>Customer</code> profile is automatically provisioned. The profile aggregates historical invoices, open support tickets, purchased services, and contract renewal dates into a unified view accessible to authorized account managers.",
        body_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("10.4. Real-Time Pipeline Metrics &amp; Aggregations", h2_style))
    story.append(Paragraph(
        "The CRM dashboard displays real-time aggregated metrics: Total Inbound Leads, Active Pipeline Value (in INR), Win Rate Percentage, and Deal Velocity. All figures compute live via <code>businessService.getCrmStats(orgId)</code> with zero hardcoded mock values.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 13: CHAPTER 11 — BUSINESS SUITE: HR, FINANCE, INVENTORY & SUPPORT
    # =========================================================================
    story.append(Paragraph("11. Integrated Business Suite: HR, Finance, Inventory &amp; Support", h1_style))
    story.append(Paragraph(
        "FlowMind AI unifies the remaining operational pillars of the enterprise: Human Resources, Corporate Finance &amp; Invoicing, Warehouse Inventory, and Customer Support.",
        body_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("11.1. HR Module: Workforce Directory &amp; Leave Approvals", h2_style))
    story.append(Paragraph(
        "Manages employee profiles, departments, and designations. Leave requests progress through dual-control approvals. Crucially, the <code>businessService.ts</code> enforces column-level salary masking (salaries masked to 0 for Employees) and programmatic anti-self-approval rejection (managers cannot approve their own leave).",
        body_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("11.2. Finance Module: 18% GST Invoicing &amp; PDF Generation", h2_style))
    story.append(Paragraph(
        "FlowMind AI complies with Indian GST mandates. All software subscriptions and consulting items are taxed at 18% (9% CGST + 9% SGST intra-state, or 18% IGST interstate). Invoices compute subtotal, tax amount, and total with exact integer arithmetic and generate downloadable PDF invoices.",
        body_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("11.3. Inventory Module: Warehouse Stock &amp; Reorder Thresholds", h2_style))
    story.append(Paragraph(
        "Tracks warehouse stock counts, SKU identifiers, unit costs, and minimum threshold levels. When available stock drops below threshold, the Operations Agent automatically flags a stock alert insight and drafts a procurement purchase order.",
        body_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("11.4. Customer Support Module: Ticketing &amp; SLA Tracking", h2_style))
    story.append(Paragraph(
        "Processes inbound service tickets across four priority levels (LOW, MEDIUM, HIGH, URGENT). The Support Agent monitors SLA countdown clocks (2 hours for URGENT, 24 hours for LOW) and automatically escalates at-risk tickets to senior support engineers.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 14: CHAPTER 12 — WEEK 6: AI DATA STUDIO & REAL-TIME ANALYTICS
    # =========================================================================
    story.append(Paragraph("12. Week 6: AI Data Studio &amp; Real-Time Visual Analytics", h1_style))
    story.append(Paragraph(
        "Deployed at <code>/data-studio</code>, the AI Data Studio provides cross-module business intelligence, interactive Recharts graphs, natural-language query analysis, and multi-tenant KPI ribbons.",
        body_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("12.1. Multi-Tenant KPI Ribbon Architecture", h2_style))
    story.append(Paragraph(
        "Computes real-time enterprise performance metrics dynamically queried across PostgreSQL tables: Total Pipeline Revenue, Monthly Recurring Revenue (MRR), Active Headcount, Inventory Valuation, Open Support Tickets, and Workflow Automation Uptime.",
        body_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("12.2. Interactive Multi-Chart Visualizations (Recharts)", h2_style))
    story.append(Paragraph("<b>&bull; Revenue Growth Trend (AreaChart):</b> Historical monthly revenue trajectories with gradient fills and tooltips.", bullet_style))
    story.append(Paragraph("<b>&bull; Departmental Budget Allocation (BarChart):</b> Monthly expenditures across Engineering, Sales, Marketing, and Operations.", bullet_style))
    story.append(Paragraph("<b>&bull; Lead Pipeline Stage Distribution (Pie/DonutChart):</b> Visual proportional breakdown from NEW to CLOSED WON.", bullet_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("12.3. Natural-Language Analytics Assistant", h2_style))
    story.append(Paragraph(
        "Users can ask ad-hoc business questions (e.g., <i>'Show monthly revenue trends'</i> or <i>'Which department has highest payroll?'</i>). The Analytics Assistant decomposes queries, extracts relevant metrics, and renders contextual insights accompanied by one-click CSV/JSON export buttons.",
        body_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("12.4. Saved Views &amp; Filter Persistence", h2_style))
    story.append(Paragraph(
        "Analysts can save customized metric configurations and date ranges directly to the PostgreSQL <code>saved_analytics_views</code> table, enabling rapid access to executive dashboards on subsequent logins.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 15: CHAPTER 13 — WEEK 6: RAG KNOWLEDGE INTELLIGENCE & VECTOR ENGINE
    # =========================================================================
    story.append(Paragraph("13. Week 6: RAG Knowledge Intelligence &amp; Vector Q&amp;A Engine", h1_style))
    story.append(Paragraph(
        "The Retrieval-Augmented Generation (RAG) Knowledge Hub at <code>/knowledge-base</code> allows enterprises to ingest documents and retrieve grounded answers with strict source citations. Figure 11 illustrates the RAG and Data Studio architecture.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig11_rag_and_analytics_architecture.png")):
        story.append(Image(os.path.join(img_dir, "fig11_rag_and_analytics_architecture.png"), width=495, height=210))
        story.append(Paragraph("Figure 11: RAG Knowledge Vector Engine, Dense Embedding Retrieval & Proactive Insights Architecture", caption_style))

    story.append(Paragraph("13.1. Document Ingestion &amp; 384-Dimensional Dense Vector Embeddings", h2_style))
    story.append(Paragraph(
        "Ingests PDF, DOCX, TXT, and Markdown files. Documents are segmented using a sliding window chunker into 200–500 token passages. Each chunk is mapped to a <b>384-dimensional dense semantic vector</b> with unit normalization (||v|| = 1.0) and stored in PostgreSQL <code>document_chunks</code>.",
        body_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("13.2. Hybrid Semantic Retrieval &amp; Hallucination Defense", h2_style))
    story.append(Paragraph(
        "Combines cosine similarity vector retrieval with BM25 keyword overlap scoring: <i>Score = CosineSim(q, d) + min(0.2, KeywordHits / |q| &times; 0.2)</i>. If the top-ranked chunk similarity falls below the <b>0.20 threshold</b>, the engine refuses to speculate, responding: <i>'The indexed knowledge base does not contain sufficient verified policy documentation to answer your inquiry.'</i>",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 16: CHAPTER 14 — KNOWLEDGE-AWARE AGENT MESH & PROACTIVE INSIGHTS
    # =========================================================================
    story.append(Paragraph("14. Knowledge-Aware Agent Mesh &amp; Proactive Business Intelligence", h1_style))
    story.append(Paragraph(
        "Extending RAG beyond static Q&amp;A, Week 6 equipped all 15 agents in the Swarm with autonomous knowledge retrieval and introduced an autonomous Proactive Anomaly Scanner.",
        body_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("14.1. Swarm Knowledge Tool Bridge (`knowledgeTool.ts`)", h2_style))
    story.append(Paragraph(
        "Domain agents dynamically consult company policies during operational execution. For example, before authorizing a 20% sales discount, the Sales Agent queries the Knowledge Hub for the <i>Discounting &amp; Proposal Approval Matrix</i>, discovering that discounts above 10% mandate Finance Agent sign-off.",
        body_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("14.2. Autonomous Proactive Anomaly Scanner (`proactiveInsightsService.ts`)", h2_style))
    story.append(Paragraph(
        "Runs autonomous background scanners evaluating cross-module business data against risk conditions:<br/>"
        "<b>&bull; Stale Deals:</b> CRM proposals untouched for &gt; 14 days.<br/>"
        "<b>&bull; Overdue Invoices:</b> Accounts receivable exceeding ₹50,000 past due date.<br/>"
        "<b>&bull; Low Stock Warnings:</b> Inventory SKUs with stock &le; minimum reorder threshold.<br/>"
        "<b>&bull; SLA Breaches:</b> Support tickets open &gt; 24 hours without resolution.",
        body_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("14.3. Deduplication Hashing &amp; Governed Action Dispatch", h2_style))
    story.append(Paragraph(
        "Every generated insight computes an MD5 deduplication hash (<code>dedupHash = md5(module + insightType + conditionTrigger)</code>) to prevent duplicate alerts. Critical anomalies propose governed actions (e.g., <i>'Dispatch Re-engagement Workflow'</i>) that route through Action Governance for human approval before execution.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 17: CHAPTER 15 — FORMAL SYSTEM MODELING & UML ARCHITECTURAL SPECS
    # =========================================================================
    story.append(Paragraph("15. Formal System Modeling &amp; UML Architectural Specifications", h1_style))
    story.append(Paragraph(
        "To satisfy university capstone engineering criteria, FlowMind AI is formally modeled through UML Use Case, Component, and Sequence diagrams.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig6_uml_use_case.png")):
        story.append(Image(os.path.join(img_dir, "fig6_uml_use_case.png"), width=495, height=210))
        story.append(Paragraph("Figure 6: Formal UML Use Case Diagram across Admin, Manager, and Employee Actors", caption_style))

    story.append(Paragraph("15.1. Actor Role Permissions &amp; Boundary Analysis", h2_style))
    story.append(Paragraph("<b>&bull; Administrator Actor:</b> System configuration, BYOK provider key management, role assignments, critical financial approvals, and global audit inspection.", bullet_style))
    story.append(Paragraph("<b>&bull; Manager Actor:</b> Lead management, team performance monitoring, medium-risk approvals (leaves, discounts &le; 10%), and visual workflow compilation.", bullet_style))
    story.append(Paragraph("<b>&bull; Employee Actor:</b> Conversational AI queries, personal leave applications, support ticket resolution, and read-only operational dashboard views.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 18: CHAPTER 15.2 & 15.3 — UML COMPONENT & SEQUENCE DIAGRAMS
    # =========================================================================
    story.append(Paragraph("15.2. Formal UML Component Diagram", h1_style))

    if os.path.exists(os.path.join(img_dir, "fig7_uml_component.png")):
        story.append(Image(os.path.join(img_dir, "fig7_uml_component.png"), width=495, height=140))
        story.append(Paragraph("Figure 7: UML Component Diagram Illustrating Decoupled Subsystems & REST / ORM Interfaces", caption_style))

    story.append(Paragraph("15.3. UML Sequence Diagram: Request Processing &amp; HITL Approval", h2_style))

    if os.path.exists(os.path.join(img_dir, "fig8_uml_sequence.png")):
        story.append(Image(os.path.join(img_dir, "fig8_uml_sequence.png"), width=495, height=190))
        story.append(Paragraph("Figure 8: UML Sequence Diagram: Indic Processing, Agent Evaluation, HITL Confirmation & DB Audit", caption_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 19: CHAPTER 16 — COMPREHENSIVE API ENDPOINTS SPECIFICATION
    # =========================================================================
    story.append(Paragraph("16. Comprehensive API Endpoints Specification", h1_style))
    story.append(Paragraph(
        "FlowMind AI exposes a secure, RESTful API layer built on Next.js Route Handlers with stateless JWT verification, 3-tier RBAC gating, and JSON payload validation.",
        body_style
    ))
    story.append(Spacer(1, 3))

    api_data = [
        [Paragraph("HTTP Method &amp; Endpoint", table_header_style), Paragraph("Auth &amp; RBAC Scope", table_header_style), Paragraph("Request Payload / Parameters", table_header_style), Paragraph("Response Object &amp; Status Code", table_header_style)],
        [Paragraph("POST /api/auth/login", table_cell_code), Paragraph("Public", table_cell_style), Paragraph("{ email, password }", table_cell_style), Paragraph("{ success, token, user } &bull; 200/401", table_cell_style)],
        [Paragraph("GET /api/auth/me", table_cell_code), Paragraph("Bearer JWT", table_cell_style), Paragraph("Session cookie verification", table_cell_style), Paragraph("{ success, user } &bull; 200/401", table_cell_style)],
        [Paragraph("GET /api/analytics", table_cell_code), Paragraph("Employee/Mgr/Admin", table_cell_style), Paragraph("?department=ALL&amp;period=30d", table_cell_style), Paragraph("{ success, kpiRibbon, charts } &bull; 200", table_cell_style)],
        [Paragraph("POST /api/analytics/query", table_cell_code), Paragraph("Employee/Mgr/Admin", table_cell_style), Paragraph("{ query: 'Show sales trend' }", table_cell_style), Paragraph("{ success, answer, data } &bull; 200", table_cell_style)],
        [Paragraph("GET /api/knowledge", table_cell_code), Paragraph("Employee/Mgr/Admin", table_cell_style), Paragraph("?search=policy&amp;department=Sales", table_cell_style), Paragraph("{ success, documents, count } &bull; 200", table_cell_style)],
        [Paragraph("POST /api/knowledge", table_cell_code), Paragraph("Manager/Admin", table_cell_style), Paragraph("{ title, content, accessScope }", table_cell_style), Paragraph("{ success, document, chunks } &bull; 201", table_cell_style)],
        [Paragraph("POST /api/knowledge/query", table_cell_code), Paragraph("Employee/Mgr/Admin", table_cell_style), Paragraph("{ query: 'What is BANT?' }", table_cell_style), Paragraph("{ success, answer, citations } &bull; 200", table_cell_style)],
        [Paragraph("GET /api/insights", table_cell_code), Paragraph("Manager/Admin", table_cell_style), Paragraph("?module=FINANCE&amp;status=NEW", table_cell_style), Paragraph("{ success, insights, count } &bull; 200", table_cell_style)],
        [Paragraph("POST /api/insights/action", table_cell_code), Paragraph("Manager/Admin", table_cell_style), Paragraph("{ insightId, action: 'TRIGGER' }", table_cell_style), Paragraph("{ success, workflowExecutionId } &bull; 200", table_cell_style)],
        [Paragraph("GET /api/workflows", table_cell_code), Paragraph("Employee/Mgr/Admin", table_cell_style), Paragraph("Query all tenant workflows", table_cell_style), Paragraph("{ success, workflows } &bull; 200", table_cell_style)],
        [Paragraph("POST /api/workflows/webhook/[id]", table_cell_code), Paragraph("API Key / Bearer", table_cell_style), Paragraph("{ event: 'invoice.paid', data }", table_cell_style), Paragraph("{ success, executionId } &bull; 202", table_cell_style)],
        [Paragraph("GET /api/settings/ai-providers", table_cell_code), Paragraph("Admin Only", table_cell_style), Paragraph("Masked provider status", table_cell_style), Paragraph("{ success, configs, isAdmin } &bull; 200", table_cell_style)],
        [Paragraph("POST /api/settings/ai-providers", table_cell_code), Paragraph("Admin Only", table_cell_style), Paragraph("{ provider, apiKey, preferredModel }", table_cell_style), Paragraph("{ success, config (masked) } &bull; 200", table_cell_style)],
        [Paragraph("POST /api/settings/ai-providers/validate", table_cell_code), Paragraph("Admin Only", table_cell_style), Paragraph("{ provider, apiKey }", table_cell_style), Paragraph("{ success, valid, latencyMs } &bull; 200", table_cell_style)],
        [Paragraph("DELETE /api/settings/ai-providers/[provider]", table_cell_code), Paragraph("Admin Only", table_cell_style), Paragraph("Revoke provider credentials", table_cell_style), Paragraph("{ success, deleted: true } &bull; 200", table_cell_style)],
        [Paragraph("GET /api/settings/ai-providers/telemetry", table_cell_code), Paragraph("Admin Only", table_cell_style), Paragraph("Query usage telemetry stats", table_cell_style), Paragraph("{ success, telemetry, allowlists } &bull; 200", table_cell_style)]
    ]
    t_api = Table(api_data, colWidths=[130, 95, 140, 150])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_api)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 20 & 21: CHAPTER 17 — EVIDENCE-BASED PROGRESS MATRIX (WEEKS 1–6)
    # =========================================================================
    story.append(Paragraph("17. Evidence-Based Progress Matrix (Weeks 1 to 6 Complete)", h1_style))
    story.append(Paragraph(
        "Every claim in this report is grounded in verifiable code in the repository. Table 17 documents completed milestones from Weeks 1 through 6.",
        body_style
    ))
    story.append(Spacer(1, 3))

    matrix_p1 = [
        [Paragraph("Development Milestone", table_header_style), Paragraph("Target Functionality", table_header_style), Paragraph("Verifiable Source File &amp; Evidence", table_header_style), Paragraph("Status", table_header_style)],
        [Paragraph("Week 1: Core Foundation", table_cell_bold), Paragraph("Next.js App Router, Three.js 3D canvas, responsive UI theme", table_cell_style), Paragraph("src/app/page.tsx, layout.tsx, Hero3DCanvas.tsx", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 2: Indic Multilingual", table_cell_bold), Paragraph("7 regional Indian languages, script detection, localized UI", table_cell_style), Paragraph("src/lib/i18n/indicEngine.ts, translations.ts", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 3: 15-Agent Swarm", table_cell_bold), Paragraph("Master CEO Orchestrator, inter-agent handoff, task memory", table_cell_style), Paragraph("src/lib/ai/universalAgentRuntime.ts, agentRegistry.ts", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 3: Action Governance", table_cell_bold), Paragraph("4 risk tiers, HITL Action Cards, prompt injection shield", table_cell_style), Paragraph("src/lib/ai/actionGovernance.ts, promptInjectionShield.ts", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 4: NL-to-DAG Engine", table_cell_bold), Paragraph("DAG compilation, Kahn's topological sort, cycle prevention", table_cell_style), Paragraph("src/lib/workflow/workflowPlanner.ts, dagValidator.ts", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 4: Visual DAG Builder", table_cell_bold), Paragraph("Visual DAG canvas, retry logic, inbound webhook execution", table_cell_style), Paragraph("src/app/workflows/page.tsx, /api/workflows/webhook", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 5: PostgreSQL Database", table_cell_bold), Paragraph("PostgreSQL 18, Prisma ORM, 28 relational models, migrations", table_cell_style), Paragraph("prisma/schema.prisma, src/lib/prisma.ts", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 5: CRM Operations", table_cell_bold), Paragraph("BANT lead scoring, pipeline stages, auditable stage history", table_cell_style), Paragraph("src/app/modules/crm/page.tsx, businessService.ts", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 5: HR Suite", table_cell_bold), Paragraph("Employee directory, salary masking, leave anti-self-approval", table_cell_style), Paragraph("src/app/modules/hr/page.tsx, businessService.ts", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 5: Finance &amp; Invoicing", table_cell_bold), Paragraph("18% GST tax computation, invoice PDF drafts, Indian HSN", table_cell_style), Paragraph("src/app/modules/finance/page.tsx, invoiceGenerator.ts", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 5: Inventory &amp; Support", table_cell_bold), Paragraph("Stock levels, reorder alerts, ticket priorities, SLA timers", table_cell_style), Paragraph("src/app/modules/inventory/page.tsx, support/page.tsx", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)]
    ]
    t_m1 = Table(matrix_p1, colWidths=[105, 140, 195, 75])
    t_m1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_m1)
    story.append(PageBreak())

    # Matrix Part 2 (Week 6)
    story.append(Paragraph("17. Evidence-Based Progress Matrix (Week 6 Deliverables)", h1_style))
    matrix_p2 = [
        [Paragraph("Development Milestone", table_header_style), Paragraph("Target Functionality", table_header_style), Paragraph("Verifiable Source File &amp; Evidence", table_header_style), Paragraph("Status", table_header_style)],
        [Paragraph("Week 6: AI Data Studio UI", table_cell_bold), Paragraph("Interactive KPI ribbon, Recharts visualizations, dark glass", table_cell_style), Paragraph("src/app/data-studio/page.tsx, analyticsService.ts", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 6: Real-time Analytics", table_cell_bold), Paragraph("Live PostgreSQL aggregations across CRM, HR, Finance, Inventory", table_cell_style), Paragraph("src/app/api/analytics/route.ts, analyticsService.ts", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 6: NL Analytics Assistant", table_cell_bold), Paragraph("Conversational metric query decomposition, CSV/JSON export", table_cell_style), Paragraph("src/app/api/analytics/query/route.ts", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 6: Dense Vector RAG", table_cell_bold), Paragraph("384-dim dense embeddings, sliding chunker, cosine similarity", table_cell_style), Paragraph("src/lib/services/ragService.ts, /api/knowledge", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 6: RAG UI Console", table_cell_bold), Paragraph("Document upload, access scope gating, grounded search Q&amp;A", table_cell_style), Paragraph("src/app/knowledge-base/page.tsx, ragService.ts", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 6: Hallucination Defense", table_cell_bold), Paragraph("Minimum 0.20 similarity threshold, grounded citations", table_cell_style), Paragraph("src/lib/services/ragService.ts (queryKnowledgeBase)", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 6: Swarm Knowledge Tool", table_cell_bold), Paragraph("Agents retrieve domain knowledge during request execution", table_cell_style), Paragraph("src/lib/ai/knowledgeTool.ts, universalAgentRuntime.ts", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 6: Proactive Scanner", table_cell_bold), Paragraph("Autonomous anomaly detection, stale deals, overdue invoices", table_cell_style), Paragraph("src/lib/services/proactiveInsightsService.ts", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)],
        [Paragraph("Week 6: Governed Action Dispatch", table_cell_bold), Paragraph("Convert proactive insights to governed DAG workflows via HITL", table_cell_style), Paragraph("src/app/api/insights/action/route.ts, approvalService.ts", table_cell_code), Paragraph("<font color='#059669'><b>100% COMPLETE</b></font>", table_cell_style)]
    ]
    t_m2 = Table(matrix_p2, colWidths=[105, 140, 195, 75])
    t_m2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_m2)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 22: CHAPTER 18 — QUALITY ASSURANCE & DEFECT RESOLUTION LOG
    # =========================================================================
    story.append(Paragraph("18. Quality Assurance, Baseline Defect Resolution &amp; Testing Overview", h1_style))
    story.append(Paragraph(
        "Verification was conducted systematically across all milestones. Table 18 documents key architectural defects resolved during development.",
        body_style
    ))
    story.append(Spacer(1, 3))

    defects = [
        ("Stop-Word Semantic Overlap in Vector Embeddings",
         "Initial vector cosine similarity produced an elevated baseline similarity (~0.28) even for out-of-domain queries due to common English stop words ('the', 'is', 'for', 'on') hashing to overlapping dimensions.",
         "Integrated a comprehensive pre-filter (STOP_WORDS set) in generateSemanticEmbedding and searchChunks to strip high-frequency non-semantic tokens, dropping out-of-domain similarity to near zero and preserving robust hallucination refusal."),

        ("Dynamic Server Usage on API Cookie Routes",
         "Next.js build optimization initially threw a dynamic-server-error warning on /api/analytics, /api/knowledge, and /api/insights because request cookies were accessed during static pre-rendering.",
         "Added explicit Next.js route segment configuration export const dynamic = 'force-dynamic' at the top of each API handler, declaring them as server-rendered dynamic endpoints."),

        ("Prisma Connection Noise During Offline Development",
         "When PostgreSQL was intentionally stopped during offline testing, Prisma generated noisy console stack traces during user authentication lookups.",
         "Silenced raw Prisma logging in prisma.ts (log: []) and implemented silent catch handlers falling back cleanly to in-memory session stores, guaranteeing 100% offline uptime."),

        ("Self-Approval Flaw in Leave Management",
         "Managers could theoretically approve their own leave applications in HR, violating dual-control compliance.",
         "Added strict programmatic validation in businessService.ts rejecting leave approvals where req.employeeId === approver.id with a 403 Forbidden response."),

        ("Next.js Build Bailout on Suspense Pages",
         "useSearchParams() on authentication reset pages triggered client-side rendering bailout during static page generation in next build.",
         "Wrapped the form inside a React Suspense boundary with a loading fallback component.")
    ]
    for title, problem, solution in defects:
        story.append(Paragraph(f"<b>&bull; {title}:</b> {problem} <i>Resolution:</i> {solution}", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 23: CHAPTER 19 — WEEK 7: PRODUCTION SECURITY & BYOK ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("19. Week 7: Production Security Hardening &amp; Cryptographic BYOK Architecture", h1_style))
    story.append(Paragraph(
        "Executed during the November 1–7, 2026 sprint, Week 7 established enterprise-grade <b>Bring Your Own Key (BYOK)</b> capabilities for dynamic Google Gemini and OpenAI model routing, secured via <b>AES-256-GCM envelope encryption</b>. Figure 12 illustrates the cryptographic architecture.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig12_byok_encryption_architecture.png")):
        story.append(Image(os.path.join(img_dir, "fig12_byok_encryption_architecture.png"), width=495, height=210))
        story.append(Paragraph("Figure 12: Week 7 BYOK AES-256-GCM Envelope Encryption, Secret Storage & Routing Pipeline", caption_style))

    story.append(Paragraph("19.1. Mathematical Formulation of AES-256-GCM Envelope Encryption", h2_style))
    story.append(Paragraph(
        "FlowMind AI protects tenant API credentials at rest using Galois/Counter Mode (GCM), providing authenticated encryption with associated data (AEAD):<br/>"
        "<b>Encryption Function:</b> (C, T) = AES-256-GCM-Enc(K<sub>master</sub>, N<sub>96</sub>, P)<br/>"
        "&bull; <b>P:</b> Plaintext API key supplied by tenant administrator.<br/>"
        "&bull; <b>K<sub>master</sub>:</b> 256-bit encryption master key derived from <code>ENCRYPTION_MASTER_KEY</code> (via SHA-256).<br/>"
        "&bull; <b>N<sub>96</sub>:</b> Cryptographically secure, unique 12-byte (96-bit) initialization vector: <i>N<sub>96</sub> &larr; CSPRNG(12 bytes)</i>.<br/>"
        "&bull; <b>C:</b> Hex-encoded ciphertext stored in PostgreSQL.<br/>"
        "&bull; <b>T:</b> 16-byte (128-bit) authentication tag verifying ciphertext authenticity.<br/>"
        "<b>Decryption &amp; Integrity Verification:</b> P = AES-256-GCM-Dec(K<sub>master</sub>, N<sub>96</sub>, C, T). If any bit in C or T is altered, GCM verification fails and aborts decryption.",
        body_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("19.2. PostgreSQL Schema Extension (`ai_provider_configs`)", h2_style))
    story.append(Paragraph(
        "Persisted via Prisma ORM model <code>AiProviderConfig</code> with compound unique constraint <code>[organizationId, provider]</code>. Stored fields: <code>id</code>, <code>organizationId</code>, <code>provider</code> (GEMINI/OPENAI), <code>encryptedApiKey</code>, <code>iv</code>, <code>authTag</code>, <code>keyVersion</code>, <code>preferredModel</code>, <code>status</code> (ACTIVE/DISABLED/ERROR), and <code>lastValidatedAt</code>. Zero raw credentials touch disk.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 24: CHAPTER 20 — WEEK 7: UNIFIED AI ABSTRACTION & DYNAMIC ROUTING
    # =========================================================================
    story.append(Paragraph("20. Week 7: Unified AI Provider Abstraction &amp; Dynamic Routing Engine", h1_style))
    story.append(Paragraph(
        "To prevent vendor lock-in and enable seamless dynamic routing, FlowMind AI introduces a centralized AI abstraction layer in <code>src/lib/ai/aiProviderService.ts</code>.",
        body_style
    ))
    story.append(Spacer(1, 3))

    story.append(Paragraph("20.1. Server-Controlled Model Allowlists", h2_style))
    byok_models = [
        [Paragraph("Provider", table_header_style), Paragraph("Default Model", table_header_style), Paragraph("Allowed Models (Allowlist)", table_header_style), Paragraph("Use Case &amp; Performance Profile", table_header_style)],
        [Paragraph("Google Gemini", table_cell_bold), Paragraph("gemini-1.5-flash", table_cell_code), Paragraph("gemini-1.5-flash, gemini-1.5-pro, gemini-1.0-pro", table_cell_style), Paragraph("Ultra-low latency, large context window (1M tokens), multimodal enterprise reasoning.", table_cell_style)],
        [Paragraph("OpenAI", table_cell_bold), Paragraph("gpt-4o-mini", table_cell_code), Paragraph("gpt-4o-mini, gpt-4o, gpt-4-turbo, gpt-3.5-turbo", table_cell_style), Paragraph("High throughput, cost-efficient operational tool calls, flagship omni reasoning.", table_cell_style)]
    ]
    t_byok_m = Table(byok_models, colWidths=[85, 95, 175, 160])
    t_byok_m.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_byok_m)
    story.append(Spacer(1, 4))

    story.append(Paragraph("20.2. Request Governance &amp; Deterministic Fallback Guardrails", h2_style))
    story.append(Paragraph("<b>&bull; 15-Second Bounded Timeout:</b> Invocations utilize AbortController to guarantee external API hangs do not block server execution loops.", bullet_style))
    story.append(Paragraph("<b>&bull; Jittered Exponential Backoff:</b> Up to 2 automatic retries on transient network errors with randomized backoff: <i>t = 2<sup>attempt</sup> &times; 100ms + random(0, 100ms)</i>.", bullet_style))
    story.append(Paragraph("<b>&bull; Deterministic Engine Fallback:</b> If no BYOK key is configured, or if provider endpoints suffer total outage, the system falls back seamlessly to deterministic rules engines (Agent Swarm, Kahn DAG Planner, Knowledge Vector Search) with 0% downtime.", bullet_style))
    story.append(Paragraph("<b>&bull; Telemetry Without Secret Exposure:</b> In-memory telemetry tracks request counts, success rates, and average latency without logging sensitive prompts or keys.", bullet_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("20.3. Cross-Layer Swarm &amp; RAG Integration", h2_style))
    story.append(Paragraph(
        "The abstraction is wired directly into the 15-Agent Swarm (<code>universalAgentRuntime.ts</code>), the Natural Language DAG Workflow Planner (<code>workflowPlanner.ts</code>), and the RAG Knowledge Hub (<code>ragService.ts</code>) to synthesize grounded answers with citations while preserving Action Governance HITL checkpoints.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 25: CHAPTER 21 — WEEK 7: JEST E2E TEST SUITE & WEB HARDENING
    # =========================================================================
    story.append(Paragraph("21. Week 7: End-to-End Jest Integration Test Suite &amp; Security Verification", h1_style))
    story.append(Paragraph(
        "Week 7 introduced comprehensive test automation using Jest 29 and ts-jest. All 33 tests across 5 test suites pass with a 100% success rate in 0.72s. Figure 13 diagrams the test architecture and security matrix.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig13_jest_testing_and_security_matrix.png")):
        story.append(Image(os.path.join(img_dir, "fig13_jest_testing_and_security_matrix.png"), width=495, height=210))
        story.append(Paragraph("Figure 13: End-to-End Jest Testing Matrix (33/33 Tests Passing) & Production Security Headers", caption_style))

    story.append(Paragraph("21.1. Automated Jest Test Suite Execution Results", h2_style))
    jest_results = [
        [Paragraph("Test Suite File", table_header_style), Paragraph("Category", table_header_style), Paragraph("Tests", table_header_style), Paragraph("Observed Assertions &amp; Behavioral Verification", table_header_style), Paragraph("Status", table_header_style)],
        [Paragraph("tests/unit/encryption.test.ts", table_cell_code), Paragraph("Unit &bull; Crypto", table_cell_style), Paragraph("7/7", table_cell_bold), Paragraph("AES-256-GCM encrypt/decrypt, 96-bit unique IVs, ciphertext tampering failure, authTag tampering failure, key masking, secret scrubbing.", table_cell_style), Paragraph("<font color='#059669'><b>PASS (100%)</b></font>", table_cell_style)],
        [Paragraph("tests/integration/byokConfig.test.ts", table_cell_code), Paragraph("Integration &bull; BYOK", table_cell_style), Paragraph("6/6", table_cell_bold), Paragraph("Admin key storage, masked keySuffix retrieval, Employee blocked (403 ACCESS_DENIED), zero ciphertext leakage, Admin revocation, Employee delete blocked.", table_cell_style), Paragraph("<font color='#059669'><b>PASS (100%)</b></font>", table_cell_style)],
        [Paragraph("tests/integration/aiProviderRouting.test.ts", table_cell_code), Paragraph("Integration &bull; AI", table_cell_style), Paragraph("4/4", table_cell_bold), Paragraph("Deterministic fallback when keys unconfigured, Gemini model allowlist validation, OpenAI allowlist validation, privacy-preserving telemetry tracking.", table_cell_style), Paragraph("<font color='#059669'><b>PASS (100%)</b></font>", table_cell_style)],
        [Paragraph("tests/integration/rbacSecurity.test.ts", table_cell_code), Paragraph("Integration &bull; RBAC", table_cell_style), Paragraph("9/9", table_cell_bold), Paragraph("Column-level salary masking (Employee gets 0, Admin/Mgr gets actual), anti-self-approval rule, approver authority checks, permission matrix.", table_cell_style), Paragraph("<font color='#059669'><b>PASS (100%)</b></font>", table_cell_style)],
        [Paragraph("tests/e2e/businessWorkflows.test.ts", table_cell_code), Paragraph("E2E &bull; Workflows", table_cell_style), Paragraph("7/7", table_cell_bold), Paragraph("CRM lead creation &amp; stage history, Finance 18% GST calculation (subtotal, tax, total), Kahn DAG cycle detection (CYCLE), prompt injection blocking.", table_cell_style), Paragraph("<font color='#059669'><b>PASS (100%)</b></font>", table_cell_style)]
    ]
    t_jest = Table(jest_results, colWidths=[120, 75, 40, 215, 65])
    t_jest.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_jest)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 26: CHAPTER 21.2 & 21.3 — WEB SECURITY HARDENING & SAST AUDIT
    # =========================================================================
    story.append(Paragraph("21.2. Production HTTP Security Headers (`next.config.mjs`)", h1_style))
    story.append(Paragraph(
        "FlowMind AI enforces strict production headers on all inbound and outbound HTTP requests to eliminate XSS, clickjacking, and MIME-sniffing vulnerabilities:",
        body_style
    ))
    story.append(Spacer(1, 3))

    sec_headers = [
        [Paragraph("Security Header Name", table_header_style), Paragraph("Configured Production Value", table_header_style), Paragraph("Security Defense Mechanism", table_header_style)],
        [Paragraph("Content-Security-Policy", table_cell_code), Paragraph("default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com; frame-ancestors 'none'", table_cell_style), Paragraph("Prevents cross-site scripting (XSS), restricts resource loading origins, and whitelists authorized AI providers.", table_cell_style)],
        [Paragraph("Strict-Transport-Security", table_cell_code), Paragraph("max-age=63072000; includeSubDomains; preload", table_cell_style), Paragraph("Enforces HTTPS communication for 2 years, mitigating SSL-stripping and man-in-the-middle attacks.", table_cell_style)],
        [Paragraph("X-Frame-Options", table_cell_code), Paragraph("DENY", table_cell_style), Paragraph("Disables iframe embedding across external origins, eliminating clickjacking attack vectors.", table_cell_style)],
        [Paragraph("X-Content-Type-Options", table_cell_code), Paragraph("nosniff", table_cell_style), Paragraph("Prevents web browsers from MIME-sniffing responses away from the declared Content-Type.", table_cell_style)],
        [Paragraph("Referrer-Policy", table_cell_code), Paragraph("strict-origin-when-cross-origin", table_cell_style), Paragraph("Protects user privacy by stripping sensitive URL path parameters on cross-origin requests.", table_cell_style)],
        [Paragraph("Permissions-Policy", table_cell_code), Paragraph("camera=(), microphone=(self), geolocation=()", table_cell_style), Paragraph("Restricts hardware sensor access; restricts microphone exclusively to localized Voice Assistant.", table_cell_style)]
    ]
    t_sec_h = Table(sec_headers, colWidths=[120, 205, 190])
    t_sec_h.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_sec_h)
    story.append(Spacer(1, 4))

    story.append(Paragraph("21.3. Static Application Security Testing (SAST) &amp; Secret Scanning", h2_style))
    story.append(Paragraph(
        "<b>&bull; Dependency Vulnerability Remediation:</b> Ran <code>npm audit fix</code>, resolving high-severity advisory in <code>source-map-js</code>. Applied compensating controls (strict CSP and image optimization whitelists) for framework dependencies.",
        bullet_style
    ))
    story.append(Paragraph(
        "<b>&bull; Secret Pattern Scan:</b> Executed regex scans across all source files for pattern signatures (<code>sk-[a-zA-Z0-9]{20,}</code>, <code>AIza[a-zA-Z0-9]{20,}</code>). Zero production secrets exist in the repository; local credentials are sequestered in <code>.env</code> and excluded via <code>.gitignore</code>.",
        bullet_style
    ))
    story.append(Paragraph(
        "<b>&bull; Production Build Verification:</b> <code>next build</code> compiled all 31 routes and API endpoints cleanly with zero prerendering bailouts.",
        bullet_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 27 & 28: CHAPTER 22 — COMPLETE EVIDENCE MATRIX (WEEKS 1 TO 7)
    # =========================================================================
    story.append(Paragraph("22. Complete Evidence-Based Progress Matrix (Weeks 1 to 7 Complete)", h1_style))
    story.append(Paragraph(
        "Table 22 provides an exhaustive, evidence-backed breakdown of all capabilities completed from Week 1 through Week 7 across the repository.",
        body_style
    ))
    story.append(Spacer(1, 3))

    matrix_full = [
        [Paragraph("Development Sprint", table_header_style), Paragraph("Delivered Capability &amp; Architectural Focus", table_header_style), Paragraph("Verifiable Source File Path &amp; Implementation Artifact", table_header_style), Paragraph("Status", table_header_style)],
        [Paragraph("Week 1: Core Foundation", table_cell_bold), Paragraph("Next.js 14 App Router, Three.js 3D canvas, responsive UI theme", table_cell_style), Paragraph("src/app/page.tsx, layout.tsx, Hero3DCanvas.tsx", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 2: Indic Multilingual", table_cell_bold), Paragraph("7 regional Indian languages, script detection, localized UI", table_cell_style), Paragraph("src/lib/i18n/indicEngine.ts, translations.ts", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 3: 15-Agent Swarm", table_cell_bold), Paragraph("Master CEO Orchestrator, inter-agent handoff, task memory", table_cell_style), Paragraph("src/lib/ai/universalAgentRuntime.ts, agentRegistry.ts", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 3: Action Governance", table_cell_bold), Paragraph("4 risk tiers, HITL Action Cards, prompt injection shield", table_cell_style), Paragraph("src/lib/ai/actionGovernance.ts, promptInjectionShield.ts", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 4: NL-to-DAG Engine", table_cell_bold), Paragraph("DAG compilation, Kahn's topological sort, cycle prevention", table_cell_style), Paragraph("src/lib/workflow/workflowPlanner.ts, dagValidator.ts", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 4: Visual DAG Builder", table_cell_bold), Paragraph("Visual DAG canvas, retry logic, inbound webhook execution", table_cell_style), Paragraph("src/app/workflows/page.tsx, /api/workflows/webhook", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 5: PostgreSQL Database", table_cell_bold), Paragraph("PostgreSQL 18, Prisma ORM, 28 relational models, migrations", table_cell_style), Paragraph("prisma/schema.prisma, src/lib/prisma.ts", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 5: CRM Operations", table_cell_bold), Paragraph("BANT lead scoring, pipeline stages, auditable stage history", table_cell_style), Paragraph("src/app/modules/crm/page.tsx, businessService.ts", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 5: HR Suite", table_cell_bold), Paragraph("Employee directory, salary masking, leave anti-self-approval", table_cell_style), Paragraph("src/app/modules/hr/page.tsx, businessService.ts", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 5: Finance &amp; Invoicing", table_cell_bold), Paragraph("18% GST tax computation, invoice PDF drafts, Indian HSN", table_cell_style), Paragraph("src/app/modules/finance/page.tsx, invoiceGenerator.ts", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 5: Inventory &amp; Support", table_cell_bold), Paragraph("Stock levels, reorder alerts, ticket priorities, SLA timers", table_cell_style), Paragraph("src/app/modules/inventory/page.tsx, support/page.tsx", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)]
    ]
    t_mfull = Table(matrix_full, colWidths=[105, 140, 195, 75])
    t_mfull.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_mfull)
    story.append(PageBreak())

    # Matrix Part 2 (Weeks 6 & 7)
    story.append(Paragraph("22. Complete Evidence-Based Progress Matrix (Weeks 6 &amp; 7 Deliverables)", h1_style))
    matrix_w67 = [
        [Paragraph("Development Sprint", table_header_style), Paragraph("Delivered Capability &amp; Architectural Focus", table_header_style), Paragraph("Verifiable Source File Path &amp; Implementation Artifact", table_header_style), Paragraph("Status", table_header_style)],
        [Paragraph("Week 6: AI Data Studio", table_cell_bold), Paragraph("Interactive KPI ribbon, Recharts visualizations, dark glass", table_cell_style), Paragraph("src/app/data-studio/page.tsx, analyticsService.ts", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 6: Dense Vector RAG", table_cell_bold), Paragraph("384-dim dense embeddings, sliding chunker, cosine similarity", table_cell_style), Paragraph("src/lib/services/ragService.ts, /api/knowledge", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 6: Hallucination Defense", table_cell_bold), Paragraph("Minimum 0.20 similarity threshold, grounded citations", table_cell_style), Paragraph("src/lib/services/ragService.ts (queryKnowledgeBase)", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 6: Swarm Knowledge Tool", table_cell_bold), Paragraph("Agents retrieve domain knowledge during request execution", table_cell_style), Paragraph("src/lib/ai/knowledgeTool.ts, universalAgentRuntime.ts", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 6: Proactive Scanner", table_cell_bold), Paragraph("Autonomous anomaly detection, stale deals, overdue invoices", table_cell_style), Paragraph("src/lib/services/proactiveInsightsService.ts", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 7: Cryptographic BYOK", table_cell_bold), Paragraph("AES-256-GCM envelope encryption, 96-bit unique nonces, auth tags", table_cell_style), Paragraph("src/lib/security/encryptionService.ts, aiProviderConfigService.ts", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 7: BYOK Settings UI", table_cell_bold), Paragraph("Admin console, live connection probes, masked keys, revocation", table_cell_style), Paragraph("src/app/settings/ai-providers/page.tsx, /api/settings", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 7: AI Provider Abstraction", table_cell_bold), Paragraph("Dynamic routing, model allowlists, 15s timeout, backoff retry", table_cell_style), Paragraph("src/lib/ai/aiProviderService.ts, PROVIDER_ALLOWLISTS", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 7: Jest E2E Test Suite", table_cell_bold), Paragraph("33 tests across 5 suites (100% pass rate in 0.72s)", table_cell_style), Paragraph("tests/unit/, tests/integration/, tests/e2e/, jest.config.js", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 7: Web App Hardening", table_cell_bold), Paragraph("Strict CSP, HSTS max-age=63072000, X-Frame-Options: DENY", table_cell_style), Paragraph("next.config.mjs, .env.example, SAST audit", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)],
        [Paragraph("Week 7: PostgreSQL 29 Models", table_cell_bold), Paragraph("Added ai_provider_configs model, synced via prisma db push", table_cell_style), Paragraph("prisma/schema.prisma (ai_provider_configs)", table_cell_code), Paragraph("<font color='#059669'><b>VERIFIED</b></font>", table_cell_style)]
    ]
    t_mw67 = Table(matrix_w67, colWidths=[105, 140, 195, 75])
    t_mw67.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_mw67)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 29: CHAPTER 23 — FINAL WEEK 8 ROADMAP & ACADEMIC CONCLUSION
    # =========================================================================
    story.append(Paragraph("23. Final Roadmap (Week 8) &amp; Academic Conclusion", h1_style))
    story.append(Paragraph(
        "With Weeks 1 through 7 completely implemented and verified, FlowMind AI enters its final deployment phase ahead of university capstone defense. Figure 9 illustrates the final development trajectory.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig9_eight_week_roadmap.png")):
        story.append(Image(os.path.join(img_dir, "fig9_eight_week_roadmap.png"), width=495, height=130))
        story.append(Paragraph("Figure 9: Eight-Week Development Trajectory (Weeks 1–7 Completed, Week 8 Planned)", caption_style))

    story.append(Paragraph("23.1. Prioritized Implementation Plan for Week 8", h2_style))
    story.append(Paragraph("<b>&bull; Multi-Stage Docker Containerization (Nov 8–10, 2026):</b> Author multi-stage <code>Dockerfile</code> and <code>docker-compose.yml</code> bundling Next.js, Node.js runtime, PostgreSQL 18, and Prisma engine into a production-optimized container image.", bullet_style))
    story.append(Paragraph("<b>&bull; GitHub Actions CI/CD Pipeline (Nov 11–12, 2026):</b> Automate test runs (Jest), type checking (<code>tsc --noEmit</code>), security scanning, and container registry publishing on git push.", bullet_style))
    story.append(Paragraph("<b>&bull; Cloud Deployment &amp; Final Viva Defense (Nov 13–15, 2026):</b> Deploy containerized platform to cloud hosting (AWS EC2 / Vercel Enterprise), perform final live demonstration, and complete university capstone viva presentation.", bullet_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("23.2. Academic Conclusion", h2_style))
    story.append(Paragraph(
        "As of Week 7, FlowMind AI has achieved its core research and engineering vision: building a production-grade, <b>Multilingual Autonomous AI Business Operating System</b>. By unifying an enterprise operational suite (CRM, HR, Finance, Inventory, Support) with real-time analytics in the AI Data Studio, dense semantic vector RAG intelligence, a 15-Agent Swarm, AES-256-GCM envelope-encrypted BYOK credentials, and an automated 33-test Jest integration suite, the platform conclusively demonstrates that non-technical enterprise operators can safely automate mission-critical business procedures through governed, transparent AI. The codebase is verified, stable, type-safe (0 errors), and fully prepared for final capstone viva defense.",
        body_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("23.3. Internal Project Documentation References", h2_style))
    story.append(Paragraph("1. FlowMind AI Developer Architecture &amp; SDLC Specification (Internal Documentation, 2026).", bullet_style))
    story.append(Paragraph("2. FlowMind AI PostgreSQL Backend &amp; Prisma ORM Implementation Specification (2026).", bullet_style))
    story.append(Paragraph("3. FlowMind AI Week 5 Business Operations Technical Progress Report (2026).", bullet_style))
    story.append(Paragraph("4. FlowMind AI Week 6 Data Studio, RAG Knowledge Base &amp; Proactive Insights Report (2026).", bullet_style))
    story.append(Paragraph("5. FlowMind AI Week 7 Security Hardening, BYOK &amp; Jest E2E Testing Report (2026).", bullet_style))
    story.append(Paragraph("6. Official Project Repository: https://github.com/Furkhan-5/FlowMind-AI (Branch: main, Commit: 2cbd5ce).", bullet_style))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated 28-30 page PDF report at: {output_pdf_path}")
    return output_pdf_path

if __name__ == '__main__':
    target_path = r"c:\Capstone\FlowMind_AI_Implementation_Progress_Report.pdf"
    create_pdf_report(target_path)
    
    # Also sync to the brain artifact directory
    artifact_path = r"C:\Users\furkh\.gemini\antigravity\brain\c7490880-ff79-4a0d-8d40-b570a9b30c72\FlowMind_AI_Implementation_Progress_Report.pdf"
    try:
        shutil.copyfile(target_path, artifact_path)
        print(f"Successfully synced PDF to artifact directory: {artifact_path}")
    except Exception as e:
        print(f"Warning: could not copy to artifact directory: {e}")
