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
} from '@/types';
import { MOCK_AGENTS, MOCK_LEADS, MOCK_INVOICES, MOCK_WORKFLOWS, MOCK_ALERTS } from '@/lib/mockData';
import { UI_TRANSLATIONS } from '@/lib/i18n/translations';

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

  // Action Confirmation Card Approvals
  approveActionCard: (cardId: string) => void;

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

  approveActionCard: (cardId) => {
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.actionCard && msg.actionCard.id === cardId) {
          return {
            ...msg,
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
  },

  workflows: MOCK_WORKFLOWS,
  alerts: MOCK_ALERTS,
}));
