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

  const [cameraDevices, setCameraDevices] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    ensureAuth();
    fetchRecent();
    loadCameras();

    return () => {
      if (qrReaderRef.current) {
        try {
          qrReaderRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const ensureAuth = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('projetox_token') : null;
    if (!token) {
      try {
        const res = await api.post('/auth/login', {
          email: 'portaria@projetox.com',
          password: 'Operador123!',
        });
        if (res.data?.token) {
          localStorage.setItem('projetox_token', res.data.token);
          localStorage.setItem('projetox_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error('Auto login portaria failed', err);
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

  const loadCameras = async () => {
    try {
      if (typeof window !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((t) => t.stop());
        } catch (_) {}
      }

      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const formatted = devices.map((d, index) => ({
          id: d.id,
          label: d.label || `Câmera ${index + 1}`,
        }));
        setCameraDevices(formatted);

        const backCam = formatted.find((d) => {
          const l = d.label.toLowerCase();
          return l.includes('back') || l.includes('traseira') || l.includes('rear') || l.includes('environment');
        });
        setSelectedCameraId(backCam ? backCam.id : formatted[0].id);
      }
    } catch (err: any) {
      console.warn('Could not enumerate cameras:', err);
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
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (_) {}

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
        try {
          const authRes = await api.post('/auth/login', {
            email: 'portaria@projetox.com',
            password: 'Operador123!',
          });
          if (authRes.data?.token) {
            localStorage.setItem('projetox_token', authRes.data.token);
            localStorage.setItem('projetox_user', JSON.stringify(authRes.data.user));
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
    setCameraError(null);

    // Stop existing instance if scanning
    if (qrReaderRef.current) {
      try {
        await qrReaderRef.current.stop();
      } catch (_) {}
      qrReaderRef.current = null;
    }

    try {
      // 1. Check if browser supports camera API
      if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
        setCameraError('Seu navegador não possui suporte para uso da câmera.');
        return;
      }

      // 2. Request media permissions natively
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch (err: any) {
        if (err.name === 'NotFoundError' || err.message?.includes('Requested device not found')) {
          setCameraError('Nenhuma câmera física detectada no seu computador. Você pode realizar o check-in normalmente digitando o código do ingresso no painel de Validação Manual.');
          return;
        }
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Permissão negada pelo navegador. Clique no ícone de CÂMERA/CADEADO na barra de endereço para PERMITIR a câmera.');
          return;
        }
      }

      const html5QrCode = new Html5Qrcode('qr-reader');
      qrReaderRef.current = html5QrCode;

      const qrboxCalc = (w: number, h: number) => {
        const minEdge = Math.min(w, h);
        const boxSize = Math.max(140, Math.floor(minEdge * 0.75));
        return { width: boxSize, height: boxSize };
      };

      const qrConfig = { fps: 10, qrbox: qrboxCalc };

      let cameraTarget: any = selectedCameraId;
      if (!cameraTarget) {
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            cameraTarget = devices[0].id;
          } else {
            cameraTarget = { facingMode: 'environment' };
          }
        } catch (_) {
          cameraTarget = { facingMode: 'environment' };
        }
      }

      await html5QrCode.start(
        cameraTarget,
        qrConfig,
        (decodedText) => {
          submitCheckin(decodedText);
        },
        () => {}
      );

      setScanning(true);
    } catch (err: any) {
      console.error('Camera start failed:', err);

      let msg = 'Não foi possível ativar a câmera.';
      if (err?.name === 'NotFoundError' || err?.message?.includes('Requested device not found')) {
        msg = 'Nenhuma câmera física detectada no seu dispositivo. Utilize a Validação Manual por Código no painel ao lado.';
      } else if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        msg = 'Acesso negado à câmera. Por favor, permita o acesso à câmera nas configurações do seu navegador.';
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        msg = 'A câmera está sendo usada por outro aplicativo (Zoom, Teams, Discord ou outra aba). Feche-o e tente novamente.';
      } else if (typeof err === 'string') {
        msg = err;
      } else if (err?.message) {
        msg = err.message;
      }

      setCameraError(msg);
      setScanning(false);
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
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <i className="fa-solid fa-qrcode text-pink-500"></i> Portaria Digital
          </h1>
          <p className="text-xs text-gray-400 mt-1">Validação de ingressos em tempo real com QR Code único.</p>
        </div>

        <button
          onClick={scanning ? stopCamera : startCamera}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
            scanning
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white glow-green'
          }`}
        >
          <i className={`fa-solid ${scanning ? 'fa-video-slash' : 'fa-camera'}`}></i>
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
        <div className="bg-brandCard p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <i className="fa-solid fa-video text-pink-400"></i> Leitor de Câmera
            </h2>

            {cameraDevices.length > 1 && (
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="bg-black/60 border border-white/15 text-[10px] text-white rounded-lg px-2 py-1 font-semibold focus:outline-none"
              >
                {cameraDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    📷 {d.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Diagnostic Error Box */}
          {cameraError && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <i className="fa-solid fa-circle-info"></i>
                <span>Status da Câmera</span>
              </div>
              <p className="text-[11px] leading-relaxed">{cameraError}</p>
              <button
                onClick={startCamera}
                className="w-full py-2 bg-amber-600/80 hover:bg-amber-500 text-white font-bold text-[11px] uppercase rounded-xl transition-colors"
              >
                <i className="fa-solid fa-rotate-right mr-1"></i> Tentar Novamente
              </button>
            </div>
          )}

          <div
            id="qr-reader"
            className="w-full h-64 bg-black rounded-2xl overflow-hidden border border-white/10 flex flex-col items-center justify-center p-4 text-center"
          >
            {!scanning && !cameraError && (
              <div className="space-y-2">
                <i className="fa-solid fa-camera-retro text-3xl text-pink-500/60 block"></i>
                <span className="text-xs text-gray-400 block font-semibold">
                  Clique em <strong className="text-white">"Ativar Câmera"</strong> para iniciar o scanner QR
                </span>
                <p className="text-[10px] text-gray-500">
                  O navegador solicitará permissão para uso da webcam/câmera.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Manual Code Input */}
        <div className="bg-brandCard p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <i className="fa-solid fa-keyboard text-purple-400"></i> Validação Manual por Código
            </h2>
            <p className="text-xs text-gray-400 mb-4">Caso o computador não possua webcam ou o cliente esteja sem bateria, insira o token ou código textual do ingresso abaixo.</p>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Cole o token ou código PX-2026-..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="w-full bg-black/60 border border-white/15 focus:border-pink-500 rounded-xl p-3.5 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={processing}
                className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-[1.02] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 shadow-lg glow-pink"
              >
                {processing ? 'Validando...' : 'Validar Ingresso'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-brandCard p-6 rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <i className="fa-solid fa-list-check text-green-400"></i> Últimas Leituras Realizadas
        </h2>
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
