import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { getAllClasses, getAllStudents, Class, Student, recordAttendance } from "@/lib/database-operations";
import { Calendar as CalendarIcon, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/CustomAuthContext";
import { filterTeacherClasses } from "@/lib/access-control";

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late';
}

export function AttendanceDialog({ open, onOpenChange }: AttendanceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const { toast } = useToast();
  const { currentUser, userRole } = useAuth();

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const classesData = await getAllClasses();
        // Restrict teachers to only their assigned classes if teacher role
        if (userRole === 'teacher' && currentUser?.id) {
          const teacherClasses = classesData.filter(c => (c.teacherIds || []).includes(currentUser.id));
          setClasses(teacherClasses);
        } else {
          setClasses(classesData);
        }
      } catch (error) {
        console.error('Error loading classes:', error);
      }
    };

    if (open) {
      loadClasses();
    }
  }, [open, userRole, currentUser?.id]);

  useEffect(() => {
    const loadStudents = async () => {
      if (selectedClass) {
        try {
          const studentsData = await getAllStudents();
          // In a real app, you'd filter by class/grade
          setStudents(studentsData.filter(s => s.status === 'active'));
          // Initialize attendance records
          setAttendance(studentsData
            .filter(s => s.status === 'active')
            .map(student => ({
              studentId: student.id!,
              status: 'present' as const
            }))
          );
        } catch (error) {
          console.error('Error loading students:', error);
        }
      }
    };

    loadStudents();
  }, [selectedClass]);

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => 
      prev.map(record => 
        record.studentId === studentId 
          ? { ...record, status }
          : record
      )
    );
  };

  const handleSubmit = async () => {
    if (!selectedClass) {
      toast({
        title: "Error",
        description: "Please select a class",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const teacherId = currentUser?.id || 'unknown';
      await recordAttendance({
        classId: selectedClass,
        teacherId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        entries: attendance,
      });
      toast({
        title: "Success",
        description: "Attendance recorded successfully",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record attendance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-success/10 text-success border-success/20">Present</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'late':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Late</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getAttendanceStats = () => {
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    return { present, absent, late, total: attendance.length };
  };

  const stats = getAttendanceStats();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Attendance</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Class and Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Class *</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id!}>
                      {classItem.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
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
            </div>
          </div>

          {/* Attendance Stats */}
          {students.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <div>
                      <div className="font-semibold">{stats.present}</div>
                      <div className="text-sm text-muted-foreground">Present</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-destructive" />
                    <div>
                      <div className="font-semibold">{stats.absent}</div>
                      <div className="text-sm text-muted-foreground">Absent</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <div>
                      <div className="font-semibold">{stats.late}</div>
                      <div className="text-sm text-muted-foreground">Late</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div>
                    <div className="font-semibold">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Students List */}
          {students.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Student Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {students.map((student) => {
                    const studentAttendance = attendance.find(a => a.studentId === student.id);
                    return (
                      <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          {student.photoUrl && (
                            <img 
                              src={student.photoUrl} 
                              alt={`${student.firstName} ${student.lastName}`}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Class {student.className} • {student.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
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
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !selectedClass || students.length === 0}
            >
              Record Attendance
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}