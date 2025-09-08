import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAllStudents, getAllClasses, Student, Class } from "@/lib/database-operations";
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
} from "lucide-react";

export default function ReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [sendingReports, setSendingReports] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsData, classesData] = await Promise.all([
          getAllStudents(),
          getAllClasses()
        ]);
        setStudents(studentsData);
        setClasses(classesData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

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
      const classStudents = students.filter(student => student.grade === selectedClass);
      
      if (classStudents.length === 0) {
        toast({
          title: "No Students Found",
          description: "No students found in the selected class",
          variant: "destructive",
        });
        return;
      }

      // Simulate sending WhatsApp messages to parents
      for (const student of classStudents) {
        if (student.parentWhatsApp) {
          // In a real implementation, you would integrate with WhatsApp Business API
          console.log(`Sending report to ${student.parentName} at ${student.parentWhatsApp} for ${student.firstName} ${student.lastName}`);
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
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
  const reports = [
    {
      id: "RPT-001",
      title: "Student Enrollment Report",
      description: "Complete overview of student enrollment by grade and class",
      category: "Academic",
      lastGenerated: "2025-01-15",
      format: "PDF, Excel",
      icon: Users,
    },
    {
      id: "RPT-002",
      title: "Financial Summary Report",
      description: "Monthly revenue, expenses, and outstanding fees analysis",
      category: "Finance",
      lastGenerated: "2025-01-14",
      format: "PDF, Excel",
      icon: DollarSign,
    },
    {
      id: "RPT-003",
      title: "Academic Performance Report",
      description: "Grade distribution and academic performance analytics",
      category: "Academic",
      lastGenerated: "2025-01-13",
      format: "PDF",
      icon: BarChart3,
    },
    {
      id: "RPT-004",
      title: "Attendance Summary",
      description: "Student attendance rates and trends analysis",
      category: "Academic",
      lastGenerated: "2025-01-12",
      format: "PDF, Excel",
      icon: Calendar,
    },
  ];

  const quickStats = [
    {
      title: "Reports Generated",
      value: "245",
      change: "This month",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Downloads",
      value: "1,458",
      change: "Total this year",
      icon: Download,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Active Reports",
      value: "12",
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Generate comprehensive reports for academic and financial analysis.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          </CardContent>
        </Card>

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
          </CardContent>
        </Card>

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
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Report Sending */}
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
                    <SelectItem value="7">Grade 7</SelectItem>
                    <SelectItem value="8">Grade 8</SelectItem>
                    <SelectItem value="9">Grade 9</SelectItem>
                    <SelectItem value="10">Grade 10</SelectItem>
                    <SelectItem value="11">Grade 11</SelectItem>
                    <SelectItem value="12">Grade 12</SelectItem>
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
                  {students.filter(s => s.grade === selectedClass).length} students found in Grade {selectedClass}
                  {" - "}
                  {students.filter(s => s.grade === selectedClass && s.parentWhatsApp).length} parents have WhatsApp numbers
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Reports */}
      <Card className="shadow-soft border-border/50">
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="shadow-sm border-border/30 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <report.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-foreground">{report.title}</h4>
                        {getCategoryBadge(report.category)}
                      </div>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Last generated: {report.lastGenerated}</span>
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}