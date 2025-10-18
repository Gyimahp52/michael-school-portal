import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  subscribeToClasses, 
  subscribeToStudents, 
  Class, 
  Student, 
  recordAttendance 
} from "@/lib/database-operations";
import { useAuth } from "@/contexts/HybridAuthContext";
import { UserCheck, Users, CheckCircle2, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AttendanceRecord {
  studentId: string;
  present: boolean;
  absent: boolean;
  notes: string;
}

export function BatchAttendance() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate] = useState<Date>(new Date());

  // Subscribe to classes and students
  useEffect(() => {
    const unsubClasses = subscribeToClasses((cls) => {
      const teacherClasses = currentUser?.id 
        ? cls.filter(c => (c.teacherIds || []).includes(currentUser.id))
        : cls;
      setClasses(teacherClasses);
      
      // Auto-select first class if available
      if (teacherClasses.length > 0 && !selectedClass) {
        setSelectedClass(teacherClasses[0].id || "");
      }
    });

    const unsubStudents = subscribeToStudents(setStudents);

    return () => {
      unsubClasses();
      unsubStudents();
    };
  }, [currentUser?.id]);

  // Load students for selected class
  useEffect(() => {
    if (selectedClass) {
      const selectedClassObj = classes.find(c => c.id === selectedClass);
      if (selectedClassObj) {
        const classStudents = students.filter(
          s => s.status === 'active' && s.className === selectedClassObj.className
        );
        
        // Initialize attendance records with all students marked present by default
        setAttendanceRecords(
          classStudents.map(student => ({
            studentId: student.id!,
            present: true,
            absent: false,
            notes: ""
          }))
        );
      }
    }
  }, [selectedClass, classes, students]);

  const filteredStudents = students.filter(s => {
    const selectedClassObj = classes.find(c => c.id === selectedClass);
    return s.status === 'active' && s.className === selectedClassObj?.className;
  });

  const handlePresentChange = (studentId: string, checked: boolean) => {
    setAttendanceRecords(prev =>
      prev.map(record =>
        record.studentId === studentId
          ? { ...record, present: checked, absent: !checked }
          : record
      )
    );
  };

  const handleAbsentChange = (studentId: string, checked: boolean) => {
    setAttendanceRecords(prev =>
      prev.map(record =>
        record.studentId === studentId
          ? { ...record, absent: checked, present: !checked }
          : record
      )
    );
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceRecords(prev =>
      prev.map(record =>
        record.studentId === studentId
          ? { ...record, notes }
          : record
      )
    );
  };

  const handleMarkAllPresent = () => {
    setAttendanceRecords(prev =>
      prev.map(record => ({
        ...record,
        present: true,
        absent: false
      }))
    );
    toast({
      title: "All marked present",
      description: "All students have been marked as present"
    });
  };

  const handleClearAll = () => {
    setAttendanceRecords(prev =>
      prev.map(record => ({
        ...record,
        present: false,
        absent: false,
        notes: ""
      }))
    );
    toast({
      title: "Cleared",
      description: "All attendance marks have been cleared"
    });
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass) {
      toast({
        title: "Error",
        description: "Please select a class",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const selectedClassObj = classes.find(c => c.id === selectedClass);
      if (!selectedClassObj) throw new Error("Class not found");

      // Prepare attendance entries
      const entries = attendanceRecords
        .filter(record => record.present || record.absent) // Only include marked students
        .map(record => ({
          studentId: record.studentId,
          status: record.present ? 'present' as const : 'absent' as const
        }));

      // Record attendance for the class
      await recordAttendance({
        classId: selectedClass,
        teacherId: currentUser?.id || '',
        date: selectedDate.toISOString().split('T')[0],
        entries
      });

      const presentCount = attendanceRecords.filter(r => r.present).length;
      const absentCount = attendanceRecords.filter(r => r.absent).length;

      toast({
        title: "Attendance Saved",
        description: `Recorded: ${presentCount} present, ${absentCount} absent`
      });

    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: "Error",
        description: "Failed to save attendance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const presentCount = attendanceRecords.filter(r => r.present).length;
  const absentCount = attendanceRecords.filter(r => r.absent).length;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Mark Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Class Selection */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id || ""}>
                      {classItem.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input 
                type="text" 
                value={selectedDate.toLocaleDateString()} 
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Total Students</label>
              <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{filteredStudents.length}</span>
              </div>
            </div>
          </div>

          {/* Statistics */}
          {filteredStudents.length > 0 && (
            <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Present: {presentCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium">Absent: {absentCount}</span>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleMarkAllPresent}
              disabled={!selectedClass || filteredStudents.length === 0}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark All Present
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClearAll}
              disabled={!selectedClass || filteredStudents.length === 0}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      {filteredStudents.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Student Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Student Name</TableHead>
                    <TableHead className="w-[150px]">Admission No.</TableHead>
                    <TableHead className="w-[100px] text-center">Present</TableHead>
                    <TableHead className="w-[100px] text-center">Absent</TableHead>
                    <TableHead>Notes (Optional)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const record = attendanceRecords.find(r => r.studentId === student.id);
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {student.id}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={record?.present || false}
                              onCheckedChange={(checked) =>
                                handlePresentChange(student.id!, checked as boolean)
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={record?.absent || false}
                              onCheckedChange={(checked) =>
                                handleAbsentChange(student.id!, checked as boolean)
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Add notes..."
                            value={record?.notes || ""}
                            onChange={(e) =>
                              handleNotesChange(student.id!, e.target.value)
                            }
                            className="max-w-md"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Save Button */}
            <div className="flex justify-end mt-4">
              <Button 
                onClick={handleSaveAttendance} 
                disabled={loading || filteredStudents.length === 0}
                size="lg"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No students found</p>
              <p className="text-sm mt-1">
                {selectedClass 
                  ? "This class has no active students" 
                  : "Please select a class to view students"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
