import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Receipt, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Student, StudentBalance } from "@/lib/database-operations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PaymentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  studentBalances: StudentBalance[];
}

export function PaymentStatusDialog({ open, onOpenChange, students, studentBalances }: PaymentStatusDialogProps) {
  const partialPayments = studentBalances
    .filter(b => b.status === 'partial')
    .map(balance => {
      const student = students.find(s => s.id === balance.studentId);
      return {
        ...balance,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
        className: student?.className || 'N/A'
      };
    })
    .sort((a, b) => b.balance - a.balance);

  const overduePayments = studentBalances
    .filter(b => b.status === 'overdue')
    .map(balance => {
      const student = students.find(s => s.id === balance.studentId);
      return {
        ...balance,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
        className: student?.className || 'N/A'
      };
    })
    .sort((a, b) => b.balance - a.balance);

  const totalPartialOutstanding = partialPayments.reduce((sum, p) => sum + p.balance, 0);
  const totalOverdueOutstanding = overduePayments.reduce((sum, p) => sum + p.balance, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Payment Status Breakdown
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-orange-600" />
                <p className="text-sm font-medium text-muted-foreground">Partial Payments</p>
              </div>
              <p className="text-2xl font-bold">{partialPayments.length}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Outstanding: {formatCurrency(totalPartialOutstanding)}
              </p>
            </div>
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm font-medium text-muted-foreground">Overdue Payments</p>
              </div>
              <p className="text-2xl font-bold">{overduePayments.length}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Outstanding: {formatCurrency(totalOverdueOutstanding)}
              </p>
            </div>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="partial" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="partial">Partial Payments ({partialPayments.length})</TabsTrigger>
              <TabsTrigger value="overdue">Overdue ({overduePayments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="partial">
              <ScrollArea className="h-[400px]">
                {partialPayments.length > 0 ? (
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
                      {partialPayments.map((payment) => (
                        <TableRow key={payment.studentId}>
                          <TableCell className="font-medium">{payment.studentName}</TableCell>
                          <TableCell>{payment.className}</TableCell>
                          <TableCell>{formatCurrency(payment.totalFees)}</TableCell>
                          <TableCell className="text-success font-semibold">
                            {formatCurrency(payment.amountPaid)}
                          </TableCell>
                          <TableCell className="text-orange-600 font-semibold">
                            {formatCurrency(payment.balance)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Partial</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No partial payments found
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="overdue">
              <ScrollArea className="h-[400px]">
                {overduePayments.length > 0 ? (
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
                      {overduePayments.map((payment) => (
                        <TableRow key={payment.studentId}>
                          <TableCell className="font-medium">{payment.studentName}</TableCell>
                          <TableCell>{payment.className}</TableCell>
                          <TableCell>{formatCurrency(payment.totalFees)}</TableCell>
                          <TableCell className="text-success font-semibold">
                            {formatCurrency(payment.amountPaid)}
                          </TableCell>
                          <TableCell className="text-destructive font-semibold">
                            {formatCurrency(payment.balance)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">Overdue</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No overdue payments found
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
