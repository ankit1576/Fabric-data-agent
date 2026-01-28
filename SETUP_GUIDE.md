# 🔧 Setup Guide - Microsoft Fabric Data Agent Integration

This guide will help you configure your application to connect with Microsoft Fabric Data Agent.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Microsoft Azure account with active subscription
- [ ] Access to Microsoft Fabric workspace
- [ ] Published Fabric Data Agent (with URL)
- [ ] Appropriate permissions in your Azure tenant
- [ ] Python 3.9+ installed
- [ ] Node.js 16+ and Yarn installed

---

## 🔑 Step 1: Get Your Azure Tenant ID

### Method 1: Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Search for **"Azure Active Directory"** or **"Microsoft Entra ID"**
3. In the Overview page, find **Tenant ID**
4. Copy the GUID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Method 2: Azure CLI
```bash
az account show --query tenantId -o tsv
```

### Method 3: PowerShell
```powershell
(Get-AzContext).Tenant.Id
```

---

## 🔗 Step 2: Get Your Fabric Data Agent URL

### From Microsoft Fabric Workspace:

1. Go to your [Microsoft Fabric workspace](https://app.fabric.microsoft.com/)
2. Navigate to your Data Agent
3. Click on **"Settings"** or **"Publish"**
4. Copy the **Published URL** (format: `https://api.fabric.microsoft.com/v1/workspaces/{workspace-id}/dataagents/{agent-id}`)

**Example URL format**:
```
https://api.fabric.microsoft.com/v1/workspaces/abc123-def456/dataagents/agent789
```

---

## ⚙️ Step 3: Configure Environment Variables

Edit the file `/app/backend/.env`:

```bash
# Open the file
nano /app/backend/.env
# or
vim /app/backend/.env
```

Update these values:

```env
# ========================================
# MICROSOFT FABRIC CONFIGURATION
# ========================================

# Your Azure Active Directory Tenant ID
# Find it in Azure Portal > Azure Active Directory > Overview
TENANT_ID="PUT-YOUR-TENANT-ID-HERE"

# Your published Fabric Data Agent URL
# Format: https://api.fabric.microsoft.com/v1/workspaces/{workspace-id}/dataagents/{agent-id}
DATA_AGENT_URL="PUT-YOUR-DATA-AGENT-URL-HERE"

# ========================================
# OTHER SETTINGS (keep as-is)
# ========================================

MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
```

### Example Configuration:
```env
TENANT_ID="12345678-1234-1234-1234-123456789abc"
DATA_AGENT_URL="https://api.fabric.microsoft.com/v1/workspaces/abc123/dataagents/agent456"
```

---

## 🔒 Step 4: Set Up Authentication

The application uses **Interactive Browser Authentication** (Microsoft MSAL).

### First Time Setup:

1. **Start the backend service**:
```bash
sudo supervisorctl restart backend
```

2. **Send your first query** through the UI at `http://localhost:3000`

3. **Browser will automatically open** with Microsoft sign-in page

4. **Sign in** with your Microsoft account that has Fabric access

5. **Grant permissions** when prompted:
   - Microsoft Fabric API access
   - User profile read

6. **Authentication complete** - token is cached automatically

### Subsequent Queries:

- Token is stored and auto-refreshed
- No need to sign in again unless token expires (default: 1 hour)
- Re-authentication happens automatically in background

---

## ✅ Step 5: Verify Installation

### Test Backend Connection:

```bash
# Test health endpoint
curl http://localhost:8001/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Fabric Data Agent API"
}
```

### Test Frontend:

1. Open browser: `http://localhost:3000`
2. You should see the welcome screen
3. Try an example query: **"What data is available?"**
4. First query will trigger authentication

---

## 🐛 Troubleshooting

### Issue: "TENANT_ID must be set in environment variables"

**Solution**:
- Check that `.env` file exists in `/app/backend/`
- Verify `TENANT_ID` is not empty
- Restart backend: `sudo supervisorctl restart backend`

### Issue: "No assistants found"

**Solution**:
- Verify your `DATA_AGENT_URL` is correct
- Ensure the Data Agent is **published** in Fabric workspace
- Check that your account has access to the workspace

### Issue: Browser doesn't open for authentication

**Solution**:
- Check if you're in a headless environment (e.g., SSH without X11 forwarding)
- Enable X11 forwarding: `ssh -X user@host`
- Or use device code flow (requires code modification)

### Issue: "Authentication failed"

**Solution**:
- Verify your Microsoft account has Fabric access
- Check tenant ID is correct
- Ensure Fabric subscription is active
- Try clearing browser cookies and retry

### Issue: Timeout errors

**Solution**:
- Check network connectivity to `api.fabric.microsoft.com`
- Verify firewall/proxy settings
- Increase timeout in backend (default: 120s)

---

## 📊 Testing Your Setup

### Sample Queries to Try:

Once authenticated, test with these queries:

1. **Basic Info Query**:
   ```
   What data is available?
   ```

2. **Count Query** (if you have disbursement data):
   ```
   How many disbursements are there in total?
   ```

3. **Aggregation Query**:
   ```
   Show me the top 5 records
   ```

4. **Time-based Query**:
   ```
   Analyze trends over the last 12 months
   ```

### Expected Behavior:

✅ Query appears in chat as user message (right side)
✅ Loading indicator shows while processing
✅ Agent response appears (left side) with:
   - Final answer text
   - "View execution details" button
✅ Clicking execution details shows:
   - Execution status badge
   - List of execution steps
   - Executed DAX/SQL queries (if any)
✅ Copy button works for queries

---

## 🔄 Updating Configuration

If you need to change Fabric Data Agent or Tenant:

1. Stop the backend:
```bash
sudo supervisorctl stop backend
```

2. Update `/app/backend/.env`

3. Restart the backend:
```bash
sudo supervisorctl start backend
```

4. Clear browser cache/cookies (for fresh auth)

5. Test with a new query

---

## 📝 Important Notes

### Security:
- Never commit `.env` file to version control
- Keep your Tenant ID and Data Agent URL private
- Tokens are cached in memory only (not persisted)

### Permissions:
- Your Azure account must have:
  - Read access to Fabric workspace
  - Permission to use Data Agent
  - Fabric capacity/license assigned

### Token Lifecycle:
- Default token lifetime: 1 hour
- Auto-refresh happens before expiration
- Manual re-auth only if refresh fails

---

## 🆘 Need Help?

### Check Logs:

**Backend logs**:
```bash
tail -f /var/log/supervisor/backend.*.log
```

**Frontend logs**:
```bash
tail -f /var/log/supervisor/frontend.*.log
```

### Common Log Messages:

✅ **"Authentication successful"** - Auth working correctly
✅ **"Assistant ID: asst_xxx"** - Connected to Data Agent
❌ **"Failed to initialize client"** - Check TENANT_ID and DATA_AGENT_URL
❌ **"Token refresh failed"** - Re-authentication required

---

## 📚 Additional Resources

- [Microsoft Fabric Documentation](https://learn.microsoft.com/en-us/fabric/)
- [Fabric Data Agent Client SDK](https://github.com/microsoft/fabric_data_agent_client)
- [Azure Identity Python SDK](https://learn.microsoft.com/en-us/python/api/azure-identity)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

---

## ✅ Setup Complete!

Once you've completed all steps above, your Fabric Data Agent UI should be fully operational.

🎉 **Happy querying!**

If you encounter any issues not covered here, check the main README.md troubleshooting section or review the backend logs for specific error messages.
