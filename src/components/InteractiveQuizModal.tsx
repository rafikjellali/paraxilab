import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Award, RotateCcw, HelpCircle } from 'lucide-react';

interface InteractiveQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const questions: Question[] = [
  {
    id: 1,
    question: 'ما هو الدور الأساسي لكاشف الفينول فتالين في هذه المعايرة؟',
    options: [
      'تسريع سرعة التفاعل الكيميائي',
      'تحديد نقطة نهاية المعايرة بدقة عبر تغير لون المحلول للوردي',
      'زيادة تركيز شوارد الهيدرونيوم H3O+',
      'تنظيف الزجاجيات المخبرية',
    ],
    correctIndex: 1,
    explanation: 'الفينول فتالين كاشف ملون عديم اللون في الوسط الحمضي ويتحول للوردي الفاتح بين pH 8.2 و 10.0.',
  },
  {
    id: 2,
    question: 'كيف يجب قراءة مستوى السائل في السحاحة المدرجة بدقة لتفادي خطأ اختلاف المنظر؟',
    options: [
      'من أعلى حواف السائل المرتفعة',
      'عند قعر التقعر السفلي للهلال (Meniscus) في مستوى أفقي مع العين',
      'من زاوية مائلة من الأعلى',
      'القراءة التقريبية كافية ولا تهم الدقة',
    ],
    correctIndex: 1,
    explanation: 'تتم القراءة دائماً عند أسفل تقعر سطح السائل وفي مستوى أفقي تماماً مع العين.',
  },
  {
    id: 3,
    question: 'عند الوصول إلى نقطة التكافؤ E في معايرة HCl بواسطة NaOH، ما العلاقة الصحيحة؟',
    options: [
      'Ca × Va = Cb × VE',
      'Ca / Va = Cb / VE',
      'pH = 0 دائماً',
      'كمية مادة الأساس ضعف كمية مادة الحمض',
    ],
    correctIndex: 0,
    explanation: 'عند التكافؤ، تختفي المتفاعلات بنسب المعاملات الستوكيومترية 1:1، وبالتالي n(acide) = n(base).',
  },
  {
    id: 4,
    question: 'لماذا يُنصح بتشغيل المحرك المغناطيسي طيلة عملية المعايرة؟',
    options: [
      'لتبريد المحلول فقط',
      'لضمان تجانس سريع وتوزيع منتظم للقطرات المضافة في كامل الدورق',
      'لرفع ضغط الغازات في المختبر',
      'لتغيير التركيز المولي للحمض',
    ],
    correctIndex: 1,
    explanation: 'التحريك المستمر يمنع حدوث فرط موضعي للأساس ويضمن تجانساً فورياً للوسط التفاعلي.',
  },
];

export const InteractiveQuizModal: React.FC<InteractiveQuizModalProps> = ({ isOpen, onClose }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelect = (qId: number, optIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIndex }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  const score = calculateScore();

  const resetQuiz = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl border-4 border-slate-300 p-6 md:p-8 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              اختبار المهارات والمفاهيم المخبرية (PraxiLabs Assessment)
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Watermark badge */}
        <div className="mb-4 bg-blue-50 border border-blue-200 p-2.5 rounded-lg flex items-center justify-between text-xs">
          <span className="font-semibold text-blue-900">
            اختبار قياس الكفاءة العملية للتعلم عن بعد
          </span>
          <span className="font-bold text-blue-700">إشراف: رفيق جلالي</span>
        </div>

        {/* Questions list */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 pl-1">
          {questions.map((q, qIndex) => {
            const chosen = selectedAnswers[q.id];
            const isCorrect = isSubmitted && chosen === q.correctIndex;
            const isWrong = isSubmitted && chosen !== undefined && chosen !== q.correctIndex;

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSubmitted
                    ? isCorrect
                      ? 'bg-emerald-50 border-emerald-300'
                      : isWrong
                      ? 'bg-rose-50 border-rose-300'
                      : 'bg-slate-50 border-slate-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-2 mb-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {qIndex + 1}
                  </span>
                  <h3 className="font-bold text-sm text-slate-800 leading-snug">
                    {q.question}
                  </h3>
                </div>

                <div className="space-y-1.5 mr-7">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = chosen === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelect(q.id, optIdx)}
                        disabled={isSubmitted}
                        className={`w-full text-right p-2.5 rounded-lg text-xs font-medium border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{opt}</span>
                        {isSubmitted && optIdx === q.correctIndex && (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {isSubmitted && (
                  <div className="mt-3 mr-7 p-2 rounded-lg bg-white/80 border border-slate-200 text-[11px] text-slate-600">
                    <strong className="text-slate-800">التفسير العلمي: </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Results & Submission */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
          {isSubmitted ? (
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-500" />
              <div>
                <span className="text-xs font-bold text-slate-700">النتيجة النهائية: </span>
                <span className="text-base font-extrabold text-blue-600 font-mono">
                  {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-500">
              أجب عن جميع الأسئلة ثم اضغط "تصحيح الإجابات"
            </span>
          )}

          <div className="flex items-center gap-2">
            {isSubmitted ? (
              <button
                onClick={resetQuiz}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </button>
            ) : (
              <button
                onClick={() => setIsSubmitted(true)}
                disabled={Object.keys(selectedAnswers).length === 0}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors shadow-md"
              >
                تصحيح الإجابات
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
