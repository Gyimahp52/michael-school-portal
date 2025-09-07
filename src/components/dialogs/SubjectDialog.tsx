import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createSubject, updateSubject, Subject } from "@/lib/database-operations";
import { Loader2 } from "lucide-react";

interface SubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: Subject | null;
  mode: "create" | "edit";
}

export function SubjectDialog({ open, onOpenChange, subject, mode }: SubjectDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    category: "core" as "core" | "elective" | "extracurricular",
    credits: 1,
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    if (subject && mode === "edit") {
      setFormData({
        name: subject.name,
        code: subject.code || "",
        description: subject.description || "",
        category: subject.category || "core",
        credits: subject.credits || 1,
        status: subject.status || "active",
      });
    } else if (mode === "create") {
      setFormData({
        name: "",
        code: "",
        description: "",
        category: "core",
        credits: 1,
        status: "active",
      });
    }
  }, [subject, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "create") {
        await createSubject(formData);
        toast({
          title: "Success",
          description: "Subject created successfully",
        });
      } else if (mode === "edit" && subject?.id) {
        await updateSubject(subject.id, formData);
        toast({
          title: "Success", 
          description: "Subject updated successfully",
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${mode} subject`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Subject" : "Edit Subject"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Mathematics"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Subject Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                placeholder="e.g., MATH101"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Brief description of the subject..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core Subject</SelectItem>
                  <SelectItem value="elective">Elective</SelectItem>
                  <SelectItem value="extracurricular">Extracurricular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                value={formData.credits}
                onChange={(e) => handleChange("credits", parseInt(e.target.value))}
                min="1"
                max="10"
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

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "create" ? "Create Subject" : "Update Subject"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}