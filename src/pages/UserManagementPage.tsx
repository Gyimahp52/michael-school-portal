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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Shield,
  Users,
  UserPlus,
  Search,
  Edit,
  Key,
  Eye,
  MoreHorizontal,
} from "lucide-react";

export default function UserManagementPage() {
  const users = [
    {
      id: "USR-001",
      name: "John Administrator",
      email: "admin@michaelagyeischool.edu.gh",
      role: "Admin",
      status: "active",
      lastLogin: "2024-01-15 09:30",
      avatar: "",
    },
    {
      id: "USR-002",
      name: "Sarah Teacher",
      email: "sarah.teacher@michaelagyeischool.edu.gh",
      role: "Teacher",
      status: "active",
      lastLogin: "2024-01-15 08:45",
      avatar: "",
    },
    {
      id: "USR-003",
      name: "Michael Accountant",
      email: "michael.acc@michaelagyeischool.edu.gh",
      role: "Accountant",
      status: "active",
      lastLogin: "2024-01-14 16:20",
      avatar: "",
    },
    {
      id: "USR-004",
      name: "Emma Wilson",
      email: "emma.wilson@michaelagyeischool.edu.gh",
      role: "Teacher",
      status: "inactive",
      lastLogin: "2024-01-10 14:15",
      avatar: "",
    },
  ];

  const roles = [
    { name: "Admin", count: 3, permissions: "Full Access", color: "bg-primary/10 text-primary" },
    { name: "Teacher", count: 24, permissions: "Academic Management", color: "bg-secondary/10 text-secondary" },
    { name: "Accountant", count: 2, permissions: "Financial Management", color: "bg-accent/10 text-accent" },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Admin</Badge>;
      case "Teacher":
        return <Badge className="bg-secondary/10 text-secondary border-secondary/20">Teacher</Badge>;
      case "Accountant":
        return <Badge className="bg-accent/10 text-accent border-accent/20">Accountant</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "active" 
      ? <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
      : <Badge className="bg-destructive/10 text-destructive border-destructive/20">Inactive</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage system users, roles, and permissions.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="gap-2 w-full sm:w-auto hover:bg-primary/5">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Manage Roles</span>
            <span className="sm:hidden">Roles</span>
          </Button>
          <Button className="gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <h3 className="text-2xl font-bold mt-1">29</h3>
                <p className="text-xs text-muted-foreground mt-1">Active system users</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <h3 className="text-2xl font-bold mt-1">18</h3>
                <p className="text-xs text-muted-foreground mt-1">Currently logged in</p>
              </div>
              <div className="bg-success/10 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User Roles</p>
                <h3 className="text-2xl font-bold mt-1">3</h3>
                <p className="text-xs text-muted-foreground mt-1">Different access levels</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-lg">
                <Key className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roles.map((role, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <h4 className="font-medium">{role.name}</h4>
                    <p className="text-sm text-muted-foreground">{role.permissions}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={role.color}>{role.count} users</Badge>
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
              <UserPlus className="w-4 h-4" />
              Create New User
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 hover:bg-secondary/5">
              <Shield className="w-4 h-4" />
              Manage Permissions
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 hover:bg-accent/5">
              <Key className="w-4 h-4" />
              Reset Passwords
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 hover:bg-muted/50">
              <Eye className="w-4 h-4" />
              View Activity Logs
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="shadow-soft border-border/50">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle>System Users</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="w-full lg:w-80 pl-10 bg-muted/50 border-border"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-sm">{user.lastLogin}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
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