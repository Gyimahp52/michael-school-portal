import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  Clock,
  Calendar,
  FileText,
  UserPlus,
  School,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { useNavigate } from "react-router-dom";

export function AdminDashboard() {
  const navigate = useNavigate();
  // Enhanced statistics with financial metrics
  const primaryStats = [
    {
      title: "Total Students",
      value: "1,247",
      change: "+12% from last month",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Teachers",
      value: "87",
      change: "+2 new this month",
      icon: GraduationCap,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Active Classes",
      value: "45",
      change: "Across all grades",
      icon: BookOpen,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Active Enrollments",
      value: "1,198",
      change: "96% capacity",
      icon: School,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  // Financial summary statistics
  const financialStats = [
    {
      title: "Fees Collected",
      value: "₵285,750",
      change: "+15.3% this month",
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Outstanding Fees",
      value: "₵42,350",
      change: "23 students pending",
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Monthly Expenses",
      value: "₵95,200",
      change: "Within budget",
      icon: CreditCard,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Net Balance",
      value: "₵190,550",
      change: "+12.8% profit margin",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  // Enrollment growth data for line chart
  const enrollmentData = [
    { month: 'Jan', students: 1150 },
    { month: 'Feb', students: 1175 },
    { month: 'Mar', students: 1198 },
    { month: 'Apr', students: 1220 },
    { month: 'May', students: 1235 },
    { month: 'Jun', students: 1247 },
  ];

  // Fee collection vs outstanding data for bar chart
  const feeData = [
    { month: 'Jan', collected: 265000, outstanding: 45000 },
    { month: 'Feb', collected: 275000, outstanding: 38000 },
    { month: 'Mar', collected: 280000, outstanding: 35000 },
    { month: 'Apr', collected: 285750, outstanding: 42350 },
  ];

  // Fee collection breakdown for pie chart
  const feeBreakdown = [
    { name: 'Tuition Fees', value: 185750, fill: 'hsl(var(--primary))' },
    { name: 'Lab Fees', value: 45000, fill: 'hsl(var(--secondary))' },
    { name: 'Library Fees', value: 25000, fill: 'hsl(var(--accent))' },
    { name: 'Sports Fees', value: 30000, fill: 'hsl(var(--success))' },
  ];

  const recentActivities = [
    {
      type: "enrollment",
      title: "New student enrolled",
      description: "Sarah Johnson joined Grade 7-A",
      time: "2 hours ago",
      icon: Users,
    },
    {
      type: "payment",
      title: "Fee payment received",
      description: "₵850 from Michael Adams (Grade 9-B)",
      time: "4 hours ago",
      icon: DollarSign,
    },
    {
      type: "grade",
      title: "Grades submitted",
      description: "Math grades for Grade 8-A by Mrs. Thompson",
      time: "6 hours ago",
      icon: FileText,
    },
    {
      type: "class",
      title: "Class schedule updated",
      description: "Physics class moved to Laboratory 2",
      time: "1 day ago",
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, Administrator
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening at Michael Agyei School today.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/*to generate report page on admin dashboard */}
          <Button variant="outline" className="gap-2 w-full sm:w-auto hover:bg-primary/5" onClick={() => navigate('/admin/reports')}>
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Generate Report</span>
            <span className="sm:hidden">Report</span>
          </Button>
          {/*to add a student on admin dashboard */}
          <Button className="gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto" onClick={() => navigate('/admin/students')}>
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Student</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Primary Stats Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">School Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {primaryStats.map((stat, index) => (
            <Card key={index} className="shadow-soft border-border/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Financial Summary */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Financial Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {financialStats.map((stat, index) => (
            <Card key={index} className="shadow-soft border-border/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Enrollment Growth Chart */}
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Enrollment Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="students" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee Collection Chart */}
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-success" />
              Fee Collection vs Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={feeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="collected" fill="hsl(var(--success))" name="Collected" />
                <Bar dataKey="outstanding" fill="hsl(var(--warning))" name="Outstanding" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee Breakdown Pie Chart */}
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-accent" />
              Fee Collection Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={feeBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={10}
                >
                  {feeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`₵${value.toLocaleString()}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <activity.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">
                        {activity.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Summary */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3 hover:bg-primary/5 transition-colors" onClick={() => navigate('/admin/students')}>
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Add New Student</span>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 hover:bg-secondary/5 transition-colors" onClick={() => navigate('/admin/users')}>
                <GraduationCap className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Register Teacher</span>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 hover:bg-accent/5 transition-colors" onClick={() => navigate('/admin/billing')}>
                <DollarSign className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Generate Invoice</span>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 hover:bg-muted/50 transition-colors" onClick={() => navigate('/admin/reports')}>
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">View Reports</span>
              </Button>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Admission Reviews</span>
                <Badge variant="secondary">12</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Outstanding Fees</span>
                <Badge variant="destructive">₵23,450</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Grade Approvals</span>
                <Badge variant="secondary">8</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Teacher Evaluations</span>
                <Badge variant="secondary">5</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}