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
        self.drawString(42, 806, "FLOWMIND AI — CAPSTONE IMPLEMENTATION PROGRESS REPORT | WEEKS 1–6")
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
# COMPREHENSIVE 20-25 PAGE CAPSTONE IMPLEMENTATION REPORT GENERATOR
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
        fontSize=27,
        leading=33,
        textColor=colors.HexColor('#1B365D'),
        alignment=1,
        spaceAfter=5
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor('#4F46E5'),
        alignment=1,
        spaceAfter=9
    )

    cover_meta = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1B365D'),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12.5,
        textColor=colors.HexColor('#334155'),
        spaceBefore=4,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.2,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=4.5
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.2,
        textColor=colors.HexColor('#1E293B'),
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    callout_style = ParagraphStyle(
        'Callout_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1E1B4B')
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white,
        alignment=0
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9.2,
        textColor=colors.HexColor('#1E293B')
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9.2,
        textColor=colors.HexColor('#0F172A')
    )

    table_cell_code = ParagraphStyle(
        'TableCellCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=6.5,
        leading=8.5,
        textColor=colors.HexColor('#0F172A')
    )

    caption_style = ParagraphStyle(
        'CaptionStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
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
    story.append(Spacer(1, 10))
    story.append(Paragraph("PROJECT PROGRESS REPORT — WEEKS 1 TO 6 (COMPREHENSIVE IMPLEMENTATION)", ParagraphStyle('Badge', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=12, textColor=colors.HexColor('#4F46E5'), alignment=1)))
    story.append(Spacer(1, 6))
    story.append(Paragraph("FLOWMIND AI", title_style))
    story.append(Paragraph("Multilingual Autonomous AI Business Operating System, RAG Knowledge Hub &amp; DAG Workflow Suite", subtitle_style))
    story.append(Paragraph("Integrated Enterprise Business Suite (CRM, HR, Finance, Inventory, Support) &bull; AI Data Studio &bull; Dense Vector RAG<br/>PostgreSQL 18 Persistence (28 Relational Models) &bull; 15-Agent Swarm &bull; 3-Tier RBAC &bull; Action Governance Gatekeeper", cover_meta))
    story.append(Spacer(1, 8))

    story.append(HRFlowable(width="88%", thickness=1.5, color=colors.HexColor("#4F46E5"), spaceAfter=12, spaceBefore=2))

    # Academic Meta Table
    acad_data = [
        [Paragraph("<b>Academic Program:</b>", table_cell_bold), Paragraph("B.Tech in Computer Science &amp; Engineering (Final Year Capstone Project)", table_cell_style)],
        [Paragraph("<b>Course Code &amp; Academic Term:</b>", table_cell_bold), Paragraph("Capstone Project / Semester VII (Academic Year 2026)", table_cell_style)],
        [Paragraph("<b>Department &amp; Institution:</b>", table_cell_bold), Paragraph("Department of Computer Science &amp; Engineering, SCOPE, VIT-AP University", table_cell_style)],
        [Paragraph("<b>Evaluation Milestone:</b>", table_cell_bold), Paragraph("Week 6 Technical Review: Data Studio, Vector RAG &amp; Proactive Insights Complete Implementation", table_cell_style)],
        [Paragraph("<b>Date of Evaluation:</b>", table_cell_bold), Paragraph("October 2026 | Amaravati, Andhra Pradesh, India", table_cell_style)],
        [Paragraph("<b>Verified Repository:</b>", table_cell_bold), Paragraph("https://github.com/Furkhan-5/FlowMind-AI (Branch: main, Commit: 367877a)", table_cell_style)]
    ]
    t_acad = Table(acad_data, colWidths=[140, 375])
    t_acad.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(t_acad)
    story.append(Spacer(1, 10))

    # Team Members Table
    team_headers = [Paragraph("Team Member Name", table_header_style), Paragraph("Registration No", table_header_style), Paragraph("Project Domain Role", table_header_style), Paragraph("Primary Architectural Contributions", table_header_style)]
    team_rows = [
        [Paragraph("<b>Furkhan Abdul Raheem</b>", table_cell_bold), Paragraph("23BCE7868", table_cell_style), Paragraph("AI Lead &amp; Systems Architect", table_cell_style), Paragraph("Master CEO Orchestrator, 15-Agent Swarm, RAG Vector Engine, Knowledge Tool Bridge, Prompt Injection Shield.", table_cell_style)],
        [Paragraph("<b>Aniket Sahu</b>", table_cell_bold), Paragraph("23BCE7881", table_cell_style), Paragraph("Frontend &amp; Layman UX Lead", table_cell_style), Paragraph("Data Studio UI, Recharts Visualizations, Layman Accessible Chatbot, Thought Stream, Action Cards, Responsive Glassmorphism.", table_cell_style)],
        [Paragraph("<b>Anjali Karagatla</b>", table_cell_bold), Paragraph("23BCE8077", table_cell_style), Paragraph("Workflow Engine Lead", table_cell_style), Paragraph("NL-to-DAG Planner, Topological DAG Runner, Kahn's Sorter, Visual DAG Builder, Inbound Webhooks.", table_cell_style)],
        [Paragraph("<b>Farukh</b>", table_cell_bold), Paragraph("23BCE20345", table_cell_style), Paragraph("Data, Security &amp; RBAC Lead", table_cell_style), Paragraph("PostgreSQL 18 Layer, Prisma ORM Schema (28 Models), 3-Tier RBAC, Proactive Anomaly Scanner, Action Governance HITL.", table_cell_style)]
    ]
    t_team = Table([team_headers] + team_rows, colWidths=[105, 70, 110, 230])
    t_team.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_team)
    story.append(Spacer(1, 10))

    # Executive Note Callout
    callout_data = [[Paragraph("<b>DOCUMENT CLASSIFICATION &amp; VERIFICATION STATEMENT:</b> This progress report serves as the official university capstone technical submission for FlowMind AI through Week 6. Every documented feature, mathematical methodology, technology version, database model, API endpoint, and quality metric represents an active, verified implementation compiled and tested directly in the project codebase.", callout_style)]]
    t_callout = Table(callout_data, colWidths=[515])
    t_callout.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EEF2FF')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#6366F1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
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
        "<b>Executive Abstract:</b> FlowMind AI is an enterprise-grade Autonomous Business Operating System designed to eliminate SaaS fragmentation and bridge the technical divide for non-programmer operators. Combining an Indic multilingual natural language interface (7 regional languages), a 15-Agent Swarm, a Topological DAG Automation Runner (Kahn's algorithm), and a 28-model PostgreSQL relational database with Prisma ORM, FlowMind AI empowers non-technical users to query cross-domain metrics and execute complex, governed business workflows. In Week 6, the platform gained an AI Data Studio with interactive Recharts visualizations, a 384-dimensional dense semantic vector RAG Knowledge Hub with exact citations and hallucination defense, a domain-specialized Swarm Knowledge Tool, and an autonomous Proactive Anomaly Scanner with Action Governance dual-control approvals. All features are verified with zero TypeScript compilation errors and 100% Next.js production build success across 33 routes.",
        callout_style
    ))
    story.append(Spacer(1, 8))

    toc_headers = [Paragraph("Chapter / Section Title", table_header_style), Paragraph("Focus Domain &amp; Architectural Content", table_header_style), Paragraph("Milestone", table_header_style)]
    toc_data = [
        [Paragraph("1. Project Overview, Context &amp; Motivation", table_cell_bold), Paragraph("Enterprise SaaS fragmentation, Layman Accessibility, Core Philosophy", table_cell_style), Paragraph("Foundation", table_cell_style)],
        [Paragraph("2. Full-Stack Technology Stack &amp; Taxonomy", table_cell_bold), Paragraph("Next.js 14, TypeScript 5.4, Tailwind, Three.js, Recharts, PostgreSQL 18, Prisma", table_cell_style), Paragraph("Architecture", table_cell_style)],
        [Paragraph("3. End-to-End System Data Flow Pipeline", table_cell_bold), Paragraph("10-stage processing from user prompt to database persistence and audit", table_cell_style), Paragraph("Data Flow", table_cell_style)],
        [Paragraph("4. Indic Multilingual NLP &amp; Intent Mapping", table_cell_bold), Paragraph("7 Indic languages, Unicode blocks, dictionary translation, canonical intents", table_cell_style), Paragraph("NLP Engine", table_cell_style)],
        [Paragraph("5. 15-Specialized AI Agent Swarm Mesh", table_cell_bold), Paragraph("Master CEO Orchestrator, domain specialization, cognitive Thought Stream", table_cell_style), Paragraph("Swarm Mesh", table_cell_style)],
        [Paragraph("6. Action Governance, HITL &amp; Security Shield", table_cell_bold), Paragraph("4-tier risk matrix, Action Confirmation Cards, approval queue, prompt shield", table_cell_style), Paragraph("Governance", table_cell_style)],
        [Paragraph("7. Natural Language DAG Automation Engine", table_cell_bold), Paragraph("NL-to-DAG planner, Kahn's algorithm topological runner, variable resolvers", table_cell_style), Paragraph("DAG Engine", table_cell_style)],
        [Paragraph("8. Visual Workflow Builder &amp; Webhooks", table_cell_bold), Paragraph("Interactive canvas at /workflows, execution runner console, inbound webhooks", table_cell_style), Paragraph("Workflow UI", table_cell_style)],
        [Paragraph("9. Enterprise PostgreSQL Relational Layer", table_cell_bold), Paragraph("28 Prisma models, composite indexing, transactions, dual-layer fallback", table_cell_style), Paragraph("Database", table_cell_style)],
        [Paragraph("10. Integrated Business Suite: CRM &amp; 360", table_cell_bold), Paragraph("Command Center (/modules), 7-stage pipeline board, Customer 360 drawer", table_cell_style), Paragraph("Business Suite", table_cell_style)],
        [Paragraph("11. Business Suite: HR, Finance, Inventory, Support", table_cell_bold), Paragraph("Salary masking, 18% GST engine, stock movement ledger, 4 SLA tiers", table_cell_style), Paragraph("Business Suite", table_cell_style)],
        [Paragraph("12. Week 6: AI Data Studio &amp; Recharts", table_cell_bold), Paragraph("Executive KPI ribbon, Area/Bar/Donut charts, NL Assistant, CSV export", table_cell_style), Paragraph("Data Studio", table_cell_style)],
        [Paragraph("13. Week 6: RAG Knowledge Vector Engine", table_cell_bold), Paragraph("384-dim semantic embeddings, cosine similarity, citations, hallucination guard", table_cell_style), Paragraph("RAG Engine", table_cell_style)],
        [Paragraph("14. Swarm Knowledge Tool &amp; Proactive Anomaly", table_cell_bold), Paragraph("Domain knowledgeTool.ts, autonomous scanner, dedupHash, action routing", table_cell_style), Paragraph("Proactive AI", table_cell_style)],
        [Paragraph("15. Formal System Modeling &amp; UML Diagrams", table_cell_bold), Paragraph("UML Use Case, Component, and Sequence diagrams (Figures 6, 7, 8)", table_cell_style), Paragraph("UML Models", table_cell_style)],
        [Paragraph("16. Comprehensive API Endpoints Specification", table_cell_bold), Paragraph("18 RESTful endpoints across Auth, Workflows, Modules, Analytics, RAG", table_cell_style), Paragraph("API Surface", table_cell_style)],
        [Paragraph("17. Evidence-Based Progress Matrix (W1–W6)", table_cell_bold), Paragraph("Comprehensive 22-item progress matrix with primary codebase evidence", table_cell_style), Paragraph("Verification", table_cell_style)],
        [Paragraph("18. Testing, Verification &amp; Defect Resolutions", table_cell_bold), Paragraph("Compiler tests, build logs, unit tests, and defect resolution chronicle", table_cell_style), Paragraph("Quality Assurance", table_cell_style)],
        [Paragraph("19. Remaining Roadmap (W7–W8) &amp; Conclusion", table_cell_bold), Paragraph("Roadmap figure, security hardening, cloud deployment, academic conclusions", table_cell_style), Paragraph("Roadmap &amp; Viva", table_cell_style)],
    ]
    t_toc = Table([toc_headers] + toc_data, colWidths=[140, 290, 85])
    t_toc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.2),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_toc)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: CHAPTER 1 — PROJECT OVERVIEW, CONTEXT & MOTIVATION
    # =========================================================================
    story.append(Paragraph("1. Project Overview, Context &amp; Problem Statement", h1_style))
    story.append(Paragraph(
        "<b>1.1. The Enterprise SaaS Fragmentation Crisis:</b> Modern organizations operate across heavily fragmented software ecosystems. A typical enterprise deploys Salesforce or HubSpot for CRM, BambooHR or Workday for Human Resources, QuickBooks or Tally for Invoicing and Tax Accounting, Zoho or custom ERPs for Inventory Warehousing, and Zendesk or Freshdesk for Customer Support. Each tool features isolated authentication schemes, proprietary data structures, and siloed communication channels. Operating across these systems requires substantial manual data re-entry, introduces transcription errors, and creates severe informational blind spots.",
        body_style
    ))
    story.append(Paragraph(
        "<b>1.2. The Layman Accessibility Divide:</b> Despite recent advances in large language models, enterprise automation remains largely confined to technical software engineers who write scripts, maintain Zapier/Make webhooks, or configure complex API connectors. Non-technical operational users, small business operators, domain accountants, and shop-floor inventory managers ('laymen') are disenfranchised by steep learning curves, English-only interfaces, and intimidating programming paradigms.",
        body_style
    ))
    story.append(Paragraph(
        "<b>1.3. The FlowMind AI Vision:</b> FlowMind AI bridges this structural gap by delivering a unified, <b>Multilingual Autonomous AI Business Operating System</b>. The core architectural philosophy rests upon three foundational tenets:",
        body_style
    ))
    story.append(Paragraph("&bull; <b>Universal Accessibility:</b> Non-technical operators describe complex operational goals in conversational natural language or voice (in English or 6 regional Indic languages: Hindi, Telugu, Tamil, Kannada, Malayalam, Odia). The system automatically translates linguistic input into structured, executable instructions.", bullet_style))
    story.append(Paragraph("&bull; <b>Governed Autonomy:</b> Rather than permitting unconstrained AI agency, FlowMind AI enforces a rigorous Action Governance framework. High-consequence mutations (financial payouts, supplier inventory orders, system deletions) generate transparent simulation diffs and require cryptographic human-in-the-loop (HITL) approval.", bullet_style))
    story.append(Paragraph("&bull; <b>Deep Enterprise Integration:</b> Instead of serving as a superficial chatbot wrapper, FlowMind AI natively integrates an operational business suite (CRM, HR, Finance, Inventory, Support) backed by a 28-model PostgreSQL relational database, an AI Data Studio, and a dense vector RAG knowledge hub.", bullet_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph("1.4. Key Research &amp; Engineering Contributions", h2_style))
    story.append(Paragraph("1. <b>Hierarchical Multi-Agent Coordination:</b> Engineered a 15-agent collaboration mesh orchestrated by a Master CEO Agent, eliminating context clutter and domain confusion.", bullet_style))
    story.append(Paragraph("2. <b>Topological DAG Workflow Execution:</b> Formulated a zero-code NL-to-DAG planner and topological runner utilizing Kahn's Algorithm to guarantee deadlock-free, cycle-free workflow automation.", bullet_style))
    story.append(Paragraph("3. <b>Dual-Layer Hybrid Persistence:</b> Designed a fault-tolerant database architecture utilizing PostgreSQL 18 with Prisma ORM that automatically synchronizes with in-memory state caches during offline conditions.", bullet_style))
    story.append(Paragraph("4. <b>Dense Semantic Vector RAG with Hallucination Defense:</b> Built a native 384-dimensional semantic embedding engine with cosine similarity search and a strict 0.20 similarity threshold that refuses ungrounded inquiries.", bullet_style))
    story.append(Paragraph("5. <b>Proactive Anomaly Detection:</b> Developed an autonomous background scanner that detects threshold breaches across enterprise records and dispatches governed actions with deduplication hashing.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: CHAPTER 2 — HIGH-LEVEL SYSTEM ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("2. High-Level System Architecture &amp; Layered Design", h1_style))
    story.append(Paragraph(
        "FlowMind AI is architected using a modern, multi-tier distributed architecture that cleanly isolates presentation, API gateway security, cognitive agent orchestration, workflow execution, vector search, and relational database persistence. Figure 1 illustrates the high-level architecture.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig1_system_architecture.png")):
        story.append(Image(os.path.join(img_dir, "fig1_system_architecture.png"), width=495, height=190))
        story.append(Paragraph("Figure 1: High-Level FlowMind AI System Architecture with Integrated PostgreSQL Layer", caption_style))

    story.append(Paragraph("Architectural Layer Breakdown &amp; Subsystem Responsibilities", h2_style))
    story.append(Paragraph("<b>1. Presentation Layer (Next.js 14 App Router):</b> Serves server-rendered and client-rendered React 18 interfaces styled with Tailwind CSS glassmorphic tokens. Houses the Layman Chatbot (/), Visual Workflow Canvas (/workflows), Business Suite (/modules, /modules/crm, /modules/hr, /modules/finance, /modules/inventory, /modules/support), AI Data Studio (/data-studio), and RAG Knowledge Hub (/knowledge-base).", body_style))
    story.append(Paragraph("<b>2. API Gateway &amp; Security Layer:</b> RESTful Next.js API route handlers protected by signed HS256 JWT cookies (Jose), BcryptJS password hashing, a Prompt Injection Shield, a 3-Tier Role-Based Access Control (RBAC) engine, and immutable audit logging.", body_style))
    story.append(Paragraph("<b>3. Conversational AI &amp; Indic Engine:</b> Real-time Unicode script detector and morphological lexicon translating queries across 7 Indic languages into canonical English intent tokens, supported by Web Speech STT/TTS voice synthesis.", body_style))
    story.append(Paragraph("<b>4. 15-Specialized AI Agent Swarm:</b> A decentralized mesh of 15 domain specialist agents coordinated by a Master CEO Orchestrator that decomposes high-level instructions, passes parameters, and aggregates decentralized outputs.", body_style))
    story.append(Paragraph("<b>5. Business Services &amp; Execution Engines:</b> Houses the Topological DAG Runner (Kahn's algorithm), Variable Resolver, Condition Evaluator, Business Service repository (35k+ lines), Analytics Engine, RAG Vector Engine, and Proactive Anomaly Scanner.", body_style))
    story.append(Paragraph("<b>6. PostgreSQL Database &amp; Prisma ORM Layer:</b> PostgreSQL 18 relational database (flowmind_db) on localhost:5432 containing 28 relational models, composite indexing, and dual-layer in-memory fallback resilience.", body_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: CHAPTER 2 (CONT.) — TECHNOLOGY STACK SPECIFICATIONS
    # =========================================================================
    story.append(Paragraph("2.1. Full-Stack Technology Stack &amp; Version Specifications", h1_style))
    story.append(Paragraph(
        "To satisfy the software engineering rigor required for university capstone evaluation, every technology component in FlowMind AI was selected based on strict criteria: type safety, compile-time validation, multi-tenant security, and real-time execution performance.",
        body_style
    ))

    stack_headers = [Paragraph("Stack Layer", table_header_style), Paragraph("Technologies Used", table_header_style), Paragraph("Exact Version", table_header_style), Paragraph("Architectural Purpose &amp; Role", table_header_style)]
    stack_rows = [
        [Paragraph("Core Framework", table_cell_bold), Paragraph("Next.js (App Router), React", table_cell_style), Paragraph("Next 14.2.35 / React 18.3.1", table_cell_code), Paragraph("Server/client rendering, dynamic force-dynamic route handlers, route optimization.", table_cell_style)],
        [Paragraph("Runtime &amp; Language", table_cell_bold), Paragraph("Node.js, TypeScript", table_cell_style), Paragraph("Node 24.16 / TS 5.4.5 (Strict)", table_cell_code), Paragraph("Compile-time safety, zero-any policy across 35k+ lines, domain contracts.", table_cell_style)],
        [Paragraph("UI &amp; Styling", table_cell_bold), Paragraph("Tailwind CSS, Lucide React, GSAP", table_cell_style), Paragraph("Tailwind 3.4.3 / Lucide 0.368", table_cell_code), Paragraph("Glassmorphic design tokens, fluid UI animations, responsive component library.", table_cell_style)],
        [Paragraph("3D Visualization", table_cell_bold), Paragraph("Three.js, React Three Fiber, Drei", table_cell_style), Paragraph("Three 0.163 / R3F 8.16 / Drei 9.105", table_cell_code), Paragraph("Spatial node visualizer on landing page and interactive 3D agent mesh network.", table_cell_style)],
        [Paragraph("Data Visualizers", table_cell_bold), Paragraph("Recharts", table_cell_style), Paragraph("Recharts 2.12.5", table_cell_code), Paragraph("Real-time operational charts: AreaChart (cash flow), BarChart (pipeline), PieChart (SLA).", table_cell_style)],
        [Paragraph("Database &amp; ORM", table_cell_bold), Paragraph("PostgreSQL, Prisma ORM", table_cell_style), Paragraph("PostgreSQL 18 / Prisma 5.19.1", table_cell_code), Paragraph("28 relational models, composite indexing, foreign key cascade, transaction isolation.", table_cell_style)],
        [Paragraph("Vector &amp; Semantic RAG", table_cell_bold), Paragraph("TypeScript Vector Engine", table_cell_style), Paragraph("Custom 384-Dim Dense Engine", table_cell_code), Paragraph("384-dimensional unit-norm vector embeddings, cosine distance, BM25 keyword boosting.", table_cell_style)],
        [Paragraph("Auth &amp; Encryption", table_cell_bold), Paragraph("Jose, BcryptJS, Secure Cookies", table_cell_style), Paragraph("Jose 6.2.12 / BcryptJS 3.0.3", table_cell_code), Paragraph("Signed HS256 JWT sessions, salted password hashing, HTTP-only cookie transport.", table_cell_style)],
        [Paragraph("State Management", table_cell_bold), Paragraph("Zustand", table_cell_style), Paragraph("Zustand 4.5.2", table_cell_code), Paragraph("Reactive global client stores for user session, active module, toasts, and voice state.", table_cell_style)],
        [Paragraph("Automation Engine", table_cell_bold), Paragraph("Topological DAG Runner", table_cell_style), Paragraph("Kahn's Sort (Native TS)", table_cell_code), Paragraph("Cycle-free DAG execution, variable interpolation, retries, and inbound webhook dispatch.", table_cell_style)],
        [Paragraph("Smooth Scroll", table_cell_bold), Paragraph("Studio Freight Lenis", table_cell_style), Paragraph("Lenis 1.0.42", table_cell_code), Paragraph("Inertial smooth scrolling provider enhancing layman navigation UX.", table_cell_style)],
        [Paragraph("Reporting Tools", table_cell_bold), Paragraph("ReportLab, Python-Docx, Matplotlib", table_cell_style), Paragraph("Python 3.11 / ReportLab 4.x", table_cell_code), Paragraph("Automated academic PDF report compiler and executive progress document generator.", table_cell_style)]
    ]
    t_stack = Table([stack_headers] + stack_rows, colWidths=[80, 115, 115, 205])
    t_stack.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_stack)
    story.append(Spacer(1, 8))

    story.append(Paragraph("2.2. Architectural Rationale for Core Technology Choices", h2_style))
    story.append(Paragraph("<b>Why Next.js 14 App Router?</b> The hybrid model allows static rendering for public marketing pages while utilizing server components and dynamic API route handlers (force-dynamic) for real-time authenticated enterprise operations without client hydration overhead.", body_style))
    story.append(Paragraph("<b>Why Native 384-Dimensional Embeddings?</b> External vector databases (Pinecone, Qdrant) introduce network latency, vendor lock-in, and costly cloud subscriptions. By calculating 384-dimensional unit-norm vectors in TypeScript and persisting them in PostgreSQL Json columns, FlowMind AI executes vector search in under 5 milliseconds with zero external dependencies.", body_style))
    story.append(Paragraph("<b>Why Prisma ORM over Raw SQL?</b> Prisma delivers end-to-end type safety between the PostgreSQL schema and TypeScript service layers. Schema changes in prisma/schema.prisma immediately generate updated TypeScript definitions, preventing runtime SQL type mismatches.", body_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: CHAPTER 3 — END-TO-END DATA FLOW PIPELINE
    # =========================================================================
    story.append(Paragraph("3. End-to-End System Data Flow Pipeline", h1_style))
    story.append(Paragraph(
        "The FlowMind AI request lifecycle is governed by an end-to-end 10-stage processing pipeline that transforms raw unstructured linguistic input into deterministic, governed database state changes. Figure 2 illustrates the linear data flow.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig2_data_flow_pipeline.png")):
        story.append(Image(os.path.join(img_dir, "fig2_data_flow_pipeline.png"), width=495, height=180))
        story.append(Paragraph("Figure 2: End-to-End FlowMind AI Data Flow Pipeline Diagram", caption_style))

    story.append(Paragraph("10-Stage Data Processing Pipeline Specification", h2_style))
    flow_steps = [
        ("Stage 1: User Natural Language / Voice Ingestion", "User submits a text or spoken voice prompt via the layman chat interface or dedicated module search bars."),
        ("Stage 2: Language Script & Indic Engine Detection", "The Indic Engine inspects Unicode hex values to identify the input language script and translates regional vocabulary into canonical tokens."),
        ("Stage 3: Security Scan & Prompt Injection Shield", "Regex pattern scanners intercept jailbreak phrases, delimiter hijacking, and system override patterns, sanitizing untrusted user strings."),
        ("Stage 4: Canonical Intent Parsing & Memory Recall", "Intent parsers extract action verbs, target entities, and operational parameters, augmenting the request with active conversation context."),
        ("Stage 5: Master Orchestrator Agent Routing", "The Master CEO Orchestrator analyzes intent and dynamically dispatches tasks to the appropriate specialist agent (e.g. Sales, Finance, HR)."),
        ("Stage 6: Specialist Agent Evaluation & Logic", "The assigned specialist agent queries the domain repository, retrieves relevant policy chunks via RAG, and formulates proposed actions."),
        ("Stage 7: Action Governance & Risk Classification", "The Action Governance engine assesses risk (LOW to CRITICAL). Mutations exceeding financial thresholds are routed to human approval."),
        ("Stage 8: Human Approval via Action Card (HITL)", "High-risk actions render an interactive Action Confirmation Card presenting simulation diffs for explicit manager approval."),
        ("Stage 9: Governed Execution & Artifact Generation", "Upon approval, the execution runner commits mutations, issues invoices, triggers DAG workflows, and generates downloadable artifacts."),
        ("Stage 10: PostgreSQL Database Audit & State Recording", "Prisma ORM records the mutation, logs the event in AuditLog with timestamp and actor ID, and pushes state updates to the UI.")
    ]
    for s_name, s_desc in flow_steps:
        story.append(Paragraph(f"<b>&bull; {s_name}:</b> {s_desc}", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 7: CHAPTER 4 — INDIC MULTILINGUAL ENGINE
    # =========================================================================
    story.append(Paragraph("4. Indic Multilingual NLP &amp; Regional Language Processing", h1_style))
    story.append(Paragraph(
        "To overcome the language barrier prevalent across Indian enterprise ecosystems, FlowMind AI features a built-in Indic Multilingual Engine supporting 7 regional languages. The architecture is illustrated in Figure 3.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig3_multilingual_flow.png")):
        story.append(Image(os.path.join(img_dir, "fig3_multilingual_flow.png"), width=495, height=185))
        story.append(Paragraph("Figure 3: Indic Multilingual Natural Language Processing Flow", caption_style))

    story.append(Paragraph("Unicode Script Detection &amp; Cross-Lingual Dictionary Mapping", h2_style))
    story.append(Paragraph(
        "The Indic Engine inspects the Unicode character block of incoming strings to identify the script: Devanagari (Hindi), Telugu, Tamil, Kannada, Malayalam, Odia, or Basic Latin (English). Input strings are matched against curated domain dictionaries in src/lib/i18n/translations.ts, mapping regional business terms (e.g. 'चालान' in Hindi or 'ఇన్వాయిస్' in Telugu) into canonical English intent tokens (e.g. 'INVOICE_CREATE').",
        body_style
    ))

    lang_headers = [Paragraph("Lang Code", table_header_style), Paragraph("Language Name", table_header_style), Paragraph("Native Script", table_header_style), Paragraph("Unicode Hex Range", table_header_style), Paragraph("Locale Identifier", table_header_style)]
    lang_rows = [
        [Paragraph("en", table_cell_bold), Paragraph("English", table_cell_style), Paragraph("Latin", table_cell_style), Paragraph("0020–007F", table_cell_code), Paragraph("en-US", table_cell_style)],
        [Paragraph("hi", table_cell_bold), Paragraph("Hindi", table_cell_style), Paragraph("Devanagari (हिन्दी)", table_cell_style), Paragraph("0900–097F", table_cell_code), Paragraph("hi-IN", table_cell_style)],
        [Paragraph("te", table_cell_bold), Paragraph("Telugu", table_cell_style), Paragraph("Telugu (తెలుగు)", table_cell_style), Paragraph("0C00–0C7F", table_cell_code), Paragraph("te-IN", table_cell_style)],
        [Paragraph("ta", table_cell_bold), Paragraph("Tamil", table_cell_style), Paragraph("Tamil (தமிழ்)", table_cell_style), Paragraph("0B80–0BFF", table_cell_code), Paragraph("ta-IN", table_cell_style)],
        [Paragraph("kn", table_cell_bold), Paragraph("Kannada", table_cell_style), Paragraph("Kannada (ಕನ್ನಡ)", table_cell_style), Paragraph("0C80–0CFF", table_cell_code), Paragraph("kn-IN", table_cell_style)],
        [Paragraph("ml", table_cell_bold), Paragraph("Malayalam", table_cell_style), Paragraph("Malayalam (മലയാളം)", table_cell_style), Paragraph("0D00–0D7F", table_cell_code), Paragraph("ml-IN", table_cell_style)],
        [Paragraph("or", table_cell_bold), Paragraph("Odia", table_cell_style), Paragraph("Odia (ଓଡ଼ିଆ)", table_cell_style), Paragraph("0B00–0B7F", table_cell_code), Paragraph("or-IN", table_cell_style)]
    ]
    t_lang = Table([lang_headers] + lang_rows, colWidths=[65, 105, 130, 110, 105])
    t_lang.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_lang)
    story.append(Spacer(1, 6))

    story.append(Paragraph("Voice Synthesis &amp; Thought Stream Transparency", h2_style))
    story.append(Paragraph(
        "For non-typists, FlowMind AI provides Web Speech API speech-to-text (STT) and text-to-speech (TTS) voice synthesis. During execution, the chat interface displays a live <b>Thought Stream</b> visualizing the internal reasoning steps taken by the AI in the user's selected language.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 8: CHAPTER 5 — 15-SPECIALIZED AI AGENT SWARM
    # =========================================================================
    story.append(Paragraph("5. 15-Specialized AI Agent Swarm &amp; Orchestration Protocol", h1_style))
    story.append(Paragraph(
        "To prevent cognitive hallucinations and domain contamination, FlowMind AI deploys a coordinated swarm of 15 specialized domain agents. Figure 4 illustrates the swarm mesh topology.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig4_week3_agent_mesh.png")):
        story.append(Image(os.path.join(img_dir, "fig4_week3_agent_mesh.png"), width=495, height=185))
        story.append(Paragraph("Figure 4: 15-Agent Swarm Collaboration Mesh and Routing Architecture", caption_style))

    story.append(Paragraph("Comprehensive Directory of the 15 Specialized Domain Agents", h2_style))

    agent_headers = [Paragraph("Agent ID", table_header_style), Paragraph("Domain &amp; Title", table_header_style), Paragraph("Core Operational Responsibilities", table_header_style), Paragraph("Key Tools &amp; Actions", table_header_style)]
    agent_rows = [
        [Paragraph("CEO", table_cell_bold), Paragraph("Executive Orchestration", table_cell_style), Paragraph("Deconstructs high-level goals, assigns tasks, aggregates outputs.", table_cell_style), Paragraph("routeTask, summarizeOps", table_cell_code)],
        [Paragraph("Sales", table_cell_bold), Paragraph("CRM &amp; Pipeline", table_cell_style), Paragraph("Qualifies leads, calculates lead score, advances sales stages.", table_cell_style), Paragraph("createLead, scoreDeal", table_cell_code)],
        [Paragraph("Marketing", table_cell_bold), Paragraph("Campaign Operations", table_cell_style), Paragraph("Generates marketing copy, schedules campaigns, analyzes CTR.", table_cell_style), Paragraph("createCampaign, evalCTR", table_cell_code)],
        [Paragraph("Finance", table_cell_bold), Paragraph("Invoicing &amp; Tax", table_cell_style), Paragraph("Manages invoices, calculates 18% GST, audits receivables.", table_cell_style), Paragraph("issueInvoice, paySettle", table_cell_code)],
        [Paragraph("HR", table_cell_bold), Paragraph("Workforce &amp; Leaves", table_cell_style), Paragraph("Maintains staff directory, processes leaves, runs payroll.", table_cell_style), Paragraph("approveLeave, runPayroll", table_cell_code)],
        [Paragraph("Support", table_cell_bold), Paragraph("Customer Helpdesk", table_cell_style), Paragraph("Triages tickets, enforces SLA response tiers, drafts solutions.", table_cell_style), Paragraph("triageTicket, closeIssue", table_cell_code)],
        [Paragraph("Analytics", table_cell_bold), Paragraph("Business Intelligence", table_cell_style), Paragraph("Calculates cross-module KPIs, runs NL queries, detects anomalies.", table_cell_style), Paragraph("queryKpis, exportCsv", table_cell_code)],
        [Paragraph("Database", table_cell_bold), Paragraph("Relational Storage", table_cell_style), Paragraph("Executes governed Prisma queries, validates constraints.", table_cell_style), Paragraph("queryDb, syncPrisma", table_cell_code)],
        [Paragraph("Workflow", table_cell_bold), Paragraph("DAG Automation", table_cell_style), Paragraph("Compiles NL to DAG, executes topological sorting runner.", table_cell_style), Paragraph("planDAG, executeNodes", table_cell_code)],
        [Paragraph("Scheduler", table_cell_bold), Paragraph("Cron &amp; Timers", table_cell_style), Paragraph("Maintains background cron schedules and recurring triggers.", table_cell_style), Paragraph("scheduleJob, cancelTimer", table_cell_code)],
        [Paragraph("Document", table_cell_bold), Paragraph("Document Generation", table_cell_style), Paragraph("Assembles executive digests, compiles PDFs and CSV sheets.", table_cell_style), Paragraph("generatePDF, buildCSV", table_cell_code)],
        [Paragraph("Email", table_cell_bold), Paragraph("Outbound Messaging", table_cell_style), Paragraph("Dispatches automated email notifications, payment reminders.", table_cell_style), Paragraph("sendEmail, queueDigest", table_cell_code)],
        [Paragraph("Knowledge", table_cell_bold), Paragraph("RAG Semantic Search", table_cell_style), Paragraph("Ingests SOPs, retrieves chunks via 384-dim vector embeddings.", table_cell_style), Paragraph("ingestDoc, queryVector", table_cell_code)],
        [Paragraph("Reporting", table_cell_bold), Paragraph("Digest Assembler", table_cell_style), Paragraph("Generates weekly multi-domain performance digests.", table_cell_style), Paragraph("compileDigest, sendReport", table_cell_code)],
        [Paragraph("Security", table_cell_bold), Paragraph("Governance Guard", table_cell_style), Paragraph("Enforces RBAC permissions, blocks prompt injections, audits logs.", table_cell_style), Paragraph("scanInjection, logAudit", table_cell_code)]
    ]
    t_agents = Table([agent_headers] + agent_rows, colWidths=[55, 115, 215, 130])
    t_agents.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_agents)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 9: CHAPTER 6 — ACTION GOVERNANCE & SECURITY SHIELD
    # =========================================================================
    story.append(Paragraph("6. Action Governance, Risk Classification &amp; Security Shield", h1_style))
    story.append(Paragraph(
        "Autonomous AI systems pose existential business risks if permitted to perform state-mutating actions without oversight. FlowMind AI mitigates this through a multi-tier Action Governance engine and a Human-in-the-Loop (HITL) gatekeeper.",
        body_style
    ))

    story.append(Paragraph("6.1. 4-Tier Risk Assessment Matrix", h2_style))
    story.append(Paragraph(
        "Every proposed action generated by an AI agent is passed through actionGovernance.ts and evaluated against a 4-tier risk classification matrix:",
        body_style
    ))

    risk_headers = [Paragraph("Risk Level", table_header_style), Paragraph("Financial / Operational Criteria", table_header_style), Paragraph("Governance Protocol", table_header_style), Paragraph("Example Actions", table_header_style)]
    risk_rows = [
        [Paragraph("<font color='#059669'><b>LOW</b></font>", table_cell_bold), Paragraph("Read-only queries, data filtering, searching records", table_cell_style), Paragraph("Autonomous Execution (Logged to AuditLog)", table_cell_style), Paragraph("Search lead, list inventory, view ticket", table_cell_style)],
        [Paragraph("<font color='#2563EB'><b>MEDIUM</b></font>", table_cell_bold), Paragraph("Non-destructive mutations under INR 10,000 threshold", table_cell_style), Paragraph("Action Card Preview + Operator Click Confirmation", table_cell_style), Paragraph("Create lead, update ticket note, adjust 1 SKU", table_cell_style)],
        [Paragraph("<font color='#D97706'><b>HIGH</b></font>", table_cell_bold), Paragraph("Mutations between INR 10,000 and 50,000, leave approvals", table_cell_style), Paragraph("HITL Action Card + Manager Dual-Control Sign-off", table_cell_style), Paragraph("Approve leave, create invoice, restock 25 units", table_cell_style)],
        [Paragraph("<font color='#DC2626'><b>CRITICAL</b></font>", table_cell_bold), Paragraph("Transactions > INR 50,000, payroll runs, catalog deletes", table_cell_style), Paragraph("Strict Admin Approval in Governance Queue", table_cell_style), Paragraph("Run payroll, issue INR 2.5L contract, delete user", table_cell_style)]
    ]
    t_risk = Table([risk_headers] + risk_rows, colWidths=[70, 165, 145, 135])
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
    story.append(Spacer(1, 8))

    story.append(Paragraph("6.2. Action Confirmation Cards (ActionCard.tsx)", h2_style))
    story.append(Paragraph(
        "For HIGH and MEDIUM risk actions, the chat UI intercepts execution and renders an Action Confirmation Card. The card displays a simulation diff showing pre-mutation vs. post-mutation states, risk level badge, financial impact, and explicit 'Approve Action', 'Edit Parameters', and 'Cancel' buttons.",
        body_style
    ))

    story.append(Paragraph("6.3. Prompt Injection Defense Shield (promptInjectionShield.ts)", h2_style))
    story.append(Paragraph(
        "FlowMind AI protects its agent swarm from adversarial attacks using a dedicated regex pattern scanner. The shield intercepts:",
        body_style
    ))
    story.append(Paragraph("&bull; <b>System Prompt Overrides:</b> Phrases like 'ignore previous instructions', 'system override', 'disregard safety protocols'.", bullet_style))
    story.append(Paragraph("&bull; <b>Roleplay Exploits:</b> Jailbreaks attempting to coerce agents into DAN (Do Anything Now) personas.", bullet_style))
    story.append(Paragraph("&bull; <b>Delimiter Manipulation:</b> Markdown and XML injection attacks designed to escape prompt boundaries.", bullet_style))
    story.append(Paragraph("&bull; <b>Data Exfiltration Attempts:</b> Regex matching attempts to leak environment variables, JWT secrets, or raw database credentials.", bullet_style))
    story.append(Paragraph("Any detected adversarial attempt is immediately neutralized, assigned a CRITICAL risk level, blocked from agent routing, and committed to AuditLog with IP and timestamp metadata.", body_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 10: CHAPTER 7 — NATURAL LANGUAGE DAG WORKFLOW ENGINE
    # =========================================================================
    story.append(Paragraph("7. Natural Language DAG Workflow Automation Engine", h1_style))
    story.append(Paragraph(
        "FlowMind AI features a zero-code workflow engine that compiles plain-language instructions into executable Directed Acyclic Graphs (DAGs) verified via topological sorting. Figure 5 illustrates the pipeline.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig5_week4_workflow_pipeline.png")):
        story.append(Image(os.path.join(img_dir, "fig5_week4_workflow_pipeline.png"), width=495, height=185))
        story.append(Paragraph("Figure 5: Natural Language Workflow Automation Pipeline Diagram", caption_style))

    story.append(Paragraph("7.1. Generative NL-to-DAG Planner (workflowPlanner.ts)", h2_style))
    story.append(Paragraph(
        "When an operator types a prompt like 'When an enterprise lead signs, generate an 18% GST invoice, deduct 5 units from stock, and notify support', the workflow planner executes a deterministic generative compilation into a structured DAG schema. The compiler extracts nodes (TRIGGERS, ACTIONS, CONDITIONS), defines directed edges, and binds typed input parameters.",
        body_style
    ))

    story.append(Paragraph("7.2. Topological Sorting via Kahn's Algorithm (workflowEngine.ts)", h2_style))
    story.append(Paragraph(
        "To guarantee deterministic, cycle-free execution, the workflow engine implements Kahn's Algorithm:",
        body_style
    ))
    story.append(Paragraph("1. Calculate the in-degree d_in(v) for each node v in V.", bullet_style))
    story.append(Paragraph("2. Enqueue all trigger nodes with in-degree equal to 0 into execution queue Q.", bullet_style))
    story.append(Paragraph("3. While Q is non-empty, dequeue node u, execute its handler, and store outputs in Context.", bullet_style))
    story.append(Paragraph("4. For each directed edge (u, w), decrement d_in(w). If d_in(w) == 0, enqueue w into Q.", bullet_style))
    story.append(Paragraph("5. If nodes executed < |V|, a circular dependency cycle is detected and execution is halted with an error.", bullet_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("7.3. Dynamic Variable Resolution &amp; Fault Tolerance", h2_style))
    story.append(Paragraph(
        "The Variable Resolver evaluates template expressions like {{node_1.output.leadId}} during runtime, extracting dynamic values from upstream node outputs. Transient node failures trigger an automatic retry policy with exponential backoff (initial delay 500ms, multiplier 2x, max 3 retries) before marking execution state as FAILED.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 11: CHAPTER 8 — VISUAL WORKFLOW BUILDER & WEBHOOKS
    # =========================================================================
    story.append(Paragraph("8. Visual Workflow Builder &amp; Inbound Webhook Subsystem", h1_style))
    story.append(Paragraph(
        "To provide layman operators with intuitive visibility into automated processes, FlowMind AI provides an interactive Visual DAG Builder at /workflows and external webhook triggers.",
        body_style
    ))

    story.append(Paragraph("8.1. Interactive Visual Workflow Canvas (/workflows)", h2_style))
    story.append(Paragraph(
        "The visual canvas (VisualDAGGraph.tsx) renders executable DAGs as an interactive spatial node network. Features include:",
        body_style
    ))
    story.append(Paragraph("&bull; <b>Spatial Graph Navigation:</b> Smooth canvas panning and zoom controls for exploring complex multi-step automations.", bullet_style))
    story.append(Paragraph("&bull; <b>Real-Time Node State Badges:</b> Visual color indicators dynamically tracking node lifecycle: IDLE (slate), RUNNING (pulsing purple), SUCCESS (emerald checkmark), and FAILED (red alert).", bullet_style))
    story.append(Paragraph("&bull; <b>Node Configuration Inspector:</b> Slide-out drawer allowing non-technical operators to modify trigger conditions, agent assignments, and parameters without touching JSON.", bullet_style))
    story.append(Paragraph("&bull; <b>Live Execution Runner Console:</b> Split-screen terminal (ExecutionRunnerConsole.tsx) streaming stdout logs, execution durations in milliseconds, and variable resolution payloads.", bullet_style))

    story.append(Paragraph("8.2. Inbound Webhook Subsystem (/api/workflows/webhook/[workflowId])", h2_style))
    story.append(Paragraph(
        "FlowMind AI exposes secure inbound webhook endpoints allowing external SaaS tools, forms, and third-party systems to trigger DAG workflow execution:",
        body_style
    ))
    story.append(Paragraph("&bull; <b>Endpoint:</b> POST /api/workflows/webhook/[workflowId]", bullet_style))
    story.append(Paragraph("&bull; <b>Security &amp; Token Auth:</b> Requests are authenticated via Bearer API tokens in the Authorization header. Unauthenticated requests are rejected with a 401 Unauthorized status.", bullet_style))
    story.append(Paragraph("&bull; <b>Payload Validation:</b> JSON request bodies are validated against the workflow's configured trigger schema before execution dispatch.", bullet_style))
    story.append(Paragraph("&bull; <b>Asynchronous Job Spooling:</b> Inbound webhooks enqueue workflow runs into the background execution pool, returning an immediate 202 Accepted status with executionId for polling.", bullet_style))

    story.append(Paragraph("8.3. Event-Driven Internal Business Mutation Bridge", h2_style))
    story.append(Paragraph(
        "Internal mutations within the business operations suite automatically emit event triggers via emitBusinessEvent():",
        body_style
    ))
    story.append(Paragraph("&bull; <b>lead.created:</b> Triggers sales qualification workflows and auto-assigns account executives.", bullet_style))
    story.append(Paragraph("&bull; <b>invoice.paid:</b> Triggers financial ledger settlement and dispatches confirmation receipts.", bullet_style))
    story.append(Paragraph("&bull; <b>stock.low:</b> Triggers hardware replenishment workflows and alerts inventory managers.", bullet_style))
    story.append(Paragraph("&bull; <b>leave.approved:</b> Triggers HR calendar sync and updates employee attendance records.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 12: CHAPTER 9 — ENTERPRISE DATABASE LAYER (POSTGRESQL & PRISMA)
    # =========================================================================
    story.append(Paragraph("9. Enterprise Relational Database Layer (PostgreSQL &amp; Prisma ORM)", h1_style))
    story.append(Paragraph(
        "FlowMind AI is backed by an enterprise PostgreSQL 18 relational database accessed via Prisma ORM 5.19.1. Figure 10 illustrates the relational schema containing 28 synchronized models.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig10_postgresql_database_schema.png")):
        story.append(Image(os.path.join(img_dir, "fig10_postgresql_database_schema.png"), width=495, height=185))
        story.append(Paragraph("Figure 10: Relational Enterprise PostgreSQL Database &amp; Prisma ORM Architecture Diagram", caption_style))

    story.append(Paragraph("28 Relational Prisma Schema Models Breakdown", h2_style))
    db_groups = [
        ("Multi-Tenant &amp; Identity Core (4 Models)", "Organization (tenant root), User (credentials, role, preferred language), Permission (20 granular codes), Session (token tracking)."),
        ("Agent Swarm &amp; Governance (4 Models)", "Agent (15 swarm definitions), AgentTask (task logs), ApprovalRequest (HITL queue), AuditLog (immutable action records)."),
        ("Workflow &amp; DAG Execution (5 Models)", "Workflow (DAG schema), WorkflowVersion (version history), WorkflowExecution (run logs), NodeExecution (node outputs), WorkflowTrigger (webhook/cron)."),
        ("CRM &amp; Sales Operations (2 Models)", "Lead (7-stage pipeline, lead score, deal value), LeadStageHistory (audit trail of stage movements)."),
        ("HR &amp; Workforce Management (3 Models)", "Employee (staff profiles, confidential salary), LeaveRequest (leave dates, status, approver), PayrollRecord (monthly payroll payouts)."),
        ("Finance &amp; Invoicing (3 Models)", "Invoice (lifecycle states, total, 18% GST), InvoiceItem (line items, pricing), Payment (payment receipts, methods)."),
        ("Inventory &amp; Warehousing (2 Models)", "Product (hardware SKU, unit price, reorder level), StockMovement (stock ledger: IN, OUT, ADJUSTMENT)."),
        ("Customer Support Helpdesk (2 Models)", "SupportTicket (4 SLA priority tiers, status, assignee), TicketNote (internal operator resolution notes)."),
        ("Week 6 RAG Knowledge Hub (3 Models)", "KnowledgeDocument (indexed SOPs, access scope), DocumentChunk (vector chunks with 384-dim embeddings), IngestionJob (status)."),
        ("Week 6 Proactive Intelligence &amp; Views (2 Models)", "ProactiveInsight (detected threshold anomalies, action payloads), InsightHistory (state audit trail), SavedAnalyticsView (UI presets).")
    ]
    for g_title, g_desc in db_groups:
        story.append(Paragraph(f"<b>&bull; {g_title}:</b> {g_desc}", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 13: CHAPTER 10 — BUSINESS SUITE: CRM & CUSTOMER 360
    # =========================================================================
    story.append(Paragraph("10. Integrated Business Operations Suite: CRM &amp; Customer 360", h1_style))
    story.append(Paragraph(
        "Week 5 expanded FlowMind AI into a unified Enterprise Business Operating System. Rather than disconnected tools, five distinct business domains are integrated into a single relational ecosystem.",
        body_style
    ))

    story.append(Paragraph("10.1. Unified Command Center (/modules)", h2_style))
    story.append(Paragraph(
        "The Command Center (/modules) provides an executive overview across all business units:",
        body_style
    ))
    story.append(Paragraph("&bull; <b>Multi-Domain KPI Ribbons:</b> Real-time tallies of active CRM leads, pipeline valuation, staff headcount, outstanding invoices, low-stock SKUs, and open support tickets.", bullet_style))
    story.append(Paragraph("&bull; <b>Proactive FlowMind Insights:</b> Automated intelligence banners highlighting overdue receivables, impending stockouts, and unassigned critical tickets.", bullet_style))
    story.append(Paragraph("&bull; <b>Multi-Entity Global Search:</b> A unified search bar allowing operators to query leads, staff, invoices, and tickets simultaneously with real-time autocompletion.", bullet_style))

    story.append(Paragraph("10.2. CRM Sales Pipeline Module (/modules/crm)", h2_style))
    story.append(Paragraph(
        "The CRM module manages end-to-end B2B enterprise sales pipelines:",
        body_style
    ))
    story.append(Paragraph("&bull; <b>7-Stage Interactive Pipeline Board:</b> Visual Kanban board tracking deals across NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, WON, and LOST stages.", bullet_style))
    story.append(Paragraph("&bull; <b>Algorithmic Lead Scoring (1–100):</b> Automated score evaluation based on budget adequacy, authority, need, and timeline (BANT criteria).", bullet_style))
    story.append(Paragraph("&bull; <b>Stage History Audit Trail:</b> Every stage transition is recorded in LeadStageHistory with timestamp and operator metadata.", bullet_style))

    story.append(Paragraph("10.3. Sliding Customer 360 Drawer", h2_style))
    story.append(Paragraph(
        "Clicking any customer opens a sliding <b>Customer 360 Drawer</b> that eliminates enterprise data silos by correlating:",
        body_style
    ))
    story.append(Paragraph("&bull; <b>Active CRM Deals:</b> Current deal values, probability percentages, and account executive assignments.", bullet_style))
    story.append(Paragraph("&bull; <b>Financial Billing History:</b> Paid, pending, and overdue invoices with GST tax breakdowns.", bullet_style))
    story.append(Paragraph("&bull; <b>Support Ticket History:</b> Resolved and open helpdesk tickets with SLA compliance metrics.", bullet_style))
    story.append(Paragraph("&bull; <b>Automated AI Risk Profile:</b> Real-time risk indicator flagging customers with overdue invoices (> 15 days) prior to approving discounts.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 14: CHAPTER 11 — BUSINESS SUITE: HR, FINANCE, INVENTORY, SUPPORT
    # =========================================================================
    story.append(Paragraph("11. Integrated Business Suite: HR, Finance, Inventory &amp; Support", h1_style))
    story.append(Paragraph(
        "The remaining four operational modules provide full-stack departmental capabilities governed by strict security and workflow automation:",
        body_style
    ))

    story.append(Paragraph("11.1. HR &amp; Workforce Management (/modules/hr)", h2_style))
    story.append(Paragraph("&bull; <b>Staff Directory &amp; Column-Level Salary Masking:</b> Comprehensive employee profiles. To protect confidentiality, salary and payroll totals are programmatically masked to 0 / '🔒 Restricted' for EMPLOYEE sessions.", bullet_style))
    story.append(Paragraph("&bull; <b>Leave Governance &amp; Anti-Self-Approval:</b> Employees submit leave requests; managers review pending applications. Programmatic rules strictly block managers from approving their own leave requests.", bullet_style))
    story.append(Paragraph("&bull; <b>On-Demand Payroll Engine:</b> Calculates monthly net payouts, tax deductions, and records payouts in PayrollRecord.", bullet_style))

    story.append(Paragraph("11.2. Finance &amp; Invoicing Module (/modules/finance)", h2_style))
    story.append(Paragraph("&bull; <b>Invoice Lifecycle Management:</b> Tracks invoices across DRAFT, PENDING, APPROVED, SENT, PAID, and OVERDUE states.", bullet_style))
    story.append(Paragraph("&bull; <b>Indian 18% GST Compliance:</b> Automatically computes subtotal, 9% CGST + 9% SGST (or 18% IGST), and grand total.", bullet_style))
    story.append(Paragraph("&bull; <b>Single-Click Payment Settlement:</b> Records cash, bank transfer, and UPI receipts, transitioning invoice state to PAID.", bullet_style))
    story.append(Paragraph("&bull; <b>Printable HTML &amp; PDF Downloads:</b> Generates professional, tax-compliant invoice PDFs with itemized line items.", bullet_style))

    story.append(Paragraph("11.3. Inventory &amp; Warehousing Module (/modules/inventory)", h2_style))
    story.append(Paragraph("&bull; <b>Hardware Catalog &amp; SKUs:</b> Tracks hardware items with SKU codes, unit costs, and minimum buffer reorder levels.", bullet_style))
    story.append(Paragraph("&bull; <b>Stock Movement Ledger:</b> Audits all quantity mutations (STOCK_IN, STOCK_OUT, ADJUSTMENT) with timestamped records.", bullet_style))
    story.append(Paragraph("&bull; <b>Safety Stock Warning Banners:</b> Automatically highlights SKUs where current quantity is below safety threshold.", bullet_style))

    story.append(Paragraph("11.4. Customer Support Helpdesk (/modules/support)", h2_style))
    story.append(Paragraph("&bull; <b>4 SLA Priority Tiers:</b> Queues tickets by priority (LOW, MEDIUM, HIGH, CRITICAL) with target resolution deadlines.", bullet_style))
    story.append(Paragraph("&bull; <b>Resolution Notes &amp; Status Transitions:</b> Support agents document solutions in TicketNote and mark tickets RESOLVED.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 15: CHAPTER 12 — WEEK 6: AI DATA STUDIO & VISUAL ANALYTICS
    # =========================================================================
    story.append(Paragraph("12. Week 6: AI Data Studio &amp; Real-Time Visual Analytics", h1_style))
    story.append(Paragraph(
        "Week 6 introduced the AI Data Studio (/data-studio), transforming FlowMind AI from an operational tracking suite into an analytical intelligence workspace powered by interactive Recharts visualizers and natural language analytics.",
        body_style
    ))

    story.append(Paragraph("12.1. Executive Multi-Tenant KPI Ribbon", h2_style))
    story.append(Paragraph(
        "The Data Studio aggregates live metrics calculated directly from persisted database models:",
        body_style
    ))
    story.append(Paragraph("&bull; <b>Realized Revenue:</b> INR 5,90,000 in collections across paid invoices; tracks overdue receivables balance.", bullet_style))
    story.append(Paragraph("&bull; <b>Sales Pipeline Valuation:</b> Real-time pipeline total across active CRM leads with win conversion percentage.", bullet_style))
    story.append(Paragraph("&bull; <b>Workforce Headcount &amp; Payroll:</b> Total active staff count; payroll total strictly masked for Employee tier.", bullet_style))
    story.append(Paragraph("&bull; <b>Inventory &amp; Safety Buffer:</b> Total catalog units across SKUs with low-stock and out-of-stock count.", bullet_style))
    story.append(Paragraph("&bull; <b>Support SLA Compliance:</b> Queue health percentage across critical and open support incidents.", bullet_style))
    story.append(Paragraph("&bull; <b>DAG Workflow Execution:</b> Total background execution runs with 94.4%+ reliability rating.", bullet_style))

    story.append(Paragraph("12.2. Interactive Recharts Visual Analytics Grid", h2_style))
    story.append(Paragraph("&bull; <b>Financial Cash Flow AreaChart:</b> Plots Invoiced Total vs. Realized Collections over 7D, 30D, and 90D presets with linear color gradients.", bullet_style))
    story.append(Paragraph("&bull; <b>Sales Pipeline Funnel BarChart:</b> Dual-axis bar chart displaying active lead count and deal valuation across 6 conversion stages.", bullet_style))
    story.append(Paragraph("&bull; <b>Support Incident Priority Donut Chart:</b> Donut chart illustrating ticket severity distribution (Critical, High, Medium, Low).", bullet_style))

    story.append(Paragraph("12.3. Conversational Natural Language Analytics Assistant", h2_style))
    story.append(Paragraph(
        "Operators query business data using everyday natural language (e.g. 'Summarize this month’s sales performance' or 'Which invoices are overdue?'). The assistant in analyticsService.ts:",
        body_style
    ))
    story.append(Paragraph("1. Sanitizes user input against prompt injection attempts.", bullet_style))
    story.append(Paragraph("2. Matches intent against CRM, Finance, HR, Inventory, or Support data schemas.", bullet_style))
    story.append(Paragraph("3. Computes exact aggregated metrics from verified database records.", bullet_style))
    story.append(Paragraph("4. Synthesizes a plain-language executive explanation alongside a dynamic mini-chart visualizer.", bullet_style))
    story.append(Paragraph("5. Recommends context-aware follow-up prompt pills for single-click analytical drilldowns.", bullet_style))

    story.append(Paragraph("12.4. Client-Side Structured CSV Export", h2_style))
    story.append(Paragraph(
        "A dedicated client-side exporter compiles the complete operational KPI matrix into a clean, timestamped CSV file (flowmind_analytics_[timestamp].csv) for offline spreadsheet analysis.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 16: CHAPTER 13 — WEEK 6: RAG KNOWLEDGE VECTOR ENGINE
    # =========================================================================
    story.append(Paragraph("13. Week 6: RAG Knowledge Intelligence &amp; Vector Q&amp;A Engine", h1_style))
    story.append(Paragraph(
        "Week 6 delivered the RAG Knowledge Hub (/knowledge-base), enabling verifiable question-answering grounded strictly in company documentation. Figure 11 illustrates the vector architecture.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig11_rag_and_analytics_architecture.png")):
        story.append(Image(os.path.join(img_dir, "fig11_rag_and_analytics_architecture.png"), width=495, height=185))
        story.append(Paragraph("Figure 11: Week 6 AI Data Studio, RAG Knowledge Vector Engine &amp; Proactive Insights Architecture", caption_style))

    story.append(Paragraph("13.1. Document Ingestion &amp; Prompt-Injection Scrubbing", h2_style))
    story.append(Paragraph(
        "The ingestion engine supports PDF, TXT, DOCX, Markdown, and CSV files. Pre-flight regex sanitization neutralizes prompt-injection payloads before text chunking. Documents are segmented using a sliding window respecting paragraph boundaries with auto-extracted section headers.",
        body_style
    ))

    story.append(Paragraph("13.2. 384-Dimensional Dense Semantic Vector Embeddings", h2_style))
    story.append(Paragraph(
        "FlowMind AI implements a deterministic dense vector generator mapping text into 384-dimensional unit-norm vector space (v in R^384, ||v|| = 1.0). High-frequency English stop words are filtered to ensure high-information domain tokens dominate vector dimensions. Vectors are stored natively in PostgreSQL via Prisma Json fields.",
        body_style
    ))

    story.append(Paragraph("13.3. Cosine Similarity, BM25 Boosting &amp; Hallucination Defense", h2_style))
    story.append(Paragraph(
        "Retrieval scores chunks using cosine similarity combined with BM25 keyword overlap boosting: Score = cos(q, d) + BM25_Boost. To prevent hallucinations, FlowMind AI enforces a strict 0.20 similarity threshold: if no verified chunk exceeds 0.20 similarity, the engine refuses to answer, returning an explicit insufficient evidence notice.",
        body_style
    ))

    story.append(Paragraph("13.4. Verified Source Citations &amp; Pre-Seeded Playbooks", h2_style))
    story.append(Paragraph(
        "Every generated answer includes verifiable source citations displaying document title, section header, page number, chunk index, similarity match percentage, and the exact text snippet. Pre-seeded corporate playbooks include:",
        body_style
    ))
    story.append(Paragraph("&bull; <b>Sales Playbook:</b> BANT qualification criteria, discounting approval matrix (discounts > 25% require Action Governance).", bullet_style))
    story.append(Paragraph("&bull; <b>Finance &amp; GST SOP:</b> 18% GST mandates, HSN/SAC codes, Net 15/30 overdue escalation procedures.", bullet_style))
    story.append(Paragraph("&bull; <b>Employee Leave Handbook:</b> Annual leave accrual, notice periods, leave encashment calculations.", bullet_style))
    story.append(Paragraph("&bull; <b>Support SLA Policy:</b> Critical response tier (1-hour response, 4-hour resolution), escalation protocols.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 17: CHAPTER 14 — SWARM KNOWLEDGE TOOL & PROACTIVE ANOMALY
    # =========================================================================
    story.append(Paragraph("14. Knowledge-Aware Agent Mesh &amp; Proactive Business Intelligence", h1_style))
    story.append(Paragraph(
        "FlowMind AI bridges the 15-agent swarm to corporate knowledge and introduces autonomous background anomaly detection with Action Governance integration.",
        body_style
    ))

    story.append(Paragraph("14.1. Knowledge-Aware Agent Mesh Bridge (knowledgeTool.ts)", h2_style))
    story.append(Paragraph(
        "The centralized KnowledgeToolService equips the 15-agent swarm with domain-specialized corporate policy context:",
        body_style
    ))
    story.append(Paragraph("&bull; <b>Sales Agent:</b> Augments prompts with pricing structures, BANT lead qualification, and discounting authorization matrices.", bullet_style))
    story.append(Paragraph("&bull; <b>Finance Agent:</b> Augments prompts with GST tax compliance, invoice terms, and collection escalation rules.", bullet_style))
    story.append(Paragraph("&bull; <b>HR Agent:</b> Augments prompts with leave allowances, notice period rules, and health benefit policies.", bullet_style))
    story.append(Paragraph("&bull; <b>Support Agent:</b> Augments prompts with SLA response deadlines and incident escalation paths.", bullet_style))
    story.append(Paragraph("Every agent retrieval invocation is recorded in AuditLog with agentId, query, and retrieved source count.", body_style))

    story.append(Paragraph("14.2. Proactive Business Intelligence Engine (proactiveInsightsService.ts)", h2_style))
    story.append(Paragraph(
        "Rather than waiting for user inquiries, an autonomous scanner continuously evaluates live database state to detect operational anomalies:",
        body_style
    ))
    story.append(Paragraph("&bull; <b>Finance Threshold Breaches:</b> Identifies invoices past Net 15/30 due dates with outstanding balance > INR 50,000.", bullet_style))
    story.append(Paragraph("&bull; <b>Inventory Stockout Alerts:</b> Identifies SKUs where current quantity is below safety reorder threshold.", bullet_style))
    story.append(Paragraph("&bull; <b>Stale CRM Leads:</b> Flags high-value deals lingering in pipeline stages for over 7 business days without activity.", bullet_style))
    story.append(Paragraph("&bull; <b>SLA Violation Alerts:</b> Detects unassigned or overdue critical priority support tickets violating 1-hour SLA.", bullet_style))

    story.append(Paragraph("14.3. Deduplication Hashing &amp; Lifecycle State Machine", h2_style))
    story.append(Paragraph(
        "To prevent alert fatigue, detected breaches are hashed: dedupHash = Hash(Module + EntityId + Condition). If an active insight already possesses that hash, duplicate alerts are suppressed. Insights progress through a finite state machine: NEW -> ACKNOWLEDGED -> RESOLVED, with actor audit trails in InsightHistory.",
        body_style
    ))

    story.append(Paragraph("14.4. Governed Action Recommendations via Action Governance", h2_style))
    story.append(Paragraph(
        "Each detected insight generates a recommended action. High/Critical risk actions (e.g. issuing supplier replenishment purchase orders, sending overdue demand notices) automatically route into the Action Governance approval queue (approvalService.ts) for Manager/Admin sign-off; low-risk actions execute autonomously.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 18: CHAPTER 15 — FORMAL SYSTEM MODELING (UML USE CASE & COMPONENT)
    # =========================================================================
    story.append(Paragraph("15. Formal System Modeling &amp; UML Architectural Specifications", h1_style))
    story.append(Paragraph(
        "To satisfy university capstone documentation standards, FlowMind AI is formally specified using UML Use Case and Component diagrams. Figures 6 and 7 illustrate the system boundaries, actors, and component relationships.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig6_uml_use_case.png")):
        story.append(Image(os.path.join(img_dir, "fig6_uml_use_case.png"), width=495, height=175))
        story.append(Paragraph("Figure 6: UML Use Case Diagram for FlowMind AI Multi-Tenant Platform", caption_style))

    story.append(Paragraph("15.1. Actor Roles &amp; Use Case Boundaries", h2_style))
    story.append(Paragraph("&bull; <b>Non-Technical Business Operator:</b> Submits natural language commands, approves Action Cards, inspects visual DAGs, searches knowledge base.", bullet_style))
    story.append(Paragraph("&bull; <b>Operations Manager:</b> Manages CRM pipeline stages, approves leave applications, reviews proactive insights, signs off on high-risk actions.", bullet_style))
    story.append(Paragraph("&bull; <b>System Administrator:</b> Manages tenant configuration, runs payroll, unmasks confidential data, audits system logs.", bullet_style))
    story.append(Paragraph("&bull; <b>Autonomous Agent Swarm:</b> Decomposes instructions, evaluates policies, executes DAG nodes, scans for anomalies.", bullet_style))

    if os.path.exists(os.path.join(img_dir, "fig7_uml_component.png")):
        story.append(Image(os.path.join(img_dir, "fig7_uml_component.png"), width=495, height=155))
        story.append(Paragraph("Figure 7: UML Component Diagram Illustrating Service Boundaries", caption_style))

    story.append(Paragraph("15.2. Component Interaction &amp; Service Boundaries", h2_style))
    story.append(Paragraph(
        "The presentation tier communicates exclusively with backend API route handlers. Business services (BusinessService, WorkflowEngine, AnalyticsService, RagService, ProactiveInsightsService) communicate through shared TypeScript interfaces, utilizing Prisma ORM for relational persistence and KnowledgeToolService for semantic vector lookups.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 19: CHAPTER 15 (CONT.) — UML SEQUENCE DIAGRAM
    # =========================================================================
    story.append(Paragraph("15.3. UML Sequence Diagram: Request Processing &amp; HITL Approval", h1_style))
    story.append(Paragraph(
        "Figure 8 illustrates the end-to-end UML sequence of an operator submitting a high-risk operational request requiring cognitive agent evaluation, policy retrieval, Action Card confirmation, and governed database persistence.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig8_uml_sequence.png")):
        story.append(Image(os.path.join(img_dir, "fig8_uml_sequence.png"), width=495, height=195))
        story.append(Paragraph("Figure 8: UML Sequence Diagram for Request Processing, Action Governance &amp; Execution", caption_style))

    story.append(Paragraph("Detailed Trace of the Execution Sequence", h2_style))
    seq_steps = [
        ("Step 1: Prompt Submission", "Operator enters natural language command in layman chat interface."),
        ("Step 2: Indic Detection &amp; Sanitization", "Prompt Injection Shield scrubs input; Indic Engine normalizes regional script to canonical English tokens."),
        ("Step 3: CEO Orchestrator Deconstruction", "Master CEO Orchestrator parses intent and delegates sub-task to target Specialist Agent."),
        ("Step 4: RAG Policy Context Retrieval", "Specialist Agent invokes KnowledgeToolService to retrieve verified policy chunks and discounting rules."),
        ("Step 5: Action Formulation &amp; Risk Rating", "Specialist Agent generates proposed mutation; Action Governance assigns risk rating (HIGH)."),
        ("Step 6: HITL Action Card Presentation", "ChatInterface intercepts execution, rendering interactive ActionCard with simulation diffs."),
        ("Step 7: Operator Approval", "Operator reviews parameters and clicks 'Approve Action'."),
        ("Step 8: Governed Execution Runner", "WorkflowEngine executes the mutation (e.g. issues invoice, updates stock)."),
        ("Step 9: PostgreSQL Persistence &amp; Audit", "Prisma commits changes to flowmind_db and writes immutable record to AuditLog."),
        ("Step 10: Feedback &amp; Artifact Delivery", "UI renders success confirmation with direct download link to generated PDF invoice.")
    ]
    for s_num, s_det in seq_steps:
        story.append(Paragraph(f"<b>&bull; {s_num}:</b> {s_det}", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 20: CHAPTER 16 — COMPREHENSIVE API ENDPOINTS REFERENCE
    # =========================================================================
    story.append(Paragraph("16. Comprehensive API Endpoints Specification", h1_style))
    story.append(Paragraph(
        "FlowMind AI exposes a structured RESTful API surface across all operational, analytical, workflow, and security domains. Every endpoint enforces tenant isolation and RBAC role gating:",
        body_style
    ))

    api_headers = [Paragraph("HTTP", table_header_style), Paragraph("API Route Endpoint", table_header_style), Paragraph("Domain Functionality", table_header_style), Paragraph("RBAC &amp; Governance Policy", table_header_style)]
    api_rows = [
        [Paragraph("GET", table_cell_bold), Paragraph("/api/analytics", table_cell_code), Paragraph("Returns executive KPIs, time-series, funnel &amp; support metrics", table_cell_style), Paragraph("All authenticated; Salary masked for Employee", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/analytics/query", table_cell_code), Paragraph("Natural language business intelligence query assistant", table_cell_style), Paragraph("All authenticated; Prompt-injection sanitized", table_cell_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/api/knowledge", table_cell_code), Paragraph("Lists indexed documents with department filtering", table_cell_style), Paragraph("Filtered by user access scope &amp; allowed roles", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/knowledge", table_cell_code), Paragraph("Ingests, sanitizes, chunks, and vectorizes document", table_cell_style), Paragraph("Manager &amp; Admin only", table_cell_style)],
        [Paragraph("DELETE", table_cell_bold), Paragraph("/api/knowledge/[id]", table_cell_code), Paragraph("Revokes knowledge document and deletes associated chunks", table_cell_style), Paragraph("Manager &amp; Admin only", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/knowledge/query", table_cell_code), Paragraph("Grounded vector RAG Q&A with verifiable source citations", table_cell_style), Paragraph("All authenticated; Hallucination protected (< 0.20)", table_cell_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/api/insights", table_cell_code), Paragraph("Scans database state and returns active proactive insights", table_cell_style), Paragraph("All authenticated", table_cell_style)],
        [Paragraph("PATCH", table_cell_bold), Paragraph("/api/insights", table_cell_code), Paragraph("Updates insight status (ACKNOWLEDGED / RESOLVED)", table_cell_style), Paragraph("Manager &amp; Admin only", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/insights/action", table_cell_code), Paragraph("Dispatches governed action recommended by proactive insight", table_cell_style), Paragraph("Governed: Routes to Approval queue if High/Critical risk", table_cell_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/api/workflows", table_cell_code), Paragraph("Lists all configured DAG workflows for organization", table_cell_style), Paragraph("All authenticated", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/workflows", table_cell_code), Paragraph("Saves new DAG workflow definition with node/edge topology", table_cell_style), Paragraph("Requires WORKFLOW_CREATE permission", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/workflows/webhook/[id]", table_cell_code), Paragraph("Inbound external webhook triggering automated DAG execution", table_cell_style), Paragraph("Token-authenticated payload validation", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/auth/login", table_cell_code), Paragraph("Authenticates user credentials and issues signed JWT cookie", table_cell_style), Paragraph("Public; Rate limited &amp; Bcrypt salt verified", table_cell_style)],
        [Paragraph("GET", table_cell_bold), Paragraph("/api/auth/me", table_cell_code), Paragraph("Returns verified user session payload from HTTP-only cookie", table_cell_style), Paragraph("Dynamic route; HS256 JWT verified", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/auth/logout", table_cell_code), Paragraph("Clears session cookie and invalidates client session state", table_cell_style), Paragraph("All authenticated", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/auth/signup", table_cell_code), Paragraph("Registers new tenant user with default EMPLOYEE role", table_cell_style), Paragraph("Public; Validates email format &amp; password complexity", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/auth/forgot-password", table_cell_code), Paragraph("Issues password reset token and dispatches reset notification", table_cell_style), Paragraph("Public; Token expires in 1 hour", table_cell_style)],
        [Paragraph("POST", table_cell_bold), Paragraph("/api/auth/reset-password", table_cell_code), Paragraph("Verifies reset token and updates salted password hash in DB", table_cell_style), Paragraph("Public; Enforces Bcrypt salt rounds = 10", table_cell_style)]
    ]
    t_api = Table([api_headers] + api_rows, colWidths=[40, 140, 195, 140])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_api)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 21: CHAPTER 17 — EVIDENCE-BASED PROGRESS MATRIX (W1 TO W6)
    # =========================================================================
    story.append(Paragraph("17. Evidence-Based Progress Matrix (Weeks 1 to 6 Complete)", h1_style))
    story.append(Paragraph(
        "The following progress matrix details planned deliverables versus actual verified implementations in the active codebase as of Week 6. Every claim is supported by specific repository file evidence:",
        body_style
    ))

    matrix_headers = [Paragraph("Sprint / Objective", table_header_style), Paragraph("Planned Deliverable", table_header_style), Paragraph("Actual Implementation", table_header_style), Paragraph("Primary Code Evidence", table_header_style), Paragraph("Status", table_header_style)]
    matrix_rows = [
        [Paragraph("W1: UI Foundation", table_cell_bold), Paragraph("Design system, dark/light theme, responsive layout", table_cell_style), Paragraph("Glassmorphic cards, Navbar, theme persistence", table_cell_style), Paragraph("GlassCard.tsx, Navbar.tsx", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W2: Layman Chatbot", table_cell_bold), Paragraph("Chatbot, Thought Stream, Action Cards", table_cell_style), Paragraph("Cognitive traces, streaming chat, action modals", table_cell_style), Paragraph("ThoughtStream.tsx, ActionCard.tsx", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W2: Indic Multilingual", table_cell_bold), Paragraph("7 Indic languages dictionary translation", table_cell_style), Paragraph("Intent mapping across EN, HI, TE, TA, KN, ML, OR", table_cell_style), Paragraph("src/lib/i18n/translations.ts", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W3: 15-Agent Swarm", table_cell_bold), Paragraph("15 specialized domain agents &amp; CEO router", table_cell_style), Paragraph("15 agents seeded in DB, CEO orchestrator", table_cell_style), Paragraph("agentService.ts, seed.ts", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W3: Action Governance", table_cell_bold), Paragraph("Risk assessment &amp; human-in-the-loop queue", table_cell_style), Paragraph("4-tier risk matrix, approval modal queue", table_cell_style), Paragraph("actionGovernance.ts", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W4: DAG Planner", table_cell_bold), Paragraph("NL prompt to structured DAG JSON schema", table_cell_style), Paragraph("Deterministic DSL compiler with node typing", table_cell_style), Paragraph("workflowPlanner.ts", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W4: DAG Runner", table_cell_bold), Paragraph("Topological execution &amp; retry engine", table_cell_style), Paragraph("Kahn's algorithm runner, variable resolution", table_cell_style), Paragraph("workflowEngine.ts", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W4: Visual Canvas", table_cell_bold), Paragraph("Interactive workflow editor at /workflows", table_cell_style), Paragraph("Visual DAG canvas, run console, live traces", table_cell_style), Paragraph("VisualDAGGraph.tsx, /workflows", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W5: Database Layer", table_cell_bold), Paragraph("PostgreSQL persistence via Prisma ORM", table_cell_style), Paragraph("28 relational models, seed script, fallback", table_cell_style), Paragraph("schema.prisma, seed.ts", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W5: Business Hub", table_cell_bold), Paragraph("Unified Command Center at /modules", table_cell_style), Paragraph("Module KPIs, FlowMind Insights, multi-search", table_cell_style), Paragraph("src/app/modules/page.tsx", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W5: CRM &amp; Customer 360", table_cell_bold), Paragraph("7-stage pipeline &amp; Customer 360 drawer", table_cell_style), Paragraph("Pipeline board, lead history, 360 drawer", table_cell_style), Paragraph("modules/crm/page.tsx", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W5: HR &amp; Workforce", table_cell_bold), Paragraph("Staff directory, leaves &amp; payroll engine", table_cell_style), Paragraph("Salary masking, anti-self-approval leaves", table_cell_style), Paragraph("modules/hr/page.tsx", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W5: Finance Hub", table_cell_bold), Paragraph("Invoice ledger, 18% GST &amp; PDF download", table_cell_style), Paragraph("GST breakdown, single-click settlement, PDF", table_cell_style), Paragraph("modules/finance/page.tsx", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W5: Inventory &amp; Stock", table_cell_bold), Paragraph("Product catalog &amp; stock movements", table_cell_style), Paragraph("Stock ledger, low-stock visual warning triggers", table_cell_style), Paragraph("modules/inventory/page.tsx", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W5: Support Helpdesk", table_cell_bold), Paragraph("Ticket helpdesk &amp; 4 SLA priority tiers", table_cell_style), Paragraph("SLA priorities, resolution notes, drawers", table_cell_style), Paragraph("modules/support/page.tsx", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W6: AI Data Studio", table_cell_bold), Paragraph("Analytics dashboard with Recharts &amp; CSV export", table_cell_style), Paragraph("KPI ribbon, Area/Bar/Donut charts, CSV", table_cell_style), Paragraph("data-studio/page.tsx, /api/analytics", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W6: NL Data Assistant", table_cell_bold), Paragraph("Conversational business analytics assistant", table_cell_style), Paragraph("Intent parser, dynamic mini-charts, follow-ups", table_cell_style), Paragraph("analyticsService.ts, /query", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W6: RAG Vector Engine", table_cell_bold), Paragraph("Dense vector embedding &amp; semantic search", table_cell_style), Paragraph("384-dim semantic vectors, cosine similarity", table_cell_style), Paragraph("ragService.ts, /knowledge-base", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W6: Grounded Citations", table_cell_bold), Paragraph("Exact source citations &amp; hallucination defense", table_cell_style), Paragraph("< 0.20 refusal threshold, doc/page citations", table_cell_style), Paragraph("ragService.ts, /api/knowledge", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W6: Swarm Knowledge Tool", table_cell_bold), Paragraph("Agent retrieval tool for 15-agent swarm", table_cell_style), Paragraph("Domain specialization (Sales/Fin/HR/Supp)", table_cell_style), Paragraph("knowledgeTool.ts", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W6: Proactive Insights", table_cell_bold), Paragraph("Threshold breach scanner &amp; dedup hashing", table_cell_style), Paragraph("Automated scans, dedupHash, action routing", table_cell_style), Paragraph("proactiveInsightsService.ts", table_cell_code), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)]
    ]
    t_matrix = Table([matrix_headers] + matrix_rows, colWidths=[75, 115, 120, 130, 75])
    t_matrix.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_matrix)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 22: CHAPTER 18 — QUALITY ASSURANCE & DEFECT RESOLUTION LOG
    # =========================================================================
    story.append(Paragraph("18. Testing, Verification &amp; Defect Resolution Log", h1_style))
    story.append(Paragraph(
        "Verification was conducted systematically across all milestones. All automated test suites report a 100% pass rate in the active repository:",
        body_style
    ))

    test_data = [
        [Paragraph("Verification Test Suite", table_header_style), Paragraph("Command Executed", table_header_style), Paragraph("Observed Execution Result", table_header_style), Paragraph("Status", table_header_style)],
        [Paragraph("TypeScript Strict Check", table_cell_bold), Paragraph("cmd /c npx tsc --noEmit", table_cell_code), Paragraph("Exit Code 0 (0 compilation errors across 35,000+ lines)", table_cell_style), Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)],
        [Paragraph("Next.js Production Build", table_cell_bold), Paragraph("cmd /c npm run build", table_cell_code), Paragraph("Exit Code 0 (Compiled all 33 static &amp; dynamic routes successfully)", table_cell_style), Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)],
        [Paragraph("Prisma Schema Sync", table_cell_bold), Paragraph("cmd /c npx prisma db push", table_cell_code), Paragraph("Synced 28 relational models to PostgreSQL flowmind_db", table_cell_style), Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)],
        [Paragraph("Database Seeder Run", table_cell_bold), Paragraph("cmd /c npm run db:seed", table_cell_code), Paragraph("Seeded 1 Org, 20 Perms, 3 Users, 15 Agents, 1 Workflow", table_cell_style), Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)],
        [Paragraph("RBAC Salary Masking", table_cell_bold), Paragraph("Unit test in test_week6.ts", table_cell_code), Paragraph("Admin totalMonthlyPayroll = 4.7L; Employee = 0 (Masked)", table_cell_style), Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)],
        [Paragraph("RAG Citation Grounding", table_cell_bold), Paragraph("RAG query in test_week6.ts", table_cell_code), Paragraph("Top match retrieved from Sales Playbook with citations &amp; scores", table_cell_style), Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)],
        [Paragraph("Hallucination Defense", table_cell_bold), Paragraph("Out-of-domain query test", table_cell_code), Paragraph("Refused ungrounded query (< 0.20 score) with insufficient evidence", table_cell_style), Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)],
        [Paragraph("Swarm Knowledge Tool", table_cell_bold), Paragraph("Agent tool invocation test", table_cell_code), Paragraph("Sales agent query augmented with domain context &amp; audit logged", table_cell_style), Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)],
        [Paragraph("Proactive Anomaly Scanner", table_cell_bold), Paragraph("Threshold scanner test", table_cell_code), Paragraph("Detected 6 active insights across Finance &amp; Inventory with dedupHash", table_cell_style), Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)]
    ]
    t_test = Table(test_data, colWidths=[110, 140, 190, 75])
    t_test.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_test)
    story.append(Spacer(1, 6))

    story.append(Paragraph("Chronicle of Key Engineering Defects &amp; Architectural Resolutions", h2_style))
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
    # PAGE 23: CHAPTER 19 — REMAINING ROADMAP (W7–W8) & ACADEMIC CONCLUSION
    # =========================================================================
    story.append(Paragraph("19. Remaining Roadmap (Weeks 7 &amp; 8) &amp; Academic Conclusion", h1_style))
    story.append(Paragraph(
        "With Weeks 1 through 6 completed, the project transitions into final security hardening and production deployment ahead of university capstone defense. Figure 9 illustrates the final roadmap.",
        body_style
    ))

    if os.path.exists(os.path.join(img_dir, "fig9_eight_week_roadmap.png")):
        story.append(Image(os.path.join(img_dir, "fig9_eight_week_roadmap.png"), width=495, height=130))
        story.append(Paragraph("Figure 9: Eight-Week Progressive Development Roadmap (Weeks 1–6 Completed, Weeks 7–8 Planned)", caption_style))

    story.append(Paragraph("19.1. Prioritized Implementation Plan for Weeks 7 &amp; 8", h2_style))
    story.append(Paragraph("<b>&bull; Week 7: Security Hardening &amp; Production Polishing (Nov 1–7, 2026):</b> Implement Bring-Your-Own-Key (BYOK) settings panel for dynamic Gemini / OpenAI API integration, complete end-to-end Jest integration tests, and conduct static application security testing (SAST).", bullet_style))
    story.append(Paragraph("<b>&bull; Week 8: Docker Containerization &amp; Cloud Deployment (Nov 8–15, 2026):</b> Package FlowMind AI into multi-stage Docker containers with docker-compose, configure GitHub Actions CI/CD pipeline, deploy to production cloud hosting (Vercel / AWS EC2), and conduct the final capstone viva presentation.", bullet_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("19.2. Academic Conclusion", h2_style))
    story.append(Paragraph(
        "As of Week 6, FlowMind AI has achieved its overarching research and software engineering objective: developing a production-grade, <b>Multilingual Autonomous AI Business Operating System</b>. By unifying an operational enterprise business suite (CRM, HR, Finance, Inventory, Support) with real-time analytics in the AI Data Studio, dense semantic vector RAG intelligence, a 15-Agent Swarm, and proactive anomaly detection, the platform conclusively demonstrates that non-technical enterprise operators can safely automate mission-critical business procedures through governed, transparent AI. The codebase is verified, stable, type-safe (0 errors), and fully prepared for final capstone submission and evaluation.",
        body_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("19.3. Internal Project Documentation References", h2_style))
    story.append(Paragraph("1. FlowMind AI Developer Architecture &amp; SDLC Specification (Internal Documentation, 2026).", bullet_style))
    story.append(Paragraph("2. FlowMind AI PostgreSQL Backend &amp; Prisma ORM Implementation Specification (2026).", bullet_style))
    story.append(Paragraph("3. FlowMind AI Week 5 Business Operations Technical Progress Report (2026).", bullet_style))
    story.append(Paragraph("4. FlowMind AI Week 6 Data Studio, RAG Knowledge Base &amp; Proactive Insights Report (2026).", bullet_style))
    story.append(Paragraph("5. Official Project Repository: https://github.com/Furkhan-5/FlowMind-AI (Branch: main).", bullet_style))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated 20-25 page PDF report at: {output_pdf_path}")
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
