import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Student, 
  Class, 
  Term,
  AssessmentRecord,
  AttendanceRecordDoc,
  subscribeToAssessments,
  subscribeToAttendance,
  subscribeToStudents,
  subscribeToClasses,
  subscribeToTerms,
  subscribeToSubjects,
  Subject
} from "@/lib/database-operations";
import { Download, FileText, TrendingUp, Calendar, Award, Users } from "lucide-react";
import jsPDF from "jspdf";
import { format } from "date-fns";

interface StudentReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SubjectAnalysis {
  subjectId: string;
  subjectName: string;
  assessments: AssessmentRecord[];
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  averageScore: number;
  assessmentCount: number;
  grade?: string;
}

export function StudentReportDialog({ open, onOpenChange }: StudentReportDialogProps) {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecordDoc[]>([]);

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState<{
    student: Student;
    term: Term;
    subjectAnalyses: SubjectAnalysis[];
    attendanceSummary: {
      totalDays: number;
      present: number;
      absent: number;
      late: number;
      percentage: number;
    };
    overallAverage: number;
    classRank?: number;
    totalStudents?: number;
  } | null>(null);

  useEffect(() => {
    const unsubStudents = subscribeToStudents(setStudents);
    const unsubClasses = subscribeToClasses(setClasses);
    const unsubTerms = subscribeToTerms(setTerms);
    const unsubSubjects = subscribeToSubjects(setSubjects);
    const unsubAssessments = subscribeToAssessments(setAssessments);
    const unsubAttendance = subscribeToAttendance(setAttendance);

    return () => {
      unsubStudents();
      unsubClasses();
      unsubTerms();
      unsubSubjects();
      unsubAssessments();
      unsubAttendance();
    };
  }, []);

  // Real-time filtered students based on selected class
  const selectedClassName = classes.find(c => c.id === selectedClass)?.name;
  const filteredStudents = selectedClass && selectedClassName
    ? students.filter(s => s.className === selectedClassName && s.status === 'active')
    : [];

  const generateReport = async () => {
    if (!selectedClass || !selectedStudent || !selectedTerm) {
      toast({
        title: "Missing Information",
        description: "Please select a class, student, and term",
        variant: "destructive",
      });
      return;
    }

    const student = students.find(s => s.id === selectedStudent);
    const term = terms.find(t => t.id === selectedTerm);
    const selectedClassName = classes.find(c => c.id === selectedClass)?.name;

    if (!student || !term) {
      toast({
        title: "Error",
        description: "Student or term not found",
        variant: "destructive",
      });
      return;
    }

    // Filter assessments for this student and term
    const studentAssessments = assessments.filter(
      a => a.studentId === selectedStudent && (!a.termId || a.termId === selectedTerm)
    );

    // Group assessments by subject
    const subjectMap = new Map<string, AssessmentRecord[]>();
    studentAssessments.forEach(assessment => {
      if (!subjectMap.has(assessment.subjectId)) {
        subjectMap.set(assessment.subjectId, []);
      }
      subjectMap.get(assessment.subjectId)!.push(assessment);
    });

    // Calculate subject analyses
    const subjectAnalyses: SubjectAnalysis[] = Array.from(subjectMap.entries()).map(([subjectId, subjectAssessments]) => {
      const subject = subjects.find(s => s.id === subjectId);
      const totalScore = subjectAssessments.reduce((sum, a) => sum + a.score, 0);
      const maxPossibleScore = subjectAssessments.reduce((sum, a) => sum + a.maxScore, 0);
      const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
      const averageScore = subjectAssessments.length > 0 ? totalScore / subjectAssessments.length : 0;

      return {
        subjectId,
        subjectName: subject?.name || 'Unknown Subject',
        assessments: subjectAssessments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        totalScore,
        maxPossibleScore,
        percentage,
        averageScore,
        assessmentCount: subjectAssessments.length,
      };
    });

    // Calculate attendance summary
    const studentAttendance = attendance.filter(
      a => a.classId === selectedClass && 
      a.entries.some(e => e.studentId === selectedStudent)
    );

    let present = 0, absent = 0, late = 0;
    studentAttendance.forEach(record => {
      const entry = record.entries.find(e => e.studentId === selectedStudent);
      if (entry) {
        if (entry.status === 'present') present++;
        else if (entry.status === 'absent') absent++;
        else if (entry.status === 'late') late++;
      }
    });

    const totalDays = present + absent + late;
    const attendancePercentage = totalDays > 0 ? (present / totalDays) * 100 : 0;

    // Calculate overall average
    const overallAverage = subjectAnalyses.length > 0
      ? subjectAnalyses.reduce((sum, s) => sum + s.percentage, 0) / subjectAnalyses.length
      : 0;

    // Calculate class rank (simple implementation based on overall average)
    const classStudents = students.filter(s => s.className === selectedClassName);
    const studentAverages = classStudents.map(s => {
      const studentAsses = assessments.filter(a => a.studentId === s.id && (!a.termId || a.termId === selectedTerm));
      const subjectGroups = new Map<string, AssessmentRecord[]>();
      studentAsses.forEach(a => {
        if (!subjectGroups.has(a.subjectId)) subjectGroups.set(a.subjectId, []);
        subjectGroups.get(a.subjectId)!.push(a);
      });
      
      const subjectPercentages = Array.from(subjectGroups.values()).map(group => {
        const total = group.reduce((sum, a) => sum + a.score, 0);
        const max = group.reduce((sum, a) => sum + a.maxScore, 0);
        return max > 0 ? (total / max) * 100 : 0;
      });

      const avg = subjectPercentages.length > 0 
        ? subjectPercentages.reduce((sum, p) => sum + p, 0) / subjectPercentages.length 
        : 0;

      return { studentId: s.id, average: avg };
    }).sort((a, b) => b.average - a.average);

    const rank = studentAverages.findIndex(s => s.studentId === selectedStudent) + 1;

    setReportData({
      student,
      term,
      subjectAnalyses,
      attendanceSummary: {
        totalDays,
        present,
        absent,
        late,
        percentage: attendancePercentage,
      },
      overallAverage,
      classRank: rank > 0 ? rank : undefined,
      totalStudents: classStudents.length,
    });

    setReportGenerated(true);
  };

  const getGradeFromPercentage = (percentage: number): string => {
    if (percentage >= 80) return 'A (Excellent)';
    if (percentage >= 70) return 'B (Very Good)';
    if (percentage >= 60) return 'C (Good)';
    if (percentage >= 50) return 'D (Pass)';
    return 'F (Fail)';
  };

  const exportToPDF = async () => {
    if (!reportData) return;

    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Student Academic Report', 105, yPosition, { align: 'center' });
      yPosition += 10;

      // Student Info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Student: ${reportData.student.firstName} ${reportData.student.lastName}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Student Code: ${reportData.student.studentCode || 'N/A'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Class: ${reportData.student.className}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Term: ${reportData.term.name} (${reportData.term.academicYearName})`, 20, yPosition);
      yPosition += 7;
      doc.text(`Report Date: ${format(new Date(), 'PPP')}`, 20, yPosition);
      yPosition += 10;

      // Overall Performance
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Overall Performance', 20, yPosition);
      yPosition += 7;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Average: ${reportData.overallAverage.toFixed(1)}%`, 20, yPosition);
      yPosition += 6;
      doc.text(`Grade: ${getGradeFromPercentage(reportData.overallAverage)}`, 20, yPosition);
      yPosition += 6;
      if (reportData.classRank && reportData.totalStudents) {
        doc.text(`Class Rank: ${reportData.classRank} of ${reportData.totalStudents}`, 20, yPosition);
        yPosition += 6;
      }
      yPosition += 5;

      // Attendance
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Attendance Summary', 20, yPosition);
      yPosition += 7;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Present: ${reportData.attendanceSummary.present} days`, 20, yPosition);
      yPosition += 6;
      doc.text(`Absent: ${reportData.attendanceSummary.absent} days`, 20, yPosition);
      yPosition += 6;
      doc.text(`Late: ${reportData.attendanceSummary.late} days`, 20, yPosition);
      yPosition += 6;
      doc.text(`Attendance Rate: ${reportData.attendanceSummary.percentage.toFixed(1)}%`, 20, yPosition);
      yPosition += 10;

      // Subject Performance
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Subject Performance', 20, yPosition);
      yPosition += 7;

      reportData.subjectAnalyses.forEach((subject, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${subject.subjectName}`, 20, yPosition);
        yPosition += 6;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Score: ${subject.totalScore}/${subject.maxPossibleScore}`, 25, yPosition);
        yPosition += 5;
        doc.text(`Percentage: ${subject.percentage.toFixed(1)}%`, 25, yPosition);
        yPosition += 5;
        doc.text(`Grade: ${getGradeFromPercentage(subject.percentage)}`, 25, yPosition);
        yPosition += 5;
        doc.text(`Assessments: ${subject.assessmentCount}`, 25, yPosition);
        yPosition += 8;
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Page ${i} of ${pageCount} | Generated: ${format(new Date(), 'PPpp')}`,
          105,
          285,
          { align: 'center' }
        );
      }

      doc.save(`${reportData.student.lastName}_${reportData.student.firstName}_Report.pdf`);

      toast({
        title: "PDF Exported",
        description: "Student report has been downloaded successfully",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  const resetDialog = () => {
    setSelectedClass("");
    setSelectedStudent("");
    setSelectedTerm("");
    setReportGenerated(false);
    setReportData(null);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetDialog();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Student Report
          </DialogTitle>
        </DialogHeader>

        {!reportGenerated ? (
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="class">Select Class *</Label>
                <Select value={selectedClass} onValueChange={(value) => {
                  setSelectedClass(value);
                  setSelectedStudent(""); // Reset student selection when class changes
                }}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {classes.length > 0 ? (
                      classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id!}>
                          {cls.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">No classes available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="student">
                  Select Student * 
                  {selectedClass && filteredStudents.length > 0 && (
                    <span className="text-muted-foreground font-normal ml-2">
                      ({filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </Label>
                <Select 
                  value={selectedStudent} 
                  onValueChange={setSelectedStudent}
                  disabled={!selectedClass}
                >
                  <SelectTrigger id="student">
                    <SelectValue placeholder={
                      !selectedClass 
                        ? "Select a class first" 
                        : filteredStudents.length === 0
                        ? "No students in this class"
                        : "Choose a student"
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {filteredStudents.length > 0 ? (
                      filteredStudents
                        .sort((a, b) => a.firstName.localeCompare(b.firstName))
                        .map(student => (
                          <SelectItem key={student.id} value={student.id!}>
                            {student.firstName} {student.lastName}
                            {student.studentCode && (
                              <span className="text-muted-foreground ml-2">({student.studentCode})</span>
                            )}
                          </SelectItem>
                        ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        {!selectedClass ? 'Select a class first' : 'No students found in this class'}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="term">Select Term *</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger id="term">
                    <SelectValue placeholder="Choose a term" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {terms.length > 0 ? (
                      terms
                        .sort((a, b) => {
                          // Sort by academic year and term status
                          if (a.isCurrentTerm && !b.isCurrentTerm) return -1;
                          if (!a.isCurrentTerm && b.isCurrentTerm) return 1;
                          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
                        })
                        .map(term => (
                          <SelectItem key={term.id} value={term.id!}>
                            {term.name} - {term.academicYearName}
                            {term.isCurrentTerm && (
                              <span className="ml-2 text-xs text-primary">(Current)</span>
                            )}
                          </SelectItem>
                        ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">No terms available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={generateReport} 
              className="w-full"
              disabled={!selectedClass || !selectedStudent || !selectedTerm}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        ) : reportData ? (
          <div className="space-y-6 py-4">
            {/* Student Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Student Information
                  </div>
                  <Button onClick={exportToPDF} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{reportData.student.firstName} {reportData.student.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Student Code</p>
                    <p className="font-medium">{reportData.student.studentCode || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-medium">{reportData.student.className}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Term</p>
                    <p className="font-medium">{reportData.term.name} ({reportData.term.academicYearName})</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overall Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Overall Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Average Score</p>
                    <p className="text-3xl font-bold">{reportData.overallAverage.toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Grade</p>
                    <Badge variant="outline" className="text-lg py-2 px-4">
                      {getGradeFromPercentage(reportData.overallAverage)}
                    </Badge>
                  </div>
                  {reportData.classRank && reportData.totalStudents && (
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Class Position</p>
                      <p className="text-3xl font-bold">{reportData.classRank}/{reportData.totalStudents}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Attendance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Attendance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Present</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {reportData.attendanceSummary.present}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Absent</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {reportData.attendanceSummary.absent}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Late</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {reportData.attendanceSummary.late}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Rate</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {reportData.attendanceSummary.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Subject Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {reportData.subjectAnalyses.map((subject, index) => (
                    <div key={subject.subjectId}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg">{subject.subjectName}</h4>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">
                              {subject.percentage.toFixed(1)}%
                            </Badge>
                            <Badge>
                              {getGradeFromPercentage(subject.percentage)}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid gap-2 md:grid-cols-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Score:</span>{' '}
                            <span className="font-medium">{subject.totalScore}/{subject.maxPossibleScore}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Assessments:</span>{' '}
                            <span className="font-medium">{subject.assessmentCount}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Average:</span>{' '}
                            <span className="font-medium">{subject.averageScore.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Assessment Details Table */}
                        <div className="mt-3">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Remarks</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {subject.assessments.map((assessment) => (
                                <TableRow key={assessment.id}>
                                  <TableCell className="font-medium">
                                    {format(new Date(assessment.date), 'MMM dd, yyyy')}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className="capitalize">
                                      {assessment.assessmentType}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{assessment.description || '-'}</TableCell>
                                  <TableCell className="font-medium">
                                    {assessment.score}/{assessment.maxScore}
                                    <span className="text-muted-foreground ml-2">
                                      ({((assessment.score / assessment.maxScore) * 100).toFixed(0)}%)
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {assessment.remarks || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  ))}

                  {reportData.subjectAnalyses.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No assessment records found for this term
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetDialog}>
                Generate Another Report
              </Button>
              <Button onClick={exportToPDF}>
                <Download className="mr-2 h-4 w-4" />
                Export to PDF
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
