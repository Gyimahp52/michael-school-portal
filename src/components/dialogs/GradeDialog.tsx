import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Class, Student, Subject, AssessmentRecord, createAssessmentRecord } from '@/lib/database-operations';
import { useAuth } from '@/contexts/CustomAuthContext';
import { useToast } from '@/hooks/use-toast';

interface GradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  classes: Class[];
  subjects: Subject[];
}

export function GradeDialog({ open, onOpenChange, students, classes, subjects }: GradeDialogProps) {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assessmentType, setAssessmentType] = useState<'assignment' | 'exercise' | 'exam'>('exam');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
      if (selectedClass) {
        const targetClass = classes.find(c => c.id === selectedClass);
        if (targetClass) {
          const className = targetClass.name || targetClass.className;
          if (className) {
            setFilteredStudents(students.filter(s => s.className === className));
          } else {
            setFilteredStudents([]);
          }
        } else {
          setFilteredStudents([]);
        }
      } else {
        setFilteredStudents([]);
      }
      setSelectedStudent('');
  }, [selectedClass, students, classes]);

  const handleSubmit = async () => {
    if (!currentUser || !selectedClass || !selectedStudent || !selectedSubject || !score || !maxScore) {
      toast({ title: 'Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    const student = students.find(s => s.id === selectedStudent);
    if (!student) return;

    const record: Omit<AssessmentRecord, 'id' | 'createdAt' | 'updatedAt'> = {
      studentId: selectedStudent,
      studentName: `${student.firstName} ${student.lastName}`,
      classId: selectedClass,
      subjectId: selectedSubject,
      teacherId: currentUser.id,
      assessmentType,
      score: parseInt(score, 10),
      maxScore: parseInt(maxScore, 10),
      date,
    };

    try {
      await createAssessmentRecord(record);
      toast({ title: 'Success', description: 'Grade added successfully.' });
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add grade.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Grade</DialogTitle>
          <DialogDescription>Enter the details for the new assessment record.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select onValueChange={setSelectedClass} value={selectedClass}>
            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
            <SelectContent>
              {classes.map(c => <SelectItem key={c.id} value={c.id!}>{c.name || c.className}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={setSelectedStudent} value={selectedStudent} disabled={!selectedClass}>
            <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
            <SelectContent>
              {filteredStudents.map(s => <SelectItem key={s.id} value={s.id!}>{s.firstName} {s.lastName}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={setSelectedSubject} value={selectedSubject}>
            <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
            <SelectContent>
              {subjects.map(s => <SelectItem key={s.id} value={s.id!}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => setAssessmentType(value as any)} value={assessmentType}>
            <SelectTrigger><SelectValue placeholder="Assessment Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="assignment">Assignment</SelectItem>
              <SelectItem value="exercise">Exercise</SelectItem>
              <SelectItem value="exam">Exam</SelectItem>
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Score" type="number" value={score} onChange={e => setScore(e.target.value)} />
            <Input placeholder="Max Score" type="number" value={maxScore} onChange={e => setMaxScore(e.target.value)} />
          </div>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Grade</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
