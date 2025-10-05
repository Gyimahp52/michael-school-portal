import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { StudentBalance, Student } from "@/lib/database-operations";
import { AlertTriangle, DollarSign } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OutstandingFeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentBalances: StudentBalance[];
  students: Student[];
}

export function OutstandingFeesDialog({ 
  open, 
  onOpenChange, 
  studentBalances,
  students 
}: OutstandingFeesDialogProps) {
  // Filter for outstanding balances
  const outstandingBalances = studentBalances.filter(
    bal => bal.status === 'partial' || bal.status === 'overdue'
  );

  // Calculate total outstanding
  const totalOutstanding = outstandingBalances.reduce(
    (sum, bal) => sum + (bal.balance || 0), 
    0
  );

  // Get student details for each balance
  const outstandingDetails = outstandingBalances.map(balance => {
    const student = students.find(s => s.id === balance.studentId);
    return {
      ...balance,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
      className: balance.className || 'N/A'
    };
  }).sort((a, b) => (b.balance || 0) - (a.balance || 0)); // Sort by balance descending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Outstanding Fees Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between p-4 bg-warning/10 rounded-lg border border-warning/20">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
                <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Students Affected</p>
              <p className="text-2xl font-bold">{outstandingBalances.length}</p>
            </div>
          </div>

          {/* Details Table */}
          <ScrollArea className="h-[400px]">
            {outstandingDetails.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Total Fees</TableHead>
                    <TableHead>Amount Paid</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingDetails.map((detail) => (
                    <TableRow key={detail.id}>
                      <TableCell className="font-medium">{detail.studentName}</TableCell>
                      <TableCell>{detail.className}</TableCell>
                      <TableCell>{formatCurrency(detail.totalFees || 0)}</TableCell>
                      <TableCell>{formatCurrency(detail.amountPaid || 0)}</TableCell>
                      <TableCell className="font-semibold text-warning">
                        {formatCurrency(detail.balance || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={detail.status === 'overdue' ? 'destructive' : 'secondary'}
                        >
                          {detail.status === 'overdue' ? 'Overdue' : 'Partial'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No outstanding fees found
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
