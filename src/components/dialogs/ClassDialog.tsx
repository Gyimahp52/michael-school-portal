import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createClass, updateClass, getAllSubjects, Class, Subject } from "@/lib/database-operations";
import { getAllUsers, type User } from "@/lib/custom-auth";
import { Loader2 } from "lucide-react";

interface ClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classItem?: Class | null;
  mode: "create" | "edit";
}

export function ClassDialog({ open, onOpenChange, classItem, mode }: ClassDialogProps) {
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    className: "",
    teacherIds: [] as string[],
    room: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [subjectsData, users] = await Promise.all([
          getAllSubjects(),
          getAllUsers()
        ]);
        setSubjects(subjectsData);
        setTeachers(users.filter(u => u.role === 'teacher'));
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  useEffect(() => {
    if (classItem && mode === "edit") {
      setFormData({
        className: classItem.className,
        teacherIds: classItem.teacherIds || [],
        room: classItem.room || "",
      });
    } else if (mode === "create") {
      setFormData({
        className: "",
        teacherIds: [],
        room: "",
      });
    }
  }, [classItem, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "create") {
        await createClass(formData);
        toast({
          title: "Success",
          description: "Class created successfully",
        });
      } else if (mode === "edit" && classItem?.id) {
        await updateClass(classItem.id, formData);
        toast({
          title: "Success", 
          description: "Class updated successfully",
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${mode} class`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTeacherChange = (teacherId: string) => {
    setFormData(prev => ({
      ...prev,
      teacherIds: prev.teacherIds.includes(teacherId) 
        ? prev.teacherIds.filter(id => id !== teacherId)
        : [...prev.teacherIds, teacherId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Class" : "Edit Class"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="className">Class Name *</Label>
              <Input
                id="className"
                value={formData.className}
                onChange={(e) => handleChange("className", e.target.value)}
                placeholder="e.g., Grade 7-A"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Room</Label>
              <Input
                id="room"
                value={formData.room}
                onChange={(e) => handleChange("room", e.target.value)}
                placeholder="e.g., Room 101"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignTeacher">Assign Teacher</Label>
            <Select
              value={formData.teacherIds[0] || ""}
              onValueChange={(value) => handleChange("teacherIds", value ? [value] : [])}
            >
              <SelectTrigger id="assignTeacher">
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.displayName || teacher.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Choose one teacher to assign to this class.</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "create" ? "Create Class" : "Update Class"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}