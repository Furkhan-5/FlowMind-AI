import { create } from 'zustand';
import {
  User,
  Organization,
  LanguageCode,
  ChatMessage,
  AgentType,
  Workflow,
  ProactiveAlert,
  ActionCardData,
  ToastNotification,
} from '@/types';
import { MOCK_AGENTS, MOCK_LEADS, MOCK_INVOICES, MOCK_WORKFLOWS, MOCK_ALERTS } from '@/lib/mockData';
import { UI_TRANSLATIONS } from '@/lib/i18n/translations';
import { auditLogger } from '@/lib/security/auditLogger';

interface AppState {
  // Auth & Org
  user: User;
  organization: Organization;
  setRole: (role: User['role']) => void;

  // Language & Theme
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Active View / Sidebar
  activeModule: string;
  setActiveModule: (module: string) => void;

  // Chat MVP State
  activeAgent: AgentType;
  setActiveAgent: (agent: AgentType) => void;
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  isVoiceActive: boolean;
  setVoiceActive: (active: boolean) => void;

  // Action Confirmation Card LifeCycle (Approve, Edit, Cancel)
  approveActionCard: (cardId: string) => void;
  editActionCard: (cardId: string, updatedDetails: Record<string, any>) => void;
  cancelActionCard: (cardId: string) => void;

  // Toasts & Notifications
  toasts: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;

  // Workflows & Proactive Alerts
  workflows: Workflow[];
  alerts: ProactiveAlert[];
}

export const useAppStore = create<AppState>((set, get) => ({
  user: {
    id: 'USR-01',
    name: 'Furkh (Admin)',
    email: 'furkh@flowmind.ai',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    preferredLanguage: 'en',
    organizationId: 'ORG-01',
  },
  organization: {
    id: 'ORG-01',
    name: 'FlowMind Enterprise',
    domain: 'flowmind.ai',
    logo: '⚡',
    plan: 'ENTERPRISE',
    createdAt: '2026-01-01',
  },
  setRole: (role) =>
    set((state) => ({
      user: { ...state.user, role },
    })),

  language: 'en',
  setLanguage: (lang) => {
    const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;
    set((state) => ({
      language: lang,
      messages: state.messages.map((m) => {
        if (m.id === 'MSG-01') {
          return { ...m, content: t.welcomeSystemMsg || m.content, language: lang };
        }
        if (m.id === 'MSG-02') {
          return { ...m, content: t.welcomeCeoMsg || m.content, language: lang };
        }
        return m;
      }),
    }));
  },

  isDarkMode: true,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  activeModule: 'dashboard',
  setActiveModule: (activeModule) => set({ activeModule }),

  activeAgent: 'CEO',
  setActiveAgent: (activeAgent) => set({ activeAgent }),

  messages: [
    {
      id: 'MSG-01',
      sender: 'SYSTEM',
      content: 'Welcome to FlowMind AI – Multilingual AI Business Operating System. 15 specialized agents are active and ready.',
      language: 'en',
      timestamp: 'Just now',
    },
    {
      id: 'MSG-02',
      sender: 'AGENT',
      activeAgent: 'CEO',
      content: 'Good day! I am your CEO Agent. All 15 domain agents are monitoring operations. How can we assist your enterprise today?',
      language: 'en',
      thoughtStream: [
        { agent: 'CEO', action: 'Initialized multi-agent system state', timestamp: '12:00:01', status: 'DONE' },
        { agent: 'Security', action: 'Enforced 3-tier RBAC role check (ADMIN)', timestamp: '12:00:02', status: 'DONE' },
      ],
      timestamp: 'Just now',
    },
  ],
  addMessage: (msgData) => {
    const newMessage: ChatMessage = {
      ...msgData,
      id: `MSG-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => ({ messages: [...state.messages, newMessage] }));
  },

  isVoiceActive: false,
  setVoiceActive: (isVoiceActive) => set({ isVoiceActive }),

  // 1. APPROVE & EXECUTE
  approveActionCard: (cardId) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let cardAgent: AgentType = 'CEO';
    let cardTitle = 'Action Card';
    let cardDetails: Record<string, any> = {};

    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.actionCard && msg.actionCard.id === cardId) {
          cardAgent = msg.actionCard.agent;
          cardTitle = msg.actionCard.title;
          cardDetails = msg.actionCard.details;

          const updatedSteps = msg.thoughtStream ? [...msg.thoughtStream] : [];
          updatedSteps.push({
            agent: cardAgent,
            action: 'Action approved by user & executed successfully',
            timestamp: timeStr,
            status: 'DONE',
          });

          return {
            ...msg,
            thoughtStream: updatedSteps,
            actionCard: { ...msg.actionCard, status: 'APPROVED' },
          };
        }
        return msg;
      }),
      alerts: state.alerts.map((alert) => {
        if (alert.recommendedAction.id === cardId) {
          return {
            ...alert,
            recommendedAction: { ...alert.recommendedAction, status: 'APPROVED' },
          };
        }
        return alert;
      }),
    }));

    // Record Audit Event
    auditLogger.logAuditEvent({
      userId: get().user.id,
      organizationId: get().user.organizationId,
      requestId: `REQ-APP-${cardId}`,
      agentId: cardAgent,
      actionType: cardTitle,
      parameters: cardDetails,
      approvalStatus: 'APPROVED',
      executionStatus: 'EXECUTED',
    });

    // Add Toast Notification
    get().addToast({
      title: 'Action Approved & Executed',
      message: `${cardTitle} has been executed by ${cardAgent} Agent.`,
      type: 'success',
    });
  },

  // 2. EDIT ACTION PARAMETERS
  editActionCard: (cardId, updatedDetails) => {
    let cardAgent: AgentType = 'CEO';
    let cardTitle = 'Action Card';

    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.actionCard && msg.actionCard.id === cardId) {
          cardAgent = msg.actionCard.agent;
          cardTitle = msg.actionCard.title;
          return {
            ...msg,
            actionCard: {
              ...msg.actionCard,
              details: { ...msg.actionCard.details, ...updatedDetails },
              status: 'EDITED',
            },
          };
        }
        return msg;
      }),
    }));

    // Record Audit Event
    auditLogger.logAuditEvent({
      userId: get().user.id,
      organizationId: get().user.organizationId,
      requestId: `REQ-EDIT-${cardId}`,
      agentId: cardAgent,
      actionType: `EDIT_${cardTitle}`,
      parameters: updatedDetails,
      approvalStatus: 'EDITED',
      executionStatus: 'PENDING',
    });

    // Add Toast Notification
    get().addToast({
      title: 'Action Parameters Modified',
      message: `Updated parameters for ${cardTitle}. Awaiting approval before execution.`,
      type: 'info',
    });
  },

  // 3. CANCEL ACTION
  cancelActionCard: (cardId) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let cardAgent: AgentType = 'CEO';
    let cardTitle = 'Action Card';

    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.actionCard && msg.actionCard.id === cardId) {
          cardAgent = msg.actionCard.agent;
          cardTitle = msg.actionCard.title;

          const updatedSteps = msg.thoughtStream ? [...msg.thoughtStream] : [];
          updatedSteps.push({
            agent: cardAgent,
            action: 'Action cancelled by user',
            timestamp: timeStr,
            status: 'DONE',
          });

          return {
            ...msg,
            thoughtStream: updatedSteps,
            actionCard: { ...msg.actionCard, status: 'CANCELLED' },
          };
        }
        return msg;
      }),
    }));

    // Record Audit Event
    auditLogger.logAuditEvent({
      userId: get().user.id,
      organizationId: get().user.organizationId,
      requestId: `REQ-CANCEL-${cardId}`,
      agentId: cardAgent,
      actionType: `CANCEL_${cardTitle}`,
      parameters: {},
      approvalStatus: 'CANCELLED',
      executionStatus: 'PENDING',
    });

    // Add Toast Notification
    get().addToast({
      title: 'Action Cancelled',
      message: `${cardTitle} was cancelled. No changes executed.`,
      type: 'warning',
    });
  },

  // Toast Notifications State
  toasts: [],
  addToast: (toastData) => {
    const id = `TOAST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newToast: ToastNotification = {
      ...toastData,
      id,
      timestamp: timeStr,
      duration: toastData.duration || 4500,
    };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  workflows: MOCK_WORKFLOWS,
  alerts: MOCK_ALERTS,
}));
