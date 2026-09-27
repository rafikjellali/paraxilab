/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Lab3DView } from './components/Lab3DView';
import { Whiteboard } from './components/Whiteboard';
import { CompactControlsBar } from './components/CompactControlsBar';
import { PraxiStepsGuide } from './components/PraxiStepsGuide';
import { LabReportModal } from './components/LabReportModal';
import { InteractiveQuizModal } from './components/InteractiveQuizModal';
import {
  ControlMode,
  DataPoint,
  ExperimentParams,
  FlowRate,
  ProtocolStep,
} from './types/lab';
import { calculatePH, getSolutionColor, getTheoreticalEquivalenceVolume } from './utils/chemistry';
import { labAudio } from './utils/audio';
import {
  FileText,
  HelpCircle,
  RotateCcw,
  Volume2,
  VolumeX,
  LineChart,
  ListOrdered,
  X,
} from 'lucide-react';

const initialParams: ExperimentParams = {
  acidType: 'HCl',
  baseType: 'NaOH',
  acidConcentration: 0.1, // 0.10 mol/L
  acidVolume: 20.0, // 20.0 mL
  baseConcentration: 0.1, // 0.10 mol/L
  indicator: 'phenolphthalein',
  indicatorDrops: 2,
};

const initialSteps: ProtocolStep[] = [
  {
    id: 1,
    title: 'تجهيز المنضدة ومعدات الوقاية',
    instruction: 'تأكد من نظافة الزجاجيات وارتداء معطف المختبر ونظارات الحماية لتجنب رذاذ المواد الكاوية.',
    targetAction: 'safety',
    completed: true,
    scientificConcept: 'السلامة المخبرية شرط أولي قبل البدء في أي عمل تجريبي كيميائي.',
    safetyTip: 'حمض كلور الماء ومحلول الصود مادتان كيميائيتان مخرشتان للجلد والعينين.',
  },
  {
    id: 2,
    title: 'سحب العينة الحمضية بالماصة',
    instruction: 'سحب 20 mL من حمض HCl ذي التركيز المجهول بواسطة ماصة عيارية وتفريغها في الدورق المخروطي.',
    targetAction: 'acid_pipette',
    completed: true,
    scientificConcept: 'استخدام الماصة العيارية يضمن دقة عالية في حجم العينة الابتدائية Va.',
    safetyTip: 'استخدم دائماً إجاصة المص اليدوية ولا تمص أبداً بالفم مباشرة.',
  },
  {
    id: 3,
    title: 'إضافة كاشف الفينول فتالين',
    instruction: 'إضافة قطرتين إلى ثلاث قطرات من كاشف الفينول فتالين في الدورق المخروطي.',
    targetAction: 'indicator',
    completed: true,
    scientificConcept: 'الفينول فتالين يكشف عن نقطة التكافؤ بتغير لونه من عديم اللون إلى الوردي الفاتح.',
    safetyTip: 'تجنب إضافة كمية مفرطة من الكاشف الملون لأن الكواشف نفسها أحماض أو أسس ضعيفة.',
  },
  {
    id: 4,
    title: 'ملء وضبط السحاحة بالأساس',
    instruction: 'ملء السحاحة بمحلول هيدروكسيد الصوديوم NaOH وضبط مستوى التقعر عند التدريجة الصفرية 0.00 mL.',
    targetAction: 'fill_burette',
    completed: true,
    scientificConcept: 'طرد الفقاعات الهوائية من صنبور السحاحة ضروري لضمان دقة الحجم المسكوب.',
    safetyTip: 'املأ السحاحة بمساعدة قمع زجاجي وعلى مستوى أسفل من مستوى العينين.',
  },
  {
    id: 5,
    title: 'تشغيل المحرك والبدء بالمعايرة',
    instruction: 'تشغيل المحرك المغناطيسي لبدء التحريك، ثم فتح الصنبور لإضافة محلول الأساس تدريجياً.',
    targetAction: 'titrate',
    completed: false,
    scientificConcept: 'التحريك المغناطيسي يضمن سرعة وتجانس التفاعل بين H3O+ و OH-.',
    safetyTip: 'اضبط سرعة التحريك بحيث لا يحدث تناثر لقطرات المحلول خارج الدورق.',
  },
  {
    id: 6,
    title: 'رصد نقطة التكافؤ وتثبيت الحجم',
    instruction: 'عند الاقتراب من التكافؤ، أضف الأساس قطرة قطرة حتى يثبت اللون الوردي الباهت لمدة 30 ثانية على الأقل.',
    targetAction: 'equivalence',
    completed: false,
    scientificConcept: 'نقطة التكافؤ هي اللحظة التي تتفاعل فيها شوارد الحمض والأساس بنسب ستوكيومترية متكافئة.',
    safetyTip: 'أغلق الصنبور فور ثبات اللون الوردي وسجل قراءة السحاحة VE.',
  },
  {
    id: 7,
    title: 'استنتاج التركيز وكتابة التقرير',
    instruction: 'تطبيق علاقة التكافؤ Ca = (Cb × VE) / Va واستنتاج التركيز المجهول لحمض كلور الماء.',
    targetAction: 'calculate',
    completed: false,
    scientificConcept: 'المعايرة الحجمية تمكن من التحديد الدقيق لتركيز مجهول انطلاقاً من محلول قياسي.',
    safetyTip: 'اغسل الأدوات الزجاجية بالماء المقطر وأطفئ الأجهزة الكهربائية بعد انتهاء التجربة.',
  },
];

export default function App() {
  // Experiment State
  const [params] = useState<ExperimentParams>(initialParams);
  const [controlMode, setControlMode] = useState<ControlMode>('collaborative');
  const [volumeDispensed, setVolumeDispensed] = useState<number>(0.0);
  const [isFlowing, setIsFlowing] = useState<boolean>(false);
  const [flowRate, setFlowRate] = useState<FlowRate>('slow');
  const [isStirrerActive, setIsStirrerActive] = useState<boolean>(true);
  const [stirrerRpm, setStirrerRpm] = useState<number>(350);
  const [indicatorDrops, setIndicatorDrops] = useState<number>(2);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVRMode, setIsVRMode] = useState<boolean>(false);

  // Protocols & Data
  const [steps, setSteps] = useState<ProtocolStep[]>(initialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(4); // Step 5 (Titration)
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);

  // Panels visibility (Whiteboard & Steps Guide)
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState<boolean>(false);
  const [isStepsGuideOpen, setIsStepsGuideOpen] = useState<boolean>(false);

  // Modals
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isQuizOpen, setIsQuizOpen] = useState<boolean>(false);

  // Flow timer ref
  const flowTimerRef = useRef<number | null>(null);
  const hasTriggeredEquivalenceConfetti = useRef<boolean>(false);

  // Physical Chemistry Calculations
  const currentPH = calculatePH(volumeDispensed, params);
  const solutionColor = getSolutionColor(currentPH, params.indicator, indicatorDrops);
  const theoreticalVeq = getTheoreticalEquivalenceVolume(params);
  const isEquivalenceReached = Math.abs(volumeDispensed - theoreticalVeq) < 0.25;

  // Toggle Sound Mute
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    labAudio.setMuted(next);
  };

  // Stirrer audio effect sync
  useEffect(() => {
    labAudio.updateStirrerSound(isStirrerActive, stirrerRpm);
  }, [isStirrerActive, stirrerRpm]);

  // Equivalence celebration effect
  useEffect(() => {
    if (isEquivalenceReached && !hasTriggeredEquivalenceConfetti.current) {
      hasTriggeredEquivalenceConfetti.current = true;
      labAudio.playSuccessChime();

      try {
        confetti({
          particleCount: 80,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#0284c7', '#38bdf8', '#10b981', '#f43f5e'],
        });
      } catch {
        // ignore
      }

      setSteps((prev) =>
        prev.map((s, idx) => (idx === 4 || idx === 5 ? { ...s, completed: true } : s))
      );
    }
  }, [isEquivalenceReached]);

  // Continuous burette dripping flow loop
  useEffect(() => {
    if (isFlowing) {
      const incrementPerTick = flowRate === 'fast' ? 0.2 : flowRate === 'slow' ? 0.05 : 0.02;
      const tickInterval = flowRate === 'fast' ? 100 : flowRate === 'slow' ? 100 : 250;

      flowTimerRef.current = window.setInterval(() => {
        setVolumeDispensed((prev) => {
          const next = Math.min(50, Number((prev + incrementPerTick).toFixed(2)));
          if (next >= 50) {
            setIsFlowing(false);
          }
          return next;
        });

        if (Math.random() < 0.4) {
          labAudio.playDripSound();
        }
      }, tickInterval);
    } else {
      if (flowTimerRef.current) {
        clearInterval(flowTimerRef.current);
        flowTimerRef.current = null;
      }
    }

    return () => {
      if (flowTimerRef.current) clearInterval(flowTimerRef.current);
    };
  }, [isFlowing, flowRate]);

  // Operational Handlers
  const handleAddOneDrop = () => {
    labAudio.playDripSound();
    setVolumeDispensed((prev) => Math.min(50, Number((prev + 0.05).toFixed(2))));
  };

  const handleToggleFlow = () => {
    labAudio.playClickSound();
    setIsFlowing((prev) => !prev);
  };

  const handleRefillBurette = () => {
    labAudio.playGlassClink();
    setIsFlowing(false);
    setVolumeDispensed(0.0);
    hasTriggeredEquivalenceConfetti.current = false;
  };

  const handleAddIndicatorDrop = () => {
    labAudio.playGlassClink();
    setIndicatorDrops((prev) => prev + 1);
  };

  const handleToggleStirrer = () => {
    labAudio.playClickSound();
    setIsStirrerActive((prev) => !prev);
  };

  const handleRecordDataPoint = (recordedBy: 'user' | 'ai' = 'user') => {
    labAudio.playClickSound();
    const newPt: DataPoint = {
      id: Date.now() + Math.random(),
      volumeBase: volumeDispensed,
      pH: currentPH,
      colorHex: solutionColor.hex,
      notes: solutionColor.nameAr,
      timestamp: new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      recordedBy,
    };
    setDataPoints((prev) => [...prev, newPt]);
  };

  const handleResetFlask = () => {
    labAudio.playGlassClink();
    setIsFlowing(false);
    setVolumeDispensed(0.0);
    setIndicatorDrops(2);
    setDataPoints([]);
    hasTriggeredEquivalenceConfetti.current = false;
  };

  // AI ACTIONS
  const handleAiAutoTitrate = () => {
    setIsAiProcessing(true);
    setIsFlowing(false);
    labAudio.speakArabic('جاري المعايرة الآلية الذكية حتى نقطة التكافؤ بدقة...');

    let current = volumeDispensed;
    const target = theoreticalVeq;

    const interval = window.setInterval(() => {
      current += 0.5;
      if (current >= target) {
        current = target;
        clearInterval(interval);
        setVolumeDispensed(Number(target.toFixed(2)));
        setIsAiProcessing(false);
        labAudio.playSuccessChime();
        labAudio.speakArabic('تم الوصول إلى نقطة التكافؤ بدقة عند حجم عشرين مليلتر.');
        handleRecordDataPoint('ai');
      } else {
        setVolumeDispensed(Number(current.toFixed(2)));
        labAudio.playDripSound();
      }
    }, 60);
  };

  const handleAiFullScan = () => {
    setIsAiProcessing(true);
    setIsFlowing(false);
    labAudio.speakArabic('جاري مسح النقاط التجريبية ورسم منحنى المعايرة كاملاً على السبورة البيضاء.');

    const sampleVolumes = [0, 2, 5, 8, 12, 15, 18, 19.5, 20.0, 20.5, 22, 25, 30, 35, 40];
    const newPoints: DataPoint[] = sampleVolumes.map((vol, idx) => {
      const ph = calculatePH(vol, params);
      const col = getSolutionColor(ph, params.indicator, indicatorDrops);
      return {
        id: Date.now() + idx,
        volumeBase: vol,
        pH: ph,
        colorHex: col.hex,
        notes: col.nameAr,
        timestamp: new Date().toLocaleTimeString('ar-EG'),
        recordedBy: 'ai',
      };
    });

    setTimeout(() => {
      setDataPoints(newPoints);
      setVolumeDispensed(20.0);
      setIsAiProcessing(false);
      labAudio.playSuccessChime();
      setSteps((prev) => prev.map((s) => ({ ...s, completed: true })));
      setIsWhiteboardOpen(true); // Open whiteboard to show the scanned curve
    }, 800);
  };

  const handleAiSpeakGuidance = () => {
    const text = `أهلاً بك في مختبر رفيق جلالي الافتراضي. حجم هيدروكسيد الصوديوم المضاف هو ${volumeDispensed.toFixed(
      1
    )} مليلتر، وقيمة الـ بي إتش الحالية هي ${currentPH.toFixed(2)}. ${
      isEquivalenceReached
        ? 'لقد وصلنا لنقطة التكافؤ وثبت اللون الوردي!'
        : 'واصل إضافة قطرات الأساس تدريجياً.'
    }`;
    labAudio.speakArabic(text);
  };

  return (
    <div className="relative w-screen h-screen flex flex-col bg-slate-100 text-slate-800 overflow-hidden font-sans select-none">
      {/* 1. TOP HEADER: WHITE THEME WITH OPTICAL LUMINOUS WATERMARK */}
      <header className="h-14 bg-white border-b border-slate-200/90 px-4 flex items-center justify-between z-30 shrink-0 shadow-xs">
        {/* Brand & Optical Luminous Watermark in Header */}
        <div className="flex items-center gap-3">
          {/* Luminous Pulsing Watermark Badge */}
          <div className="flex items-center gap-2 bg-slate-50 border border-cyan-300 px-3 py-1 rounded-xl shadow-xs animate-luminous-glow">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-cyan-700 animate-neon-watermark tracking-wide">
                رفيق جلالي
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-600 bg-cyan-100/60 px-1 rounded">
                PraxiLabs VR
              </span>
            </div>
          </div>

          <span className="hidden sm:inline text-xs font-bold text-slate-400">|</span>
          <span className="hidden sm:inline text-xs font-semibold text-slate-600">
            مختبر العلوم الافتراضي التفاعلي
          </span>
        </div>

        {/* Center / Navigation Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsWhiteboardOpen((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs ${
              isWhiteboardOpen
                ? 'bg-blue-600 text-white'
                : 'bg-slate-50 text-blue-700 border border-blue-200 hover:bg-blue-50'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>السبورة والمنحنى</span>
          </button>

          <button
            onClick={() => setIsStepsGuideOpen((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs ${
              isStepsGuideOpen
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>دليل المراحل</span>
          </button>

          <button
            onClick={() => setIsQuizOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-600" />
            <span>اختبار المهارات</span>
          </button>

          <button
            onClick={() => setIsReportOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>تقرير التجربة PDF</span>
          </button>
        </div>

        {/* Right Tools (Mute & Reset) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className={`p-2 rounded-lg border transition-colors ${
              isMuted
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleResetFlask}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="إعادة ضبط التجربة من البداية"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN EXPERIMENT VIEW: TAKES MOST OF THE SCREEN ("حيث تكون التجربة تأخذ معظم الشاشة") */}
      <main className="flex-1 min-h-0 w-full p-2 md:p-3 flex flex-col gap-2 overflow-hidden">
        {/* Stage Container: 3D Lab Experiment (Dominant) + Optional Docked Whiteboard */}
        <div className="flex-1 min-h-0 w-full flex gap-3 overflow-hidden">
          {/* 3D Lab Simulation Canvas (Takes most of the screen) */}
          <div className="flex-1 min-h-0 h-full relative transition-all duration-300">
            <Lab3DView
              volumeDispensed={volumeDispensed}
              solutionColor={solutionColor.hex}
              isStirrerActive={isStirrerActive}
              stirrerRpm={stirrerRpm}
              pH={currentPH}
              indicator={params.indicator}
              indicatorDrops={indicatorDrops}
              isFlowing={isFlowing}
              flowRate={flowRate}
              onAddOneDrop={handleAddOneDrop}
              onToggleFlow={handleToggleFlow}
              isVRMode={isVRMode}
              onToggleVR={() => setIsVRMode((prev) => !prev)}
            />
          </div>

          {/* Dockable Whiteboard (Opens smoothly alongside the 3D lab without hiding it) */}
          {isWhiteboardOpen && (
            <div className="w-full lg:w-[480px] xl:w-[540px] h-full flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
              <div className="relative h-full flex flex-col">
                {/* Close Button on Whiteboard */}
                <button
                  onClick={() => setIsWhiteboardOpen(false)}
                  className="absolute top-2 left-2 z-30 p-1.5 bg-white/90 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-300 shadow-sm transition-colors"
                  title="إغلاق السبورة"
                >
                  <X className="w-4 h-4" />
                </button>

                <Whiteboard
                  dataPoints={dataPoints}
                  currentVolume={volumeDispensed}
                  currentPH={currentPH}
                  params={params}
                  onClearData={() => setDataPoints([])}
                  equivalenceVolume={theoreticalVeq}
                  isEquivalenceReached={isEquivalenceReached}
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. COMPACT CONTROLS BAR: DIRECTLY UNDERNEATH THE EXPERIMENT ("وازرار التحكم تحتها بالضبط صغيرة") */}
        <div className="shrink-0 w-full">
          <CompactControlsBar
            controlMode={controlMode}
            onSetControlMode={setControlMode}
            isFlowing={isFlowing}
            flowRate={flowRate}
            onSetFlowRate={setFlowRate}
            onAddOneDrop={handleAddOneDrop}
            onToggleFlow={handleToggleFlow}
            onRefillBurette={handleRefillBurette}
            isStirrerActive={isStirrerActive}
            stirrerRpm={stirrerRpm}
            onToggleStirrer={handleToggleStirrer}
            onSetStirrerRpm={setStirrerRpm}
            indicatorDrops={indicatorDrops}
            onAddIndicatorDrop={handleAddIndicatorDrop}
            onRecordDataPoint={() => handleRecordDataPoint('user')}
            onAiAutoTitrate={handleAiAutoTitrate}
            onAiFullScan={handleAiFullScan}
            onAiSpeakGuidance={handleAiSpeakGuidance}
            isAiProcessing={isAiProcessing}
            isWhiteboardOpen={isWhiteboardOpen}
            onToggleWhiteboard={() => setIsWhiteboardOpen((prev) => !prev)}
          />
        </div>

        {/* Collapsible Steps Guide Drawer (If opened) */}
        {isStepsGuideOpen && (
          <div className="shrink-0 w-full bg-white border border-slate-200 rounded-xl p-3 shadow-sm animate-in slide-in-from-bottom duration-150">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">دليل المراحل المنهجية للتجربة:</span>
              <button
                onClick={() => setIsStepsGuideOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                إخفاء
              </button>
            </div>
            <PraxiStepsGuide
              steps={steps}
              currentStepIndex={currentStepIndex}
              onSelectStep={setCurrentStepIndex}
              onNextStep={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
              onPrevStep={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
            />
          </div>
        )}
      </main>

      {/* 4. MODALS */}
      <LabReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        params={params}
        dataPoints={dataPoints}
        equivalenceVolume={theoreticalVeq}
        finalCa={params.acidConcentration}
      />

      <InteractiveQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
      />
    </div>
  );
}
