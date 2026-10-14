import os
import sys
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
            return  # Skip cover page

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Running Header
        self.drawString(45, 805, "FLOWMIND AI — CAPSTONE IMPLEMENTATION PROGRESS REPORT | WEEKS 1–5")
        self.drawRightString(550, 805, "VIT-AP UNIVERSITY")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(45, 798, 550, 798)

        # Running Footer
        self.line(45, 38, 550, 38)
        self.drawString(45, 26, "Department of Computer Science & Engineering — Academic Year 2026")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(550, 26, page_str)
        self.restoreState()


# =========================================================================
# HELPER FUNCTIONS FOR REPORT GENERATION
# =========================================================================
def create_pdf_report(output_pdf_path):
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=A4,
        leftMargin=45,
        rightMargin=45,
        topMargin=52,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=30,
        leading=36,
        textColor=colors.HexColor('#1B365D'),
        alignment=1, # Center
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=18,
        textColor=colors.HexColor('#4F46E5'),
        alignment=1,
        spaceAfter=14
    )

    cover_meta = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#1B365D'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1E293B'),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'Callout_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1E1B4B')
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=0
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1E293B')
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )

    caption_style = ParagraphStyle(
        'CaptionStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#475569'),
        alignment=1,
        spaceBefore=4,
        spaceAfter=8
    )

    story = []

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 20))
    story.append(Paragraph("PROJECT PROGRESS REPORT — WEEKS 1 TO 5", ParagraphStyle('Badge', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=colors.HexColor('#6366F1'), alignment=1)))
    story.append(Spacer(1, 10))
    story.append(Paragraph("FLOWMIND AI", title_style))
    story.append(Paragraph("Multilingual Autonomous AI Business Operating System &amp; DAG Workflow Suite", subtitle_style))
    story.append(Paragraph("Integrated Enterprise Business Operations (CRM + HR + Finance + Inventory + Support)<br/>PostgreSQL Persistence Layer &bull; 15-Agent Swarm Mesh &bull; 3-Tier RBAC &bull; Action Governance", cover_meta))
    story.append(Spacer(1, 15))

    story.append(HRFlowable(width="80%", thickness=1.5, color=colors.HexColor("#4F46E5"), spaceAfter=18, spaceBefore=4))

    # Academic Meta Table
    acad_data = [
        [Paragraph("<b>Academic Degree &amp; Program:</b>", table_cell_bold), Paragraph("B.Tech in Computer Science &amp; Engineering (Final Year Capstone Project)", table_cell_style)],
        [Paragraph("<b>Course Code &amp; Academic Term:</b>", table_cell_bold), Paragraph("Capstone Project / Semester VII (Academic Year 2026)", table_cell_style)],
        [Paragraph("<b>Department &amp; Institution:</b>", table_cell_bold), Paragraph("Department of Computer Science &amp; Engineering, SCOPE, VIT-AP University", table_cell_style)],
        [Paragraph("<b>Evaluation Milestone:</b>", table_cell_bold), Paragraph("Week 5 Complete Implementation &amp; Database Integration Review", table_cell_style)],
        [Paragraph("<b>Date of Evaluation:</b>", table_cell_bold), Paragraph("October 2026 | Amaravati, Andhra Pradesh, India", table_cell_style)],
        [Paragraph("<b>Official Repository:</b>", table_cell_bold), Paragraph("https://github.com/Furkhan-5/FlowMind-AI (Branch: main)", table_cell_style)]
    ]
    t_acad = Table(acad_data, colWidths=[160, 345])
    t_acad.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_acad)
    story.append(Spacer(1, 15))

    # Team Members Table
    team_headers = [Paragraph("Team Member Name", table_header_style), Paragraph("Registration No", table_header_style), Paragraph("Project Domain Role", table_header_style), Paragraph("Primary Architectural Contributions", table_header_style)]
    team_rows = [
        [Paragraph("<b>Furkhan Abdul Raheem</b>", table_cell_bold), Paragraph("23BCE7868", table_cell_style), Paragraph("AI Lead &amp; Systems Architect", table_cell_style), Paragraph("Master CEO Orchestrator, 15-Agent Swarm Mesh, Universal Runtime, Indic Engine, Prompt Injection Shield.", table_cell_style)],
        [Paragraph("<b>Aniket Sahu</b>", table_cell_bold), Paragraph("23BCE7881", table_cell_style), Paragraph("Frontend &amp; Layman UX Lead", table_cell_style), Paragraph("Futuristic Design System, Layman Accessible Chatbot, Thought Stream, Action Cards, Responsive Layouts.", table_cell_style)],
        [Paragraph("<b>Anjali Karagatla</b>", table_cell_bold), Paragraph("23BCE8077", table_cell_style), Paragraph("Workflow Engine Lead", table_cell_style), Paragraph("NL-to-DAG Planner, Topological DAG Runner, DAG Visualizer, Execution Console, Event Bridge.", table_cell_style)],
        [Paragraph("<b>Farukh</b>", table_cell_bold), Paragraph("23BCE20345", table_cell_style), Paragraph("Data, Security &amp; RBAC Lead", table_cell_style), Paragraph("PostgreSQL Relational Layer, Prisma ORM Schema, 3-Tier RBAC, Action Governance Risk Evaluator, Audit Logger.", table_cell_style)]
    ]
    t_team = Table([team_headers] + team_rows, colWidths=[110, 75, 110, 210])
    t_team.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_team)
    story.append(Spacer(1, 20))

    # Executive Note Callout
    callout_data = [[Paragraph("<b>DOCUMENT CLASSIFICATION:</b> This report serves as the official university capstone progress submission for FlowMind AI through Week 5. All documented features, metrics, schema models, and tests represent verified implementations in the active repository.", callout_style)]]
    t_callout = Table(callout_data, colWidths=[505])
    t_callout.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EEF2FF')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#6366F1')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_callout)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 2: EXECUTIVE SUMMARY
    # =========================================================================
    story.append(Paragraph("2. Executive Summary", h1_style))
    story.append(Paragraph(
        "Modern enterprise software ecosystems suffer from severe fragmentation. Organizations typically maintain separate, isolated applications for Customer Relationship Management (CRM), Human Resources (HR), Billing &amp; Invoicing, Inventory Warehousing, and Customer Support Helpdesks. Non-technical business operators face steep learning curves, brittle integrations, and an inability to automate cross-functional business procedures across these siloed platforms without dedicated engineering teams.",
        body_style
    ))
    story.append(Paragraph(
        "<b>FlowMind AI</b> addresses this systemic challenge by creating a unified, <b>Multilingual AI Business Operating System</b>. Non-technical operators describe complex goals in natural language (in English or 6 Indic regional languages), and FlowMind AI translates them into deterministic, governed actions executed across an integrated 15-Agent Swarm and a Topological Directed Acyclic Graph (DAG) Workflow Engine.",
        body_style
    ))
    story.append(Paragraph(
        "As of <b>Week 5</b>, FlowMind AI has transitioned from an autonomous workflow engine into a fully integrated enterprise suite comprising five complete business modules: <b>CRM, HR, Finance, Inventory, and Support</b>. Key achievements include:",
        body_style
    ))

    exec_bullets = [
        "<b>Unified Command Center (/modules):</b> Real-time KPI aggregation, data-driven FlowMind Insights, operational triggers, and multi-entity global search querying leads, staff, invoices, and tickets simultaneously.",
        "<b>Enterprise PostgreSQL &amp; Prisma ORM Persistence:</b> 22 relational data models with strict relational constraints, composite query indexing, and an in-memory fallback layer ensuring 100% application uptime during database offline states.",
        "<b>3-Tier Role-Based Access Control (RBAC):</b> Comprehensive role gating across ADMIN, MANAGER, and EMPLOYEE tiers with automatic salary masking and anti-self-approval leave governance.",
        "<b>Event-Driven Workflow Bridge:</b> Mutation events (lead.created, invoice.paid, stock.low, leave.approved) automatically dispatch triggers to the DAG automation engine.",
        "<b>Verified Codebase Quality:</b> Clean TypeScript compilation (0 errors via tsc --noEmit) and clean Next.js production build across all 25 application routes."
    ]
    for b in exec_bullets:
        story.append(Paragraph(f"&bull; {b}", bullet_style))

    story.append(Spacer(1, 8))

    # =========================================================================
    # SECTION 3: TECHNOLOGY STACK & ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("3. Project Overview and Technology Stack", h1_style))
    story.append(Paragraph(
        "FlowMind AI is built as a full-stack Next.js 14 application employing React server and client components, strict TypeScript typing, Tailwind CSS design tokens, and a PostgreSQL relational database accessed via Prisma ORM.",
        body_style
    ))

    stack_headers = [Paragraph("Stack Layer", table_header_style), Paragraph("Technologies", table_header_style), Paragraph("Exact Versions", table_header_style), Paragraph("Architectural Purpose", table_header_style)]
    stack_rows = [
        [Paragraph("Core Framework", table_cell_bold), Paragraph("Next.js (App Router), React", table_cell_style), Paragraph("Next 14.2.35 / React 18.3.1", table_cell_style), Paragraph("SSR, dynamic API route handlers, optimized client-side bundles.", table_cell_style)],
        [Paragraph("Language", table_cell_bold), Paragraph("TypeScript", table_cell_style), Paragraph("TypeScript 5.4.5 (Strict)", table_cell_style), Paragraph("Type-safe interfaces, compile-time safety, domain schema contracts.", table_cell_style)],
        [Paragraph("UI & Styling", table_cell_bold), Paragraph("Tailwind CSS, Lucide Icons, GSAP", table_cell_style), Paragraph("Tailwind 3.4.3 / Lucide 0.368", table_cell_style), Paragraph("Futuristic glassmorphism design tokens, fluid UI animations.", table_cell_style)],
        [Paragraph("3D Visualization", table_cell_bold), Paragraph("Three.js, React Three Fiber", table_cell_style), Paragraph("Three 0.163 / R3F 8.16", table_cell_style), Paragraph("Interactive 3D landing canvas and spatial node network visualizer.", table_cell_style)],
        [Paragraph("Database &amp; ORM", table_cell_bold), Paragraph("PostgreSQL, Prisma ORM", table_cell_style), Paragraph("PostgreSQL 16/18 / Prisma 5.19", table_cell_style), Paragraph("22 relational models, composite indexing, transactional persistence.", table_cell_style)],
        [Paragraph("Auth &amp; RBAC", table_cell_bold), Paragraph("Jose, BcryptJS, HTTP Cookies", table_cell_style), Paragraph("Jose 6.2.12 / BcryptJS 3.0.3", table_cell_style), Paragraph("Signed JWT session tokens, 3-tier RBAC, password salt hashing.", table_cell_style)],
        [Paragraph("State Management", table_cell_bold), Paragraph("Zustand", table_cell_style), Paragraph("Zustand 4.5.2", table_cell_style), Paragraph("Reactive global client stores for active session, toasts, and UI modals.", table_cell_style)]
    ]
    t_stack = Table([stack_headers] + stack_rows, colWidths=[90, 120, 115, 180])
    t_stack.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_stack)
    story.append(Spacer(1, 10))

    # Architecture Image
    img_arch = r"c:\Capstone\report_diagrams\fig1_system_architecture.png"
    if os.path.exists(img_arch):
        story.append(Image(img_arch, width=490, height=190))
        story.append(Paragraph("Figure 1: High-Level FlowMind AI System Architecture with Integrated PostgreSQL Layer", caption_style))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 4 & 5: ORIGINAL OBJECTIVES & WEEKS 1-4 SUMMARY
    # =========================================================================
    story.append(Paragraph("4. Original Project Objectives &amp; Progressive Timeline", h1_style))
    story.append(Paragraph(
        "FlowMind AI is developed across an 8-week structured software engineering plan designed for enterprise rigor and university capstone evaluation:",
        body_style
    ))

    roadmap_img = r"c:\Capstone\report_diagrams\fig9_eight_week_roadmap.png"
    if os.path.exists(roadmap_img):
        story.append(Image(roadmap_img, width=490, height=130))
        story.append(Paragraph("Figure 2: FlowMind AI Eight-Week Progressive Development Roadmap", caption_style))

    story.append(Paragraph("5. Week-by-Week Implementation Summary (Weeks 1 to 4)", h1_style))
    story.append(Paragraph(
        "<b>Week 1 (Foundation &amp; Design System):</b> Configured Next.js 14 App Router, TypeScript strict mode, responsive navigation bar, and futuristic glassmorphic UI components with full dark and light mode persistence.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Week 2 (Layman Chatbot &amp; Indic Engine):</b> Developed the conversational chatbot with Thought Stream visualization, Action Confirmation Cards, and dictionary-based translation mapping queries across English, Hindi, Telugu, Tamil, Kannada, Malayalam, and Odia.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Week 3 (15-Agent Swarm &amp; Action Governance):</b> Architected 15 specialized domain agents routed via the Master CEO Orchestrator; implemented a 4-tier risk classification engine (LOW to CRITICAL) requiring human-in-the-loop approval for high-risk actions, coupled with a prompt injection shield.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Week 4 (Natural Language Workflow Engine):</b> Implemented the zero-code NL-to-DAG planner, Kahn's algorithm topological DAG runner, interactive visual canvas at /workflows, background job queues, and inbound webhook endpoints (/api/workflows/webhook/[workflowId]).",
        body_style
    ))
    story.append(Spacer(1, 6))

    # =========================================================================
    # SECTION 6: IMPLEMENTATION PROGRESS MATRIX
    # =========================================================================
    story.append(Paragraph("6. Implementation Progress Matrix", h1_style))
    story.append(Paragraph(
        "The following matrix details planned deliverables versus actual verified implementations as of Week 5:",
        body_style
    ))

    matrix_headers = [Paragraph("Week / Objective", table_header_style), Paragraph("Planned Deliverable", table_header_style), Paragraph("Actual Implementation", table_header_style), Paragraph("Evidence File", table_header_style), Paragraph("Status", table_header_style)]
    matrix_rows = [
        [Paragraph("W1: UI Foundation", table_cell_bold), Paragraph("Design tokens, dark/light theme, responsive layout", table_cell_style), Paragraph("Glassmorphic cards, Navbar, theme persistence", table_cell_style), Paragraph("GlassCard.tsx, Navbar.tsx", table_cell_style), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W2: Layman Chat", table_cell_bold), Paragraph("Chatbot, Thought Stream, Action Cards", table_cell_style), Paragraph("Streaming chat, cognitive traces, action modals", table_cell_style), Paragraph("ThoughtStream.tsx, ActionCard.tsx", table_cell_style), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W2: Multilingual", table_cell_bold), Paragraph("Indic translation dictionary", table_cell_style), Paragraph("Query detection &amp; translation across 7 Indic languages", table_cell_style), Paragraph("src/lib/i18n/", table_cell_style), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W3: Agent Swarm", table_cell_bold), Paragraph("15 specialized domain agents", table_cell_style), Paragraph("15 agents seeded in DB, CEO router", table_cell_style), Paragraph("agentService.ts, seed.ts", table_cell_style), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W3: Governance", table_cell_bold), Paragraph("Risk assessment &amp; human approval", table_cell_style), Paragraph("4-tier risk rating, approval modal queue", table_cell_style), Paragraph("actionGovernance.ts", table_cell_style), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W4: DAG Planner", table_cell_bold), Paragraph("NL prompt to structured DAG JSON", table_cell_style), Paragraph("Deterministic DSL generator with node typing", table_cell_style), Paragraph("workflowPlanner.ts", table_cell_style), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W4: DAG Runner", table_cell_bold), Paragraph("Topological execution &amp; retries", table_cell_style), Paragraph("Kahn's algorithm runner, variable resolution", table_cell_style), Paragraph("workflowEngine.ts", table_cell_style), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W4: Visual Canvas", table_cell_bold), Paragraph("Interactive workflow editor at /workflows", table_cell_style), Paragraph("Visual DAG graph, node config, run console", table_cell_style), Paragraph("VisualDAGGraph.tsx", table_cell_style), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W5: Database Layer", table_cell_bold), Paragraph("PostgreSQL persistence via Prisma ORM", table_cell_style), Paragraph("22 models, seed script, hybrid fallback", table_cell_style), Paragraph("schema.prisma, seed.ts", table_cell_style), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W5: Business Hub", table_cell_bold), Paragraph("Command Center at /modules", table_cell_style), Paragraph("6 KPIs, FlowMind Insights, multi-search", table_cell_style), Paragraph("modules/page.tsx", table_cell_style), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W5: CRM Suite", table_cell_bold), Paragraph("7-stage pipeline &amp; Customer 360", table_cell_style), Paragraph("Pipeline board, history log, 360 drawer", table_cell_style), Paragraph("modules/crm/page.tsx", table_cell_style), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W5: HR &amp; Workforce", table_cell_bold), Paragraph("Staff directory, leaves &amp; payroll", table_cell_style), Paragraph("Salary masking, leave governance, payroll", table_cell_style), Paragraph("modules/hr/page.tsx", table_cell_style), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W5: Finance Hub", table_cell_bold), Paragraph("Invoice ledger, GST &amp; PDF generation", table_cell_style), Paragraph("18% GST calculation, printable HTML/PDF", table_cell_style), Paragraph("modules/finance/page.tsx", table_cell_style), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W5: Inventory", table_cell_bold), Paragraph("Product catalog &amp; stock movements", table_cell_style), Paragraph("Stock adjustments, low-stock alert triggers", table_cell_style), Paragraph("modules/inventory/page.tsx", table_cell_style), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W5: Support", table_cell_bold), Paragraph("Ticket helpdesk &amp; SLA priority queue", table_cell_style), Paragraph("4 SLA priorities, ticket notes, resolution", table_cell_style), Paragraph("modules/support/page.tsx", table_cell_style), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)],
        [Paragraph("W5: RBAC &amp; Exports", table_cell_bold), Paragraph("3-Tier RBAC &amp; CSV/JSON export", table_cell_style), Paragraph("Role filtering, CSV &amp; JSON downloads", table_cell_style), Paragraph("businessService.ts", table_cell_style), Paragraph("<font color='#059669'><b>COMPLETED</b></font>", table_cell_style)]
    ]
    t_matrix = Table([matrix_headers] + matrix_rows, colWidths=[80, 115, 115, 115, 80])
    t_matrix.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_matrix)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 7: DETAILED WEEK 5 IMPLEMENTATION
    # =========================================================================
    story.append(Paragraph("7. Detailed Week 5 Implementation: Integrated Business Operations Suite", h1_style))
    story.append(Paragraph(
        "Week 5 elevates FlowMind AI into a unified <b>Enterprise Business Operating System</b> by bridging five distinct operational domains directly into PostgreSQL, the 15-Agent Swarm, and DAG workflows.",
        body_style
    ))

    story.append(Paragraph("7.1. Implemented Frontend Routes &amp; Component Capabilities", h2_style))
    fe_items = [
        "<b>Command Center (/modules):</b> Features an executive KPI overview showing total leads, pipeline valuation, active workforce count, outstanding invoices, low-stock SKUs, and open support tickets. Integrates genuine FlowMind AI insights and a global entity search bar.",
        "<b>CRM Module (/modules/crm):</b> Implements a 7-stage interactive pipeline board (NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST). Users can create leads, update stages, view lead scores, and open the sliding Customer 360 Drawer.",
        "<b>HR Module (/modules/hr):</b> Renders the staff directory with strict RBAC salary masking (EMPLOYEE role sees 🔒 Restricted). Features employee creation, leave request submission, manager approval/rejection with anti-self-approval enforcement, and an on-demand Run Payroll engine.",
        "<b>Finance Module (/modules/finance):</b> Manages customer invoices across DRAFT, PENDING, APPROVED, SENT, PAID, and OVERDUE states. Features automatic 18% GST calculation, single-click payment settlement, printable HTML preview, and PDF download.",
        "<b>Inventory Module (/modules/inventory):</b> Tracks hardware catalog with SKU, unit price, and reorder levels. Supports STOCK_IN, STOCK_OUT, and ADJUSTMENT movements, with visual low-stock warning banners.",
        "<b>Support Module (/modules/support):</b> Helpdesk queue categorized by SLA priorities (LOW, MEDIUM, HIGH, CRITICAL). Operators can create tickets, review details in a slide-out drawer, and append resolution notes."
    ]
    for item in fe_items:
        story.append(Paragraph(f"&bull; {item}", bullet_style))

    story.append(Paragraph("7.2. Backend Business Service Architecture (businessService.ts)", h2_style))
    story.append(Paragraph(
        "All business logic is encapsulated in the centralized <code>BusinessService</code> class (35,000+ bytes), offering over 30 type-safe methods. Crucially, the service implements a <b>hybrid resilience pattern</b>: Prisma database calls are wrapped in silent try/catch blocks that automatically fallback to persistent in-memory stores if PostgreSQL is offline.",
        body_style
    ))

    # ER Diagram
    img_db = r"c:\Capstone\report_diagrams\fig10_postgresql_database_schema.png"
    if os.path.exists(img_db):
        story.append(Image(img_db, width=490, height=195))
        story.append(Paragraph("Figure 3: Relational Enterprise PostgreSQL Database &amp; Prisma ORM Schema Diagram", caption_style))

    story.append(Paragraph("7.3. Cross-Module Customer 360 &amp; Employee 360 Intelligence", h2_style))
    story.append(Paragraph(
        "FlowMind AI breaks enterprise silos through unified aggregation views: <b>Customer 360</b> combines a customer's active CRM leads, invoice payment histories, open support tickets, and an automated AI risk summary (e.g. flagging overdue invoices for the Finance Agent). Similarly, <b>Employee 360</b> correlates staff profiles, leave balances, and historical payroll records.",
        body_style
    ))

    story.append(Paragraph("7.4. Role-Based Access Control (RBAC) &amp; Security Shield", h2_style))
    story.append(Paragraph(
        "Security is enforced at both the UI and service layers across three distinct roles:",
        body_style
    ))
    story.append(Paragraph("&bull; <b>ADMIN:</b> Full organization-wide visibility, payroll generation, salary unmasking, and unrestricted data export.", bullet_style))
    story.append(Paragraph("&bull; <b>MANAGER:</b> Departmental staff visibility, CRM pipeline control, and leave request approval rights (strictly forbidden from self-approving their own leave applications).", bullet_style))
    story.append(Paragraph("&bull; <b>EMPLOYEE:</b> Self-service access to assigned leads and tickets; <b>salary and organization-wide payroll numbers are programmatically masked (salary = 0 / 🔒 Restricted)</b>.", bullet_style))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 8 & 9: TESTING, DEFECT RESOLUTION & LIMITATIONS
    # =========================================================================
    story.append(Paragraph("8. Testing, Verification &amp; Quality Results", h1_style))
    story.append(Paragraph(
        "To ensure academic validity, all verification outcomes reflect actual command execution on the FlowMind AI codebase:",
        body_style
    ))

    test_data = [
        [Paragraph("Verification Test", table_header_style), Paragraph("Command Executed", table_header_style), Paragraph("Observed Result", table_header_style), Paragraph("Status", table_header_style)],
        [Paragraph("TypeScript Strict Check", table_cell_bold), Paragraph("cmd /c npx tsc --noEmit", table_cell_style), Paragraph("Exit Code 0 (0 compilation errors across entire src/)", table_cell_style), Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)],
        [Paragraph("Next.js Production Build", table_cell_bold), Paragraph("cmd /c npm run build", table_cell_style), Paragraph("Exit Code 0 (Compiled all 25 static &amp; dynamic routes successfully)", table_cell_style), Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)],
        [Paragraph("Prisma Schema Sync", table_cell_bold), Paragraph("cmd /c npx prisma db push", table_cell_style), Paragraph("Created flowmind_db, synced 22 relational models", table_cell_style), Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)],
        [Paragraph("Database Seeder Run", table_cell_bold), Paragraph("cmd /c npm run db:seed", table_cell_style), Paragraph("Seeded 1 Org, 20 Perms, 3 Users, 15 Agents, 1 Workflow", table_cell_style), Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)],
        [Paragraph("Live DB Connectivity", table_cell_bold), Paragraph("cmd /c npx tsx scratch/verifyDb.ts", table_cell_style), Paragraph("Connected to PostgreSQL 18 on port 5432; confirmed counts", table_cell_style), Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)],
        [Paragraph("Data Security Gating", table_cell_bold), Paragraph("Unit test in businessService.ts", table_cell_style), Paragraph("Verified salary masking for EMPLOYEE role and self-approval block", table_cell_style), Paragraph("<font color='#059669'><b>PASSED</b></font>", table_cell_style)]
    ]
    t_test = Table(test_data, colWidths=[120, 150, 165, 70])
    t_test.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_test)
    story.append(Spacer(1, 10))

    story.append(Paragraph("9. Engineering Challenges &amp; Defect Resolutions", h1_style))
    defects = [
        ("Noisy Prisma Connection Logs During Offline Mode", "When local PostgreSQL was not running, Prisma emitted noisy error stack traces during user authentication.", "Silenced raw Prisma logging in prisma.ts (log: []) and implemented silent catch handlers falling back to in-memory session data."),
        ("Next.js Build Bailout on /reset-password", "useSearchParams() triggered client-side rendering bailout during static page generation in next build.", "Wrapped the form inside a React Suspense boundary with a loading fallback component."),
        ("Dynamic Server Usage on /api/auth/me", "Next.js attempted to render an authentication route reading request cookies as static content.", "Added explicit dynamic directive: export const dynamic = 'force-dynamic'."),
        ("Self-Approval Governance Flaw", "Managers could theoretically approve their own leave applications in HR.", "Added strict programmatic validation in businessService.ts rejecting leave approvals where req.employeeId === approver.id.")
    ]
    for title, problem, solution in defects:
        story.append(Paragraph(f"<b>&bull; {title}:</b> {problem} <i>Resolution:</i> {solution}", bullet_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph("10. Prioritized Next-Week Plan (Week 6)", h1_style))
    story.append(Paragraph(
        "<b>Week 6 Focus: Enterprise Business Intelligence, RAG Knowledge Hub &amp; Cross-Agent Collaboration</b><br/>"
        "1. <b>Visual Analytics Charts:</b> Integrate Recharts for sales pipeline conversion velocity, revenue vs. expense forecasting, and department headcount allocation.<br/>"
        "2. <b>RAG Knowledge Hub:</b> Connect the Knowledge Agent to internal corporate document repositories for semantic context retrieval.<br/>"
        "3. <b>Cross-Agent Autonomous Handoffs:</b> Enable Master CEO Orchestrator to execute complex workflows passing context between Sales, Finance, and Support agents.<br/>"
        "4. <b>Dynamic LLM API Integration:</b> Provide BYOK (Bring Your Own Key) settings panel for live OpenAI / Gemini tool-calling.",
        body_style
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("11. Academic Conclusion", h1_style))
    story.append(Paragraph(
        "As of Week 5, FlowMind AI has achieved its core objective of building a production-grade <b>Integrated Business Operations Suite</b>. By unifying CRM, HR, Finance, Inventory, and Support directly with PostgreSQL persistence, 3-Tier RBAC, and natural language DAG workflows, FlowMind AI establishes a cohesive foundation for autonomous enterprise operations. The project is verified, stable, and on schedule for its Week 6–8 capstone deliverables.",
        body_style
    ))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated full PDF report at: {output_pdf_path}")
    return output_pdf_path

if __name__ == '__main__':
    target_path = r"c:\Capstone\FlowMind_AI_Implementation_Progress_Report.pdf"
    create_pdf_report(target_path)
