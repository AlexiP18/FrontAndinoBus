'use client';

import { useEffect, useState } from 'react';
import { configuracionApi, type ConfiguracionGlobal } from '@/lib/api';
import { 
  Bus,
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageCircle,
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Linkedin,
  ExternalLink,
  FileText,
  Shield,
  Globe,
  ArrowRight,
  Loader2,
  AlertCircle,
  ChevronRight,
  Ticket,
  Users,
  Building2,
  Route
} from 'lucide-react';
import Link from 'next/link';

export default function InfoPage() {
  const [config, setConfig] = useState<ConfiguracionGlobal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfiguracion();
  }, []);

  const loadConfiguracion = async () => {
    try {
      setLoading(true);
      const data = await configuracionApi.get();
      setConfig(data);
    } catch (err) {
      console.error('Error al cargar configuración:', err);
      setError('No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">{error || 'Error al cargar'}</p>
        </div>
      </div>
    );
  }

  const primaryColor = config.colorPrimario || '#1E40AF';
  const secondaryColor = config.colorSecundario || '#3B82F6';
  const accentColor = config.colorAcento || '#10B981';

  const hasSocialLinks = config.facebookUrl || config.twitterUrl || config.instagramUrl || config.youtubeUrl || config.linkedinUrl;
  const hasContactInfo = config.emailSoporte || config.telefonoSoporte || config.whatsappSoporte || config.direccionFisica;

  return (
    <div className="min-h-screen bg-white">
      {/* Header / Navbar */}
      <header 
        className="sticky top-0 z-50 border-b shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {config.logoUrl ? (
                <img 
                  src={config.logoUrl} 
                  alt={config.nombreAplicacion || 'Logo'} 
                  className="h-10 object-contain"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Bus className="w-8 h-8 text-white" />
                  <span className="text-xl font-bold text-white">
                    {config.nombreAplicacion || 'Terminal'}
                  </span>
                </div>
              )}
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#servicios" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                Servicios
              </a>
              <a href="#contacto" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                Contacto
              </a>
              {config.sitioWeb && (
                <a 
                  href={config.sitioWeb} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
                >
                  Sitio Web <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <Link 
                href="/login"
                className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
              >
                Iniciar Sesión
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative py-24 md:py-32"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
        }}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {config.nombreAplicacion || 'Terminal Terrestre'}
            </h1>
            {config.descripcion && (
              <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
                {config.descripcion}
              </p>
            )}
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <Ticket className="w-5 h-5" />
                Comprar Boletos
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a 
                href="#contacto"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors border border-white/30"
              >
                <Phone className="w-5 h-5" />
                Contáctanos
              </a>
            </div>
          </div>
        </div>
        
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ofrecemos una experiencia completa para tu viaje, desde la compra de boletos hasta el seguimiento en tiempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Servicio 1 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Ticket className="w-7 h-7" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Venta de Boletos</h3>
              <p className="text-gray-600 text-sm">
                Compra tus boletos en línea de manera rápida y segura, sin filas ni esperas.
              </p>
            </div>

            {/* Servicio 2 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${secondaryColor}15` }}
              >
                <Route className="w-7 h-7" style={{ color: secondaryColor }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Múltiples Rutas</h3>
              <p className="text-gray-600 text-sm">
                Conectamos las principales ciudades y cantones con rutas optimizadas y frecuentes.
              </p>
            </div>

            {/* Servicio 3 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <MapPin className="w-7 h-7" style={{ color: accentColor }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tracking en Vivo</h3>
              <p className="text-gray-600 text-sm">
                Sigue tu bus en tiempo real y recibe notificaciones sobre tu viaje.
              </p>
            </div>

            {/* Servicio 4 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Users className="w-7 h-7" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cooperativas Aliadas</h3>
              <p className="text-gray-600 text-sm">
                Trabajamos con las mejores cooperativas para garantizar tu seguridad y comodidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section 
        className="py-16"
        style={{ backgroundColor: `${primaryColor}08` }}
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: primaryColor }}>50+</div>
              <div className="text-gray-600">Rutas Activas</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: primaryColor }}>100+</div>
              <div className="text-gray-600">Buses</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: primaryColor }}>24/7</div>
              <div className="text-gray-600">Atención</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: primaryColor }}>10K+</div>
              <div className="text-gray-600">Usuarios</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      {hasContactInfo && (
        <section id="contacto" className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Contacto
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                ¿Tienes preguntas? Estamos aquí para ayudarte
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {config.direccionFisica && (
                <div className="bg-gray-50 rounded-2xl p-6 text-center">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <MapPin className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Dirección</h3>
                  <p className="text-gray-600 text-sm">{config.direccionFisica}</p>
                </div>
              )}

              {config.telefonoSoporte && (
                <div className="bg-gray-50 rounded-2xl p-6 text-center">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <Phone className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Teléfono</h3>
                  <a 
                    href={`tel:${config.telefonoSoporte}`}
                    className="text-gray-600 text-sm hover:underline"
                  >
                    {config.telefonoSoporte}
                  </a>
                </div>
              )}

              {config.emailSoporte && (
                <div className="bg-gray-50 rounded-2xl p-6 text-center">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <Mail className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                  <a 
                    href={`mailto:${config.emailSoporte}`}
                    className="text-gray-600 text-sm hover:underline"
                  >
                    {config.emailSoporte}
                  </a>
                </div>
              )}

              {config.whatsappSoporte && (
                <div className="bg-gray-50 rounded-2xl p-6 text-center">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: '#25D36615' }}
                  >
                    <MessageCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">WhatsApp</h3>
                  <a 
                    href={`https://wa.me/${config.whatsappSoporte.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 text-sm hover:underline"
                  >
                    {config.whatsappSoporte}
                  </a>
                </div>
              )}
            </div>

            {config.horarioAtencion && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{config.horarioAtencion}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Final */}
      <section 
        className="py-20"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
        }}
      >
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para viajar?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Compra tus boletos ahora y disfruta de un viaje seguro y cómodo
          </p>
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors text-lg"
          >
            Comprar Boletos
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                {config.logoSmallUrl ? (
                  <img 
                    src={config.logoSmallUrl} 
                    alt={config.nombreAplicacion || 'Logo'} 
                    className="h-10 object-contain"
                  />
                ) : (
                  <Bus className="w-8 h-8" />
                )}
                <span className="text-xl font-bold">
                  {config.nombreAplicacion || 'Terminal'}
                </span>
              </div>
              {config.descripcion && (
                <p className="text-gray-400 text-sm max-w-md">
                  {config.descripcion}
                </p>
              )}
            </div>

            {/* Enlaces */}
            <div>
              <h3 className="font-semibold mb-4">Enlaces</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Iniciar Sesión
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Registrarse
                  </Link>
                </li>
                {config.sitioWeb && (
                  <li>
                    <a 
                      href={config.sitioWeb} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1"
                    >
                      Sitio Web <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                {config.terminosCondicionesUrl && (
                  <li>
                    <a 
                      href={config.terminosCondicionesUrl}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      Términos y Condiciones
                    </a>
                  </li>
                )}
                {config.politicaPrivacidadUrl && (
                  <li>
                    <a 
                      href={config.politicaPrivacidadUrl}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1"
                    >
                      <Shield className="w-3 h-3" />
                      Política de Privacidad
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Redes Sociales */}
          {hasSocialLinks && (
            <div className="mt-8 pt-8 border-t border-gray-800">
              <div className="flex items-center justify-center gap-4">
                {config.facebookUrl && (
                  <a 
                    href={config.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {config.twitterUrl && (
                  <a 
                    href={config.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {config.instagramUrl && (
                  <a 
                    href={config.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {config.youtubeUrl && (
                  <a 
                    href={config.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
                {config.linkedinUrl && (
                  <a 
                    href={config.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {config.nombreAplicacion || 'Terminal Terrestre'}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
