import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/CustomAuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2, User, GraduationCap } from "lucide-react";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, setupUsers } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both username and password.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(username, password);

      toast({
        title: "Login successful",
        description: `Welcome back, ${user.displayName}!`,
      });

      // Navigate to the appropriate dashboard
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Failed to sign in. Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupUsers = async () => {
    try {
      setIsLoading(true);
      await setupUsers();
      toast({
        title: "Success",
        description: "Default users have been created successfully!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create users.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <GraduationCap className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground text-center">Michael Agyei School</h1>
                <p className="text-muted-foreground text-center">School Management System</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-sm font-medium text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <a href="#" className="font-medium text-primary hover:underline">
                Contact administrator
              </a>
            </div>
          </CardFooter>
        </Card>

        {/* Demo Credentials */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Demo Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Admin:</strong> admin / admin123</p>
              <p><strong>Teacher:</strong> teacher / teacher123</p>
              <p><strong>Accountant:</strong> accountant / account123</p>
            </div>
          </CardContent>
        </Card>

        {/* Setup Users Button */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleSetupUsers} 
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up users...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Setup Default Users
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}