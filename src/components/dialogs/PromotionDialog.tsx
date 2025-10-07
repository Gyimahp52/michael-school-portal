import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Student, Class, createPromotionRequest, PromotionDecision } from '@/lib/database-operations';
import { useAuth } from '@/contexts/CustomAuthContext';
import { Loader2, ArrowUp, RotateCcw } from 'lucide-react';

interface PromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
  students: Student[];
  availableClasses: Class[];
}

export function PromotionDialog({ 
  open, 
  onOpenChange, 
  classId, 
  className, 
  students,
  availableClasses
}: PromotionDialogProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, { decision: 'promote' | 'repeat', targetClass?: string, comment: string }>>({});
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // Initialize all students as promoted by default
    if (students.length > 0 && Object.keys(decisions).length === 0) {
      const initialDecisions: Record<string, { decision: 'promote' | 'repeat', targetClass?: string, comment: string }> = {};
      students.forEach(student => {
        initialDecisions[student.id] = { decision: 'promote', targetClass: undefined, comment: '' };
      });
      setDecisions(initialDecisions);
    }
  }, [students]);

  const handleDecisionChange = (studentId: string, decision: 'promote' | 'repeat') => {
    setDecisions(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], decision }
    }));
  };

  const handleCommentChange = (studentId: string, comment: string) => {
    setDecisions(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], comment }
    }));
  };

  const handleTargetClassChange = (studentId: string, targetClass: string) => {
    setDecisions(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], targetClass }
    }));
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to submit promotion requests",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const promotionDecisions: PromotionDecision[] = students.map(student => ({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        currentClass: student.className,
        decision: decisions[student.id]?.decision || 'promote',
        targetClass: decisions[student.id]?.targetClass,
        comment: decisions[student.id]?.comment || '',
      }));

      await createPromotionRequest({
        teacherId: currentUser.id,
        teacherName: currentUser.displayName,
        classId,
        className,
        academicYear: `${currentYear}/${currentYear + 1}`,
        decisions: promotionDecisions,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "Promotion request submitted successfully. Waiting for admin approval.",
      });

      onOpenChange(false);
      setDecisions({});
    } catch (error) {
      console.error('Error submitting promotion request:', error);
      toast({
        title: "Error",
        description: "Failed to submit promotion request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const promotedCount = Object.values(decisions).filter(d => d.decision === 'promote').length;
  const repeatingCount = Object.values(decisions).filter(d => d.decision === 'repeat').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Promotion - {className}</DialogTitle>
          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <ArrowUp className="w-4 h-4 text-green-600" />
              Promoting: {promotedCount}
            </span>
            <span className="flex items-center gap-1">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              Repeating: {repeatingCount}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No students found in this class
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
                <div key={student.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {student.firstName} {student.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Current Class: {student.className}
                      </p>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`promote-${student.id}`}
                          checked={decisions[student.id]?.decision === 'promote'}
                          onCheckedChange={() => handleDecisionChange(student.id, 'promote')}
                        />
                        <Label 
                          htmlFor={`promote-${student.id}`}
                          className="text-sm font-medium cursor-pointer flex items-center gap-1"
                        >
                          <ArrowUp className="w-4 h-4 text-green-600" />
                          Promote
                        </Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`repeat-${student.id}`}
                          checked={decisions[student.id]?.decision === 'repeat'}
                          onCheckedChange={() => handleDecisionChange(student.id, 'repeat')}
                        />
                        <Label 
                          htmlFor={`repeat-${student.id}`}
                          className="text-sm font-medium cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-4 h-4 text-amber-600" />
                          Repeat
                        </Label>
                      </div>
                    </div>
                  </div>

                  {decisions[student.id]?.decision === 'promote' && (
                    <div className="space-y-2">
                      <Label htmlFor={`target-class-${student.id}`} className="text-sm">
                        Promote to Class <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={decisions[student.id]?.targetClass || ''}
                        onValueChange={(value) => handleTargetClassChange(student.id, value)}
                      >
                        <SelectTrigger id={`target-class-${student.id}`}>
                          <SelectValue placeholder="Select target class" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableClasses.map((cls) => (
                            <SelectItem key={cls.id} value={cls.className}>
                              {cls.className}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`comment-${student.id}`} className="text-sm">
                      Comments (optional)
                    </Label>
                    <Textarea
                      id={`comment-${student.id}`}
                      placeholder="Add comments about student's performance..."
                      value={decisions[student.id]?.comment || ''}
                      onChange={(e) => handleCommentChange(student.id, e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || students.length === 0}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit for Admin Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
