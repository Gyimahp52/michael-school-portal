import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Edit,
  Eye,
  Mail,
  Phone,
  Trash2,
} from "lucide-react";
import { Student, deleteStudent, type Class, type StudentBalance, subscribeToClasses, subscribeToStudents, subscribeToStudentBalances } from "@/lib/database-operations";
import { StudentDialog } from "@/components/dialogs/StudentDialog";
import { filterTeacherClasses, filterTeacherStudents } from "@/lib/access-control";

import { useAuth } from "@/contexts/HybridAuthContext";
import { useToast } from "@/hooks/use-toast";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { formatCurrency } from "@/lib/utils";

export function StudentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [studentBalances, setStudentBalances] = useState<StudentBalance[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const { toast } = useToast();
  const { userRole, currentUser } = useAuth();

useEffect(() => {
  const unsubStudents = subscribeToStudents(setStudents);
  const unsubClasses = subscribeToClasses(setClasses);
  const unsubBalances = subscribeToStudentBalances(setStudentBalances);
  return () => {
    unsubStudents();
    unsubClasses();
    unsubBalances();
  };
}, []);

  // Sync initial and subsequent URL changes (?q=) into local search state
  useEffect(() => {
    const q = searchParams.get('q') || "";
    setSearchQuery(q);
  }, [searchParams]);

  // Filter students based on user role - teachers only see their assigned students
  const accessibleStudents = userRole === 'teacher' && currentUser?.id
    ? filterTeacherStudents(currentUser.id, students, classes)
    : students;

  // Filter classes for dropdown - teachers only see their assigned classes
  const accessibleClasses = userRole === 'teacher' && currentUser?.id
    ? filterTeacherClasses(currentUser.id, classes)
    : classes;

  const filteredStudents = accessibleStudents.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                         student.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.studentCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === "All" || student.className === selectedClass;
    return matchesSearch && matchesClass;
  });

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleViewProfile = (student: Student) => {
    const basePath = userRole === 'admin' ? '/admin' : userRole === 'teacher' ? '/teacher' : '';
    navigate(`${basePath}/students/${student.id}`);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        await deleteStudent(studentId);
        toast({
          title: "Success",
          description: "Student deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete student",
          variant: "destructive",
        });
      }
    }
  };

  const handleSendWhatsApp = async (student: Student) => {
    try {
      if (!student.parentWhatsApp) {
        toast({
          title: "Missing WhatsApp",
          description: "No parent WhatsApp number saved for this student.",
          variant: "destructive",
        });
        return;
      }
      const message = `Hello ${student.parentName}, your child's latest report is ready. Student: ${student.firstName} ${student.lastName} (Class ${student.className}).`;
      await sendWhatsAppText(student.parentWhatsApp, message);
      toast({
        title: "Sent",
        description: `Report message sent to WhatsApp ${student.parentWhatsApp}`,
      });
    } catch (error: any) {
      toast({
        title: "WhatsApp send failed",
        description: error.message || 'Unable to send message',
        variant: "destructive",
      });
    }
  };

  const getStats = () => {
    const total = accessibleStudents.length;
    const active = accessibleStudents.filter(s => s.status === "active").length;
    const thisMonth = accessibleStudents.filter(s => {
      const enrollmentDate = new Date(s.enrollmentDate);
      const now = new Date();
      return enrollmentDate.getMonth() === now.getMonth() && 
             enrollmentDate.getFullYear() === now.getFullYear();
    }).length;
    
    return { total, active, thisMonth };
  };

  const stats = getStats();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "graduated":
        return <Badge className="bg-secondary text-secondary-foreground">Graduated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Students</h1>
            <p className="text-sm text-muted-foreground">Manage student information and records</p>
          </div>
        </div>
        {userRole !== 'teacher' && (
<Button className="gap-2 bg-gradient-primary w-full sm:w-auto" onClick={handleAddStudent} aria-label="Add Student">
            <Plus className="w-4 h-4" />
            Add Student
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <h3 className="text-2xl font-bold text-success">{stats.active}</h3>
              </div>
              <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-success rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New This Month</p>
                <h3 className="text-2xl font-bold text-secondary">{stats.thisMonth}</h3>
              </div>
              <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                <Plus className="w-4 h-4 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Fees</p>
                <h3 className="text-2xl font-bold text-warning">-</h3>
              </div>
              <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-warning rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-soft border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students by name, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Classes</SelectItem>
                  {accessibleClasses.map(cls => (
                    <SelectItem key={cls.id} value={cls.className}>
                      {cls.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="shadow-soft border-border/50">
        <CardHeader>
          <CardTitle>Student List ({filteredStudents.length} students)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fees</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {filteredStudents.map((student) => {
              const age = student.dateOfBirth ? 
                Math.floor((Date.now() - new Date(student.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 
                0;
              const initials = `${(student.firstName || '').trim().charAt(0)}${(student.lastName || '').trim().charAt(0)}` || 'S';
              
              return (
                <TableRow key={student.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        {student.photoUrl && (
                          <AvatarImage src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {initials || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{student.firstName} {student.lastName}</p>
                        <p className="text-sm text-muted-foreground">Age {age}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.studentCode ? (
                      <Badge variant="outline" className="font-mono">
                        {student.studentCode}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Class {student.className}</Badge>
                  </TableCell>
                  <TableCell>{student.parentName}</TableCell>
                  <TableCell>{getStatusBadge(student.status)}</TableCell>
                  <TableCell>
                    {(() => {
                      const bal = studentBalances.find(b => b.studentId === student.id);
                      if (!bal) return <Badge variant="outline">-</Badge>;
                      const amount = bal.balance || 0;
                      const isPaid = (bal.status === 'paid') || amount <= 0;
                      return (
                        <Badge variant={isPaid ? "secondary" : "outline"} className={isPaid ? "" : "border-warning text-warning"}>
                          {isPaid ? "Paid" : formatCurrency(amount)}
                        </Badge>
                      );
                    })()}
                  </TableCell>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2" onClick={() => handleViewProfile(student)}>
                          <Eye className="w-4 h-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => handleSendWhatsApp(student)}>
                          <Mail className="w-4 h-4" />
                          Send Report via WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        {userRole !== 'teacher' && (
                          <DropdownMenuItem onClick={() => handleDeleteStudent(student.id!)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <StudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        student={selectedStudent}
        mode={dialogMode}
      />
    </div>
  );
}