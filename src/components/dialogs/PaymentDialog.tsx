import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Student, 
  StudentBalance,
  SchoolFees,
  subscribeToStudents,
  subscribeToStudentBalances,
  subscribeToSchoolFees,
  updateStudentBalance,
  createStudentBalance,
  createInvoice
} from "@/lib/database-operations";
import { DollarSign, Loader2 } from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDialog({ open, onOpenChange }: PaymentDialogProps) {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [studentBalances, setStudentBalances] = useState<StudentBalance[]>([]);
  const [schoolFees, setSchoolFees] = useState<SchoolFees[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubStudents = subscribeToStudents(setStudents);
    const unsubBalances = subscribeToStudentBalances(setStudentBalances);
    const unsubFees = subscribeToSchoolFees(setSchoolFees);

    return () => {
      unsubStudents();
      unsubBalances();
      unsubFees();
    };
  }, []);

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const studentBalance = studentBalances.find(b => b.studentId === selectedStudentId);
  const studentFees = schoolFees.find(f => f.className === selectedStudent?.className);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudentId || !paymentAmount) {
      toast({
        title: "Error",
        description: "Please select a student and enter payment amount",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // If student balance doesn't exist, create it first
      if (!studentBalance && selectedStudent && studentFees) {
        await createStudentBalance({
          studentId: selectedStudent.id!,
          studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
          className: selectedStudent.className,
          totalFees: studentFees.totalFees,
          amountPaid: 0,
          balance: studentFees.totalFees,
          status: 'overdue'
        });
      }

      // Update student balance with payment
      await updateStudentBalance(selectedStudentId, amount);

      // Create invoice record
      await createInvoice({
        studentId: selectedStudentId,
        studentName: `${selectedStudent?.firstName} ${selectedStudent?.lastName}`,
        description: `School Fees Payment - ${paymentMethod.toUpperCase()}`,
        amount: amount,
        dueDate: new Date().toISOString().split('T')[0],
        status: "Paid",
        paymentDate: new Date().toISOString().split('T')[0],
      });

      toast({
        title: "Success",
        description: `Payment of ₵${amount.toLocaleString()} recorded successfully`,
      });

      // Reset form
      setSelectedStudentId("");
      setPaymentAmount("");
      setPaymentMethod("cash");
      onOpenChange(false);
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-success/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            Record Payment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Select Student</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {students
                  .filter(s => s.status === 'active')
                  .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
                  .map((student) => (
                    <SelectItem key={student.id} value={student.id!}>
                      {student.firstName} {student.lastName} - {student.className}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStudent && (
            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Class:</span>
                <span className="font-medium">{selectedStudent.className}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Fees:</span>
                <span className="font-medium">₵{(studentBalance?.totalFees || studentFees?.totalFees || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-medium text-success">₵{(studentBalance?.amountPaid || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground font-medium">Balance:</span>
                <span className="font-bold text-destructive">₵{(studentBalance?.balance || studentFees?.totalFees || 0).toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (₵)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mobile">Mobile Money</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Record Payment"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}