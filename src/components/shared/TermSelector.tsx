import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Term, AcademicYear } from "@/lib/database-operations";
import { subscribeToTermsOfflineFirst, subscribeToAcademicYearsOfflineFirst } from "@/lib/offline-reference-data";
import { Calendar } from "lucide-react";

interface TermSelectorProps {
  value?: string;
  onChange: (termId: string, term: Term | null) => void;
  label?: string;
  showAllOption?: boolean;
  className?: string;
  terms?: Term[]; // Optional prop to pass specific terms instead of all
}

export function TermSelector({ 
  value, 
  onChange, 
  label = "Select Term",
  showAllOption = true,
  className,
  terms: providedTerms
}: TermSelectorProps) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (providedTerms) {
      setTerms(providedTerms);
      setLoading(false);
    } else {
      const unsubTerms = subscribeToTermsOfflineFirst((data) => {
        setTerms(data);
        setLoading(false);
      });
      const unsubYears = subscribeToAcademicYearsOfflineFirst(setAcademicYears);

      return () => {
        unsubTerms();
        unsubYears();
      };
    }
  }, [providedTerms]);

  const handleChange = (termId: string) => {
    if (termId === "all") {
      onChange("all", null);
    } else {
      const selectedTerm = terms.find(t => t.id === termId);
      onChange(termId, selectedTerm || null);
    }
  };

  // Group terms by academic year
  const termsByYear = terms.reduce((acc, term) => {
    if (!acc[term.academicYearId]) {
      acc[term.academicYearId] = [];
    }
    acc[term.academicYearId].push(term);
    return acc;
  }, {} as Record<string, Term[]>);

  return (
    <div className={className}>
      {label && <Label className="mb-2 block">{label}</Label>}
      <Select value={value} onValueChange={handleChange} disabled={loading}>
        <SelectTrigger>
          <Calendar className="w-4 h-4 mr-2" />
          <SelectValue placeholder={loading ? "Loading terms..." : "Choose a term"} />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">All Terms</SelectItem>
          )}
          {Object.entries(termsByYear).map(([yearId, yearTerms]) => {
            const year = academicYears.find(y => y.id === yearId);
            return (
              <div key={yearId}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {year?.name || 'Unknown Year'}
                </div>
                {yearTerms
                  .sort((a, b) => {
                    const order = { 'First Term': 1, 'Second Term': 2, 'Third Term': 3 };
                    return order[a.name] - order[b.name];
                  })
                  .map(term => (
                    <SelectItem key={term.id} value={term.id!}>
                      {term.name} {term.isCurrentTerm && '(Current)'}
                    </SelectItem>
                  ))}
              </div>
            );
          })}
          {terms.length === 0 && !loading && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No terms available
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
