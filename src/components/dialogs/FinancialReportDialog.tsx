import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import {
  subscribeToInvoices,
  subscribeToStudentBalances,
  subscribeToStudents,
  subscribeToSchoolFees,
  Invoice,
  StudentBalance,
  Student,
  SchoolFees
} from "@/lib/database-operations";
import { formatCurrency, formatCurrencyGh } from "@/lib/utils";

interface FinancialReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FinancialReportDialog({ open, onOpenChange }: FinancialReportDialogProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [studentBalances, setStudentBalances] = useState<StudentBalance[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolFees, setSchoolFees] = useState<SchoolFees[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<"summary" | "detailed" | "class-wise">("summary");
  const [reportPeriod, setReportPeriod] = useState<"current-month" | "current-term" | "current-year" | "all-time">("current-month");
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;

    const unsubscribeInvoices = subscribeToInvoices(setInvoices);
    const unsubscribeBalances = subscribeToStudentBalances(setStudentBalances);
    const unsubscribeStudents = subscribeToStudents(setStudents);
    const unsubscribeFees = subscribeToSchoolFees(setSchoolFees);

    return () => {
      unsubscribeInvoices();
      unsubscribeBalances();
      unsubscribeStudents();
      unsubscribeFees();
    };
  }, [open]);

  const filterDataByPeriod = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let filteredInvoices = invoices;

    if (reportPeriod === "current-month") {
      filteredInvoices = invoices.filter(inv => {
        const date = new Date(inv.paymentDate || inv.dueDate);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
    } else if (reportPeriod === "current-year") {
      filteredInvoices = invoices.filter(inv => {
        const date = new Date(inv.paymentDate || inv.dueDate);
        return date.getFullYear() === currentYear;
      });
    }

    return { filteredInvoices };
  };

  const generatePDF = () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const { filteredInvoices } = filterDataByPeriod();

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text("Financial Report", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 28, { align: "center" });
      doc.text(`Period: ${reportPeriod.replace('-', ' ').toUpperCase()}`, 105, 33, { align: "center" });

      let yPosition = 45;

      // Financial Summary Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Financial Summary", 14, yPosition);
      yPosition += 10;

      // Calculate metrics
      const totalRevenue = filteredInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
      const totalOutstanding = studentBalances.reduce((sum, bal) => sum + bal.balance, 0);
      const totalExpected = studentBalances.reduce((sum, bal) => sum + bal.totalFees, 0);
      const totalPaid = studentBalances.reduce((sum, bal) => sum + bal.amountPaid, 0);
      const collectionRate = totalExpected > 0 ? ((totalPaid / totalExpected) * 100).toFixed(1) : "0";

      const paidStudents = studentBalances.filter(b => b.status === 'paid').length;
      const partialStudents = studentBalances.filter(b => b.status === 'partial').length;
      const overdueStudents = studentBalances.filter(b => b.status === 'overdue').length;

      // Summary table - using simple text layout
      const summaryData = [
        ['Total Revenue Collected', formatCurrencyGh(totalRevenue)],
        ['Total Outstanding Fees', formatCurrencyGh(totalOutstanding)],
        ['Total Expected Fees', formatCurrencyGh(totalExpected)],
        ['Collection Rate', `${collectionRate}%`],
        ['Total Students', students.length.toString()],
        ['Fully Paid Students', paidStudents.toString()],
        ['Partial Payment Students', partialStudents.toString()],
        ['Overdue Students', overdueStudents.toString()],
      ];

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Metric', 14, yPosition);
      doc.text('Value', 100, yPosition);
      yPosition += 5;

      doc.setFont('helvetica', 'normal');
      summaryData.forEach(([metric, value]) => {
        doc.text(metric, 14, yPosition);
        doc.text(value, 100, yPosition);
        yPosition += 5;
      });

      yPosition += 10;

      if (reportType === "detailed" || reportType === "summary") {
        // Payment Details Section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Payment Details", 14, yPosition);
        yPosition += 10;

        const paidInvoices = filteredInvoices.filter(inv => inv.status === 'Paid');
        
        if (paidInvoices.length > 0) {
          // Payment details table - using simple text layout
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Date', 14, yPosition);
          doc.text('Student', 40, yPosition);
          doc.text('Description', 80, yPosition);
          doc.text('Amount', 140, yPosition);
          doc.text('Status', 180, yPosition);
          yPosition += 5;

          doc.setFont('helvetica', 'normal');
          paidInvoices.forEach(inv => {
            doc.text(inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString() : 'N/A', 14, yPosition);
            doc.text(inv.studentName, 40, yPosition);
            doc.text(inv.description, 80, yPosition);
            doc.text(formatCurrencyGh(inv.amount), 140, yPosition);
            doc.text(inv.status, 180, yPosition);
            yPosition += 5;
          });
          yPosition += 10;
        }
      }

      if (reportType === "class-wise") {
        // Add new page for class-wise breakdown
        doc.addPage();
        yPosition = 20;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Class-wise Fee Summary", 14, yPosition);
        yPosition += 10;

        // Group students by class
        const classSummary = new Map<string, { total: number; paid: number; outstanding: number; students: number }>();
        
        studentBalances.forEach(balance => {
          const className = balance.className || "Unassigned";
          if (!classSummary.has(className)) {
            classSummary.set(className, { total: 0, paid: 0, outstanding: 0, students: 0 });
          }
          const classData = classSummary.get(className)!;
          classData.total += balance.totalFees;
          classData.paid += balance.amountPaid;
          classData.outstanding += balance.balance;
          classData.students += 1;
        });

          const classSummaryArray = Array.from(classSummary.entries()).map(([className, data]) => [
          className,
          data.students.toString(),
            formatCurrencyGh(data.total),
            formatCurrencyGh(data.paid),
            formatCurrencyGh(data.outstanding),
          `${((data.paid / data.total) * 100).toFixed(1)}%`
        ]);

        // Class-wise breakdown table - using simple text layout
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Class', 14, yPosition);
        doc.text('Students', 40, yPosition);
        doc.text('Total Fees', 70, yPosition);
        doc.text('Amount Paid', 110, yPosition);
        doc.text('Outstanding', 150, yPosition);
        doc.text('Collection %', 190, yPosition);
        yPosition += 5;

        doc.setFont('helvetica', 'normal');
        classSummaryArray.forEach(row => {
          doc.text(row[0], 14, yPosition);
          doc.text(row[1], 40, yPosition);
          doc.text(row[2], 70, yPosition);
          doc.text(row[3], 110, yPosition);
          doc.text(row[4], 150, yPosition);
          doc.text(row[5], 190, yPosition);
          yPosition += 5;
        });
      }

      // Outstanding Fees Section
      if (reportType === "detailed") {
        doc.addPage();
        yPosition = 20;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Outstanding Fees", 14, yPosition);
        yPosition += 10;

        const outstandingBalances = studentBalances.filter(bal => bal.balance > 0);
        
        if (outstandingBalances.length > 0) {
          // Outstanding fees table - using simple text layout
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Student', 14, yPosition);
          doc.text('Class', 60, yPosition);
          doc.text('Total Fees', 90, yPosition);
          doc.text('Paid', 130, yPosition);
          doc.text('Balance', 160, yPosition);
          doc.text('Status', 200, yPosition);
          yPosition += 5;

          doc.setFont('helvetica', 'normal');
          outstandingBalances.forEach(bal => {
            doc.text(bal.studentName, 14, yPosition);
            doc.text(bal.className, 60, yPosition);
            doc.text(formatCurrencyGh(bal.totalFees), 90, yPosition);
            doc.text(formatCurrencyGh(bal.amountPaid), 130, yPosition);
            doc.text(formatCurrencyGh(bal.balance), 160, yPosition);
            doc.text(bal.status.toUpperCase(), 200, yPosition);
            yPosition += 5;
          });
        }
      }

      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Page ${i} of ${pageCount} | Generated by School Management System`,
          105,
          290,
          { align: "center" }
        );
      }

      // Save the PDF
      const fileName = `Financial_Report_${reportPeriod}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "Report Generated",
        description: `Financial report has been downloaded as ${fileName}`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate financial report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Financial Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type</Label>
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <SelectTrigger id="report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary Report</SelectItem>
                <SelectItem value="detailed">Detailed Report</SelectItem>
                <SelectItem value="class-wise">Class-wise Breakdown</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {reportType === "summary" && "Overview of key financial metrics and payment summary"}
              {reportType === "detailed" && "Comprehensive report with all transactions and outstanding fees"}
              {reportType === "class-wise" && "Fee collection breakdown by class"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-period">Report Period</Label>
            <Select value={reportPeriod} onValueChange={(value: any) => setReportPeriod(value)}>
              <SelectTrigger id="report-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Current Month</SelectItem>
                <SelectItem value="current-term">Current Term</SelectItem>
                <SelectItem value="current-year">Current Year</SelectItem>
                <SelectItem value="all-time">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={generatePDF}
              disabled={loading}
              className="flex-1 bg-gradient-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate & Download
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
