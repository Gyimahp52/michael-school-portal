import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Receipt } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { get, ref } from "firebase/database";
import { rtdb } from "@/firebase";

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  status: string;
}

interface MonthlyExpensesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MonthlyExpensesDialog({ open, onOpenChange }: MonthlyExpensesDialogProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadExpenses();
    }
  }, [open]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const financialSnapshot = await get(ref(rtdb, 'financial'));
      
      if (financialSnapshot.exists()) {
        const financialData = Object.entries(financialSnapshot.val());
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyExpenses = financialData
          .map(([id, record]: [string, any]) => ({
            id,
            ...record
          }))
          .filter(record => {
            if (record.type !== 'expense') return false;
            const expenseDate = new Date(record.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setExpenses(monthlyExpenses);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, exp) => {
    const category = exp.category || 'Other';
    if (!acc[category]) {
      acc[category] = { count: 0, total: 0 };
    }
    acc[category].count += 1;
    acc[category].total += exp.amount || 0;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-destructive" />
            Monthly Expenses - {currentMonthName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <CreditCard className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border border-border">
              <Receipt className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Number of Expenses</p>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          {Object.keys(expensesByCategory).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(expensesByCategory).map(([category, data]) => (
                <div key={category} className="p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-xs font-medium text-muted-foreground">{category}</p>
                  <p className="text-lg font-bold">{formatCurrency(data.total)}</p>
                  <p className="text-xs text-muted-foreground">{data.count} item{data.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          )}

          {/* Details Table */}
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading expenses data...
              </div>
            ) : expenses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {new Date(expense.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{expense.category}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell className="font-semibold text-destructive">
                        {formatCurrency(expense.amount || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={expense.status === 'completed' ? 'default' : 'secondary'}
                        >
                          {expense.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No expenses recorded for this month
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
