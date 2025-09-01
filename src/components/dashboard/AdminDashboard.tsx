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
} from "lucide-react";

export function AdminDashboard() {
  const stats = [
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
      title: "Monthly Revenue",
      value: "₵45,250",
      change: "+8.2% from last month",
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, Administrator
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening at Michael Agyei School today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Generate Report
          </Button>
          <Button className="gap-2 bg-gradient-primary">
            <Users className="w-4 h-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-soft border-border/50">
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
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
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
              <Button variant="outline" className="w-full justify-start gap-3">
                <Users className="w-4 h-4" />
                Add New Student
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3">
                <GraduationCap className="w-4 h-4" />
                Register Teacher
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3">
                <DollarSign className="w-4 h-4" />
                Generate Invoice
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3">
                <FileText className="w-4 h-4" />
                View Reports
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
                <Badge variant="outline">₵23,450</Badge>
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