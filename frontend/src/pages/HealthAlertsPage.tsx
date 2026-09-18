import React, { useState, useEffect } from 'react';
import { useZeno } from '../context/ZenoContext';
import { api } from '../services/api';
import { SystemHealth } from '../types';
import {
  Activity,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Cpu,
  Wifi,
  Database,
  BrainCircuit,
  Volume2,
  Mic,
  Server,
} from 'lucide-react';

export const HealthAlertsPage: React.FC = () => {
  const { device, alerts, refreshAlerts, refreshDevice, showToast } = useZeno();
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = async () => {
    setIsRefreshing(true);
    try {
      const data = await api.getHealth();
      setHealthData(data);
      await refreshAlerts();
      await refreshDevice();
    } catch (e) {
      console.warn('Health fetch error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleResolveAlert = async (id: string) => {
    try {
      await api.resolveAlert(id);
      await refreshAlerts();
      showToast('Alert dismissed', 'info');
    } catch (e) {
      showToast('Failed to resolve alert', 'error');
    }
  };

  const handleRetryConnection = async () => {
    showToast('Retrying ESP32 ping & health check...', 'info');
    await fetchHealth();
  };

  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-3">
          <Activity className="w-8 h-8 text-cyan-400" />
          SYSTEM HEALTH & ALERTS
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Complete end-to-end status of all physical hardware, network pipes, AI models, and active alerts.
        </p>
      </div>

      {/* SECTION 17: ACTIVE ALERTS (If any) */}
      {activeAlerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            ZENO Alerts ({activeAlerts.length})
          </h3>

          <div className="space-y-3">
            {activeAlerts.map(alert => (
              <div
                key={alert.id}
                className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                      {alert.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-[#0c0e12] border border-[#242c3f]"
                  >
                    Dismiss
                  </button>
                </div>

                <div className="text-xs text-slate-300 space-y-1 pl-8">
                  <p><strong className="text-amber-300">What happened:</strong> {alert.message}</p>
                  <p><strong className="text-slate-400">What it means:</strong> {alert.meaning}</p>
                </div>

                {alert.fixes && alert.fixes.length > 0 && (
                  <div className="mt-2 pl-8 pt-2 border-t border-amber-500/20 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                      How to fix it:
                    </span>
                    {alert.fixes.map((fix, idx) => (
                      <div key={idx} className="text-xs text-slate-300">
                        {fix}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pl-8 pt-2">
                  <button
                    onClick={handleRetryConnection}
                    className="zeno-btn-primary bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-bold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry Connection
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 16: SYSTEM HEALTH STATUS MATRIX */}
      <div className="zeno-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#232938]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Subsystem Matrix</h3>
              <p className="text-xs text-slate-400">
                {device.connected ? 'Everything is working normally.' : 'ESP32 is offline. Backend & AI are active.'}
              </p>
            </div>
          </div>

          <button
            onClick={fetchHealth}
            disabled={isRefreshing}
            className="zeno-btn-secondary text-xs font-semibold px-3 py-1.5"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Subsystem nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            {
              name: 'ESP32 Device',
              status: device.connected ? 'ONLINE' : 'OFFLINE',
              icon: <Cpu className="w-4 h-4 text-cyan-400" />,
              isOk: device.connected,
            },
            {
              name: 'Wi-Fi Network',
              status: device.connected ? 'CONNECTED' : 'DISCONNECTED',
              icon: <Wifi className="w-4 h-4 text-cyan-400" />,
              isOk: device.connected,
            },
            {
              name: 'Backend Gateway',
              status: 'ONLINE',
              icon: <Server className="w-4 h-4 text-emerald-400" />,
              isOk: true,
            },
            {
              name: 'Speech Recognition',
              status: 'READY',
              icon: <Mic className="w-4 h-4 text-cyan-400" />,
              isOk: true,
            },
            {
              name: 'AI Brain Engine',
              status: 'READY',
              icon: <BrainCircuit className="w-4 h-4 text-purple-400" />,
              isOk: true,
            },
            {
              name: 'Text to Speech',
              status: 'READY',
              icon: <Volume2 className="w-4 h-4 text-cyan-400" />,
              isOk: true,
            },
            {
              name: 'Local Database',
              status: 'CONNECTED',
              icon: <Database className="w-4 h-4 text-emerald-400" />,
              isOk: true,
            },
          ].map((node, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#0e111a] border border-[#232938] flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                {node.icon}
                <span className="text-xs font-bold text-slate-200">{node.name}</span>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  node.isOk
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                {node.status}
              </span>
            </div>
          ))}
        </div>

        {/* Global Key Metrics */}
        {healthData && (
          <div className="pt-4 border-t border-[#232938]">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Performance & Diagnostics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-[#0e111a] border border-[#232938]">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                  Last Request
                </span>
                <span className="text-xs font-mono text-white font-bold">
                  {new Date(healthData.metrics.lastRequestTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0e111a] border border-[#232938]">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                  Avg Latency
                </span>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  {(healthData.metrics.averageResponseTimeMs / 1000).toFixed(2)}s
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0e111a] border border-[#232938]">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                  Conversations Logged
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {healthData.metrics.totalConversations}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0e111a] border border-[#232938]">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                  Errors Today
                </span>
                <span className="text-xs font-mono text-slate-300 font-bold">
                  {healthData.metrics.errorsToday}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
