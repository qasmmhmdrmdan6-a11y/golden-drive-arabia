
-- Storage RLS for car-images bucket
CREATE POLICY "Public can view car images" ON storage.objects
  FOR SELECT USING (bucket_id = 'car-images');
CREATE POLICY "Admins upload car images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'car-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update car images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'car-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete car images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'car-images' AND public.has_role(auth.uid(), 'admin'));

-- Lock down the auth trigger helper — trigger context bypasses grants.
REVOKE EXECUTE ON FUNCTION public.handle_new_user_admin() FROM PUBLIC, anon, authenticated;
