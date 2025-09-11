import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/CustomAuthContext";
import {
  AssessmentRecord,
  AssessmentType,
  Class,
  Student,
  Subject,
  createAssessmentRecord,
  getStudentsByClassApprox,
  subscribeToAssessments,
  subscribeToClasses,
  subscribeToStudents,
  subscribeToSubjects,
} from "@/lib/database-operations";

interface AssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssessmentDialog({ open, onOpenChange }: AssessmentDialogProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allAssessments, setAllAssessments] = useState<AssessmentRecord[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [assessmentType, setAssessmentType] = useState<AssessmentType>("exercise");
  const [description, setDescription] = useState<string>("");
  const [score, setScore] = useState<string>("");
  const [maxScore, setMaxScore] = useState<string>("100");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubClasses = subscribeToClasses((cls) => {
      const mine = currentUser?.id ? cls.filter(c => (c.teacherIds || []).includes(currentUser.id)) : cls;
      setClasses(mine);
    });
    const unsubSubjects = subscribeToSubjects(setSubjects);
    const unsubStudents = subscribeToStudents(setStudents);
    const unsubAssess = subscribeToAssessments(setAllAssessments);
    return () => { unsubClasses(); unsubSubjects(); unsubStudents(); unsubAssess(); };
  }, [currentUser?.id]);

  const classStudents = useMemo(() => {
    const classItem = classes.find(c => c.id === selectedClassId);
    if (!classItem) return [] as Student[];
    // Prefer quick local filter by grade; for accuracy we also have helper if needed
    const grade = classItem.grade;
    const list = grade ? students.filter(s => s.grade === grade && s.status === 'active') : students.filter(s => s.status === 'active');
    return list;
  }, [classes, students, selectedClassId]);

  const classSubjects = useMemo(() => {
    const classItem = classes.find(c => c.id === selectedClassId);
    if (!classItem) return subjects;
    const subjectIds = classItem.subjects || [];
    if (subjectIds.length === 0) return subjects;
    return subjects.filter(s => s.id && subjectIds.includes(s.id));
  }, [classes, subjects, selectedClassId]);

  const canSubmit = selectedClassId && selectedSubjectId && selectedStudentId && score !== "" && maxScore !== "";

  const handleSubmit = async () => {
    if (!currentUser?.id) {
      toast({ title: "Not signed in", description: "Please log in again.", variant: "destructive" });
      return;
    }
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const student = classStudents.find(s => s.id === selectedStudentId)!;
      const record: Omit<AssessmentRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        studentId: selectedStudentId,
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        teacherId: currentUser.id,
        assessmentType,
        description: description || undefined,
        score: Number(score),
        maxScore: Number(maxScore),
        date,
      };
      await createAssessmentRecord(record);
      toast({ title: "Assessment recorded", description: `${student.firstName} scored ${score}/${maxScore}` });
      // Reset some fields to speed entry of multiple scores in same class/subject
      setSelectedStudentId("");
      setScore("");
    } catch (e: any) {
      toast({ title: "Failed to save", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      // reset on close
      setSelectedClassId("");
      setSelectedSubjectId("");
      setSelectedStudentId("");
      setAssessmentType("exercise");
      setDescription("");
      setScore("");
      setMaxScore("100");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Record Assessment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id!}>
                      {cls.className || cls.name || `${cls.grade || ''} ${cls.section || ''}`.trim() || cls.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {classStudents.map(s => (
                    <SelectItem key={s.id} value={s.id!}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assessment Type</Label>
              <Select value={assessmentType} onValueChange={(v) => setAssessmentType(v as AssessmentType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exercise">Exercise</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Score</Label>
              <Input type="number" inputMode="numeric" value={score} onChange={(e) => setScore(e.target.value)} placeholder="e.g., 78" />
            </div>
            <div className="space-y-2">
              <Label>Max Score</Label>
              <Input type="number" inputMode="numeric" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} placeholder="e.g., 100" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <Card>
            <CardContent className="text-sm text-muted-foreground p-3">
              Ensure all values reflect the assessment accurately. Entries are saved in real-time database.
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
              {submitting ? "Saving..." : "Save Assessment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AssessmentDialog;
