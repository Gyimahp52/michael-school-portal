import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/CustomAuthContext";
import { Loader2, Save, CheckCircle, AlertCircle } from "lucide-react";
import {
  Class,
  Student,
  Subject,
  Term,
  subscribeToClasses,
  subscribeToStudents,
  subscribeToSubjects,
  getCurrentTerm,
  createAssessmentRecord,
  AssessmentRecord,
} from "@/lib/database-operations";
import { filterTeacherStudents } from "@/lib/access-control";
import { TermSelector } from "@/components/shared/TermSelector";
import { calculateGradeResult, validateScore } from "@/lib/grading-utils";

interface StudentScore {
  studentId: string;
  studentName: string;
  classwork: string;
  exam: string;
  total: number;
  grade: string;
  comment: string;
}

export function BatchScoreEntry() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [classes, setClasses] = useState<Class[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedTermData, setSelectedTermData] = useState<Term | null>(null);
  const [studentScores, setStudentScores] = useState<StudentScore[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  // Load data
  useEffect(() => {
    const unsubClasses = subscribeToClasses((cls) => {
      const mine = currentUser?.id ? cls.filter(c => (c.teacherIds || []).includes(currentUser.id)) : cls;
      setClasses(mine);
      // Auto-select first class if only one
      if (mine.length === 1 && !selectedClassId) {
        setSelectedClassId(mine[0].id!);
      }
    });
    const unsubStudents = subscribeToStudents(setAllStudents);
    const unsubSubjects = subscribeToSubjects(setSubjects);

    // Set current term by default
    getCurrentTerm().then(term => {
      if (term) {
        setSelectedTerm(term.id!);
        setSelectedTermData(term);
      }
    });

    return () => {
      unsubClasses();
      unsubStudents();
      unsubSubjects();
    };
  }, [currentUser?.id]);

  // Filter students based on selected class and teacher access
  const classStudents = useMemo(() => {
    if (!selectedClassId || !currentUser?.id) return [];
    
    const classItem = classes.find(c => c.id === selectedClassId);
    if (!classItem) return [];

    // Filter students for this teacher's classes
    const filteredStudents = filterTeacherStudents(currentUser.id, allStudents, classes);
    
    // Filter by selected class
    return filteredStudents.filter(s => s.className === classItem.className);
  }, [selectedClassId, allStudents, classes, currentUser?.id]);

  // Filter subjects for selected class
  const classSubjects = useMemo(() => {
    const classItem = classes.find(c => c.id === selectedClassId);
    if (!classItem) return subjects;
    const subjectIds = classItem.subjects || [];
    if (subjectIds.length === 0) return subjects;
    return subjects.filter(s => s.id && subjectIds.includes(s.id));
  }, [classes, subjects, selectedClassId]);

  // Initialize student scores when class is selected
  useEffect(() => {
    if (classStudents.length > 0) {
      const scores: StudentScore[] = classStudents.map(student => ({
        studentId: student.id!,
        studentName: `${student.firstName} ${student.lastName}`,
        classwork: "",
        exam: "",
        total: 0,
        grade: "",
        comment: ""
      }));
      setStudentScores(scores);
    } else {
      setStudentScores([]);
    }
  }, [classStudents]);

  // Update score for a student
  const updateStudentScore = (studentId: string, field: 'classwork' | 'exam' | 'comment', value: string) => {
    setStudentScores(prev => prev.map(score => {
      if (score.studentId !== studentId) return score;

      const updated = { ...score, [field]: value };

      // Auto-calculate if both classwork and exam are provided
      if (field === 'classwork' || field === 'exam') {
        const classwork = parseFloat(field === 'classwork' ? value : score.classwork) || 0;
        const exam = parseFloat(field === 'exam' ? value : score.exam) || 0;

        // Validate scores
        const cwValidation = validateScore(classwork, 30);
        const examValidation = validateScore(exam, 70);

        if (cwValidation.valid && examValidation.valid) {
          const total = classwork + exam;
          const gradeResult = calculateGradeResult(classwork, exam);
          
          updated.total = total;
          updated.grade = gradeResult.grade;
          updated.comment = gradeResult.comment;
        }
      }

      return updated;
    }));
  };

  // Validate all scores before submission
  const validateAllScores = (): { valid: boolean; message?: string } => {
    if (!selectedClassId || !selectedSubjectId || !selectedTerm) {
      return { valid: false, message: "Please select class, subject, and term" };
    }

    const emptyScores = studentScores.filter(s => !s.classwork || !s.exam);
    if (emptyScores.length > 0) {
      return { 
        valid: false, 
        message: `${emptyScores.length} student(s) have missing scores. Please complete all entries or save as draft.` 
      };
    }

    // Check for invalid scores
    for (const score of studentScores) {
      const classwork = parseFloat(score.classwork);
      const exam = parseFloat(score.exam);
      
      const cwValidation = validateScore(classwork, 30);
      if (!cwValidation.valid) {
        return { valid: false, message: `${score.studentName}: ${cwValidation.message}` };
      }
      
      const examValidation = validateScore(exam, 70);
      if (!examValidation.valid) {
        return { valid: false, message: `${score.studentName}: ${examValidation.message}` };
      }
    }

    return { valid: true };
  };

  // Save all scores
  const handleSaveAll = async (asDraft: boolean = false) => {
    if (!currentUser?.id) {
      toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
      return;
    }

    // Only validate if not saving as draft
    if (!asDraft) {
      const validation = validateAllScores();
      if (!validation.valid) {
        toast({ title: "Validation Error", description: validation.message, variant: "destructive" });
        return;
      }
    }

    try {
      setSubmitting(true);
      setIsDraft(asDraft);

      const scoresToSave = asDraft 
        ? studentScores.filter(s => s.classwork && s.exam) // Only save completed scores in draft
        : studentScores;

      // Save each score as an assessment record
      const savePromises = scoresToSave.map(score => {
        const classwork = parseFloat(score.classwork) || 0;
        const exam = parseFloat(score.exam) || 0;

        // Create two assessment records: one for classwork, one for exam
        const classworkRecord: Omit<AssessmentRecord, 'id' | 'createdAt' | 'updatedAt'> = {
          studentId: score.studentId,
          studentName: score.studentName,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          teacherId: currentUser.id,
          assessmentType: 'assignment',
          description: 'Classwork (30%)',
          score: classwork,
          maxScore: 30,
          date: new Date().toISOString().slice(0, 10),
          termId: selectedTerm,
          termName: selectedTermData?.name,
          academicYearId: selectedTermData?.academicYearId,
          academicYearName: selectedTermData?.academicYearName,
        };

        const examRecord: Omit<AssessmentRecord, 'id' | 'createdAt' | 'updatedAt'> = {
          studentId: score.studentId,
          studentName: score.studentName,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          teacherId: currentUser.id,
          assessmentType: 'exam',
          description: `Exam (70%) - ${score.comment}`,
          score: exam,
          maxScore: 70,
          date: new Date().toISOString().slice(0, 10),
          termId: selectedTerm,
          termName: selectedTermData?.name,
          academicYearId: selectedTermData?.academicYearId,
          academicYearName: selectedTermData?.academicYearName,
        };

        return Promise.all([
          createAssessmentRecord(classworkRecord),
          createAssessmentRecord(examRecord)
        ]);
      });

      await Promise.all(savePromises);

      toast({
        title: asDraft ? "Draft Saved" : "Scores Submitted Successfully",
        description: `${scoresToSave.length} student score(s) have been ${asDraft ? 'saved as draft' : 'submitted'}.`,
      });

      // Reset form
      setStudentScores([]);
      setSelectedClassId("");
      setSelectedSubjectId("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save scores",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
      setIsDraft(false);
    }
  };

  const completedScores = studentScores.filter(s => s.classwork && s.exam).length;
  const totalScores = studentScores.length;
  const hasData = selectedClassId && selectedSubjectId && studentScores.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Batch Score Entry</span>
          {hasData && (
            <Badge variant={completedScores === totalScores ? "default" : "secondary"}>
              {completedScores} / {totalScores} completed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Academic Term</Label>
            <TermSelector
              value={selectedTerm}
              onChange={(termId, term) => {
                setSelectedTerm(termId);
                setSelectedTermData(term);
              }}
              showAllOption={false}
            />
          </div>

          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id!}>
                    {cls.className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Select 
              value={selectedSubjectId} 
              onValueChange={setSelectedSubjectId}
              disabled={!selectedClassId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {classSubjects.map(sub => (
                  <SelectItem key={sub.id} value={sub.id!}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Score Entry Table */}
        {hasData && (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead className="min-w-[200px]">Student Name</TableHead>
                    <TableHead className="w-[120px]">Classwork (30%)</TableHead>
                    <TableHead className="w-[120px]">Exam (70%)</TableHead>
                    <TableHead className="w-[100px]">Total</TableHead>
                    <TableHead className="w-[80px]">Grade</TableHead>
                    <TableHead className="min-w-[250px]">Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentScores.map((score, index) => (
                    <TableRow key={score.studentId}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{score.studentName}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0-30"
                          value={score.classwork}
                          onChange={(e) => updateStudentScore(score.studentId, 'classwork', e.target.value)}
                          className="w-full"
                          max={30}
                          min={0}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0-70"
                          value={score.exam}
                          onChange={(e) => updateStudentScore(score.studentId, 'exam', e.target.value)}
                          className="w-full"
                          max={70}
                          min={0}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={score.total >= 70 ? "default" : score.total >= 50 ? "secondary" : "destructive"}>
                          {score.total.toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            score.grade === 'A' ? "default" : 
                            score.grade === 'B' ? "secondary" : 
                            score.grade === 'F' ? "destructive" : 
                            "outline"
                          }
                        >
                          {score.grade || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          placeholder="Auto-generated comment"
                          value={score.comment}
                          onChange={(e) => updateStudentScore(score.studentId, 'comment', e.target.value)}
                          className="w-full text-sm"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {completedScores < totalScores && (
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {totalScores - completedScores} student(s) with incomplete scores
                  </span>
                )}
                {completedScores === totalScores && (
                  <span className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    All scores completed
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSaveAll(true)}
                  disabled={submitting || completedScores === 0}
                >
                  {submitting && isDraft ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleSaveAll(false)}
                  disabled={submitting || completedScores !== totalScores}
                >
                  {submitting && !isDraft ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Submit All Scores
                </Button>
              </div>
            </div>
          </>
        )}

        {!hasData && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Select a class and subject to begin entering scores</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
