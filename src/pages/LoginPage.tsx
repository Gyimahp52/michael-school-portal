import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Mail, Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Role-based routing based on selected role
    switch (role) {
      case "admin":
        navigate("/admin-dashboard");
        break;
      case "teacher":
        navigate("/teacher-dashboard");
        break;
      case "accountant":
        navigate("/accountant-dashboard");
        break;
      default:
        navigate("/admin-dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md space-y-6">
        {/* School Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <GraduationCap className="w-12 h-12 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Michael Agyei School</h1>
            <p className="text-muted-foreground">School Management System</p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-elegant border-border/50">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Role
                </Label>
                <Select value={role} onValueChange={setRole} required>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Login Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90 transition-all"
                size="lg"
              >
                Sign In
              </Button>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-2">Demo Credentials:</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><strong>Admin:</strong> admin@school.com / admin123</p>
                  <p><strong>Teacher:</strong> teacher@school.com / teacher123</p>
                  <p><strong>Accountant:</strong> accountant@school.com / account123</p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2024 Michael Agyei School. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}