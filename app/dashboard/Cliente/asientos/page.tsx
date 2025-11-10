'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SeleccionAsientos() {
  const searchParams = useSearchParams();
  const bus = searchParams.get('bus');
  const precio = Number(searchParams.get('precio')) || 0;

  const [asientosSeleccionados, setAsientosSeleccionados] = useState<number[]>([]);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);

  // Simulación de asientos (1 = disponible, 0 = ocupado)
  const asientos = [
    1, 1, 0, 1, 1, 0, 1, 1,
    1, 1, 1, 0, 1, 1, 0, 1,
    1, 0, 1, 1, 1, 1, 0, 1,
  ];

  const toggleAsiento = (index: number) => {
    if (asientos[index] === 0) return; // no se puede seleccionar ocupados
    setAsientosSeleccionados(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const total = (asientosSeleccionados.length * precio).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-6 relative">
      {/* Botón X (cerrar) */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-5 right-6 text-gray-600 hover:text-red-500 text-2xl font-bold"
      >
        ✖
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center border border-gray-200">
        <h1 className="text-2xl font-bold text-blue-700 mb-2">Andina Bus</h1>
        <p className="text-gray-700 mb-1">Ruta Ambato - Baños</p>
        <p className="text-gray-600 mb-4">Bus #{bus} - 9:00 A.M</p>

        {/* Leyenda */}
        <div className="flex justify-center gap-4 mb-4 text-sm">
          <div><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>Disponible</div>
          <div><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>Ocupado</div>
          <div><span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-1"></span>Seleccionado</div>
        </div>

        {/* Mapa de asientos */}
        <div className="grid grid-cols-4 gap-2 justify-center mx-auto mb-6">
          {asientos.map((estado, i) => {
            const seleccionado = asientosSeleccionados.includes(i);
            const color = estado === 0
              ? 'bg-red-500 text-white'
              : seleccionado
              ? 'bg-yellow-400'
              : 'bg-green-500 text-white';

            return (
              <button
                key={i}
                onClick={() => toggleAsiento(i)}
                disabled={estado === 0}
                className={`w-10 h-10 rounded-lg font-semibold ${color} transition-transform hover:scale-105`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Totales */}
        <div className="text-left mb-4">
          <p className="text-gray-700">
            Cantidad de asientos: <b>{asientosSeleccionados.length}</b>
          </p>
          <p className="text-gray-700">
            Precio total: <b>${total}</b>
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-semibold hover:bg-gray-500 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => setMostrarModalPago(true)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Comprar
          </button>
        </div>
      </div>

      {/* Modal de Pago */}
      {mostrarModalPago && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-[400px] rounded-2xl shadow-xl p-6 relative">
            {/* Botón X */}
            <button
              className="absolute right-4 top-3 text-gray-500 hover:text-red-500 text-xl"
              onClick={() => setMostrarModalPago(false)}
            >
              ✖
            </button>

            <h2 className="text-xl font-bold text-blue-700 mb-4 text-center">Andina Bus</h2>

            <div className="flex justify-center gap-2 mb-4">
              <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" className="h-6" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/50/Discover_Card_logo.svg" className="h-6" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo_%282018%29.svg" className="h-6" />
            </div>

            <form className="space-y-3 text-left">
              <div>
                <label className="block text-sm font-semibold">Name on card</label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  required
                />
                <span className="text-xs text-red-500">*Required.</span>
              </div>

              <div>
                <label className="block text-sm font-semibold">Card number</label>
                <input
                  type="text"
                  maxLength={19}
                  placeholder="#### #### #### ####"
                  className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  required
                />
                <span className="text-xs text-red-500">
                  Please enter a valid 16 digit credit card number.
                </span>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-semibold">Exp. date</label>
                  <div className="flex gap-1">
                    <select className="border rounded-md p-2 text-sm w-1/2">
                      <option>MM</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i}>{String(i + 1).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <select className="border rounded-md p-2 text-sm w-1/2">
                      <option>YYYY</option>
                      {[2025, 2026, 2027, 2028, 2029].map((year) => (
                        <option key={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="w-1/3">
                  <label className="block text-sm font-semibold">CVV</label>
                  <input
                    type="password"
                    maxLength={3}
                    className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                    required
                  />
                  <span className="text-xs text-red-500">*Required.</span>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-sm font-semibold">Total Compra</p>
                <input
                  type="text"
                  readOnly
                  value={`$${total}`}
                  className="w-full border rounded-md p-2 text-center bg-gray-50"
                />
              </div>

              <button
                type="button"
                onClick={() => alert('Pago exitoso ✅')}
                className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">🔒</span> Pagar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
