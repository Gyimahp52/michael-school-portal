import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  FileText,
  Search,
  Plus,
  Download,
  BarChart3,
  Users,
  Calendar,
} from "lucide-react";
import { AssessmentRecord, subscribeToAssessments, subscribeToStudents, subscribeToSubjects, Student, Subject, updateAssessmentRecord, deleteAssessmentRecord, Class, subscribeToClasses } from "@/lib/database-operations";
import { useAuth } from "@/contexts/CustomAuthContext";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { GradeDialog } from '@/components/dialogs/GradeDialog';

type GradeRow = {
  id: string;
  studentName: string;
  studentId: string;
  className: string;
  subject: string;
  assessment: string;
  score: number;
  maxScore: number;
  teacherName: string;
  date: string;
};

export function GradesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser, userRole } = useAuth();

  useEffect(() => {
    setLoading(true);
    const unsubA = subscribeToAssessments(data => { setAssessments(data); });
    const unsubS = subscribeToStudents(data => { setStudents(data); });
    const unsubSub = subscribeToSubjects(data => { setSubjects(data); });
    const unsubC = subscribeToClasses(data => {
      setClasses(data);
      setLoading(false); // Assume classes is the last to load
    });

    return () => { unsubA(); unsubS(); unsubSub(); unsubC(); };
  }, []);

  const gradeRows: GradeRow[] = useMemo(() => {
    // Map assessments to table rows; restrict teacher to own assessments
    const items = assessments
      .filter(a => (userRole === 'teacher' ? a.teacherId === currentUser?.id : true))
      .map(a => ({
        id: a.id!,
        studentName: a.studentName,
        studentId: a.studentId,
        className: classes.find(c => c.id === a.classId)?.name || students.find(s => s.id === a.studentId)?.grade || "",
        subject: a.subjectId,
        assessment: a.assessmentType,
        score: a.score,
        maxScore: a.maxScore,
        teacherName: currentUser?.displayName || a.teacherId,
        date: a.date,
      }));
    return items;
  }, [assessments, students, classes, currentUser?.id, currentUser?.displayName, userRole]);

  const filteredGrades = gradeRows.filter((grade) => {
    const matchesSearch = grade.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         grade.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === "all" || classes.find(c => c.name === grade.className)?.id === selectedClass;
    const matchesSubject = selectedSubject === "all" || grade.subject === selectedSubject;
    return matchesSearch && matchesClass && matchesSubject;
  });

  const getGradeColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return "text-success";
    if (percentage >= 80) return "text-primary";
    if (percentage >= 70) return "text-warning";
    return "text-destructive";
  };

  const getPercentage = (score: number, maxScore: number) => {
    return Math.round((score / maxScore) * 100);
  };

  const averageScore = filteredGrades.length
    ? filteredGrades.reduce((sum, grade) => sum + (grade.score / grade.maxScore) * 100, 0) / filteredGrades.length
    : 0;

  const availableClasses = useMemo(() => {
    return [...classes].sort((a, b) => a.name.localeCompare(b.name));
  }, [classes]);

  const availableSubjects = useMemo(() => {
    return subjects;
  }, [subjects]);

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Grades & Records</h1>
            <p className="text-muted-foreground">Manage academic assessments and student performance</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report Cards
          </Button>
          <Button className="gap-2 bg-gradient-primary" onClick={() => setDialogOpen(true)} >
            <Plus className="w-4 h-4" />
            Add Score
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Class Average</p>
                <h3 className="text-2xl font-bold text-primary">{averageScore.toFixed(1)}%</h3>
                <p className="text-xs text-muted-foreground mt-1">Across all subjects</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Assessments</p>
                <h3 className="text-2xl font-bold">156</h3>
                <p className="text-xs text-muted-foreground mt-1">This term</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg">
                <FileText className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Students Graded</p>
                <h3 className="text-2xl font-bold text-success">1,198</h3>
                <p className="text-xs text-muted-foreground mt-1">96% completion</p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <Users className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Report Cards</p>
                <h3 className="text-2xl font-bold text-accent">45</h3>
                <p className="text-xs text-muted-foreground mt-1">Ready for review</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-soft border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {availableClasses.map(c => (
                    <SelectItem key={c.id} value={c.id!}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {availableSubjects.map(s => (
                    <SelectItem key={s.id} value={s.id!}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades Table */}
      <Card className="shadow-soft border-border/50">
        <CardHeader>
          <CardTitle>Recent Scores ({filteredGrades.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrades.map((grade) => (
                <TableRow key={grade.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium">{grade.studentName}</p>
                      <p className="text-sm text-muted-foreground">{grade.studentId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{grade.className || '-'}</Badge>
                  </TableCell>
                  <TableCell>{subjects.find(s => s.id === grade.subject)?.name || grade.subject}</TableCell>
                  <TableCell>{grade.assessment}</TableCell>
                  <TableCell className="font-mono">
                    <span className={getGradeColor(grade.score, grade.maxScore)}>
                      {grade.score}/{grade.maxScore}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getGradeColor(grade.score, grade.maxScore).replace('text-', 'bg-')}`}
                          style={{ width: `${getPercentage(grade.score, grade.maxScore)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${getGradeColor(grade.score, grade.maxScore)}`}>
                        {getPercentage(grade.score, grade.maxScore)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{grade.teacherName}</TableCell>
                  <TableCell>{grade.date}</TableCell>
                  <TableCell className="text-right">
                    {userRole === 'teacher' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={async () => {
                            const newScore = prompt('Enter new score', String(grade.score));
                            if (!newScore) return;
                            const parsed = parseInt(newScore, 10);
                            if (Number.isNaN(parsed)) return;
                            await updateAssessmentRecord(grade.id, { score: parsed });
                          }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Score
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={async () => {
                            if (!confirm('Delete this record?')) return;
                            await deleteAssessmentRecord(grade.id);
                          }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <GradeDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        students={students} 
        classes={classes} 
        subjects={subjects} 
      />
    </div>
  );
}