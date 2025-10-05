import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  ArrowLeft,
  Eye,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Class, Student, getAllClasses, subscribeToStudents, recordAttendance } from "@/lib/database-operations";
import { useAuth } from "@/contexts/CustomAuthContext";
import { useToast } from "@/hooks/use-toast";
import { validateTeacherClassAccess, filterTeacherStudents, getAccessDeniedMessage } from "@/lib/access-control";
import { format } from "date-fns";

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late';
}

export function TeacherClassStudentsPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [classData, setClassData] = useState<Class | null>(null);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Attendance marking state
  const [attendanceMode, setAttendanceMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Load class data and verify access
  useEffect(() => {
    const loadClassData = async () => {
      if (!classId || !currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        const classes = await getAllClasses();
        setAllClasses(classes);
        
        const foundClass = classes.find(c => c.id === classId);
        
        if (!foundClass) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        // Validate teacher access
        const teacherHasAccess = validateTeacherClassAccess(currentUser.id, foundClass);
        setHasAccess(teacherHasAccess);
        setClassData(foundClass);
        setLoading(false);
      } catch (error) {
        console.error('Error loading class:', error);
        setLoading(false);
      }
    };

    loadClassData();
  }, [classId, currentUser?.id]);

  // Load students
  useEffect(() => {
    if (!hasAccess || !classData) return;

    const unsubscribe = subscribeToStudents((studentsData) => {
      // Filter students for this specific class
      const classStudents = studentsData.filter(
        s => s.className === classData.className && s.status === 'active'
      );
      setStudents(classStudents);
      
      // Initialize attendance records
      setAttendance(classStudents.map(student => ({
        studentId: student.id!,
        status: 'present' as const
      })));
    });

    return () => unsubscribe();
  }, [hasAccess, classData]);

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) ||
           student.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           student.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => 
      prev.map(record => 
        record.studentId === studentId 
          ? { ...record, status }
          : record
      )
    );
  };

  const handleMarkAllPresent = () => {
    setAttendance(prev => 
      prev.map(record => ({ ...record, status: 'present' as const }))
    );
  };

  const handleSaveAttendance = async () => {
    if (!classData?.id || !currentUser?.id) return;

    setSavingAttendance(true);
    try {
      await recordAttendance({
        classId: classData.id,
        teacherId: currentUser.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        entries: attendance,
      });
      toast({
        title: "Success",
        description: "Attendance recorded successfully",
      });
      setAttendanceMode(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record attendance",
        variant: "destructive",
      });
    } finally {
      setSavingAttendance(false);
    }
  };

  const getAttendanceStats = () => {
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    return { present, absent, late, total: attendance.length };
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading class information...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess || !classData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {getAccessDeniedMessage('class')}
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate('/teacher')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/teacher')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{classData.className}</h1>
            <p className="text-muted-foreground">
              You are currently managing: {classData.className} {classData.section && `(${classData.section})`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!attendanceMode ? (
            <Button onClick={() => setAttendanceMode(true)}>
              <CalendarIcon className="w-4 h-4 mr-2" />
              Mark Attendance
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setAttendanceMode(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAttendance} disabled={savingAttendance}>
                Save Attendance
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Attendance Mode Header */}
      {attendanceMode && (
        <Card className="shadow-soft border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex items-center gap-4">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Attendance Marking Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Mark attendance for {format(selectedDate, "MMMM dd, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="sm" onClick={handleMarkAllPresent}>
                  Mark All Present
                </Button>
              </div>
            </div>
            
            {/* Attendance Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="flex items-center gap-2 p-2 bg-background rounded-lg">
                <CheckCircle className="w-4 h-4 text-success" />
                <div>
                  <div className="font-semibold">{stats.present}</div>
                  <div className="text-xs text-muted-foreground">Present</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background rounded-lg">
                <XCircle className="w-4 h-4 text-destructive" />
                <div>
                  <div className="font-semibold">{stats.absent}</div>
                  <div className="text-xs text-muted-foreground">Absent</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background rounded-lg">
                <Clock className="w-4 h-4 text-warning" />
                <div>
                  <div className="font-semibold">{stats.late}</div>
                  <div className="text-xs text-muted-foreground">Late</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background rounded-lg">
                <Users className="w-4 h-4 text-primary" />
                <div>
                  <div className="font-semibold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <h3 className="text-2xl font-bold">{students.length}</h3>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <h3 className="text-xl font-bold">{classData.className}</h3>
              </div>
              <Badge variant="secondary">{classData.section || 'Main'}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <h3 className="text-2xl font-bold text-success">{students.length}</h3>
              </div>
              <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-success rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      {!attendanceMode && (
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Table */}
      <Card className="shadow-soft border-border/50">
        <CardHeader>
          <CardTitle>
            {attendanceMode ? 'Mark Attendance' : 'Student List'} ({filteredStudents.length} students)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Guardian</TableHead>
                {attendanceMode ? (
                  <TableHead className="text-right">Attendance</TableHead>
                ) : (
                  <>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => {
                const studentAttendance = attendance.find(a => a.studentId === student.id);
                const age = student.dateOfBirth ? 
                  Math.floor((Date.now() - new Date(student.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 
                  0;
                
                return (
                  <TableRow key={student.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          {student.photoUrl && (
                            <AvatarImage src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {student.firstName[0]}{student.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{student.firstName} {student.lastName}</p>
                          <p className="text-sm text-muted-foreground">
                            Age {age}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{student.id || "N/A"}</TableCell>
                    <TableCell>{student.parentName}</TableCell>
                    {attendanceMode ? (
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant={studentAttendance?.status === 'present' ? "default" : "outline"}
                            onClick={() => handleAttendanceChange(student.id!, 'present')}
                          >
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={studentAttendance?.status === 'late' ? "default" : "outline"}
                            onClick={() => handleAttendanceChange(student.id!, 'late')}
                          >
                            Late
                          </Button>
                          <Button
                            size="sm"
                            variant={studentAttendance?.status === 'absent' ? "destructive" : "outline"}
                            onClick={() => handleAttendanceChange(student.id!, 'absent')}
                          >
                            Absent
                          </Button>
                        </div>
                      </TableCell>
                    ) : (
                      <>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`mailto:${student.email}`}>
                                <Mail className="w-4 h-4" />
                              </a>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`tel:${student.phone}`}>
                                <Phone className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/teacher/students/${student.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
