import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  subscribeToSchoolFees,
  createSchoolFees,
  updateSchoolFees,
  SchoolFees,
  subscribeToClasses,
  Class,
  subscribeToStudents,
  Student,
  Term
} from "@/lib/database-operations";
import { TermSelector } from "@/components/shared/TermSelector";
import {
  DollarSign,
  Plus,
  Edit,
  Save,
  X,
  Calculator,
  GraduationCap,
  BookOpen,
  Trophy,
  FileText,
  Loader2
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function SchoolFeesPage() {
  const [schoolFees, setSchoolFees] = useState<SchoolFees[]>([]);
  const [classesFromDb, setClassesFromDb] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFees, setEditingFees] = useState<SchoolFees | null>(null);
  const [formData, setFormData] = useState({
    className: "",
    tuitionFees: "",
    examFees: "",
    activityFees: "",
    otherFees: "",
    academicYear: new Date().getFullYear().toString(),
    termId: "",
    termName: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeFees = subscribeToSchoolFees((feesData) => {
      setSchoolFees(feesData);
      setLoading(false);
    });
    
    const unsubscribeClasses = subscribeToClasses(setClassesFromDb);
    const unsubscribeStudents = subscribeToStudents(setStudents);

    return () => {
      unsubscribeFees();
      unsubscribeClasses();
      unsubscribeStudents();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.className || !formData.tuitionFees || !formData.examFees || !formData.activityFees || !formData.otherFees || !formData.termId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including term",
        variant: "destructive",
      });
      return;
    }

    try {
      const tuition = parseFloat(formData.tuitionFees);
      const exam = parseFloat(formData.examFees);
      const activity = parseFloat(formData.activityFees);
      const other = parseFloat(formData.otherFees);
      
      const feesData = {
        className: formData.className,
        tuitionFees: tuition,
        examFees: exam,
        activityFees: activity,
        otherFees: other,
        totalFees: tuition + exam + activity + other,
        academicYear: formData.academicYear,
        termId: formData.termId,
        termName: formData.termName
      };

      if (editingFees) {
        await updateSchoolFees(editingFees.id!, feesData);
        toast({
          title: "Success",
          description: `School fees updated for Class ${formData.className}`,
        });
      } else {
        await createSchoolFees(feesData);
        toast({
          title: "Success",
          description: `School fees created for Class ${formData.className}`,
        });
      }

      // Reset form
      setFormData({
        className: "",
        tuitionFees: "",
        examFees: "",
        activityFees: "",
        otherFees: "",
        academicYear: new Date().getFullYear().toString(),
        termId: "",
        termName: ""
      });
      setDialogOpen(false);
      setEditingFees(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save school fees",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (fees: SchoolFees) => {
    setEditingFees(fees);
    setFormData({
      className: fees.className,
      tuitionFees: fees.tuitionFees.toString(),
      examFees: fees.examFees.toString(),
      activityFees: fees.activityFees.toString(),
      otherFees: fees.otherFees.toString(),
      academicYear: fees.academicYear,
      termId: fees.termId || "",
      termName: fees.termName || ""
    });
    setDialogOpen(true);
  };

  const handleCancel = () => {
    setFormData({
      className: "",
      tuitionFees: "",
      examFees: "",
      activityFees: "",
      otherFees: "",
      academicYear: new Date().getFullYear().toString(),
      termId: "",
      termName: ""
    });
    setDialogOpen(false);
    setEditingFees(null);
  };

  // Classes now fetched from database via subscribeToClasses
  
  // Calculate total expected revenue based on students in each class
  const totalExpectedRevenue = useMemo(() => {
    return schoolFees.reduce((sum, fees) => {
      const studentsInClass = students.filter(s => s.className === fees.className).length;
      return sum + (fees.totalFees * studentsInClass);
    }, 0);
  }, [schoolFees, students]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading school fees...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">School Fees Management</h1>
          <p className="text-muted-foreground mt-2">
            Set and manage school fees for all classes by term.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4" />
              Set School Fees
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingFees ? `Edit School Fees - Class ${editingFees.className}` : "Set School Fees"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Term *</Label>
                <TermSelector
                  value={formData.termId}
                  onChange={(termId, term) => {
                    setFormData({
                      ...formData, 
                      termId: termId || "",
                      termName: term?.name || ""
                    });
                  }}
                  label=""
                  showAllOption={false}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="className">Class *</Label>
                  <Select 
                    value={formData.className} 
                    onValueChange={(value) => setFormData({...formData, className: value})}
                    disabled={!!editingFees}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classesFromDb.map(cls => (
                        <SelectItem key={cls.id} value={cls.className}>
                          {cls.className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                    placeholder="2024"
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tuitionFees">Tuition Fees (GHS)</Label>
                  <Input
                    id="tuitionFees"
                    type="number"
                    step="0.01"
                    value={formData.tuitionFees}
                    onChange={(e) => setFormData({...formData, tuitionFees: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examFees">Exam Fees (GHS)</Label>
                  <Input
                    id="examFees"
                    type="number"
                    step="0.01"
                    value={formData.examFees}
                    onChange={(e) => setFormData({...formData, examFees: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="activityFees">Activity Fees (GHS)</Label>
                  <Input
                    id="activityFees"
                    type="number"
                    step="0.01"
                    value={formData.activityFees}
                    onChange={(e) => setFormData({...formData, activityFees: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherFees">Other Fees (GHS)</Label>
                  <Input
                    id="otherFees"
                    type="number"
                    step="0.01"
                    value={formData.otherFees}
                    onChange={(e) => setFormData({...formData, otherFees: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Total Preview */}
              {formData.tuitionFees && formData.examFees && formData.activityFees && formData.otherFees && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Calculator className="w-4 h-4" />
                    Total Fees: {formatCurrency(
                      parseFloat(formData.tuitionFees || "0") +
                      parseFloat(formData.examFees || "0") +
                      parseFloat(formData.activityFees || "0") +
                      parseFloat(formData.otherFees || "0")
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingFees ? "Update Fees" : "Set Fees"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
                <h3 className="text-2xl font-bold mt-1">{schoolFees.length}</h3>
                <p className="text-xs text-muted-foreground mt-1">Classes with fees set</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expected Revenue</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalExpectedRevenue)}</h3>
                <p className="text-xs text-muted-foreground mt-1">Total with all students</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Fees</p>
                <h3 className="text-2xl font-bold mt-1">
                  {schoolFees.length > 0 ? formatCurrency(schoolFees.reduce((sum, f) => sum + f.totalFees, 0) / schoolFees.length) : formatCurrency(0)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Per class</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calculator className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Academic Year</p>
                <h3 className="text-2xl font-bold mt-1">
                  {schoolFees.length > 0 ? schoolFees[0].academicYear : new Date().getFullYear()}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Current year</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Fees Table */}
      <Card className="shadow-soft border-border/50">
        <CardHeader>
          <CardTitle>School Fees by Class</CardTitle>
        </CardHeader>
        <CardContent>
          {schoolFees.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No School Fees Set</h3>
              <p className="text-muted-foreground mb-4">Set school fees for each class to get started.</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Set School Fees
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {schoolFees.map((fees) => {
                const studentsInClass = students.filter(s => s.className === fees.className).length;
                const expectedRevenue = fees.totalFees * studentsInClass;
                
                return (
                  <Card key={fees.id} className="shadow-sm border-border/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <GraduationCap className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">Class {fees.className}</h4>
                            <p className="text-sm text-muted-foreground">
                              {fees.termName} • Academic Year {fees.academicYear} • {studentsInClass} students
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Tuition</p>
                                <p className="font-medium">{formatCurrency(fees.tuitionFees)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Exam</p>
                                <p className="font-medium">{formatCurrency(fees.examFees)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Activity</p>
                                <p className="font-medium">{formatCurrency(fees.activityFees)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Other</p>
                                <p className="font-medium">{formatCurrency(fees.otherFees)}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total per student</p>
                            <p className="text-xl font-bold text-primary">{formatCurrency(fees.totalFees)}</p>
                            <p className="text-xs text-muted-foreground">Expected: {formatCurrency(expectedRevenue)}</p>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(fees)}
                            className="gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
