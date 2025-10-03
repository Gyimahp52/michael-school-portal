import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Student, StudentBalance, SchoolFees } from "@/lib/database-operations";
import { Users, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StudentBalancesByClassProps {
  students: Student[];
  studentBalances: StudentBalance[];
  schoolFees: SchoolFees[];
}

interface ClassSummary {
  className: string;
  totalStudents: number;
  totalExpected: number;
  totalCollected: number;
  totalOutstanding: number;
  paidCount: number;
  partialCount: number;
  overdueCount: number;
  students: Array<{
    id: string;
    name: string;
    totalFees: number;
    amountPaid: number;
    balance: number;
    status: 'paid' | 'partial' | 'overdue';
  }>;
}

export function StudentBalancesByClass({ students, studentBalances, schoolFees }: StudentBalancesByClassProps) {
  const classSummaries = useMemo(() => {
    const summaryMap = new Map<string, ClassSummary>();

    // Group students by class
    students.filter(s => s.status === 'active').forEach(student => {
      const className = student.className;
      if (!summaryMap.has(className)) {
        const classFees = schoolFees.find(f => f.className === className);
        summaryMap.set(className, {
          className,
          totalStudents: 0,
          totalExpected: 0,
          totalCollected: 0,
          totalOutstanding: 0,
          paidCount: 0,
          partialCount: 0,
          overdueCount: 0,
          students: []
        });
      }

      const summary = summaryMap.get(className)!;
      const balance = studentBalances.find(b => b.studentId === student.id);
      const classFees = schoolFees.find(f => f.className === className);
      const totalFees = balance?.totalFees || classFees?.totalFees || 0;
      const amountPaid = balance?.amountPaid || 0;
      const remaining = totalFees - amountPaid;
      const status = balance?.status || (totalFees > 0 ? 'overdue' : 'paid');

      summary.totalStudents++;
      summary.totalExpected += totalFees;
      summary.totalCollected += amountPaid;
      summary.totalOutstanding += remaining;
      
      if (status === 'paid') summary.paidCount++;
      else if (status === 'partial') summary.partialCount++;
      else summary.overdueCount++;

      summary.students.push({
        id: student.id!,
        name: `${student.firstName} ${student.lastName}`,
        totalFees,
        amountPaid,
        balance: remaining,
        status
      });
    });

    // Sort students within each class by balance (highest first)
    summaryMap.forEach(summary => {
      summary.students.sort((a, b) => b.balance - a.balance);
    });

    return Array.from(summaryMap.values()).sort((a, b) => 
      a.className.localeCompare(b.className)
    );
  }, [students, studentBalances, schoolFees]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success text-success-foreground">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-warning text-warning-foreground">Partial</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {classSummaries.map((classSummary) => (
        <Card key={classSummary.className} className="shadow-soft border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                {classSummary.className}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                {classSummary.totalStudents} students
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Class Financial Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <DollarSign className="w-3 h-3" />
                  Expected
                </div>
                <div className="text-lg font-bold">{formatCurrency(classSummary.totalExpected)}</div>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-success mb-1">
                  <TrendingUp className="w-3 h-3" />
                  Collected
                </div>
                <div className="text-lg font-bold text-success">{formatCurrency(classSummary.totalCollected)}</div>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-destructive mb-1">
                  <AlertCircle className="w-3 h-3" />
                  Outstanding
                </div>
                <div className="text-lg font-bold text-destructive">{formatCurrency(classSummary.totalOutstanding)}</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <div className="flex gap-1 text-xs font-medium">
                  <span className="text-success">{classSummary.paidCount}P</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-warning">{classSummary.partialCount}Pa</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-destructive">{classSummary.overdueCount}O</span>
                </div>
              </div>
            </div>

            {/* Student List */}
            <ScrollArea className="h-[200px] rounded-md border border-border/50">
              <div className="p-3 space-y-2">
                {classSummary.students.length > 0 ? (
                  classSummary.students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{student.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(student.status)}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(student.amountPaid)} / {formatCurrency(student.totalFees)}
                        </div>
                        <div className="text-sm font-bold text-destructive mt-1">
                          {formatCurrency(student.balance)} left
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    No students in this class
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}

      {classSummaries.length === 0 && (
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-8 text-center text-muted-foreground">
            No student balances to display. Add students and set school fees to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
}