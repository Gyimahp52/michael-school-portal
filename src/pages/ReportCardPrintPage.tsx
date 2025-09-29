import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AssessmentRecord, AttendanceRecordDoc, Student, Subject, Class, subscribeToAssessments, subscribeToStudents, subscribeToSubjects, subscribeToClasses, subscribeToAttendance, Teacher, subscribeToTeachers } from '@/lib/database-operations';
import { getSchoolSettings, SchoolSettings } from '@/lib/school-settings';
import { useSearchParams } from 'react-router-dom';

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

      // Attendance approx (if available by class and date)
      const classAttendance = attendance.filter(r => r.classId === (targetClass?.id || ''));
      const attForStudent = classAttendance.flatMap(r => r.entries.filter(e => e.studentId === student.id));
      const opened = classAttendance.length;
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
  }, [assessments, classStudents, subjectById, attendance, targetClass?.id]);

  const classAverage = useMemo(() => {
    if (!reports.length) return 0;
    const averages = reports.map(r => r.averageMarks || 0);
    return averages.reduce((a, b) => a + b, 0) / averages.length;
  }, [reports]);

  // Determine positions by total marks
  const positions = useMemo(() => {
    const sorted = [...reports].sort((a, b) => b.totalMarks - a.totalMarks);
    const map = new Map<string, number>();
    sorted.forEach((r, idx) => map.set(r.student.id!, idx + 1));
    return map;
  }, [reports]);

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
          <p className="text-sm text-muted-foreground">Michael Agyei School</p>
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
        <div key={rep.student.id} className={`card bg-white border rounded-xl shadow-sm mb-10 relative overflow-hidden`}> 
          <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600" />
          {/* Watermark */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center">
            <div className="text-[9rem] font-extrabold tracking-widest text-blue-700">MACL</div>
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-start justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-gray-200">
                {settings?.logoUrl ? (
                  <img src={settings.logoUrl} alt="School Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-600" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-extrabold leading-tight">Michael Agyei School</h2>
                <p className="text-[13px] text-muted-foreground">Academic Report Card</p>
                <div className="text-[12px] text-muted-foreground flex flex-wrap gap-2">
                 {/* <span>Term & Year: __________</span> 
                  <span className="hidden sm:inline">•</span>*/}
                  {/* <span>Class Teacher: {classTeacherName}</span> */}
                </div>
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="relative z-10 grid grid-cols-2 gap-4 text-sm mb-4 px-6">
            <div>
              <p><span className="font-semibold">Student Name:</span> {rep.student.firstName} {rep.student.lastName}</p>
              <p><span className="font-semibold">Admission No.:</span> {rep.student.id}</p>
              <p><span className="font-semibold">Class & Year:</span> {classLabel} • {settings?.academicYear || '__________'}</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 border">
                {rep.student.photoUrl ? (
                  <img src={rep.student.photoUrl} alt="Student" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div>
             {/* <p><span className="font-semibold">Teacher:</span> {classTeacherName}</p> 
              <p><span className="font-semibold">Term Dates:</span> {termStart} — {termEnd}</p>
              */}
              </div>
            </div>
          </div>

          {/* Scores Table */}
          <div className="relative z-10 px-6">
            <table className="w-full text-sm border border-gray-200 rounded-md overflow-hidden">
              <thead className="bg-gradient-to-r from-blue-50 to-emerald-50">
                <tr>
                  <th className="border border-gray-200 px-3 py-2 text-left">Subject</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">Classwork</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">Exam</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">Total</th>
                  <th className="border border-gray-200 px-3 py-2 text-center">Grade</th>
                  <th className="border border-gray-200 px-3 py-2 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody className="[&_tr:nth-child(even)]:bg-gray-50/60">
                {rep.subjects.map(row => (
                  <tr key={row.subjectId}>
                    <td className="border border-gray-200 px-3 py-2">{row.subjectName}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{row.classwork}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{row.exam}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{row.total}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center"><span className={`inline-block px-2 py-[2px] text-xs rounded-full border ${getGradeBadgeClass(row.grade)}`}>{row.grade}</span></td>
                    <td className="border border-gray-200 px-3 py-2">{row.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="relative z-10 grid grid-cols-2 gap-6 mt-5 text-sm px-6">
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-gray-200 p-3 bg-white/70"><div className="text-[11px] text-muted-foreground">Total Marks</div><div className="text-lg font-semibold">{rep.totalMarks}</div></div>
                <div className="rounded-md border border-gray-200 p-3 bg-white/70"><div className="text-[11px] text-muted-foreground">Average Marks</div><div className="text-lg font-semibold">{rep.averageMarks.toFixed(1)}</div></div>
                <div className="rounded-md border border-gray-200 p-3 bg-white/70"><div className="text-[11px] text-muted-foreground">Position in Class</div><div className="text-lg font-semibold">{positions.get(rep.student.id!) || '-'} / {reports.length}</div></div>
                <div className="rounded-md border border-gray-200 p-3 bg-white/70"><div className="text-[11px] text-muted-foreground">Class Average</div><div className="text-lg font-semibold">{classAverage.toFixed(1)}</div></div>
              </div>
              <p className="mt-2"><span className="font-semibold">Class Teacher:</span> {classTeacherName}</p>
            </div>
            <div className="space-y-1">
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
                    <div className="rounded-md border border-gray-200 p-3 bg-white/70"><div className="text-[11px] text-muted-foreground mb-1">Teacher's Comment</div><div>{teacherAuto}</div></div>
                    <div className="rounded-md border border-gray-200 p-3 bg-white/70 mt-2"><div className="text-[11px] text-muted-foreground mb-1">Head Teacher's Comment</div><div>{headAuto}</div></div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Attendance */}
          <div className="relative z-10 grid grid-cols-3 gap-4 mt-5 text-sm px-6">
            <div className="rounded-md border border-gray-200 p-3 bg-white/70"><span className="font-semibold">Days Opened:</span> {rep.attendance?.opened ?? '-'}</div>
            <div className="rounded-md border border-gray-200 p-3 bg-white/70"><span className="font-semibold">Days Present:</span> {rep.attendance?.present ?? '-'}</div>
            <div className="rounded-md border border-gray-200 p-3 bg-white/70"><span className="font-semibold">Days Absent:</span> {rep.attendance?.absent ?? '-'}</div>
          </div>

          {/* Signatures */}
          <div className="relative z-10 grid grid-cols-3 gap-6 mt-10 text-sm px-6">
            <div className="pt-6"><div className="h-10" /><div className="border-t pt-2 text-center">Class Teacher</div></div>
            <div className="pt-6"><div className="h-10" /><div className="border-t pt-2 text-center">Head Teacher</div></div>
            <div className="pt-6"><div className="h-10" /><div className="border-t pt-2 text-center">Parent / Guardian</div></div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-6 mt-4 text-sm px-6">
            <div className="border pt-6 text-center">School Stamp</div>
          </div>

          <div className="page-break" />
          {/* Per-student action */}
          <div className="print:hidden mt-4 flex justify-end px-6">
            <button className="px-3 py-1 rounded border text-sm" onClick={() => setSearchParams({ studentId: rep.student.id! })}>Print Only This Student</button>
          </div>

        </div>
      ))}
    </div>
  );
}


