import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createStudent, updateStudent, Student } from "@/lib/database-operations";
import { Loader2 } from "lucide-react";

interface StudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  mode: "create" | "edit";
}

export function StudentDialog({ open, onOpenChange, student, mode }: StudentDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    grade: "",
    parentName: "",
    parentPhone: "",
    parentWhatsApp: "",
    parentEmail: "",
    address: "",
    enrollmentDate: new Date().toISOString().split('T')[0],
    status: "active" as "active" | "inactive" | "graduated",
    photoUrl: "",
  });

  useEffect(() => {
    if (student && mode === "edit") {
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        dateOfBirth: student.dateOfBirth,
        grade: student.grade,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        parentWhatsApp: student.parentWhatsApp || "",
        parentEmail: student.parentEmail,
        address: student.address,
        enrollmentDate: student.enrollmentDate,
        status: student.status,
        photoUrl: student.photoUrl || "",
      });
    } else if (mode === "create") {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        grade: "",
        parentName: "",
        parentPhone: "",
        parentWhatsApp: "",
        parentEmail: "",
        address: "",
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: "active" as "active" | "inactive" | "graduated",
        photoUrl: "",
      });
    }
  }, [student, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "create") {
        await createStudent(formData);
        toast({
          title: "Success",
          description: "Student created successfully",
        });
      } else if (mode === "edit" && student?.id) {
        await updateStudent(student.id, formData);
        toast({
          title: "Success", 
          description: "Student updated successfully",
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${mode} student`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Student" : "Edit Student"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="photoUrl">Student Photo URL (Optional)</Label>
            <Input
              id="photoUrl"
              value={formData.photoUrl}
              onChange={(e) => handleChange("photoUrl", e.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade *</Label>
              <Select value={formData.grade} onValueChange={(value) => handleChange("grade", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Grade 7</SelectItem>
                  <SelectItem value="8">Grade 8</SelectItem>
                  <SelectItem value="9">Grade 9</SelectItem>
                  <SelectItem value="10">Grade 10</SelectItem>
                  <SelectItem value="11">Grade 11</SelectItem>
                  <SelectItem value="12">Grade 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent/Guardian Name *</Label>
              <Input
                id="parentName"
                value={formData.parentName}
                onChange={(e) => handleChange("parentName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentPhone">Parent/Guardian Phone</Label>
              <Input
                id="parentPhone"
                value={formData.parentPhone}
                onChange={(e) => handleChange("parentPhone", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentWhatsApp">Parent/Guardian WhatsApp Number *</Label>
            <Input
              id="parentWhatsApp"
              value={formData.parentWhatsApp}
              onChange={(e) => handleChange("parentWhatsApp", e.target.value)}
              placeholder="+233XXXXXXXXX"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentEmail">Parent/Guardian Email</Label>
            <Input
              id="parentEmail"
              type="email"
              value={formData.parentEmail}
              onChange={(e) => handleChange("parentEmail", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="enrollmentDate">Enrollment Date *</Label>
              <Input
                id="enrollmentDate"
                type="date"
                value={formData.enrollmentDate}
                onChange={(e) => handleChange("enrollmentDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "create" ? "Create Student" : "Update Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}