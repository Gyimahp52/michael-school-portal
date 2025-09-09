import { useState, useEffect } from "react";
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
  Calculator,
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
import {
  getDashboardStats,
  getEnrollmentGrowthData,
  getFeeCollectionData,
  getFeeBreakdownData,
  getRecentActivities,
  getPendingTasks,
  subscribeToDashboardStats,
  subscribeToRecentActivities,
  type DashboardStats,
  type EnrollmentData,
  type FeeCollectionData,
  type FeeBreakdownData,
  type RecentActivity,
  type PendingTask
} from "@/lib/dashboard-analytics";

export function AdminDashboard() {
  const navigate = useNavigate();
  
  // State for real-time data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    activeClasses: 0,
    activeEnrollments: 0,
    totalRevenue: 0,
    outstandingFees: 0,
    monthlyExpenses: 0,
    netBalance: 0
  });
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData[]>([]);
  const [feeData, setFeeData] = useState<FeeCollectionData[]>([]);
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdownData[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data and set up real-time subscriptions
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [stats, enrollment, fees, breakdown, activities, tasks] = await Promise.all([
          getDashboardStats(),
          getEnrollmentGrowthData(),
          getFeeCollectionData(),
          getFeeBreakdownData(),
          getRecentActivities(),
          getPendingTasks()
        ]);

        setDashboardStats(stats);
        setEnrollmentData(enrollment);
        setFeeData(fees);
        setFeeBreakdown(breakdown);
        setRecentActivities(activities);
        setPendingTasks(tasks);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Set up real-time subscriptions
    const unsubscribeStats = subscribeToDashboardStats(setDashboardStats);
    const unsubscribeActivities = subscribeToRecentActivities(setRecentActivities);

    return () => {
      unsubscribeStats();
      unsubscribeActivities();
    };
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => `₵${amount.toLocaleString()}`;

  // Helper function to get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment': return Users;
      case 'payment': return DollarSign;
      case 'grade': return FileText;
      case 'class': return Calendar;
      case 'user': return Users;
      default: return Clock;
    }
  };

  // Helper function to format time
  const formatTime = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInHours = Math.abs(now.getTime() - activityTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  // Primary stats with real data
  const primaryStats = [
    {
      title: "Total Students",
      value: dashboardStats.totalStudents.toString(),
      change: "Active enrollments",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Teachers",
      value: dashboardStats.totalTeachers.toString(),
      change: "Staff members",
      icon: GraduationCap,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Active Classes",
      value: dashboardStats.activeClasses.toString(),
      change: "Across all grades",
      icon: BookOpen,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Active Enrollments",
      value: dashboardStats.activeEnrollments.toString(),
      change: `${Math.round((dashboardStats.activeEnrollments / dashboardStats.totalStudents) * 100) || 0}% active`,
      icon: School,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  // Financial stats with real data
  const financialStats = [
    {
      title: "Total Revenue",
      value: formatCurrency(dashboardStats.totalRevenue),
      change: "All time collected",
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Outstanding Fees",
      value: formatCurrency(dashboardStats.outstandingFees),
      change: "Pending collection",
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Monthly Expenses",
      value: formatCurrency(dashboardStats.monthlyExpenses),
      change: "Current month",
      icon: CreditCard,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Net Balance",
      value: formatCurrency(dashboardStats.netBalance),
      change: "Available funds",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

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
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => {
                    const ActivityIcon = getActivityIcon(activity.type);
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <ActivityIcon className="w-4 h-4 text-primary" />
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
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No recent activities
                  </div>
                )}
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
              <Button variant="outline" className="w-full justify-start gap-3 hover:bg-green-50 transition-colors" onClick={() => navigate('/admin/school-fees')}>
                <DollarSign className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Set School Fees</span>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 hover:bg-accent/5 transition-colors" onClick={() => navigate('/admin/billing')}>
                <Calculator className="w-4 h-4 flex-shrink-0" />
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
              {pendingTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{task.label}</span>
                  {task.amount ? (
                    <Badge variant="destructive">{formatCurrency(task.amount)}</Badge>
                  ) : (
                    <Badge variant="secondary">{task.count}</Badge>
                  )}
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No pending tasks
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}