import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarCheck,
  Clock,
  BarChart3,
  BellRing,
  GraduationCap,
  Award,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role || 'EMPLOYEE';

  const navItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard size={20} />,
      roles: ['HR', 'MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'Employees Directory',
      path: '/employees',
      icon: <Users size={20} />,
      roles: ['HR', 'MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'Manage Managers',
      path: '/managers',
      icon: <Briefcase size={20} />,
      roles: ['HR'], // HR only
    },
    {
      title: 'Leave Management',
      path: '/leaves',
      icon: <CalendarCheck size={20} />,
      roles: ['HR', 'MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'Attendance',
      path: '/attendance',
      icon: <Clock size={20} />,
      roles: ['HR', 'MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'Attendance Reports',
      path: '/attendance/reports',
      icon: <BarChart3 size={20} />,
      roles: ['HR', 'MANAGER'],
    },
    {
      title: 'Announcements',
      path: '/announcements',
      icon: <BellRing size={20} />,
      roles: ['HR', 'MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'Training Programs',
      path: '/training',
      icon: <GraduationCap size={20} />,
      roles: ['HR', 'MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'Performance',
      path: '/performance',
      icon: <Award size={20} />,
      roles: ['HR', 'MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'My Profile',
      path: '/profile',
      icon: <User size={20} />,
      roles: ['HR', 'MANAGER', 'EMPLOYEE'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className={`app-sidebar d-flex flex-column ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-secondary border-opacity-25" style={{ height: 'var(--topbar-height)' }}>
        <NavLink to="/dashboard" className="d-flex align-items-center gap-2 text-decoration-none text-white">
          <div className="bg-primary rounded-3 p-2 d-flex align-items-center justify-content-center shadow-sm">
            <Shield size={20} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="lh-1">
              <span className="fw-bold fs-5 tracking-tight">StaffSync</span>
              <div className="text-muted small" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                HR ENTERPRISE
              </div>
            </div>
          )}
        </NavLink>
      </div>

      {/* Navigation List */}
      <nav className="flex-grow-1 py-3 overflow-auto">
        {!isCollapsed && (
          <div className="px-4 mb-2 text-uppercase text-muted fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.08em' }}>
            Main Menu
          </div>
        )}
        <div className="d-flex flex-column">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              title={isCollapsed ? item.title : undefined}
            >
              <span className="d-flex align-items-center justify-content-center">
                {item.icon}
              </span>
              {!isCollapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Role Pill and Collapse Footer */}
      <div className="p-3 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
        {!isCollapsed && (
          <div className="d-flex align-items-center gap-2">
            <div className="p-1 rounded-circle bg-success" style={{ width: '8px', height: '8px' }} />
            <span className="small text-muted" style={{ fontSize: '0.78rem' }}>
              Role: <strong className="text-white">{role}</strong>
            </span>
          </div>
        )}
        <button
          className="btn btn-sm btn-outline-secondary border-0 text-white-50 p-1 rounded-circle ms-auto"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

