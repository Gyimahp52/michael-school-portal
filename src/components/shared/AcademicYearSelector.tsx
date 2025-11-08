import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AcademicYear, subscribeToAcademicYears } from "@/lib/database-operations";
import { Calendar } from "lucide-react";

interface AcademicYearSelectorProps {
  value?: string;
  onChange: (academicYearId: string, academicYear: AcademicYear | null) => void;
  label?: string;
  showAllOption?: boolean;
  className?: string;
}

export function AcademicYearSelector({ 
  value, 
  onChange, 
  label = "Select Academic Year",
  showAllOption = true,
  className 
}: AcademicYearSelectorProps) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubYears = subscribeToAcademicYears((data) => {
      setAcademicYears(data);
      setLoading(false);
    });

    return () => {
      unsubYears();
    };
  }, []);

  const handleChange = (academicYearId: string) => {
    if (academicYearId === "all") {
      onChange("all", null);
    } else {
      const selectedYear = academicYears.find(y => y.id === academicYearId);
      onChange(academicYearId, selectedYear || null);
    }
  };

  return (
    <div className={className}>
      {label && <Label className="mb-2 block">{label}</Label>}
      <Select value={value} onValueChange={handleChange} disabled={loading}>
        <SelectTrigger>
          <Calendar className="w-4 h-4 mr-2" />
          <SelectValue placeholder={loading ? "Loading academic years..." : "Choose academic year"} />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">All Academic Years</SelectItem>
          )}
          {academicYears
            .sort((a, b) => b.name.localeCompare(a.name)) // Sort by name descending (newest first)
            .map(year => (
              <SelectItem key={year.id} value={year.id!}>
                {year.name} {year.status === 'active' && '(Current)'}
              </SelectItem>
            ))}
          {academicYears.length === 0 && !loading && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No academic years available
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
