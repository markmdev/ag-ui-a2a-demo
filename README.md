# 🌍 AG-UI + A2A Communication Demo

A demonstration of **Agent-to-Agent (A2A) communication** between different AI agent frameworks using the **AG-UI Protocol** and **A2A Middleware**.

## 🎯 What This Demonstrates

This demo showcases how agents built with **different frameworks** can seamlessly communicate via the A2A protocol:

- **🧭 Orchestrator Agent**: Google ADK with Gemini 2.0 (Python) - Uses AG-UI Protocol
- **🗺️ Itinerary Agent**: LangGraph with OpenAI (Python) - Uses A2A Protocol
- **💰 Budget Agent**: Google ADK with Gemini 2.0 (Python) - Uses A2A Protocol

### Key Features

✅ **A2A Protocol**: Real agent-to-agent communication across frameworks
✅ **Visual Message Flow**: See agents communicate in real-time with color-coded messages
✅ **Multi-Framework**: ADK ↔ LangGraph via A2A
✅ **Structured Data**: JSON responses for beautiful UI rendering
✅ **AG-UI Protocol**: Standardized agent-UI communication
✅ **Production-Ready Code**: Well-documented for engineers learning A2A patterns

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│ Next.js UI (CopilotKit)                │
│ - A2A message visualization             │
│ - Interactive chat interface            │
└────────────┬────────────────────────────┘
             │ AG-UI Protocol (HTTP)
┌────────────┴────────────────────────────┐
│ A2A Middleware (@ag-ui/a2a-middleware)  │
│ - Wraps orchestrator                    │
│ - Routes A2A messages                   │
│ - Adds send_message_to_a2a_agent tool   │
└────────┬─────────────────┬──────────────┘
         │ A2A Protocol    │ A2A Protocol
┌────────┴────────┐ ┌─────┴──────────────┐
│ Itinerary Agent │ │ Budget Agent       │
│ (LangGraph)     │ │ (ADK/Gemini)       │
│ Port 9001       │ │ Port 9002          │
└─────────────────┘ └────────────────────┘
         ↑
         │ AG-UI Protocol
┌────────┴────────┐
│ Orchestrator    │
│ (ADK/Gemini)    │
│ Port 9000       │
└─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **Google API Key** ([Get one here](https://aistudio.google.com/app/apikey))
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Install Python Dependencies

```bash
cd agents
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Set Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your API keys
nano .env  # or use your preferred editor
```

Required keys:
- `GOOGLE_API_KEY`: For ADK agents (orchestrator + budget)
- `OPENAI_API_KEY`: For LangGraph itinerary agent

### 4. Start Everything with One Command! 🚀

```bash
npm run dev
```

This will start:
- 🌐 **Next.js UI** on `http://localhost:3000`
- 🧭 **Orchestrator Agent** on `http://localhost:9000` (ADK + AG-UI)
- 🗺️ **Itinerary Agent** on `http://localhost:9001` (LangGraph + A2A)
- 💰 **Budget Agent** on `http://localhost:9002` (ADK + A2A)

All in one terminal with color-coded output! 🎉

> **Note:** The first time you run this, make sure you've installed Python dependencies (step 2)

## 🎮 Try It Out

Ask the AI travel assistant:

- **"Plan a 3-day trip to Tokyo"**
- **"Create an itinerary for Paris and tell me the budget"**
- **"I want to visit New York for 5 days"**

Watch as:
1. 🧭 **Orchestrator** receives your request and announces which agents it will contact
2. 🗺️ **Itinerary Agent** creates a day-by-day plan using LangGraph
3. 💰 **Budget Agent** estimates costs using ADK/Gemini
4. 📊 Results displayed in beautiful, interactive UI with A2A message visualization

## 📁 Project Structure

```
ag-ui-adk-demo-v2/
├── app/                          # Next.js App Router
│   ├── api/copilotkit/
│   │   └── route.ts              # A2A middleware setup ⭐
│   ├── page.tsx                  # Main page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Styles + animations
├── components/
│   └── travel-chat.tsx           # Chat with A2A visualizations ⭐
├── agents/                       # Python agents
│   ├── orchestrator.py           # ADK orchestrator (port 9000) ⭐
│   ├── itinerary_agent.py        # LangGraph agent (port 9001) ⭐
│   ├── budget_agent.py           # ADK budget agent (port 9002) ⭐
│   └── requirements.txt
├── package.json
├── .env.example
└── README.md
```

⭐ = Key files demonstrating A2A communication

## 🔧 Key Technologies

### Frontend
- **Next.js 15**: React framework with App Router
- **CopilotKit**: AI UI components for chat interface
- **AG-UI Client**: Protocol implementation
- **Tailwind CSS**: Styling and animations

### Backend
- **Google ADK**: Agent framework using Gemini 2.0
- **LangGraph**: Graph-based agent framework with OpenAI
- **A2A Protocol**: Agent-to-agent communication standard
- **AG-UI Protocol**: Agent-UI communication standard
- **FastAPI**: Python web framework (via uvicorn)

### Middleware
- **@ag-ui/a2a-middleware**: Bridges AG-UI ↔ A2A protocols

## 🎨 Features in Detail

### A2A Message Visualization

The UI shows real-time agent communication:
- 🟢 **Green boxes**: Messages sent TO A2A agents
- 🔵 **Blue boxes**: Responses FROM A2A agents
- **Color-coded badges**:
  - 🟣 Purple: Itinerary Agent (LangGraph)
  - 🔵 Blue: Budget Agent (ADK)
  - ⚪ Gray: Orchestrator

### How It Works

1. **Frontend** (`app/api/copilotkit/route.ts`):
   - Creates `HttpAgent` wrapper around orchestrator
   - Creates `A2AMiddlewareAgent` that connects orchestrator to A2A agents
   - Middleware automatically adds `send_message_to_a2a_agent` tool

2. **Orchestrator** (`agents/orchestrator.py`):
   - Simple ADK agent exposed via AG-UI Protocol
   - Receives `send_message_to_a2a_agent` tool from middleware
   - Uses this tool to communicate with A2A agents

3. **A2A Agents** (`agents/itinerary_agent.py`, `agents/budget_agent.py`):
   - Expose A2A Protocol endpoints
   - Receive messages via A2A Protocol
   - Return structured JSON responses

4. **Middleware Magic**:
   - Intercepts `send_message_to_a2a_agent` tool calls
   - Routes them to appropriate A2A agents
   - Returns responses back to orchestrator
   - UI visualizes all message flow

## 🐛 Troubleshooting

### Agents not connecting?

Check that all 3 agents are running:
```bash
curl http://localhost:9000  # Orchestrator
curl http://localhost:9001  # Itinerary
curl http://localhost:9002  # Budget
```

### "GOOGLE_API_KEY not set"?

Make sure `.env` has your Google API key:
```bash
export GOOGLE_API_KEY="your-key-here"
```

### Frontend can't reach agents?

Check that agent URLs in `.env` match where agents are running:
```env
ORCHESTRATOR_URL=http://localhost:9000
ITINERARY_AGENT_URL=http://localhost:9001
BUDGET_AGENT_URL=http://localhost:9002
```

### Python dependencies issue?

Make sure you're in the virtual environment:
```bash
cd agents
source .venv/bin/activate
pip install -r requirements.txt
```

## 📚 Learn More

- [AG-UI Protocol Docs](https://docs.ag-ui.com)
- [A2A Protocol Spec](https://github.com/agent-matrix/a2a)
- [Google ADK Docs](https://google.github.io/adk-docs/)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [CopilotKit Docs](https://docs.copilotkit.ai)

## 🎯 Purpose

This demo is designed for engineers learning about:
- **A2A Protocol**: Inter-agent communication patterns
- **AG-UI Protocol**: Agent-UI standardization
- **Multi-Framework Integration**: How ADK and LangGraph can work together
- **Production Patterns**: Well-documented, clean code for real-world use

## 🤝 Next Steps

Ideas to extend this demo:
- Add more A2A agents (hotels, flights, activities)
- Implement Human-in-the-Loop (HITL) components
- Add more sophisticated LangGraph workflows
- Create custom UI components for structured data
- Add agent state management and memory

## 📄 License

MIT

---

Built with ❤️ to demonstrate the power of agent interoperability through A2A and AG-UI protocols.
