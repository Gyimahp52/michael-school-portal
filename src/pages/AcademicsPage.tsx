import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Users,
  GraduationCap,
  Clock,
  Search,
  Plus,
  Eye,
  Edit,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  subscribeToClasses, 
  subscribeToSubjects, 
  subscribeToTeachers, 
  subscribeToStudents,
  Class, 
  Subject, 
  Teacher, 
  Student 
} from "@/lib/database-operations";
import { ClassDialog } from "@/components/dialogs/ClassDialog";
import { SubjectDialog } from "@/components/dialogs/SubjectDialog";
import { AttendanceDialog } from "@/components/dialogs/AttendanceDialog";

export default function AcademicsPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  const { toast } = useToast();

  useEffect(() => {
    const unsubscribes = [
      subscribeToClasses(setClasses),
      subscribeToSubjects(setSubjects),
      subscribeToTeachers(setTeachers),
      subscribeToStudents(setStudents)
    ];

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const handleCreateClass = () => {
    setSelectedClass(null);
    setDialogMode("create");
    setClassDialogOpen(true);
  };

  const handleEditClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setDialogMode("edit");
    setClassDialogOpen(true);
  };

  const handleCreateSubject = () => {
    setSelectedSubject(null);
    setDialogMode("create");
    setSubjectDialogOpen(true);
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unassigned';
  };

  const getSubjectStats = () => {
    return subjects.map(subject => {
      const subjectClasses = classes.filter(c => c.subjectId === subject.id);
      const subjectTeachers = [...new Set(subjectClasses.map(c => c.teacherId).filter(Boolean))];
      const subjectStudents = students.filter(s => s.status === 'active').length; // Simplified for demo
      
      return {
        ...subject,
        classCount: subjectClasses.length,
        teacherCount: subjectTeachers.length,
        studentCount: Math.floor(subjectStudents / subjects.length) // Simplified distribution
      };
    });
  };

  const filteredClasses = classes.filter(classItem =>
    classItem.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSubjectName(classItem.subjectId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getTeacherName(classItem.teacherId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Academic Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage classes, subjects, and teacher assignments.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            className="gap-2 w-full sm:w-auto hover:bg-primary/5"
            onClick={() => setAttendanceDialogOpen(true)}
          >
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">View Attendance</span>
            <span className="sm:hidden">Attendance</span>
          </Button>
          <Button 
            className="gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto"
            onClick={handleCreateClass}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Class</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
                <h3 className="text-2xl font-bold mt-1">{classes.length}</h3>
                <p className="text-xs text-muted-foreground mt-1">Across all grades</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Subjects</p>
                <h3 className="text-2xl font-bold mt-1">{subjects.filter(s => s.status === 'active').length}</h3>
                <p className="text-xs text-muted-foreground mt-1">Core & electives</p>
              </div>
              <div className="bg-secondary/10 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teaching Staff</p>
                <h3 className="text-2xl font-bold mt-1">{teachers.filter(t => t.status === 'active').length}</h3>
                <p className="text-xs text-muted-foreground mt-1">Full & part-time</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-lg">
                <GraduationCap className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Enrolled Students</p>
                <h3 className="text-2xl font-bold mt-1">{students.filter(s => s.status === 'active').length}</h3>
                <p className="text-xs text-muted-foreground mt-1">All classes</p>
              </div>
              <div className="bg-success/10 p-3 rounded-lg">
                <Users className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Subjects Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getSubjectStats().map((subject) => (
                <div key={subject.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <h4 className="font-medium">{subject.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {subject.classCount} classes • {subject.teacherCount} teachers
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{subject.studentCount}</div>
                    <div className="text-xs text-muted-foreground">students</div>
                  </div>
                </div>
              ))}
              {subjects.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No subjects found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 hover:bg-primary/5"
              onClick={handleCreateClass}
            >
              <BookOpen className="w-4 h-4" />
              Create New Class
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 hover:bg-secondary/5"
              onClick={handleCreateSubject}
            >
              <GraduationCap className="w-4 h-4" />
              Add Subject
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 hover:bg-accent/5"
              onClick={() => setAttendanceDialogOpen(true)}
            >
              <Users className="w-4 h-4" />
              View Attendance
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 hover:bg-muted/50">
              <Clock className="w-4 h-4" />
              Schedule Management
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Classes Table */}
      <Card className="shadow-soft border-border/50">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle>Class Management</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-80 pl-10 bg-muted/50 border-border"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class ID</TableHead>
                <TableHead>Class Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.map((classItem) => (
                <TableRow key={classItem.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{classItem.id}</TableCell>
                  <TableCell>{classItem.className}</TableCell>
                  <TableCell>{getSubjectName(classItem.subjectId)}</TableCell>
                  <TableCell>{getTeacherName(classItem.teacherId || '')}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{classItem.capacity || 30}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {classItem.schedule ? 
                      Object.entries(classItem.schedule)
                        .filter(([_, time]) => time)
                        .map(([day, time]) => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${time}`)
                        .join(', ') || 'Not scheduled'
                      : 'Not scheduled'
                    }
                  </TableCell>
                  <TableCell>{classItem.room || 'Not assigned'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditClass(classItem)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClasses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No classes found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ClassDialog
        open={classDialogOpen}
        onOpenChange={setClassDialogOpen}
        classItem={selectedClass}
        mode={dialogMode}
      />
      
      <SubjectDialog
        open={subjectDialogOpen}
        onOpenChange={setSubjectDialogOpen}
        subject={selectedSubject}
        mode={dialogMode}
      />
      
      <AttendanceDialog
        open={attendanceDialogOpen}
        onOpenChange={setAttendanceDialogOpen}
      />
    </div>
  );
}