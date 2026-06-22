import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatWidget from '../chat/ChatWidget';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-softGray overflow-hidden text-dark-900 font-sans">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-6">
          <div className="max-w-screen-xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating AI Chat Widget */}
      <ChatWidget />
    </div>
  );
}
