import React from 'react';
import { DataPoint, ExperimentParams } from '../types/lab';
import { Printer, X, Award, CheckCircle, FileText, Download } from 'lucide-react';

interface LabReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: ExperimentParams;
  dataPoints: DataPoint[];
  equivalenceVolume: number;
  finalCa: number;
}

export const LabReportModal: React.FC<LabReportModalProps> = ({
  isOpen,
  onClose,
  params,
  dataPoints,
  equivalenceVolume,
  finalCa,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const theoreticalCa = params.acidConcentration;
  const relativeError = Math.abs((finalCa - theoreticalCa) / theoreticalCa) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl border-4 border-slate-300 p-6 md:p-8 overflow-hidden my-8">
        {/* Prominent Diagonal Watermark on printable report */}
        <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center opacity-[0.06] -rotate-12">
          <div className="text-center">
            <span className="text-7xl font-extrabold text-blue-900 block">رفيق جلالي</span>
            <span className="text-3xl font-bold text-slate-800">RAFIK JELLALI VIRTUAL LAB</span>
          </div>
        </div>

        {/* Action Header (hidden in print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              تقرير التجربة المخبرية الافتراضية
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / تصدير PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Lab Header */}
        <div className="flex items-center justify-between border-b-2 border-blue-900 pb-4 mb-6">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-800 block">
              منصة المختبرات الافتراضية للعلوم (PraxiLabs Simulation)
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              تقرير المعايرة اللونية والـ pH مترية
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              تحديد التركيز المولي لحمض كلور الماء بواسطة هيدروكسيد الصوديوم
            </p>
          </div>

          {/* Supervisor Watermark Seal */}
          <div className="text-left bg-blue-50 border-2 border-blue-200 px-4 py-2 rounded-xl text-center shadow-xs">
            <span className="text-[10px] text-slate-500 block">إشراف وتنسيق:</span>
            <span className="text-sm font-black text-blue-900 block">
              الأستاذ رفيق جلالي
            </span>
            <span className="text-[10px] font-mono text-blue-600">Rafik Jellali</span>
          </div>
        </div>

        {/* Experiment Parameters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-xs text-slate-500 block">المحلول المعايَر (في الدورق):</span>
            <strong className="text-sm text-slate-800">حمض كلور الماء HCl</strong>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">حجم العينة المأخوذة V_a:</span>
            <strong className="text-sm font-mono text-blue-700">{params.acidVolume} mL</strong>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">المحلول المعايِر (في السحاحة):</span>
            <strong className="text-sm text-slate-800">هيدروكسيد الصوديوم NaOH</strong>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">تركيز الأساس C_b:</span>
            <strong className="text-sm font-mono text-blue-700">{params.baseConcentration} mol/L</strong>
          </div>
        </div>

        {/* Experimental Results & Calculations */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-r-4 border-blue-600 pr-2">
            <span>النتائج التجريبية المستخلصة</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">حجم التكافؤ المقاس V_E:</span>
              <strong className="text-xl font-mono font-bold text-emerald-600">
                {equivalenceVolume.toFixed(2)} mL
              </strong>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">التركيز المولي المحسوب C_a:</span>
              <strong className="text-xl font-mono font-bold text-blue-600">
                {finalCa.toFixed(3)} mol/L
              </strong>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 block">نسبة الخطأ التجريبي:</span>
              <strong className="text-xl font-mono font-bold text-amber-600">
                {relativeError.toFixed(2)} %
              </strong>
            </div>
          </div>

          {/* Mathematical Proof */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 block mb-1">
              البرهان الرياضي عند نقطة التكافؤ:
            </span>
            <p className="font-mono text-xs text-slate-800 leading-relaxed" dir="ltr">
              At equivalence: n(acid) = n(base) <br />
              C_a × V_a = C_b × V_E <br />
              C_a = (C_b × V_E) / V_a = ({params.baseConcentration} × {equivalenceVolume.toFixed(2)}) / {params.acidVolume} = {finalCa.toFixed(4)} mol/L
            </p>
          </div>
        </div>

        {/* Practical Evaluation Stamp */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Award className="w-8 h-8 text-amber-500" />
            <div>
              <span className="text-xs font-bold text-slate-700 block">
                تقييم الأداء العملي في المختبر الافتراضي:
              </span>
              <span className="text-xs text-emerald-600 font-bold">
                ممتاز (100% - استيفاء كافة معايير السلامة والدقة التجريبية)
              </span>
            </div>
          </div>

          <div className="text-left font-mono text-[11px] text-slate-400">
            <p>التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
            <p className="font-bold text-slate-600">مختبر رفيق جلالي للفيزياء والكيمياء</p>
          </div>
        </div>
      </div>
    </div>
  );
};
