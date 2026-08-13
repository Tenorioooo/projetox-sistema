'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Html5Qrcode } from 'html5-qrcode';

interface CheckinResultData {
  success: boolean;
  message: string;
  ticket?: {
    id: string;
    code: string;
    status: string;
    buyerName: string;
    eventTitle: string;
    ticketTypeName: string;
    checkedInAt?: string;
  };
}

export default function PortariaCheckinPage() {
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<CheckinResultData | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const qrReaderRef = useRef<Html5Qrcode | null>(null);

  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    ensureAuth();
    fetchRecent();
  }, []);

  const ensureAuth = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('projetox_token') : null;
    if (!token) {
      try {
        // Auto-login as Portaria Operator for seamless testing
        const res = await api.post('/auth/login', {
          email: 'portaria@projetox.com',
          password: 'Operador123!',
        });
        if (res.data?.token) {
          localStorage.setItem('projetox_token', res.data.token);
          localStorage.setItem('projetox_user', JSON.stringify(res.data.user));
          setAuthError(false);
        }
      } catch (err) {
        console.error('Auto login portaria failed', err);
        setAuthError(true);
      }
    }
  };

  const fetchRecent = async () => {
    try {
      const res = await api.get('/checkin/recent?limit=10');
      setRecentLogs(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const playFeedbackSound = (success: boolean) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch success beep
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime); // Low pitch error buzz
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // AudioContext not allowed without interaction, fallback silent
    }

    if (navigator.vibrate) {
      navigator.vibrate(success ? [100, 50, 100] : [300, 100, 300]);
    }
  };

  const submitCheckin = async (tokenString: string) => {
    if (processing) return;
    setProcessing(true);

    let cleanToken = tokenString.trim();
    if (cleanToken.includes('/checkin/')) {
      cleanToken = cleanToken.split('/checkin/')[1];
    }

    try {
      const res = await api.post('/checkin', { token: cleanToken });
      setLastResult(res.data);
      playFeedbackSound(res.data.success);
      fetchRecent();
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        // Token missing or expired — re-login as operator and retry
        try {
          const authRes = await api.post('/auth/login', {
            email: 'portaria@projetox.com',
            password: 'Operador123!',
          });
          if (authRes.data?.token) {
            localStorage.setItem('projetox_token', authRes.data.token);
            localStorage.setItem('projetox_user', JSON.stringify(authRes.data.user));
            // Retry request
            const retryRes = await api.post('/checkin', { token: cleanToken });
            setLastResult(retryRes.data);
            playFeedbackSound(retryRes.data.success);
            fetchRecent();
            return;
          }
        } catch (_) {}
      }

      const errRes = err.response?.data || { success: false, message: 'Erro ao validar QR Code' };
      setLastResult(errRes);
      playFeedbackSound(false);
    } finally {
      setProcessing(false);
    }
  };

  const startCamera = async () => {
    try {
      // 1. Force browser native permission popup on click
      if (typeof window !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
        try {
          const permissionStream = await navigator.mediaDevices.getUserMedia({ video: true });
          permissionStream.getTracks().forEach((track) => track.stop());
        } catch (permissionErr) {
          console.warn('getUserMedia permission request:', permissionErr);
        }
      }

      if (qrReaderRef.current) {
        try {
          await qrReaderRef.current.stop();
        } catch (_) {}
        qrReaderRef.current = null;
      }

      const html5QrCode = new Html5Qrcode('qr-reader');
      qrReaderRef.current = html5QrCode;

      // Responsive qrbox calculation prevents error when container width is smaller than 250px on mobile
      const qrboxCalc = (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const boxSize = Math.max(160, Math.floor(minEdge * 0.75));
        return { width: boxSize, height: boxSize };
      };

      const qrConfig = { fps: 10, qrbox: qrboxCalc };

      // Query available video devices
      const devices = await Html5Qrcode.getCameras();

      if (devices && devices.length > 0) {
        // On mobile, prefer rear/back camera. On desktop, pick first available camera ID.
        const backCamera = devices.find((d) => {
          const label = d.label.toLowerCase();
          return label.includes('back') || label.includes('traseira') || label.includes('rear') || label.includes('environment');
        });
        const cameraId = backCamera ? backCamera.id : devices[0].id;

        await html5QrCode.start(
          cameraId,
          qrConfig,
          (decodedText) => {
            submitCheckin(decodedText);
          },
          () => {}
        );
      } else {
        // Fallback to facingMode constraint if getCameras() returned empty
        await html5QrCode.start(
          { facingMode: 'environment' },
          qrConfig,
          (decodedText) => {
            submitCheckin(decodedText);
          },
          () => {}
        );
      }

      setScanning(true);
    } catch (err: any) {
      console.error('Error starting camera:', err);

      // Secondary fallback: try facingMode user / default
      try {
        if (qrReaderRef.current) {
          await qrReaderRef.current.start(
            { facingMode: 'user' },
            { fps: 10, qrbox: 180 },
            (decodedText) => {
              submitCheckin(decodedText);
            },
            () => {}
          );
          setScanning(true);
          return;
        }
      } catch (fallbackErr) {
        console.error('Fallback camera failed:', fallbackErr);
      }

      alert(
        'Não foi possível acessar a câmera.\n\n' +
        'Dicas para solucionar:\n' +
        '1. Permita o acesso à câmera nas configurações do navegador.\n' +
        '2. Certifique-se de acessar via HTTPS (https://...).\n' +
        '3. Feche outros aplicativos ou abas que estejam usando a câmera.'
      );
    }
  };

  const stopCamera = async () => {
    if (qrReaderRef.current) {
      try {
        await qrReaderRef.current.stop();
      } catch (e) {
        console.error('Error stopping camera', e);
      }
      qrReaderRef.current = null;
      setScanning(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken) {
      submitCheckin(manualToken);
      setManualToken('');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <i className="fa-solid fa-qrcode text-pink-500"></i> Portaria Digital
          </h1>
          <p className="text-xs text-gray-400 mt-1">Validação de ingressos em tempo real com QR Code único.</p>
        </div>

        <button
          onClick={scanning ? stopCamera : startCamera}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg ${
            scanning
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white glow-green'
          }`}
        >
          {scanning ? 'Desativar Câmera' : 'Ativar Câmera'}
        </button>
      </div>

      {/* Result Display Box (GREEN or RED screen feedback) */}
      {lastResult && (
        <div
          className={`p-6 sm:p-8 rounded-3xl border text-center transition-all shadow-2xl animate-bounce duration-300 ${
            lastResult.success
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-100 glow-green'
              : 'bg-rose-950/90 border-rose-500 text-rose-100 glow-pink'
          }`}
        >
          <div className="text-5xl mb-3">
            {lastResult.success ? '✅' : '❌'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">{lastResult.message}</h2>

          {lastResult.ticket && (
            <div className="mt-4 pt-4 border-t border-white/20 inline-block text-left text-xs space-y-1">
              <p><strong>Titular:</strong> {lastResult.ticket.buyerName}</p>
              <p><strong>Evento:</strong> {lastResult.ticket.eventTitle}</p>
              <p><strong>Ingresso:</strong> {lastResult.ticket.ticketTypeName} ({lastResult.ticket.code})</p>
            </div>
          )}
        </div>
      )}

      {/* Scanner & Manual Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Camera Box */}
        <div className="bg-brandCard p-6 rounded-3xl border border-white/10 text-center">
          <h2 className="text-sm font-bold text-white mb-4">Leitor de Câmera</h2>
          <div id="qr-reader" className="w-full h-64 bg-black rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
            {!scanning && <span className="text-xs text-gray-500">Clique em "Ativar Câmera" para iniciar o scanner</span>}
          </div>
        </div>

        {/* Manual Code Input */}
        <div className="bg-brandCard p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white mb-2">Validação Manual por Código</h2>
            <p className="text-xs text-gray-400 mb-4">Caso o celular do cliente esteja sem bateria ou com tela trincada, insira o token ou código textual do ingresso.</p>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Cole o token ou código PX-2024-..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3.5 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={processing}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
              >
                {processing ? 'Validando...' : 'Validar Ingresso'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-brandCard p-6 rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-base font-bold text-white">Últimas Leituras Realizadas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-gray-400 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Comprador</th>
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Horário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {recentLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2.5 px-3 font-bold">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${log.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {log.success ? 'VÁLIDO' : 'NEGADO'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-white">{log.ticket?.order?.buyerName || 'Desconhecido'}</td>
                  <td className="py-2.5 px-3 font-mono">{log.ticket?.code || '-'}</td>
                  <td className="py-2.5 px-3 text-gray-400">{new Date(log.checkedAt).toLocaleTimeString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
