"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Share2, CheckCircle, Link } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface InviteProps {
  sessionId: string;
  sessionName: string;
}

export default function SessionInvite({ sessionId, sessionName }: InviteProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [expiryTime, setExpiryTime] = useState('24');
  const [userId, setUserId] = useState<string | null>(null);
  
  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Generate an invitation link
  const generateInvite = async () => {
    setLoading(true);
    
    try {
      if (!userId) {
        toast({
          title: 'Authentication required',
          description: 'Please login to create invitations',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      const hours = parseInt(expiryTime);
      if (isNaN(hours) || hours <= 0) {
        toast({
          title: 'Invalid Expiry Time',
          description: 'Please select a valid expiry time',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/sessions/create-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          userId,
          expiresInHours: hours,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast({
          title: 'Failed to generate invitation',
          description: data.error || 'An error occurred',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      // Set the invite link
      if (data.url) {
        setInviteLink(data.url);
      } else {
        // Construct the invite URL if not provided by the API
        const baseUrl = window.location.origin;
        const inviteUrl = `${baseUrl}/sessions/join?code=${data.code}`;
        setInviteLink(inviteUrl);
      }
      
      toast({
        title: 'Invitation Generated',
        description: 'Share this link with others to join your session',
      });
      
      setLoading(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };
  
  // Copy the invitation link to clipboard
  const copyLink = async () => {
    if (!inviteLink) return;
    
    setCopying(true);
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      
      toast({
        title: 'Copied!',
        description: 'Invitation link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually',
        variant: 'destructive',
      });
    } finally {
      setCopying(false);
    }
  };
  
  // Share the invitation link (if supported)
  const shareLink = async () => {
    if (!inviteLink || !navigator.share) return;
    
    setSharing(true);
    
    try {
      await navigator.share({
        title: `Join ${sessionName} on Split Bill App`,
        text: `You've been invited to join ${sessionName} on Split Bill App. Click the link to join:`,
        url: inviteLink,
      });
      
      toast({
        title: 'Shared!',
        description: 'Invitation link shared successfully',
      });
    } catch (error) {
      // User canceled or share failed
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: 'Failed to share',
          description: 'Please copy the link manually',
          variant: 'destructive',
        });
      }
    } finally {
      setSharing(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Invite Others</CardTitle>
        <CardDescription>
          Generate a link to invite others to join this session
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="link">Invitation Link</TabsTrigger>
            <TabsTrigger value="qr" disabled>QR Code (Coming Soon)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4">
            {!inviteLink ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Link Expiry</Label>
                  <Select
                    value={expiryTime}
                    onValueChange={setExpiryTime}
                    disabled={loading}
                  >
                    <SelectTrigger id="expiry">
                      <SelectValue placeholder="Select expiry time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="6">6 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="48">48 hours</SelectItem>
                      <SelectItem value="72">72 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  className="w-full"
                  onClick={generateInvite}
                  disabled={loading || !userId}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Link className="mr-2 h-4 w-4" />
                      Generate Invitation Link
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-sm font-medium">Link Generated Successfully</div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="invite-link">Invitation Link</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="invite-link"
                      value={inviteLink}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={copyLink}
                      disabled={copying}
                      title="Copy to clipboard"
                    >
                      {copying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <Button
                    className="w-full"
                    onClick={copyLink}
                    disabled={copying}
                  >
                    {copying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Copying...
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </>
                    )}
                  </Button>
                  
                  {navigator.share && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={shareLink}
                      disabled={sharing}
                    >
                      {sharing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sharing...
                        </>
                      ) : (
                        <>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={() => {
                    setInviteLink('');
                    setExpiryTime('24');
                  }}
                >
                  Generate New Link
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="qr">
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-center text-muted-foreground">
                QR Code generation will be available soon.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          {inviteLink
            ? 'This invitation link will expire after the selected time period.'
            : 'Anyone with the link can join your session during the expiry period.'}
        </p>
      </CardFooter>
    </Card>
  );
}
