import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  User,
  BookOpen,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  Download,
  Phone,
  Mail,
  MapPin,
  CreditCard,
} from "lucide-react";
import {
  Student,
  subscribeToStudents,
  subscribeToAssessments,
  subscribeToAttendance,
  subscribeToStudentBalances,
  AssessmentRecord,
  AttendanceRecordDoc,
  StudentBalance,
  subscribeToPromotionRequests,
  PromotionRequest,
  subscribeToSubjects,
  Subject,
} from "@/lib/database-operations";
import { format } from "date-fns";

interface PaymentRecord {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  receiptNumber: string;
  paymentMethod: string;
  description: string;
}

interface StudentHistoryRecord {
  academicYear: string;
  className: string;
  averageScore: number;
  rank?: number;
  attendancePercent: number;
  status: 'promoted' | 'repeated' | 'current';
}

export function StudentProfilePage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecordDoc[]>([]);
  const [balance, setBalance] = useState<StudentBalance | null>(null);
  const [promotionHistory, setPromotionHistory] = useState<PromotionRequest[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [academicHistory, setAcademicHistory] = useState<StudentHistoryRecord[]>([]);

  useEffect(() => {
    if (!studentId) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to student data
    const unsubStudent = subscribeToStudents((students) => {
      const foundStudent = students.find(s => s.id === studentId);
      setStudent(foundStudent || null);
    });
    unsubscribers.push(unsubStudent);

    // Subscribe to assessments
    const unsubAssessments = subscribeToAssessments((allAssessments) => {
      const studentAssessments = allAssessments.filter(a => a.studentId === studentId);
      setAssessments(studentAssessments);
    });
    unsubscribers.push(unsubAssessments);

    // Subscribe to subjects
    const unsubSubjects = subscribeToSubjects((allSubjects) => {
      setSubjects(allSubjects);
    });
    unsubscribers.push(unsubSubjects);

    // Subscribe to attendance
    const unsubAttendance = subscribeToAttendance((records) => {
      const studentAttendance = records.filter(record =>
        record.entries.some(entry => entry.studentId === studentId)
      );
      setAttendance(studentAttendance);
    });
    unsubscribers.push(unsubAttendance);

    // Subscribe to balance
    const unsubBalance = subscribeToStudentBalances((balances) => {
      const studentBalance = balances.find(b => b.studentId === studentId);
      setBalance(studentBalance || null);
    });
    unsubscribers.push(unsubBalance);

    // Subscribe to promotion history
    const unsubPromotions = subscribeToPromotionRequests((requests) => {
      const studentPromotions = requests.filter(req =>
        req.decisions.some(d => d.studentId === studentId) && req.status === 'approved'
      );
      setPromotionHistory(studentPromotions);
    });
    unsubscribers.push(unsubPromotions);

    return () => unsubscribers.forEach(unsub => unsub());
  }, [studentId]);

  useEffect(() => {
    if (!student || promotionHistory.length === 0) return;

    // Build academic history from promotion records
    const history: StudentHistoryRecord[] = [];
    const sortedPromotions = [...promotionHistory].sort(
      (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );

    sortedPromotions.forEach((promo) => {
      const decision = promo.decisions.find(d => d.studentId === studentId);
      if (decision) {
        const studentAssessmentsForYear = assessments.filter(a => 
          a.studentId === studentId && a.classId === decision.currentClass
        );
        const avgScore = studentAssessmentsForYear.length > 0
          ? studentAssessmentsForYear.reduce((sum, a) => sum + ((a.score / a.maxScore) * 100), 0) / studentAssessmentsForYear.length
          : 0;

        history.push({
          academicYear: promo.academicYear,
          className: decision.currentClass,
          averageScore: avgScore,
          attendancePercent: 0,
          status: decision.decision === 'promote' ? 'promoted' : 'repeated',
        });
      }
    });

    // Add current class
    if (student.className) {
      const currentAssessments = assessments.filter(a => 
        a.studentId === studentId && a.classId === student.className
      );
      const avgScore = currentAssessments.length > 0
        ? currentAssessments.reduce((sum, a) => sum + ((a.score / a.maxScore) * 100), 0) / currentAssessments.length
        : 0;

      history.push({
        academicYear: new Date().getFullYear().toString(),
        className: student.className,
        averageScore: avgScore,
        attendancePercent: calculateAttendancePercent(),
        status: 'current',
      });
    }

    setAcademicHistory(history);
  }, [student, promotionHistory, assessments, attendance]);

  const calculateAttendancePercent = () => {
    if (!studentId || attendance.length === 0) return 0;
    
    let totalDays = 0;
    let presentDays = 0;

    attendance.forEach(record => {
      const entry = record.entries.find(e => e.studentId === studentId);
      if (entry) {
        totalDays++;
        if (entry.status === 'present' || entry.status === 'late') {
          presentDays++;
        }
      }
    });

    return totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  };

  const getAttendanceSummary = () => {
    let present = 0;
    let absent = 0;
    let late = 0;

    attendance.forEach(record => {
      const entry = record.entries.find(e => e.studentId === studentId);
      if (entry) {
        if (entry.status === 'present') present++;
        else if (entry.status === 'absent') absent++;
        else if (entry.status === 'late') late++;
      }
    });

    return { present, absent, late, total: present + absent + late };
  };

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

  const getBalanceStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-success text-success-foreground">Fully Paid</Badge>;
      case "partial":
        return <Badge className="bg-warning text-warning-foreground">Partial Payment</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!student) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading student profile...</p>
      </div>
    );
  }

  const age = student.dateOfBirth
    ? Math.floor((Date.now() - new Date(student.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;
  const attendanceSummary = getAttendanceSummary();
  const attendancePercent = calculateAttendancePercent();

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Student Profile</h1>
            <p className="text-muted-foreground">Complete student information and records</p>
          </div>
        </div>
        <Button className="gap-2" variant="outline">
          <Download className="w-4 h-4" />
          Export Profile (PDF)
        </Button>
      </div>

      {/* Profile Highlights Card */}
      <Card className="shadow-soft border-border/50 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Photo & Basic Info */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <Avatar className="w-32 h-32 ring-4 ring-background shadow-lg">
                {student.photoUrl && (
                  <AvatarImage src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                  {student.firstName[0]}{student.lastName[0]}
                </AvatarFallback>
              </Avatar>
              {getStatusBadge(student.status)}
            </div>

            {/* Student Details */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {student.firstName} {student.lastName}
                </h2>
                <p className="text-muted-foreground">Student ID: {student.id || "N/A"}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Class</p>
                  <p className="font-semibold text-foreground">Class {student.className}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-semibold text-foreground">{age} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendance</p>
                  <p className="font-semibold text-foreground">{attendancePercent}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fee Status</p>
                  {balance ? getBalanceStatusBadge(balance.status) : <Badge variant="outline">No Data</Badge>}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Sections */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="academics" className="gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Academics</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="ledger" className="gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Ledger</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Information Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-foreground font-medium">{student.firstName} {student.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                  <p className="text-foreground font-medium">
                    {student.dateOfBirth ? format(new Date(student.dateOfBirth), "PPP") : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p className="text-foreground">{student.email || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p className="text-foreground">{student.phone || "N/A"}</p>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <p className="text-foreground">{student.address || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Enrollment Date</label>
                  <p className="text-foreground font-medium">
                    {student.enrollmentDate ? format(new Date(student.enrollmentDate), "PPP") : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                  <div>{getStatusBadge(student.status)}</div>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="text-lg font-semibold mb-4">Parent/Guardian Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Guardian Name</label>
                    <p className="text-foreground font-medium">{student.parentName || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Guardian Phone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <p className="text-foreground">{student.parentPhone || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Guardian WhatsApp</label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <p className="text-foreground">{student.parentWhatsApp || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Guardian Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <p className="text-foreground">{student.parentEmail || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic History Tab */}
        <TabsContent value="academics" className="space-y-4">
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>Academic History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Average Score</TableHead>
                    <TableHead>Attendance %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {academicHistory.length > 0 ? (
                    academicHistory.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{record.academicYear}</TableCell>
                        <TableCell>Class {record.className}</TableCell>
                        <TableCell>{record.averageScore.toFixed(1)}%</TableCell>
                        <TableCell>{record.attendancePercent}%</TableCell>
                        <TableCell>
                          {record.status === 'promoted' && <Badge className="bg-success text-success-foreground">Promoted</Badge>}
                          {record.status === 'repeated' && <Badge variant="secondary">Repeated</Badge>}
                          {record.status === 'current' && <Badge className="bg-primary text-primary-foreground">Current</Badge>}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No academic history available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>Current Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Assessment Type</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.filter(a => a.classId === student.className).length > 0 ? (
                    assessments
                      .filter(a => a.classId === student.className)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((assessment) => {
                        const percentage = (assessment.score / assessment.maxScore) * 100;
                        const subject = subjects.find(s => s.id === assessment.subjectId);
                        return (
                          <TableRow key={assessment.id}>
                            <TableCell className="font-medium">{subject?.name || 'Unknown Subject'}</TableCell>
                            <TableCell className="capitalize">{assessment.assessmentType}</TableCell>
                            <TableCell>{assessment.score}/{assessment.maxScore}</TableCell>
                            <TableCell>
                              <Badge variant={percentage >= 70 ? "default" : percentage >= 50 ? "secondary" : "destructive"}>
                                {percentage.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>{format(new Date(assessment.date), "PP")}</TableCell>
                          </TableRow>
                        );
                      })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No assessments recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>Student Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">Student ID Card</p>
                      <p className="text-sm text-muted-foreground">Official identification document</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-secondary" />
                    <div>
                      <p className="font-medium">Latest Report Card</p>
                      <p className="text-sm text-muted-foreground">Academic performance report</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>

                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>More documents will appear here as they are uploaded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-soft border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Days</p>
                    <h3 className="text-2xl font-bold">{attendanceSummary.total}</h3>
                  </div>
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Present</p>
                    <h3 className="text-2xl font-bold text-success">{attendanceSummary.present}</h3>
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
                    <p className="text-sm text-muted-foreground">Absent</p>
                    <h3 className="text-2xl font-bold text-destructive">{attendanceSummary.absent}</h3>
                  </div>
                  <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-destructive rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Late</p>
                    <h3 className="text-2xl font-bold text-warning">{attendanceSummary.late}</h3>
                  </div>
                  <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center">
                    <Clock className="w-3 h-3 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.length > 0 ? (
                    attendance
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 20)
                      .map((record) => {
                        const entry = record.entries.find(e => e.studentId === studentId);
                        if (!entry) return null;
                        return (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{format(new Date(record.date), "PPP")}</TableCell>
                            <TableCell>Class {student.className}</TableCell>
                            <TableCell>
                              {entry.status === 'present' && <Badge className="bg-success text-success-foreground">Present</Badge>}
                              {entry.status === 'absent' && <Badge variant="destructive">Absent</Badge>}
                              {entry.status === 'late' && <Badge className="bg-warning text-warning-foreground">Late</Badge>}
                            </TableCell>
                          </TableRow>
                        );
                      })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Ledger Tab */}
        <TabsContent value="ledger" className="space-y-4">
          {balance && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-soft border-border/50 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Fees</p>
                      <h3 className="text-2xl font-bold text-foreground">₦{balance.totalFees.toLocaleString()}</h3>
                    </div>
                    <CreditCard className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-soft border-border/50 bg-gradient-to-br from-success/5 to-success/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount Paid</p>
                      <h3 className="text-2xl font-bold text-success">₦{balance.amountPaid.toLocaleString()}</h3>
                    </div>
                    <DollarSign className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-soft border-border/50 bg-gradient-to-br from-warning/5 to-warning/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                      <h3 className="text-2xl font-bold text-warning">₦{balance.balance.toLocaleString()}</h3>
                    </div>
                    <div className="w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length > 0 ? (
                    payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{format(new Date(payment.date), "PP")}</TableCell>
                        <TableCell className="font-mono text-sm">{payment.receiptNumber}</TableCell>
                        <TableCell>{payment.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-success">
                          ₦{payment.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No payment records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>Student Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Enrollment */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="w-0.5 h-full bg-border"></div>
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="font-semibold text-foreground">Student Enrolled</p>
                    <p className="text-sm text-muted-foreground">
                      {student.enrollmentDate ? format(new Date(student.enrollmentDate), "PPP") : "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enrolled in Class {student.className}
                    </p>
                  </div>
                </div>

                {/* Promotions */}
                {promotionHistory.map((promo, index) => {
                  const decision = promo.decisions.find(d => d.studentId === studentId);
                  if (!decision) return null;
                  return (
                    <div key={promo.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-secondary" />
                        </div>
                        {index < promotionHistory.length - 1 && <div className="w-0.5 h-full bg-border"></div>}
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="font-semibold text-foreground">
                          {decision.decision === 'promote' ? 'Promoted' : 'Repeated Class'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(promo.submittedAt), "PPP")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {decision.decision === 'promote'
                            ? `Promoted from Class ${decision.currentClass}`
                            : `Repeated Class ${decision.currentClass}`}
                        </p>
                        {decision.comment && (
                          <p className="text-sm italic mt-2 text-muted-foreground">"{decision.comment}"</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {promotionHistory.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No timeline events recorded yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
