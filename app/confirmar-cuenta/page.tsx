'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '@/lib/constants';

function ConfirmarCuentaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      setMessage('No se proporcionó un token de confirmación.');
      return;
    }

    const confirmarCuenta = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/confirmar?token=${token}`);
        const data = await response.json();
        
        if (data.success) {
          setStatus('success');
          setMessage(data.message);
          setEmail(data.email || '');
        } else {
          setStatus('error');
          setMessage(data.message || 'Error al confirmar la cuenta');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Error de conexión. Por favor intenta nuevamente.');
      }
    };

    confirmarCuenta();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <span className="text-3xl">🚌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">AndinoBus</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Verificando tu cuenta...
              </h2>
              <p className="text-gray-500">
                Por favor espera un momento
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                ¡Cuenta Confirmada! 🎉
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              {email && (
                <p className="text-sm text-gray-500 mb-6">
                  Email: <span className="font-medium text-gray-700">{email}</span>
                </p>
              )}
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                Iniciar Sesión
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Error de Confirmación
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all text-center"
                >
                  Ir al Login
                </Link>
                <Link
                  href="/register"
                  className="block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-center"
                >
                  Registrarse Nuevamente
                </Link>
              </div>
            </div>
          )}

          {status === 'no-token' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-12 h-12 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Token no encontrado
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Si acabas de registrarte, revisa tu bandeja de entrada y haz clic en el enlace de confirmación.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                Ir al Login
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          © 2024 AndinoBus. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}

export default function ConfirmarCuentaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    }>
      <ConfirmarCuentaContent />
    </Suspense>
  );
}
