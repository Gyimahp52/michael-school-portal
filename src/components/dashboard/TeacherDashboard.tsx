import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  BookOpen, 
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Eye,
  ArrowUpCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { subscribeToClasses, Class, subscribeToStudents, Student, subscribeToAssessments, AssessmentRecord } from "@/lib/database-operations";
import { useAuth } from "@/contexts/CustomAuthContext";
import { useNavigate } from "react-router-dom";
import AssessmentDialog from "@/components/dialogs/AssessmentDialog";
import { AttendanceDialog } from "@/components/dialogs/AttendanceDialog";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your classes, students, and academic activities</p>
          {classCount > 0 && (
            <p className="text-sm text-primary mt-1">You are currently managing {classCount} class{classCount !== 1 ? 'es' : ''}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            View Schedule
          </Button>
          <Button size="sm" onClick={() => setOpenAssessment(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Grade
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {teacherStats.map((stat, index) => (
          <Card key={index} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Assigned Classes */}
      {classes.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              My Assigned Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((classItem) => {
                const classStudents = students.filter(s => s.className === classItem.className && s.status === 'active');
                return (
                  <Card key={classItem.id} className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{classItem.className}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {classStudents.length} Student{classStudents.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge variant="secondary">{classItem.section || 'Main'}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start gap-2"
                        onClick={() => navigate(`/teacher/class/${classItem.id}`)}
                      >
                        <Users className="w-4 h-4" />
                        View Students
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          setOpenAssessment(true);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Enter Scores
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start gap-2"
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

      <AssessmentDialog open={openAssessment} onOpenChange={setOpenAssessment} />
      <AttendanceDialog open={openAttendance} onOpenChange={setOpenAttendance} />
    </div>
  );
}