import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/CustomAuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  PromotionRequest,
  Student,
  Class,
  subscribeToPromotionRequests,
  subscribeToStudents,
  subscribeToClasses,
  updatePromotionRequest,
  executePromotion,
  PromotionDecision,
} from '@/lib/database-operations';
import { filterTeacherStudents } from '@/lib/access-control';
import { PromotionDialog } from '@/components/dialogs/PromotionDialog';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowUp, 
  RotateCcw, 
  FileText,
  GraduationCap,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function PromotionsPage() {
  const { currentUser, userRole } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PromotionRequest[]>();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string } | null>(null);
  const [reviewingRequest, setReviewingRequest] = useState<PromotionRequest | null>(null);
  const [adminComments, setAdminComments] = useState('');
  const [modifiedDecisions, setModifiedDecisions] = useState<Record<string, PromotionDecision>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [executingRequest, setExecutingRequest] = useState<PromotionRequest | null>(null);

  useEffect(() => {
    const unsubRequests = subscribeToPromotionRequests(setRequests);
    const unsubStudents = subscribeToStudents(setStudents);
    const unsubClasses = subscribeToClasses(setClasses);

    return () => {
      unsubRequests();
      unsubStudents();
      unsubClasses();
    };
  }, []);

  const myClasses = userRole === 'teacher' 
    ? classes.filter(c => c.teacherIds?.includes(currentUser?.id || ''))
    : classes;

  const filteredStudents = userRole === 'teacher'
    ? filterTeacherStudents(currentUser?.id || '', students, classes)
    : students;

  const teacherRequests = requests?.filter(r => r.teacherId === currentUser?.id) || [];
  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const reviewedRequests = requests?.filter(r => r.status !== 'pending') || [];

  const handleOpenPromotionDialog = (classId: string, className: string) => {
    setSelectedClass({ id: classId, name: className });
    setShowPromotionDialog(true);
  };

  // Get available classes for promotion (all classes)
  const availableClasses = classes.filter(c => c.className);

  const getClassStudents = (className: string) => {
    return filteredStudents.filter(s => s.className === className && s.status === 'active');
  };

  const handleReviewRequest = (request: PromotionRequest) => {
    setReviewingRequest(request);
    const decisionsMap: Record<string, PromotionDecision> = {};
    request.decisions.forEach(d => {
      decisionsMap[d.studentId] = { ...d };
    });
    setModifiedDecisions(decisionsMap);
    setAdminComments('');
  };

  const handleDecisionOverride = (studentId: string, newDecision: 'promote' | 'repeat') => {
    setModifiedDecisions(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], decision: newDecision }
    }));
  };

  const handleApprove = () => {
    if (!reviewingRequest) return;
    setExecutingRequest(reviewingRequest);
    setShowConfirmDialog(true);
  };

  const executeApproval = async () => {
    if (!executingRequest) return;

    try {
      const finalDecisions = Object.values(modifiedDecisions);
      const nextYear = parseInt(executingRequest.academicYear.split('/')[1]);
      
      await executePromotion(
        executingRequest.id,
        finalDecisions,
        `${nextYear}/${nextYear + 1}`
      );

      await updatePromotionRequest(executingRequest.id, {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser?.displayName,
        adminComments,
        decisions: finalDecisions,
      });

      toast({
        title: "Success",
        description: "Student promotions have been executed successfully",
      });

      setReviewingRequest(null);
      setShowConfirmDialog(false);
      setExecutingRequest(null);
    } catch (error) {
      console.error('Error executing promotion:', error);
      toast({
        title: "Error",
        description: "Failed to execute promotions",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!reviewingRequest) return;

    try {
      await updatePromotionRequest(reviewingRequest.id, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser?.displayName,
        adminComments,
      });

      toast({
        title: "Success",
        description: "Promotion request has been rejected",
      });

      setReviewingRequest(null);
    } catch (error) {
      console.error('Error rejecting promotion:', error);
      toast({
        title: "Error",
        description: "Failed to reject promotion request",
        variant: "destructive",
      });
    }
  };

  if (userRole === 'teacher') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Student Promotions</h1>
            <p className="text-muted-foreground">Manage end-of-year student promotions</p>
          </div>
        </div>

        <Tabs defaultValue="classes" className="w-full">
          <TabsList>
            <TabsTrigger value="classes">My Classes</TabsTrigger>
            <TabsTrigger value="requests">
              My Requests
              {teacherRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {teacherRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myClasses.map((classItem) => {
                const classStudents = getClassStudents(classItem.className);
                const hasRequest = teacherRequests.some(r => r.classId === classItem.id);

                return (
                  <Card key={classItem.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5" />
                        {classItem.name || classItem.className}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        {classStudents.length} student{classStudents.length !== 1 ? 's' : ''}
                      </div>
                      
                      {hasRequest ? (
                        <Badge variant="outline" className="w-full justify-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Request Submitted
                        </Badge>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => handleOpenPromotionDialog(classItem.id, classItem.className)}
                          disabled={classStudents.length === 0}
                        >
                          Submit Promotion List
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {teacherRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  No promotion requests submitted yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {teacherRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{request.className}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Submitted {new Date(request.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            request.status === 'approved' ? 'default' :
                            request.status === 'rejected' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {request.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {request.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                          {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-6 text-sm">
                        <span className="flex items-center gap-1">
                          <ArrowUp className="w-4 h-4 text-green-600" />
                          {request.decisions.filter(d => d.decision === 'promote').length} Promoting
                        </span>
                        <span className="flex items-center gap-1">
                          <RotateCcw className="w-4 h-4 text-amber-600" />
                          {request.decisions.filter(d => d.decision === 'repeat').length} Repeating
                        </span>
                      </div>
                      {request.adminComments && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium">Admin Comments:</p>
                          <p className="text-sm text-muted-foreground mt-1">{request.adminComments}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {selectedClass && (
          <PromotionDialog
            open={showPromotionDialog}
            onOpenChange={setShowPromotionDialog}
            classId={selectedClass.id}
            className={selectedClass.name}
            students={getClassStudents(selectedClass.name)}
            availableClasses={availableClasses}
          />
        )}
      </div>
    );
  }

  // Admin View
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promotion Management</h1>
          <p className="text-muted-foreground">Review and approve student promotions</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Approval
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                No pending promotion requests
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{request.className}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          By {request.teacherName} • {new Date(request.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button onClick={() => handleReviewRequest(request)}>
                        Review Request
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-6 text-sm">
                      <span className="flex items-center gap-1">
                        <ArrowUp className="w-4 h-4 text-green-600" />
                        {request.decisions.filter(d => d.decision === 'promote').length} Promoting
                      </span>
                      <span className="flex items-center gap-1">
                        <RotateCcw className="w-4 h-4 text-amber-600" />
                        {request.decisions.filter(d => d.decision === 'repeat').length} Repeating
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          {reviewedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                No reviewed requests yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviewedRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{request.className}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          By {request.teacherName} • Reviewed by {request.reviewedBy}
                        </p>
                      </div>
                      <Badge
                        variant={request.status === 'approved' ? 'default' : 'destructive'}
                      >
                        {request.status === 'approved' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {request.adminComments && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Admin Comments:</p>
                        <p className="text-sm text-muted-foreground mt-1">{request.adminComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      {reviewingRequest && (
        <Dialog open={!!reviewingRequest} onOpenChange={() => setReviewingRequest(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Promotion Request - {reviewingRequest.className}</DialogTitle>
              <DialogDescription>
                Submitted by {reviewingRequest.teacherName} on {new Date(reviewingRequest.submittedAt).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {reviewingRequest.decisions.map((decision) => (
                <div key={decision.studentId} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{decision.studentName}</h4>
                      <p className="text-sm text-muted-foreground">Current: {decision.currentClass}</p>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`admin-promote-${decision.studentId}`}
                          checked={modifiedDecisions[decision.studentId]?.decision === 'promote'}
                          onCheckedChange={() => handleDecisionOverride(decision.studentId, 'promote')}
                        />
                        <Label 
                          htmlFor={`admin-promote-${decision.studentId}`}
                          className="text-sm font-medium cursor-pointer flex items-center gap-1"
                        >
                          <ArrowUp className="w-4 h-4 text-green-600" />
                          Promote
                        </Label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`admin-repeat-${decision.studentId}`}
                          checked={modifiedDecisions[decision.studentId]?.decision === 'repeat'}
                          onCheckedChange={() => handleDecisionOverride(decision.studentId, 'repeat')}
                        />
                        <Label 
                          htmlFor={`admin-repeat-${decision.studentId}`}
                          className="text-sm font-medium cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-4 h-4 text-amber-600" />
                          Repeat
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  {decision.comment && (
                    <div className="text-sm p-2 bg-muted rounded">
                      <span className="font-medium">Teacher's comment:</span> {decision.comment}
                    </div>
                  )}
                </div>
              ))}

              <div className="space-y-2">
                <Label htmlFor="adminComments">Admin Comments (optional)</Label>
                <Textarea
                  id="adminComments"
                  placeholder="Add any comments about this promotion request..."
                  value={adminComments}
                  onChange={(e) => setAdminComments(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setReviewingRequest(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleApprove}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve & Execute
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Confirm Promotion Execution
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to promote these students? This action will:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 text-sm">
            <p className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              Move promoted students to their next class
            </p>
            <p className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              Keep repeating students in their current class
            </p>
            <p className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              Update student records for the new academic year
            </p>
            <p className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              Preserve historical data (attendance, grades, fees)
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={executeApproval}>
              Confirm & Execute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
