import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from build_report_docx import (
    set_cell_background, set_cell_margins, add_heading_1, add_heading_2,
    add_heading_3, add_body_p, add_callout_box, add_styled_table, add_figure_image
)

def create_document():
    doc = Document()
    
    # Page setup - A4 with 1 inch margins
    sections = doc.sections
    for s in sections:
        s.page_width = Inches(8.27)
        s.page_height = Inches(11.69)
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
        
        # Footer
        footer = s.footer
        f_p = footer.paragraphs[0]
        f_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        f_run = f_p.add_run("FLOWMIND AI — CAPSTONE PROJECT | INTERIM 8-WEEK PROGRESS REPORT")
        f_run.font.name = 'Calibri'
        f_run.font.size = Pt(8.5)
        f_run.font.color.rgb = RGBColor(148, 163, 184)

    img_dir = r"c:\Capstone\report_diagrams"

    # =========================================================================
    # PAGE 1: COVER PAGE
    # =========================================================================
    p_cov_space = doc.add_paragraph()
    p_cov_space.paragraph_format.space_before = Pt(20)

    p_proj_rpt = doc.add_paragraph()
    p_proj_rpt.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_rpt = p_proj_rpt.add_run("PROJECT REPORT")
    r_rpt.font.name = 'Calibri'
    r_rpt.font.size = Pt(14)
    r_rpt.font.bold = True
    r_rpt.font.color.rgb = RGBColor(100, 116, 139)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(10)
    p_title.paragraph_format.space_after = Pt(15)
    r_title = p_title.add_run("FLOWMIND AI")
    r_title.font.name = 'Calibri'
    r_title.font.size = Pt(32)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(27, 54, 93)

    p_div = doc.add_paragraph()
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_div.paragraph_format.space_after = Pt(20)
    r_div = p_div.add_run("―" * 32)
    r_div.font.color.rgb = RGBColor(99, 102, 241)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(8)
    r_sub = p_sub.add_run("An Interim 8-Week Progress Report")
    r_sub.font.name = 'Calibri'
    r_sub.font.size = Pt(14)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(15, 23, 42)

    p_req = doc.add_paragraph()
    p_req.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_req.paragraph_format.space_after = Pt(30)
    r_req = p_req.add_run("Submitted in partial fulfillment of the requirements for the Capstone Project")
    r_req.font.name = 'Calibri'
    r_req.font.size = Pt(11)
    r_req.font.italic = True
    r_req.font.color.rgb = RGBColor(71, 85, 105)

    team_headers = ["Team Member Name", "Registration Number", "Project Domain Role"]
    team_data = [
        ["Furkhan Abdul Raheem", "23BCE7868", "AI & Multilingual Lead"],
        ["Aniket Sahu", "23BCE7881", "Frontend & Layman UI/UX Lead"],
        ["Anjali Karagatla", "23BCE8077", "Workflow & Business Engine Lead"],
        ["Farukh", "23BCE20345", "Data, RAG & Security Lead"],
    ]
    add_styled_table(doc, team_headers, team_data, col_widths=[2.4, 1.6, 2.2], title="PROJECT TEAM MEMBERS")

    meta_headers = ["Academic Field", "Details"]
    meta_data = [
        ["Course & Semester", "Capstone Project | Semester VII"],
        ["Academic Department", "Department of Computer Science and Engineering"],
        ["Institution", "VIT-AP University"],
        ["Target Field", "Artificial Intelligence, Multi-Agent Systems & Enterprise Software Engineering"],
        ["Project Scope", "Weeks 1–5 COMPLETED IMPLEMENTATION (INTEGRATED BUSINESS OPERATIONS SUITE: CRM, HR, FINANCE, INVENTORY, SUPPORT & POSTGRESQL 22-MODEL LAYER)"],
    ]
    add_styled_table(doc, meta_headers, meta_data, col_widths=[2.2, 4.0], title="INSTITUTIONAL METADATA")

    # Callout Box
    add_callout_box(
        doc,
        "This Interim Progress Report documents the complete architectural design and verified implementation of FlowMind AI across Weeks 1 to 5. Key achievements include the 15-Agent Mesh Collaboration, Multilingual Indic Engine (7 languages), Zero-Code Natural Language Workflow DAG Automation Engine, Action Governance (HITL), the fully integrated Enterprise PostgreSQL + Prisma ORM Persistence Layer with 22 Relational Models, and the complete Integrated Business Operations Suite covering CRM, HR (with salary masking & anti-self-approval), Finance (with 18% GST invoicing), Inventory (with stock movements & reorder alerts), and Support (with SLA queue & notes).",
        title="EXECUTIVE CAPSTONE SUMMARY"
    )

    # Page break
    doc.add_page_break()

    # =========================================================================
    # SECTION 1: OVERVIEW & INTRODUCTION
    # =========================================================================
    add_heading_1(doc, "1. Project Overview & Introduction")
    add_body_p(doc, "FlowMind AI is a unified, multilingual AI Business Operating System designed to enable non-technical operational users, small business owners, and non-programmers ('laymen') to automate business workflows, query domain metrics, and govern operational actions using natural language or voice commands.")
    add_body_p(doc, "Modern enterprise platforms often impose steep learning curves, complex UI navigation, and technical scripting requirements across disconnected silos. FlowMind AI resolves these barriers by orchestrating a 15-Agent Mesh, an Indic Multilingual Engine, a zero-code Workflow Automation DAG Engine, a robust PostgreSQL relational persistence layer with 22 models, and an integrated Business Operations Suite spanning CRM, HR, Finance, Inventory, and Support.")

    # =========================================================================
    # SECTION 2: PROBLEM STATEMENT
    # =========================================================================
    add_heading_1(doc, "2. Problem Statement")
    add_body_p(doc, "Enterprise operational tools suffer from critical usability, security, and integration challenges:")
    add_body_p(doc, "Non-technical domain experts struggle to configure complex enterprise software, leading to operational friction and slow turnaround times.", bold_prefix="1. High Technical Complexity: ")
    add_body_p(doc, "Business platforms predominantly target English speakers, creating severe accessibility barriers across regional Indian enterprise ecosystems.", bold_prefix="2. Language & Accessibility Barriers: ")
    add_body_p(doc, "Automated AI systems often lack strict authorization and governance controls, risking unauthorized state changes without human oversight.", bold_prefix="3. Ungoverned Autonomous Execution Risk: ")
    add_body_p(doc, "Traditional systems operate as fragmented silos lacking unified persistence, cross-module context, and structured audit trail capabilities.", bold_prefix="4. Ephemeral Storage & Disconnected Silos: ")

    # =========================================================================
    # SECTION 3: KEY PROJECT OBJECTIVES
    # =========================================================================
    add_heading_1(doc, "3. Key Project Objectives")
    add_body_p(doc, "FlowMind AI satisfies a comprehensive set of technical objectives divided across core modules:")

    add_body_p(doc, "Construct a responsive Layman Chatbot UI featuring an interactive Robot Assistant avatar, live Thought Stream visualizer, and Action Confirmation Cards.", bold_prefix="• Objective 1 (Layman Interface): ")
    add_body_p(doc, "Build an Indic Engine supporting English, Telugu, Hindi, Tamil, Kannada, Malayalam, and Odia with Web Speech STT/TTS voice synthesis.", bold_prefix="• Objective 2 (Multilingual Support): ")
    add_body_p(doc, "Deploy 15 specialized domain agents (CEO, Sales, Finance, HR, Support, Analytics, etc.) coordinated by a Master Orchestrator.", bold_prefix="• Objective 3 (15-Agent Mesh): ")
    add_body_p(doc, "Enforce strict security guardrails via a Prompt Injection Shield and Human-in-the-Loop Action Cards with risk level grading.", bold_prefix="• Objective 4 (Security & Governance): ")
    add_body_p(doc, "Implement a natural language workflow planner that compiles user prompts into valid, executable Directed Acyclic Graphs (DAGs) verified via Kahn's Topological Sort.", bold_prefix="• Objective 5 (NL Workflow Automation): ")
    add_body_p(doc, "Build an Integrated Enterprise Business Operations Suite (CRM, HR, Finance, Inventory, Support) backed by 22 PostgreSQL relational models, Prisma ORM, and 3-Tier RBAC with strict confidential data masking and anti-self-approval governance.", bold_prefix="• Objective 6 (Integrated Business Operations & PostgreSQL Persistence - COMPLETED): ")
    add_body_p(doc, "Deploy the application dynamically on production cloud hosting (Vercel / AWS EC2) with live domain SSL encryption and GitHub Actions CI/CD pipelines.", bold_prefix="• Objective 7 (Dynamic Cloud Deployment Milestone): ")

    # =========================================================================
    # SECTION 4: SYSTEM ARCHITECTURE
    # =========================================================================
    add_heading_1(doc, "4. System Architecture (7-Tier Model)")
    add_body_p(doc, "FlowMind AI implements a modular 7-Tier enterprise system architecture shown in Figure 1 below:")

    add_figure_image(doc, os.path.join(img_dir, "fig1_system_architecture.png"), "Figure 1. High-Level FlowMind AI System Architecture with Integrated PostgreSQL Database Layer")

    add_heading_2(doc, "7-Tier Architectural Description")
    add_body_p(doc, "Next.js 14 App Router, Layman Chatbot UI, Visual Workflow Builder, and Executive Dashboard.", bold_prefix="1. Presentation & UI Layer: ")
    add_body_p(doc, "REST API routes, RBAC permission evaluators, and the Prompt Injection Shield.", bold_prefix="2. API Gateway & Security Layer: ")
    add_body_p(doc, "Indic Engine, Canonical Intent Parser, Master Agent Orchestrator, and Task Memory.", bold_prefix="3. Conversational AI & Orchestration Engine: ")
    add_body_p(doc, "15 specialized domain agents executing CRM, billing, HR, support, and analytics logic.", bold_prefix="4. 15-Specialized AI Agent Mesh: ")
    add_body_p(doc, "Topological DAG runner, condition evaluator, variable resolver, and GST invoice generator.", bold_prefix="5. Business Services & Execution Engines: ")
    add_body_p(doc, "Relational PostgreSQL schema with 13 Prisma models, multi-tenant ORG isolation, 3-tier RBAC, and dual-mode resilient fallback storage.", bold_prefix="6. PostgreSQL Database & Prisma ORM Layer (COMPLETED): ")
    add_body_p(doc, "Node.js production runtime, Vercel/Docker cloud hosting, SSL security, and CI/CD pipelines.", bold_prefix="7. Dynamic Cloud Deployment & Hosting Engine Milestone: ")

    # =========================================================================
    # SECTION 5: END-TO-END DATA FLOW PIPELINE
    # =========================================================================
    add_heading_1(doc, "5. End-to-End Request Processing & Execution Pipeline")
    add_body_p(doc, "Figure 2 details the 10-step request processing pipeline, illustrating how user inputs are safely scanned, parsed, routed, approved, executed, and recorded to PostgreSQL.")

    add_figure_image(doc, os.path.join(img_dir, "fig2_data_flow_pipeline.png"), "Figure 2. End-to-End Request Processing and Execution Pipeline")

    # =========================================================================
    # SECTION 6: WEEK 1 PROGRESS
    # =========================================================================
    add_heading_1(doc, "6. Week 1 Progress — SDLC Architecture, Design System & Foundation Setup")
    add_body_p(doc, "Week 1 established the core project infrastructure, development environment, UI tokens, and architectural schemas.")

    w1_headers = ["Domain Area", "Implemented Deliverables", "Status"]
    w1_data = [
        ["Repository Setup", "Initialized GitHub repository (https://github.com/Furkhan-5/FlowMind-AI) with Git workflow.", "COMPLETED"],
        ["Frontend Architecture", "Configured Next.js 14 App Router, React 18, TypeScript, and Tailwind CSS styling tokens.", "COMPLETED"],
        ["State Management", "Implemented Zustand centralized app store (useAppStore.ts) for user, language, and chat state.", "COMPLETED"],
        ["Schema Scaffolding", "Defined TypeScript interfaces for Agents, Intents, Action Cards, Audit Logs, and User Roles.", "COMPLETED"],
        ["Team Allocation", "Divided project scope into 4 technical lead domains (AI, UI/UX, Workflow, Security/Data).", "COMPLETED"],
    ]
    add_styled_table(doc, w1_headers, w1_data, col_widths=[1.8, 3.8, 1.2], title="Table 1. Week 1 Implementation Summary")

    # =========================================================================
    # SECTION 7: WEEK 2 PROGRESS
    # =========================================================================
    add_heading_1(doc, "7. Week 2 Progress — Multilingual Engine & Layman Chatbot Foundation")
    add_body_p(doc, "Week 2 focused on enabling native multi-script Indic language support and constructing the foundational layman chatbot interface.")

    add_figure_image(doc, os.path.join(img_dir, "fig3_multilingual_flow.png"), "Figure 3. Multilingual Input Processing Flowchart")

    w2_headers = ["Language Code", "Language Name", "Unicode Range / Script", "Speech Synthesis Tag"]
    w2_data = [
        ["en", "English", "Basic Latin (ASCII)", "en-US / en-IN"],
        ["te", "Telugu (తెలుగు)", "0C00–0C7F (Telugu Unicode)", "te-IN"],
        ["hi", "Hindi (हिन्दी)", "0900–097F (Devanagari)", "hi-IN"],
        ["ta", "Tamil (தமிழ்)", "0B80–0BFF (Tamil Unicode)", "ta-IN"],
        ["kn", "Kannada (ಕನ್ನಡ)", "0C80–0CFF (Kannada Unicode)", "kn-IN"],
        ["ml", "Malayalam (മലയാളം)", "0D00–0D7F (Malayalam Unicode)", "ml-IN"],
    ]
    add_styled_table(doc, w2_headers, w2_data, col_widths=[1.2, 1.8, 2.2, 1.6], title="Table 2. Supported Indic Multilingual Specifications")

    # =========================================================================
    # SECTION 8: WEEK 3 PROGRESS
    # =========================================================================
    add_heading_1(doc, "8. Week 3 Progress — 15-Agent Mesh & HITL Governance")
    add_body_p(doc, "Week 3 delivered a 15-agent collaboration mesh, prompt injection defense, and human-in-the-loop Action Cards.")

    add_figure_image(doc, os.path.join(img_dir, "fig4_week3_agent_mesh.png"), "Figure 4. Week 3 Multi-Agent and Human-in-the-Loop Architecture")

    w3_headers = ["Component File", "Technical Responsibility", "Governance / Feature Level", "Status"]
    w3_data = [
        ["agentOrchestrator.ts", "Central intent routing & conversation memory window", "Master Orchestration", "COMPLETED"],
        ["universalAgentRuntime.ts", "Universal runtime engine & recovery handler", "Runtime Execution", "COMPLETED"],
        ["agentRegistry.ts", "15 Agent definitions & multi-script response maps", "Agent Mesh", "COMPLETED"],
        ["promptInjectionShield.ts", "Pattern scanning & prompt injection defense", "CRITICAL Risk Shield", "COMPLETED"],
        ["actionGovernance.ts", "Risk classification (LOW to CRITICAL) & simulation diffs", "Action Governance", "COMPLETED"],
        ["ActionCard.tsx", "Interactive HITL card with Approve/Edit/Cancel buttons", "Human-in-the-Loop", "COMPLETED"],
        ["invoiceGenerator.ts", "Client-side GST tax invoice calculations & PDF download", "Artifact Export", "COMPLETED"],
        ["auditLogger.ts", "Immutable audit log event recorder", "Security & Audit", "COMPLETED"],
    ]
    add_styled_table(doc, w3_headers, w3_data, col_widths=[1.8, 2.6, 1.4, 1.0], title="Table 3. Week 3 Core Component Implementation Map")

    # =========================================================================
    # SECTION 9: WEEK 4 PROGRESS
    # =========================================================================
    add_heading_1(doc, "9. Week 4 Progress — Natural Language Workflow Automation Engine")
    add_body_p(doc, "Week 4 implemented a zero-code Natural Language Workflow Automation Engine compiling user prompts into Directed Acyclic Graphs (DAGs) verified via Kahn's Topological Sort.")

    add_figure_image(doc, os.path.join(img_dir, "fig5_week4_workflow_pipeline.png"), "Figure 5. Natural Language Workflow Automation Pipeline")

    w4_headers = ["Module File", "Algorithm / Methodology", "Key Feature", "Status"]
    w4_data = [
        ["workflowPlanner.ts", "NLP Intent Extraction & Structural Mapping", "NL → DAG JSON Generation", "COMPLETED"],
        ["dagValidator.ts", "Kahn's Topological Sort & Cycle Detection", "DAG Order & Validity Verification", "COMPLETED"],
        ["conditionEvaluator.ts", "Rule-Based Expression Parsing", "Conditional Branching (TRUE/FALSE)", "COMPLETED"],
        ["workflowEngine.ts", "Sequential DAG Topological Execution", "Node Runner & State Manager", "COMPLETED"],
        ["jobQueue.ts", "Exponential Backoff Retry Engine", "Fault Recovery & Retry Policy", "COMPLETED"],
        ["triggerEngine.ts", "Cron & Inbound Webhook Listener", "Automated Trigger Activation", "COMPLETED"],
        ["VisualDAGGraph.tsx", "Interactive Canvas Graph Rendering", "Visual Node & Edge Diagram", "COMPLETED"],
        ["ExecutionRunnerConsole.tsx", "Real-Time Terminal Execution Logging", "Live Monitoring Console", "COMPLETED"],
    ]
    add_styled_table(doc, w4_headers, w4_data, col_widths=[1.8, 2.4, 1.6, 1.0], title="Table 4. Week 4 Workflow Automation Component Specifications")

    # =========================================================================
    # SECTION 9.5: WEEK 5 PROGRESS — INTEGRATED BUSINESS OPERATIONS SUITE & POSTGRESQL PERSISTENCE
    # =========================================================================
    add_heading_1(doc, "9.5. Week 5 Progress — Integrated Enterprise Business Operations Suite & Database Layer")
    add_body_p(doc, "Week 5 achieved a transformative architectural milestone by expanding FlowMind AI from an autonomous workflow engine into a unified, production-grade Enterprise Business Operating System. Rather than isolated CRUD apps, five core enterprise domains—CRM, HR, Finance, Inventory, and Support—are directly integrated with PostgreSQL persistence, the 15-Agent Swarm, and DAG workflows.")

    add_figure_image(doc, os.path.join(img_dir, "fig10_postgresql_database_schema.png"), "Figure 10. Relational Enterprise PostgreSQL Database & Prisma ORM Architecture Diagram (22 Relational Models)")

    add_heading_2(doc, "Core Business Operations Modules Implemented in Week 5")
    add_body_p(doc, "Executive dashboard (/modules) featuring 6 cross-domain operational metrics, data-driven FlowMind Insights, quick operational triggers, and multi-entity global search across leads, staff, invoices, and tickets.", bold_prefix="1. Command Center Hub: ")
    add_body_p(doc, "Visual pipeline board (/modules/crm) with 7 distinct stages (NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST), automated lead scoring (1-100), stage history audit logging, and sliding Customer 360 Drawer.", bold_prefix="2. CRM Suite: ")
    add_body_p(doc, "Staff directory (/modules/hr) with strict service-level salary masking (EMPLOYEE role sees '🔒 Restricted' / 0), leave request submission, leave approval queue with anti-self-approval enforcement, and an on-demand October 2026 payroll engine.", bold_prefix="3. HR & Workforce Hub: ")
    add_body_p(doc, "Invoice ledger (/modules/finance) managing DRAFT, PENDING, APPROVED, SENT, PAID, and OVERDUE states with automatic 18% GST calculation, single-click payment settlement, printable HTML preview, and PDF downloads.", bold_prefix="4. Finance & Billing Hub: ")
    add_body_p(doc, "Hardware SKU catalog (/modules/inventory) tracking quantities, unit prices, and reorder levels. Supports STOCK_IN, STOCK_OUT, and ADJUSTMENT movements with automatic low-stock alert triggers.", bold_prefix="5. Inventory & Warehousing: ")
    add_body_p(doc, "Helpdesk queue (/modules/support) categorized by SLA priorities (LOW, MEDIUM, HIGH, CRITICAL). Operators can create tickets, review details in a slide-out drawer, and log timestamped resolution notes.", bold_prefix="6. Support Helpdesk: ")

    add_heading_2(doc, "Database Persistence, Security & Cross-Module Intelligence")
    add_body_p(doc, "Engineered 12 new relational models (Lead, LeadStageHistory, Employee, LeaveRequest, PayrollRecord, Invoice, InvoiceItem, Payment, Product, StockMovement, SupportTicket, TicketNote), bringing the total relational schema to 22 models with composite indexes on tenant and status fields.", bold_prefix="• 22 Relational Database Models (prisma/schema.prisma): ")
    add_body_p(doc, "Wrapped database queries in silent try-catch blocks with graceful in-memory fallbacks, guaranteeing 100% application uptime during database offline states.", bold_prefix="• Resilient Dual-Layer Persistence (businessService.ts): ")
    add_body_p(doc, "Mutations (lead.created, invoice.paid, stock.low, leave.approved) automatically dispatch events via emitBusinessEvent() to trigger DAG workflows.", bold_prefix="• Event-Driven Workflow Bridge: ")
    add_body_p(doc, "Enforced 3-tier permissions across ADMIN, MANAGER, and EMPLOYEE tiers with anti-self-approval rules and salary masking.", bold_prefix="• 3-Tier RBAC & Governance: ")
    add_body_p(doc, "Customer 360 correlates active leads, invoices, tickets, and AI risk summaries; Employee 360 correlates staff profiles, leaves, and payroll records.", bold_prefix="• Customer 360 & Employee 360 Aggregations: ")

    w5_headers = ["Module Route / File", "Architectural Domain", "Key Implemented Feature", "Status"]
    w5_data = [
        ["/modules (page.tsx)", "Command Center Hub", "6 KPI Metrics, Real AI Insights, Global Multi-Entity Search", "COMPLETED"],
        ["/modules/crm (page.tsx)", "CRM Sales Pipeline", "7-Stage Pipeline Board, Lead Scores, Customer 360 Drawer", "COMPLETED"],
        ["/modules/hr (page.tsx)", "HR & Workforce", "Staff Directory, Salary Masking, Anti-Self-Approval Leave, Payroll", "COMPLETED"],
        ["/modules/finance (page.tsx)", "Finance & Invoicing", "Invoice Ledger, 18% GST Engine, Printable HTML & Client PDF", "COMPLETED"],
        ["/modules/inventory (page.tsx)", "Inventory & Stock", "Hardware Catalog, Movements (IN/OUT/ADJ), Low-Stock Alerts", "COMPLETED"],
        ["/modules/support (page.tsx)", "Customer Support", "SLA Priority Queue (LOW-CRITICAL), Notes, Resolution Drawer", "COMPLETED"],
        ["businessService.ts", "Business Repository", "30+ Typed Methods, Hybrid Offline Fallback, Event Bridge", "COMPLETED"],
        ["schema.prisma", "PostgreSQL Persistence", "22 Relational Models, Multi-Tenant Isolation, Composite Indexes", "COMPLETED"],
        ["rbacService.ts", "Security & RBAC Guard", "3-Tier RBAC Matrix, Salary Masking, Anti-Self-Approval Check", "COMPLETED"],
        ["seed.ts", "Database Seeding Script", "Seeds ORG-01, 3 Users, 15 Swarm Agents, & Initial DAG Workflow", "COMPLETED"],
    ]
    add_styled_table(doc, w5_headers, w5_data, col_widths=[1.7, 1.8, 2.7, 1.0], title="Table 4.5. Week 5 Integrated Business Operations Suite Specifications")

    # =========================================================================
    # SECTION 10: UML DIAGRAMS & SYSTEM MODELING
    # =========================================================================
    add_heading_1(doc, "10. UML Diagrams & System Modeling")
    add_body_p(doc, "To provide formal academic software engineering documentation, the FlowMind AI platform is modeled below using UML Use Case, Component, and Sequence diagrams.")

    add_figure_image(doc, os.path.join(img_dir, "fig6_uml_use_case.png"), "Figure 6. UML Use Case Diagram for FlowMind AI Platform")
    add_figure_image(doc, os.path.join(img_dir, "fig7_uml_component.png"), "Figure 7. UML Component Diagram")
    add_figure_image(doc, os.path.join(img_dir, "fig8_uml_sequence.png"), "Figure 8. UML Sequence Diagram for Request Processing and Approval")

    # =========================================================================
    # SECTION 11: TECHNICAL AI/ML & SOFTWARE ENGINEERING METHODS
    # =========================================================================
    add_heading_1(doc, "11. Technical AI/ML & Software Engineering Methods")
    add_body_p(doc, "FlowMind AI combines artificial intelligence methodologies with rigorous software engineering algorithms to ensure platform stability, security, and predictability.")

    w_ai_headers = ["Technical Component", "Category Method", "Engineering Purpose"]
    w_ai_data = [
        ["Natural Language → DAG", "Generative AI / LLM Abstraction", "Converts plain text instructions into structured DAG JSON specifications."],
        ["Canonical Intent Parsing", "NLP Script & Keyword Matching", "Identifies operational actions across 7 Indic language scripts."],
        ["Multi-Agent Routing", "Agentic AI / Orchestration", "Routes parsed intents to specialized domain agents (Sales, Finance, HR, etc.)."],
        ["Topological Sorting", "Algorithmic (Kahn's Algorithm)", "Computes linear node execution order for complex workflow DAGs."],
        ["Cycle Detection", "Algorithmic Graph Theory", "Detects circular dependencies in DAG definitions to prevent infinite loops."],
        ["PostgreSQL ORM Persistence", "Database Software Engineering", "Provides relational multi-tenant data storage with connection pooling (22 models)."],
        ["3-Tier RBAC & Governance", "Security Engineering", "Enforces granular permission rules, salary masking, and anti-self-approval."],
        ["Prompt Injection Defense", "Security Pattern Matching", "Scans user prompts for adversarial overrides and redacts malicious payloads."],
        ["Audit Logging", "Security Engineering", "Generates immutable records for system compliance and tracking."],
    ]
    add_styled_table(doc, w_ai_headers, w_ai_data, col_widths=[2.0, 2.2, 2.6], title="Table 5. Technical AI/ML and Algorithmic Method Classification")

    # =========================================================================
    # SECTION 12: TECHNOLOGY STACK & CODEBASE STRUCTURE
    # =========================================================================
    add_heading_1(doc, "12. Technology Stack & Codebase Structure")
    add_body_p(doc, "The current implementation relies on a clean TypeScript and Next.js foundation, cleanly distinguishing verified implemented tech stack components from upcoming target server and cloud deployment milestones.")

    tech_headers = ["Architecture Tier", "Technology Stack Specification", "Implementation Milestone Status"]
    tech_data = [
        ["Frontend UI", "React 18, Next.js 14 App Router, TypeScript, Tailwind CSS, Zustand, Lucide Icons", "COMPLETED"],
        ["Business Suite UI", "Command Center (/modules), CRM, HR, Finance, Inventory, Support pages", "COMPLETED"],
        ["Conversational AI", "Universal Agent Runtime, Master Agent Orchestrator, Indic Multilingual Engine, STT/TTS", "COMPLETED"],
        ["Agent Governance", "Prompt Injection Shield, Action Governance Engine, Action Cards, Audit Logger", "COMPLETED"],
        ["Workflow Engine", "Workflow Planner, DAG Validator, Topological Runner, Variable Resolver, Job Queue", "COMPLETED"],
        ["PostgreSQL DB Layer", "PostgreSQL, Prisma ORM, 22 Models, 3-Tier RBAC, Connection Pooling, Seed System", "COMPLETED"],
        ["Export / Artifacts", "GST Invoice Generator, Invoice PDF Exporter, CSV/JSON Artifact Exporters", "COMPLETED"],
        ["Dynamic Cloud Deployment", "Node.js Server Runtime, Vercel / AWS EC2 Hosting, Live SSL Endpoint, GitHub CI/CD", "UPCOMING MILESTONE (NOV)"],
    ]
    add_styled_table(doc, tech_headers, tech_data, col_widths=[1.8, 3.8, 1.2], title="Table 6. Implemented Stack vs Cloud Deployment Milestones")

    # =========================================================================
    # SECTION 13: TESTING, VERIFICATION & RESULTS
    # =========================================================================
    add_heading_1(doc, "13. Testing, Verification & Current Results")
    add_body_p(doc, "System verification was conducted systematically across Weeks 1 through 5. All acceptance tests reported a 100% pass rate in their respective technical progress reports.")

    test_headers = ["Test Suite ID", "Test Description", "Tested Component", "Pass Status"]
    test_data = [
        ["TS-W3-01", "TypeScript strict compilation & Next.js production build verification", "Full Codebase", "PASSED"],
        ["TS-W3-02", "Sales Lead creation & Action Card generation with MEDIUM risk badge", "Sales Agent", "PASSED"],
        ["TS-W3-03", "Finance GST invoice generation (18% tax) & client-side PDF download", "Finance Agent", "PASSED"],
        ["TS-W3-04", "Prompt injection attack blocking & security audit log recording", "Security Agent", "PASSED"],
        ["TS-W4-01", "Natural Language prompt parsing into structured 7-node DAG JSON", "Workflow Planner", "PASSED"],
        ["TS-W4-02", "Kahn's Topological Sort ordering & circular dependency cycle rejection", "DAG Validator", "PASSED"],
        ["TS-W4-03", "Conditional TRUE/FALSE branch execution & dynamic variable substitution", "Condition Evaluator", "PASSED"],
        ["TS-W5-01", "Prisma schema generation & 22 relational model compilation", "Prisma ORM", "PASSED"],
        ["TS-W5-02", "3-Tier RBAC permission enforcement, salary masking & self-approval check", "rbacService & HR", "PASSED"],
        ["TS-W5-03", "PostgreSQL database seeding (1 Org, 3 Users, 20 Perms, 15 Agents, 1 DAG)", "seed.ts", "PASSED"],
        ["TS-W5-04", "Next.js production build across 25 routes (npm run build)", "Next.js 14 Build", "PASSED"],
        ["TS-W5-05", "Live PostgreSQL connection verification on localhost:5432", "scratch/verifyDb.ts", "PASSED"],
    ]
    add_styled_table(doc, test_headers, test_data, col_widths=[1.4, 2.8, 1.6, 1.0], title="Table 8. Verified System Testing Results")

    # =========================================================================
    # SECTION 14: CURRENT IMPLEMENTATION STATUS & ROADMAP
    # =========================================================================
    add_heading_1(doc, "14. Current Implementation Status & Achievement Summary")
    add_body_p(doc, "FlowMind AI has completed the first 5 development milestones, establishing a fully functional Layman Chatbot MVP, Natural Language Workflow Engine, PostgreSQL Database Persistence Layer, and Integrated Business Operations Suite.")

    add_figure_image(doc, os.path.join(img_dir, "fig9_eight_week_roadmap.png"), "Figure 9. Eight-Week FlowMind AI Progressive Development Roadmap")

    status_headers = ["Phase / Week", "Milestone Title", "Progress Focus", "Current Status"]
    status_data = [
        ["Week 1", "SDLC & Design Tokens", "Project scaffolding, Next.js 14, TypeScript setup", "COMPLETED"],
        ["Week 2", "Multilingual Chatbot", "Indic Engine (7 languages), STT/TTS voice integration", "COMPLETED"],
        ["Week 3", "15-Agent Mesh & HITL", "Master Orchestrator, Action Cards, Security Shield, Audit", "COMPLETED"],
        ["Week 4", "NL Workflow Engine", "NL-to-DAG, Topological Runner, Visual Graph, Webhooks", "COMPLETED"],
        ["Week 5", "Business Suite & DB", "CRM, HR, Finance, Inventory, Support + 22 PostgreSQL Models", "COMPLETED"],
        ["Week 6", "Data Studio & RAG", "AI Data Analyst, CSV/PDF cleaner, Vector RAG Hub", "PLANNED (OCT)"],
        ["Week 7", "Proactive AI & Security", "Proactive anomaly engine, RBAC hardening, API encryption", "PLANNED (NOV)"],
        ["Week 8", "Dynamic Cloud Hosting", "Live cloud deployment (Vercel/AWS), CI/CD, final demo packaging", "PLANNED (NOV)"],
    ]
    add_styled_table(doc, status_headers, status_data, col_widths=[1.2, 1.8, 2.8, 1.0], title="Table 9. Overall 8-Week Development Progress Matrix")

    # =========================================================================
    # SECTION 15: WEEKS 6–8 PLANNED DEVELOPMENT ROADMAP
    # =========================================================================
    add_heading_1(doc, "15. Weeks 6–8 Planned Development Roadmap & November Completion Plan")
    add_body_p(doc, "The remaining three weeks of project development focus on integrating AI Data Studio tools, deploying the application dynamically on production cloud servers, and polishing enterprise modules ahead of final submission in November.")

    nov_headers = ["Priority Level", "Target Module", "Planned Implementation Deliverable", "Target Date"]
    nov_data = [
        ["Priority 1", "Data Studio & RAG", "Dataset auto-cleaner, chart recommender, vector RAG Q&A", "Late October"],
        ["Priority 2", "Dynamic Cloud Deployment", "Vercel / AWS EC2 server deployment & CI/CD pipeline", "Early November"],
        ["Priority 3", "Proactive AI & Security", "Background anomaly scanner, API secret encryption", "Early November"],
        ["Priority 4", "Final Integration", "Live domain verification, system testing, & presentation packaging", "Mid November"],
    ]
    add_styled_table(doc, nov_headers, nov_data, col_widths=[1.3, 1.7, 2.8, 1.0], title="Table 10. November Completion Strategy and Milestones")

    # =========================================================================
    # SECTION 16: CHALLENGES & RISK MITIGATION
    # =========================================================================
    add_heading_1(doc, "16. Challenges, Current Limitations & Risk Mitigation")
    add_body_p(doc, "1. Database Resilience & Silent Logging: Managed via dual-mode service fallbacks in businessService.ts and userService.ts plus silencing Prisma connection error logs (log: [] in prisma.ts) so the terminal and UI operate seamlessly even if local PostgreSQL is offline.")
    add_body_p(doc, "2. Self-Approval Security Risk: Prevented by enforcing strict RBAC checks in approvalService.ts and businessService.ts, blocking managers from self-approving their own leave requests.")
    add_body_p(doc, "3. Next.js Static Prerender Bailout: Resolved by encapsulating useSearchParams() in /reset-password inside a React Suspense boundary.")
    add_body_p(doc, "4. Dynamic Route Cookie Access: Resolved by enforcing 'export const dynamic = force-dynamic' on /api/auth/me to prevent Next.js build-time static evaluation errors.")
    add_body_p(doc, "5. Sensitive HR Data Masking: Protected by programmatic service-level salary masking, ensuring non-admin roles (EMPLOYEE) receive '🔒 Restricted' / 0 compensation data.")

    # =========================================================================
    # SECTION 17: TEAM RESPONSIBILITY & ALLOCATION
    # =========================================================================
    add_heading_1(doc, "17. Team Responsibility & Domain Allocations")
    team_alloc_headers = ["Team Member", "Reg Number", "Domain Responsibility", "Primary Contributions"]
    team_alloc_data = [
        ["Furkhan Abdul Raheem", "23BCE7868", "AI & Multilingual Lead", "Master Orchestrator, 15-Agent Mesh, Universal Runtime, Indic Engine, Prompt Injection Shield."],
        ["Aniket Sahu", "23BCE7881", "Frontend & UI/UX Lead", "Layman Chatbot UI, Thought Stream, Action Cards, Robot Assistant, Tailwind Design Tokens."],
        ["Anjali Karagatla", "23BCE8077", "Workflow Engine Lead", "Workflow Planner, DAG Validator, Topological Runner, Visual DAG Graph, Execution Console."],
        ["Farukh", "23BCE20345", "Data & Security Lead", "PostgreSQL Database Layer, Prisma ORM (22 Models), 3-Tier RBAC, Audit Logger, Artifact Manager."],
    ]
    add_styled_table(doc, team_alloc_headers, team_alloc_data, col_widths=[1.5, 1.1, 1.5, 2.7], title="Table 11. Team Domain Allocation and Responsibilities")

    # =========================================================================
    # SECTION 18 & 19: CONCLUSION & REFERENCES
    # =========================================================================
    add_heading_1(doc, "18. Conclusion & Future Scope")
    add_body_p(doc, "The interim 8-week progress report for FlowMind AI demonstrates significant software engineering achievements across Weeks 1 through 5, establishing a production-grade PostgreSQL persistence layer (22 relational models), an Integrated Business Operations Suite (CRM, HR, Finance, Inventory, Support), a 15-agent collaboration mesh, an Indic multilingual engine, and a zero-code DAG workflow automation platform. All deliverables are verified with 0 TypeScript compilation errors and clean production builds across all 25 application routes.")

    add_heading_1(doc, "19. References & Internal Project Documentation")
    add_body_p(doc, "1. FlowMind AI Developer Architecture & SDLC Specification (Internal Documentation, 2026).")
    add_body_p(doc, "2. FlowMind AI PostgreSQL Backend & Prisma ORM Implementation Specification (2026).")
    add_body_p(doc, "3. FlowMind AI Week 5 Business Operations Technical Progress Report (2026).")
    add_body_p(doc, "4. Official Project Repository: https://github.com/Furkhan-5/FlowMind-AI.")

    # Save final document
    output_docx_path = r"c:\Capstone\FlowMind_AI_8_Week_Project_Progress_Report.docx"
    doc.save(output_docx_path)
    print(f"Report document successfully updated at: {output_docx_path}")
    return output_docx_path

if __name__ == "__main__":
    create_document()
