'use client';

import { useRouter } from 'next/navigation';
import BusquedaRutas from '../../components/BusquedaRutas';
import { RutaItem } from '@/lib/api';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import DashboardNavbar from '../../components/layout/DashboardNavbar';

export default function ClientePage() {
  const router = useRouter();

  const handleSelectRuta = (ruta: RutaItem) => {
    // Guardar ruta seleccionada y navegar a compra
    sessionStorage.setItem('rutaSeleccionada', JSON.stringify(ruta));
    router.push('/dashboard/Cliente/compra');
  };

  return (
    <ProtectedRoute allowedRoles={['CLIENTE']}>
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar title="Dashboard Cliente">
          <Link
            href="/dashboard/Cliente/boletos"
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-medium">Mis Boletos</span>
          </Link>
        </DashboardNavbar>

        {/* Contenido */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <BusquedaRutas onSelectRuta={handleSelectRuta} />
        </div>
      </div>
    </ProtectedRoute>
  );
}