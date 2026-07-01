import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatWidget from '../chat/ChatWidget';
import { useAuthStore } from '../../store/authStore';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { user, aiCopilotEnabled } = useAuthStore();
  const role = user?.role || 'owner';

  const isAssistantPage = location.pathname === '/ai-assistant';
  const showChatWidget = !isAssistantPage && aiCopilotEnabled !== false && ['owner', 'personal', 'accountant'].includes(role);

  return (
    <div className="flex h-screen overflow-hidden text-dark-900 dark:text-white font-sans relative bg-[#FDFDFD] dark:bg-dark-900 transition-colors duration-300">
      {/* Subtle ambient background matching landing page */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-5%] right-[-5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-brand-400/8 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full bg-indigo-400/8 blur-[100px]" />
      </div>

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-6">
          <div className="max-w-screen-xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating AI Chat Widget */}
      {showChatWidget && <ChatWidget />}
    </div>
  );
}

