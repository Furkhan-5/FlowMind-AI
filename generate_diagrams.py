import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Set clean styling for diagrams
plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['font.family'] = 'sans-serif'

output_dir = r"c:\Capstone\report_diagrams"
os.makedirs(output_dir, exist_ok=True)

print("Generating report diagrams...")

# --- Figure 1: High-Level System Architecture ---
fig, ax = plt.subplots(figsize=(10, 7.5), dpi=300)
ax.axis('off')

layers = [
    ("PRESENTATION LAYER", ["Next.js 14 App Router", "Layman Chatbot UI", "Visual Workflow Builder", "Executive Dashboard"], "#1E293B", "#38BDF8"),
    ("API GATEWAY & SECURITY LAYER", ["REST API Routes", "Prompt Injection Shield", "RBAC & Role Manager", "Audit Logger"], "#0F172A", "#A855F7"),
    ("CONVERSATIONAL AI & ORCHESTRATION ENGINE", ["Multilingual Indic Engine", "Canonical Intent Parser", "Master Agent Orchestrator", "Task & Conversation Memory"], "#1E1B4B", "#6366F1"),
    ("15-SPECIALIZED AI AGENT MESH", ["CEO / Executive Agent", "Sales Agent", "Finance Agent", "HR Agent", "Analytics Agent", "10 Domain Agents"], "#311042", "#EC4899"),
    ("BUSINESS SERVICES & EXECUTION ENGINES", ["Topological DAG Runner", "Condition Evaluator", "Variable Resolver", "Artifact / Invoice Generator"], "#064E3B", "#34D399"),
    ("POSTGRESQL DATABASE & PRISMA ORM LAYER (COMPLETED)", ["13 Relational Prisma Models", "3-Tier RBAC & Permissions", "Workflow & Execution Storage", "Audit & Multilingual Logs"], "#1C1917", "#F59E0B"),
    ("DYNAMIC CLOUD DEPLOYMENT & HOSTING ENGINE (MILESTONE)", ["Node.js Production Runtime", "Vercel / Docker Container", "GitHub Actions CI/CD", "Live Production Web Endpoint"], "#030712", "#06B6D4"),
]

y_pos = 0.92
for title, items, bg_color, border_color in layers:
    rect = patches.FancyBboxPatch((0.05, y_pos - 0.095), 0.90, 0.095, boxstyle="round,pad=0.01,rounding_size=0.012",
                                 linewidth=1.3, edgecolor=border_color, facecolor=bg_color)
    ax.add_patch(rect)
    ax.text(0.08, y_pos - 0.025, title, fontsize=9.5, fontweight='bold', color='white', va='center')
    items_str = "  |  ".join(items)
    ax.text(0.08, y_pos - 0.065, items_str, fontsize=8, color='#CBD5E1', va='center')
    y_pos -= 0.125

ax.set_title("Figure 1. High-Level FlowMind AI System Architecture with Integrated PostgreSQL Database Layer", fontsize=11, fontweight='bold', pad=12, color='#0F172A')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "fig1_system_architecture.png"))
plt.close()


# --- Figure 2: End-to-End Data Flow Pipeline ---
fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
ax.axis('off')

steps = [
    "User Natural Language / Voice Input",
    "Language Script & Indic Engine Detection",
    "Security Scan & Prompt Injection Shield",
    "Canonical Intent Parsing & Memory Recall",
    "Master Orchestrator Agent Routing",
    "Specialized Agent Evaluation & Logic",
    "Action Governance & Risk Classification",
    "Human Approval on Action Card (HITL)",
    "Action Execution & Artifact Generation",
    "PostgreSQL Database Audit & State Recording"
]

y_top = 0.90
for i, step in enumerate(steps):
    box_y = y_top - (i * 0.082)
    color = "#0F172A" if i != 2 and i != 7 else ("#7F1D1D" if i == 2 else "#4C1D95")
    rect = patches.FancyBboxPatch((0.15, box_y - 0.06), 0.70, 0.06, boxstyle="round,pad=0.01,rounding_size=0.01",
                                 linewidth=1.2, edgecolor="#6366F1", facecolor=color)
    ax.add_patch(rect)
    ax.text(0.50, box_y - 0.03, f"Step {i+1}: {step}", fontsize=9, fontweight='bold', color='white', ha='center', va='center')
    
    if i < len(steps) - 1:
        ax.annotate('', xy=(0.50, box_y - 0.082), xytext=(0.50, box_y - 0.06),
                    arrowprops=dict(arrowstyle="->", color="#6366F1", lw=1.5))

rect_sec = patches.FancyBboxPatch((0.02, 0.65), 0.10, 0.15, boxstyle="round,pad=0.01", linewidth=1, edgecolor="#EF4444", facecolor="#450A0A")
ax.add_patch(rect_sec)
ax.text(0.07, 0.72, "Threat\nDetected\n↓\nBlock Request\n↓\nAudit Log", fontsize=7, color="#FCA5A5", ha='center', va='center')
ax.annotate('', xy=(0.12, 0.735), xytext=(0.15, 0.735), arrowprops=dict(arrowstyle="<-", color="#EF4444", lw=1.5))

ax.set_title("Figure 2. End-to-End Request Processing and Execution Pipeline", fontsize=12, fontweight='bold', pad=15, color='#0F172A')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "fig2_data_flow_pipeline.png"))
plt.close()


# --- Figure 3: Multilingual Flow ---
fig, ax = plt.subplots(figsize=(9, 4.5), dpi=300)
ax.axis('off')

ml_nodes = [
    ("User Input\n(Multi-Script / Voice)", 0.05, 0.4),
    ("Indic Script Detector\n(Unicode Regex)", 0.28, 0.4),
    ("Canonical Intent Parser\n(Multi-Script Matching)", 0.52, 0.4),
    ("Agent Routing &\nNative Response Synth", 0.76, 0.4),
]

for label, x, y in ml_nodes:
    rect = patches.FancyBboxPatch((x, y), 0.19, 0.22, boxstyle="round,pad=0.01", linewidth=1.2, edgecolor="#3B82F6", facecolor="#1E293B")
    ax.add_patch(rect)
    ax.text(x + 0.095, y + 0.11, label, fontsize=8.5, fontweight='bold', color='white', ha='center', va='center')

for i in range(len(ml_nodes) - 1):
    x1 = ml_nodes[i][1] + 0.19
    x2 = ml_nodes[i+1][1]
    ax.annotate('', xy=(x2, 0.51), xytext=(x1, 0.51), arrowprops=dict(arrowstyle="->", color="#3B82F6", lw=2))

rect_lang = patches.FancyBboxPatch((0.20, 0.08), 0.60, 0.16, boxstyle="round,pad=0.01", linewidth=1, edgecolor="#10B981", facecolor="#064E3B")
ax.add_patch(rect_lang)
ax.text(0.50, 0.16, "Supported Scripts: English (en) | Telugu (te) | Hindi (hi) | Tamil (ta) | Kannada (kn) | Malayalam (ml)", fontsize=8, fontweight='bold', color="#A7F3D0", ha='center', va='center')

ax.set_title("Figure 3. Multilingual Input Processing Flowchart", fontsize=11, fontweight='bold', pad=15, color='#0F172A')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "fig3_multilingual_flow.png"))
plt.close()


# --- Figure 4: Week 3 Multi-Agent Architecture ---
fig, ax = plt.subplots(figsize=(9.5, 5.5), dpi=300)
ax.axis('off')

boxes = [
    ("ChatInterface.tsx", 0.05, 0.70, "#1E293B"),
    ("promptInjectionShield.ts", 0.36, 0.70, "#7F1D1D"),
    ("agentOrchestrator.ts", 0.67, 0.70, "#4C1D95"),
    
    ("universalAgentRuntime.ts", 0.05, 0.38, "#1E1B4B"),
    ("agentRegistry.ts\n(15 Agents)", 0.36, 0.38, "#311042"),
    ("actionGovernance.ts\n(Risk Evaluation)", 0.67, 0.38, "#064E3B"),
    
    ("ActionCard.tsx\n(HITL Approval)", 0.05, 0.06, "#78350F"),
    ("artifactManager.ts\n(Invoice/PDF)", 0.36, 0.06, "#065F46"),
    ("auditLogger.ts\n(Audit Trails)", 0.67, 0.06, "#1F2937"),
]

for name, x, y, bg in boxes:
    rect = patches.FancyBboxPatch((x, y), 0.27, 0.20, boxstyle="round,pad=0.01", linewidth=1.2, edgecolor="#818CF8", facecolor=bg)
    ax.add_patch(rect)
    ax.text(x + 0.135, y + 0.10, name, fontsize=8.5, fontweight='bold', color='white', ha='center', va='center')

ax.annotate('', xy=(0.36, 0.80), xytext=(0.32, 0.80), arrowprops=dict(arrowstyle="->", color="#818CF8", lw=1.5))
ax.annotate('', xy=(0.67, 0.80), xytext=(0.63, 0.80), arrowprops=dict(arrowstyle="->", color="#818CF8", lw=1.5))

ax.annotate('', xy=(0.185, 0.58), xytext=(0.185, 0.70), arrowprops=dict(arrowstyle="->", color="#818CF8", lw=1.5))
ax.annotate('', xy=(0.495, 0.58), xytext=(0.495, 0.70), arrowprops=dict(arrowstyle="->", color="#818CF8", lw=1.5))
ax.annotate('', xy=(0.805, 0.58), xytext=(0.805, 0.70), arrowprops=dict(arrowstyle="->", color="#818CF8", lw=1.5))

ax.annotate('', xy=(0.185, 0.26), xytext=(0.185, 0.38), arrowprops=dict(arrowstyle="->", color="#818CF8", lw=1.5))
ax.annotate('', xy=(0.495, 0.26), xytext=(0.495, 0.38), arrowprops=dict(arrowstyle="->", color="#818CF8", lw=1.5))
ax.annotate('', xy=(0.805, 0.26), xytext=(0.805, 0.38), arrowprops=dict(arrowstyle="->", color="#818CF8", lw=1.5))

ax.set_title("Figure 4. Week 3 Multi-Agent and Human-in-the-Loop Architecture", fontsize=11, fontweight='bold', pad=15, color='#0F172A')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "fig4_week3_agent_mesh.png"))
plt.close()


# --- Figure 5: Week 4 Natural Language Workflow Pipeline ---
fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
ax.axis('off')

wf_steps = [
    ("Natural Language Prompt", 0.05, 0.72, "#0F172A"),
    ("workflowPlanner.ts\n(NL → DAG JSON)", 0.28, 0.72, "#4C1D95"),
    ("dagValidator.ts\n(Cycle & Topo Check)", 0.51, 0.72, "#1E1B4B"),
    ("workflowService.ts\n(PostgreSQL Store)", 0.74, 0.72, "#064E3B"),

    ("Trigger Sources\n(Manual / Webhook / Cron)", 0.05, 0.25, "#311042"),
    ("jobQueue.ts\n(Job Enqueue)", 0.28, 0.25, "#1E293B"),
    ("workflowEngine.ts\n(Topological Runner)", 0.51, 0.25, "#065F46"),
    ("ExecutionRunnerConsole.tsx\n(Live Execution Trace)", 0.74, 0.25, "#78350F"),
]

for label, x, y, bg in wf_steps:
    rect = patches.FancyBboxPatch((x, y), 0.20, 0.20, boxstyle="round,pad=0.01", linewidth=1.2, edgecolor="#38BDF8", facecolor=bg)
    ax.add_patch(rect)
    ax.text(x + 0.10, y + 0.10, label, fontsize=8, fontweight='bold', color='white', ha='center', va='center')

ax.annotate('', xy=(0.28, 0.82), xytext=(0.25, 0.82), arrowprops=dict(arrowstyle="->", color="#38BDF8", lw=1.5))
ax.annotate('', xy=(0.51, 0.82), xytext=(0.48, 0.82), arrowprops=dict(arrowstyle="->", color="#38BDF8", lw=1.5))
ax.annotate('', xy=(0.74, 0.82), xytext=(0.71, 0.82), arrowprops=dict(arrowstyle="->", color="#38BDF8", lw=1.5))

ax.annotate('', xy=(0.15, 0.45), xytext=(0.84, 0.72), arrowprops=dict(arrowstyle="->", color="#A855F7", lw=1.5, connectionstyle="arc3,rad=0.3"))

ax.annotate('', xy=(0.28, 0.35), xytext=(0.25, 0.35), arrowprops=dict(arrowstyle="->", color="#38BDF8", lw=1.5))
ax.annotate('', xy=(0.51, 0.35), xytext=(0.48, 0.35), arrowprops=dict(arrowstyle="->", color="#38BDF8", lw=1.5))
ax.annotate('', xy=(0.74, 0.35), xytext=(0.71, 0.35), arrowprops=dict(arrowstyle="->", color="#38BDF8", lw=1.5))

ax.set_title("Figure 5. Natural Language Workflow Automation Pipeline", fontsize=11, fontweight='bold', pad=15, color='#0F172A')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "fig5_week4_workflow_pipeline.png"))
plt.close()


# --- Figure 6: UML Use Case Diagram ---
fig, ax = plt.subplots(figsize=(9, 5.5), dpi=300)
ax.axis('off')

rect_sys = patches.FancyBboxPatch((0.25, 0.05), 0.50, 0.88, boxstyle="square,pad=0.01", linewidth=1.5, edgecolor="#0F172A", facecolor="#F8FAFC")
ax.add_patch(rect_sys)
ax.text(0.50, 0.89, "FlowMind AI System Boundary", fontsize=10, fontweight='bold', color="#0F172A", ha='center')

ax.text(0.08, 0.70, "👤 User / Manager", fontsize=9, fontweight='bold', color="#1E293B", ha='center')
ax.text(0.08, 0.30, "👤 Administrator", fontsize=9, fontweight='bold', color="#1E293B", ha='center')
ax.text(0.90, 0.50, "⚙️ External Trigger\n(Webhook / Cron)", fontsize=9, fontweight='bold', color="#1E293B", ha='center')

use_cases = [
    ("Send Multilingual Query", 0.50, 0.78),
    ("Plan Natural Language DAG", 0.50, 0.64),
    ("Approve / Edit Action Card", 0.50, 0.50),
    ("Execute Topological Workflow", 0.50, 0.36),
    ("Download Invoice PDF / Artifact", 0.50, 0.22),
    ("View Audit Logs & RBAC", 0.50, 0.08),
]

for uc_name, uc_x, uc_y in use_cases:
    ellipse = patches.Ellipse((uc_x, uc_y+0.04), 0.38, 0.09, linewidth=1.2, edgecolor="#4C1D95", facecolor="#EDE9FE")
    ax.add_patch(ellipse)
    ax.text(uc_x, uc_y+0.04, uc_name, fontsize=8, fontweight='bold', color="#4C1D95", ha='center', va='center')

for uc_name, uc_x, uc_y in use_cases[:3]:
    ax.plot([0.15, uc_x - 0.19], [0.70, uc_y + 0.04], color="#64748B", lw=1)
for uc_name, uc_x, uc_y in use_cases[2:]:
    ax.plot([0.15, uc_x - 0.19], [0.30, uc_y + 0.04], color="#64748B", lw=1)
ax.plot([0.82, 0.69], [0.50, 0.40], color="#64748B", lw=1)

ax.set_title("Figure 6. UML Use Case Diagram for FlowMind AI Platform", fontsize=11, fontweight='bold', pad=15, color='#0F172A')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "fig6_uml_use_case.png"))
plt.close()


# --- Figure 7: UML Component Diagram ---
fig, ax = plt.subplots(figsize=(9, 5.5), dpi=300)
ax.axis('off')

comp_list = [
    ("<<Component>>\nChat & Robot UI", 0.05, 0.60),
    ("<<Component>>\nIntent Parser & Indic Engine", 0.36, 0.60),
    ("<<Component>>\nMaster Agent Orchestrator", 0.67, 0.60),
    
    ("<<Component>>\nWorkflow Planner", 0.05, 0.15),
    ("<<Component>>\nDAG Validator & Runner", 0.36, 0.15),
    ("<<Component>>\nPostgreSQL & Service Layer", 0.67, 0.15),
]

for c_name, c_x, c_y in comp_list:
    rect = patches.FancyBboxPatch((c_x, c_y), 0.27, 0.25, boxstyle="round,pad=0.01", linewidth=1.2, edgecolor="#2563EB", facecolor="#EFF6FF")
    ax.add_patch(rect)
    ax.text(c_x + 0.135, c_y + 0.125, c_name, fontsize=8.5, fontweight='bold', color="#1E3A8A", ha='center', va='center')

ax.annotate('', xy=(0.36, 0.725), xytext=(0.32, 0.725), arrowprops=dict(arrowstyle="->", color="#2563EB", lw=1.5))
ax.annotate('', xy=(0.67, 0.725), xytext=(0.63, 0.725), arrowprops=dict(arrowstyle="->", color="#2563EB", lw=1.5))
ax.annotate('', xy=(0.185, 0.40), xytext=(0.185, 0.60), arrowprops=dict(arrowstyle="->", color="#2563EB", lw=1.5))
ax.annotate('', xy=(0.36, 0.275), xytext=(0.32, 0.275), arrowprops=dict(arrowstyle="->", color="#2563EB", lw=1.5))
ax.annotate('', xy=(0.67, 0.275), xytext=(0.63, 0.275), arrowprops=dict(arrowstyle="->", color="#2563EB", lw=1.5))

ax.set_title("Figure 7. UML Component Diagram", fontsize=11, fontweight='bold', pad=15, color='#0F172A')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "fig7_uml_component.png"))
plt.close()


# --- Figure 8: UML Sequence Diagram ---
fig, ax = plt.subplots(figsize=(9.5, 5.5), dpi=300)
ax.axis('off')

lifelines = ["User", "Chat UI", "Security Layer", "Orchestrator", "Agent Mesh", "Governance", "Audit Log"]
col_x = [0.05 + i * 0.145 for i in range(len(lifelines))]

for x, name in zip(col_x, lifelines):
    ax.text(x, 0.90, name, fontsize=8.5, fontweight='bold', color="#0F172A", ha='center')
    ax.plot([x, x], [0.10, 0.86], color="#94A3B8", linestyle="--", lw=1)

seq_calls = [
    (0, 1, "1. Input Query", 0.80),
    (1, 2, "2. Security Scan", 0.72),
    (2, 3, "3. Route Request", 0.64),
    (3, 4, "4. Execute Agent Logic", 0.56),
    (4, 5, "5. Evaluate Risk & Action Card", 0.48),
    (5, 1, "6. Render Action Card (HITL)", 0.40),
    (0, 1, "7. User Approves Action", 0.32),
    (1, 6, "8. Record Audit Log", 0.24),
    (1, 0, "9. Return Response & Artifact", 0.16),
]

for src, dst, label, y in seq_calls:
    x_src, x_dst = col_x[src], col_x[dst]
    ax.annotate('', xy=(x_dst, y), xytext=(x_src, y), arrowprops=dict(arrowstyle="->", color="#4338CA", lw=1.2))
    ax.text((x_src + x_dst)/2, y + 0.02, label, fontsize=7.5, color="#1E1B4B", ha='center')

ax.set_title("Figure 8. UML Sequence Diagram for Request Processing and Approval", fontsize=11, fontweight='bold', pad=15, color='#0F172A')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "fig8_uml_sequence.png"))
plt.close()


# --- Figure 9: Eight-Week Progressive Development Timeline ---
fig, ax = plt.subplots(figsize=(10, 4.5), dpi=300)
ax.axis('off')

weeks = [
    ("W1", "Foundation &\nArchitecture", "COMPLETED", "#065F46"),
    ("W2", "Multilingual\nChatbot", "COMPLETED", "#065F46"),
    ("W3", "15-Agent Mesh\n& Governance", "COMPLETED", "#065F46"),
    ("W4", "NL Workflow\nDAG Engine", "COMPLETED", "#065F46"),
    ("W5", "PostgreSQL DB &\nPrisma ORM Layer", "COMPLETED", "#065F46"),
    ("W6", "Business Suite\nIntegration", "PLANNED", "#1E40AF"),
    ("W7", "Proactive AI &\nSecurity Hardening", "PLANNED", "#1E40AF"),
    ("W8", "Dynamic Cloud\nDeployment & Demo", "PLANNED", "#1E40AF"),
]

for i, (w_code, title, status, bg_color) in enumerate(weeks):
    x = 0.03 + i * 0.12
    rect = patches.FancyBboxPatch((x, 0.35), 0.10, 0.45, boxstyle="round,pad=0.01", linewidth=1.2,
                                 edgecolor="#38BDF8", facecolor=bg_color)
    ax.add_patch(rect)
    ax.text(x + 0.05, 0.72, w_code, fontsize=10, fontweight='black', color='white', ha='center')
    ax.text(x + 0.05, 0.53, title, fontsize=7.5, color='#E2E8F0', ha='center', va='center')
    
    status_bg = "#10B981" if status == "COMPLETED" else "#3B82F6"
    rect_st = patches.FancyBboxPatch((x+0.005, 0.37), 0.09, 0.09, boxstyle="round,pad=0.005", linewidth=0, facecolor=status_bg)
    ax.add_patch(rect_st)
    ax.text(x + 0.05, 0.415, status, fontsize=6.5, fontweight='bold', color='white', ha='center', va='center')
    
    if i < len(weeks) - 1:
        ax.annotate('', xy=(x + 0.12, 0.575), xytext=(x + 0.10, 0.575), arrowprops=dict(arrowstyle="->", color="#94A3B8", lw=1.5))

rect_leg1 = patches.FancyBboxPatch((0.25, 0.10), 0.22, 0.12, boxstyle="round,pad=0.01", linewidth=0, facecolor="#065F46")
ax.add_patch(rect_leg1)
ax.text(0.36, 0.16, "WEEKS 1-5: COMPLETED IMPLEMENTATION", fontsize=7.5, fontweight='bold', color='white', ha='center', va='center')

rect_leg2 = patches.FancyBboxPatch((0.53, 0.10), 0.22, 0.12, boxstyle="round,pad=0.01", linewidth=0, facecolor="#1E40AF")
ax.add_patch(rect_leg2)
ax.text(0.64, 0.16, "WEEKS 6-8: PLANNED ROADMAP (NOV)", fontsize=7.5, fontweight='bold', color='white', ha='center', va='center')

ax.set_title("Figure 9. Eight-Week FlowMind AI Progressive Development Roadmap", fontsize=11, fontweight='bold', pad=15, color='#0F172A')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "fig9_eight_week_roadmap.png"))
plt.close()


# --- Figure 10: PostgreSQL Relational Database & Prisma ORM Schema ---
fig, ax = plt.subplots(figsize=(10.5, 7), dpi=300)
ax.axis('off')

# Core Relational Model Boxes
db_boxes = [
    ("Organization (Multi-Tenant Root)\n- id, name, slug, domain, plan\n- status, createdAt, updatedAt", 0.03, 0.70, 0.28, 0.22, "#1E293B", "#38BDF8"),
    ("User (3-Tier RBAC)\n- id, organizationId, email, role\n- name, passwordHash, status, lang", 0.36, 0.70, 0.28, 0.22, "#0F172A", "#A855F7"),
    ("Permission (20 Codes)\n- id, code, name, category\n- roles (ADMIN/MANAGER/EMPLOYEE)", 0.69, 0.70, 0.28, 0.22, "#1E1B4B", "#818CF8"),

    ("Workflow & Version\n- id, organizationId, triggerType\n- dagNodes, dagEdges (JSONB)", 0.03, 0.38, 0.28, 0.22, "#064E3B", "#34D399"),
    ("WorkflowExecution & NodeExec\n- id, status (RUNNING/SUCCESS)\n- durationMs, logs, outputResult", 0.36, 0.38, 0.28, 0.22, "#78350F", "#F59E0B"),
    ("Agent & AgentTask\n- id, agentId, prompt, response\n- inputLanguage, outputLanguage", 0.69, 0.38, 0.28, 0.22, "#311042", "#EC4899"),

    ("ApprovalRequest (Action Governance)\n- id, actionType, riskLevel, status\n- requestedById, approvedById", 0.03, 0.06, 0.43, 0.22, "#450A0A", "#EF4444"),
    ("AuditLog & Artifact\n- id, userId, action, details, ip\n- name, type, fileUrl, metadata", 0.54, 0.06, 0.43, 0.22, "#1C1917", "#06B6D4"),
]

for label, x, y, w, h, bg, border in db_boxes:
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.01", linewidth=1.3, edgecolor=border, facecolor=bg)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h/2, label, fontsize=8, fontweight='bold', color='white', ha='center', va='center')

# Foreign key relational connectors
ax.annotate('', xy=(0.36, 0.81), xytext=(0.31, 0.81), arrowprops=dict(arrowstyle="->", color="#38BDF8", lw=1.5))
ax.annotate('', xy=(0.69, 0.81), xytext=(0.64, 0.81), arrowprops=dict(arrowstyle="->", color="#A855F7", lw=1.5))

ax.annotate('', xy=(0.17, 0.60), xytext=(0.17, 0.70), arrowprops=dict(arrowstyle="->", color="#38BDF8", lw=1.5))
ax.annotate('', xy=(0.50, 0.60), xytext=(0.50, 0.70), arrowprops=dict(arrowstyle="->", color="#A855F7", lw=1.5))
ax.annotate('', xy=(0.83, 0.60), xytext=(0.83, 0.70), arrowprops=dict(arrowstyle="->", color="#818CF8", lw=1.5))

ax.annotate('', xy=(0.36, 0.49), xytext=(0.31, 0.49), arrowprops=dict(arrowstyle="->", color="#34D399", lw=1.5))
ax.annotate('', xy=(0.24, 0.28), xytext=(0.24, 0.38), arrowprops=dict(arrowstyle="->", color="#34D399", lw=1.5))
ax.annotate('', xy=(0.75, 0.28), xytext=(0.75, 0.38), arrowprops=dict(arrowstyle="->", color="#EC4899", lw=1.5))

ax.set_title("Figure 10. Relational Enterprise PostgreSQL Database & Prisma ORM Architecture Diagram", fontsize=11, fontweight='bold', pad=15, color='#0F172A')
plt.tight_layout()
plt.savefig(os.path.join(output_dir, "fig10_postgresql_database_schema.png"))
plt.close()

print("All 10 diagrams generated successfully in c:\\Capstone\\report_diagrams!")
