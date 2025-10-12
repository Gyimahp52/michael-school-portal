import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createStudent, updateStudent, upsertStudent, Student, subscribeToStudents, subscribeToClasses, type Class } from "@/lib/database-operations";
import { ref, get } from 'firebase/database';
import { rtdb } from "@/firebase";


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
  const [classesFromDb, setClassesFromDb] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    className: "",
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
    const unsubStudents = subscribeToStudents(setExistingStudents);
    const unsubClasses = subscribeToClasses(setClassesFromDb);
    return () => { unsubStudents(); unsubClasses(); };
  }, []);

  useEffect(() => {
    if (student && mode === "edit") {
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        dateOfBirth: student.dateOfBirth,
        className: student.className,
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
      setGeneratedCode(student.studentCode || "");
    } else if (mode === "create") {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        className: "",
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
      setGeneratedCode("");
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
      const withTimeout = async <T,>(p: Promise<T>, ms = 90000): Promise<T> => {
        return await Promise.race([
          p,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timed out. Please check your internet connection and try again.')), ms))
        ]) as T;
      };

      // Helper: lightweight client-side compression to speed up uploads
      const compressImage = (file: File, maxSize = 800): Promise<Blob> => new Promise((resolve) => {
        try {
          const img = new Image();
          img.onload = () => {
            const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(file); return; }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.7);
          };
          img.onerror = () => resolve(file);
          const reader = new FileReader();
          reader.onload = ev => { img.src = String(ev.target?.result || ''); };
          reader.readAsDataURL(file);
        } catch {
          resolve(file);
        }
      });

      const uploadPhotoAndGetUrl = async (proposedId: string) => {
        if (!photoFile) return '';
        const MAX_BYTES = 10 * 1024 * 1024; // 10MB
        if (photoFile.size > MAX_BYTES) {
          throw new Error('Image too large. Please select a file under 10MB.');
        }
        const blob = await compressImage(photoFile);
        const dataUrl: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Failed to read image'));
          reader.readAsDataURL(blob);
        });
        return dataUrl;
      };

      if (mode === "create") {
        let photoUrl = '';
        if (photoFile) {
          try {
            // Use a temporary name based on names; final ID not known yet
            photoUrl = await uploadPhotoAndGetUrl(`${formData.firstName}-${formData.lastName}`);
            console.log('✅ Photo uploaded successfully, URL:', photoUrl);
          } catch (uploadErr: any) {
            console.error('❌ Photo upload failed:', uploadErr);
            toast({ title: 'Photo upload failed', description: uploadErr?.message || 'Unable to upload image', variant: 'destructive' });
            // Abort create if user selected a photo but upload failed
            throw uploadErr;
          }
        }
        const studentData = { ...formData, photoUrl };
        console.log('📝 Creating student with data:', { ...studentData, photoUrl: photoUrl || '(no photo)' });
        const newStudentId = await withTimeout(createStudent(studentData));
        console.log('✅ Student created successfully with ID:', newStudentId);
        
        // Fetch the generated code to display it
        const studentsRef = ref(rtdb, `students/${newStudentId}`);
        const snapshot = await get(studentsRef);
        const newCode = snapshot.exists() ? snapshot.val().studentCode : '';
        setGeneratedCode(newCode || "");
        
        toast({ 
          title: "Student created successfully", 
          description: newCode ? `Student code: ${newCode}` : undefined
        });
        
        // Keep dialog open briefly to show the generated code
        setTimeout(() => {
          onOpenChange(false);
        }, 3000);
      } else if (student?.id) {
        let updates = { ...formData } as typeof formData;
        if (photoFile) {
          try {
            const photoUrl = await uploadPhotoAndGetUrl(student.id);
            console.log('✅ Photo uploaded successfully for edit, URL:', photoUrl);
            updates = { ...updates, photoUrl };
          } catch (uploadErr: any) {
            console.error('❌ Photo upload failed during edit:', uploadErr);
            toast({ title: 'Photo upload failed', description: uploadErr?.message || 'Unable to upload image', variant: 'destructive' });
          }
        }
        console.log('📝 Updating student with data:', { ...updates, photoUrl: updates.photoUrl || '(unchanged)' });
        await withTimeout(upsertStudent(student.id, updates));
        console.log('✅ Student updated successfully');
        toast({ title: "Student updated" });
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error('Student save failed:', error);
      toast({ title: "Error", description: error?.message || String(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Class options come directly from classes table

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Student" : "Edit Student"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Code Display */}
          {generatedCode && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <Label className="text-sm font-medium text-muted-foreground">Student Code</Label>
              <p className="text-2xl font-bold text-primary mt-1">{generatedCode}</p>
              <p className="text-xs text-muted-foreground mt-1">
                This code is permanent and will be used throughout the student's time at the school
              </p>
            </div>
          )}

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
              <Label htmlFor="className">Class *</Label>
              <Select value={formData.className} onValueChange={(value) => handleChange("className", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classesFromDb.map(c => (
                    <SelectItem key={c.id} value={c.className}>
                      {c.className}
                    </SelectItem>
                  ))}
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