import React from 'react';
import { ControlMode, ExperimentParams, FlowRate, IndicatorType } from '../types/lab';
import {
  User,
  Bot,
  Users,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Calculator,
  Volume2,
  Droplet,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Beaker,
} from 'lucide-react';

interface DualControlPanelProps {
  controlMode: ControlMode;
  onSetControlMode: (mode: ControlMode) => void;
  isFlowing: boolean;
  flowRate: FlowRate;
  onSetFlowRate: (rate: FlowRate) => void;
  onAddOneDrop: () => void;
  onToggleFlow: () => void;
  onRefillBurette: () => void;
  isStirrerActive: boolean;
  stirrerRpm: number;
  onToggleStirrer: () => void;
  onSetStirrerRpm: (rpm: number) => void;
  indicator: IndicatorType;
  indicatorDrops: number;
  onAddIndicatorDrop: () => void;
  onRecordDataPoint: () => void;
  onResetFlask: () => void;
  // AI Controls
  onAiExecuteStep: () => void;
  onAiAutoTitrateToEquivalence: () => void;
  onAiFullScanCurve: () => void;
  onAiCalculateConcentration: () => void;
  onAiSpeakGuidance: () => void;
  isAiProcessing: boolean;
  // Lab Info
  currentVolume: number;
  currentPH: number;
  solutionColorName: string;
  isEquivalenceReached: boolean;
  params: ExperimentParams;
}

export const DualControlPanel: React.FC<DualControlPanelProps> = ({
  controlMode,
  onSetControlMode,
  isFlowing,
  flowRate,
  onSetFlowRate,
  onAddOneDrop,
  onToggleFlow,
  onRefillBurette,
  isStirrerActive,
  stirrerRpm,
  onToggleStirrer,
  onSetStirrerRpm,
  indicator,
  indicatorDrops,
  onAddIndicatorDrop,
  onRecordDataPoint,
  onResetFlask,
  onAiExecuteStep,
  onAiAutoTitrateToEquivalence,
  onAiFullScanCurve,
  onAiCalculateConcentration,
  onAiSpeakGuidance,
  isAiProcessing,
  currentVolume,
  currentPH,
  solutionColorName,
  isEquivalenceReached,
  params,
}) => {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Control Authority Switcher (التحكم من طرفي أنا وانت) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">جهة التحكم بالتجربة:</span>
        </div>

        {/* 3 Segmented Control Modes */}
        <div className="grid grid-cols-3 gap-1 w-full sm:w-auto bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onSetControlMode('user')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              controlMode === 'user'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>تحكمي أنا (يدوي)</span>
          </button>

          <button
            onClick={() => onSetControlMode('collaborative')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              controlMode === 'collaborative'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>مشترك (أنا وأنت)</span>
          </button>

          <button
            onClick={() => onSetControlMode('ai')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              controlMode === 'ai'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>تحكمك أنت (المعلم AI)</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SECTION 1: Manual Controls (تحكمي أنا) */}
        <div
          className={`flex flex-col gap-3 p-3.5 rounded-xl border transition-all ${
            controlMode === 'user' || controlMode === 'collaborative'
              ? 'bg-slate-950/80 border-blue-500/40'
              : 'bg-slate-950/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>أدوات التحكم المخبري اليدوي (تحكم الطالب)</span>
            </h4>
            <span className="text-[11px] text-slate-500">سحاحة، محرك، كواشف</span>
          </div>

          {/* Burette Flow Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">صنبور السحاحة (Burette Stopcock):</span>
              <span
                className={`font-mono font-bold text-xs ${
                  isFlowing ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
                }`}
              >
                {isFlowing ? `مفتوح (${flowRate})` : 'مغلق'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={onAddOneDrop}
                className="px-2 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-300 rounded-lg border border-slate-700 transition-all flex flex-col items-center justify-center gap-0.5"
                title="إضافة 0.05 mL"
              >
                <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px]">قطرة واحدة</span>
              </button>

              <button
                onClick={() => onSetFlowRate('slow')}
                className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5 ${
                  isFlowing && flowRate === 'slow'
                    ? 'bg-blue-600 border-blue-400 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span className="text-[10px]">بطيء (0.5 mL/s)</span>
              </button>

              <button
                onClick={() => onSetFlowRate('fast')}
                className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5 ${
                  isFlowing && flowRate === 'fast'
                    ? 'bg-amber-600 border-amber-400 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span className="text-[10px]">سريع (2 mL/s)</span>
              </button>

              <button
                onClick={onToggleFlow}
                className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5 ${
                  isFlowing
                    ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400'
                }`}
              >
                <Pause className="w-3.5 h-3.5" />
                <span className="text-[10px]">{isFlowing ? 'إيقاف الصنبور' : 'إغلاق'}</span>
              </button>
            </div>
          </div>

          {/* Magnetic Stirrer & Indicator Controls */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
            {/* Magnetic Stirrer */}
            <div className="space-y-1.5 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">المحرك المغناطيسي:</span>
                <button
                  onClick={onToggleStirrer}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    isStirrerActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isStirrerActive ? 'شغال ON' : 'متوقف OFF'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={stirrerRpm}
                  onChange={(e) => onSetStirrerRpm(Number(e.target.value))}
                  disabled={!isStirrerActive}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                  {stirrerRpm} RPM
                </span>
              </div>
            </div>

            {/* Indicator Dropper */}
            <div className="space-y-1.5 bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">كاشف الفينول فتالين:</span>
                <span className="text-[10px] font-mono text-pink-400">
                  {indicatorDrops} قطرات
                </span>
              </div>

              <button
                onClick={onAddIndicatorDrop}
                className="w-full py-1 text-xs font-bold text-pink-300 bg-pink-950/40 hover:bg-pink-900/60 active:scale-95 border border-pink-800/40 rounded transition-all flex items-center justify-center gap-1.5"
              >
                <Droplet className="w-3.5 h-3.5 text-pink-400" />
                <span>إضافة قطرة كاشف</span>
              </button>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onRecordDataPoint}
              className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>تسجيل النقطة في السبورة</span>
            </button>

            <button
              onClick={onRefillBurette}
              className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
              title="إعادة ملء السحاحة إلى 0.00 mL"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ملء السحاحة</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: AI Lab Partner & Guided Controls (تحكمك أنت / المعلم الذكي) */}
        <div
          className={`flex flex-col gap-3 p-3.5 rounded-xl border transition-all ${
            controlMode === 'ai' || controlMode === 'collaborative'
              ? 'bg-slate-950/80 border-purple-500/40'
              : 'bg-slate-950/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              <span>تحكم المعلم الافتراضي والذكاء الاصطناعي (تحكمك أنت)</span>
            </h4>
            <span className="text-[11px] text-slate-500">معايرة ذاتية، توجيه صوتي</span>
          </div>

          {/* AI Automated Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onAiAutoTitrateToEquivalence}
              disabled={isAiProcessing}
              className="p-2.5 text-xs font-bold text-purple-200 bg-purple-950/50 hover:bg-purple-900/70 border border-purple-700/50 rounded-lg transition-all flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>معايرة دقيقة لنقطة التكافؤ E</span>
              <span className="text-[10px] font-normal text-purple-300/80">توقف تلقائي عند تغير اللون</span>
            </button>

            <button
              onClick={onAiFullScanCurve}
              disabled={isAiProcessing}
              className="p-2.5 text-xs font-bold text-cyan-200 bg-cyan-950/50 hover:bg-cyan-900/70 border border-cyan-700/50 rounded-lg transition-all flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95"
            >
              <Beaker className="w-4 h-4 text-cyan-400" />
              <span>مسح ورسم كامل المنحنى</span>
              <span className="text-[10px] font-normal text-cyan-300/80">تسجيل 15 نقطة دفعة واحدة</span>
            </button>
          </div>

          {/* AI Voice & Calculations */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onAiCalculateConcentration}
              disabled={isAiProcessing}
              className="py-2 px-3 text-xs font-bold text-emerald-200 bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-700/50 rounded-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span>حساب التركيز المجهول C_a</span>
            </button>

            <button
              onClick={onAiSpeakGuidance}
              className="py-2 px-3 text-xs font-bold text-amber-200 bg-amber-950/50 hover:bg-amber-900/70 border border-amber-700/50 rounded-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>شرح الخطوة صوتياً</span>
            </button>
          </div>

          {/* AI Real-time Supervisor Advice (Co-pilot guidance) */}
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg flex items-start gap-2.5">
            <div className="p-1 rounded bg-purple-900/50 text-purple-300 shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-purple-300 block mb-0.5">
                ملاحظة المعلم الافتراضي:
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {indicatorDrops === 0
                  ? 'لم تتم إضافة كاشف الفينول فتالين بعد! أضف قطرتين لمراقبة تغير اللون عند التكافؤ.'
                  : !isStirrerActive
                  ? 'يُستحسن تشغيل المحرك المغناطيسي لضمان تجانس المحلول وسرعة تفاعل شوارد H3O+ مع OH-.'
                  : currentVolume < 16
                  ? 'المحلول حمضي (pH < 7). يمكنك إضافة الأساس بمعدل سريع، ثم خفف التدفق عند الاقتراب من 20 mL.'
                  : currentVolume >= 19 && currentVolume <= 20.5
                  ? 'انتبه جيداً! نحن في منطقة القفزة الـ pH ونقطة التكافؤ. أضف قطرة واحدة تلو الأخرى حتى يثبت اللون الوردي الباهت!'
                  : 'تم تجاوز نقطة التكافؤ، المحلول أصبح قاعدياً وفائض من شوارد الهيدروكسيد OH-.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
