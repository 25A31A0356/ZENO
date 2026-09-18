import React, { useState, useRef, useEffect } from 'react';
import { useZeno } from '../context/ZenoContext';
import { api } from '../services/api';
import { audioService } from '../services/audio';
import { Eye, Camera, CameraOff, Sparkles, Zap } from 'lucide-react';

export const VisionPage: React.FC = () => {
  const { showToast, settings } = useZeno();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [visionQuestion, setVisionQuestion] = useState('What is this?');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visionResult, setVisionResult] = useState<{ answer: string; latencyMs: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      showToast('Camera stream active', 'info');
    } catch (e) {
      showToast('Could not access camera. Please check browser permissions.', 'warning');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      setVisionResult(null);
      showToast('Frame captured! Ask your question below.', 'success');
    }
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    try {
      const res = await api.analyzeVision(capturedImage, visionQuestion);
      setVisionResult({ answer: res.answer, latencyMs: res.responseTimeMs });
      audioService.speak(res.answer, settings?.speechSpeed || 1.0);
      showToast('Vision analysis complete', 'success');
    } catch (e) {
      showToast('Vision analysis failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-3">
          <Eye className="w-8 h-8 text-cyan-400" />
          ZENO VISION (OPTIONAL)
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Capture objects and environment photos for multimodal AI inspection.
        </p>
      </div>

      <div className="zeno-card p-6 sm:p-8 space-y-6">
        {/* Camera Control Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Camera className="w-4 h-4 text-cyan-400" />
            Visual Sensor Stream
          </div>

          <button
            onClick={isCameraActive ? stopCamera : startCamera}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              isCameraActive
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                : 'zeno-btn-primary'
            }`}
          >
            {isCameraActive ? (
              <>
                <CameraOff className="w-4 h-4" />
                Stop Camera
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Start Camera
              </>
            )}
          </button>
        </div>

        {/* Viewfinder / Capture Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Live Stream View */}
          <div className="relative aspect-video rounded-2xl bg-[#0c0e12] border border-[#242c3f] overflow-hidden flex flex-col items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
            />
            {!isCameraActive && (
              <div className="text-center p-6 text-slate-500 space-y-2">
                <Camera className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-xs">Camera is offline</p>
                <p className="text-[11px] text-slate-600">Press "Start Camera" to enable optical sensor</p>
              </div>
            )}

            {isCameraActive && (
              <button
                onClick={captureFrame}
                className="absolute bottom-4 z-10 px-5 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-xl shadow-cyan-500/30 flex items-center gap-2 active:scale-95 transition-all"
              >
                <Camera className="w-4 h-4" />
                Capture Snapshot
              </button>
            )}
          </div>

          {/* Captured Snapshot Preview */}
          <div className="relative aspect-video rounded-2xl bg-[#0c0e12] border border-[#242c3f] overflow-hidden flex flex-col items-center justify-center">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured Snapshot"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 text-slate-500">
                <Eye className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-xs">No snapshot captured</p>
                <p className="text-[11px] text-slate-600">Capture a frame to ask ZENO questions</p>
              </div>
            )}
          </div>
        </div>

        {/* Question & Vision Inspection */}
        {capturedImage && (
          <div className="p-6 rounded-2xl bg-[#0e111a] border border-[#242c3f] space-y-4 animate-in fade-in duration-200">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              What do you want ZENO to identify?
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={visionQuestion}
                onChange={e => setVisionQuestion(e.target.value)}
                placeholder='e.g. "What is this component?" or "Describe this object."'
                className="flex-1 bg-[#141824] border border-[#2d374d] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="zeno-btn-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl"
              >
                <Sparkles className="w-4 h-4" />
                {isAnalyzing ? 'Analyzing...' : 'Ask ZENO'}
              </button>
            </div>

            {/* Vision Response Display */}
            {visionResult && (
              <div className="mt-4 p-5 rounded-xl bg-cyan-950/20 border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-cyan-400 uppercase tracking-wider">
                    ZENO Vision Assessment
                  </span>
                  <span className="font-mono text-amber-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {(visionResult.latencyMs / 1000).toFixed(2)}s
                  </span>
                </div>
                <p className="text-sm text-slate-100 leading-relaxed font-sans">
                  "{visionResult.answer}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
