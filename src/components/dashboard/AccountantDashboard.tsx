import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  AlertTriangle,
  FileText,
  Plus,
  Download,
  Loader2
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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
import { PaymentDialog } from "@/components/dialogs/PaymentDialog";
import { StudentBalancesByClass } from "./StudentBalancesByClass";
import { CanteenFeeManagement } from "./CanteenFeeManagement";
import { formatCurrency } from "@/lib/utils";
import { FeesCollectedDialog } from "@/components/dialogs/FeesCollectedDialog";
import { OutstandingFeesDialog } from "@/components/dialogs/OutstandingFeesDialog";
import { TotalStudentsDialog } from "@/components/dialogs/TotalStudentsDialog";
import { PaymentStatusDialog } from "@/components/dialogs/PaymentStatusDialog";
import { FinancialReportDialog } from "@/components/dialogs/FinancialReportDialog";

export function AccountantDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [studentBalances, setStudentBalances] = useState<StudentBalance[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolFees, setSchoolFees] = useState<SchoolFees[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [feesCollectedDialogOpen, setFeesCollectedDialogOpen] = useState(false);
  const [outstandingFeesDialogOpen, setOutstandingFeesDialogOpen] = useState(false);
  const [totalStudentsDialogOpen, setTotalStudentsDialogOpen] = useState(false);
  const [paymentStatusDialogOpen, setPaymentStatusDialogOpen] = useState(false);
  const [financialReportDialogOpen, setFinancialReportDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribeInvoices = subscribeToInvoices((invoicesData) => {
      setInvoices(invoicesData);
    });

    const unsubscribeBalances = subscribeToStudentBalances((balancesData) => {
      setStudentBalances(balancesData);
    });

    const unsubscribeStudents = subscribeToStudents((studentsData) => {
      setStudents(studentsData);
    });

    const unsubscribeFees = subscribeToSchoolFees((feesData) => {
      setSchoolFees(feesData);
    });

    setLoading(false);

    return () => {
      unsubscribeInvoices();
      unsubscribeBalances();
      unsubscribeStudents();
      unsubscribeFees();
    };
  }, []);

  // Calculate real-time financial data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyInvoices = invoices.filter(invoice => {
    if (!invoice.paymentDate) return false;
    const paymentDate = new Date(invoice.paymentDate);
    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
  });

  const feesCollected = monthlyInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const outstandingFees = studentBalances.reduce((sum, balance) => sum + balance.balance, 0);
  const totalStudents = students.length;
  const paidStudents = studentBalances.filter(b => b.status === 'paid').length;
  const partialStudents = studentBalances.filter(b => b.status === 'partial').length;
  const overdueStudents = studentBalances.filter(b => b.status === 'overdue').length;

  const financialStats = [
    { 
      title: "Fees Collected (This Month)", 
      value: formatCurrency(feesCollected), 
      icon: DollarSign, 
      color: "text-green-600", 
      trend: "+12.5%" 
    },
    { 
      title: "Outstanding Fees", 
      value: formatCurrency(outstandingFees), 
      icon: AlertTriangle, 
      color: "text-red-600", 
      trend: `${overdueStudents} overdue` 
    },
    { 
      title: "Total Students", 
      value: totalStudents.toString(), 
      icon: TrendingUp, 
      color: "text-blue-600", 
      trend: `${paidStudents} paid` 
    },
    { 
      title: "Payment Status", 
      value: `${partialStudents} partial`, 
      icon: Receipt, 
      color: "text-orange-600", 
      trend: `${overdueStudents} overdue` 
    },
  ];

  // Generate chart data from real invoices
  const monthlyRevenue = [
    { name: 'Jan', fees: 0, expenses: 0 },
    { name: 'Feb', fees: 0, expenses: 0 },
    { name: 'Mar', fees: feesCollected, expenses: 0 },
  ];

  // Calculate fee breakdown from student balances
  const totalTuition = studentBalances.reduce((sum, balance) => sum + balance.totalFees, 0);
  const totalPaid = studentBalances.reduce((sum, balance) => sum + balance.amountPaid, 0);
  const totalOutstanding = totalTuition - totalPaid;

  const feeBreakdown = [
    { name: 'Paid Fees', value: totalPaid, color: '#10b981' },
    { name: 'Outstanding', value: totalOutstanding, color: '#ef4444' },
  ];

  // Recent transactions from real invoices
  const recentTransactions = invoices
    .sort((a, b) => new Date(b.paymentDate || b.dueDate).getTime() - new Date(a.paymentDate || a.dueDate).getTime())
    .slice(0, 4)
    .map(invoice => ({
      type: "Fee Payment",
      student: invoice.studentName,
      amount: formatCurrency(invoice.amount),
      date: invoice.paymentDate ? new Date(invoice.paymentDate).toLocaleDateString() : "Pending",
      status: invoice.status.toLowerCase()
    }));

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-fade-in">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-muted rounded-lg animate-pulse-soft" />
                <div className="h-4 w-96 bg-muted/60 rounded animate-pulse-soft" />
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-32 bg-muted rounded-lg animate-pulse-soft" />
                <div className="h-10 w-32 bg-muted rounded-lg animate-pulse-soft" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="shadow-soft">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 w-24 bg-muted rounded animate-pulse-soft" />
                      <div className="h-8 w-32 bg-muted rounded animate-pulse-soft" />
                      <div className="h-3 w-20 bg-muted/60 rounded animate-pulse-soft" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Finance Dashboard</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            Monitor school finances, fees, and expenses
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse-soft" />
              Live Data
            </div>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setFinancialReportDialogOpen(true)} className="hover:bg-muted">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm" className="bg-gradient-primary hover:opacity-90 shadow-medium" onClick={() => setPaymentDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Financial Stats Cards - Enhanced */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {financialStats.map((stat, index) => {
          const handleCardClick = () => {
            if (stat.title === "Fees Collected (This Month)") {
              setFeesCollectedDialogOpen(true);
            } else if (stat.title === "Outstanding Fees") {
              setOutstandingFeesDialogOpen(true);
            } else if (stat.title === "Total Students") {
              setTotalStudentsDialogOpen(true);
            } else if (stat.title === "Payment Status") {
              setPaymentStatusDialogOpen(true);
            }
          };

          return (
            <Card 
              key={index} 
              className="card-hover shadow-soft cursor-pointer animate-scale-in overflow-hidden relative group" 
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={handleCardClick}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color.includes('green') ? 'bg-success/10' : stat.color.includes('yellow') ? 'bg-warning/10' : 'bg-primary/10'} transition-transform group-hover:scale-110`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-foreground bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <span className={stat.trend.startsWith('+') ? 'text-success font-medium' : 'text-destructive font-medium'}>
                    {stat.trend}
                  </span>
                  <span>vs last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 animate-fade-in" style={{ animationDelay: '400ms' }}>
        {/* Revenue Trend */}
        <Card className="shadow-soft card-hover overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-success" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <span>Monthly Revenue vs Expenses</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Line 
                    type="monotone" 
                    dataKey="fees" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Fees Collected"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fee Breakdown */}
        <Card className="shadow-soft card-hover overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <span>Fee Collection Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={feeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {feeBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {feeBreakdown.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="shadow-soft card-hover animate-fade-in" style={{ animationDelay: '600ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/10">
              <CreditCard className="w-5 h-5 text-accent" />
            </div>
            <span>Recent Transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === "Fee Payment" ? "bg-green-100 text-green-600" :
                    transaction.type === "Salary Payment" ? "bg-blue-100 text-blue-600" :
                    "bg-orange-100 text-orange-600"
                  }`}>
                    {transaction.type === "Fee Payment" ? <DollarSign className="w-4 h-4" /> :
                     transaction.type === "Salary Payment" ? <CreditCard className="w-4 h-4" /> :
                     <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.type}</p>
                     <p className="text-sm text-muted-foreground">
                       {transaction.student} • {transaction.date}
                     </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{transaction.amount}</p>
                  <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Canteen Fee Management */}
      <CanteenFeeManagement 
        currentUserId="accountant-001" 
        currentUserName="Accountant"
      />

      {/* Student Balances by Class */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Student Fees by Class</h2>
          <Button size="sm" onClick={() => setPaymentDialogOpen(true)} className="bg-gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </div>
        <StudentBalancesByClass
          students={students}
          studentBalances={studentBalances}
          schoolFees={schoolFees}
        />
      </div>

      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <Receipt className="w-6 h-6" />
              <span>Generate Invoice</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-4" onClick={() => setPaymentDialogOpen(true)}>
              <DollarSign className="w-6 h-6" />
              <span>Record Payment</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-4" onClick={() => setFinancialReportDialogOpen(true)}>
              <FileText className="w-6 h-6" />
              <span>Financial Report</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-4" onClick={() => setFinancialReportDialogOpen(true)}>
              <TrendingUp className="w-6 h-6" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <PaymentDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} />
      <FeesCollectedDialog open={feesCollectedDialogOpen} onOpenChange={setFeesCollectedDialogOpen} />
      <OutstandingFeesDialog 
        open={outstandingFeesDialogOpen} 
        onOpenChange={setOutstandingFeesDialogOpen}
        studentBalances={studentBalances}
        students={students}
      />
      <TotalStudentsDialog 
        open={totalStudentsDialogOpen} 
        onOpenChange={setTotalStudentsDialogOpen}
        students={students}
        studentBalances={studentBalances}
      />
      <PaymentStatusDialog 
        open={paymentStatusDialogOpen} 
        onOpenChange={setPaymentStatusDialogOpen}
        students={students}
        studentBalances={studentBalances}
      />
      <FinancialReportDialog 
        open={financialReportDialogOpen} 
        onOpenChange={setFinancialReportDialogOpen}
      />
    </div>
  );
}