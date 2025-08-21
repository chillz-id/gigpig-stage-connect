
// Xero Sync Monitoring
export const monitorXeroSync = async (supabase) => {
  // Get sync status
  const { data: integrations } = await supabase
    .from('xero_integrations')
    .select('*')
    .eq('connection_status', 'active');
  
  // Get recent sync activity
  const { data: recentSyncs } = await supabase
    .from('xero_invoices')
    .select('*')
    .order('last_sync_at', { ascending: false })
    .limit(10);
  
  // Check for sync errors
  const { data: syncErrors } = await supabase
    .from('xero_invoices')
    .select('*')
    .eq('sync_status', 'error');
  
  return {
    activeIntegrations: integrations?.length || 0,
    recentSyncs: recentSyncs || [],
    errorCount: syncErrors?.length || 0
  };
};
