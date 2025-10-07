import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AssessmentRecord, AttendanceRecordDoc, Student, Subject, Class, subscribeToAssessments, subscribeToStudents, subscribeToSubjects, subscribeToClasses, subscribeToAttendance, Teacher, subscribeToTeachers } from '@/lib/database-operations';
import { getSchoolSettings, SchoolSettings } from '@/lib/school-settings';
import { useSearchParams } from 'react-router-dom';
import { countWeekdays } from '@/lib/utils';

type StudentReport = {
  student: Student;
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    classwork: number;
    exam: number;
    total: number;
    grade: string;
    remarks: string;
  }>;
  totalMarks: number;
  averageMarks: number;
  overallGrade: string;
  attendance?: {
    opened: number;
    present: number;
    absent: number;
  };
};

function computeGrade(percentage: number): string {
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

function computeRemark(grade: string): string {
  switch (grade) {
    case 'A': return 'Excellent';
    case 'B': return 'Very Good';
    case 'C': return 'Good';
    case 'D': return 'Needs Improvement';
    default: return 'Unsatisfactory';
  }
}

export default function ReportCardPrintPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecordDoc[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  useEffect(() => {
    const unsubA = subscribeToAssessments(setAssessments);
    const unsubS = subscribeToStudents(setStudents);
    const unsubSub = subscribeToSubjects(setSubjects);
    const unsubC = subscribeToClasses(setClasses);
    const unsubT = subscribeToTeachers(setTeachers);
    const unsubAtt = subscribeToAttendance(setAttendance);
    // load settings
    getSchoolSettings().then(setSettings).catch(() => {});
    return () => { unsubA(); unsubS(); unsubSub(); unsubC(); unsubT(); unsubAtt(); };
  }, []);

  const targetClass = useMemo(() => classes.find(c => c.id === classId), [classes, classId]);

  const classStudents = useMemo(() => {
    const clsName = targetClass?.name || targetClass?.className;
    const list = students.filter(s => clsName ? s.className === clsName : false);
    const onlyId = searchParams.get('studentId');
    return onlyId ? list.filter(s => s.id === onlyId) : list;
  }, [students, targetClass, searchParams]);

  // All students in the class (without filtering by studentId) for position calculations
  const allClassStudents = useMemo(() => {
    const clsName = targetClass?.name || targetClass?.className;
    return students.filter(s => clsName ? s.className === clsName : false);
  }, [students, targetClass]);

  const subjectById = useMemo(() => Object.fromEntries(subjects.map(s => [s.id!, s])), [subjects]);

  const reports: StudentReport[] = useMemo(() => {
    // Build per-student subject breakdown
    return classStudents.map(student => {
      const aForStudent = assessments.filter(a => a.studentId === student.id);
      const subjectIds = Array.from(new Set(aForStudent.map(a => a.subjectId).filter(Boolean)));
      const rows = subjectIds.map(sid => {
        const items = aForStudent.filter(a => a.subjectId === sid);
        const classwork = items.filter(i => i.assessmentType !== 'exam').reduce((sum, i) => sum + (i.score || 0), 0);
        const exam = items.filter(i => i.assessmentType === 'exam').reduce((sum, i) => sum + (i.score || 0), 0);
        const totalMax = items.reduce((sum, i) => sum + (i.maxScore || 0), 0) || 100; // fallback
        const total = classwork + exam;
        const percentage = totalMax > 0 ? (total / totalMax) * 100 : 0;
        const grade = computeGrade(percentage);
        return {
          subjectId: sid,
          subjectName: subjectById[sid]?.name || sid,
          classwork,
          exam,
          total,
          grade,
          remarks: computeRemark(grade),
        };
      });

      const totalMarks = rows.reduce((sum, r) => sum + r.total, 0);
      const totalMax = aForStudent.reduce((sum, i) => sum + (i.maxScore || 0), 0) || (rows.length * 100);
      const averageMarks = rows.length ? totalMarks / rows.length : 0;
      const overallPercent = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;
      const overallGrade = computeGrade(overallPercent);

      // Attendance based on term dates (weekdays only)
      const classAttendance = attendance.filter(r => r.classId === (targetClass?.id || ''));
      const attForStudent = classAttendance.flatMap(r => r.entries.filter(e => e.studentId === student.id));
      
      // Calculate total weekdays in term
      let opened = 0;
      if (settings?.termStartDate && settings?.termEndDate) {
        opened = countWeekdays(settings.termStartDate, settings.termEndDate);
      } else {
        // Fallback to counting attendance records if term dates not set
        opened = classAttendance.length;
      }
      
      const present = attForStudent.filter(e => e.status === 'present').length;
      const absent = Math.max(0, opened - present);

      return {
        student,
        subjects: rows,
        totalMarks,
        averageMarks,
        overallGrade,
        attendance: opened ? { opened, present, absent } : undefined,
      };
    });
  }, [assessments, classStudents, subjectById, attendance, targetClass?.id, settings]);

  // Build full reports for the entire class (used to compute positions over the full class)
  const fullClassReports: StudentReport[] = useMemo(() => {
    return allClassStudents.map(student => {
      const aForStudent = assessments.filter(a => a.studentId === student.id);
      const subjectIds = Array.from(new Set(aForStudent.map(a => a.subjectId).filter(Boolean)));
      const rows = subjectIds.map(sid => {
        const items = aForStudent.filter(a => a.subjectId === sid);
        const classwork = items.filter(i => i.assessmentType !== 'exam').reduce((sum, i) => sum + (i.score || 0), 0);
        const exam = items.filter(i => i.assessmentType === 'exam').reduce((sum, i) => sum + (i.score || 0), 0);
        const totalMax = items.reduce((sum, i) => sum + (i.maxScore || 0), 0) || 100;
        const total = classwork + exam;
        const percentage = totalMax > 0 ? (total / totalMax) * 100 : 0;
        const grade = computeGrade(percentage);
        return {
          subjectId: sid,
          subjectName: subjectById[sid]?.name || sid,
          classwork,
          exam,
          total,
          grade,
          remarks: computeRemark(grade),
        };
      });

      const totalMarks = rows.reduce((sum, r) => sum + r.total, 0);
      const totalMax = aForStudent.reduce((sum, i) => sum + (i.maxScore || 0), 0) || (rows.length * 100);
      const averageMarks = rows.length ? totalMarks / rows.length : 0;
      const overallPercent = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;
      const overallGrade = computeGrade(overallPercent);

      const classAttendance = attendance.filter(r => r.classId === (targetClass?.id || ''));
      const attForStudent = classAttendance.flatMap(r => r.entries.filter(e => e.studentId === student.id));
      
      // Calculate total weekdays in term
      let opened = 0;
      if (settings?.termStartDate && settings?.termEndDate) {
        opened = countWeekdays(settings.termStartDate, settings.termEndDate);
      } else {
        // Fallback to counting attendance records if term dates not set
        opened = classAttendance.length;
      }
      
      const present = attForStudent.filter(e => e.status === 'present').length;
      const absent = Math.max(0, opened - present);

      return { student, subjects: rows, totalMarks, averageMarks, overallGrade, attendance: opened ? { opened, present, absent } : undefined };
    });
  }, [assessments, allClassStudents, subjectById, attendance, targetClass?.id, settings]);

  const classAverage = useMemo(() => {
    if (!reports.length) return 0;
    const averages = reports.map(r => r.averageMarks || 0);
    return averages.reduce((a, b) => a + b, 0) / averages.length;
  }, [reports]);

  // Determine positions by total marks
  const positions = useMemo(() => {
    const sorted = [...fullClassReports].sort((a, b) => b.totalMarks - a.totalMarks);
    const map = new Map<string, number>();
    sorted.forEach((r, idx) => map.set(r.student.id!, idx + 1));
    return map;
  }, [fullClassReports]);

  const classLabel = targetClass ? (targetClass.name || targetClass.className) : '';
  const classTeacherName = useMemo(() => {
    const id = targetClass?.teacherIds?.[0];
    const t = teachers.find(tt => tt.id === id);
    return t ? `${t.firstName} ${t.lastName}` : '__________';
  }, [teachers, targetClass]);

  const termStart = settings && (settings as any).termStartDate ? (settings as any).termStartDate : '__________';
  const termEnd = settings && (settings as any).termEndDate ? (settings as any).termEndDate : '__________';

  const getGradeBadgeClass = (g: string) => {
    switch (g) {
      case 'A': return 'bg-green-100 text-green-700 border-green-200';
      case 'B': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'C': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'D': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  return (
    <div className="p-6 print:p-0 print-area">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Termly Report Cards – {classLabel}</h1>
          <p className="text-sm text-muted-foreground">Michael Adjei Educational Complex</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded border" onClick={() => navigate(-1)}>Back</button>
          <button className="px-3 py-2 rounded bg-primary text-primary-foreground" onClick={() => window.print()}>Print / Save as PDF</button>
        </div>
      </div>

      <style>{`
        @media print {
          /* Hide everything except the printable area */
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          /* Page styling */
          .page-break { page-break-after: always; }
          .card { box-shadow: none !important; border: 1px solid #ccc !important; }
        }
      `}</style>

      {reports.map((rep, idx) => (
        <div key={rep.student.id} className={`card bg-white border-2 rounded-lg shadow-lg mb-6 relative overflow-hidden ${idx < reports.length - 1 ? 'page-break' : ''}`}> 
          <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600" />
          {/* Decorative Corner Elements */}
          <div className="absolute top-0 left-0 w-24 h-24 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-transparent rounded-br-full"></div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500 to-transparent rounded-bl-full"></div>
          </div>
          {/* Watermark */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02] flex items-center justify-center">
            <div className="text-[8rem] font-extrabold tracking-widest text-blue-700 transform rotate-[-15deg]">MAEC</div>
          </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-center py-3 px-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-emerald-100 ring-2 ring-blue-200 shadow-md">
              <img 
                src="/Crest.jpg" 
                alt="School Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center text-white text-lg font-bold">M</div>';
                  }
                }}
              />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-extrabold bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent leading-tight print:text-blue-700 print:bg-none">
                Michael Adjei Educational Complex
              </h2>
              <div className="mt-1 inline-block">
                <p className="text-[10px] font-semibold text-gray-600 bg-gradient-to-r from-blue-100 to-emerald-100 px-3 py-0.5 rounded-full print:bg-none">
                  Academic Report Card
                </p>
              </div>
              <p className="text-[9px] text-gray-500 mt-1">Excellence in Education</p>
            </div>
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-100 to-blue-100 ring-2 ring-emerald-200 shadow-md">
              <img 
                src="/Crest.jpg" 
                alt="School Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center text-white text-lg font-bold">A</div>';
                  }
                }}
              />
            </div>
          </div>
        </div>

          {/* Student Info Section */}
          <div className="relative z-10 px-4 mb-3">
            <div className="bg-gradient-to-r from-blue-50 via-white to-emerald-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-start justify-between">
                {/* Student Details */}
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Student Name</p>
                    <p className="text-sm font-bold text-blue-800">{rep.student.firstName} {rep.student.lastName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Admission No.</p>
                      <p className="text-[11px] font-semibold text-gray-700">{rep.student.id}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Class & Year</p>
                      <p className="text-[11px] font-semibold text-gray-700">{classLabel} • {settings?.academicYear || '__________'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Date of Birth</p>
                      <p className="text-[11px] font-medium text-gray-700">{rep.student.dateOfBirth || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Parent/Guardian</p>
                      <p className="text-[11px] font-medium text-gray-700">{rep.student.parentName || '-'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Student Photo */}
                <div className="ml-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border-2 border-white shadow-md ring-2 ring-blue-200">
                    {rep.student.photoUrl ? (
                      <img 
                        src={rep.student.photoUrl} 
                        alt={`${rep.student.firstName} ${rep.student.lastName}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-blue-100"><span class="text-2xl font-bold text-blue-600">${rep.student.firstName[0]}${rep.student.lastName[0]}</span></div>`;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100">
                        <span className="text-2xl font-bold text-blue-600">{rep.student.firstName[0]}{rep.student.lastName[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Performance Section */}
          <div className="relative z-10 px-4 mb-3">
            <div className="mb-2">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <div className="w-1 h-4 bg-gradient-to-b from-blue-600 to-emerald-500 rounded-full"></div>
                Academic Performance
              </h3>
            </div>
            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 text-white">
                    <th className="px-2 py-1.5 text-left font-semibold">Subject</th>
                    <th className="px-2 py-1.5 text-center font-semibold">Classwork</th>
                    <th className="px-2 py-1.5 text-center font-semibold">Exam</th>
                    <th className="px-2 py-1.5 text-center font-semibold">Total</th>
                    <th className="px-2 py-1.5 text-center font-semibold">Grade</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {rep.subjects.map((row, idx) => (
                    <tr key={row.subjectId} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}>
                      <td className="px-2 py-1.5 font-medium text-gray-800">{row.subjectName}</td>
                      <td className="px-2 py-1.5 text-center text-gray-700">{row.classwork}</td>
                      <td className="px-2 py-1.5 text-center text-gray-700">{row.exam}</td>
                      <td className="px-2 py-1.5 text-center font-semibold text-gray-900">{row.total}</td>
                      <td className="px-2 py-1.5 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-[9px] ${getGradeBadgeClass(row.grade)}`}>
                          {row.grade}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-gray-700 italic">{row.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Summary & Comments */}
          <div className="relative z-10 px-4 mb-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Left: Stats */}
              <div className="space-y-2">
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-2.5 border border-blue-100">
                  <h4 className="text-[9px] uppercase tracking-wide text-blue-600 font-semibold mb-2">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-md p-2 shadow-sm">
                      <div className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">Total Marks</div>
                      <div className="text-lg font-bold text-blue-700">{rep.totalMarks}</div>
                    </div>
                    <div className="bg-white rounded-md p-2 shadow-sm">
                      <div className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">Average</div>
                      <div className="text-lg font-bold text-emerald-600">{rep.averageMarks.toFixed(1)}</div>
                    </div>
                    <div className="bg-white rounded-md p-2 shadow-sm">
                      <div className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">Position</div>
                      <div className="text-lg font-bold text-purple-600">{positions.get(rep.student.id!) || '-'} / {fullClassReports.length}</div>
                    </div>
                    <div className="bg-white rounded-md p-2 shadow-sm">
                      <div className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">Class Avg</div>
                      <div className="text-lg font-bold text-orange-600">{classAverage.toFixed(1)}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-lg p-2.5 border border-emerald-100">
                  <p className="text-[9px] text-gray-600"><span className="font-bold text-gray-800">Class Teacher:</span> {classTeacherName}</p>
                  <p className="text-[9px] text-gray-600 mt-1"><span className="font-bold text-gray-800">Academic Year:</span> {settings?.academicYear || '__________'}</p>
                </div>
              </div>

              {/* Right: Comments */}
              <div className="space-y-2">
                {(() => {
                  const overallPercent = (() => {
                    const totalMax = assessments.filter(a => a.studentId === rep.student.id).reduce((sum, i) => sum + (i.maxScore || 0), 0);
                    return totalMax > 0 ? (rep.totalMarks / totalMax) * 100 : 0;
                  })();
                  let teacherAuto = '';
                  if (overallPercent >= 90) teacherAuto = 'Excellent performance. Keep it up!';
                  else if (overallPercent >= 70) teacherAuto = 'Good work, but there is room for improvement.';
                  else if (overallPercent >= 50) teacherAuto = 'Fair performance. More effort is required.';
                  else teacherAuto = 'Needs serious improvement. Encourage more study habits.';
                  const headAuto = overallPercent >= 70 ? 'Keep striving for excellence.' : overallPercent >= 50 ? 'Work harder next term.' : 'Parent/guardian should support learning at home.';
                  return (
                    <>
                      <div className="bg-gradient-to-br from-amber-50 to-white rounded-lg p-2.5 border border-amber-200">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                            <span className="text-amber-600 text-[9px]">👨‍🏫</span>
                          </div>
                          <div className="text-[9px] font-bold text-amber-800 uppercase tracking-wide">Class Teacher's Comment</div>
                        </div>
                        <div className="text-[10px] text-gray-700 leading-relaxed pl-7">{teacherAuto}</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg p-2.5 border border-purple-200">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 text-[9px]">👔</span>
                          </div>
                          <div className="text-[9px] font-bold text-purple-800 uppercase tracking-wide">Head Teacher's Comment</div>
                        </div>
                        <div className="text-[10px] text-gray-700 leading-relaxed pl-7">{headAuto}</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Attendance Section */}
          <div className="relative z-10 px-4 mb-3">
            <div className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50 rounded-lg p-2.5 border border-indigo-100">
              <h4 className="text-[9px] uppercase tracking-wide text-indigo-600 font-semibold mb-2 flex items-center gap-1.5">
                <div className="w-1 h-3 bg-indigo-600 rounded-full"></div>
                Attendance Record
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white rounded-md p-2 text-center shadow-sm border border-gray-100">
                  <div className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">Days Opened</div>
                  <div className="text-lg font-bold text-gray-800">{rep.attendance?.opened ?? '-'}</div>
                </div>
                <div className="bg-white rounded-md p-2 text-center shadow-sm border border-green-100">
                  <div className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">Days Present</div>
                  <div className="text-lg font-bold text-green-600">{rep.attendance?.present ?? '-'}</div>
                </div>
                <div className="bg-white rounded-md p-2 text-center shadow-sm border border-red-100">
                  <div className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">Days Absent</div>
                  <div className="text-lg font-bold text-red-600">{rep.attendance?.absent ?? '-'}</div>
                </div>
              </div>
              {rep.attendance && rep.attendance.opened > 0 && (
                <div className="mt-2 text-center">
                  <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-indigo-200">
                    <span className="text-[9px] text-gray-600">Attendance Rate:</span>
                    <span className="text-[10px] font-bold text-indigo-700">
                      {((rep.attendance.present / rep.attendance.opened) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Signatures & Stamp */}
          <div className="relative z-10 px-4 mb-3">
            <div className="grid grid-cols-3 gap-3 text-[10px]">
              <div className="text-center">
                <div className="h-10 flex items-end justify-center">
                  <div className="w-full h-px bg-gray-300"></div>
                </div>
                <p className="mt-1 font-semibold text-gray-700">Class Teacher</p>
                <p className="text-[8px] text-gray-500">Signature & Date</p>
              </div>
              <div className="text-center">
                <div className="h-10 flex items-end justify-center">
                  <div className="w-full h-px bg-gray-300"></div>
                </div>
                <p className="mt-1 font-semibold text-gray-700">Head Teacher</p>
                <p className="text-[8px] text-gray-500">Signature & Date</p>
              </div>
              <div className="text-center">
                <div className="h-10 flex items-end justify-center">
                  <div className="w-full h-px bg-gray-300"></div>
                </div>
                <p className="mt-1 font-semibold text-gray-700">Parent / Guardian</p>
                <p className="text-[8px] text-gray-500">Signature & Date</p>
              </div>
            </div>
            
            <div className="mt-3 flex justify-center">
              <div className="w-20 h-20 rounded-md border border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <p className="text-[8px] font-semibold text-gray-500 uppercase">School Stamp</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 border-t border-gray-200 mt-2 pt-2 px-4 pb-2">
            <p className="text-center text-[8px] text-gray-500">
              This is an official document from Michael Adjei Educational Complex • Keep this report card for your records
            </p>
          </div>

          {/* Per-student action */}
          <div className="print:hidden mt-2 flex justify-end gap-2 px-4 pb-2">
            <button className="px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors" onClick={() => setSearchParams({ studentId: rep.student.id! })}>
              Print Only This Student
            </button>
          </div>

        </div>
      ))}
    </div>
  );
}


