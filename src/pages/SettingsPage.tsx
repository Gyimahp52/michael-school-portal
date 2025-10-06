import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  School,
  Bell,
  Shield,
  Database,
  Upload,
  Save,
  Mail,
  Loader2,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { getSchoolSettings, updateSchoolSettings, SchoolSettings } from "@/lib/school-settings";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("school");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSchoolSettings();
      setSettings(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      await updateSchoolSettings(settings);
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SchoolSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const updateNestedSetting = (section: 'notifications' | 'security', key: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    });
  };

  const handleSelectLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!settings) return;

    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }

    const MAX_BYTES = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_BYTES) {
      toast({ title: "File too large", description: "Please select an image under 10MB", variant: "destructive" });
      return;
    }

    try {
      setUploadingLogo(true);
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      setSettings({ ...settings, logoUrl: dataUrl });
      await updateSchoolSettings({ logoUrl: dataUrl });

      toast({ title: "Logo updated", description: "School logo updated successfully" });
    } catch (err: any) {
      console.error("Logo upload failed", err);
      toast({ title: "Upload failed", description: err?.message || "Unable to upload logo", variant: "destructive" });
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure school information, system preferences, and security settings.
          </p>
        </div>
        <Button 
          className="gap-2 bg-gradient-primary hover:opacity-90 w-fit" 
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          <Save className="w-4 h-4" />
          Save All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Settings Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start gap-3 bg-primary/5 text-primary">
              <School className="w-4 h-4" />
              School Information
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-muted/50">
              <Bell className="w-4 h-4" />
              Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-muted/50">
              <Shield className="w-4 h-4" />
              Security
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-muted/50">
              <Database className="w-4 h-4" />
              System Backup
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-muted/50">
              <Mail className="w-4 h-4" />
              Email Configuration
            </Button>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* School Information */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="w-5 h-5 text-primary" />
                School Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input 
                    id="schoolName" 
                    value={settings.schoolName}
                    onChange={(e) => updateSetting('schoolName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input 
                    id="academicYear" 
                    value={settings.academicYear}
                    onChange={(e) => updateSetting('academicYear', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="schoolAddress">School Address</Label>
                <Textarea 
                  id="schoolAddress" 
                  value={settings.address}
                  onChange={(e) => updateSetting('address', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={settings.phone}
                    onChange={(e) => updateSetting('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    value={settings.email}
                    onChange={(e) => updateSetting('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">School Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="School logo" className="w-full h-full object-cover" />
                    ) : (
                      <School className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoSelected}
                    />
                    <Button variant="outline" className="gap-2" onClick={handleSelectLogoClick} disabled={uploadingLogo}>
                      {uploadingLogo && <Loader2 className="w-4 h-4 animate-spin" />}
                      <Upload className="w-4 h-4" />
                      {uploadingLogo ? "Uploading..." : "Upload Logo"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Preferences */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-secondary" />
                System Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="darkMode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Enable dark theme for the interface</p>
                </div>
                <Switch 
                  id="darkMode" 
                  checked={theme === "dark"} 
                  onCheckedChange={(checked) => {
                    setTheme(checked ? "dark" : "light");
                    updateSetting('darkMode', checked);
                  }}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoBackup">Automatic Backup</Label>
                  <p className="text-sm text-muted-foreground">Daily automatic database backup</p>
                </div>
                <Switch 
                  id="autoBackup" 
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => updateSetting('autoBackup', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send system notifications via email</p>
                </div>
                <Switch 
                  id="emailNotifications" 
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input 
                  id="sessionTimeout" 
                  type="number" 
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                  className="w-32" 
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>New Student Enrollment</Label>
                  <p className="text-sm text-muted-foreground">Notify when new students enroll</p>
                </div>
                <Switch 
                  checked={settings.notifications.newEnrollment}
                  onCheckedChange={(checked) => updateNestedSetting('notifications', 'newEnrollment', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Fee Payment Reminders</Label>
                  <p className="text-sm text-muted-foreground">Send payment reminder notifications</p>
                </div>
                <Switch 
                  checked={settings.notifications.feeReminders}
                  onCheckedChange={(checked) => updateNestedSetting('notifications', 'feeReminders', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Grade Submissions</Label>
                  <p className="text-sm text-muted-foreground">Notify when teachers submit grades</p>
                </div>
                <Switch 
                  checked={settings.notifications.gradeSubmissions}
                  onCheckedChange={(checked) => updateNestedSetting('notifications', 'gradeSubmissions', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>System Maintenance</Label>
                  <p className="text-sm text-muted-foreground">Alerts for system maintenance</p>
                </div>
                <Switch 
                  checked={settings.notifications.systemMaintenance}
                  onCheckedChange={(checked) => updateNestedSetting('notifications', 'systemMaintenance', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-success" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Enable 2FA for admin accounts</p>
                </div>
                <Switch 
                  checked={settings.security.twoFactorAuth}
                  onCheckedChange={(checked) => updateNestedSetting('security', 'twoFactorAuth', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="passwordPolicy">Password Policy</Label>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Minimum 8 characters</p>
                  <p>• Must include uppercase and lowercase letters</p>
                  <p>• Must include at least one number</p>
                  <p>• Must include at least one special character</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                <Input 
                  id="loginAttempts" 
                  type="number" 
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => updateNestedSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  className="w-32" 
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}