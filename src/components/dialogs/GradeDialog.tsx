import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Class, Student, Subject, createAssessmentRecord, Term, getCurrentTerm } from '@/lib/database-operations';
import { useAuth } from '@/contexts/HybridAuthContext';
import { useToast } from '@/hooks/use-toast';
import { filterTeacherClasses } from '@/lib/access-control';
import { calculateGrade } from '@/lib/grading-utils';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { TermSelector } from '@/components/shared/TermSelector';

interface GradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  classes: Class[];
  subjects: Subject[];
}

// Score grid: scores[studentId][subjectId] = score string
type ScoreGrid = Record<string, Record<string, string>>;

export function GradeDialog({ open, onOpenChange, students, classes, subjects }: GradeDialogProps) {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedTermData, setSelectedTermData] = useState<Term | null>(null);
  const [scoreGrid, setScoreGrid] = useState<ScoreGrid>({});
  const [submitting, setSubmitting] = useState(false);
  const { currentUser, userRole } = useAuth();
  const { toast } = useToast();

  // Load current term on open
  useEffect(() => {
    if (open) {
      getCurrentTerm().then(term => {
        if (term) {
          setSelectedTerm(term.id!);
          setSelectedTermData(term);
        }
      });
    }
  }, [open]);

  // Filter classes based on teacher assignment
  const availableClasses = useMemo(() => {
    if (userRole === 'teacher' && currentUser?.id) {
      return filterTeacherClasses(currentUser.id, classes);
    }
    return classes;
  }, [userRole, currentUser?.id, classes]);

  // Students in selected class
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    const targetClass = classes.find(c => c.id === selectedClass);
    if (!targetClass) return [];
    const className = targetClass.name || targetClass.className;
    if (!className) return [];
    return students
      .filter(s => s.className === className)
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
  }, [selectedClass, students, classes]);

  // Subjects for selected class
  const classSubjects = useMemo(() => {
    const classItem = classes.find(c => c.id === selectedClass);
    if (!classItem) return subjects;
    const subjectIds = classItem.subjects || [];
    if (subjectIds.length === 0) return subjects;
    return subjects.filter(s => s.id && subjectIds.includes(s.id));
  }, [classes, subjects, selectedClass]);

  // Reset grid when class changes
  useEffect(() => {
    const grid: ScoreGrid = {};
    classStudents.forEach(s => {
      grid[s.id!] = {};
      classSubjects.forEach(sub => {
        grid[s.id!][sub.id!] = '';
      });
    });
    setScoreGrid(grid);
  }, [classStudents, classSubjects]);

  const updateScore = (studentId: string, subjectId: string, value: string) => {
    // Only allow numbers 0-100
    if (value !== '' && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 100)) return;
    setScoreGrid(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectId]: value,
      }
    }));
  };

  // Count filled scores
  const { filledCount, totalCount } = useMemo(() => {
    let filled = 0;
    let total = 0;
    Object.values(scoreGrid).forEach(subjects => {
      Object.values(subjects).forEach(score => {
        total++;
        if (score !== '') filled++;
      });
    });
    return { filledCount: filled, totalCount: total };
  }, [scoreGrid]);

  const handleSubmit = async () => {
    if (!currentUser || !selectedClass || !selectedTerm) {
      toast({ title: 'Error', description: 'Please select a class and term.', variant: 'destructive' });
      return;
    }

    if (filledCount === 0) {
      toast({ title: 'Error', description: 'Please enter at least one score.', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      const promises: Promise<string>[] = [];
      const date = new Date().toISOString().split('T')[0];

      Object.entries(scoreGrid).forEach(([studentId, subjects]) => {
        const student = classStudents.find(s => s.id === studentId);
        if (!student) return;

        Object.entries(subjects).forEach(([subjectId, scoreVal]) => {
          if (scoreVal === '') return;
          const score = Number(scoreVal);
          const grade = calculateGrade(score);

          promises.push(createAssessmentRecord({
            studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            classId: selectedClass,
            subjectId,
            teacherId: currentUser.id,
            assessmentType: 'exam',
            score,
            maxScore: 100,
            date,
            termId: selectedTerm,
            termName: selectedTermData?.name,
            academicYearId: selectedTermData?.academicYearId,
            academicYearName: selectedTermData?.academicYearName,
            remarks: `Grade: ${grade}`,
          }));
        });
      });

      await Promise.all(promises);
      toast({ title: 'Success', description: `${promises.length} score(s) saved successfully.` });
      onOpenChange(false);
      setSelectedClass('');
      setScoreGrid({});
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save scores.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const hasData = classStudents.length > 0 && classSubjects.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Batch Score Entry</DialogTitle>
          <DialogDescription>Select a class to enter scores for all students across subjects.</DialogDescription>
        </DialogHeader>

        {/* Selection Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Class</label>
            <Select onValueChange={setSelectedClass} value={selectedClass}>
              <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent>
                {availableClasses.map(c => (
                  <SelectItem key={c.id} value={c.id!}>{c.name || c.className}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Term</label>
            <TermSelector
              value={selectedTerm}
              onChange={(termId, term) => {
                setSelectedTerm(termId);
                setSelectedTermData(term);
              }}
              showAllOption={false}
            />
          </div>
        </div>

        {/* Score Grid */}
        {hasData ? (
          <ScrollArea className="flex-1 border rounded-lg">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="sticky left-0 bg-muted/80 backdrop-blur-sm z-10 min-w-[180px] font-semibold">
                      #
                    </TableHead>
                    <TableHead className="sticky left-0 bg-muted/80 backdrop-blur-sm z-10 min-w-[180px] font-semibold">
                      Student Name
                    </TableHead>
                    {classSubjects.map(sub => (
                      <TableHead key={sub.id} className="text-center min-w-[100px] font-semibold">
                        {sub.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudents.map((student, idx) => (
                    <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="sticky left-0 bg-background/90 backdrop-blur-sm z-10 font-medium text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="sticky left-0 bg-background/90 backdrop-blur-sm z-10 font-medium">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      {classSubjects.map(sub => {
                        const val = scoreGrid[student.id!]?.[sub.id!] || '';
                        const numVal = Number(val);
                        const hasValue = val !== '';
                        return (
                          <TableCell key={sub.id} className="text-center p-1">
                            <div className="relative">
                              <Input
                                type="number"
                                inputMode="numeric"
                                placeholder="—"
                                value={val}
                                onChange={e => updateScore(student.id!, sub.id!, e.target.value)}
                                className={`w-20 mx-auto text-center text-sm h-9 ${
                                  hasValue
                                    ? numVal >= 80 ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20'
                                    : numVal >= 50 ? 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20'
                                    : 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
                                    : ''
                                }`}
                                min={0}
                                max={100}
                              />
                              {hasValue && (
                                <span className={`absolute -top-1 -right-1 text-[10px] font-bold rounded-full px-1 ${
                                  numVal >= 80 ? 'text-green-600 dark:text-green-400'
                                  : numVal >= 50 ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {calculateGrade(numVal)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        ) : selectedClass ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No students or subjects found for this class.</p>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Select a class to begin entering scores</p>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 pt-2">
          <div className="text-sm text-muted-foreground">
            {filledCount > 0 && (
              <Badge variant={filledCount === totalCount ? 'default' : 'secondary'}>
                {filledCount} / {totalCount} scores entered
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || filledCount === 0}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Save {filledCount} Score{filledCount !== 1 ? 's' : ''}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
