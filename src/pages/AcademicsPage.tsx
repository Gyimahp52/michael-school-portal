import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Users,
  GraduationCap,
  Clock,
  Search,
  Plus,
  Eye,
  Edit,
} from "lucide-react";

export default function AcademicsPage() {
  const classes = [
    {
      id: "CLS-001",
      className: "Grade 7-A",
      subject: "Mathematics",
      teacher: "Mrs. Thompson",
      students: 28,
      schedule: "Mon, Wed, Fri - 9:00 AM",
      room: "Room 101",
      status: "active",
    },
    {
      id: "CLS-002",
      className: "Grade 8-B",
      subject: "English Literature",
      teacher: "Mr. Anderson",
      students: 25,
      schedule: "Tue, Thu - 10:30 AM",
      room: "Room 203",
      status: "active",
    },
    {
      id: "CLS-003",
      className: "Grade 9-A",
      subject: "Physics",
      teacher: "Dr. Wilson",
      students: 30,
      schedule: "Mon, Wed - 2:00 PM",
      room: "Laboratory 1",
      status: "active",
    },
  ];

  const subjects = [
    { name: "Mathematics", classes: 12, teachers: 4, students: 320 },
    { name: "English", classes: 10, teachers: 3, students: 285 },
    { name: "Science", classes: 8, teachers: 3, students: 240 },
    { name: "History", classes: 6, teachers: 2, students: 180 },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Academic Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage classes, subjects, and teacher assignments.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="gap-2 w-full sm:w-auto hover:bg-primary/5">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Assign Teacher</span>
            <span className="sm:hidden">Assign</span>
          </Button>
          <Button className="gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Class</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
                <h3 className="text-2xl font-bold mt-1">45</h3>
                <p className="text-xs text-muted-foreground mt-1">Across all grades</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Subjects</p>
                <h3 className="text-2xl font-bold mt-1">12</h3>
                <p className="text-xs text-muted-foreground mt-1">Core & electives</p>
              </div>
              <div className="bg-secondary/10 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teaching Staff</p>
                <h3 className="text-2xl font-bold mt-1">87</h3>
                <p className="text-xs text-muted-foreground mt-1">Full & part-time</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-lg">
                <GraduationCap className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Enrolled Students</p>
                <h3 className="text-2xl font-bold mt-1">1,247</h3>
                <p className="text-xs text-muted-foreground mt-1">All classes</p>
              </div>
              <div className="bg-success/10 p-3 rounded-lg">
                <Users className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Subjects Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjects.map((subject, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <h4 className="font-medium">{subject.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {subject.classes} classes • {subject.teachers} teachers
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{subject.students}</div>
                    <div className="text-xs text-muted-foreground">students</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3 hover:bg-primary/5">
              <BookOpen className="w-4 h-4" />
              Create New Class
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 hover:bg-secondary/5">
              <GraduationCap className="w-4 h-4" />
              Add Subject
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 hover:bg-accent/5">
              <Users className="w-4 h-4" />
              View Attendance
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 hover:bg-muted/50">
              <Clock className="w-4 h-4" />
              Schedule Management
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Classes Table */}
      <Card className="shadow-soft border-border/50">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle>Class Management</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                className="w-full lg:w-80 pl-10 bg-muted/50 border-border"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class ID</TableHead>
                <TableHead>Class Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((classItem) => (
                <TableRow key={classItem.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{classItem.id}</TableCell>
                  <TableCell>{classItem.className}</TableCell>
                  <TableCell>{classItem.subject}</TableCell>
                  <TableCell>{classItem.teacher}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{classItem.students}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{classItem.schedule}</TableCell>
                  <TableCell>{classItem.room}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}