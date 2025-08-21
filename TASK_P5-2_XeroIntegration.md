# P5.2: Financial Integration - XERO Disconnect

## **🎯 TASK OVERVIEW**
**Priority:** MEDIUM - Financial system flexibility
**Component:** XERO integration management
**Current Issue:** No disconnect option available under "Connected" status

## **🔍 PROBLEM DETAILS**
- XERO integration shows "Connected" status
- No way to disconnect XERO integration
- Need confirmation dialog for disconnect action
- Should provide reconnection option after disconnect
- Need clear status display and management

## **📁 FILES TO CHECK**
- `src/pages/Admin/Financial.tsx` - Financial settings page
- `src/components/Financial/XeroIntegration.tsx` - XERO integration component
- `src/lib/xero.ts` - XERO API configuration
- `src/hooks/useXeroIntegration.ts` - XERO integration management
- Financial settings and integration components

## **✅ ACCEPTANCE CRITERIA**
1. "Disconnect" button visible under "Connected" status
2. Confirmation dialog appears before disconnect
3. XERO integration successfully disconnects
4. Status updates to "Disconnected" immediately
5. Reconnection option available after disconnect
6. Clear feedback about connection status
7. Error handling for disconnect failures

## **🔧 TECHNICAL REQUIREMENTS**
1. **XERO connection status management:**
   ```typescript
   interface XeroIntegration {
     isConnected: boolean;
     connectedAt: Date | null;
     lastSync: Date | null;
     tenantId: string | null;
     tenantName: string | null;
     status: 'connected' | 'disconnected' | 'error' | 'connecting';
   }
   ```

2. **Disconnect functionality:**
   ```typescript
   const disconnectXero = async () => {
     try {
       // Revoke XERO token
       await revokeXeroToken();
       
       // Update local state
       setXeroStatus('disconnected');
       
       // Clear stored credentials
       await clearXeroCredentials();
       
       // Show success message
       toast.success('XERO disconnected successfully');
     } catch (error) {
       toast.error('Failed to disconnect XERO');
       throw error;
     }
   };
   ```

3. **Confirmation dialog:**
   ```typescript
   const ConfirmDisconnectDialog = ({ isOpen, onConfirm, onCancel }) => (
     <Modal isOpen={isOpen} onClose={onCancel}>
       <div className="disconnect-confirmation">
         <h3>Disconnect XERO Integration?</h3>
         <p>This will:</p>
         <ul>
           <li>Stop automatic invoice syncing</li>
           <li>Revoke access to your XERO account</li>
           <li>Require re-authentication to reconnect</li>
         </ul>
         <p>You can reconnect at any time.</p>
         <div className="actions">
           <button onClick={onConfirm} className="btn-danger">
             Disconnect
           </button>
           <button onClick={onCancel} className="btn-secondary">
             Cancel
           </button>
         </div>
       </div>
     </Modal>
   );
   ```

## **🔍 IMPLEMENTATION STRATEGY**
1. **XERO integration component:**
   ```typescript
   // src/components/Financial/XeroIntegration.tsx
   const XeroIntegration = () => {
     const { xeroStatus, connectXero, disconnectXero } = useXeroIntegration();
     const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
     
     const handleDisconnect = async () => {
       try {
         await disconnectXero();
         setShowDisconnectDialog(false);
       } catch (error) {
         // Error already handled in disconnectXero
       }
     };
     
     return (
       <div className="xero-integration">
         <div className="integration-header">
           <img src="/xero-logo.png" alt="XERO" />
           <h3>XERO Integration</h3>
           <StatusBadge status={xeroStatus.status} />
         </div>
         
         <div className="integration-content">
           {xeroStatus.isConnected ? (
             <ConnectedState 
               status={xeroStatus}
               onDisconnect={() => setShowDisconnectDialog(true)}
             />
           ) : (
             <DisconnectedState onConnect={connectXero} />
           )}
         </div>
         
         <ConfirmDisconnectDialog
           isOpen={showDisconnectDialog}
           onConfirm={handleDisconnect}
           onCancel={() => setShowDisconnectDialog(false)}
         />
       </div>
     );
   };
   ```

2. **Connected state component:**
   ```typescript
   const ConnectedState = ({ status, onDisconnect }) => (
     <div className="connected-state">
       <div className="connection-info">
         <p><strong>Connected to:</strong> {status.tenantName}</p>
         <p><strong>Connected since:</strong> {formatDate(status.connectedAt)}</p>
         <p><strong>Last sync:</strong> {formatDate(status.lastSync)}</p>
       </div>
       
       <div className="connection-actions">
         <button 
           onClick={onDisconnect}
           className="btn-outline-danger"
         >
           Disconnect XERO
         </button>
         <button className="btn-outline-primary">
           Sync Now
         </button>
         <button className="btn-outline-secondary">
           View Settings
         </button>
       </div>
       
       <div className="sync-status">
         <SyncStatus lastSync={status.lastSync} />
       </div>
     </div>
   );
   ```

3. **Disconnected state component:**
   ```typescript
   const DisconnectedState = ({ onConnect }) => (
     <div className="disconnected-state">
       <div className="disconnect-message">
         <p>XERO integration is not connected.</p>
         <p>Connect to enable automatic invoice syncing and financial reporting.</p>
       </div>
       
       <div className="connection-benefits">
         <h4>Benefits of connecting XERO:</h4>
         <ul>
           <li>Automatic invoice creation</li>
           <li>Real-time financial sync</li>
           <li>Streamlined accounting</li>
           <li>Tax compliance support</li>
         </ul>
       </div>
       
       <button 
         onClick={onConnect}
         className="btn-primary"
       >
         Connect to XERO
       </button>
     </div>
   );
   ```

## **🔧 XERO API INTEGRATION**
```typescript
// src/lib/xero.ts
export const revokeXeroToken = async () => {
  try {
    const response = await fetch('/api/xero/revoke', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getStoredXeroToken()}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to revoke XERO token');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error revoking XERO token:', error);
    throw error;
  }
};

export const clearXeroCredentials = async () => {
  // Clear from localStorage
  localStorage.removeItem('xero_token');
  localStorage.removeItem('xero_refresh_token');
  localStorage.removeItem('xero_tenant_id');
  
  // Clear from database
  await supabase
    .from('integrations')
    .update({ 
      xero_token: null,
      xero_refresh_token: null,
      xero_tenant_id: null,
      xero_connected_at: null
    })
    .eq('user_id', user.id);
};
```

## **🎨 UI/UX REQUIREMENTS**
1. **Connection status display:**
   ```
   [XERO Logo] XERO Integration [🟢 Connected]
   
   Connected to: My Comedy Business
   Connected since: March 15, 2024
   Last sync: 2 hours ago
   
   [Disconnect XERO] [Sync Now] [Settings]
   ```

2. **Disconnect confirmation:**
   ```
   ⚠️ Disconnect XERO Integration?
   
   This will:
   • Stop automatic invoice syncing
   • Revoke access to your XERO account  
   • Require re-authentication to reconnect
   
   You can reconnect at any time.
   
   [Disconnect] [Cancel]
   ```

3. **Status indicators:**
   - 🟢 Connected (green)
   - 🔴 Disconnected (red)
   - 🟡 Connecting (yellow)
   - ⚠️ Error (orange)

## **🔗 INTEGRATION WORKFLOW**
1. **Disconnect process:**
   - User clicks "Disconnect XERO"
   - Confirmation dialog appears
   - User confirms disconnect
   - API call to revoke token
   - Local credentials cleared
   - Status updated to disconnected
   - Success message shown

2. **Reconnect process:**
   - User clicks "Connect to XERO"
   - OAuth flow initiated
   - User authenticates with XERO
   - Tokens stored securely
   - Status updated to connected
   - Success message shown

## **🧪 TESTING INSTRUCTIONS**
1. **Test disconnect functionality:**
   - Ensure XERO is connected first
   - Click "Disconnect XERO" button
   - Verify confirmation dialog appears
   - Click "Disconnect" to confirm
   - Verify status changes to "Disconnected"

2. **Test reconnect functionality:**
   - After disconnect, click "Connect to XERO"
   - Complete OAuth flow
   - Verify connection restored
   - Check that sync functionality works

3. **Test error scenarios:**
   - Network failure during disconnect
   - Invalid token during disconnect
   - XERO API errors
   - Verify error messages are clear

4. **Test UI states:**
   - Connected state displays correctly
   - Disconnected state displays correctly
   - Loading states during operations
   - Error states with retry options

## **📋 DEFINITION OF DONE**
- [ ] "Disconnect" button visible when XERO connected
- [ ] Confirmation dialog before disconnect
- [ ] XERO token properly revoked
- [ ] Status updates to "Disconnected"
- [ ] Reconnection option available
- [ ] Clear connection status display
- [ ] Error handling for disconnect failures
- [ ] Success/error notifications
- [ ] Secure credential management
- [ ] Mobile-friendly integration interface