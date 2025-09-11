import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createStudent, updateStudent, Student, subscribeToStudents } from "@/lib/database-operations";
import { Loader2, Upload, User } from "lucide-react";

interface StudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student;
  mode: "create" | "edit";
}

export function StudentDialog({ open, onOpenChange, student, mode }: StudentDialogProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const { toast } = useToast();
  const [existingStudents, setExistingStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
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
    const unsub = subscribeToStudents(setExistingStudents);
    return () => unsub();
  }, []);

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
      setPhotoPreview(student.photoUrl || "");
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
      setPhotoFile(null);
      setPhotoPreview("");
    }
  }, [student, mode, open]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(String(ev.target?.result || ""));
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview("");
    }
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (mode === "create") {
        await createStudent({ ...formData });
        toast({ title: "Student created" });
      } else if (student?.id) {
        await updateStudent(student.id, { ...formData });
        toast({ title: "Student updated" });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || String(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const uniqueGrades = Array.from(new Set(existingStudents.map(s => s.grade))).sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Student" : "Edit Student"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>Student Photo (Optional)</Label>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {photoPreview ? (
                  <img 
                    src={photoPreview} 
                    alt="Student preview" 
                    className="w-20 h-20 object-cover rounded-lg border-2 border-border"
                  />
                ) : (
                  <div className="w-20 h-20 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted/50 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Upload Photo</span>
                  </div>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, GIF up to 10MB
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="e.g., Michael"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="e.g., Agyei"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="student@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="e.g., +233 20 123 4567"
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
                  {uniqueGrades.length === 0 ? (
                    <SelectItem value="7">Grade 7</SelectItem>
                  ) : (
                    uniqueGrades.map(g => (
                      <SelectItem key={g} value={g}>{`Grade ${g}`}</SelectItem>
                    ))
                  )}
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
                placeholder="e.g., Sarah Owusu"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentPhone">Parent/Guardian Phone *</Label>
              <Input
                id="parentPhone"
                value={formData.parentPhone}
                onChange={(e) => handleChange("parentPhone", e.target.value)}
                placeholder="e.g., +233 24 987 6543"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parentWhatsApp">Parent WhatsApp</Label>
              <Input
                id="parentWhatsApp"
                value={formData.parentWhatsApp}
                onChange={(e) => handleChange("parentWhatsApp", e.target.value)}
                placeholder="Optional WhatsApp number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentEmail">Parent Email</Label>
              <Input
                id="parentEmail"
                type="email"
                value={formData.parentEmail}
                onChange={(e) => handleChange("parentEmail", e.target.value)}
                placeholder="parent@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Residential address"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>) : (mode === "create" ? "Create Student" : "Save Changes")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}