import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createClass, updateClass, getAllSubjects, getAllTeachers, Class, Subject, Teacher } from "@/lib/database-operations";
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
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    className: "",
    subjectId: "",
    teacherId: "",
    room: "",
    capacity: 30,
    schedule: {
      monday: "",
      tuesday: "",
      wednesday: "",
      thursday: "",
      friday: "",
    },
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [subjectsData, teachersData] = await Promise.all([
          getAllSubjects(),
          getAllTeachers()
        ]);
        setSubjects(subjectsData);
        setTeachers(teachersData);
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
        subjectId: classItem.subjectId,
        teacherId: classItem.teacherId || "",
        room: classItem.room || "",
        capacity: classItem.capacity || 30,
        schedule: {
          monday: classItem.schedule?.monday || "",
          tuesday: classItem.schedule?.tuesday || "",
          wednesday: classItem.schedule?.wednesday || "",
          thursday: classItem.schedule?.thursday || "",
          friday: classItem.schedule?.friday || "",
        },
        status: classItem.status || "active",
      });
    } else if (mode === "create") {
      setFormData({
        className: "",
        subjectId: "",
        teacherId: "",
        room: "",
        capacity: 30,
        schedule: {
          monday: "",
          tuesday: "",
          wednesday: "",
          thursday: "",
          friday: "",
        },
        status: "active",
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

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScheduleChange = (day: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: { ...prev.schedule, [day]: value }
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subjectId">Subject *</Label>
              <Select value={formData.subjectId} onValueChange={(value) => handleChange("subjectId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id!}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacherId">Assigned Teacher</Label>
              <Select value={formData.teacherId} onValueChange={(value) => handleChange("teacherId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id!}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => handleChange("capacity", parseInt(e.target.value))}
                min="1"
                max="50"
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
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Weekly Schedule (Optional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monday">Monday</Label>
                <Input
                  id="monday"
                  value={formData.schedule.monday}
                  onChange={(e) => handleScheduleChange("monday", e.target.value)}
                  placeholder="e.g., 9:00 AM - 10:00 AM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tuesday">Tuesday</Label>
                <Input
                  id="tuesday"
                  value={formData.schedule.tuesday}
                  onChange={(e) => handleScheduleChange("tuesday", e.target.value)}
                  placeholder="e.g., 9:00 AM - 10:00 AM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wednesday">Wednesday</Label>
                <Input
                  id="wednesday"
                  value={formData.schedule.wednesday}
                  onChange={(e) => handleScheduleChange("wednesday", e.target.value)}
                  placeholder="e.g., 9:00 AM - 10:00 AM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thursday">Thursday</Label>
                <Input
                  id="thursday"
                  value={formData.schedule.thursday}
                  onChange={(e) => handleScheduleChange("thursday", e.target.value)}
                  placeholder="e.g., 9:00 AM - 10:00 AM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="friday">Friday</Label>
                <Input
                  id="friday"
                  value={formData.schedule.friday}
                  onChange={(e) => handleScheduleChange("friday", e.target.value)}
                  placeholder="e.g., 9:00 AM - 10:00 AM"
                />
              </div>
            </div>
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