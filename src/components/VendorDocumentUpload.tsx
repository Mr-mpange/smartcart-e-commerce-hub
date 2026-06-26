import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface VendorDocument {
  id: string;
  document_type: string;
  document_url: string;
  document_name: string;
  file_size: number;
  is_verified: boolean;
  rejection_reason?: string;
  created_at: string;
}

interface VendorDocumentUploadProps {
  vendorId: string;
  readonly?: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'business_license', label: 'Business License' },
  { value: 'tax_certificate', label: 'Tax Certificate' },
  { value: 'id_document', label: 'ID Document' },
  { value: 'bank_statement', label: 'Bank Statement' },
];

export function VendorDocumentUpload({ vendorId, readonly = false }: VendorDocumentUploadProps) {
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchDocuments();
  }, [vendorId]);

  const getStoragePath = (documentUrl: string) => {
    if (!documentUrl) return null;
    if (!documentUrl.startsWith('http')) return documentUrl;

    const markers = [
      '/storage/v1/object/public/vendor-documents/',
      '/storage/v1/object/sign/vendor-documents/',
      '/storage/v1/object/authenticated/vendor-documents/',
    ];

    for (const marker of markers) {
      const index = documentUrl.indexOf(marker);
      if (index >= 0) {
        return decodeURIComponent(documentUrl.slice(index + marker.length).split('?')[0]);
      }
    }

    return null;
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_documents')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedType) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPEG, and PNG files are allowed');
      return;
    }

    setUploading(true);
    try {
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${vendorId}/${selectedType}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vendor-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      // Save document record
      const { error: insertError } = await supabase
        .from('vendor_documents')
        .insert([{
          vendor_id: vendorId,
          document_type: selectedType,
          document_url: fileName,
          document_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        }]);

      if (insertError) throw insertError;

      toast.success('Document uploaded successfully');
      setUploadOpen(false);
      setSelectedType('');
      fetchDocuments();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const openDocument = async (doc: VendorDocument) => {
    try {
      const storagePath = getStoragePath(doc.document_url);
      if (!storagePath) {
        window.open(doc.document_url, '_blank', 'noopener,noreferrer');
        return;
      }

      const { data, error } = await supabase.storage
        .from('vendor-documents')
        .createSignedUrl(storagePath, 60);

      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      console.error('Open document error:', error);
      toast.error(error.message || 'Failed to open document');
    }
  };

  const handleDelete = async (doc: VendorDocument) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const storagePath = getStoragePath(doc.document_url);
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('vendor-documents')
          .remove([storagePath]);

        if (storageError) throw storageError;
      }

      const { error } = await supabase
        .from('vendor_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;
      toast.success('Document deleted');
      fetchDocuments();
    } catch (error: any) {
      toast.error('Failed to delete document');
    }
  };

  const getStatusBadge = (doc: VendorDocument) => {
    if (doc.is_verified) {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
    } else if (doc.rejection_reason) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    } else {
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading documents...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Verification Documents
        </CardTitle>
        {!readonly && (
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Verification Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>File (PDF, JPEG, PNG - Max 10MB)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={!selectedType || uploading}
                  />
                </div>
                {uploading && (
                  <div className="text-center text-sm text-muted-foreground">
                    Uploading document...
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No documents uploaded yet</p>
            {!readonly && <p className="text-sm">Upload verification documents to get approved</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                    </span>
                    {getStatusBadge(doc)}
                  </div>
                  <p className="text-sm text-muted-foreground">{doc.document_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(doc.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                  {doc.rejection_reason && (
                    <p className="text-xs text-red-600 mt-1">Reason: {doc.rejection_reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDocument(doc)}
                  >
                    View
                  </Button>
                  {!readonly && !doc.is_verified && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
