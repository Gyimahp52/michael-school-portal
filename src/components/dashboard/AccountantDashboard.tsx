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
  Download
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export function AccountantDashboard() {
  // Mock financial data
  const financialStats = [
    { title: "Fees Collected (This Month)", value: "₵45,230", icon: DollarSign, color: "text-green-600", trend: "+12.5%" },
    { title: "Outstanding Fees", value: "₵8,750", icon: AlertTriangle, color: "text-red-600", trend: "-5.2%" },
    { title: "Expenses (This Month)", value: "₵12,400", icon: TrendingDown, color: "text-orange-600", trend: "+8.1%" },
    { title: "Net Balance", value: "₵32,830", icon: TrendingUp, color: "text-blue-600", trend: "+15.3%" },
  ];

  // Mock chart data
  const monthlyRevenue = [
    { name: 'Jan', fees: 38000, expenses: 15000 },
    { name: 'Feb', fees: 42000, expenses: 13500 },
    { name: 'Mar', fees: 45230, expenses: 12400 },
  ];

  const feeBreakdown = [
    { name: 'Tuition Fees', value: 28000, color: '#3b82f6' },
    { name: 'Exam Fees', value: 8500, color: '#10b981' },
    { name: 'Activity Fees', value: 5200, color: '#f59e0b' },
    { name: 'Other Fees', value: 3530, color: '#ef4444' },
  ];

  const recentTransactions = [
    { type: "Fee Payment", student: "John Doe", amount: "₵1,200", date: "Today", status: "completed" },
    { type: "Salary Payment", description: "Teacher Salaries", amount: "₵8,500", date: "Yesterday", status: "completed" },
    { type: "Utilities", description: "Electricity Bill", amount: "₵450", date: "2 days ago", status: "completed" },
    { type: "Fee Payment", student: "Jane Smith", amount: "₵800", date: "2 days ago", status: "pending" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Finance Dashboard</h1>
          <p className="text-muted-foreground">Monitor school finances, fees, and expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Financial Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {financialStats.map((stat, index) => (
          <Card key={index} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <span className={stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {stat.trend}
                </span>
                <span>vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Revenue vs Expenses
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
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Fee Collection Breakdown
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
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Recent Transactions
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
                      {transaction.student || transaction.description} • {transaction.date}
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
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <DollarSign className="w-6 h-6" />
              <span>Record Payment</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <FileText className="w-6 h-6" />
              <span>Financial Report</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-4">
              <TrendingUp className="w-6 h-6" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}