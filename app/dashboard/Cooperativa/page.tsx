'use client';

import ProtectedRoute from '../../components/ProtectedRoute';
import CooperativaDashboard from '../../components/dashboards/CooperativaDashboard';

export default function CooperativaPage() {
  return (
    <ProtectedRoute allowedRoles={['COOPERATIVA']}>
      <CooperativaDashboard />
    </ProtectedRoute>
  );
}