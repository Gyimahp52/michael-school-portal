import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { get, ref } from "firebase/database";
import { rtdb } from "@/firebase";

interface Invoice {
  id: string;
  studentId: string;
  studentName?: string;
  amount: number;
  status: string;
  paymentDate?: string;
  description?: string;
  term?: string;
}

interface TotalRevenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TotalRevenueDialog({ open, onOpenChange }: TotalRevenueDialogProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadInvoices();
    }
  }, [open]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const [invoicesSnapshot, studentsSnapshot] = await Promise.all([
        get(ref(rtdb, 'invoices')),
        get(ref(rtdb, 'students'))
      ]);

      const invoicesData = invoicesSnapshot.exists() ? Object.entries(invoicesSnapshot.val()) : [];
      const studentsData = studentsSnapshot.exists() ? studentsSnapshot.val() : {};

      const paidInvoices = invoicesData
        .map(([id, invoice]: [string, any]) => {
          // Find student by matching the invoice's studentId with student records
          const student = studentsData[invoice.studentId];
          return {
            id,
            ...invoice,
            studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
            term: invoice.term || invoice.academicTerm || 'N/A'
          };
        })
        .filter(inv => inv.status === 'Paid')
        .sort((a, b) => {
          const dateA = new Date(a.paymentDate || a.createdAt || 0);
          const dateB = new Date(b.paymentDate || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

      setInvoices(paidInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            Total Revenue Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue Collected</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Paid Invoices</p>
              <p className="text-2xl font-bold">{invoices.length}</p>
            </div>
          </div>

          {/* Details Table */}
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading revenue data...
              </div>
            ) : invoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.studentName}</TableCell>
                      <TableCell>{invoice.description || 'School Fees'}</TableCell>
                      <TableCell>{invoice.term || 'N/A'}</TableCell>
                      <TableCell>
                        {invoice.paymentDate 
                          ? new Date(invoice.paymentDate).toLocaleDateString() 
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="font-semibold text-success">
                        {formatCurrency(invoice.amount || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-success">
                          Paid
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No revenue data found
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
