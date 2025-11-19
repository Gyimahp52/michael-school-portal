import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  BookOpen, 
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Eye,
  ArrowUpCircle,
  ClipboardList,
  UserCheck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { subscribeToClasses, Class, subscribeToStudents, Student, subscribeToAssessments, AssessmentRecord } from "@/lib/database-operations";
import { useAuth } from "@/contexts/HybridAuthContext";
import { useNavigate } from "react-router-dom";
import AssessmentDialog from "@/components/dialogs/AssessmentDialog";
import { AttendanceDialog } from "@/components/dialogs/AttendanceDialog";
import { BatchScoreEntry } from "./BatchScoreEntry";
import { BatchAttendance } from "./BatchAttendance";

export function TeacherDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [openAssessment, setOpenAssessment] = useState(false);
  const [openAttendance, setOpenAttendance] = useState(false);

  useEffect(() => {
    const unsubClasses = subscribeToClasses((cls) => {
      const mine = currentUser?.id ? cls.filter(c => (c.teacherIds || []).includes(currentUser.id)) : cls;
      setClasses(mine);
    });
    const unsubStudents = subscribeToStudents(setStudents);
    const unsubAssess = subscribeToAssessments((items) => {
      const mine = currentUser?.id ? items.filter(a => a.teacherId === currentUser.id) : items;
      setAssessments(mine);
    });
    return () => { unsubClasses(); unsubStudents(); unsubAssess(); };
  }, [currentUser?.id]);

  const classCount = classes.length;
  const studentCount = useMemo(() => {
    // Approximate: count active students in same grades as teacher classes
    const grades = new Set(classes.map(c => c.className).filter(Boolean) as string[]);
    return students.filter(s => s.status === 'active' && (grades.size === 0 || grades.has(s.className))).length;
  }, [classes, students]);
  const pendingGrades = assessments.filter(a => a.score === 0).length;

  const teacherStats = [
    { title: "My Classes", value: String(classCount), icon: BookOpen, color: "text-blue-600" },
    { title: "Total Students", value: String(studentCount), icon: Users, color: "text-green-600" },
    { title: "Today's Classes", value: "-", icon: Calendar, color: "text-purple-600" },
    { title: "Pending Grades", value: String(pendingGrades), icon: Clock, color: "text-orange-600" },
  ];

  const todayClasses: { time: string; subject: string; class: string; room: string }[] = [];
  const recentActivities = assessments.slice(0, 4).map(a => ({
    action: `${a.assessmentType} - ${a.subjectId}`,
    class: a.classId,
    time: a.date,
    status: a.score > 0 ? "completed" : "pending"
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            Manage your classes, students, and academic activities
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse-soft" />
              Live Data
            </div>
          </p>
          {classCount > 0 && (
            <p className="text-sm text-primary mt-1 font-medium">You are currently managing {classCount} class{classCount !== 1 ? 'es' : ''}</p>
          )}
        </div>
      </div>

      {/* Stats Cards - Enhanced */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {teacherStats.map((stat, index) => (
          <Card 
            key={index} 
            className="card-hover shadow-soft animate-scale-in overflow-hidden relative group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${
                stat.color.includes('blue') ? 'bg-primary/10' : 
                stat.color.includes('green') ? 'bg-success/10' : 
                stat.color.includes('purple') ? 'bg-accent/10' : 'bg-warning/10'
              } transition-transform group-hover:scale-110`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full animate-fade-in" style={{ animationDelay: '300ms' }}>
        <TabsList className="grid w-full grid-cols-3 max-w-md shadow-soft">
          <TabsTrigger value="overview" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="scores" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Enter Scores
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <UserCheck className="w-4 h-4" />
            Attendance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* My Assigned Classes */}
          {classes.length > 0 && (
            <Card className="shadow-soft card-hover animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <span>My Assigned Classes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {classes.map((classItem, idx) => {
                    const classStudents = students.filter(s => s.className === classItem.className && s.status === 'active');
                    return (
                      <Card 
                        key={classItem.id} 
                        className="border-2 hover:border-primary/50 transition-all card-hover animate-scale-in"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{classItem.className}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {classStudents.length} Student{classStudents.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground shadow-soft">
                              {classItem.section || 'Main'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full justify-start gap-2 hover:bg-primary/10"
                            onClick={() => navigate(`/teacher/class/${classItem.id}`)}
                          >
                            <Users className="w-4 h-4" />
                            View Students
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full justify-start gap-2 hover:bg-accent/10"
                            onClick={() => navigate(`/grades?class=${classItem.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                            View Reports
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {classes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No classes assigned yet</p>
                    <p className="text-sm mt-1">Contact admin to assign classes to you</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Classes */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayClasses.length === 0 ? (
                <div className="text-sm text-muted-foreground">No classes scheduled</div>
              ) : todayClasses.map((cls, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-primary">{cls.time}</div>
                    <div>
                      <p className="font-medium">{cls.subject}</p>
                      <p className="text-sm text-muted-foreground">{cls.class} • {cls.room}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {activity.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    )}
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.class} • {activity.time}</p>
                    </div>
                  </div>
                  <Badge variant={activity.status === "completed" ? "default" : "secondary"}>
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

          {/* Quick Actions */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="h-auto flex-col gap-2 p-4" onClick={() => navigate('/grades')}>
                  <BookOpen className="w-6 h-6" />
                  <span>View All Grades</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4" onClick={() => navigate('/students')}>
                  <Users className="w-6 h-6" />
                  <span>View Students</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4" onClick={() => setOpenAttendance(true)}>
                  <Calendar className="w-6 h-6" />
                  <span>Mark Attendance</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4" onClick={() => setOpenAssessment(true)}>
                  <Plus className="w-6 h-6" />
                  <span>Add Assessment</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enter Scores Tab */}
        <TabsContent value="scores">
          <BatchScoreEntry />
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <BatchAttendance />
        </TabsContent>
      </Tabs>

      <AssessmentDialog open={openAssessment} onOpenChange={setOpenAssessment} />
      <AttendanceDialog open={openAttendance} onOpenChange={setOpenAttendance} />
    </div>
  );
}