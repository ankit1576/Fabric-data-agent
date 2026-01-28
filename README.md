# Fabric Data Agent UI

A ChatGPT-style conversational web application integrated with **Microsoft Fabric Data Agent**. This application provides an intuitive interface for querying your data using natural language, powered by Microsoft Fabric's AI capabilities.

![Fabric Data Agent UI](https://img.shields.io/badge/Microsoft-Fabric-0066CC?style=for-the-badge&logo=microsoft)
![Python](https://img.shields.io/badge/Python-3.9+-blue?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)

---

## 🎯 Core Objective

Build a **real agent execution viewer** that:
- Sends user queries directly to Microsoft Fabric Data Agent via SDK
- Executes queries inside Fabric
- Returns raw execution JSON (exactly as provided by Fabric)
- Renders responses with expandable execution details (steps + queries)

**This is NOT a mock or simulation** - all queries are executed in real-time against your Fabric environment.

---

## ✨ Features

### 🗨️ ChatGPT-Style Interface
- Clean, professional chat UI with user messages on right, agent on left
- Scrollable conversation history
- Fixed input box at bottom with Enter-to-send functionality
- Real-time loading indicators

### 🤖 Agent Response Block
Each agent message contains:

**1. Final Answer Section (Always Visible)**
- Displays the final response text from Fabric
- Clean, business-friendly presentation
- No technical jargon in main view

**2. Execution Details Section (Collapsible)**
- **View execution details** toggle
- Expands to show:
  - **Execution Steps**: Step-by-step breakdown of agent actions
  - **Executed Queries**: Actual DAX/SQL queries run by Fabric
  - **Syntax Highlighting**: Monospace font with proper formatting
  - **Copy-to-Clipboard**: One-click query copying

### 🎨 Design
- **Assurant-Inspired Theme**: Professional blue color scheme (#0066CC primary)
- **Light Mode**: Clean, modern aesthetic
- **Responsive**: Works on desktop and mobile
- **Smooth Animations**: Micro-interactions for better UX

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌────────────────────┐
│                 │         │                  │         │                    │
│  React Frontend │────────▶│  FastAPI Backend │────────▶│  Microsoft Fabric  │
│   (Port 3000)   │         │   (Port 8001)    │         │    Data Agent      │
│                 │◀────────│                  │◀────────│                    │
└─────────────────┘         └──────────────────┘         └────────────────────┘
     Chat UI              Thin Proxy Layer          Real Execution Engine
```

### Backend (Python/FastAPI)
- **Thin Proxy**: No summarization, no inference, no JSON reshaping
- **Fabric SDK Integration**: Uses `fabric_data_agent_client.py`
- **Single Endpoint**: `POST /api/execute`
- **Raw Response**: Returns unaltered Fabric JSON

### Frontend (React)
- **Dynamic Rendering**: Schema-tolerant UI
- **Smart Parsing**: Extracts DAX/SQL from execution steps
- **Error Handling**: Graceful fallbacks for missing data

---

## 🚀 Getting Started

### Prerequisites

1. **Azure Tenant with Fabric Access**
   - Active Microsoft Fabric subscription
   - Published Fabric Data Agent URL
   - Appropriate permissions

2. **Python 3.9+**
3. **Node.js 16+** and **Yarn**

### Configuration

Edit `/app/backend/.env`:

```env
# Microsoft Fabric Configuration
TENANT_ID="your-azure-tenant-id"
DATA_AGENT_URL="your-fabric-data-agent-url"

# MongoDB (optional - not used for Fabric integration)
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"

# CORS
CORS_ORIGINS="*"
```

**Important**: 
- `TENANT_ID`: Your Azure Active Directory tenant ID
- `DATA_AGENT_URL`: The published URL of your Fabric Data Agent

### Running the Application

Services are managed by **Supervisor**:

```bash
# Check status
sudo supervisorctl status

# Restart services
sudo supervisorctl restart backend frontend

# View logs
tail -f /var/log/supervisor/backend.*.log
tail -f /var/log/supervisor/frontend.*.log
```

**Access the application**:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8001/api`

---

## 🔐 Authentication Flow

1. **First Run**: When you send your first query, the backend will:
   - Open your default browser
   - Prompt for Microsoft account sign-in
   - Request Fabric access permissions

2. **Token Management**:
   - Tokens are automatically obtained and cached
   - Auto-refresh before expiration
   - No manual token handling required

---

## 📡 API Endpoints

### `POST /api/execute`

Execute a query against the Fabric Data Agent.

**Request**:
```json
{
  "prompt": "How many disbursements are there in total?",
  "thread_name": "optional-thread-id"
}
```

**Response**: Raw Fabric JSON with execution details

### `GET /api/health`

Health check endpoint.

---

## 🛠️ Troubleshooting

### Authentication Fails
- Verify `TENANT_ID` in `.env`
- Ensure your account has Fabric access
- Check firewall/proxy settings

### Agent Not Responding
- Verify `DATA_AGENT_URL` is correct
- Check Data Agent is published and running
- Review backend logs

### No Execution Details Shown
- This is normal if Fabric doesn't return step details
- UI only shows what Fabric provides

---

## 📚 Key Dependencies

### Backend
- `fastapi==0.110.1`
- `azure-identity>=1.15.0`
- `openai>=1.12.0`

### Frontend
- `react@19.0.0`
- `axios@1.8.4`
- `sonner@2.0.7` (toast notifications)
- `@radix-ui/*` (UI components)

---

## 📝 Technical Notes

### JSON Handling
- UI is **schema-tolerant** - no fixed structure assumed
- Safely traverses Fabric response JSON
- Only renders fields that exist

### Query Extraction
DAX/SQL queries extracted from step outputs using regex patterns for ```dax and ```sql code blocks.

---

## 📄 License

Provided as-is for educational purposes. Comply with Microsoft's terms of service when using Fabric Data Agents.

---

**Built with ❤️ using React, FastAPI, and Microsoft Fabric**
