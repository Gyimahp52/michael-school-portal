import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
// import { sendWhatsAppText } from "@/lib/whatsapp"; // Removed WhatsApp functionality
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/CustomAuthContext";
import { TermSelector } from "@/components/shared/TermSelector";
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
  Eye,
  MessageCircle,
  Send,
  Loader2,
  Plus,
  CreditCard,
  Receipt,
} from "lucide-react";
import { formatCurrency, formatCurrencyGh } from "@/lib/utils";
import jsPDF from "jspdf";
import { FinancialReportDialog } from "@/components/dialogs/FinancialReportDialog";
import { StudentReportDialog } from "@/components/dialogs/StudentReportDialog";


export default function ReportsPage() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
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
  const [selectedTerm, setSelectedTerm] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [sendingReports, setSendingReports] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [financialReportDialogOpen, setFinancialReportDialogOpen] = useState(false);
  const [studentReportDialogOpen, setStudentReportDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [paymentDueDate, setPaymentDueDate] = useState("");
  const { toast } = useToast();

  // Print single student controls
  const [printClassId, setPrintClassId] = useState<string>("");
  const [printStudentId, setPrintStudentId] = useState<string>("");

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

  // Lazy-load a Unicode font so Ghana cedi (₵) renders correctly in PDFs
  let pdfFontLoaded = false;
  const USE_EMBEDDED_FONT = false;
  const ensureUnicodeFont = async (doc: jsPDF): Promise<string> => {
    if (!USE_EMBEDDED_FONT) {
      doc.setFont('helvetica', 'normal');
      return 'helvetica';
    }
    if (pdfFontLoaded) {
      doc.setFont('SegoeUI', 'normal');
      return 'SegoeUI';
    }
    try {
      const anyDoc: any = doc as any;
      const loadFont = async (url: string, vfsName: string, family: string): Promise<string> => {
        const res = await fetch(url);
        if (!res.ok) throw new Error('font-not-found');
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const base64 = btoa(binary);
        if (typeof anyDoc.addFileToVFS === 'function' && typeof anyDoc.addFont === 'function') {
          anyDoc.addFileToVFS(vfsName, base64);
          anyDoc.addFont(vfsName, family, 'normal');
          doc.setFont(family, 'normal');
          pdfFontLoaded = true;
          return family;
        }
        throw new Error('jsPDF-font-api-missing');
      };

      // Try Segoe UI first
      try {
        return await loadFont('/fonts/SegoeUI.ttf', 'SegoeUI.ttf', 'SegoeUI');
      } catch (_) {
        // Fallback to NotoSans if Segoe is unavailable
        return await loadFont('/fonts/NotoSans-Regular.ttf', 'NotoSans-Regular.ttf', 'NotoSans');
      }
    } catch (e) {
      // Fallback to default font if custom font fails to load
      doc.setFont('helvetica', 'normal');
      return 'helvetica';
    }
  };

  // PDF generation functions
  const generatePDF = async (data: any[], filename: string, title: string, columns: string[]) => {
    try {
      const doc = new jsPDF('landscape'); // Use landscape orientation for better fit
      const fontName = await ensureUnicodeFont(doc);
      // If default font, replace unsupported cedi symbol with 'GHS '
      if (fontName === 'helvetica') {
        data = data.map(row => {
          const copy: Record<string, any> = { ...row };
          Object.keys(copy).forEach(k => {
            if (typeof copy[k] === 'string') {
              copy[k] = (copy[k] as string).replace(/₵\s*/g, 'GHS ');
            }
          });
          return copy;
        });
      }
      
      // Header
      doc.setFontSize(18);
      doc.setFont(fontName, 'normal');
      doc.text(title, 148, 15, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont(fontName, 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 148, 22, { align: "center" });
      doc.text(`Total Records: ${data.length}`, 148, 28, { align: "center" });
      
      let yPosition = 35;
      
      // Calculate column widths based on content
      const pageWidth = 280; // Landscape page width
      const margin = 10;
      const availableWidth = pageWidth - (margin * 2);
      const colWidths = columns.map((col, index) => {
        // Calculate width based on column content
        const maxContentLength = Math.max(
          col.length,
          ...data.map(row => String(row[col] || '').length)
        );
        // Minimum width of 15, maximum of 40, scaled by content
        return Math.min(40, Math.max(15, maxContentLength * 0.8));
      });
      
      // Normalize column widths to fit page
      const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
      const scaleFactor = availableWidth / totalWidth;
      const normalizedWidths = colWidths.map(width => width * scaleFactor);
      
      // Table headers
      doc.setFontSize(9);
      let xPosition = margin;
      
      columns.forEach((column, index) => {
        // Draw header background
        doc.setFillColor(240, 240, 240);
        doc.rect(xPosition, yPosition - 5, normalizedWidths[index], 8, 'F');
        
        // Draw header text
        doc.setTextColor(0, 0, 0);
        doc.text(column, xPosition + 2, yPosition);
        xPosition += normalizedWidths[index];
      });
      
      yPosition += 10;
      
      // Table data
      doc.setFont(fontName, 'normal');
      doc.setFontSize(8);
      
      data.forEach((row, rowIndex) => {
        if (yPosition > 190) { // Check if we need a new page
          doc.addPage();
          yPosition = 20;
          
          // Redraw headers on new page
          doc.setFontSize(9);
          xPosition = margin;
          columns.forEach((column, index) => {
            doc.setFillColor(240, 240, 240);
            doc.rect(xPosition, yPosition - 5, normalizedWidths[index], 8, 'F');
            doc.setTextColor(0, 0, 0);
            doc.text(column, xPosition + 2, yPosition);
            xPosition += normalizedWidths[index];
          });
          yPosition += 10;
          doc.setFont(fontName, 'normal');
          doc.setFontSize(8);
        }
        
        // Alternate row colors
        if (rowIndex % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPosition - 4, availableWidth, 6, 'F');
        }
        
        xPosition = margin;
        columns.forEach((column, colIndex) => {
          const value = row[column] || '';
          let cellValue = String(value);
          
          // Truncate text if too long for column
          const maxChars = Math.floor(normalizedWidths[colIndex] / 1.2);
          if (cellValue.length > maxChars) {
            cellValue = cellValue.substring(0, maxChars - 3) + '...';
          }
          
          doc.setTextColor(0, 0, 0);
          doc.text(cellValue, xPosition + 2, yPosition);
          xPosition += normalizedWidths[colIndex];
        });
        yPosition += 6;
      });
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(fontName, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Page ${i} of ${pageCount} | Generated by School Management System | ${new Date().toLocaleString()}`,
          148,
          200,
          { align: "center" }
        );
      }
      
      // Save the PDF
      doc.save(`${filename}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: `${filename} has been downloaded as PDF`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  const generateEnrollmentReport = () => {
    const enrollmentData = students.map(student => ({
      'Code': student.studentCode,
      'First Name': student.firstName,
      'Last Name': student.lastName,
      'Email': student.email,
      'Phone': student.phone,
      'Class': student.className,
      'Previous Class': student.previousClass || 'N/A',
      'Academic Year': student.academicYear || 'N/A',
      'Date of Birth': student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A',
      'Status': student.status || 'Active'
    }));
    
    const columns = ['Code', 'First Name', 'Last Name', 'Email', 'Phone', 'Class', 'Previous Class', 'Academic Year', 'Date of Birth', 'Status'];
    generatePDF(enrollmentData, 'Enrollment_Report', 'Student Enrollment Report', columns);
  };

  const generateAcademicReport = () => {
    // This would need to be expanded based on your academic data structure
    const academicData = students.map(student => ({
      'Code': student.studentCode,
      'Name': `${student.firstName} ${student.lastName}`,
      'Email': student.email,
      'Phone': student.phone,
      'Class': student.className,
      'Previous Class': student.previousClass || 'N/A',
      'Academic Year': student.academicYear || 'N/A',
      'Date of Birth': student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A',
      'Status': student.status || 'Active'
      // Add more academic fields as needed
    }));
    
    const columns = ['Code', 'Name', 'Email', 'Phone', 'Class', 'Previous Class', 'Academic Year', 'Date of Birth', 'Status'];
    generatePDF(academicData, 'Academic_Report', 'Academic Performance Report', columns);
  };

  const generateFinancialReport = () => {
    const financialData = invoices.map(invoice => ({
      'Student Name': invoice.studentName,
      'Description': invoice.description,
      'Amount': formatCurrencyGh(invoice.amount),
      'Status': invoice.status,
      'Due Date': invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A',
      'Payment Date': invoice.paymentDate ? new Date(invoice.paymentDate).toLocaleDateString() : 'N/A',
      'Term': invoice.termName || 'N/A'
    }));
    
    const columns = ['Student Name', 'Description', 'Amount', 'Status', 'Due Date', 'Payment Date', 'Term'];
    generatePDF(financialData, 'Financial_Report', 'Financial Report', columns);
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

      // Generate PDF report for the class
      const classReportData = classStudents.map(student => ({
        'Code': student.studentCode,
        'Name': `${student.firstName} ${student.lastName}`,
        'Email': student.email,
        'Phone': student.phone,
        'Class': student.className,
        'Previous Class': student.previousClass || 'N/A',
        'Academic Year': student.academicYear || 'N/A',
        'Date of Birth': student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A',
        'Status': student.status || 'Active'
      }));

      const columns = ['Code', 'Name', 'Email', 'Phone', 'Class', 'Previous Class', 'Academic Year', 'Date of Birth', 'Status'];
      generatePDF(classReportData, `Class_Report_${selectedClass}`, `Class Report - ${selectedClass}`, columns);

      toast({
        title: "Report Generated Successfully",
        description: `Academic report for ${selectedClass} has been downloaded as PDF`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate class report",
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
        description: `Payment of ${formatCurrency(paymentAmountNum)} recorded for ${student.firstName} ${student.lastName}`,
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
          icon: "FileText",
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
      case "Receipt": return Receipt;
      case "CreditCard": return CreditCard;
      default: return FileText;
    }
  };

  // Use classes from DB for grade/class selection
  const availableClassNames = classes.map(c => c.className).filter(Boolean).sort();
  const classIdByName = new Map(classes.map(c => [c.className, c.id!]).filter(([_, id]) => Boolean(id)) as Array<[string, string]>);

  const handlePrintSingleStudent = () => {
    const classId = classIdByName.get(printClassId);
    if (!classId || !printStudentId) {
      toast({ title: "Missing selection", description: "Choose class and student to print.", variant: "destructive" });
      return;
    }
    navigate(`/admin/grades/print/${classId}?studentId=${encodeURIComponent(printStudentId)}`);
  };

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
                    <TermSelector
                      value={selectedTerm}
                      onChange={(termId) => setSelectedTerm(termId)}
                      label="Academic Term"
                      showAllOption={false}
                    />
                  </div>
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
                    <Label htmlFor="amount">Amount (GH₵)</Label>
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
        {/* Print single student section */}
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Print Only This Student
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Select Class</Label>
                <Select value={printClassId} onValueChange={(v) => { setPrintClassId(v); setPrintStudentId(""); }}>
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
                <Label>Select Student</Label>
                <Select value={printStudentId} onValueChange={setPrintStudentId} disabled={!printClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students
                      .filter(s => s.className === printClassId)
                      .map(s => (
                        <SelectItem key={s.id} value={s.id!}>{s.firstName} {s.lastName}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button onClick={handlePrintSingleStudent} disabled={!printClassId || !printStudentId} className="gap-2">
                  Print
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
            <Button variant="outline" className="w-full gap-2 hover:bg-primary/5" onClick={generateEnrollmentReport}>
              <FileText className="w-4 h-4" />
              Generate Enrollment Report
            </Button>
            <Button variant="outline" className="w-full mt-2 gap-2" onClick={generateEnrollmentReport}>
              <Download className="w-4 h-4" />
              Download as PDF
            </Button>
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
              <Button 
                variant="outline" 
                className="w-full gap-2 hover:bg-secondary/5" 
                onClick={() => setStudentReportDialogOpen(true)}
              >
                <FileText className="w-4 h-4" />
                Generate Student Report
              </Button>
              <Button variant="outline" className="w-full mt-2 gap-2" onClick={generateAcademicReport}>
                <Download className="w-4 h-4" />
                Download Class List PDF
              </Button>
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
            <Button variant="outline" className="w-full gap-2 hover:bg-accent/5" onClick={() => setFinancialReportDialogOpen(true)}>
              <FileText className="w-4 h-4" />
              Generate Financial Report
            </Button>
            <Button variant="outline" className="w-full mt-2 gap-2" onClick={generateFinancialReport}>
              <Download className="w-4 h-4" />
              Download as PDF
            </Button>
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

      <FinancialReportDialog open={financialReportDialogOpen} onOpenChange={setFinancialReportDialogOpen} />
      <StudentReportDialog open={studentReportDialogOpen} onOpenChange={setStudentReportDialogOpen} />
    </div>
  );
}