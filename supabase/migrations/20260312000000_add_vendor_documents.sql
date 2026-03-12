-- Create vendor_documents table for verification documents
CREATE TABLE public.vendor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  document_type VARCHAR(50) NOT NULL, -- 'business_license', 'tax_certificate', 'id_document', 'bank_statement'
  document_url TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;

-- Vendors can view their own documents
CREATE POLICY "Vendors can view own documents"
  ON public.vendor_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles vp 
      WHERE vp.id = vendor_id AND vp.user_id = auth.uid()
    )
  );

-- Vendors can insert their own documents
CREATE POLICY "Vendors can insert own documents"
  ON public.vendor_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles vp 
      WHERE vp.id = vendor_id AND vp.user_id = auth.uid()
    )
  );

-- Vendors can update their own unverified documents
CREATE POLICY "Vendors can update own unverified documents"
  ON public.vendor_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_profiles vp 
      WHERE vp.id = vendor_id AND vp.user_id = auth.uid()
    ) AND is_verified = FALSE
  );

-- Admins can manage all documents
CREATE POLICY "Admins can manage all documents"
  ON public.vendor_documents FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_vendor_documents_updated_at
  BEFORE UPDATE ON public.vendor_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add verification status to vendor_profiles
ALTER TABLE public.vendor_profiles 
ADD COLUMN documents_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_notes TEXT;

-- Create storage bucket for vendor documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-documents', 'vendor-documents', false);

-- Allow vendors to upload their own documents
CREATE POLICY "Vendors can upload own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vendor-documents'
  AND public.has_role(auth.uid(), 'vendor')
  AND (storage.foldername(name))[1] IN (
    SELECT vp.id::text FROM public.vendor_profiles vp WHERE vp.user_id = auth.uid()
  )
);

-- Allow vendors to view their own documents
CREATE POLICY "Vendors can view own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'vendor-documents'
  AND (
    public.has_role(auth.uid(), 'vendor')
    AND (storage.foldername(name))[1] IN (
      SELECT vp.id::text FROM public.vendor_profiles vp WHERE vp.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Allow admins to view all vendor documents
CREATE POLICY "Admins can view all vendor documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'vendor-documents' AND public.has_role(auth.uid(), 'admin'));

-- Allow vendors to delete their own unverified documents
CREATE POLICY "Vendors can delete own unverified documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'vendor-documents'
  AND public.has_role(auth.uid(), 'vendor')
  AND (storage.foldername(name))[1] IN (
    SELECT vp.id::text FROM public.vendor_profiles vp WHERE vp.user_id = auth.uid()
  )
);

-- Allow admins to delete any vendor documents
CREATE POLICY "Admins can delete vendor documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vendor-documents' AND public.has_role(auth.uid(), 'admin'));