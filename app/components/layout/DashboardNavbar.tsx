'use client';

import { useAuth } from '@/app/context/AuthContext';
import { LogOut, User, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface DashboardNavbarProps {
  title?: string;
  children?: React.ReactNode;
}

export default function DashboardNavbar({ title, children }: DashboardNavbarProps) {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      await logout();
    }
  };

  const getRoleBadgeColor = (rol: string) => {
    switch (rol.toUpperCase()) {
      case 'CLIENTE':
        return 'bg-blue-100 text-blue-800';
      case 'OFICINISTA':
        return 'bg-green-100 text-green-800';
      case 'COOPERATIVA':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y Título */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">AB</span>
              </div>
              <span className="text-xl font-bold text-gray-800 hidden sm:block">AndinaBus</span>
            </Link>
            <span className="text-gray-400 hidden md:block">|</span>
            <h1 className="text-lg font-semibold text-gray-700 hidden md:block">{title}</h1>
          </div>

          {/* Sección de Usuario - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {children}
            
            {/* Info del Usuario */}
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                <div className="text-sm">
                  <p className="font-medium text-gray-800">
                    {user?.nombres || user?.email || 'Usuario'}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user?.rol || '')}`}>
                    {user?.rol || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Salir</span>
            </button>
          </div>

          {/* Menú Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMenu && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-3">
              {/* Usuario Info */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
                <div className="text-sm flex-1">
                  <p className="font-medium text-gray-800">
                    {user?.nombres || user?.email || 'Usuario'}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user?.rol || '')}`}>
                    {user?.rol || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Children (si hay acciones adicionales) */}
              {children && <div className="px-4">{children}</div>}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
