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
  Package
} from 'lucide-react';


export default function App() {
  const [step, setStep] = useState('grade');
  const [selectedGrade, setSelectedGrade] = useState(null);
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
    return globalConfig.subjects.filter((s) => !s.grades || s.grades.includes(selectedGrade));
  }, [globalConfig, selectedGrade]);

  const currentCriteria = useMemo(() => {
    if (!globalConfig || !selectedType) return [];
    const critConfig = globalConfig.criteria || {};
    if (selectedType === 'unit') return critConfig.unit || [];
    
    const key = `${selectedGrade}_${selectedSubject}`;
    if (selectedType === 'final') {
      if (Array.isArray(critConfig.final)) return critConfig.final;
      return critConfig.final?.[key] || critConfig.final?.[selectedSubject || ''] || critConfig.final?.default || [];
    }
    if (selectedType === 'periodic') {
      return critConfig.periodic?.[key] || critConfig.periodic?.[selectedSubject || ''] || critConfig.periodic?.default || [];
    }
    return [];
  }, [globalConfig, selectedType, selectedSubject, selectedGrade]);

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



  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setGlobalConfig).catch(console.error);
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/students');
        const data = await res.json();
        setStudents(data);
      } catch (e) {
        console.error(e);
      }
    };
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
      if (globalConfig?.criteria?.periodic?.[key]) subjKey = key;
      else if (globalConfig?.criteria?.periodic?.[selectedSubject || '']) subjKey = selectedSubject;
      return ['criteria', 'periodic', subjKey, idx, 'text'];
    }
    if (selectedType === 'final') {
      let subjKey = 'default';
      if (globalConfig?.criteria?.final?.[key]) subjKey = key;
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
    if (!newStudentName.trim()) return;
    if (!selectedGrade) {
      alert('الرجاء اختيار الصف أولاً');
      return;
    }
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStudentName, gradeId: selectedGrade })
      });
      const data = await res.json();
      setStudents([...students, data]);
      setNewStudentName('');
    } catch (e) {
      console.error(e);
    }
  };

  const deleteStudent = async (id) => {
    if (!isEditMode) {
      alert('يجب تفعيل وضع التعديل بكلمة المرور للقيام بهذه العملية');
      return;
    }
    if (!window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    try {
      await fetch(`/api/students/${id}`, { method: 'DELETE' });
      setStudents(students.filter(s => s.id !== id));
      if (selectedStudent?.id === id) {
        setSelectedStudent(null);
        if (step === 'evaluation') setStep('student');
      }
    } catch (e) {
      console.error(e);
    }
  };



  const reset = () => {
    setStep('grade');
    setSelectedGrade(null);
    setSelectedSubject(null);
    setSelectedType(null);
    setSelectedStudent(null);
    setScores({});
    setEvaluationLabel('');
    setEvaluationId(null);
    setPastEvaluations([]);
    setBatchSelected([]);
    setBatchPrintData([]);
  };

  const handleBack = () => {
    if (step === 'subject') setStep('grade');
    else if (step === 'type') setStep('subject');
    else if (step === 'student') setStep('type');
    else if (step === 'history') setStep('student');
    else if (step === 'evaluation') {
      if (pastEvaluations.length > 0) setStep('history');
      else setStep('student');
    }
  };

  const totalPossible = useMemo(() => {
    return currentCriteria.reduce((acc, curr) => acc + (curr.max || 4), 0);
  }, [currentCriteria]);

  const currentScore = useMemo(() => {
    return Object.entries(scores).reduce((acc, [key, curr]) => {
      if (key.startsWith('_')) return acc;
      return acc + (typeof curr === 'number' ? curr : 0);
    }, 0);
  }, [scores]);

  const getCategory = (score, total) => {
    const percentage = (score / total) * 100;
    if (selectedType === 'unit') {
      if (score > 15) return { label: 'يتخطى الهدف (موهوب)', color: 'text-purple-600', bg: 'bg-purple-100' };
      if (score >= 12) return { label: 'حقق الهدف', color: 'text-green-600', bg: 'bg-green-100' };
      if (score >= 8) return { label: 'يقترب من الهدف', color: 'text-amber-600', bg: 'bg-amber-100' };
      return { label: 'دون الهدف', color: 'text-red-600', bg: 'bg-red-100' };
    }
    if (selectedType === 'final') {
      if (score > 40) return { label: 'طالب موهوب', color: 'text-purple-600', bg: 'bg-purple-100' };
      if (score >= 36) return { label: 'طالب متقن', color: 'text-green-600', bg: 'bg-green-100' };
      if (score >= 20) return { label: 'اقترب من تحقيق الهدف', color: 'text-amber-600', bg: 'bg-amber-100' };
      return { label: 'دون الأهداف (يحتاج خطة تطوير)', color: 'text-red-600', bg: 'bg-red-100' };
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
            {grades.map((grade) => (
              <button
                key={grade.id}
                onClick={() => {
                  setSelectedGrade(grade.id);
                  setStep('subject');
                }}
                className="group p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all text-right flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-gray-50 group-hover:bg-indigo-50 rounded-2xl transition-colors">
                    <GraduationCap className="w-8 h-8 text-gray-400 group-hover:text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
                      {grade.name}
                      <InlineEditBtn 
                        path={['grades', globalConfig?.grades?.findIndex((g) => g.id === grade.id), 'name']} 
                        value={grade.name} 
                      />
                    </h3>
                    <p className="text-gray-500 text-sm">اختر الصف الدراسي للبدء بالتقييم</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-indigo-600 group-hover:translate-l-2 transition-all rtl:rotate-180" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Step 2: Subject Selection */}
        {step === 'subject' && (
          <motion.div 
            key="step-subject"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="col-span-full mb-4">
              <h2 className="text-lg font-bold text-gray-900">اختر المقرر الدراسي</h2>
            </div>
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => {
                  setSelectedSubject(subject.id);
                  setStep('type');
                }}
                className="group p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-right"
              >
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors flex items-center justify-between w-full">
                  <span className="flex-1">{subject.name}</span>
                  <InlineEditBtn 
                    path={['subjects', globalConfig?.subjects?.findIndex((s) => s.id === subject.id), 'name']} 
                    value={subject.name} 
                  />
                </h3>
              </button>
            ))}
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
                  <InlineEditBtn path={['evalTypeTitles', 'unit']} value={globalConfig?.evalTypeTitles?.unit || 'تقييم نهاية الوحدة (20 درجة)'} />
                </div>
                <div className="p-4 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                  <ClipboardCheck className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-800">{globalConfig?.evalTypeTitles?.unit || 'تقييم نهاية الوحدة (20 درجة)'}</h3>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">اختر الطالب / الطالبة</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">إجمالي: {students.filter(s => s.gradeId === selectedGrade || !s.gradeId).length}</span>
                {batchSelected.length > 0 && (
                  <button
                    onClick={async () => {
                      const ids = batchSelected.join(',');
                      try {
                        const res = await fetch(`/api/evaluations/batch?student_ids=${ids}&grade_id=${selectedGrade}&subject_id=${selectedSubject}&evaluation_type=${selectedType}`);
                        if (res.ok) {
                          const data = await res.json();
                          setBatchPrintData(data);
                          setBatchPrinting(true);
                        } else {
                          alert('حدث خطأ في تحميل بيانات الطلاب');
                        }
                      } catch(e) {
                        console.error(e);
                        alert('تأكد من تشغيل الخادم');
                      }
                    }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
                  >
                    🖨 طباعة المختارين ({batchSelected.length})
                  </button>
                )}
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
                    />
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setStep('history');
                      }}
                      className="flex items-center justify-between flex-1 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          {student.name[0]}
                        </div>
                        <span className="font-semibold text-gray-800">{student.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {count > 0 && <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-1 rounded-full">التقييمات: {count}</span>}
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-colors rtl:rotate-180" />
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
            {/* Select All / Deselect All */}
            {students.filter(s => s.gradeId === selectedGrade || !s.gradeId).length > 1 && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setBatchSelected(students.filter(s => s.gradeId === selectedGrade || !s.gradeId).map(s => s.id))}
                  className="text-sm font-bold text-indigo-600 hover:underline"
                >
                  تحديد الكل
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setBatchSelected([])}
                  className="text-sm font-bold text-gray-400 hover:underline"
                >
                  إلغاء التحديد
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 4.5: History */}
        {step === 'history' && (
          <motion.div
            key="step-history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">سجل تقييمات: {selectedStudent?.name}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-bold">التقييمات السابقة: {pastEvaluations.length}</span>
              </div>
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
                const label = parsedScores._evaluationLabel || 'التقييم';
                return (
                  <button
                    key={ev.id}
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
                        setScores(s);
                      }
                      setStep('evaluation');
                    }}
                    className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-800">{label}</div>
                        <div className="text-sm text-gray-500">{ev.evaluationDate}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-colors rtl:rotate-180" />
                  </button>
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
                  <div key={criterion.id} className="bg-white p-6 print:p-1.5 print:px-2 rounded-2xl border border-gray-100 shadow-sm print:border-0 print:border-b print:border-gray-200 print:rounded-none print:shadow-none print:flex print:items-center print:justify-between print:gap-4">
                    <div className="flex items-center gap-4 mb-6 print:mb-0 print:flex-1">
                      <div className="w-8 h-8 print:w-6 print:h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm print:text-xs shrink-0 print:border print:border-indigo-100">
                        {idx + 1}
                      </div>
                      <p className="font-bold text-gray-800 text-lg print:text-xs print:font-medium leading-relaxed print:leading-tight print:m-0 flex items-center flex-1">
                        <span className="flex-1">{criterion.text}</span>
                        <InlineEditBtn 
                          path={getCriteriaPath(idx)} 
                          value={criterion.text} 
                        />
                      </p>
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
                      {/* Placeholder for print when nothing is selected */}
                      {scores[criterion.id] === undefined && (
                        <div className="hidden print:block text-red-500 font-bold text-xs italic print:px-4">
                          لم يتم التقييم
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Category Summary */}
            {(selectedType === 'unit' || selectedType === 'final') && currentScore > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-3xl border-2 flex items-center gap-4 ${getCategory(currentScore, totalPossible).bg} border-current/10`}
              >
                <div className={`p-3 rounded-2xl bg-white shadow-sm ${getCategory(currentScore, totalPossible).color}`}>
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-500 mb-1">المستوى التقديري</h4>
                  <p className={`text-xl font-black ${getCategory(currentScore, totalPossible).color}`}>
                    {getCategory(currentScore, totalPossible).label}
                  </p>
                </div>
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
                          scores: { ...scores, _evaluationLabel: evaluationLabel }
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
                  if (!isEditMode) {
                    setBatchPrintData([{ student: selectedStudent, evaluation: { evaluationDate, scores: { ...scores, _evaluationLabel: evaluationLabel }, evaluationType: selectedType } }]);
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
                        scores: { ...scores, _evaluationLabel: evaluationLabel }
                      })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      if (data.evaluation?.id) setEvaluationId(data.evaluation.id);
                      setBatchPrintData([{ student: selectedStudent, evaluation: data.evaluation }]);
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
                <span className="text-xs font-bold text-indigo-900">تقييم نهاية الوحدة (10 درجات أسبوعياً تقيس الأداء في النشاط المنفذ)</span>
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
                {students.filter(s => !selectedGrade || s.gradeId === selectedGrade || !s.gradeId).map(s => (
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
                {students.filter(s => !selectedGrade || s.gradeId === selectedGrade || !s.gradeId).length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm font-semibold">
                    لا يوجد طلاب مسجلين
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* BATCH PRINT AREA */}
    {batchPrinting && batchPrintData.length > 0 && (
      <div className="print-overlay">
        {/* Control bar - only visible on screen, not printed */}
        <div className="no-print" style={{ position: 'sticky', top: 0, background: '#1e293b', color: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '15px' }}>معاينة الطباعة ({batchPrintData.length} طالب)</span>
            <input 
               type="text" 
               placeholder="اكتب اسم المعلم هنا للطباعة..." 
               value={printTeacherName} 
               onChange={e => setPrintTeacherName(e.target.value)}
               style={{ padding: '6px 12px', borderRadius: '6px', color: '#000', border: '1px solid #cbd5e1', fontSize: '13px', minWidth: '250px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => window.print()}
              style={{ background: '#fff', color: '#1e293b', border: 'none', borderRadius: '8px', padding: '8px 20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
            >
              🖨 طباعة الآن
            </button>
            <button
              onClick={() => { setBatchPrinting(false); setBatchPrintData([]); setBatchSelected([]); }}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px 20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
            >
              ✕ إغلاق
            </button>
          </div>
        </div>
        {batchPrintData.map((item, pageIdx) => {
          const student = item.student;
          const ev = item.evaluation;
          const sc = ev?.scores || {};
          const totalScore = currentCriteria.reduce((acc, c) => {
            const v = sc[c.id];
            return acc + (typeof v === 'number' ? v : 0);
          }, 0);
          const totalMax = currentCriteria.reduce((acc, c) => acc + (c.max || 4), 0);
          const gradeName = grades.find((g) => g.id === selectedGrade)?.name || '';
          const subjectName = (globalConfig?.subjects || []).find((s) => s.id === selectedSubject)?.name || '';
          const evalTypeLabel = ev?.evaluationType === 'unit'
            ? (globalConfig?.evalTypeTitles?.unit || 'تقييم نهاية الوحدة')
            : ev?.evaluationType === 'periodic'
            ? (globalConfig?.evalTypeTitles?.periodic || 'التقويم المرحلي')
            : (globalConfig?.evalTypeTitles?.final || 'التقويم الختامي');
          const label = sc._evaluationLabel || '';
          
          const category = getCategory(totalScore, totalMax);

          return (
            <div
              key={student.id}
              style={{
                pageBreakAfter: 'always',
                breakAfter: 'page',
                pageBreakInside: 'avoid',
                fontFamily: 'Cairo, Arial, sans-serif',
                direction: 'rtl',
                padding: '0',
                minHeight: '29.7cm',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                display: 'block',
                overflow: 'hidden',
                color: '#1e293b',
                background: 'white',
                position: 'relative'
              }}
            >
              {/* Background Watermark/Logo */}
              <div style={{ 
                position: 'absolute', 
                top: '55%', 
                left: '50%', 
                transform: 'translate(-50%, -50%) rotate(-15deg)', 
                opacity: 0.04, 
                fontSize: '180px', 
                fontWeight: '900', 
                color: '#1e293b', 
                zIndex: 0, 
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}>
                وزارة الثقافة
              </div>

              {/* Page Content Container */}
              <div style={{ flex: 1, padding: '0.5cm 1cm', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 5, width: '100%', boxSizing: 'border-box' }}>
                
                {/* Official Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                       <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '900', fontSize: '24px', color: '#0f172a', lineHeight: '1', letterSpacing: '-0.02em' }}>وزارة الثقـــــافة</div>
                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', marginTop: '2px' }}>Ministry of Culture</div>
                       </div>
                       <div style={{ width: '45px', height: '45px', background: '#1e293b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Palette className="w-7 h-7 text-white" />
                       </div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#475569', background: '#f8fafc', padding: '6px 16px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'inline-block', marginTop: '4px' }}>
                       {evalTypeLabel} — {subjectName}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: '#94a3b8', fontWeight: '800', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ color: '#64748b' }}>مسار الفنون البصرية</div>
                    <div style={{ color: '#94a3b8' }}>الصف الدراسي: {gradeName}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', margin: '35px 0' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>
                    استمارة تقييم لأنشطة {subjectName}
                  </h2>
                </div>

                {/* Student/Teacher Metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: '15px', columnGap: '40px', marginBottom: '25px', fontSize: '13px', color: '#334155', width: '100%' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontWeight: '800', whiteSpace: 'nowrap' }}>اسم الطالب / الطالبة:</span>
                    <span style={{ fontWeight: '900', color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', minWidth: 0 }}>
                    <span style={{ fontWeight: '800', whiteSpace: 'nowrap' }}>اسم المعلم / المعلمة:</span>
                    <span style={{ flex: 1, borderBottom: printTeacherName ? 'none' : '3px dotted #60a5fa', marginBottom: '4px', minWidth: '50px', fontWeight: '900', color: '#000' }}>{printTeacherName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontWeight: '800', whiteSpace: 'nowrap' }}>التاريخ:</span>
                    <span style={{ fontWeight: '900', color: '#000', whiteSpace: 'nowrap' }}>{ev?.evaluationDate || new Date().toISOString().split('T')[0]}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', minWidth: 0 }}>
                    <span style={{ fontWeight: '800', whiteSpace: 'nowrap' }}>عنوان الوحدة الدراسية:</span>
                    {label && <span style={{ color: '#60a5fa', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{label}</span>}
                    <span style={{ flex: 1, borderBottom: '3px dotted #60a5fa', marginBottom: '4px', minWidth: '20px' }}></span>
                  </div>
                </div>

                {/* Main Table */}
                <div style={{ flex: 1 }}>
                  <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ border: '1px solid #000', padding: '12px 5px', width: '40px', fontWeight: '900' }}>#</th>
                        <th style={{ border: '1px solid #000', padding: '12px 15px', textAlign: 'center', fontWeight: '900' }}>المعيار</th>
                        <th style={{ border: '1px solid #000', padding: '10px 5px', width: '90px', background: '#9ca3af', color: 'white', fontWeight: '900' }}>دون الهدف (1)</th>
                        <th style={{ border: '1px solid #000', padding: '10px 5px', width: '90px', background: '#60a5fa', color: 'white', fontWeight: '900' }}>يقترب من الهدف (2)</th>
                        <th style={{ border: '1px solid #000', padding: '10px 5px', width: '90px', background: '#2563eb', color: 'white', fontWeight: '900' }}>حقق الهدف (3)</th>
                        <th style={{ border: '1px solid #000', padding: '10px 5px', width: '90px', background: '#7c3aed', color: 'white', fontWeight: '900' }}>يتخطى الهدف (4)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentCriteria.map((criterion, idx) => {
                        const score = Number(sc[criterion.id]);
                        return (
                          <tr key={criterion.id}>
                            <td style={{ border: '1px solid #000', padding: '14px 5px', textAlign: 'center', fontWeight: '900' }}>{idx + 1}</td>
                            <td style={{ border: '1px solid #000', padding: '14px 15px', fontWeight: '800', lineHeight: '1.5' }}>{criterion.text}</td>
                            {[1, 2, 3, 4].map(level => (
                              <td key={level} style={{ border: '1px solid #000', padding: '0', textAlign: 'center' }}>
                                <div style={{ 
                                  margin: '0 auto', 
                                  width: '22px', 
                                  height: '22px', 
                                  border: '1px solid #000', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  background: 'transparent',
                                  fontWeight: '900',
                                  fontSize: '16px',
                                  color: '#000'
                                }}>
                                  {score === level && '✓'}
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                      {/* Total Score and Evaluation Row */}
                      <tr style={{ background: '#f1f5f9' }}>
                        <td colSpan={2} style={{ border: '1px solid #000', padding: '14px 15px', textAlign: 'left', fontWeight: '900', fontSize: '14px' }}>
                          المجموع الكلي: <span style={{ padding: '0 10px', fontSize: '16px' }}>{totalScore}</span> من {totalMax}
                        </td>
                        <td colSpan={4} style={{ border: '1px solid #000', padding: '14px 15px', textAlign: 'center', fontWeight: '900', fontSize: '14px', color: '#1d4ed8' }}>
                          تقييم الطالب: {category?.label || ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Official Footer with Page Number */}
                <div style={{ marginTop: 'auto', paddingTop: '30px', borderTop: '2px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <div style={{ width: '35px', height: '35px', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '16px' }}>
                        {pageIdx + 1}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', lineHeight: '1.4' }}>
                         وزارة الثقـــــافة<br />
                         Kingdom of Saudi Arabia<br />
                         Ministry of Culture
                      </div>
                   </div>
                   <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textAlign: 'center' }}>
                      طريق الملك فيصل، الدرعية<br />
                      P.O. Box 3424, Riyadh 13711
                   </div>
                   <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textAlign: 'left' }}>
                      moc.gov.sa<br />
                      +966 11 836 3333 ف<br />
                      +966 11 836 3352 هـ
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}

    </>
  );
}
