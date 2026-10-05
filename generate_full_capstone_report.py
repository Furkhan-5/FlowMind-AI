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
        ["Project Scope", "Weeks 1–5 COMPLETED IMPLEMENTATION (INCL. POSTGRESQL & PRISMA ORM)"],
    ]
    add_styled_table(doc, meta_headers, meta_data, col_widths=[2.2, 4.0], title="INSTITUTIONAL METADATA")

    # Callout Box
    add_callout_box(
        doc,
        "This Interim Progress Report documents the complete architectural design and verified implementation of FlowMind AI across Weeks 1 to 5. Key achievements include the 15-Agent Mesh Collaboration, Multilingual Indic Engine (6 scripts), Zero-Code Natural Language Workflow DAG Automation Engine, Action Governance (HITL), and the fully integrated Enterprise PostgreSQL + Prisma ORM Persistence Layer with 3-Tier RBAC.",
        title="EXECUTIVE CAPSTONE SUMMARY"
    )

    # Page break
    doc.add_page_break()

    # =========================================================================
    # SECTION 1: OVERVIEW & INTRODUCTION
    # =========================================================================
    add_heading_1(doc, "1. Project Overview & Introduction")
    add_body_p(doc, "FlowMind AI is a unified, multilingual AI Business Operating System designed to enable non-technical operational users, small business owners, and non-programmers ('laymen') to automate business workflows, query domain metrics, and govern operational actions using natural language or voice commands.")
    add_body_p(doc, "Modern enterprise platforms often impose steep learning curves, complex UI navigation, and technical scripting requirements. FlowMind AI resolves these barriers by orchestrating a 15-Agent Mesh, an Indic Multilingual Engine supporting 6 language scripts, a zero-code Workflow Automation DAG Engine, and a robust PostgreSQL relational persistence layer.")

    # =========================================================================
    # SECTION 2: PROBLEM STATEMENT
    # =========================================================================
    add_heading_1(doc, "2. Problem Statement")
    add_body_p(doc, "Enterprise operational tools suffer from critical usability, security, and integration challenges:")
    add_body_p(doc, "Non-technical domain experts struggle to configure complex enterprise software, leading to operational friction and slow turnaround times.", bold_prefix="1. High Technical Complexity: ")
    add_body_p(doc, "Business platforms predominantly target English speakers, creating severe accessibility barriers across regional Indian enterprise ecosystems.", bold_prefix="2. Language & Accessibility Barriers: ")
    add_body_p(doc, "Automated AI systems often lack strict authorization and governance controls, risking unauthorized state changes without human oversight.", bold_prefix="3. Ungoverned Autonomous Execution Risk: ")
    add_body_p(doc, "Traditional systems lack structured state persistence, relational multi-tenant isolation, and audit trail capabilities.", bold_prefix="4. Ephemeral Storage & Lack of Audit Trails: ")

    # =========================================================================
    # SECTION 3: KEY PROJECT OBJECTIVES
    # =========================================================================
    add_heading_1(doc, "3. Key Project Objectives")
    add_body_p(doc, "FlowMind AI satisfies a comprehensive set of technical objectives divided across core modules:")

    add_body_p(doc, "Construct a responsive Layman Chatbot UI featuring an interactive Robot Assistant avatar, live Thought Stream visualizer, and Action Confirmation Cards.", bold_prefix="• Objective 1 (Layman Interface): ")
    add_body_p(doc, "Build an Indic Engine supporting English, Telugu, Hindi, Tamil, Kannada, and Malayalam with Web Speech STT/TTS voice synthesis.", bold_prefix="• Objective 2 (Multilingual Support): ")
    add_body_p(doc, "Deploy 15 specialized domain agents (CEO, Sales, Finance, HR, Support, Analytics, etc.) coordinated by a Master Orchestrator.", bold_prefix="• Objective 3 (15-Agent Mesh): ")
    add_body_p(doc, "Enforce strict security guardrails via a Prompt Injection Shield and Human-in-the-Loop Action Cards with risk level grading.", bold_prefix="• Objective 4 (Security & Governance): ")
    add_body_p(doc, "Implement a natural language workflow planner that compiles user prompts into valid, executable Directed Acyclic Graphs (DAGs) verified via Kahn's Topological Sort.", bold_prefix="• Objective 5 (NL Workflow Automation): ")
    add_body_p(doc, "Implement a complete enterprise PostgreSQL database persistence layer backed by Prisma ORM, multi-tenant isolation, and 3-tier Role-Based Access Control (ADMIN, MANAGER, EMPLOYEE).", bold_prefix="• Objective 6 (PostgreSQL & Prisma ORM Layer - COMPLETED): ")
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
    # SECTION 9.5: WEEK 5 PROGRESS — POSTGRESQL DATABASE & PRISMA ORM LAYER
    # =========================================================================
    add_heading_1(doc, "9.5. Week 5 Progress — PostgreSQL Database & Prisma ORM Persistence Architecture")
    add_body_p(doc, "Week 5 achieved a major engineering milestone by transitioning FlowMind AI from prototype in-memory storage into a production-grade PostgreSQL database persistent application managed via Prisma ORM.")

    add_figure_image(doc, os.path.join(img_dir, "fig10_postgresql_database_schema.png"), "Figure 10. Relational Enterprise PostgreSQL Database & Prisma ORM Architecture Diagram")

    add_heading_2(doc, "Key Week 5 Implementation Deliverables")
    add_body_p(doc, "13 enterprise relational models including Organization, Permission, User, Workflow, WorkflowVersion, WorkflowExecution, WorkflowNodeExecution, Agent, AgentTask, ApprovalRequest, AuditLog, Artifact, Conversation, and Message.", bold_prefix="• Prisma Schema Definition (prisma/schema.prisma): ")
    add_body_p(doc, "Centralized 20 granular permission codes mapping ADMIN, MANAGER, and EMPLOYEE roles, featuring strict self-approval prevention (canUserApproveAction).", bold_prefix="• 3-Tier RBAC & Permissions Matrix (rbacService.ts): ")
    add_body_p(doc, "Service layer modules wrapping Prisma queries with fallback mechanisms to guarantee system uptime.", bold_prefix="• Service Repository Layer (userService, workflowService, agentService, approvalService, auditService): ")
    add_body_p(doc, "Pre-configures FlowMind Enterprise (ORG-01), 3 development role users (admin@flowmind.ai, manager@flowmind.ai, employee@flowmind.ai), 15 AI agents, and initial sample DAG workflows.", bold_prefix="• Database Seeding Infrastructure (prisma/seed.ts): ")
    add_body_p(doc, "Updated /api/auth/login, /api/auth/signup, /api/auth/me, /api/workflows, and workflowEngine runner to persist live execution runs.", bold_prefix="• API & Execution Engine Integration: ")

    w5_headers = ["Module File", "Database Model / Layer", "Key Architectural Feature", "Status"]
    w5_data = [
        ["schema.prisma", "13 Relational Prisma Models", "PostgreSQL schema with multi-tenant ORG scope", "COMPLETED"],
        ["prisma.ts", "PrismaClient Singleton", "Connection pooling & hot-reload leak prevention", "COMPLETED"],
        ["rbacService.ts", "20 Permission Codes & RBAC Matrix", "3-Tier RBAC & Self-Approval Prevention Check", "COMPLETED"],
        ["userService.ts", "User & Auth Repository", "bcrypt hashing, JWT session check, user CRUD", "COMPLETED"],
        ["workflowService.ts", "Workflow & Execution DB Store", "DAG definition versioning & run log persistence", "COMPLETED"],
        ["agentService.ts", "Agent & Multilingual Task Log", "Tracks agent tasks, prompts, languages & durations", "COMPLETED"],
        ["approvalService.ts", "Action Governance DB Store", "HITL card requests, approval checks & audit tags", "COMPLETED"],
        ["auditService.ts", "Security Audit Log Repository", "Persistent security event & access log recording", "COMPLETED"],
        ["seed.ts", "Database Seeding Script", "Seeds ORG-01, 3 Users, 15 Agents, & Permissions", "COMPLETED"],
    ]
    add_styled_table(doc, w5_headers, w5_data, col_widths=[1.6, 2.4, 2.2, 1.0], title="Table 4.5. Week 5 PostgreSQL & Prisma ORM Implementation Summary")

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
        ["Canonical Intent Parsing", "NLP Script & Keyword Matching", "Identifies operational actions across 6 Indic language scripts."],
        ["Multi-Agent Routing", "Agentic AI / Orchestration", "Routes parsed intents to specialized domain agents (Sales, Finance, HR, etc.)."],
        ["Topological Sorting", "Algorithmic (Kahn's Algorithm)", "Computes linear node execution order for complex workflow DAGs."],
        ["Cycle Detection", "Algorithmic Graph Theory", "Detects circular dependencies in DAG definitions to prevent infinite loops."],
        ["PostgreSQL ORM Persistence", "Database Software Engineering", "Provides relational multi-tenant data storage with connection pooling."],
        ["3-Tier RBAC & Governance", "Security Engineering", "Enforces granular permission rules and blocks self-approval on high-risk actions."],
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
        ["Conversational AI", "Universal Agent Runtime, Master Agent Orchestrator, Indic Multilingual Engine, STT/TTS", "COMPLETED"],
        ["Agent Governance", "Prompt Injection Shield, Action Governance Engine, Action Cards, Audit Logger", "COMPLETED"],
        ["Workflow Engine", "Workflow Planner, DAG Validator, Topological Runner, Variable Resolver, Job Queue", "COMPLETED"],
        ["PostgreSQL DB Layer", "PostgreSQL, Prisma ORM, 13 Models, 3-Tier RBAC, Connection Pooling, Seed System", "COMPLETED"],
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
        ["TS-W5-01", "Prisma schema generation & 13 relational model verification", "Prisma ORM", "PASSED"],
        ["TS-W5-02", "3-Tier RBAC permission enforcement & self-approval prevention check", "rbacService", "PASSED"],
        ["TS-W5-03", "PostgreSQL service layer persistence & resilient dual-mode fallback check", "userService & DB", "PASSED"],
    ]
    add_styled_table(doc, test_headers, test_data, col_widths=[1.4, 2.8, 1.6, 1.0], title="Table 8. Verified System Testing Results")

    # =========================================================================
    # SECTION 14: CURRENT IMPLEMENTATION STATUS & ROADMAP
    # =========================================================================
    add_heading_1(doc, "14. Current Implementation Status & Achievement Summary")
    add_body_p(doc, "FlowMind AI has completed the first 5 development milestones, establishing a fully functional Layman Chatbot MVP, Natural Language Workflow Engine, and PostgreSQL Database Persistence Layer.")

    add_figure_image(doc, os.path.join(img_dir, "fig9_eight_week_roadmap.png"), "Figure 9. Eight-Week FlowMind AI Progressive Development Roadmap")

    status_headers = ["Phase / Week", "Milestone Title", "Progress Focus", "Current Status"]
    status_data = [
        ["Week 1", "SDLC & Design Tokens", "Project scaffolding, Next.js 14, TypeScript setup", "COMPLETED"],
        ["Week 2", "Multilingual Chatbot", "Indic Engine (6 languages), STT/TTS voice integration", "COMPLETED"],
        ["Week 3", "15-Agent Mesh & HITL", "Master Orchestrator, Action Cards, Security Shield, Audit", "COMPLETED"],
        ["Week 4", "NL Workflow Engine", "NL-to-DAG, Topological Runner, Visual Graph, Webhooks", "COMPLETED"],
        ["Week 5", "PostgreSQL DB Layer", "PostgreSQL DB, Prisma ORM, 3-Tier RBAC & Service Repositories", "COMPLETED"],
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
    add_body_p(doc, "1. Database Resilience: Managed via dual-mode service fallbacks to guarantee uptime even if database servers undergo maintenance.")
    add_body_p(doc, "2. Self-Approval Security Risk: Prevented by enforcing strict RBAC checks in approvalService.")

    # =========================================================================
    # SECTION 17: TEAM RESPONSIBILITY & ALLOCATION
    # =========================================================================
    add_heading_1(doc, "17. Team Responsibility & Domain Allocations")
    team_alloc_headers = ["Team Member", "Reg Number", "Domain Responsibility", "Primary Contributions"]
    team_alloc_data = [
        ["Furkhan Abdul Raheem", "23BCE7868", "AI & Multilingual Lead", "Master Orchestrator, 15-Agent Mesh, Universal Runtime, Indic Engine, Prompt Injection Shield."],
        ["Aniket Sahu", "23BCE7881", "Frontend & UI/UX Lead", "Layman Chatbot UI, Thought Stream, Action Cards, Robot Assistant, Tailwind Design Tokens."],
        ["Anjali Karagatla", "23BCE8077", "Workflow Engine Lead", "Workflow Planner, DAG Validator, Topological Runner, Visual DAG Graph, Execution Console."],
        ["Farukh", "23BCE20345", "Data & Security Lead", "PostgreSQL Database Layer, Prisma ORM, 3-Tier RBAC, Audit Logger, Artifact Manager."],
    ]
    add_styled_table(doc, team_alloc_headers, team_alloc_data, col_widths=[1.5, 1.1, 1.5, 2.7], title="Table 11. Team Domain Allocation and Responsibilities")

    # =========================================================================
    # SECTION 18 & 19: CONCLUSION & REFERENCES
    # =========================================================================
    add_heading_1(doc, "18. Conclusion & Future Scope")
    add_body_p(doc, "The interim 8-week progress report for FlowMind AI demonstrates significant engineering achievements across Weeks 1 through 5, establishing a production-grade PostgreSQL persistence layer, 15-agent collaboration mesh, multilingual engine, and zero-code workflow automation platform.")

    add_heading_1(doc, "19. References & Internal Project Documentation")
    add_body_p(doc, "1. FlowMind AI Developer Architecture & SDLC Specification (Internal Documentation, 2026).")
    add_body_p(doc, "2. FlowMind AI PostgreSQL Backend & Prisma ORM Implementation Specification (2026).")
    add_body_p(doc, "3. Official Project Repository: https://github.com/Furkhan-5/FlowMind-AI.")

    # Save final document
    output_docx_path = r"c:\Capstone\FlowMind_AI_8_Week_Project_Progress_Report.docx"
    doc.save(output_docx_path)
    print(f"Report document successfully updated at: {output_docx_path}")
    return output_docx_path

if __name__ == "__main__":
    create_document()
