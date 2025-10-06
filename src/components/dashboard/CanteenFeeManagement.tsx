import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  UtensilsCrossed, 
  Plus, 
  Download, 
  FileText, 
  Calendar,
  Users,
  TrendingUp,
  Upload,
  Eye,
  Trash2
} from "lucide-react";
import { 
  subscribeToCanteenCollections, 
  createCanteenCollection,
  deleteCanteenCollection,
  CanteenCollection 
} from "@/lib/database-operations";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface CanteenFeeManagementProps {
  currentUserId: string;
  currentUserName: string;
}

export function CanteenFeeManagement({ currentUserId, currentUserName }: CanteenFeeManagementProps) {
  const [collections, setCollections] = useState<CanteenCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [uploadingFile, setUploadingFile] = useState(false);

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    totalAmount: "",
    numberOfStudents: "",
    notes: "",
    proofFile: null as File | null,
  });

  useEffect(() => {
    const unsubscribe = subscribeToCanteenCollections((collectionsData) => {
      setCollections(collectionsData);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload JPG, PNG, or PDF files.');
        return;
      }
      // Immediate size check for PDFs (images will be compressed later)
      if (file.type === 'application/pdf') {
        const maxPdfSize = 4 * 1024 * 1024; // 4MB
        if (file.size > maxPdfSize) {
          toast.error('PDF is too large. Please upload a PDF under 4MB.');
          return;
        }
      }

      setFormData({ ...formData, proofFile: file });
      if (file.type.startsWith('image/')) {
        toast('Heads up', {
          description: 'Large images will be compressed automatically before saving.',
        });
      }
    }
  };

  // Compress images client-side to keep payloads small for Realtime DB
  const compressImageFile = (
    file: File,
    maxWidth = 1024,
    quality = 0.6
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = () => {
        img.onload = () => {
          const scale = Math.min(maxWidth / img.width, 1);
          const width = Math.round(img.width * scale);
          const height = Math.round(img.height * scale);

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Image compression failed'));
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  };

  const uploadProofFile = async (
    file: File
  ): Promise<{ url: string; name: string; type: string }> => {
    try {
      // PDFs: enforce strict size limit (4MB)
      if (file.type === 'application/pdf') {
        const maxPdfSize = 4 * 1024 * 1024; // 4MB
        if (file.size > maxPdfSize) {
          throw new Error('PDF is too large. Please upload a PDF under 4MB.');
        }
        const pdfDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read PDF file'));
          reader.readAsDataURL(file);
        });
        return { url: pdfDataUrl, name: file.name, type: file.type };
      }

      // Images: compress then convert to Data URL (JPEG)
      if (file.type.startsWith('image/')) {
        // First pass compression
        let compressedBlob = await compressImageFile(file, 1024, 0.6);
        let compressedFile = new File(
          [compressedBlob],
          file.name.replace(/\.[^.]+$/, '.jpg'),
          { type: 'image/jpeg' }
        );

        let imageDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read compressed image'));
          reader.readAsDataURL(compressedFile);
        });

        // If still large (>4MB), try a second pass with stronger compression
        const approxSizeBytes = Math.ceil((imageDataUrl.length * 3) / 4);
        if (approxSizeBytes > 4 * 1024 * 1024) {
          compressedBlob = await compressImageFile(file, 1024, 0.4);
          compressedFile = new File(
            [compressedBlob],
            file.name.replace(/\.[^.]+$/, '.jpg'),
            { type: 'image/jpeg' }
          );
          imageDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read compressed image'));
            reader.readAsDataURL(compressedFile);
          });
          const approxSizeBytes2 = Math.ceil((imageDataUrl.length * 3) / 4);
          if (approxSizeBytes2 > 4 * 1024 * 1024) {
            throw new Error('Image is too large after compression. Try a smaller image.');
          }
        }

        return { url: imageDataUrl, name: compressedFile.name, type: 'image/jpeg' };
      }

      throw new Error('Unsupported file type.');
    } catch (err) {
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      let proofDocUrl, proofDocName, proofDocType;

      // Upload file if provided
      if (formData.proofFile) {
        setUploadingFile(true);
        const uploadResult = await uploadProofFile(formData.proofFile);
        proofDocUrl = uploadResult.url;
        proofDocName = uploadResult.name;
        proofDocType = uploadResult.type;
        setUploadingFile(false);
      }

      // Create collection record
      await createCanteenCollection({
        date: formData.date,
        totalAmount: parseFloat(formData.totalAmount),
        numberOfStudents: formData.numberOfStudents ? parseInt(formData.numberOfStudents) : undefined,
        proofDocUrl,
        proofDocName,
        proofDocType,
        notes: formData.notes || undefined,
        recordedBy: currentUserId,
        recordedByName: currentUserName,
      });

      toast.success("Canteen collection recorded successfully");

      // Reset form
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        totalAmount: "",
        numberOfStudents: "",
        notes: "",
        proofFile: null,
      });

      // Reset file input
      const fileInput = document.getElementById('proof-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error('Error recording canteen collection:', error);
      const message = (error && (error.message || error.code)) ? `${error.code ? error.code + ': ' : ''}${error.message || ''}` : String(error) || 'Failed to record collection';
      toast.error(message);
    } finally {
      setLoading(false);
      setUploadingFile(false);
    }
  };

  const handleDelete = async (collectionId: string) => {
    if (!confirm("Are you sure you want to delete this collection record?")) {
      return;
    }

    try {
      await deleteCanteenCollection(collectionId);
      toast.success("Collection record deleted");
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete record");
    }
  };

  // Filter collections by month
  const filteredCollections = selectedMonth === "all" 
    ? collections 
    : collections.filter(c => {
        const collectionDate = new Date(c.date);
        const targetDate = new Date(selectedMonth);
        return collectionDate.getMonth() === targetDate.getMonth() && 
               collectionDate.getFullYear() === targetDate.getFullYear();
      });

  // Calculate statistics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyCollections = collections.filter(c => {
    const collectionDate = new Date(c.date);
    return collectionDate.getMonth() === currentMonth && 
           collectionDate.getFullYear() === currentYear;
  });

  const totalThisMonth = monthlyCollections.reduce((sum, c) => sum + c.totalAmount, 0);
  const averageDaily = monthlyCollections.length > 0 
    ? totalThisMonth / monthlyCollections.length 
    : 0;
  const totalStudentsThisMonth = monthlyCollections.reduce((sum, c) => sum + (c.numberOfStudents || 0), 0);

  const filteredTotal = filteredCollections.reduce((sum, c) => sum + c.totalAmount, 0);

  // Get unique months for filter
  const availableMonths = Array.from(new Set(
    collections.map(c => format(new Date(c.date), 'yyyy-MM'))
  )).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6" />
            Canteen / Feeding Fee Management
          </h2>
          <p className="text-muted-foreground">Track daily canteen collections and payments</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collected This Month
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalThisMonth)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {monthlyCollections.length} collection days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Daily Collection
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(averageDaily)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per day average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Students Fed This Month
            </CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalStudentsThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total student meals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Daily Collection Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Record Daily Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Collection Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Total Amount Collected (₵) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="students">Number of Students Paid</Label>
                <Input
                  id="students"
                  type="number"
                  placeholder="Optional"
                  value={formData.numberOfStudents}
                  onChange={(e) => setFormData({ ...formData, numberOfStudents: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proof">Upload Proof (Photo/PDF)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="proof-file-input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {formData.proofFile && (
                    <Badge variant="secondary" className="whitespace-nowrap">
                      {formData.proofFile.name.substring(0, 15)}...
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, or PDF (max 4MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Optional remarks..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary" 
                disabled={loading || uploadingFile}
              >
                {loading ? (
                  uploadingFile ? "Uploading Document..." : "Recording..."
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Record Collection
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right: Ledger Summary */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Canteen Ledger
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    {availableMonths.map(month => (
                      <SelectItem key={month} value={month}>
                        {format(new Date(month + '-01'), 'MMMM yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Proof</TableHead>
                      <TableHead>Recorded By</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCollections.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No collections recorded yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCollections.map((collection) => (
                        <TableRow key={collection.id}>
                          <TableCell>
                            {format(new Date(collection.date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(collection.totalAmount)}
                          </TableCell>
                          <TableCell>
                            {collection.numberOfStudents || '-'}
                          </TableCell>
                          <TableCell>
                            {collection.proofDocUrl ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(collection.proofDocUrl, '_blank')}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {collection.recordedByName}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(collection.id!)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Running Total */}
              {filteredCollections.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="font-medium">
                    {selectedMonth === "all" ? "Total (All Time)" : `Total (${format(new Date(selectedMonth + '-01'), 'MMMM yyyy')})`}
                  </span>
                  <span className="text-2xl font-bold text-foreground">
                    {formatCurrency(filteredTotal)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
