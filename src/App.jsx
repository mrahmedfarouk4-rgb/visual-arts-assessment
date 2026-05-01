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
    
    if (!critConfig) return [];

    const key = `${selectedGrade}_${selectedSubject}`;
    
    // 1. Try specific key (grade_subject)
    let found = critConfig[key];
    
    // 2. Try subject only key
    if (!found) found = critConfig[selectedSubject];
    
    // 3. Try type-based legacy paths
    if (!found) {
      if (selectedType === 'unit') found = critConfig.unit;
      else if (selectedType === 'final') found = critConfig.final?.[key] || critConfig.final?.[selectedSubject];
      else if (selectedType === 'periodic') found = critConfig.periodic?.[key] || critConfig.periodic?.[selectedSubject];
    }

    // 4. Fallback to default
    if (!found) found = critConfig.default || [];

    return Array.isArray(found) ? found : [];
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
    if (step === 'teacher') setStep('grade');
    else if (step === 'subject') setStep('teacher');
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
                  setStep('teacher');
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

    {/* BATCH PRINT AREA */}
    {batchPrinting && batchPrintData.length > 0 && (
      <div className="print-overlay">
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
            .print-overlay { position: static !important; background: white !important; padding: 0 !important; }
            .no-print { display: none !important; }
            .print-page { 
              page-break-after: always !important; 
              break-after: page !important;
              display: block !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .print-page:last-child { page-break-after: auto !important; }
          }
        `}</style>
        
        {/* Control bar */}
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#1e293b', color: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontWeight: 'bold' }}>معاينة الطباعة ({batchPrintData.length} طالب)</span>
            <input 
               type="text" 
               placeholder="اسم المعلم..." 
               value={teacherName} 
               onChange={e => setTeacherName(e.target.value)}
               style={{ padding: '6px 12px', borderRadius: '6px', color: '#000', border: 'none', width: '200px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => window.print()} className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold hover:bg-slate-100 transition-colors">🖨 طباعة الآن</button>
            <button onClick={() => { setBatchPrinting(false); setBatchPrintData([]); }} className="bg-slate-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-600 transition-colors">✕ إغلاق</button>
          </div>
        </div>

        <div style={{ paddingTop: '60px' }}>
          {batchPrintData.map((item) => {
            const student = item.student;
            const ev = item.evaluation;
            const sc = ev?.scores || {};
            const totalScore = currentCriteria.reduce((acc, c) => acc + (Number(sc[c.id]) || 0), 0);
            const totalMax = currentCriteria.length * 4;
            const gradeName = grades.find((g) => g.id === selectedGrade)?.name || '';
            const subjectName = (globalConfig?.subjects || []).find((s) => s.id === selectedSubject)?.name || '';
            const evalTypeLabel = ev?.evaluationType === 'unit' ? 'تقييم نهاية الوحدة' : ev?.evaluationType === 'periodic' ? 'التقويم المرحلي' : 'التقويم الختامي';

            return (
              <div key={student.id} className="print-page bg-white p-8 max-w-[21cm] mx-auto mb-8 shadow-lg border border-gray-200" style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
                <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
                  <div className="text-right">
                    <h1 className="text-2xl font-black text-black">وزارة الثقافة</h1>
                    <p className="text-sm font-bold text-gray-600">مسار الفنون البصرية</p>
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-black text-black">{evalTypeLabel}</h2>
                    <p className="text-sm font-bold">{subjectName}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold">التاريخ: {ev?.evaluationDate || new Date().toLocaleDateString('ar-SA')}</p>
                    <p className="text-xs font-bold">الصف: {gradeName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm font-bold">اسم الطالب: <span className="font-black text-indigo-700">{student.name}</span></p>
                  <p className="text-sm font-bold">المعلم: <span className="font-black border-b-2 border-gray-400 min-w-[100px] inline-block">{teacherName}</span></p>
                </div>

                <table className="w-full border-collapse border-2 border-black text-[10px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border-2 border-black p-1 w-8">#</th>
                      <th className="border-2 border-black p-1 text-right">معيار التقييم</th>
                      <th className="border-2 border-black p-1 w-12 text-center">دون الهدف<br/>(1)</th>
                      <th className="border-2 border-black p-1 w-12 text-center">يقترب<br/>(2)</th>
                      <th className="border-2 border-black p-1 w-12 text-center">حقق<br/>(3)</th>
                      <th className="border-2 border-black p-1 w-12 text-center bg-indigo-50">يتخطى<br/>(4)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCriteria.map((crit, idx) => {
                      const score = Number(sc[crit.id]) || 0;
                      return (
                        <tr key={crit.id} className="hover:bg-gray-50">
                          <td className="border-2 border-black p-1 text-center font-bold">{idx + 1}</td>
                          <td className="border-2 border-black p-1 font-bold text-right leading-tight">{crit.text}</td>
                          {[1, 2, 3, 4].map(num => (
                            <td key={num} className={`border-2 border-black p-1 text-center text-base font-black ${num === 4 ? 'bg-indigo-50' : ''}`}>
                              {score === num ? '✓' : ''}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-black text-sm">
                      <td colSpan="2" className="border-2 border-black p-3 text-right">المجموع الكلي</td>
                      <td colSpan="4" className="border-2 border-black p-3 text-center text-lg">{totalScore} من {totalMax}</td>
                    </tr>
                  </tfoot>
                </table>

                <div className="mt-6 flex justify-between items-end">
                  <div className="text-xs font-bold text-gray-400">نظام تقييم الفنون البصرية © 2026</div>
                  <div className="text-center">
                    <div className="w-32 h-16 border-2 border-dashed border-gray-300 rounded-lg mb-1"></div>
                    <p className="text-[10px] font-bold">ختم المدرسة</p>
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

export default App;
