import { useState } from "react";
import { createUser } from "@/lib/custom-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const defaultUsers = [
  { username: 'admin', password: 'admin123', displayName: 'Admin User', role: 'admin' as const },
  { username: 'teacher', password: 'teacher123', displayName: 'Teacher One', role: 'teacher' as const },
  { username: 'accountant', password: 'account123', displayName: 'Accountant One', role: 'accountant' as const },
];

export function SetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("");

  const handleSetup = async () => {
    setIsLoading(true);
    setStatus('idle');
    setMessage("");

    try {
      for (const user of defaultUsers) {
        try {
          await createUser(user);
          console.log(`Created user: ${user.username}`);
        } catch (error: any) {
          if (error.message === 'Username already exists') {
            console.log(`User already exists: ${user.username}`);
          } else {
            throw error;
          }
        }
      }
      
      setStatus('success');
      setMessage("Users have been set up successfully! You can now login with the default credentials.");
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || "Failed to setup users. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>User Setup</CardTitle>
          <CardDescription>
            Initialize default users in the database. This will create user accounts in Firebase Realtime Database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Default Users:</h3>
            <ul className="space-y-1 text-sm">
              <li>• Admin: username: <strong>admin</strong> / password: <strong>admin123</strong></li>
              <li>• Teacher: username: <strong>teacher</strong> / password: <strong>teacher123</strong></li>
              <li>• Accountant: username: <strong>accountant</strong> / password: <strong>account123</strong></li>
            </ul>
          </div>

          <Button 
            onClick={handleSetup} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up users...
              </>
            ) : (
              'Initialize Users'
            )}
          </Button>

          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
              <XCircle className="h-5 w-5" />
              <p className="text-sm">{message}</p>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>After setup, you can:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Go to <a href="/login" className="text-primary hover:underline">/login</a></li>
              <li>Login with any of the default credentials above</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
