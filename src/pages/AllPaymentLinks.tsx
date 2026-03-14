import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function AllPaymentLinks() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllLinks();
  }, []);

  const fetchAllLinks = async () => {
    try {
      const response = await fetch(
        'https://qpojzblbodlphwzfpxbi.supabase.co/rest/v1/payment_links?order=created_at.desc&select=*',
        {
          method: 'GET',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg',
            'Content-Type': 'application/json',
          }
        }
      );

      const data = await response.json();
      setLinks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching links:', err);
      toast.error('Failed to load payment links');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Copied to clipboard');
  };

  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setLinks(links.filter(l => l.id !== id));
      toast.success('Link deleted');
    } catch (err) {
      console.error('Error deleting link:', err);
      toast.error('Failed to delete link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">All Payment Links</CardTitle>
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No payment links found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Slug</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Reference</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Shareable Link</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link) => (
                      <tr key={link.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-mono text-xs">{link.slug || 'N/A'}</td>
                        <td className="py-3 px-4">TSh {link.amount.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono text-xs">{link.snippe_reference}</td>
                        <td className="py-3 px-4">
                          <Badge variant={link.status === 'paid' ? 'default' : 'secondary'}>
                            {link.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {link.slug ? (
                            <a 
                              href={`http://localhost:5173/pay/${link.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs"
                            >
                              /pay/{link.slug}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">No slug</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {link.slug && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyLink(`http://localhost:5173/pay/${link.slug}`)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                            >
                              <a href={`http://localhost:5173/pay/${link.slug}`} target="_blank" rel="noopener">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteLink(link.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              Total: {links.length} payment links
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
