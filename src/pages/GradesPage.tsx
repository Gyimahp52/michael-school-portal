import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  FileText,
  Search,
  Plus,
  Download,
  BarChart3,
  Users,
  Calendar,
} from "lucide-react";

// Mock grades data
const mockGrades = [
  {
    id: 1,
    studentName: "Sarah Johnson",
    studentId: "STU001",
    grade: "7-A",
    subject: "Mathematics",
    assessment: "Mid-term Exam",
    score: 85,
    maxScore: 100,
    teacherName: "Mr. Thompson",
    date: "2025-01-15",
  },
  {
    id: 2,
    studentName: "Sarah Johnson", 
    studentId: "STU001",
    grade: "7-A",
    subject: "English",
    assessment: "Class Test",
    score: 92,
    maxScore: 100,
    teacherName: "Mrs. Wilson",
    date: "2025-01-12",
  },
  {
    id: 3,
    studentName: "Michael Adams",
    studentId: "STU002",
    grade: "9-B",
    subject: "Physics",
    assessment: "Lab Report",
    score: 78,
    maxScore: 100,
    teacherName: "Dr. Johnson",
    date: "2025-01-14",
  },
  {
    id: 4,
    studentName: "Emily Davis",
    studentId: "STU003", 
    grade: "8-A",
    subject: "Chemistry",
    assessment: "Mid-term Exam",
    score: 89,
    maxScore: 100,
    teacherName: "Mrs. Adams",
    date: "2025-01-16",
  },
];

export function GradesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const filteredGrades = mockGrades.filter((grade) => {
    const matchesSearch = grade.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         grade.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = selectedGrade === "all" || grade.grade.includes(selectedGrade);
    const matchesSubject = selectedSubject === "all" || grade.subject === selectedSubject;
    return matchesSearch && matchesGrade && matchesSubject;
  });

  const getGradeColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return "text-success";
    if (percentage >= 80) return "text-primary";
    if (percentage >= 70) return "text-warning";
    return "text-destructive";
  };

  const getPercentage = (score: number, maxScore: number) => {
    return Math.round((score / maxScore) * 100);
  };

  const averageScore = mockGrades.reduce((sum, grade) => 
    sum + (grade.score / grade.maxScore) * 100, 0
  ) / mockGrades.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Grades & Records</h1>
            <p className="text-muted-foreground">Manage academic assessments and student performance</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report Cards
          </Button>
          <Button className="gap-2 bg-gradient-primary">
            <Plus className="w-4 h-4" />
            Add Grade
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Class Average</p>
                <h3 className="text-2xl font-bold text-primary">{averageScore.toFixed(1)}%</h3>
                <p className="text-xs text-muted-foreground mt-1">Across all subjects</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Assessments</p>
                <h3 className="text-2xl font-bold">156</h3>
                <p className="text-xs text-muted-foreground mt-1">This term</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg">
                <FileText className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Students Graded</p>
                <h3 className="text-2xl font-bold text-success">1,198</h3>
                <p className="text-xs text-muted-foreground mt-1">96% completion</p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <Users className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Report Cards</p>
                <h3 className="text-2xl font-bold text-accent">45</h3>
                <p className="text-xs text-muted-foreground mt-1">Ready for review</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-soft border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4">
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="7">Grade 7</SelectItem>
                  <SelectItem value="8">Grade 8</SelectItem>
                  <SelectItem value="9">Grade 9</SelectItem>
                  <SelectItem value="10">Grade 10</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades Table */}
      <Card className="shadow-soft border-border/50">
        <CardHeader>
          <CardTitle>Recent Grades ({filteredGrades.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Grade/Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrades.map((grade) => (
                <TableRow key={grade.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium">{grade.studentName}</p>
                      <p className="text-sm text-muted-foreground">{grade.studentId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{grade.grade}</Badge>
                  </TableCell>
                  <TableCell>{grade.subject}</TableCell>
                  <TableCell>{grade.assessment}</TableCell>
                  <TableCell className="font-mono">
                    <span className={getGradeColor(grade.score, grade.maxScore)}>
                      {grade.score}/{grade.maxScore}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getGradeColor(grade.score, grade.maxScore).replace('text-', 'bg-')}`}
                          style={{ width: `${getPercentage(grade.score, grade.maxScore)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${getGradeColor(grade.score, grade.maxScore)}`}>
                        {getPercentage(grade.score, grade.maxScore)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{grade.teacherName}</TableCell>
                  <TableCell>{grade.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}