import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { setupDefaultUsers } from '@/lib/firebase-setup';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, CheckCircle } from 'lucide-react';

export function SetupUsers() {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const handleSetupUsers = async () => {
    setIsLoading(true);
    try {
      await setupDefaultUsers();
      setIsComplete(true);
      toast({
        title: "Success!",
        description: "All default users have been created successfully.",
      });
    } catch (error) {
      console.error('Error setting up users:', error);
      toast({
        title: "Error",
        description: "Failed to create users. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
          <CardTitle>Setup Complete!</CardTitle>
          <CardDescription>
            All users have been created successfully. You can now log in with:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><strong>Admin:</strong> admin@school.com / admin123</div>
          <div><strong>Teacher:</strong> teacher@school.com / teacher123</div>
          <div><strong>Accountant:</strong> accountant@school.com / account123</div>
          <div><strong>Student:</strong> student@school.com / student123</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <Users className="h-12 w-12 text-primary mx-auto mb-2" />
        <CardTitle>Setup Firebase Users</CardTitle>
        <CardDescription>
          Create default users in Firebase Authentication and Database
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button 
          onClick={handleSetupUsers} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Users...
            </>
          ) : (
            'Create Default Users'
          )}
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          This will create admin, teacher, accountant, and student accounts
        </p>
      </CardContent>
    </Card>
  );
}