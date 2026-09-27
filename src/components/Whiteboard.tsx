import React, { useRef, useState, useEffect } from 'react';
import { DataPoint, ExperimentParams } from '../types/lab';
import { Pen, Eraser, RotateCcw, Table, LineChart, Download, Sparkles } from 'lucide-react';

interface WhiteboardProps {
  dataPoints: DataPoint[];
  currentVolume: number;
  currentPH: number;
  params: ExperimentParams;
  onClearData: () => void;
  equivalenceVolume: number;
  isEquivalenceReached: boolean;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  dataPoints,
  currentVolume,
  currentPH,
  params,
  onClearData,
  equivalenceVolume,
  isEquivalenceReached,
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const [activePenColor, setActivePenColor] = useState<string>('#2563eb'); // Blue whiteboard marker
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  // Pen stroke width
  const penSize = isEraser ? 24 : 3;

  // Initialize or handle drawing canvas
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        // preserve existing drawing if any
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx?.drawImage(canvas, 0, 0);

        canvas.width = rect.width;
        canvas.height = rect.height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Freehand drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = penSize;
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = activePenColor;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearDrawingCanvas = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Theoretical calculated concentration
  const calculatedCa =
    currentVolume > 0
      ? Number(((params.baseConcentration * equivalenceVolume) / params.acidVolume).toFixed(4))
      : params.acidConcentration;

  // Chart coordinate mapping
  const chartWidth = 520;
  const chartHeight = 240;
  const maxVolume = 40; // mL
  const maxPH = 14;

  const mapX = (v: number) => 45 + (v / maxVolume) * (chartWidth - 60);
  const mapY = (ph: number) => chartHeight - 35 - (ph / maxPH) * (chartHeight - 55);

  return (
    <div className="relative w-full h-full flex flex-col bg-white text-slate-900 rounded-xl border-4 border-slate-300 shadow-2xl overflow-hidden font-sans select-none">
      {/* Aluminum Whiteboard Top Frame with Screws & Watermark Header */}
      <div className="bg-slate-200 border-b border-slate-300 px-4 py-2.5 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-500 shadow-inner"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-500 shadow-inner"></span>
          </div>

          <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
            <span>السبورة العلمية التفاعلية</span>
            <span className="text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-300">
              تسجيل المعطيات والتحليل البياني
            </span>
          </h3>
        </div>

        {/* PROMINENT WATERMARK: رفيق جلالي */}
        <div className="flex items-center gap-2 bg-white/90 border border-slate-300 px-3 py-1 rounded-md shadow-xs">
          <span className="text-xs font-medium text-slate-500">إشراف وتطوير:</span>
          <span className="text-sm font-extrabold text-blue-700 tracking-wide">
            رفيق جلالي
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Rafik Jellali</span>
        </div>
      </div>

      {/* Whiteboard Controls & Tools Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-20">
        {/* Navigation Tabs (Chart vs Table) */}
        <div className="flex items-center bg-slate-200 p-0.5 rounded-lg border border-slate-300">
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'chart'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>منحنى المعايرة pH = f(V_b)</span>
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'table'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>جدول القياسات ({dataPoints.length})</span>
          </button>
        </div>

        {/* Dry Erase Markers & Eraser Tools */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">أقلام السبورة:</span>

          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 shadow-xs">
            {[
              { color: '#2563eb', name: 'أزرق' },
              { color: '#dc2626', name: 'أحمر' },
              { color: '#16a34a', name: 'أخضر' },
              { color: '#0f172a', name: 'أسود' },
            ].map((pen) => (
              <button
                key={pen.color}
                onClick={() => {
                  setActivePenColor(pen.color);
                  setIsEraser(false);
                }}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  !isEraser && activePenColor === pen.color
                    ? 'scale-110 border-blue-500 ring-2 ring-blue-300'
                    : 'border-slate-300 hover:scale-105'
                }`}
                style={{ backgroundColor: pen.color }}
                title={`قلم ${pen.name}`}
              />
            ))}

            <button
              onClick={() => setIsEraser(true)}
              className={`p-1 rounded transition-colors ${
                isEraser ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' : 'text-slate-500 hover:bg-slate-100'
              }`}
              title="ممحاة السبورة"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={clearDrawingCanvas}
            className="p-1.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-slate-300 transition-colors"
            title="مسح خربشات القلم"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Whiteboard Canvas & White Area */}
      <div className="relative flex-1 w-full bg-white overflow-hidden p-4">
        {/* Subtle Diagonal Repeating Watermark for Rafik Jellali across the Whiteboard */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.045] flex items-center justify-center">
          <div className="transform -rotate-12 text-center">
            <p className="text-5xl md:text-7xl font-extrabold tracking-widest text-slate-900 leading-relaxed uppercase">
              رفيق جلالي
            </p>
            <p className="text-2xl md:text-3xl font-bold tracking-widest text-slate-700 mt-2">
              RAFIK JELLALI VIRTUAL SCIENCE LAB
            </p>
          </div>
        </div>

        {/* Freehand Drawing Overlay Canvas */}
        <canvas
          ref={drawingCanvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="absolute inset-0 w-full h-full z-10 cursor-crosshair"
        />

        {/* Content View: Chart View */}
        {activeTab === 'chart' && (
          <div className="relative z-0 h-full flex flex-col justify-between">
            {/* Upper Section: Chemical Reaction Formula & Equivalence Math */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
              {/* Formula Card */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-blue-700 block mb-1">
                  معادلة تفاعل المعايرة (Reaction Equation):
                </span>
                <p className="font-mono font-bold text-sm text-slate-800 tracking-wide text-left" dir="ltr">
                  {params.acidType === 'HCl'
                    ? 'H₃O⁺ + OH⁻ ⟶ 2 H₂O'
                    : 'CH₃COOH + OH⁻ ⟶ CH₃COO⁻ + H₂O'}
                </p>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  تفاعل حمض قوي مع أساس قوي (تام وسريع)
                </span>
              </div>

              {/* Equivalence Law Card */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-emerald-700 block mb-1">
                  قانون نقطة التكافؤ (Equivalence Relation):
                </span>
                <p className="font-mono font-bold text-sm text-slate-800 text-left" dir="ltr">
                  C_a × V_a = C_b × V_E
                </p>
                <p className="font-mono text-xs text-blue-700 text-left mt-0.5" dir="ltr">
                  C_a = (C_b × V_E) / V_a = ({params.baseConcentration} × {equivalenceVolume.toFixed(1)}) / {params.acidVolume}
                </p>
              </div>

              {/* Real-time State Card */}
              <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-900">القياس اللحظي:</span>
                  {isEquivalenceReached && (
                    <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <Sparkles className="w-3 h-3" /> نقطة التكافؤ E
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-3 mt-1">
                  <div>
                    <span className="text-xs text-slate-500">الحجم المضاف V_b:</span>
                    <span className="font-mono font-bold text-lg text-slate-900 mr-1.5">
                      {currentVolume.toFixed(2)} <small className="text-xs font-normal">mL</small>
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">قيمة pH:</span>
                    <span className="font-mono font-bold text-lg text-blue-700 mr-1.5">
                      {currentPH.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Titration Curve Graph (SVG) */}
            <div className="flex-1 w-full bg-slate-50/80 rounded-lg border border-slate-200 p-2 relative overflow-hidden flex flex-col justify-center">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full max-h-56">
                {/* Background Grid Lines */}
                {[0, 2, 4, 6, 8, 10, 12, 14].map((ph) => {
                  const y = mapY(ph);
                  return (
                    <g key={ph}>
                      <line x1="45" y1={y} x2={chartWidth - 15} y2={y} stroke="#e2e8f0" strokeDasharray="3,3" />
                      <text x="35" y={y + 4} textAnchor="end" fontSize="10" fill="#64748b" fontFamily="monospace">
                        {ph}
                      </text>
                    </g>
                  );
                })}

                {[0, 10, 20, 30, 40].map((v) => {
                  const x = mapX(v);
                  return (
                    <g key={v}>
                      <line x1={x} y1={mapY(14)} x2={x} y2={mapY(0)} stroke="#e2e8f0" strokeDasharray="3,3" />
                      <text x={x} y={chartHeight - 18} textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="monospace">
                        {v}
                      </text>
                    </g>
                  );
                })}

                {/* Axes */}
                <line x1="45" y1={mapY(0)} x2={chartWidth - 15} y2={mapY(0)} stroke="#475569" strokeWidth="1.8" />
                <line x1="45" y1={mapY(14)} x2="45" y2={mapY(0)} stroke="#475569" strokeWidth="1.8" />

                {/* Axis Labels */}
                <text x={chartWidth - 20} y={mapY(0) + 16} textAnchor="end" fontSize="11" fontWeight="bold" fill="#334155">
                  V_b (mL)
                </text>
                <text x="25" y={mapY(14) - 2} textAnchor="start" fontSize="11" fontWeight="bold" fill="#334155">
                  pH
                </text>

                {/* Equivalence Vertical Line */}
                <line
                  x1={mapX(equivalenceVolume)}
                  y1={mapY(14)}
                  x2={mapX(equivalenceVolume)}
                  y2={mapY(0)}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                <text
                  x={mapX(equivalenceVolume) + 4}
                  y={mapY(14) + 12}
                  fontSize="10"
                  fontWeight="bold"
                  fill="#059669"
                >
                  V_E = {equivalenceVolume} mL
                </text>

                {/* Parallel Tangents Illustration (طريقة المماسات المتوازية) */}
                {dataPoints.length > 5 && (
                  <g opacity="0.6">
                    {/* Tangent 1 before jump */}
                    <line
                      x1={mapX(equivalenceVolume - 6)}
                      y1={mapY(3.8)}
                      x2={mapX(equivalenceVolume + 4)}
                      y2={mapY(4.5)}
                      stroke="#8b5cf6"
                      strokeWidth="1.2"
                      strokeDasharray="2,2"
                    />
                    {/* Tangent 2 after jump */}
                    <line
                      x1={mapX(equivalenceVolume - 4)}
                      y1={mapY(10.2)}
                      x2={mapX(equivalenceVolume + 6)}
                      y2={mapY(10.9)}
                      stroke="#8b5cf6"
                      strokeWidth="1.2"
                      strokeDasharray="2,2"
                    />
                  </g>
                )}

                {/* Curve connecting recorded data points */}
                {dataPoints.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    points={dataPoints.map((pt) => `${mapX(pt.volumeBase)},${mapY(pt.pH)}`).join(' ')}
                  />
                )}

                {/* Data point dots */}
                {dataPoints.map((pt) => (
                  <circle
                    key={pt.id}
                    cx={mapX(pt.volumeBase)}
                    cy={mapY(pt.pH)}
                    r="4"
                    fill={pt.colorHex}
                    stroke="#1e3a8a"
                    strokeWidth="1.5"
                  />
                ))}

                {/* Current Live point marker */}
                <circle
                  cx={mapX(currentVolume)}
                  cy={mapY(currentPH)}
                  r="6"
                  fill="#ef4444"
                  className="animate-pulse"
                />

                {/* Equivalence point mark */}
                {isEquivalenceReached && (
                  <g>
                    <circle
                      cx={mapX(equivalenceVolume)}
                      cy={mapY(7.0)}
                      r="7"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={mapX(equivalenceVolume) + 8}
                      y={mapY(7.0) - 8}
                      fontSize="11"
                      fontWeight="bold"
                      fill="#047857"
                    >
                      E (V_E={equivalenceVolume}, pH=7)
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>
        )}

        {/* Content View: Data Table View */}
        {activeTab === 'table' && (
          <div className="relative z-0 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                سجل الملاحظات والقياسات المخبرية:
              </span>
              <button
                onClick={onClearData}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors"
              >
                تفريغ الجدول
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-2 font-bold">#</th>
                    <th className="p-2 font-bold">الحجم المضاف V_b (mL)</th>
                    <th className="p-2 font-bold">قيمة pH</th>
                    <th className="p-2 font-bold">لون المحلول</th>
                    <th className="p-2 font-bold">سُجل بواسطة</th>
                    <th className="p-2 font-bold">الملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {dataPoints.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 font-sans">
                        لم يتم تسجيل أي نقطة قياس بعد. اضغط على "تسجيل النقطة" في لوحة التحكم.
                      </td>
                    </tr>
                  ) : (
                    dataPoints.map((pt, idx) => (
                      <tr key={pt.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-2 text-slate-500 font-sans">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">{pt.volumeBase.toFixed(2)}</td>
                        <td className="p-2 font-bold text-blue-600">{pt.pH.toFixed(2)}</td>
                        <td className="p-2 font-sans">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs"
                              style={{ backgroundColor: pt.colorHex }}
                            />
                            <span className="text-[11px] text-slate-600">{pt.notes}</span>
                          </div>
                        </td>
                        <td className="p-2 font-sans">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              pt.recordedBy === 'ai'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {pt.recordedBy === 'ai' ? 'المساعد الذكي' : 'الطالب'}
                          </span>
                        </td>
                        <td className="p-2 text-slate-400 text-[11px]">{pt.timestamp}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Aluminum Bottom Tray with Dry Erase Marker Props */}
      <div className="bg-slate-200 border-t border-slate-300 px-4 py-1.5 flex items-center justify-between text-xs text-slate-600 z-20">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500">حامل الأقلام والممحاة السفلي</span>
          <span className="w-12 h-2.5 bg-blue-600 rounded-sm shadow-xs inline-block"></span>
          <span className="w-12 h-2.5 bg-rose-600 rounded-sm shadow-xs inline-block"></span>
          <span className="w-12 h-2.5 bg-slate-900 rounded-sm shadow-xs inline-block"></span>
        </div>

        <span className="text-[11px] font-semibold text-slate-500">
          مختبر العلوم الافتراضي — منصة التعلم التجريبي عن بعد
        </span>
      </div>
    </div>
  );
};
