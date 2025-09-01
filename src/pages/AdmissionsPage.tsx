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
  CheckCircle,
  XCircle,
  Clock,
  Search,
  UserPlus,
  Filter,
  Eye,
} from "lucide-react";

export default function AdmissionsPage() {
  const applications = [
    {
      id: "APP-001",
      studentName: "Alice Johnson",
      parentName: "Robert Johnson",
      grade: "Grade 7",
      appliedDate: "2024-01-15",
      status: "pending",
      phone: "0551234567",
      email: "robert.johnson@email.com",
    },
    {
      id: "APP-002", 
      studentName: "David Wilson",
      parentName: "Sarah Wilson",
      grade: "Grade 9",
      appliedDate: "2024-01-14",
      status: "approved",
      phone: "0559876543",
      email: "sarah.wilson@email.com",
    },
    {
      id: "APP-003",
      studentName: "Emma Brown",
      parentName: "Michael Brown",
      grade: "Grade 8", 
      appliedDate: "2024-01-13",
      status: "rejected",
      phone: "0557654321",
      email: "michael.brown@email.com",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
      default:
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admissions Management</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage student applications for enrollment.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="gap-2 w-full sm:w-auto hover:bg-primary/5">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter Applications</span>
            <span className="sm:hidden">Filter</span>
          </Button>
          <Button className="gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Application</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                <h3 className="text-2xl font-bold mt-1">127</h3>
                <p className="text-xs text-muted-foreground mt-1">This academic year</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <UserPlus className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <h3 className="text-2xl font-bold mt-1">23</h3>
                <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
              </div>
              <div className="bg-warning/10 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved This Week</p>
                <h3 className="text-2xl font-bold mt-1">12</h3>
                <p className="text-xs text-muted-foreground mt-1">85% approval rate</p>
              </div>
              <div className="bg-success/10 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card className="shadow-soft border-border/50">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle>Recent Applications</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search applications..."
                className="w-full lg:w-80 pl-10 bg-muted/50 border-border"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Parent/Guardian</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{app.id}</TableCell>
                  <TableCell>{app.studentName}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{app.parentName}</div>
                      <div className="text-xs text-muted-foreground">{app.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{app.grade}</TableCell>
                  <TableCell>{app.appliedDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(app.status)}
                      {getStatusBadge(app.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {app.status === "pending" && (
                        <>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-success hover:bg-success/10">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
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