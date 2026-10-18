import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const MainLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="d-flex min-vh-100 position-relative">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1 overflow-hidden">
        {/* Top Navigation */}
        <Navbar
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Page Content Body */}
        <main className="flex-grow-1 p-3 p-md-4 p-xl-5 overflow-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="py-3 px-4 border-top text-center text-muted small bg-transparent">
          <span>&copy; {new Date().getFullYear()} StaffSync &bull; Modern Human Resource Management System &bull; Enterprise SaaS</span>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;

