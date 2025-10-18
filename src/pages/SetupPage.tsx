import { useState } from "react";
import { setupDefaultUsers } from "@/lib/firebase-setup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export function SetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("");

  const handleSetup = async () => {
    setIsLoading(true);
    setStatus('idle');
    setMessage("");

    try {
      await setupDefaultUsers();
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
          <CardTitle>Firebase User Setup</CardTitle>
          <CardDescription>
            Initialize default users in Firebase. This will create both Authentication accounts and Firestore documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Default Users:</h3>
            <ul className="space-y-1 text-sm">
              <li>• Admin: admin@school.com / admin123</li>
              <li>• Teacher: teacher@school.com / teacher123</li>
              <li>• Accountant: accountant@school.com / account123</li>
              <li>• Student: student@school.com / student123</li>
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
