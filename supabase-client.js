// Add this as a <script type="module"> in your HTML, or adapt it into your existing module.
// Replace both placeholders with values from Supabase Project Settings > API.
// Use ONLY the publishable/anon key here. NEVER put service_role/secret keys in browser code.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = https://ytmlznsgmtmfboaoxekq.supabase.co/rest/v1/
const SUPABASE_PUBLISHABLE_KEY = sb_publishable_fe8d7xpTFPakwZbrxrpmpw_GzWPglWu
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

export async function signInOperator(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('display_name, role').eq('id', data.user.id).single();
  if (profileError) { await supabase.auth.signOut(); throw profileError; }
  if (!['admin', 'operator'].includes(profile.role)) {
    await supabase.auth.signOut();
    throw new Error('या खात्याला ऑपरेटर प्रवेश दिलेला नाही.');
  }
  return { user: data.user, profile };
}

export async function signOutOperator() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function saveBill({ customerName, customerMobile = null, serviceName, amount, note = '', paymentStatus = 'paid' }) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('कृपया आधी सुरक्षित लॉगिन करा.');
  const cleanMobile = customerMobile?.trim() || null;
  const { data, error } = await supabase.from('bills').insert({
    customer_name: customerName.trim(),
    customer_mobile: cleanMobile,
    service_name: serviceName.trim(),
    amount: Number(amount),
    note: note.trim() || null,
    payment_status: paymentStatus,
    created_by: user.id
  }).select('id, invoice_no, customer_name, customer_mobile, service_name, amount, note, payment_status, created_at').single();
  if (error) throw error;
  return data;
}

export async function listRecentBills(limit = 50) {
  const { data, error } = await supabase.from('bills')
    .select('id, invoice_no, customer_name, service_name, amount, payment_status, created_at')
    .order('created_at', { ascending: false }).limit(Math.min(Math.max(limit, 1), 100));
  if (error) throw error;
  return data;
}

export async function getCurrentOperator() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data, error: profileError } = await supabase.from('profiles')
    .select('display_name, role').eq('id', user.id).single();
  if (profileError) throw profileError;
  return { user, profile: data };
}
