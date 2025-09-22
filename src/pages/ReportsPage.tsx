import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/CustomAuthContext";
import { 
  subscribeToReports, 
  subscribeToReportStats, 
  subscribeToStudents,
  subscribeToClasses,
  subscribeToInvoices,
  subscribeToSchoolFees,
  subscribeToStudentBalances,
  createInvoice,
  updateStudentBalance,
  createStudentBalance,
  Report, 
  ReportStats,
  Student,
  Class,
  Invoice,
  SchoolFees,
  StudentBalance
} from "@/lib/database-operations";
import {
  FileText,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Calendar,
  Eye,
  MessageCircle,
  Send,
  Loader2,
  Plus,
  CreditCard,
  Receipt,
} from "lucide-react";

export default function ReportsPage() {
  const { userRole } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [reportStats, setReportStats] = useState<ReportStats>({
    reportsGenerated: 0,
    downloads: 0,
    activeReports: 0,
    lastUpdated: new Date().toISOString()
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [schoolFees, setSchoolFees] = useState<SchoolFees[]>([]);
  const [studentBalances, setStudentBalances] = useState<StudentBalance[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [sendingReports, setSendingReports] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [paymentDueDate, setPaymentDueDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to real-time data
    const unsubscribeReports = subscribeToReports((reportsData) => {
      setReports(reportsData);
    });

    const unsubscribeStats = subscribeToReportStats((statsData) => {
      setReportStats(statsData);
    });

    const unsubscribeStudents = subscribeToStudents((studentsData) => {
      setStudents(studentsData);
    });

    const unsubscribeClasses = subscribeToClasses((classesData) => {
      setClasses(classesData);
    });

    const unsubscribeInvoices = subscribeToInvoices((invoicesData) => {
      setInvoices(invoicesData);
    });

    const unsubscribeSchoolFees = subscribeToSchoolFees((feesData) => {
      setSchoolFees(feesData);
    });

    const unsubscribeStudentBalances = subscribeToStudentBalances((balancesData) => {
      setStudentBalances(balancesData);
    });

    setLoading(false);

    // Cleanup subscriptions
    return () => {
      unsubscribeReports();
      unsubscribeStats();
      unsubscribeStudents();
      unsubscribeClasses();
      unsubscribeInvoices();
      unsubscribeSchoolFees();
      unsubscribeStudentBalances();
    };
  }, []);

  const sendViaWhatsApp = async (reportTitle: string) => {
    try {
      const input = window.prompt(
        `Enter recipient WhatsApp number (Ghana). Examples: 0241234567 or 233241234567`,
        "0"
      );
      if (!input) return;
      const message = `Report: ${reportTitle} is ready. Please check your portal or contact the school for details.`;
      await sendWhatsAppText(input, message);
      toast({ title: "Sent", description: `WhatsApp message sent to ${input}` });
    } catch (error: any) {
      toast({
        title: "Failed to send",
        description: error.message || "WhatsApp sending failed",
        variant: "destructive",
      });
    }
  };

  const sendClassReportsToParents = async () => {
    if (!selectedClass) {
      toast({
        title: "Error",
        description: "Please select a class first",
        variant: "destructive",
      });
      return;
    }

    setSendingReports(true);
    
    try {
      const classStudents = students.filter(student => student.className === selectedClass);
      
      if (classStudents.length === 0) {
        toast({
          title: "No Students Found",
          description: "No students found in the selected class",
          variant: "destructive",
        });
        return;
      }

      // Send WhatsApp messages to parents
      for (const student of classStudents) {
        if (student.parentWhatsApp) {
          try {
            const message = `Academic Report for ${student.firstName} ${student.lastName} is ready. Please check your portal or contact the school for details.`;
            await sendWhatsAppText(student.parentWhatsApp, message);
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Failed to send to ${student.parentName}:`, error);
          }
        }
      }

      toast({
        title: "Reports Sent Successfully",
        description: `Academic reports sent to ${classStudents.filter(s => s.parentWhatsApp).length} parents via WhatsApp`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reports to parents",
        variant: "destructive",
      });
    } finally {
      setSendingReports(false);
    }
  };

  const handlePaymentEntry = async () => {
    if (!selectedStudent || !paymentAmount || !paymentDescription || !paymentDueDate) {
      toast({
        title: "Error",
        description: "Please fill in all payment details",
        variant: "destructive",
      });
      return;
    }

    try {
      const student = students.find(s => s.id === selectedStudent);
      if (!student) {
        toast({
          title: "Error",
          description: "Student not found",
          variant: "destructive",
        });
        return;
      }

      const paymentAmountNum = parseFloat(paymentAmount);
      
      // Create invoice
      await createInvoice({
        studentId: selectedStudent,
        studentName: `${student.firstName} ${student.lastName}`,
        description: paymentDescription,
        amount: paymentAmountNum,
        dueDate: paymentDueDate,
        status: 'Paid', // Mark as paid since we're recording a payment
        paymentDate: new Date().toISOString()
      });

      // Get school fees for the student's class
      const classFees = schoolFees.find(f => f.className === student.className);
      const totalFees = classFees?.totalFees || 0;

      // Check if student balance exists
      const existingBalance = studentBalances.find(b => b.studentId === selectedStudent);
      
      if (existingBalance) {
        // Update existing balance
        await updateStudentBalance(selectedStudent, paymentAmountNum);
      } else {
        // Create new student balance
        await createStudentBalance({
          studentId: selectedStudent,
          studentName: `${student.firstName} ${student.lastName}`,
          className: student.className,
          totalFees: totalFees,
          amountPaid: paymentAmountNum,
          balance: totalFees - paymentAmountNum,
          lastPaymentDate: new Date().toISOString(),
          status: paymentAmountNum >= totalFees ? 'paid' : 'partial'
        });
      }

      toast({
        title: "Payment Recorded",
        description: `Payment of ₵${paymentAmountNum.toFixed(2)} recorded for ${student.firstName} ${student.lastName}`,
      });

      // Reset form
      setSelectedStudent("");
      setPaymentAmount("");
      setPaymentDescription("");
      setPaymentDueDate("");
      setPaymentDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  // Default reports based on user role
  const getDefaultReports = (): Report[] => {
    if (userRole === 'accountant') {
      return [
        {
          id: "RPT-001",
          title: "Student Enrollment Report",
          description: "Complete overview of student enrollment by grade and class",
          category: "Administrative",
          lastGenerated: "2025-01-15",
          format: "PDF, Excel",
          icon: "Users",
        },
        {
          id: "RPT-002",
          title: "Financial Summary Report",
          description: "Monthly revenue, expenses, and outstanding fees analysis",
          category: "Finance",
          lastGenerated: "2025-01-14",
          format: "PDF, Excel",
          icon: "DollarSign",
        },
        {
          id: "RPT-003",
          title: "Payment Collection Report",
          description: "Detailed analysis of fee collections and outstanding payments",
          category: "Finance",
          lastGenerated: "2025-01-13",
          format: "PDF, Excel",
          icon: "Receipt",
        },
        {
          id: "RPT-004",
          title: "Outstanding Fees Report",
          description: "Students with pending payments and overdue amounts",
          category: "Finance",
          lastGenerated: "2025-01-12",
          format: "PDF, Excel",
          icon: "CreditCard",
        },
      ];
    } else {
      return [
        {
          id: "RPT-001",
          title: "Student Enrollment Report",
          description: "Complete overview of student enrollment by grade and class",
          category: "Academic",
          lastGenerated: "2025-01-15",
          format: "PDF, Excel",
          icon: "Users",
        },
        {
          id: "RPT-002",
          title: "Financial Summary Report",
          description: "Monthly revenue, expenses, and outstanding fees analysis",
          category: "Finance",
          lastGenerated: "2025-01-14",
          format: "PDF, Excel",
          icon: "DollarSign",
        },
        {
          id: "RPT-003",
          title: "Academic Performance Report",
          description: "Grade distribution and academic performance analytics",
          category: "Academic",
          lastGenerated: "2025-01-13",
          format: "PDF",
          icon: "BarChart3",
        },
        {
          id: "RPT-004",
          title: "Attendance Summary",
          description: "Student attendance rates and trends analysis",
          category: "Academic",
          lastGenerated: "2025-01-12",
          format: "PDF, Excel",
          icon: "Calendar",
        },
      ];
    }
  };

  const defaultReports = getDefaultReports();

  // Filter reports based on user role
  const getFilteredReports = () => {
    const reportsToShow = reports.length > 0 ? reports : defaultReports;
    if (userRole === 'accountant') {
      return reportsToShow.filter(report => report.category !== 'Academic');
    }
    return reportsToShow;
  };

  const displayReports = getFilteredReports();

  const quickStats = [
    {
      title: "Reports Generated",
      value: reportStats.reportsGenerated.toString(),
      change: "This month",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Downloads",
      value: reportStats.downloads.toString(),
      change: "Total this year",
      icon: Download,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Active Reports",
      value: reportStats.activeReports.toString(),
      change: "Scheduled reports",
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "Finance":
        return <Badge className="bg-success/10 text-success border-success/20">Finance</Badge>;
      case "Academic":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Academic</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Users": return Users;
      case "DollarSign": return DollarSign;
      case "BarChart3": return BarChart3;
      case "Calendar": return Calendar;
      case "Receipt": return Receipt;
      case "CreditCard": return CreditCard;
      default: return FileText;
    }
  };

  // Use classes from DB for grade/class selection
  const availableClassNames = classes.map(c => c.className).filter(Boolean).sort();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {userRole === 'accountant' ? 'Financial Reports & Analytics' : 'Reports & Analytics'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {userRole === 'accountant' 
              ? 'Generate financial reports and manage student payments.'
              : 'Generate comprehensive reports for academic and financial analysis.'
            }
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {userRole === 'accountant' && (
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Record Payment</span>
                  <span className="sm:hidden">Record</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Record Student Payment</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="class-select">Select Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableClassNames.map(cls => (
                          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="student-select">Select Student</Label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={!selectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students
                          .filter(s => s.className === selectedClass)
                          .map(student => (
                            <SelectItem key={student.id} value={student.id!}>
                              {student.firstName} {student.lastName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (₵)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="e.g., Tuition fees, Exam fees"
                      value={paymentDescription}
                      onChange={(e) => setPaymentDescription(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="due-date">Due Date</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={paymentDueDate}
                      onChange={(e) => setPaymentDueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handlePaymentEntry}>
                    Record Payment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" className="gap-2 w-full sm:w-auto hover:bg-primary/5">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule Report</span>
            <span className="sm:hidden">Schedule</span>
          </Button>
          <Button className="gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Generate Report</span>
            <span className="sm:hidden">Generate</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="shadow-soft border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Categories */}
      <div className={`grid gap-6 ${userRole === 'accountant' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-3'}`}>
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Enrollment Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track student enrollment patterns and growth trends across academic years.
            </p>
            <Button variant="outline" className="w-full gap-2 hover:bg-primary/5">
              <FileText className="w-4 h-4" />
              Generate Enrollment Report
            </Button>
            {userRole !== 'accountant' && (
              <Button variant="outline" className="w-full mt-2" onClick={() => sendViaWhatsApp("Student Enrollment Report")}>Send via WhatsApp</Button>
            )}
          </CardContent>
        </Card>

        {userRole !== 'accountant' && (
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-secondary" />
                Academic Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Analyze student performance, grades, and attendance across all classes.
              </p>
              <Button variant="outline" className="w-full gap-2 hover:bg-secondary/5">
                <FileText className="w-4 h-4" />
                Generate Academic Report
              </Button>
              <Button variant="outline" className="w-full mt-2" onClick={() => sendViaWhatsApp("Academic Performance Report")}>Send via WhatsApp</Button>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-accent" />
              Financial Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Comprehensive financial analysis including revenue, expenses, and projections.
            </p>
            <Button variant="outline" className="w-full gap-2 hover:bg-accent/5">
              <FileText className="w-4 h-4" />
              Generate Financial Report
            </Button>
            {userRole !== 'accountant' && (
              <Button variant="outline" className="w-full mt-2" onClick={() => sendViaWhatsApp("Financial Summary Report")}>Send via WhatsApp</Button>
            )}
          </CardContent>
        </Card>

        {userRole === 'accountant' && (
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-green-600" />
                Payment Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Track and manage student payments, outstanding fees, and payment history.
              </p>
              <Button variant="outline" className="w-full gap-2 hover:bg-green-50">
                <CreditCard className="w-4 h-4" />
                View Payment Reports
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* WhatsApp Report Sending - Only for non-accountants */}
      {userRole !== 'accountant' && (
        <Card className="shadow-soft border-border/50 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <MessageCircle className="w-5 h-5" />
              Send Student Reports via WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-green-700 dark:text-green-300">
                Send academic reports directly to parents' WhatsApp numbers for an entire class with just one click.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-green-800 dark:text-green-200">
                    Select Class/Grade
                  </label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="bg-white dark:bg-background border-green-300 dark:border-green-700">
                      <SelectValue placeholder="Choose a class to send reports" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClassNames.map(cls => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={sendClassReportsToParents}
                  disabled={!selectedClass || sendingReports || loading}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2 min-w-[140px]"
                >
                  {sendingReports ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Reports
                    </>
                  )}
                </Button>
              </div>

              {selectedClass && (
                <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {students.filter(s => s.className === selectedClass).length} students found in Class {selectedClass}
                    {" - "}
                    {students.filter(s => s.className === selectedClass && s.parentWhatsApp).length} parents have WhatsApp numbers
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Reports */}
      <Card className="shadow-soft border-border/50">
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayReports.map((report) => {
              const IconComponent = getIconComponent(report.icon || "FileText");
              return (
              <Card key={report.id} className="shadow-sm border-border/30 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-foreground">{report.title}</h4>
                        {getCategoryBadge(report.category)}
                      </div>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Last generated: {report.lastGenerated || "Never"}</span>
                        <span>Format: {report.format}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                          <Eye className="w-3 h-3" />
                          Preview
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                          <Download className="w-3 h-3" />
                          Download
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs bg-primary/5">
                          <FileText className="w-3 h-3" />
                          Generate New
                        </Button>
                        {userRole !== 'accountant' && (
                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => sendViaWhatsApp(report.title)}>
                            Send via WhatsApp
                          </Button>
                        )}
                        </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}