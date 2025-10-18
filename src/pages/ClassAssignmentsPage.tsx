import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Users, Plus, Trash2 } from "lucide-react";
import {
  Class,
  Student,
  subscribeToClasses,
  subscribeToStudents,
  updateClass,
  getAllClasses,
} from "@/lib/database-operations";
import { useAuth } from "@/contexts/HybridAuthContext";
import { getAllUsers } from "@/lib/custom-auth";

interface Teacher {
  id: string;
  name: string;
  email: string;
}

export function ClassAssignmentsPage() {
  const { toast } = useToast();
  const { currentUser, userRole } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only allow admin access
    if (userRole !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only administrators can manage class assignments",
        variant: "destructive",
      });
      return;
    }

    const unsubClasses = subscribeToClasses(setClasses);
    const unsubStudents = subscribeToStudents(setStudents);

    // Fetch real teachers from database
    const loadTeachers = async () => {
      try {
        const allUsers = await getAllUsers();
        const teacherUsers = allUsers
          .filter(user => user.role === 'teacher')
          .map(user => ({
            id: user.id,
            name: user.displayName,
            email: user.username,
          }));
        setTeachers(teacherUsers);
      } catch (error) {
        console.error('Error loading teachers:', error);
        toast({
          title: "Error",
          description: "Failed to load teachers",
          variant: "destructive",
        });
      }
    };

    loadTeachers();

    return () => {
      unsubClasses();
      unsubStudents();
    };
  }, [userRole, toast]);

  const handleAssignTeacher = async () => {
    if (!selectedClass || !selectedTeacher) {
      toast({
        title: "Incomplete Selection",
        description: "Please select both a class and a teacher",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const classItem = classes.find(c => c.id === selectedClass);
      if (!classItem) return;

      const currentTeachers = classItem.teacherIds || [];
      
      // Check if teacher already assigned
      if (currentTeachers.includes(selectedTeacher)) {
        toast({
          title: "Already Assigned",
          description: "This teacher is already assigned to this class",
          variant: "destructive",
        });
        return;
      }

      // Add teacher to class
      await updateClass(selectedClass, {
        teacherIds: [...currentTeachers, selectedTeacher],
      });

      toast({
        title: "Teacher Assigned",
        description: `Teacher successfully assigned to ${classItem.className}`,
      });

      // Reset selections
      setSelectedClass("");
      setSelectedTeacher("");
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign teacher to class",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTeacher = async (classId: string, teacherId: string) => {
    if (!confirm("Remove this teacher from the class?")) return;

    setLoading(true);
    try {
      const classItem = classes.find(c => c.id === classId);
      if (!classItem) return;

      const updatedTeachers = (classItem.teacherIds || []).filter(id => id !== teacherId);
      
      await updateClass(classId, {
        teacherIds: updatedTeachers,
      });

      toast({
        title: "Teacher Removed",
        description: "Teacher has been removed from the class",
      });
    } catch (error) {
      toast({
        title: "Removal Failed",
        description: "Failed to remove teacher from class",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.name || teacherId;
  };

  const getClassStudentCount = (className: string) => {
    return students.filter(s => s.className === className && s.status === 'active').length;
  };

  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="text-destructive mb-4">
              <Users className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              Only administrators can manage class assignments
            </p>
          </CardContent>
        </Card>
      </div>
    );
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
            <h1 className="text-3xl font-bold text-foreground">Class Assignments</h1>
            <p className="text-muted-foreground">Assign teachers to classes and manage access</p>
          </div>
        </div>
      </div>

      {/* Assignment Form */}
      <Card className="shadow-soft border-border/50">
        <CardHeader>
          <CardTitle>Assign Teacher to Class</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id!}>
                      {classItem.className} ({getClassStudentCount(classItem.className)} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAssignTeacher} 
              disabled={loading || !selectedClass || !selectedTeacher}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Assign
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card className="shadow-soft border-border/50">
        <CardHeader>
          <CardTitle>Current Class Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Assigned Teachers</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((classItem) => {
                const assignedTeachers = classItem.teacherIds || [];
                const studentCount = getClassStudentCount(classItem.className);
                
                return (
                  <TableRow key={classItem.id}>
                    <TableCell>
                      <div className="font-medium">{classItem.className}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{classItem.section || 'Main'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{studentCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {assignedTeachers.length > 0 ? (
                          assignedTeachers.map((teacherId) => (
                            <Badge key={teacherId} variant="secondary">
                              {getTeacherName(teacherId)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No teachers assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignedTeachers.length > 0 && (
                        <div className="flex gap-2">
                          {assignedTeachers.map((teacherId) => (
                            <Button
                              key={teacherId}
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveTeacher(classItem.id!, teacherId)}
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">Access Control Note</p>
              <p className="text-muted-foreground">
                Teachers can only access classes, students, and data they are assigned to. 
                When you assign a teacher to a class, they will immediately gain access to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>View and enter scores for students in that class</li>
                <li>Mark attendance for that class</li>
                <li>View reports and grades for that class</li>
                <li>Access student profiles in that class</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
