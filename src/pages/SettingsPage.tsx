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
} from "lucide-react";

export default function SettingsPage() {
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
        <Button className="gap-2 bg-gradient-primary hover:opacity-90 w-fit">
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
                  <Input id="schoolName" defaultValue="Michael Agyei School" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input id="academicYear" defaultValue="2023/2024" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="schoolAddress">School Address</Label>
                <Textarea 
                  id="schoolAddress" 
                  defaultValue="123 Education Street, Accra, Ghana"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+233 20 123 4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" defaultValue="info@michaelagyeischool.edu.gh" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">School Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <School className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </Button>
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
                <Switch id="darkMode" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoBackup">Automatic Backup</Label>
                  <p className="text-sm text-muted-foreground">Daily automatic database backup</p>
                </div>
                <Switch id="autoBackup" defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send system notifications via email</p>
                </div>
                <Switch id="emailNotifications" defaultChecked />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input id="sessionTimeout" type="number" defaultValue="30" className="w-32" />
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
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Fee Payment Reminders</Label>
                  <p className="text-sm text-muted-foreground">Send payment reminder notifications</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Grade Submissions</Label>
                  <p className="text-sm text-muted-foreground">Notify when teachers submit grades</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>System Maintenance</Label>
                  <p className="text-sm text-muted-foreground">Alerts for system maintenance</p>
                </div>
                <Switch defaultChecked />
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
                <Switch />
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
                <Input id="loginAttempts" type="number" defaultValue="3" className="w-32" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}