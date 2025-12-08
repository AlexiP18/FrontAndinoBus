'use client';

import { useState } from 'react';
import { Mail, Lock, User, CreditCard, Eye, EyeOff, CheckCircle, Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import { API_URL } from '@/lib/constants';

export default function RegisterForm() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  // Estado para confirmación de email
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'Campo Obligatorio';
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'Campo Obligatorio';
    }

    if (!formData.cedula.trim()) {
      newErrors.cedula = 'Please enter your full name';
    } else if (!/^\d{10}$/.test(formData.cedula)) {
      newErrors.cedula = 'La cédula debe tener 10 dígitos';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Introduce una dirección de correo electrónico válida';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Introduce una dirección de correo electrónico válida';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña debe contener al menos 8 caracteres y 1 carácter especial.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe contener al menos 8 caracteres y 1 carácter especial.';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = 'La contraseña debe contener al menos 8 caracteres y 1 carácter especial.';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas deben coincidir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await register(formData.email, formData.password, formData.nombre, formData.apellido);
      
      if (result.requiresConfirmation) {
        setRegistrationComplete(true);
        setConfirmationMessage(result.message);
        setRegisteredEmail(result.email || formData.email);
      }
    } catch (err: any) {
      console.error('Error en registro:', err);
      setErrors({ general: err.message || 'Error al registrar usuario. Intenta con otro email.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendConfirmation = async () => {
    setResendLoading(true);
    setResendMessage('');
    
    try {
      const response = await fetch(`${API_URL}/auth/reenviar-confirmacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail })
      });
      const data = await response.json();
      
      if (data.success) {
        setResendMessage('✅ ' + data.message);
      } else {
        setResendMessage('❌ ' + data.message);
      }
    } catch (error) {
      setResendMessage('❌ Error al reenviar el correo. Intenta nuevamente.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Limpiar error del campo al escribir
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 my-8">
        
        {/* Pantalla de confirmación de email */}
        {registrationComplete ? (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              ¡Revisa tu correo! 📧
            </h2>
            <p className="text-gray-600 mb-4">
              {confirmationMessage}
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                Hemos enviado un enlace de confirmación a:
              </p>
              <p className="font-semibold text-blue-900 mt-1">
                {registeredEmail}
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {resendLoading ? 'Enviando...' : 'Reenviar correo de confirmación'}
              </button>
              
              {resendMessage && (
                <p className={`text-sm ${resendMessage.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {resendMessage}
                </p>
              )}
              
              <Link
                href="/login"
                className="block w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all text-center"
              >
                Ir al Login
              </Link>
            </div>
            
            <p className="text-xs text-gray-500 mt-6">
              Si no encuentras el correo, revisa tu carpeta de spam o correo no deseado.
            </p>
          </div>
        ) : (
          <>
            {/* Formulario de registro normal */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 mb-3 relative">

                <Image 
                  src="/usuario.png" 
                  alt="AndinaBus Logo" 
                  width={80} 
              height={80}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Registro</h1>
          <p className="text-gray-500 text-sm mt-1">
            Ya tienes una cuenta?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Inicia Sesion
            </Link>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2.5 border ${errors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900`}
                placeholder=""
              />
            </div>
            {errors.nombre && (
              <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* Apellido */}
          <div>
            <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
              Apellido
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="apellido"
                name="apellido"
                type="text"
                value={formData.apellido}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2.5 border ${errors.apellido ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900`}
                placeholder=""
              />
            </div>
            {errors.apellido && (
              <p className="text-red-500 text-xs mt-1">{errors.apellido}</p>
            )}
          </div>

          {/* Cédula */}
          <div>
            <label htmlFor="cedula" className="block text-sm font-medium text-gray-700 mb-1">
              Cedula
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="cedula"
                name="cedula"
                type="text"
                value={formData.cedula}
                onChange={handleChange}
                maxLength={10}
                className={`w-full pl-10 pr-4 py-2.5 border ${errors.cedula ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900`}
                placeholder=""
              />
            </div>
            {errors.cedula && (
              <p className="text-red-500 text-xs mt-1">{errors.cedula}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2.5 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900`}
                placeholder=""
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-12 py-2.5 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900`}
                placeholder=""
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full pl-10 pr-12 py-2.5 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900`}
                placeholder=""
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lock className="w-5 h-5" />
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link 
              href="/login" 
              className="text-blue-600 hover:text-blue-700 font-semibold transition"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
          </>
        )}
      </div>
    </div>
  );
}