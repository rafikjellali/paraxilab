import React from 'react';
import { ControlMode, FlowRate } from '../types/lab';
import {
  Droplet,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Users,
  CheckCircle2,
  LineChart,
  Volume2,
} from 'lucide-react';

interface CompactControlsBarProps {
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
  indicatorDrops: number;
  onAddIndicatorDrop: () => void;
  onRecordDataPoint: () => void;
  onAiAutoTitrate: () => void;
  onAiFullScan: () => void;
  onAiSpeakGuidance: () => void;
  isAiProcessing: boolean;
  isWhiteboardOpen: boolean;
  onToggleWhiteboard: () => void;
}

export const CompactControlsBar: React.FC<CompactControlsBarProps> = ({
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
  indicatorDrops,
  onAddIndicatorDrop,
  onRecordDataPoint,
  onAiAutoTitrate,
  onAiFullScan,
  onAiSpeakGuidance,
  isAiProcessing,
  isWhiteboardOpen,
  onToggleWhiteboard,
}) => {
  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-xs flex flex-col gap-2">
      {/* Top Row: Direct Operational Buttons (Small & Compact) */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        {/* Burette Controls Group */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button
            onClick={onAddOneDrop}
            className="px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-md transition-all flex items-center gap-1 shadow-xs"
            title="إضافة قطرة واحدة (0.05 mL)"
          >
            <Droplet className="w-3.5 h-3.5 text-cyan-200" />
            <span>قطرة (0.05 mL)</span>
          </button>

          <button
            onClick={onToggleFlow}
            className={`px-2.5 py-1 text-xs font-bold text-white rounded-md transition-all flex items-center gap-1 shadow-xs active:scale-95 ${
              isFlowing ? 'bg-rose-600 hover:bg-rose-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {isFlowing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isFlowing ? 'إيقاف الصنبور' : 'فتح الصنبور'}</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-0.5 bg-slate-200/70 p-0.5 rounded">
            <button
              onClick={() => onSetFlowRate('slow')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                flowRate === 'slow' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              بطيء
            </button>
            <button
              onClick={() => onSetFlowRate('fast')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                flowRate === 'fast' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سريع
            </button>
          </div>

          <button
            onClick={onRefillBurette}
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
            title="إعادة ملء السحاحة إلى 0.00 mL"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Magnetic Stirrer Group */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button
            onClick={onToggleStirrer}
            className={`px-2 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
              isStirrerActive
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isStirrerActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>المحرك: {isStirrerActive ? 'ON' : 'OFF'}</span>
          </button>

          <input
            type="range"
            min="100"
            max="1000"
            step="50"
            value={stirrerRpm}
            onChange={(e) => onSetStirrerRpm(Number(e.target.value))}
            disabled={!isStirrerActive}
            className="w-16 h-1.5 bg-slate-300 rounded appearance-none cursor-pointer accent-blue-600"
            title={`سرعة التحريك: ${stirrerRpm} RPM`}
          />
          <span className="text-[10px] font-mono text-slate-500">{stirrerRpm}</span>
        </div>

        {/* Indicator Dropper */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button
            onClick={onAddIndicatorDrop}
            className="px-2.5 py-1 text-xs font-bold text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-md transition-all flex items-center gap-1"
            title="إضافة قطرة من كاشف الفينول فتالين"
          >
            <Droplet className="w-3.5 h-3.5 text-pink-500" />
            <span>+ قطرة كاشف ({indicatorDrops})</span>
          </button>
        </div>

        {/* Record Point */}
        <button
          onClick={onRecordDataPoint}
          className="px-3 py-1 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-95 border border-slate-300 rounded-lg transition-all flex items-center gap-1 shadow-xs"
          title="تسجيل النقطة الحالية في جدول السبورة"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          <span>تسجيل النقطة</span>
        </button>

        {/* Whiteboard Side Drawer Toggle */}
        <button
          onClick={onToggleWhiteboard}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-xs ${
            isWhiteboardOpen
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
          }`}
        >
          <LineChart className="w-3.5 h-3.5" />
          <span>{isWhiteboardOpen ? 'إخفاء السبورة' : 'عرض السبورة والمنحنى'}</span>
        </button>
      </div>

      {/* Bottom Sub-row: Dual Authority (Me & You) + AI Automation Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 text-xs">
        {/* Authority Selector (التحكم من طرفي أنا وانت) */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold text-slate-500 ml-1">جهة التحكم:</span>
          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => onSetControlMode('user')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors flex items-center gap-1 ${
                controlMode === 'user' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3 h-3" />
              <span>تحكمي أنا</span>
            </button>
            <button
              onClick={() => onSetControlMode('collaborative')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors flex items-center gap-1 ${
                controlMode === 'collaborative' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>مشترك</span>
            </button>
            <button
              onClick={() => onSetControlMode('ai')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors flex items-center gap-1 ${
                controlMode === 'ai' ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-3 h-3" />
              <span>تحكمك أنت (AI)</span>
            </button>
          </div>
        </div>

        {/* AI Quick Automation Helpers */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onAiAutoTitrate}
            disabled={isAiProcessing}
            className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 border border-purple-200 rounded-md transition-all flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" />
            <span>معايرة آلية لنقطة التكافؤ E</span>
          </button>

          <button
            onClick={onAiFullScan}
            disabled={isAiProcessing}
            className="px-2.5 py-1 text-[11px] font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 disabled:opacity-50 border border-cyan-200 rounded-md transition-all flex items-center gap-1"
          >
            <LineChart className="w-3 h-3 text-cyan-600" />
            <span>مسح ورسم كامل المنحنى</span>
          </button>

          <button
            onClick={onAiSpeakGuidance}
            className="px-2 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-all flex items-center gap-1"
            title="الشرح الصوتي والتوجيه العلمي"
          >
            <Volume2 className="w-3 h-3 text-amber-600" />
            <span>توجيه صوتي</span>
          </button>
        </div>
      </div>
    </div>
  );
};
