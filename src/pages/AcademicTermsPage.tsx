import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/HybridAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Plus, 
  Edit2, 
  CheckCircle2,
  XCircle,
  Clock,
  GraduationCap
} from "lucide-react";
import { 
  AcademicYear, 
  Term,
  subscribeToAcademicYears,
  subscribeToTerms,
  createAcademicYear,
  createTerm,
  updateAcademicYear,
  updateTerm
} from "@/lib/database-operations";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AcademicTermsPage() {
  const { userRole } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [showYearDialog, setShowYearDialog] = useState(false);
  const [showTermDialog, setShowTermDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Restrict access to admin only
  if (userRole === 'accountant' || userRole === 'teacher') {
    return <Navigate to={`/${userRole}`} replace />;
  }

  // Year form state
  const [yearName, setYearName] = useState("");
  const [yearStartDate, setYearStartDate] = useState("");
  const [yearEndDate, setYearEndDate] = useState("");

  // Term form state
  const [selectedYearId, setSelectedYearId] = useState("");
  const [termName, setTermName] = useState<"First Term" | "Second Term" | "Third Term">("First Term");
  const [termStartDate, setTermStartDate] = useState("");
  const [termEndDate, setTermEndDate] = useState("");
  const [termStatus, setTermStatus] = useState<"active" | "upcoming" | "completed">("upcoming");

  useEffect(() => {
    const unsubYears = subscribeToAcademicYears(setAcademicYears);
    const unsubTerms = subscribeToTerms(setTerms);
    return () => {
      unsubYears();
      unsubTerms();
    };
  }, []);

  const handleCreateYear = async () => {
    if (!yearName || !yearStartDate || !yearEndDate) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await createAcademicYear({
        name: yearName,
        startDate: yearStartDate,
        endDate: yearEndDate,
        status: 'active'
      });

      toast({
        title: "Success",
        description: "Academic year created successfully",
      });

      // Reset form
      setYearName("");
      setYearStartDate("");
      setYearEndDate("");
      setShowYearDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create academic year",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTerm = async () => {
    if (!selectedYearId || !termStartDate || !termEndDate) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    const selectedYear = academicYears.find(y => y.id === selectedYearId);
    if (!selectedYear) return;

    setLoading(true);
    try {
      await createTerm({
        academicYearId: selectedYearId,
        academicYearName: selectedYear.name,
        name: termName,
        startDate: termStartDate,
        endDate: termEndDate,
        status: termStatus,
        isCurrentTerm: false
      });

      toast({
        title: "Success",
        description: "Term created successfully",
      });

      // Reset form
      setSelectedYearId("");
      setTermStartDate("");
      setTermEndDate("");
      setShowTermDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create term",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetCurrentTerm = async (termId: string) => {
    try {
      await updateTerm(termId, { isCurrentTerm: true, status: 'active' });
      toast({
        title: "Success",
        description: "Current term updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update current term",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTermStatus = async (termId: string, status: "active" | "upcoming" | "completed") => {
    try {
      await updateTerm(termId, { status });
      toast({
        title: "Success",
        description: "Term status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update term status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string, isCurrentTerm?: boolean) => {
    if (isCurrentTerm) {
      return <Badge className="bg-gradient-primary text-white">Current Term</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-white">Active</Badge>;
      case 'upcoming':
        return <Badge className="bg-warning text-white">Upcoming</Badge>;
      case 'completed':
        return <Badge className="bg-muted text-muted-foreground">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-8 h-8" />
            Academic Terms Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage academic years and terms for the school
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Dialog open={showYearDialog} onOpenChange={setShowYearDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Academic Year
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Academic Year</DialogTitle>
              <DialogDescription>Add a new academic year to the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="yearName">Academic Year Name</Label>
                <Input
                  id="yearName"
                  placeholder="e.g., 2025/2026"
                  value={yearName}
                  onChange={(e) => setYearName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="yearStart">Start Date</Label>
                <Input
                  id="yearStart"
                  type="date"
                  value={yearStartDate}
                  onChange={(e) => setYearStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="yearEnd">End Date</Label>
                <Input
                  id="yearEnd"
                  type="date"
                  value={yearEndDate}
                  onChange={(e) => setYearEndDate(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleCreateYear} 
                className="w-full bg-gradient-primary"
                disabled={loading}
              >
                Create Academic Year
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showTermDialog} onOpenChange={setShowTermDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              New Term
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Term</DialogTitle>
              <DialogDescription>Add a new term to an academic year</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="yearSelect">Select Academic Year</Label>
                <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears
                      .filter(y => y.status === 'active')
                      .map(year => (
                        <SelectItem key={year.id} value={year.id!}>
                          {year.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="termName">Term Name</Label>
                <Select value={termName} onValueChange={(v) => setTermName(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Term">First Term</SelectItem>
                    <SelectItem value="Second Term">Second Term</SelectItem>
                    <SelectItem value="Third Term">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="termStart">Start Date</Label>
                <Input
                  id="termStart"
                  type="date"
                  value={termStartDate}
                  onChange={(e) => setTermStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="termEnd">End Date</Label>
                <Input
                  id="termEnd"
                  type="date"
                  value={termEndDate}
                  onChange={(e) => setTermEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="termStatus">Status</Label>
                <Select value={termStatus} onValueChange={(v) => setTermStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCreateTerm} 
                className="w-full bg-gradient-primary"
                disabled={loading}
              >
                Create Term
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Academic Years List */}
      <div className="space-y-4">
        {academicYears.map(year => {
          const yearTerms = terms.filter(t => t.academicYearId === year.id);
          
          return (
            <Card key={year.id} className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{year.name}</CardTitle>
                    <CardDescription>
                      {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={year.status === 'active' ? 'default' : 'outline'}>
                    {year.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {yearTerms.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No terms created for this academic year
                  </p>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {yearTerms.map(term => (
                      <Card key={term.id} className={cn(
                        "border",
                        term.isCurrentTerm && "border-primary shadow-medium"
                      )}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{term.name}</CardTitle>
                            {getStatusBadge(term.status, term.isCurrentTerm)}
                          </div>
                          <CardDescription className="text-sm">
                            {new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {!term.isCurrentTerm && term.status !== 'completed' && (
                            <Button 
                              size="sm" 
                              className="w-full bg-gradient-primary"
                              onClick={() => handleSetCurrentTerm(term.id!)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Set as Current
                            </Button>
                          )}
                          <div className="flex gap-2">
                            {term.status !== 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleUpdateTermStatus(term.id!, 'active')}
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                Activate
                              </Button>
                            )}
                            {term.status !== 'completed' && !term.isCurrentTerm && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleUpdateTermStatus(term.id!, 'completed')}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {academicYears.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                No academic years created yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "New Academic Year" to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
