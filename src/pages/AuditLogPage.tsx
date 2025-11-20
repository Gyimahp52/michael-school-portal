import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/HybridAuthContext";
import { subscribeToAuditLogs, AuditLog, AuditAction, AuditEntity } from "@/lib/audit-logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AuditLogPage() {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuditLogs((newLogs) => {
      setLogs(newLogs);
      setLoading(false);
    }, 500); // Last 500 logs

    return unsubscribe;
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.userName.toLowerCase().includes(query) ||
          log.entityName?.toLowerCase().includes(query) ||
          log.details?.toLowerCase().includes(query)
      );
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    if (entityFilter !== "all") {
      filtered = filtered.filter((log) => log.entity === entityFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, searchQuery, actionFilter, entityFilter]);

  const getActionBadge = (action: AuditAction) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      create: "default",
      update: "secondary",
      delete: "destructive",
      login: "outline",
      logout: "outline",
    };
    return (
      <Badge variant={variants[action] || "default"} className="capitalize">
        {action}
      </Badge>
    );
  };

  const getEntityBadge = (entity: AuditEntity) => {
    return (
      <Badge variant="outline" className="capitalize">
        {entity}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: number) => {
    try {
      return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
    } catch {
      return "Invalid date";
    }
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to view audit logs.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Audit Log
          </h1>
          <p className="text-muted-foreground mt-1">
            Track all system activities and changes
          </p>
        </div>
      </div>

      <Card className="card-hover">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, entity, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="grade">Grade</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="grade">Grade</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity Name</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="animate-slide-up">
                      <TableCell className="font-mono text-sm">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.userName}</div>
                          {log.userRole && (
                            <div className="text-xs text-muted-foreground capitalize">
                              {log.userRole}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>{getEntityBadge(log.entity)}</TableCell>
                      <TableCell className="font-medium">
                        {log.entityName || log.entityId.substring(0, 8)}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="text-sm text-muted-foreground truncate">
                          {log.details || "—"}
                        </div>
                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Changed: {Object.keys(log.changes).join(", ")}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
