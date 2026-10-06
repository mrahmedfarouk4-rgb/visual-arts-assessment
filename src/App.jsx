import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  ChevronRight, 
  GraduationCap, 
  ClipboardCheck, 
  Users, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Info,
  Trash2,
  Plus,
  X,
  Pencil,
  Save,
  Calendar,
  Star,
  Box,
  Search,
  Filter,
  Hammer,
  Wrench,
  Package,
  BookOpen,
  Droplets,
  Printer
} from 'lucide-react';
import { mocLogo, mocRibbon } from './assets/mocBrand';


export default function App() {
  const [step, setStep] = useState('grade');
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState('term1');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [showStudentManager, setShowStudentManager] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');

  const [globalConfig, setGlobalConfig] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const grades = globalConfig?.grades || [];
  const subjects = useMemo(() => {
    if (!globalConfig || !selectedGrade) return [];
    return (globalConfig.subjects || []).filter((s) => {
      const matchGrade = !s.grades || s.grades.includes(selectedGrade);
      if (!matchGrade) return false;
      if (s.term && s.term !== 'all') {
        return s.term === selectedTerm;
      }
      return true;
    });
  }, [globalConfig, selectedGrade, selectedTerm]);

  const currentCriteria = useMemo(() => {
    if (!globalConfig || !selectedType) return [];
    const critConfig = globalConfig.criteria || {};
    if (!critConfig) return [];

    const findInSection = (section) => {
      if (!section) return null;
      // 1. Direct match with subject ID
      if (section[selectedSubject]) return section[selectedSubject];
      // 2. Match with grade_subject
      if (section[`${selectedGrade}_${selectedSubject}`]) return section[`${selectedGrade}_${selectedSubject}`];
      
      // 3. Match with term if subject has baseSubject
      const subjectObj = globalConfig?.subjects?.find(s => s.id === selectedSubject);
      const baseSubj = subjectObj?.baseSubject || selectedSubject;
      const term = subjectObj?.term || selectedTerm;
      if (term && section[`${selectedGrade}_${term}_${baseSubj}`]) {
        return section[`${selectedGrade}_${term}_${baseSubj}`];
      }
      if (section[`${selectedGrade}_${baseSubj}`]) {
        return section[`${selectedGrade}_${baseSubj}`];
      }

      // 4. Fallbacks for grades
      if (selectedGrade === 'grade_int2') {
        if (section[`grade_int1_${baseSubj}`]) return section[`grade_int1_${baseSubj}`];
        if (section[`intermediate1_${baseSubj}`]) return section[`intermediate1_${baseSubj}`];
      }
      if (selectedGrade === 'grade_int1') {
        if (section[`intermediate1_${baseSubj}`]) return section[`intermediate1_${baseSubj}`];
      }
      if (selectedGrade === 'grade5') {
        if (section[`grade4_${baseSubj}`]) return section[`grade4_${baseSubj}`];
      }
      
      return null;
    };

    let found = null;
    if (selectedType === 'unit') {
      found = critConfig.unit;
    } else if (selectedType === 'periodic') {
      found = findInSection(critConfig.periodic) || findInSection(critConfig);
    } else if (selectedType === 'final') {
      found = findInSection(critConfig.final) || findInSection(critConfig);
    }

    if (!found) {
      found = critConfig[`${selectedGrade}_${selectedSubject}`] || critConfig[selectedSubject] || critConfig.default || [];
    }

    return Array.isArray(found) ? found : [];
  }, [globalConfig, selectedType, selectedSubject, selectedGrade, selectedTerm]);

  const [students, setStudents] = useState([]);

  const [scores, setScores] = useState({});
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0]);
  const [evaluationLabel, setEvaluationLabel] = useState('');
  const [evaluationId, setEvaluationId] = useState(null);
  const [pastEvaluations, setPastEvaluations] = useState([]);

  const [batchSelected, setBatchSelected] = useState([]);
  const [batchPrintData, setBatchPrintData] = useState([]);
  const [batchPrinting, setBatchPrinting] = useState(false);
  const [printTeacherName, setPrintTeacherName] = useState('');
  const [historySelectedEvals, setHistorySelectedEvals] = useState([]);
  const [printFilterRound, setPrintFilterRound] = useState('all');



  const fetchConfig = async () => {
    try {
      const r = await fetch('/api/config');
      if (!r.ok) throw new Error('Failed to load config');
      const data = await r.json();
      setGlobalConfig(data);
    } catch (e) {
      console.error('Config fetch error:', e);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error('Failed to load students');
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(data);
      } else {
        console.error('Students data is not an array:', data);
        setStudents([]);
      }
    } catch (e) {
      console.error('Students fetch error:', e);
      setStudents([]);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (step === 'history' && selectedStudent && selectedGrade && selectedSubject && selectedType) {
      const fetchEval = async () => {
        try {
          const res = await fetch(`/api/evaluations?student_id=${selectedStudent.id}&grade_id=${selectedGrade}&subject_id=${selectedSubject}&evaluation_type=${selectedType}`);
          if (res.ok) {
            const data = await res.json();
            setPastEvaluations(Array.isArray(data) ? data : []);
          }
        } catch (e) {
          console.error('Failed to fetch evaluation history', e);
        }
      };
      fetchEval();
    }
  }, [step, selectedStudent, selectedGrade, selectedSubject, selectedType]);

  const saveConfig = async () => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: globalConfig })
      });
      if (res.ok) {
        setIsEditMode(false);
        alert('تم حفظ التعديلات بنجاح');
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleEditModeToggle = () => {
    if (isEditMode) {
      saveConfig();
    } else {
      const pwd = window.prompt('أدخل كلمة المرور لتفعيل وضع التعديل:');
      if (pwd === '01020') {
        setIsEditMode(true);
      } else if (pwd !== null) {
        alert('كلمة المرور غير صحيحة');
      }
    }
  };

  const updateConfigValue = (path, newValue) => {
    if (!newValue.trim()) return;
    setGlobalConfig((prev) => {
      const newConfig = JSON.parse(JSON.stringify(prev));
      let current = newConfig;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = newValue;
      return newConfig;
    });
  };

  const InlineEditBtn = ({ path, value }) => {
    if (!isEditMode) return null;
    return (
      <button 
        onClick={(e) => {
          e.stopPropagation();
          const newVal = window.prompt('تعديل النص:', value);
          if (newVal !== null && newVal.trim() !== '') {
            updateConfigValue(path, newVal);
          }
        }}
        className="p-1.5 mx-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-colors shrink-0"
        title="تعديل النص"
      >
        <Pencil className="w-3 h-3" />
      </button>
    );
  };

  const getCriteriaPath = (idx) => {
    const key = `${selectedGrade}_${selectedSubject}`;
    if (selectedType === 'periodic') {
      let subjKey = 'default';
      if (globalConfig?.criteria?.periodic?.[selectedSubject]) subjKey = selectedSubject;
      else if (globalConfig?.criteria?.periodic?.[key]) subjKey = key;
      else if (selectedGrade === 'grade5' && globalConfig?.criteria?.periodic?.[`grade4_${selectedSubject}`]) subjKey = `grade4_${selectedSubject}`;
      else if (selectedGrade === 'grade_int2' && globalConfig?.criteria?.periodic?.[`grade_int1_${selectedSubject}`]) subjKey = `grade_int1_${selectedSubject}`;
      else if (globalConfig?.criteria?.periodic?.[selectedSubject || '']) subjKey = selectedSubject;
      return ['criteria', 'periodic', subjKey, idx, 'text'];
    }
    if (selectedType === 'final') {
      let subjKey = 'default';
      if (globalConfig?.criteria?.final?.[selectedSubject]) subjKey = selectedSubject;
      else if (globalConfig?.criteria?.final?.[key]) subjKey = key;
      else if (selectedGrade === 'grade5' && globalConfig?.criteria?.final?.[`grade4_${selectedSubject}`]) subjKey = `grade4_${selectedSubject}`;
      else if (selectedGrade === 'grade_int2' && globalConfig?.criteria?.final?.[`grade_int1_${selectedSubject}`]) subjKey = `grade_int1_${selectedSubject}`;
      else if (globalConfig?.criteria?.final?.[selectedSubject || '']) subjKey = selectedSubject;
      
      if (Array.isArray(globalConfig?.criteria?.final)) return ['criteria', 'final', idx, 'text'];
      return ['criteria', 'final', subjKey, idx, 'text'];
    }
    return ['criteria', selectedType, idx, 'text'];
  };


  const addStudent = async () => {
    if (!isEditMode) {
      alert('يجب تفعيل وضع التعديل بكلمة المرور للقيام بهذه العملية');
      return;
    }
    if (!newStudentName.trim()) {
      alert('الرجاء إدخال اسم الطالب');
      return;
    }
    if (!selectedGrade) {
      alert('الرجاء اختيار الصف أولاً من القائمة المنسدلة');
      return;
    }
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStudentName, gradeId: selectedGrade })
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(prev => [...prev, data]);
        setNewStudentName('');
        alert('تمت إضافة الطالب بنجاح');
      } else {
        const err = await res.json();
        alert(`فشل الحفظ: ${err.details || err.error || 'خطأ غير معروف'}`);
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ في الاتصال بالسيرفر');
    }
  };

  const deleteStudent = async (id) => {
    if (!isEditMode) {
      alert('يجب تفعيل وضع التعديل بكلمة المرور للقيام بهذه العملية');
      return;
    }
    if (!window.confirm('هل أنت متأكد من حذف هذا الطالب نهائياً؟')) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStudents(prev => prev.filter(s => s.id !== id));
        if (selectedStudent?.id === id) {
          setSelectedStudent(null);
          if (step === 'evaluation') setStep('student');
        }
        alert('تم حذف الطالب بنجاح');
      } else {
        alert('فشل الحذف من السيرفر');
      }
    } catch (e) {
      console.error(e);
      alert('خطأ في الاتصال أثناء الحذف');
    }
  };



  const reset = () => {
    setStep('grade');
    setSelectedGrade(null);
    setSelectedTerm('term1');
    setSelectedSubject(null);
    setSelectedType(null);
    setSelectedStudent(null);
    setScores({});
    setEvaluationLabel('');
    setEvaluationId(null);
    setPastEvaluations([]);
    setBatchSelected([]);
    setBatchPrintData([]);
    setHistorySelectedEvals([]);
  };

  const handlePrintBatch = async ({ studentIds, evalIds, mode = 'all', label = null }) => {
    try {
      let url = `/api/evaluations/batch?grade_id=${selectedGrade}&subject_id=${selectedSubject}&evaluation_type=${selectedType}`;
      if (evalIds && evalIds.length > 0) {
        url = `/api/evaluations/batch?evaluation_ids=${evalIds.join(',')}`;
      } else {
        if (studentIds && studentIds.length > 0) {
          url += `&student_ids=${studentIds.join(',')}`;
        } else {
          url += `&student_ids=all`;
        }
        if (mode) url += `&mode=${mode}`;
        if (label && label !== 'all') url += `&eval_label=${encodeURIComponent(label)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (!data || data.length === 0) {
          alert('لا توجد تقييمات مسجلة للطباعة وفق الخيارات المحددة.');
          return;
        }
        setBatchPrintData(data);
        setBatchPrinting(true);
      } else {
        const err = await res.json().catch(() => ({}));
        alert('حدث خطأ في جلب بيانات الطباعة: ' + (err.details || err.error || 'خطأ غير معروف'));
      }
    } catch (e) {
      console.error('Print batch error:', e);
      alert('خطأ أثناء تجهيز الطباعة: ' + e.message);
    }
  };

  const handleBack = () => {
    if (step === 'teacher') setStep('grade');
    else if (step === 'subject') setStep('teacher');
    else if (step === 'type') setStep('subject');
    else if (step === 'student') setStep('type');
    else if (step === 'history') { setStep('student'); setHistorySelectedEvals([]); }
    else if (step === 'evaluation') {
      if (pastEvaluations.length > 0) setStep('history');
      else setStep('student');
    }
  };

  const totalPossible = useMemo(() => {
    return currentCriteria.reduce((acc, curr) => acc + (curr.max || 4), 0);
  }, [currentCriteria]);

  const currentScore = useMemo(() => {
    const raw = currentCriteria.reduce((acc, curr) => {
      const val = scores[curr.id] ?? scores[String(curr.id)];
      return acc + (typeof val === 'number' ? val : 0);
    }, 0);
    return Math.min(raw, totalPossible);
  }, [scores, currentCriteria, totalPossible]);

  const getCategory = (score, total) => {
    if (selectedType === 'unit') {
      if (score > 15) return { label: 'يتخطى الهدف (موهوب)', color: 'text-purple-600', bg: 'bg-purple-100' };
      if (score >= 12) return { label: 'حقق الهدف', color: 'text-green-600', bg: 'bg-green-100' };
      if (score >= 8) return { label: 'يقترب من الهدف', color: 'text-amber-600', bg: 'bg-amber-100' };
      return { label: 'دون الهدف', color: 'text-red-600', bg: 'bg-red-100' };
    }
    if (selectedType === 'periodic') {
      if (score > 45) return { label: 'يتخطى الهدف (تُرصد 30 من 30)', color: 'text-purple-600', bg: 'bg-purple-100' };
      if (score >= 39) return { label: 'حقق الهدف', color: 'text-green-600', bg: 'bg-green-100' };
      if (score >= 31) return { label: 'يقترب من الهدف', color: 'text-amber-600', bg: 'bg-amber-100' };
      return { label: 'لم يحقق الهدف', color: 'text-red-600', bg: 'bg-red-100' };
    }
    if (selectedType === 'final') {
      if (score > 40) return { label: 'يتخطى الهدف (موهوب)', color: 'text-purple-600', bg: 'bg-purple-100' };
      if (score >= 36) return { label: 'حقق الهدف (متقن)', color: 'text-green-600', bg: 'bg-green-100' };
      if (score >= 20) return { label: 'يقترب من الهدف', color: 'text-amber-600', bg: 'bg-amber-100' };
      return { label: 'دون الهدف', color: 'text-red-600', bg: 'bg-red-100' };
    }
    return { label: '', color: '', bg: '' };
  };

  return (
    <>
    <div className={`min-h-screen p-4 md:p-8 max-w-4xl mx-auto ${batchPrinting ? 'print:hidden' : ''}`}>
      {/* Header */}
      <header className="mb-12 print:mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
            <Palette className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight flex items-center">
              {globalConfig?.appTitle || 'بوابة تقييم الفنون البصرية'}
              <InlineEditBtn path={['appTitle']} value={globalConfig?.appTitle || 'بوابة تقييم الفنون البصرية'} />
            </h1>
            <p className="text-gray-500 font-medium text-sm flex items-center mt-1">
              {globalConfig?.appSubtitle || 'مشروع تشغيل المدارس الثقافية الحكومية'}
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-indigo-600 font-bold">تم الإعداد والتصميم بواسطة الأستاذ / أحمد فاروق</span>
              <InlineEditBtn path={['appSubtitle']} value={globalConfig?.appSubtitle || 'مشروع تشغيل المدارس الثقافية الحكومية'} />
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button 
            onClick={handleEditModeToggle}
            className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-colors print:hidden ${isEditMode ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-md shadow-emerald-100' : 'text-gray-600 bg-gray-50 hover:bg-gray-100'}`}
          >
            {isEditMode ? <Save className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
            {isEditMode ? 'حفظ التعديلات' : 'تفعيل وضع التعديل'}
          </button>
          <button 
            onClick={() => setShowStudentManager(true)}
            className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors print:hidden"
          >
            <Users className="w-4 h-4" />
            إدارة الطلاب
          </button>
          {step !== 'grade' && (
            <button 
              onClick={reset}
              className="text-gray-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-gray-50 print:hidden"
            >
              البدء من جديد
            </button>
          )}
        </div>
      </header>

      {/* Navigation Breadcrumbs / Back button */}
      <div className="mb-8 flex items-center gap-4">
        {step !== 'grade' && (
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Grade Selection */}
        {step === 'grade' && (
          <motion.div 
            key="step-grade"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {grades.map((grade) => {
              const isElem = grade.id.includes('grade4') || grade.id.includes('grade5');
              const stageBadge = isElem ? 'المرحلة الابتدائية' : 'المرحلة المتوسطة';
              const badgeStyle = isElem 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' 
                : 'bg-purple-50 text-purple-700 border-purple-200/60';
              const iconStyle = isElem 
                ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' 
                : 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white';

              return (
                <button
                  key={grade.id}
                  onClick={() => {
                    setSelectedGrade(grade.id);
                    setStep('teacher');
                  }}
                  className="group p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all text-right flex items-center justify-between"
                >
                  <div className="flex items-center gap-6">
                    <div className={`p-5 rounded-2xl transition-all duration-300 ${iconStyle}`}>
                      <GraduationCap className="w-9 h-9" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${badgeStyle}`}>
                          {stageBadge}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 flex items-center">
                        {grade.name}
                        <InlineEditBtn 
                          path={['grades', globalConfig?.grades?.findIndex((g) => g.id === grade.id), 'name']} 
                          value={grade.name} 
                        />
                      </h3>
                      <p className="text-gray-400 text-xs mt-1 font-medium">اضغط لبدء التقييم وإدخال اسم المعلم</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-[-4px] transition-all rtl:rotate-180" />
                </button>
              );
            })}
          </motion.div>
        )}
        {/* Step 1.5: Teacher Name Input */}
        {step === 'teacher' && (
          <motion.div 
            key="step-teacher"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-gray-900 mb-2">اسم المعلم / المعلمة</h2>
              <p className="text-gray-500 font-medium">يرجى إدخال الاسم ليظهر في تقارير التقييم</p>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Users className="w-6 h-6 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="اكتب الاسم هنا..." 
                value={printTeacherName}
                onChange={e => setPrintTeacherName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && printTeacherName.trim() && setStep('subject')}
                autoFocus
                className="w-full bg-white border-2 border-gray-100 rounded-2xl pr-12 pl-4 py-5 text-lg font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm group-hover:border-gray-200"
              />
            </div>

            <button
              onClick={() => setStep('subject')}
              disabled={!printTeacherName.trim()}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${
                printTeacherName.trim() 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              متابعة لاختيار المقررات
              <ChevronRight className="w-6 h-6 rtl:rotate-180" />
            </button>
          </motion.div>
        )}

        {/* Step 2: Subject Selection */}
        {step === 'subject' && (
          <motion.div 
            key="step-subject"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            <div className="col-span-full mb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                  <h2 className="text-xl font-black text-gray-900">اختر المقرر الدراسي</h2>
                  <p className="text-gray-500 text-xs mt-1 font-medium">المقررات المتاحة لـ {grades.find(g => g.id === selectedGrade)?.name}</p>
                </div>
                <div className="flex items-center bg-gray-100/90 p-1.5 rounded-2xl gap-2 self-start md:self-auto border border-gray-200/60">
                  <button
                    onClick={() => setSelectedTerm('term1')}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs md:text-sm flex items-center gap-2 transition-all duration-200 ${
                      selectedTerm === 'term1'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-[1.02]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    الفصل الدراسي الأول
                  </button>
                  <button
                    onClick={() => setSelectedTerm('term2')}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs md:text-sm flex items-center gap-2 transition-all duration-200 ${
                      selectedTerm === 'term2'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-[1.02]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    الفصل الدراسي الثاني
                  </button>
                </div>
              </div>
            </div>
            {subjects.map((subject) => {
              const base = subject.baseSubject || subject.id;
              const meta = (() => {
                if (base.includes('watercolor')) {
                  return { 
                    icon: <Droplets className="w-6 h-6 text-sky-600" />, 
                    bg: 'bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white', 
                    desc: 'تقنيات ودمج الألوان المائية والشفافية' 
                  };
                }
                switch (base) {
                  case 'drawing_basics': return { icon: <Pencil className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white', desc: 'مهارات وقواعد الرسم والمنظور والتظليل' };
                  case 'saudi_arts': return { icon: <Palette className="w-6 h-6 text-emerald-600" />, bg: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white', desc: 'التراث والهوية التشكيلية السعودية' };
                  case 'cartoon': return { icon: <Star className="w-6 h-6 text-amber-600" />, bg: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white', desc: 'رسم الشخصيات والتعابير الكرتونية' };
                  case 'handicrafts': return { icon: <Hammer className="w-6 h-6 text-purple-600" />, bg: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white', desc: 'التشكيل والقص والأنشطة اليدوية' };
                  case 'character_design': return { icon: <Users className="w-6 h-6 text-indigo-600" />, bg: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white', desc: 'ابتكار وبناء الشخصيات الفنية' };
                  case 'digital_drawing': return { icon: <Package className="w-6 h-6 text-cyan-600" />, bg: 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white', desc: 'تقنيات وتطبيقات الرسم الرقمي (Procreate)' };
                  default: return { icon: <Palette className="w-6 h-6 text-indigo-600" />, bg: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white', desc: 'مقرر الفنون البصرية' };
                }
              })();

              const termLabel = subject.term === 'term1' ? 'الفصل الأول' : subject.term === 'term2' ? 'الفصل الثاني' : null;

              return (
                <button
                  key={subject.id}
                  onClick={() => {
                    setSelectedSubject(subject.id);
                    setStep('type');
                  }}
                  className="group p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all text-right flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl transition-all duration-300 ${meta.bg}`}>
                      {meta.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {termLabel && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {termLabel}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center mt-0.5">
                        {subject.name}
                        <InlineEditBtn 
                          path={['subjects', globalConfig?.subjects?.findIndex((s) => s.id === subject.id), 'name']} 
                          value={subject.name} 
                        />
                      </h3>
                      <p className="text-gray-400 text-xs mt-1 font-medium">{meta.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-[-3px] transition-all rtl:rotate-180" />
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Step 3: Evaluation Type Selection */}
        {step === 'type' && (
          <motion.div 
            key="step-type"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">نوع آلية التقييم</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => { setSelectedType('unit'); setStep('student'); }}
                className="group p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center gap-4 relative"
              >
                <div className="absolute top-2 left-2">
                  <InlineEditBtn path={['evalTypeTitles', 'unit']} value={globalConfig?.evalTypeTitles?.unit || 'التقييم التكويني (التقييم الأسبوعي - 20 درجة)'} />
                </div>
                <div className="p-4 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                  <ClipboardCheck className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-800">{globalConfig?.evalTypeTitles?.unit || 'التقييم التكويني (التقييم الأسبوعي - 20 درجة)'}</h3>
              </button>
              <button
                onClick={() => { setSelectedType('periodic'); setStep('student'); }}
                className="group p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center gap-4 relative"
              >
                <div className="absolute top-2 left-2">
                  <InlineEditBtn path={['evalTypeTitles', 'periodic']} value={globalConfig?.evalTypeTitles?.periodic || 'التقويم المرحلي (60 درجة)'} />
                </div>
                <div className="p-4 bg-emerald-50 rounded-full group-hover:bg-emerald-100 transition-colors">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-800">{globalConfig?.evalTypeTitles?.periodic || 'التقويم المرحلي (60 درجة)'}</h3>
              </button>
              <button
                onClick={() => { setSelectedType('final'); setStep('student'); }}
                className="group p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center gap-4 relative"
              >
                <div className="absolute top-2 left-2">
                  <InlineEditBtn path={['evalTypeTitles', 'final']} value={globalConfig?.evalTypeTitles?.final || 'التقويم الختامي (50 درجة)'} />
                </div>
                <div className="p-4 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors">
                  <Trophy className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-800">{globalConfig?.evalTypeTitles?.final || 'التقويم الختامي (50 درجة)'}</h3>
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Student Selection */}
        {step === 'student' && (
          <motion.div 
            key="step-student"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 pb-24"
          >
            {/* Top Control Bar for Batch Printing */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">قائمة الطلاب والتقييمات</h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    اختر طالباً لعرض سجله أو استخدم أزرار الطباعة الشاملة أو الانتقائية أدناه
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Round Filter */}
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-700">
                    <span>الجولة:</span>
                    <select
                      value={printFilterRound}
                      onChange={(e) => setPrintFilterRound(e.target.value)}
                      className="bg-transparent outline-none font-bold text-indigo-700 cursor-pointer"
                    >
                      <option value="all">كل التقييمات المسجلة</option>
                      <option value="latest">آخر تقييم فقط</option>
                      <option value="التقييم الأول">التقييم الأول</option>
                      <option value="التقييم الثاني">التقييم الثاني</option>
                      <option value="التقييم الثالث">التقييم الثالث</option>
                    </select>
                  </div>

                  {/* Print All Students' Evaluations */}
                  <button
                    onClick={() => handlePrintBatch({ studentIds: null, mode: printFilterRound === 'latest' ? 'latest' : 'all', label: printFilterRound !== 'all' && printFilterRound !== 'latest' ? printFilterRound : null })}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm"
                    title="طباعة تقييمات جميع طلاب الصف دفعة واحدة"
                  >
                    <Printer className="w-4 h-4" />
                    طباعة جميع تقييمات الطلاب
                  </button>

                  {/* Print Selected Students */}
                  {batchSelected.length > 0 && (
                    <button
                      onClick={() => handlePrintBatch({ studentIds: batchSelected, mode: printFilterRound === 'latest' ? 'latest' : 'all', label: printFilterRound !== 'all' && printFilterRound !== 'latest' ? printFilterRound : null })}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm"
                      title="طباعة التقييمات للطلاب المحددين فقط"
                    >
                      <Printer className="w-4 h-4" />
                      طباعة المختارين ({batchSelected.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Select All / Deselect All / Counter */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setBatchSelected(students.filter(s => s.gradeId === selectedGrade || !s.gradeId).map(s => s.id))}
                    className="font-bold text-indigo-600 hover:underline"
                  >
                    تحديد جميع الطلاب
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => setBatchSelected([])}
                    className="font-bold text-gray-400 hover:underline"
                  >
                    إلغاء التحديد
                  </button>
                </div>
                <div>
                  إجمالي الطلاب: <strong className="text-gray-800">{students.filter(s => s.gradeId === selectedGrade || !s.gradeId).length}</strong>
                  {batchSelected.length > 0 && (
                    <span className="text-indigo-600 font-bold mr-2">
                      (تم تحديد: {batchSelected.length})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {students.filter(s => s.gradeId === selectedGrade || !s.gradeId).map(student => {
                const count = student.evaluations?.filter((e) => e.gradeId === selectedGrade && e.subjectId === selectedSubject && e.evaluationType === selectedType).length || 0;
                const isChecked = batchSelected.includes(student.id);
                return (
                  <div
                    key={student.id}
                    className={`flex items-center p-4 bg-white border rounded-2xl shadow-sm transition-all ${
                      isChecked ? 'border-indigo-400 bg-indigo-50/40' : 'border-gray-100 hover:border-indigo-200'
                    }`}
                  >
                    {/* Checkbox for batch print */}
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) setBatchSelected(prev => [...prev, student.id]);
                        else setBatchSelected(prev => prev.filter(id => id !== student.id));
                      }}
                      className="w-5 h-5 rounded accent-indigo-600 cursor-pointer ml-3 shrink-0"
                      title="تحديد الطالب للطباعة"
                    />

                    {/* Student Info Clickable */}
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setHistorySelectedEvals([]);
                        setStep('history');
                      }}
                      className="flex items-center justify-between flex-1 group text-right"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                          {student.name[0]}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors block">{student.name}</span>
                          {count > 0 && (
                            <span className="text-[11px] text-gray-400 font-bold">
                              {count} {count === 1 ? 'تقييم مسجل' : count === 2 ? 'تقييمان' : 'تقييمات مسجلة'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {count > 0 && <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-1 rounded-full">التقييمات: {count}</span>}
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-colors rtl:rotate-180" />
                      </div>
                    </button>

                    {/* Quick Print Student Evaluations */}
                    {count > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintBatch({ studentIds: [student.id], mode: 'all' });
                        }}
                        className="p-2.5 mr-2 text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-xl transition-all shadow-sm shrink-0"
                        title={`طباعة جميع تقييمات ${student.name}`}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 4.5: History */}
        {step === 'history' && (
          <motion.div
            key="step-history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 pb-20"
          >
            {/* Header with Print Controls */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">سجل تقييمات: {selectedStudent?.name}</h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    التقييمات السابقة: <strong className="text-indigo-600">{pastEvaluations.length}</strong>
                  </p>
                </div>
                {pastEvaluations.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Print All for this student */}
                    <button
                      onClick={() => handlePrintBatch({ evalIds: pastEvaluations.map(e => e.id) })}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm"
                      title="طباعة جميع تقييمات هذا الطالب"
                    >
                      <Printer className="w-4 h-4" />
                      طباعة جميع تقييمات الطالب ({pastEvaluations.length})
                    </button>

                    {/* Print Selected evaluations */}
                    {historySelectedEvals.length > 0 && (
                      <button
                        onClick={() => handlePrintBatch({ evalIds: historySelectedEvals })}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm"
                        title="طباعة التقييمات المحددة فقط"
                      >
                        <Printer className="w-4 h-4" />
                        طباعة المحددة ({historySelectedEvals.length})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {pastEvaluations.length > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setHistorySelectedEvals(pastEvaluations.map(e => e.id))}
                      className="font-bold text-indigo-600 hover:underline"
                    >
                      تحديد جميع التقييمات
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setHistorySelectedEvals([])}
                      className="font-bold text-gray-400 hover:underline"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                  {historySelectedEvals.length > 0 && (
                    <span className="text-indigo-600 font-bold">
                      تم تحديد: {historySelectedEvals.length} من {pastEvaluations.length}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => {
                  if (!isEditMode) {
                    const pwd = window.prompt('إضافة تقييم جديد يتطلب وضع التعديل. أدخل كلمة المرور (أو اضغط إلغاء للعرض والطباعة فقط):');
                    if (pwd === '01020') {
                      setIsEditMode(true);
                    } else if (pwd !== null) {
                      alert('كلمة المرور غير صحيحة');
                      return;
                    }
                  }
                  setEvaluationId(null);
                  setScores({});
                  setEvaluationLabel('');
                  setEvaluationDate(new Date().toISOString().split('T')[0]);
                  setStep('evaluation');
                }}
                className="flex items-center justify-center p-5 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl shadow-sm text-indigo-600 font-bold hover:bg-indigo-100 hover:border-indigo-300 transition-all group"
              >
                + إضافة تقييم جديد
              </button>
              
              {pastEvaluations.map(ev => {
                const parsedScores = typeof ev.scores === 'string' ? JSON.parse(ev.scores) : ev.scores;
                const label = parsedScores?._evaluationLabel || 'التقييم';
                const isSelected = historySelectedEvals.includes(ev.id);
                return (
                  <div
                    key={ev.id}
                    className={`flex items-center p-4 bg-white border rounded-2xl shadow-sm transition-all ${
                      isSelected ? 'border-indigo-400 bg-indigo-50/40' : 'border-gray-100 hover:border-indigo-200'
                    }`}
                  >
                    {/* Checkbox to select this evaluation */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setHistorySelectedEvals(prev => [...prev, ev.id]);
                        else setHistorySelectedEvals(prev => prev.filter(id => id !== ev.id));
                      }}
                      className="w-5 h-5 rounded accent-indigo-600 cursor-pointer ml-3 shrink-0"
                      title="تحديد هذا التقييم للطباعة"
                    />

                    {/* Clickable body to open evaluation */}
                    <button
                      onClick={() => {
                        if (!isEditMode) {
                          const pwd = window.prompt('تعديل التقييم يتطلب وضع التعديل. أدخل كلمة المرور (أو اضغط إلغاء للعرض والطباعة فقط):');
                          if (pwd === '01020') {
                            setIsEditMode(true);
                          } else if (pwd !== null) {
                            alert('كلمة المرور غير صحيحة');
                            return;
                          }
                        }
                        setEvaluationId(ev.id);
                        setEvaluationDate(ev.evaluationDate);
                        if (parsedScores) {
                          const s = { ...parsedScores };
                          if (s._evaluationLabel) {
                            setEvaluationLabel(s._evaluationLabel);
                            delete s._evaluationLabel;
                          } else {
                            setEvaluationLabel('');
                          }
                          const criteriaIds = currentCriteria.map(c => String(c.id));
                          const hasMatchingKeys = criteriaIds.some(id => s[id] !== undefined);
                          let sanitizedScores = {};
                          if (hasMatchingKeys) {
                            criteriaIds.forEach(id => {
                              if (s[id] !== undefined) sanitizedScores[id] = s[id];
                            });
                          } else {
                            const numericKeys = Object.keys(s)
                              .filter(k => !k.startsWith('_') && !isNaN(Number(k)))
                              .sort((a, b) => Number(a) - Number(b));
                            currentCriteria.forEach((crit, idx) => {
                              if (idx < numericKeys.length) {
                                sanitizedScores[crit.id] = s[numericKeys[idx]];
                              }
                            });
                          }
                          setScores(sanitizedScores);
                        }
                        setStep('evaluation');
                      }}
                      className="flex items-center justify-between flex-1 group text-right"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">{label}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{ev.evaluationDate}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-colors rtl:rotate-180" />
                    </button>

                    {/* Quick Print Single Evaluation */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintBatch({ evalIds: [ev.id] });
                      }}
                      className="p-2.5 mr-2 text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-xl transition-all shadow-sm shrink-0"
                      title={`طباعة ${label}`}
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 5: Evaluation Form */}
        {step === 'evaluation' && (
          <motion.div 
            key="step-evaluation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 pb-20 print:pb-0 print:scale-[0.85] print:origin-top print:break-inside-avoid"
          >
            <div className="bg-white p-6 rounded-3xl border border-indigo-50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-indigo-200 print:shadow-none">
              <div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-2 inline-block print:border print:border-indigo-100">نموذج تقييم</span>
                <h2 className="text-2xl font-bold text-gray-900">{selectedStudent?.name}</h2>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 font-medium">
                  <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /> {grades.find(g => g.id === selectedGrade)?.name}</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {selectedTerm === 'term2' ? 'الفصل الدراسي الثاني' : 'الفصل الدراسي الأول'}</span>
                  <span className="flex items-center gap-1"><Palette className="w-4 h-4" /> {subjects.find(s => s.id === selectedSubject)?.name}</span>
                  <div className="flex items-center gap-2 print:gap-1">
                    <span className="text-gray-500 font-semibold text-sm flex items-center gap-1">
                      {globalConfig?.evalLabels?.evaluationNumber || 'رقم التقييم'}:
                      <InlineEditBtn path={['evalLabels', 'evaluationNumber']} value={globalConfig?.evalLabels?.evaluationNumber || 'رقم التقييم'} />
                    </span>
                    <input 
                      type="text" 
                      placeholder="مثال: الوحدة الأولى..." 
                      value={evaluationLabel}
                      onChange={(e) => setEvaluationLabel(e.target.value)}
                      className="border border-gray-200 text-gray-800 font-bold rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500 w-40 bg-gray-50 focus:bg-white transition-all print:border-b print:border-gray-400 print:rounded-none print:bg-transparent print:px-1 print:py-0"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="print:hidden">
                  <div className="text-xs text-gray-400 font-bold mb-1">تاريخ التقييم</div>
                  <input 
                    type="date" 
                    value={evaluationDate}
                    onChange={(e) => setEvaluationDate(e.target.value)}
                    className="bg-gray-50 border border-gray-100 text-sm font-bold text-gray-700 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="hidden print:block text-sm text-gray-500 font-bold mt-2">
                  التاريخ: <span className="text-gray-900 border-b border-gray-300 pb-1 px-2 inline-block min-w-[100px]">{evaluationDate}</span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-2xl text-center min-w-[140px] print:bg-white print:border print:border-gray-200">
                  <div className="text-xs text-gray-500 font-bold mb-1">الدرجة الإجمالية</div>
                  <div className="text-3xl font-black text-indigo-600">{currentScore} <span className="text-lg text-gray-400 font-medium">/ {totalPossible}</span></div>
                </div>
              </div>
            </div>

            {/* Criteria List */}
            <div className="space-y-6 print:space-y-0 print:border-t print:border-gray-200">
              {currentCriteria.map((criterion, idx) => {
                const max = criterion.max || 4;
                return (
                  <div key={criterion.id || idx} className="bg-white p-6 print:p-1.5 print:px-2 rounded-2xl border border-gray-100 shadow-sm print:border-0 print:border-b print:border-gray-200 print:rounded-none print:shadow-none print:flex print:items-center print:justify-between print:gap-4 group relative">
                    <div className="flex items-center gap-4 mb-6 print:mb-0 print:flex-1">
                      <div className="w-8 h-8 print:w-6 print:h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm print:text-xs shrink-0 print:border print:border-indigo-100">
                        {idx + 1}
                      </div>
                      <div className="font-bold text-gray-800 text-lg print:text-[10px] print:font-medium leading-relaxed print:leading-tight print:m-0 flex items-center flex-1">
                        <span className="flex-1">{criterion.text}</span>
                        <div className="flex items-center no-print">
                          <InlineEditBtn 
                            path={getCriteriaPath(idx)} 
                            value={criterion.text} 
                          />
                          {isEditMode && (
                            <button 
                              onClick={() => {
                                if (window.confirm('هل تريد حذف هذا البند؟')) {
                                  setGlobalConfig(prev => {
                                    const newConfig = JSON.parse(JSON.stringify(prev));
                                    const path = getCriteriaPath(idx);
                                    // Remove the 'text' property from path to get the array path
                                    const arrayPath = path.slice(0, -2); 
                                    const index = path[path.length - 2];
                                    
                                    let current = newConfig;
                                    for (const p of arrayPath) current = current[p];
                                    current.splice(index, 1);
                                    return newConfig;
                                  });
                                }
                              }}
                              className="p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"
                              title="حذف البند"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 print:gap-1 print:shrink-0">
                      {Array.from({ length: max }).map((_, i) => {
                        const val = i + 1;
                        const isSelected = scores[criterion.id] === val;
                        return (
                          <button
                            key={val}
                            onClick={() => setScores(prev => ({ ...prev, [criterion.id]: val }))}
                            className={`flex-1 py-3 px-4 print:py-0.5 print:px-2 rounded-xl print:rounded-md font-bold print:text-xs transition-all border-2 print:border ${
                              isSelected 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 -translate-y-0.5 print:-translate-y-0 print:shadow-none print:bg-indigo-600 print:text-white print:border-indigo-600' 
                                : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-100 hover:text-indigo-600 print:hidden'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                      {scores[criterion.id] === undefined && (
                        <div className="hidden print:block text-red-500 font-bold text-xs italic print:px-4">
                          لم يتم التقييم
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {isEditMode && (
                <button 
                  onClick={() => {
                    const newText = window.prompt('أدخل نص البند الجديد:');
                    if (newText) {
                      setGlobalConfig(prev => {
                        const newConfig = JSON.parse(JSON.stringify(prev));
                        const path = getCriteriaPath(0); // Get base path
                        const arrayPath = path.slice(0, -2);
                        
                        let current = newConfig;
                        for (const p of arrayPath) current = current[p];
                        
                        const newId = `crit_${Date.now()}`;
                        current.push({ id: newId, text: newText, max: 4 });
                        return newConfig;
                      });
                    }
                  }}
                  className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-600 font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 no-print"
                >
                  <Plus className="w-5 h-5" />
                  إضافة بند تقييم جديد
                </button>
              )}
            </div>

            {/* Category Summary */}
            {currentScore > 0 && getCategory(currentScore, totalPossible).label && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-3xl border-2 flex items-center justify-between gap-4 ${getCategory(currentScore, totalPossible).bg} border-current/10`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-white shadow-sm ${getCategory(currentScore, totalPossible).color}`}>
                    <Trophy className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 mb-1">المستوى التقديري</h4>
                    <p className={`text-xl font-black ${getCategory(currentScore, totalPossible).color}`}>
                      {getCategory(currentScore, totalPossible).label}
                    </p>
                  </div>
                </div>
                {selectedType === 'periodic' && (
                  <div className="text-left bg-white/80 px-4 py-2 rounded-2xl shadow-sm">
                    <span className="text-xs text-gray-500 font-bold block">الدرجة المحوّلة من 30</span>
                    <span className="text-lg font-black text-indigo-700">
                      {Math.min(30, Number(((currentScore / 45) * 30).toFixed(2)))} / 30
                    </span>
                  </div>
                )}
                {selectedType === 'unit' && (
                  <div className="text-left bg-white/80 px-4 py-2 rounded-2xl shadow-sm">
                    <span className="text-xs text-gray-500 font-bold block">الدرجة المعيارية من 2</span>
                    <span className="text-lg font-black text-indigo-700">
                      {currentScore >= 15 ? '2.00' : (currentScore * 0.1333).toFixed(2)} / 2
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Submit Section */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 flex gap-3 max-w-4xl mx-auto z-10 print:hidden">
              <button 
                onClick={reset}
                className="flex-1 py-4 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all text-sm"
              >
                {isEditMode ? 'إلغاء' : 'رجوع'}
              </button>

              {!isEditMode && (
                <div className="flex-[2.5] bg-amber-50 border border-amber-200 rounded-2xl p-2 flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px] font-bold text-amber-800">وضع العرض فقط - فعل وضع التعديل للحفظ</span>
                </div>
              )}

              {isEditMode && (
                <button 
                  onClick={async () => {
                    try {
                      const cleanedScores = { _evaluationLabel: evaluationLabel };
                      currentCriteria.forEach(c => {
                        const val = scores[c.id] ?? scores[String(c.id)];
                        if (val !== undefined) {
                          cleanedScores[c.id] = val;
                        }
                      });
                      const res = await fetch('/api/evaluations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: evaluationId,
                          student_id: selectedStudent.id,
                          grade_id: selectedGrade,
                          subject_id: selectedSubject,
                          evaluation_type: selectedType,
                          evaluation_date: evaluationDate,
                          scores: cleanedScores
                        })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.evaluation?.id) setEvaluationId(data.evaluation.id);
                        setSelectedStudent(null);
                        setScores({});
                        setEvaluationLabel('');
                        setEvaluationId(null);
                        setPastEvaluations([]);
                        setEvaluationDate(new Date().toISOString().split('T')[0]);
                        await fetchStudents();
                        setStep('student');
                      } else {
                        alert('حدث خطأ أثناء الحفظ');
                      }
                    } catch (e) {
                      console.error(e);
                      alert('حدث خطأ في الاتصال بالخادم');
                    }
                  }}
                  className="flex-[1.5] py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 transition-all text-sm"
                >
                  ✓ حفظ فقط
                </button>
              )}

              {/* Save and Print */}
              <button 
                onClick={async () => {
                  const cleanedScores = { _evaluationLabel: evaluationLabel };
                  currentCriteria.forEach(c => {
                    const val = scores[c.id] ?? scores[String(c.id)];
                    if (val !== undefined) {
                      cleanedScores[c.id] = val;
                    }
                  });
                  if (!isEditMode) {
                    setBatchPrintData([{ student: selectedStudent, evaluation: { evaluationDate, scores: cleanedScores, evaluationType: selectedType } }]);
                    setBatchPrinting(true);
                    return;
                  }
                  try {
                    const res = await fetch('/api/evaluations', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: evaluationId,
                        student_id: selectedStudent.id,
                        grade_id: selectedGrade,
                        subject_id: selectedSubject,
                        evaluation_type: selectedType,
                        evaluation_date: evaluationDate,
                        scores: cleanedScores
                      })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      const savedEv = data.evaluation;
                      if (savedEv && typeof savedEv.scores === 'string') {
                        savedEv.scores = JSON.parse(savedEv.scores);
                      }
                      if (savedEv?.id) setEvaluationId(savedEv.id);
                      await fetchStudents();
                      setBatchPrintData([{ student: selectedStudent, evaluation: savedEv }]);
                      setBatchPrinting(true);
                    } else {
                      alert('حدث خطأ أثناء الحفظ');
                    }
                  } catch (e) {
                    console.error(e);
                    alert('حدث خطأ في الاتصال بالخادم');
                  }
                }}
                className="flex-[2] py-4 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 transition-all text-sm"
              >
                🖨 حفظ وطباعة
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info Area */}
      {step === 'grade' && (
        <div className="mt-16 bg-white/50 border border-gray-100 rounded-3xl p-8">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-600" />
            حول نظام التقييم
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                يهدف هذا النظام إلى توثيق آليات التقييم والتقويم المستخدمة في تدريس مواد الفنون البصرية، بما يشمل أساسيات الرسم، الفنون البصرية السعودية، الرسم الكرتوني، والأشغال اليدوية.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                رُوعي في تصميم أدوات القياس تنوع الأنشطة وتدرجها، مع التركيز على تتبع تقدم الطالب بشكل مستمر ومنهجي.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">1</div>
                <span className="text-xs font-bold text-indigo-900">التقييم التكويني (التقييم الأسبوعي - 20 درجة تقيس أداء النشاط وتحول لدرجة معيارية)</span>
              </div>
              <div className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">2</div>
                <span className="text-xs font-bold text-indigo-900">التقويم المرحلي (بعد مرور 7 أسابيع لرصد أي تأخر مبكر في الأداء)</span>
              </div>
              <div className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">3</div>
                <span className="text-xs font-bold text-indigo-900">التقويم الختامي (تحليل مستوى إتقان المهارات في نهاية الوحدة/الفصل)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStudentManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                إدارة الطلاب
              </h2>
              <button onClick={() => setShowStudentManager(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6">
              {isEditMode ? (
                <div className="flex flex-col gap-3 mb-6">
                  <select 
                    value={selectedGrade || ''} 
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  >
                    <option value="" disabled>اختر الصف لإضافة/عرض الطلاب...</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="اسم الطالب الجديد..." 
                      value={newStudentName}
                      onChange={e => setNewStudentName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addStudent()}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                    <button 
                      onClick={addStudent}
                      className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <p className="text-sm font-bold text-amber-900">وضع العرض فقط - فعل وضع التعديل لإدارة الطلاب</p>
                </div>
              )}

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {Array.isArray(students) && students.filter(s => !selectedGrade || s.gradeId === selectedGrade || !s.gradeId).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-indigo-100 transition-colors group">
                    <span className="font-bold text-gray-700 text-sm">{s.name}</span>
                    {isEditMode && (
                      <button 
                        onClick={() => deleteStudent(s.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف الطالب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {(!Array.isArray(students) || students.filter(s => !selectedGrade || s.gradeId === selectedGrade || !s.gradeId).length === 0) && (
                  <div className="text-center py-8 text-gray-400 text-sm font-semibold">
                    لا يوجد طلاب مسجلين أو حدث خطأ في التحميل
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* BATCH PRINT AREA - EXACT OFFICIAL MINISTRY OF CULTURE TEMPLATE */}
    {batchPrinting && batchPrintData.length > 0 && (
      <div className="print-overlay">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
          
          @media print {
            @page {
              size: A4 portrait;
              margin: 4mm 8mm 4mm 8mm;
            }
            body, html {
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-overlay {
              position: static !important;
              background: white !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            .print-page {
              page-break-before: auto !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              width: 100% !important;
              height: 262mm !important;
              max-height: 262mm !important;
              min-height: 262mm !important;
              padding: 0 !important;
              margin: 0 !important;
              position: relative !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
              background: #ffffff !important;
              box-shadow: none !important;
            }
            .print-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            .print-footer {
              margin-top: auto !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }

          .print-page {
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            direction: rtl;
            color: #1a1a1a;
            width: 210mm;
            height: 297mm;
            min-height: 297mm;
            margin: 0 auto 30px auto;
            padding: 16px 26px 16px 26px;
            background: white;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
            position: relative;
          }
          .print-footer {
            margin-top: auto;
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            width: 100%;
          }
        `}</style>
        
        {/* Control bar */}
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#1e293b', color: '#fff', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '15px' }}>معاينة الطباعة الرسمية ({batchPrintData.length} استمارة)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>المعلم:</span>
              <input 
                 type="text" 
                 placeholder="اسم المعلم / المعلمة..." 
                 value={printTeacherName} 
                 onChange={e => setPrintTeacherName(e.target.value)}
                 style={{ padding: '6px 12px', borderRadius: '8px', color: '#000', border: '1px solid #cbd5e1', width: '220px', fontWeight: 'bold' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => window.print()} className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md">🖨 طباعة الآن</button>
            <button onClick={() => { setBatchPrinting(false); setBatchPrintData([]); }} className="bg-slate-700 text-white px-5 py-2 rounded-xl font-bold hover:bg-slate-600 transition-colors">✕ إغلاق</button>
          </div>
        </div>

        <div style={{ paddingTop: '65px', paddingBottom: '30px', background: '#f1f5f9', minHeight: '100vh' }}>
          {batchPrintData.map((item, pageIdx) => {
            const student = item.student;
            const ev = item.evaluation;
            const sc = ev?.scores || {};
            const evalType = ev?.evaluationType || selectedType || 'periodic';
            const isUnitEval = evalType === 'unit';
            const isFinalEval = evalType === 'final';
            const isPeriodicEval = !isUnitEval && !isFinalEval;

            const sGrade = ev?.gradeId || selectedGrade;
            const gradeName = grades.find((g) => g.id === sGrade)?.name || '';
            const subjectObj = (globalConfig?.subjects || []).find((s) => s.id === (ev?.subjectId || selectedSubject));
            const subjectName = subjectObj?.name || '';
            const baseSubj = subjectObj?.baseSubject || (ev?.subjectId || selectedSubject);
            const sTerm = subjectObj?.term || selectedTerm;
            const termLabel = (sTerm === 'term2' || selectedTerm === 'term2') ? 'الفصل الدراسي الثاني' : 'الفصل الدراسي الأول';
            const evalNum = sc._evaluationLabel || '';

            // Criteria list resolution:
            let critList = [];
            if (isUnitEval) {
              critList = globalConfig?.criteria?.unit || [
                { id: 1, text: 'الالتزام بأسلوب النشاط المطلوب', max: 4 },
                { id: 2, text: 'الحضور والمشاركة الفعّالة', max: 4 },
                { id: 3, text: 'الإبداع والتعبير الشخصي', max: 4 },
                { id: 4, text: 'إتمام النشاط في الوقت المحدد', max: 4 },
                { id: 5, text: 'وضوح الخطوط، التناسق بين الأشكال، والدقة في الألوان', max: 4 }
              ];
            } else if (isFinalEval) {
              critList = globalConfig?.criteria?.final?.[ev?.subjectId || selectedSubject]
                || globalConfig?.criteria?.final?.[`${sGrade}_${ev?.subjectId || selectedSubject}`]
                || (sTerm ? globalConfig?.criteria?.final?.[`${sGrade}_${sTerm}_${baseSubj}`] : null)
                || globalConfig?.criteria?.final?.[`${sGrade}_${baseSubj}`]
                || currentCriteria;
            } else {
              critList = globalConfig?.criteria?.periodic?.[ev?.subjectId || selectedSubject]
                || globalConfig?.criteria?.periodic?.[`${sGrade}_${ev?.subjectId || selectedSubject}`]
                || (sTerm ? globalConfig?.criteria?.periodic?.[`${sGrade}_${sTerm}_${baseSubj}`] : null)
                || globalConfig?.criteria?.periodic?.[`${sGrade}_${baseSubj}`]
                || currentCriteria;
            }

            const totalPossible = isUnitEval ? 20 : isFinalEval ? 50 : 60;
            const totalScore = Math.min(totalPossible, critList.reduce((acc, c) => {
              const val = sc[c.id] ?? sc[String(c.id)];
              return acc + (Number(val) || 0);
            }, 0));

            return (
              <div 
                key={student.id + '_' + pageIdx} 
                className="print-page shadow-xl print:shadow-none"
              >
                {/* Left Margin Ribbon Decoration */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: '2px', 
                    top: '48%', 
                    transform: 'translateY(-50%)', 
                    width: '9px', 
                    height: '420px', 
                    backgroundImage: `url(${mocRibbon})`, 
                    backgroundSize: 'contain', 
                    backgroundRepeat: 'no-repeat', 
                    backgroundPosition: 'center',
                    opacity: 0.95,
                    pointerEvents: 'none'
                  }} 
                />

                {/* Top Section */}
                <div>
                  {/* Ministry of Culture Logo (Top Right) */}
                  <div style={{ display: 'flex', justifyContent: 'flex-start', direction: 'rtl', marginBottom: '4px', marginLeft: '16px' }}>
                    <img 
                      src={mocLogo} 
                      alt="وزارة الثقافة - Ministry of Culture" 
                      style={{ height: '62px', width: 'auto', objectFit: 'contain' }} 
                    />
                  </div>

                  {/* Assessment Header */}
                  <div style={{ marginLeft: '16px' }}>
                    {/* Document Title (Centered, Crimson Red) */}
                    <div style={{ textAlign: 'center', marginTop: '2px', marginBottom: '8px' }}>
                      <h1 style={{ 
                        fontSize: '18px', 
                        fontWeight: '900', 
                        color: '#9e2a2b', 
                        letterSpacing: '-0.3px',
                        margin: 0
                      }}>
                        {isFinalEval 
                          ? `استمارة التقويم الختامي لأنشطة ${subjectName}` 
                          : isUnitEval 
                            ? `استمارة التقييم التكويني (التقييم الأسبوعي) لأنشطة ${subjectName}`
                            : `استمارة التقويم المرحلي لأنشطة ${subjectName}`}
                      </h1>
                    </div>

                    {/* Metadata Grid: ONLY Student Name, Teacher Name, and Date */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr',
                      rowGap: '6px',
                      columnGap: '20px',
                      background: '#faf6f7',
                      border: '1px solid #ebd8dc',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      marginBottom: '8px',
                      fontSize: '11.5px',
                      fontWeight: 'bold',
                      color: '#333',
                      direction: 'rtl'
                    }}>
                      {/* Row 1: Student Name (Right) | Teacher Name (Left) */}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#666', width: '130px', flexShrink: 0 }}>اسم الطالب / الطالبة:</span>
                        <span style={{ color: '#111', fontWeight: '900', fontSize: '12.5px' }}>{student.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#666', width: '130px', flexShrink: 0 }}>اسم المعلم / المعلمة:</span>
                        <span style={{ color: '#111', fontWeight: '900' }}>{printTeacherName || 'ـــــــــــــــــ'}</span>
                      </div>

                      {/* Row 2: Date */}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#666', width: '130px', flexShrink: 0 }}>التاريخ:</span>
                        <span style={{ color: '#111', fontWeight: '900' }}>{ev?.evaluationDate || new Date().toISOString().split('T')[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Assessment Table */}
                  <table style={{
                    width: 'calc(100% - 16px)',
                    marginLeft: '16px',
                    borderCollapse: 'collapse',
                    direction: 'rtl',
                    border: '1px solid #777',
                    fontSize: isUnitEval ? '11.5px' : isFinalEval ? '11px' : '10.5px',
                    tableLayout: 'fixed'
                  }}>
                    <thead>
                      {isFinalEval ? (
                        <tr style={{ height: '34px' }}>
                          <th style={{ width: '5%', background: '#dfbcc8', color: '#1a1a1a', fontWeight: '900', textAlign: 'center', border: '1px solid #777', padding: '2px', fontSize: '11px' }}>#</th>
                          <th style={{ width: '49%', background: '#dfbcc8', color: '#1a1a1a', fontWeight: '900', textAlign: 'center', border: '1px solid #777', padding: '3px 8px', fontSize: '11.5px' }}>مؤشرات التحقق</th>
                          <th style={{ width: '15%', background: '#faebe7', color: '#1a1a1a', fontWeight: '900', textAlign: 'center', border: '1px solid #777', padding: '2px', fontSize: '11px' }}>درجة التحقق</th>
                          <th style={{ width: '16%', background: '#edd0c0', color: '#1a1a1a', fontWeight: '900', textAlign: 'center', border: '1px solid #777', padding: '2px', fontSize: '11px' }}>الدرجة القصوى (موهبة)</th>
                          <th style={{ width: '15%', background: '#962816', color: '#ffffff', fontWeight: '900', textAlign: 'center', border: '1px solid #777', padding: '2px', fontSize: '11px' }}>درجة الطالب</th>
                        </tr>
                      ) : (
                        <tr style={{ height: isUnitEval ? '36px' : '31px' }}>
                          <th style={{ width: '5%', background: '#dfbcc8', color: '#1a1a1a', fontWeight: '900', textAlign: 'center', border: '1px solid #777', padding: '2px', fontSize: '11px' }}>#</th>
                          <th style={{ width: '47%', background: '#dfbcc8', color: '#1a1a1a', fontWeight: '900', textAlign: 'center', border: '1px solid #777', padding: '3px 8px', fontSize: isUnitEval ? '12px' : '11px' }}>
                            {isUnitEval ? 'المعيار' : 'مؤشرات التحقق'}
                          </th>
                          <th style={{ width: '12%', background: '#faebe7', color: '#1a1a1a', fontWeight: '900', textAlign: 'center', border: '1px solid #777', padding: '2px', fontSize: '10px' }}>
                            {isUnitEval ? 'دون الهدف (1)' : 'دون الهدف (١)'}
                          </th>
                          <th style={{ width: '12%', background: '#f8e2da', color: '#1a1a1a', fontWeight: '900', textAlign: 'center', border: '1px solid #777', padding: '2px', fontSize: '10px' }}>
                            {isUnitEval ? 'يقترب من الهدف (2)' : 'اقترب من الهدف (٢)'}
                          </th>
                          <th style={{ width: '12%', background: '#edd0c0', color: '#1a1a1a', fontWeight: '900', textAlign: 'center', border: '1px solid #777', padding: '2px', fontSize: '10px' }}>
                            {isUnitEval ? 'حقق الهدف (3)' : 'أتقن الهدف (٣)'}
                          </th>
                          <th style={{ width: '12%', background: '#962816', color: '#ffffff', fontWeight: '900', textAlign: 'center', border: '1px solid #777', padding: '2px', fontSize: '10px' }}>
                            {isUnitEval ? 'يتخطى الهدف (4)' : 'يتخطى الهدف (٤)'}
                          </th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {critList.map((crit, cIdx) => {
                        const score = Number(sc[crit.id] ?? sc[String(crit.id)]) || 0;
                        if (isFinalEval) {
                          return (
                            <tr key={crit.id || cIdx} style={{ height: '33px' }}>
                              <td style={{ border: '1px solid #777', textAlign: 'center', fontWeight: '900', color: '#333', fontSize: '11px' }}>
                                {cIdx + 1}
                              </td>
                              <td style={{ border: '1px solid #777', padding: '3px 8px', textAlign: 'right', fontWeight: '700', color: '#111', lineHeight: '1.3' }}>
                                {crit.text}
                              </td>
                              <td style={{ border: '1px solid #777', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', color: '#333' }}>
                                {crit.target || (crit.max > 4 ? crit.max - 1 : crit.max)} درجات
                              </td>
                              <td style={{ border: '1px solid #777', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', color: '#333' }}>
                                {crit.max} درجات
                              </td>
                              <td style={{ border: '1px solid #777', textAlign: 'center', verticalAlign: 'middle', fontWeight: '900', fontSize: '13px', color: '#962816' }}>
                                {score > 0 ? score : '—'}
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={crit.id || cIdx} style={{ height: isUnitEval ? '36px' : '30.5px' }}>
                            <td style={{
                              border: '1px solid #777',
                              textAlign: 'center',
                              fontWeight: '900',
                              color: '#333',
                              fontSize: '10.5px'
                            }}>
                              {cIdx + 1}
                            </td>
                            <td style={{
                              border: '1px solid #777',
                              padding: isUnitEval ? '5px 8px' : '3px 8px',
                              textAlign: 'right',
                              fontWeight: '700',
                              color: '#111',
                              lineHeight: '1.3'
                            }}>
                              {crit.text}
                            </td>
                            {[1, 2, 3, 4].map((colVal) => {
                              const isChecked = score === colVal;
                              return (
                                <td 
                                  key={colVal} 
                                  style={{
                                    border: '1px solid #777',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                    padding: '1px'
                                  }}
                                >
                                  <div style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '1.5px solid #444',
                                    borderRadius: '2px',
                                    margin: '0 auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '13px',
                                    fontWeight: '900',
                                    color: '#111',
                                    background: isChecked ? '#fff' : 'transparent'
                                  }}>
                                    {isChecked ? '✓' : ''}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Below table: Unit breakdown, Final breakdown, or Periodic score */}
                  {isUnitEval ? (
                    <div style={{ marginTop: '10px', marginLeft: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <table style={{
                        width: '100%',
                        maxWidth: '390px',
                        borderCollapse: 'collapse',
                        direction: 'rtl',
                        border: '1px solid #777',
                        fontSize: '10px',
                        textAlign: 'center'
                      }}>
                        <thead>
                          <tr style={{ background: '#dfbcc8', fontWeight: 'bold' }}>
                            <th style={{ border: '1px solid #777', padding: '3px 6px' }}>الفئة</th>
                            <th style={{ border: '1px solid #777', padding: '3px 6px' }}>المجموع من 20</th>
                            <th style={{ border: '1px solid #777', padding: '3px 6px' }}>الدرجة المعيارية</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ background: totalScore > 0 && totalScore < 8 ? '#fef3c7' : 'transparent', fontWeight: totalScore > 0 && totalScore < 8 ? 'bold' : 'normal' }}>
                            <td style={{ border: '1px solid #777', padding: '2px 6px' }}>دون الهدف</td>
                            <td style={{ border: '1px solid #777', padding: '2px 6px' }}>أقل من 8</td>
                            <td style={{ border: '1px solid #777', padding: '2px 6px' }}>أقل من 1.07</td>
                          </tr>
                          <tr style={{ background: totalScore >= 8 && totalScore < 12 ? '#fef3c7' : 'transparent', fontWeight: totalScore >= 8 && totalScore < 12 ? 'bold' : 'normal' }}>
                            <td style={{ border: '1px solid #777', padding: '2px 6px' }}>يقترب من الهدف</td>
                            <td style={{ border: '1px solid #777', padding: '2px 6px' }}>من 8 إلى أقل من 12</td>
                            <td style={{ border: '1px solid #777', padding: '2px 6px' }}>1.07 إلى 1.47</td>
                          </tr>
                          <tr style={{ background: totalScore >= 12 && totalScore <= 15 ? '#fef3c7' : 'transparent', fontWeight: totalScore >= 12 && totalScore <= 15 ? 'bold' : 'normal' }}>
                            <td style={{ border: '1px solid #777', padding: '2px 6px' }}>حقق الهدف</td>
                            <td style={{ border: '1px solid #777', padding: '2px 6px' }}>من 12 إلى 15</td>
                            <td style={{ border: '1px solid #777', padding: '2px 6px' }}>1.60 إلى 2.00</td>
                          </tr>
                          <tr style={{ background: totalScore > 15 ? '#fef3c7' : 'transparent', fontWeight: totalScore > 15 ? 'bold' : 'normal' }}>
                            <td style={{ border: '1px solid #777', padding: '2px 6px' }}>يتخطى الهدف (موهوب)</td>
                            <td style={{ border: '1px solid #777', padding: '2px 6px' }}>أكثر من 15</td>
                            <td style={{ border: '1px solid #777', padding: '2px 6px' }}>2.00 من 2</td>
                          </tr>
                        </tbody>
                      </table>
                      <div style={{ marginTop: '6px', fontWeight: '900', fontSize: '12px', color: '#1a1a1a' }}>
                        المجموع: {totalScore > 0 ? `${totalScore} من 20` : '……./20'} {totalScore > 0 ? `(المعيارية: ${totalScore >= 15 ? '2.00' : (totalScore * 0.1333).toFixed(2)} من 2)` : ''}
                      </div>
                    </div>
                  ) : isFinalEval ? (
                    <div style={{ marginTop: '8px', marginLeft: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <table style={{
                        width: '100%',
                        maxWidth: '460px',
                        borderCollapse: 'collapse',
                        direction: 'rtl',
                        border: '1px solid #777',
                        fontSize: '9.5px',
                        textAlign: 'center'
                      }}>
                        <thead>
                          <tr style={{ background: '#dfbcc8', fontWeight: 'bold' }}>
                            <th style={{ border: '1px solid #777', padding: '3px 6px' }}>الفئة التفسيرية</th>
                            <th style={{ border: '1px solid #777', padding: '3px 6px' }}>الدرجة من 40</th>
                            <th style={{ border: '1px solid #777', padding: '3px 6px' }}>الوصف والقرار التربوي</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ background: totalScore > 40 ? '#fef3c7' : 'transparent', fontWeight: totalScore > 40 ? 'bold' : 'normal' }}>
                            <td style={{ border: '1px solid #777', padding: '2px 4px' }}>يتخطى الهدف (موهوب)</td>
                            <td style={{ border: '1px solid #777', padding: '2px 4px' }}>أعلى من 40</td>
                            <td style={{ border: '1px solid #777', padding: '2px 4px', fontSize: '9px' }}>يُنصح بتصميم برنامج فردي إثرائي لتنمية الموهبة</td>
                          </tr>
                          <tr style={{ background: totalScore >= 36 && totalScore <= 40 ? '#fef3c7' : 'transparent', fontWeight: totalScore >= 36 && totalScore <= 40 ? 'bold' : 'normal' }}>
                            <td style={{ border: '1px solid #777', padding: '2px 4px' }}>حقق الهدف (متقن)</td>
                            <td style={{ border: '1px solid #777', padding: '2px 4px' }}>من 36 إلى 40</td>
                            <td style={{ border: '1px solid #777', padding: '2px 4px', fontSize: '9px' }}>أتقن المهارات المطلوبة بأداء مستقر ومتماسك</td>
                          </tr>
                          <tr style={{ background: totalScore >= 20 && totalScore < 36 ? '#fef3c7' : 'transparent', fontWeight: totalScore >= 20 && totalScore < 36 ? 'bold' : 'normal' }}>
                            <td style={{ border: '1px solid #777', padding: '2px 4px' }}>يقترب من الهدف</td>
                            <td style={{ border: '1px solid #777', padding: '2px 4px' }}>من 20 إلى 35</td>
                            <td style={{ border: '1px solid #777', padding: '2px 4px', fontSize: '9px' }}>أداء مقبول بحاجة إلى دعم إضافي لتعزيز الإتقان</td>
                          </tr>
                          <tr style={{ background: totalScore > 0 && totalScore < 20 ? '#fef3c7' : 'transparent', fontWeight: totalScore > 0 && totalScore < 20 ? 'bold' : 'normal' }}>
                            <td style={{ border: '1px solid #777', padding: '2px 4px' }}>دون الهدف</td>
                            <td style={{ border: '1px solid #777', padding: '2px 4px' }}>أقل من 20</td>
                            <td style={{ border: '1px solid #777', padding: '2px 4px', fontSize: '9px' }}>يستلزم إعداد خطة فردية مركزة ودعم أكاديمي</td>
                          </tr>
                        </tbody>
                      </table>
                      <div style={{ marginTop: '6px', fontWeight: '900', fontSize: '12px', color: '#1a1a1a' }}>
                        المجموع الكلي للتقييم الختامي: {totalScore > 0 ? `${totalScore} من 50` : '……./50'}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      direction: 'rtl',
                      marginTop: '8px',
                      marginLeft: '16px',
                      fontSize: '11.5px',
                      fontWeight: '900',
                      color: '#1a1a1a'
                    }}>
                      <div>
                        مجموع درجات التحقق: {totalScore > 0 ? totalScore : '……'} / 60
                      </div>
                      <div style={{ color: '#962816' }}>
                        الدرجة المحوّلة: {totalScore > 0 ? Math.min(30, Number(((totalScore / 45) * 30).toFixed(2))) : '……'} / 30
                      </div>
                      {totalScore > 0 && (
                        <div style={{ color: totalScore > 45 ? '#6b21a8' : totalScore >= 39 ? '#15803d' : totalScore >= 31 ? '#b45309' : '#b91c1c' }}>
                          المستوى: {totalScore > 45 ? 'يتخطى الهدف (تُرصد 30)' : totalScore >= 39 ? 'حقق الهدف' : totalScore >= 31 ? 'يقترب من الهدف' : 'لم يحقق الهدف'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Official Page Footer (3-Columns) */}
                <div 
                  className="print-footer" 
                  style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'end',
                    direction: 'rtl',
                    marginLeft: '16px', 
                    width: 'calc(100% - 16px)',
                    borderTop: '1px solid #cbd5e1',
                    paddingTop: '8px',
                    paddingBottom: '2px'
                  }}
                >
                  {/* Right (Col 1 in RTL): وزارة الثقافة */}
                  <div style={{ textAlign: 'right', direction: 'rtl', fontSize: '9.5px', color: '#222', lineHeight: '1.4' }}>
                    <div style={{ fontWeight: 'bold' }}>وزارة الثقافة</div>
                    <div>طريق الملك فيصل، الدرعية</div>
                    <div>ص.ب. 3424، الرياض 13711</div>
                    <div>المملكة العربية السعودية</div>
                  </div>

                  {/* Center (Col 2 in RTL): Contact Info */}
                  <div style={{ textAlign: 'center', direction: 'rtl', fontSize: '9.5px', color: '#222', lineHeight: '1.4' }}>
                    <div style={{ fontFamily: 'monospace', direction: 'ltr' }}>+966 11 836 3352 T</div>
                    <div style={{ fontFamily: 'monospace', direction: 'ltr' }}>+966 11 836 3333 F</div>
                    <div style={{ fontWeight: 'bold', marginTop: '1px' }}>moc.gov.sa</div>
                  </div>

                  {/* Left (Col 3 in RTL): Ministry of Culture English */}
                  <div style={{ textAlign: 'left', direction: 'ltr', fontSize: '9.5px', color: '#222', lineHeight: '1.4' }}>
                    <div style={{ fontWeight: 'bold' }}>Ministry of Culture</div>
                    <div>King Faisal Road, Al Diriyah</div>
                    <div>P.O. Box 3424, Riyadh 13711</div>
                    <div>Kingdom of Saudi Arabia</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
    </>
  );
}
