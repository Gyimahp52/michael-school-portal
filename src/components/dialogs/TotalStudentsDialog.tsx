import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Users, UserCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Student, StudentBalance } from "@/lib/database-operations";

interface TotalStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  studentBalances: StudentBalance[];
}

export function TotalStudentsDialog({ open, onOpenChange, students, studentBalances }: TotalStudentsDialogProps) {
  const studentsWithBalances = students.map(student => {
    const balance = studentBalances.find(b => b.studentId === student.id);
    return {
      ...student,
      totalFees: balance?.totalFees || 0,
      amountPaid: balance?.amountPaid || 0,
      balance: balance?.balance || 0,
      status: balance?.status || 'pending'
    };
  }).sort((a, b) => a.lastName.localeCompare(b.lastName));

  const paidCount = studentsWithBalances.filter(s => s.status === 'paid').length;
  const partialCount = studentsWithBalances.filter(s => s.status === 'partial').length;
  const overdueCount = studentsWithBalances.filter(s => s.status === 'overdue').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success">Paid</Badge>;
      case 'partial':
        return <Badge variant="secondary">Partial</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Total Students Overview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
              </div>
              <p className="text-2xl font-bold">{students.length}</p>
            </div>
            <div className="p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-success" />
                <p className="text-sm font-medium text-muted-foreground">Fully Paid</p>
              </div>
              <p className="text-2xl font-bold">{paidCount}</p>
            </div>
            <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <p className="text-sm font-medium text-muted-foreground mb-2">Partial Payment</p>
              <p className="text-2xl font-bold">{partialCount}</p>
            </div>
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-sm font-medium text-muted-foreground mb-2">Overdue</p>
              <p className="text-2xl font-bold">{overdueCount}</p>
            </div>
          </div>

          {/* Details Table */}
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Total Fees</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsWithBalances.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>{student.className || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(student.totalFees)}</TableCell>
                    <TableCell className="text-success font-semibold">
                      {formatCurrency(student.amountPaid)}
                    </TableCell>
                    <TableCell className={student.balance > 0 ? 'text-destructive font-semibold' : ''}>
                      {formatCurrency(student.balance)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(student.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
