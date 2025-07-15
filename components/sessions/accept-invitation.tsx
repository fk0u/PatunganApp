import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface SessionInfo {
  id: string;
  name: string;
  description: string;
  participantCount: number;
}

interface AcceptInvitationProps {
  inviteCode: string;
}

export default function AcceptInvitation({ inviteCode }: AcceptInvitationProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [name, setName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthenticated(true);
        
        // Pre-fill name if available
        if (user.displayName) {
          setName(user.displayName);
        }
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        
        // Redirect to login
        router.push(`/login?returnUrl=${encodeURIComponent(`/sessions/join?code=${inviteCode}`)}`);
      }
    });
    
    return () => unsubscribe();
  }, [router, inviteCode]);
  
  // Validate the invitation code
  useEffect(() => {
    if (!inviteCode) {
      setError('No invitation code provided');
      setValidating(false);
      setLoading(false);
      return;
    }
    
    async function validateInvite() {
      try {
        const response = await fetch(`/api/sessions/validate-invite?code=${inviteCode}`);
        const data = await response.json();
        
        if (!response.ok) {
          setError(data.error || 'Failed to validate invitation');
          setValidating(false);
          setLoading(false);
          return;
        }
        
        // Invitation is valid
        setSession(data.session);
        setValidating(false);
        setLoading(false);
      } catch (error) {
        setError('An error occurred while validating the invitation');
        setValidating(false);
        setLoading(false);
      }
    }
    
    if (inviteCode) {
      validateInvite();
    }
  }, [inviteCode]);
  
  // Handle join button click
  const handleJoin = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your name to join the session',
        variant: 'destructive',
      });
      return;
    }
    
    if (!userId) {
      toast({
        title: 'Authentication required',
        description: 'Please login to join the session',
        variant: 'destructive',
      });
      return;
    }
    
    setJoining(true);
    
    try {
      const response = await fetch('/api/sessions/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: inviteCode,
          userId,
          name: name.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast({
          title: 'Failed to join',
          description: data.error || 'An error occurred while joining the session',
          variant: 'destructive',
        });
        setJoining(false);
        return;
      }
      
      // Successfully joined
      toast({
        title: 'Success!',
        description: 'You have joined the session',
        variant: 'default',
      });
      
      // Redirect to the session page
      router.push(`/sessions/${data.session.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      setJoining(false);
    }
  };
  
  // Loading state
  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>Please login to join this session</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Validating Invitation</CardTitle>
          <CardDescription>Please wait while we validate your invitation...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto border-destructive">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
          <CardTitle>Invalid Invitation</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" variant="outline" onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CheckCircle className="h-12 w-12 text-primary mx-auto mb-2" />
        <CardTitle>Join Session</CardTitle>
        <CardDescription>
          You've been invited to join <span className="font-semibold">{session?.name}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>{session?.description}</p>
            <p className="mt-2">This session has {session?.participantCount || 0} active participants.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={joining}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          className="w-full"
          onClick={handleJoin}
          disabled={joining || !name.trim()}
        >
          {joining ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            'Join Session'
          )}
        </Button>
        <Button
          className="w-full"
          variant="outline"
          onClick={() => router.push('/')}
          disabled={joining}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}
