# Power BI Embedded Integration Guide

The Stock Intelligence Platform implements secure token generation using **Microsoft Power BI Embedded** and Azure Active Directory (AAD) Client Credentials Flow.

## Step-by-Step Configuration

### 1. Azure AD App Registration
1. Sign in to the [Azure Portal](https://portal.azure.com/).
2. Select **Microsoft Entra ID** (Active Directory) -> **App registrations** -> **New registration**.
3. Set name, select accounts type, and click **Register**.
4. Save the **Application (client) ID** and **Directory (tenant) ID**.
5. Under **Certificates & secrets**, generate a new client secret and save the **Secret Value**.

### 2. Configure Power BI Tenant settings
1. Sign in to the [Power BI Admin Portal](https://app.powerbi.com/).
2. Navigate to **Tenant Settings** -> **Developer settings**:
   - Enable **Embed content in apps**.
   - Enable **Allow service principals to use Power BI APIs**. Assign to specific security groups containing your Azure App Client ID.

### 3. Assign Workspace Permissions
1. Open the Power BI Workspace hosting your target reports.
2. Click **Manage access** and add your Azure AD App name as a **Member** or **Admin**.

### 4. Configure Environment Variables
Set the Azure AD keys inside your `.env` variables:
```env
POWERBI_TENANT_ID="your-azure-tenant-id"
POWERBI_CLIENT_ID="your-azure-client-id"
POWERBI_CLIENT_SECRET="your-azure-client-secret"
POWERBI_WORKSPACE_ID="your-powerbi-workspace-id"
POWERBI_REPORT_ID="your-powerbi-report-id"
```
If these variables are omitted during development, the platform runs in a sandbox mode returning visual indicators.
