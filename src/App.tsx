/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Lab3DView } from './components/Lab3DView';
import { Whiteboard } from './components/Whiteboard';
import { DualControlPanel } from './components/DualControlPanel';
import { PraxiStepsGuide } from './components/PraxiStepsGuide';
import { LabReportModal } from './components/LabReportModal';
import { InteractiveQuizModal } from './components/InteractiveQuizModal';
import {
  ControlMode,
  DataPoint,
  ExperimentParams,
  FlowRate,
  IndicatorType,
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
  Glasses,
  Sparkles,
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

  // Modals
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isQuizOpen, setIsQuizOpen] = useState<boolean>(false);

  // Refs for continuous flow timer
  const flowTimerRef = useRef<number | null>(null);
  const hasTriggeredEquivalenceConfetti = useRef<boolean>(false);

  // Calculations
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

      // Trigger Confetti
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ec4899', '#3b82f6', '#10b981', '#fbbf24'],
        });
      } catch {
        // ignore
      }

      // Mark Step 6 completed
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

        // Trigger drop sound occasionally
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

  // Add 1 precise drop (0.05 mL)
  const handleAddOneDrop = () => {
    labAudio.playDripSound();
    setVolumeDispensed((prev) => Math.min(50, Number((prev + 0.05).toFixed(2))));
  };

  // Toggle Flow
  const handleToggleFlow = () => {
    labAudio.playClickSound();
    setIsFlowing((prev) => !prev);
  };

  // Refill Burette
  const handleRefillBurette = () => {
    labAudio.playGlassClink();
    setIsFlowing(false);
    setVolumeDispensed(0.0);
    hasTriggeredEquivalenceConfetti.current = false;
  };

  // Add Indicator drop
  const handleAddIndicatorDrop = () => {
    labAudio.playGlassClink();
    setIndicatorDrops((prev) => prev + 1);
  };

  // Toggle Stirrer
  const handleToggleStirrer = () => {
    labAudio.playClickSound();
    setIsStirrerActive((prev) => !prev);
  };

  // Record Data Point into table & chart
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

  // Reset Flask Solution
  const handleResetFlask = () => {
    labAudio.playGlassClink();
    setIsFlowing(false);
    setVolumeDispensed(0.0);
    setIndicatorDrops(2);
    setDataPoints([]);
    hasTriggeredEquivalenceConfetti.current = false;
  };

  // AI ACTIONS
  // 1. Auto Titrate to Equivalence Point
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

        // Record point
        handleRecordDataPoint('ai');
      } else {
        setVolumeDispensed(Number(current.toFixed(2)));
        labAudio.playDripSound();
      }
    }, 60);
  };

  // 2. Full scan 15 points
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
    }, 800);
  };

  // 3. AI Calculate Concentration
  const handleAiCalculate = () => {
    setIsReportOpen(true);
    labAudio.playClickSound();
    labAudio.speakArabic('تم حساب التركيز المولي للحمض وهو صفر فاصل واحد مول لكل لتر.');
  };

  // 4. AI Spoken Guidance
  const handleAiSpeakGuidance = () => {
    const text = `أهلاً بك في مختبر رفيق جلالي الافتراضي. نحن الآن في المرحلة الخامسة للمعايرة. حجم هيدروكسيد الصوديوم المضاف هو ${volumeDispensed.toFixed(
      1
    )} مليلتر، وقيمة الـ بي إتش الحالية هي ${currentPH.toFixed(2)}. ${
      isEquivalenceReached
        ? 'لقد وصلنا لنقطة التكافؤ وثبت اللون الوردي!'
        : 'واصل إضافة قطرات الأساس تدريجياً.'
    }`;
    labAudio.speakArabic(text);
  };

  return (
    <div className="relative w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. TOP BAR CONTRACT: 3 ZONES */}
      <header className="h-14 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0">
        {/* Zone 1: Single text element Brand wordmark */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <h1 className="text-base md:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
            <span>PraxiLabs VR</span>
            <span className="text-slate-500 font-normal">|</span>
            <span className="text-cyan-400 font-bold">مختبر رفيق جلالي الافتراضي</span>
          </h1>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-300">
          <button
            onClick={() => setIsQuizOpen(true)}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>اختبار المهارات العملية</span>
          </button>

          <button
            onClick={() => setIsReportOpen(true)}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>تقرير التجربة (PDF)</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className={`p-2 rounded-lg border transition-colors ${
              isMuted
                ? 'bg-rose-950/40 border-rose-800 text-rose-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsReportOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-lg transition-all flex items-center gap-1.5 shadow-md whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>تصدير التقرير</span>
          </button>

          <button
            onClick={handleResetFlask}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
            title="إعادة ضبط التجربة من البداية"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE: Two-zone Stage (3D Canvas + Whiteboard) */}
      <main className="flex-1 min-h-0 w-full p-2 md:p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        {/* Left Side: 3D VR Realistic Laboratory Scene (7 Cols on desktop) */}
        <section className="lg:col-span-6 xl:col-span-7 h-full flex flex-col min-h-0 relative">
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
        </section>

        {/* Right Side: Clean White Whiteboard with Rafik Jellali Watermark (5 Cols on desktop) */}
        <section className="lg:col-span-6 xl:col-span-5 h-full flex flex-col min-h-0">
          <Whiteboard
            dataPoints={dataPoints}
            currentVolume={volumeDispensed}
            currentPH={currentPH}
            params={params}
            onClearData={() => setDataPoints([])}
            equivalenceVolume={theoreticalVeq}
            isEquivalenceReached={isEquivalenceReached}
          />
        </section>
      </main>

      {/* 3. BOTTOM DECK: Dual Control Panel + PraxiLabs Guide */}
      <footer className="w-full bg-slate-950 border-t border-slate-800/80 px-2 md:px-3 py-2 z-20 shrink-0 flex flex-col gap-2 max-h-[38vh] overflow-y-auto">
        <DualControlPanel
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
          indicator={params.indicator}
          indicatorDrops={indicatorDrops}
          onAddIndicatorDrop={handleAddIndicatorDrop}
          onRecordDataPoint={() => handleRecordDataPoint('user')}
          onResetFlask={handleResetFlask}
          onAiExecuteStep={() => {
            if (currentStepIndex < steps.length - 1) {
              setCurrentStepIndex((prev) => prev + 1);
            }
          }}
          onAiAutoTitrateToEquivalence={handleAiAutoTitrate}
          onAiFullScanCurve={handleAiFullScan}
          onAiCalculateConcentration={handleAiCalculate}
          onAiSpeakGuidance={handleAiSpeakGuidance}
          isAiProcessing={isAiProcessing}
          currentVolume={volumeDispensed}
          currentPH={currentPH}
          solutionColorName={solutionColor.nameAr}
          isEquivalenceReached={isEquivalenceReached}
          params={params}
        />

        <PraxiStepsGuide
          steps={steps}
          currentStepIndex={currentStepIndex}
          onSelectStep={setCurrentStepIndex}
          onNextStep={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
          onPrevStep={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
        />
      </footer>

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
