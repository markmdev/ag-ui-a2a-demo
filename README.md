# 🌍 AG-UI + A2A Multi-Agent Communication Demo

A comprehensive demonstration of **Agent-to-Agent (A2A) communication** between different AI agent frameworks using the **AG-UI Protocol** and **A2A Middleware**.

## 🎯 What This Demonstrates

This demo showcases how **4 specialized agents** built with **different frameworks** seamlessly communicate via the A2A protocol:

### 🔗 LangGraph Agents (Python + OpenAI)

- **🗺️ Itinerary Agent** (Port 9001) - Creates day-by-day travel itineraries with activities

### ✨ ADK Agents (Python + Gemini)

- **💰 Budget Agent** (Port 9002) - Estimates travel costs and creates budget breakdowns
- **🍽️ Restaurant Agent** (Port 9003) - Recommends day-by-day meal plans (breakfast, lunch, dinner)
- **🌤️ Weather Agent** (Port 9005) - Provides weather forecasts and travel advice

### 🧭 Orchestrator

- **Orchestrator Agent** (Port 9000) - ADK with Gemini 2.5 Pro - Coordinates all agents via A2A middleware

### Key Features

✅ **4 Specialized Agents**: Travel planning with coordinated multi-agent workflow  
✅ **Multi-Framework**: 1 LangGraph + 3 ADK agents working together via A2A  
✅ **Orchestrator-Mediated**: Full UI visibility of all agent-to-agent communication  
✅ **A2A Protocol**: Real inter-agent communication with sequential coordination  
✅ **Structured JSON**: All agents return validated structured data  
✅ **Generative UI**: Weather forecasts and meal recommendations display as rich UI components  
✅ **Progressive Reveal**: Itinerary → Weather → Meals → Budget workflow  
✅ **Visual Message Flow**: See each agent interaction in real-time with color-coded messages  
✅ **AG-UI Protocol**: Standardized agent-UI communication  
✅ **Human-in-the-Loop**: Budget approval workflow demonstrates HITL patterns  
✅ **Production-Ready Code**: Well-documented for engineers learning A2A patterns

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│ Next.js UI (CopilotKit)                             │
│ - Multi-agent message visualization                 │
│ - Interactive chat interface                         │
│ - Generative UI (weather, itinerary, budget)         │
└────────────────┬─────────────────────────────────────┘
                 │ AG-UI Protocol (HTTP)
┌────────────────┴─────────────────────────────────────┐
│ A2A Middleware (@ag-ui/a2a-middleware)               │
│ - Wraps orchestrator with 4 A2A agents               │
│ - Routes messages sequentially                       │
│ - Adds send_message_to_a2a_agent tool                │
└──────┬───────────────────────────────────────────────┘
       │ A2A Protocol (sequential calls)
       │
       ├─────────► LangGraph Agent (Python + OpenAI)
       │           ├── Itinerary (9001)
       │           ├── Restaurant (9003)
       │
       │
       └─────────► ADK Agents (Python + Gemini)
                   ├── Weather (9005)
                   └── Budget (9002)
       ▲
       │ AG-UI Protocol
       │
┌──────┴──────────┐
│ Orchestrator    │  ← Coordinates all agent communication
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

This will start all 6 services in one terminal with **color-coded output**:

**Frontend:**

- 🌐 **UI** (cyan) - Next.js on `http://localhost:3000`

**Orchestrator:**

- 🧭 **Orch** (gray) - Orchestrator on `http://localhost:9000`

**LangGraph Agent (green):**

- 🗺️ **Itin** - Itinerary Agent on `http://localhost:9001`
- 🍽️ **Rest** - Restaurant Agent on `http://localhost:9003`

**ADK Agents (blue):**

- 🌤️ **Weather** - Weather Agent on `http://localhost:9005`
- 💰 **Budget** - Budget Agent on `http://localhost:9002`

All running concurrently with color-coded labels! 🎉

- **Green** = LangGraph agent (Python + OpenAI)
- **Blue** = ADK agents (Python + Gemini)
- **Gray** = Orchestrator
- **Cyan** = UI

> **Note:** The first time you run this, make sure you've installed Python dependencies (step 2)

## 🎮 Try It Out

Ask the AI travel assistant:

- **"Plan a 3-day trip to Tokyo"**
- **"I want to visit New York for 5 days"**

### What Happens:

**Standard Workflow** (e.g., "Plan a 3-day trip to Tokyo"):

1. ✈️ **Trip Requirements** - Form collects destination, days, people, budget level (HITL)
2. 🧭 **Orchestrator** analyzes requirements and coordinates agent calls
3. 🗺️ **Itinerary Agent** (LangGraph + OpenAI) creates day-by-day plan with activities
   - Meals section shows "Loading..." initially
4. 🌤️ **Weather Agent** (ADK + Gemini) provides forecast and travel advice
   - Displays as generative UI in both chat and main panel
5. 🍽️ **Restaurant Agent** (ADK + Gemini) recommends day-by-day meals
   - Breakfast, lunch, dinner for each day
   - Automatically populates the meals section in the itinerary
6. 💰 **Budget Agent** (ADK + Gemini) estimates total costs based on all requirements
7. ✅ **User Approval** - You approve the budget (Human-in-the-Loop)
8. 📊 Complete travel plan displayed with weather, itinerary, meals, and budget

**Progressive Reveal:**

- First, you see the itinerary with empty meals
- Then weather forecast appears
- Then meals populate in the itinerary
- Finally, budget appears and awaits approval

All agent interactions are visible in the UI with color-coded messages!

## 📁 Project Structure

```
ag-ui-adk-demo-v2/
├── app/                              # Next.js App Router
│   ├── api/copilotkit/
│   │   └── route.ts                  # A2A middleware setup (4 agents) ⭐
│   ├── page.tsx                      # Main page with 4-agent legend
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Base styles
│
├── components/                       # Frontend components
│   ├── types/
│   │   └── index.ts                  # Shared TypeScript types ⭐
│   ├── a2a/
│   │   ├── MessageToA2A.tsx          # Outgoing A2A messages ⭐
│   │   ├── MessageFromA2A.tsx        # Incoming A2A messages ⭐
│   │   └── agent-styles.ts           # Agent styling utilities
│   ├── forms/
│   │   └── TripRequirementsForm.tsx  # HITL trip requirements ⭐
│   ├── hitl/
│   │   └── BudgetApprovalCard.tsx    # HITL budget approval ⭐
│   ├── travel-chat.tsx               # Main chat orchestration ⭐
│   ├── ItineraryCard.tsx             # Itinerary display with meals
│   ├── BudgetBreakdown.tsx           # Budget display
│   ├── WeatherCard.tsx               # Weather generative UI ⭐
│   └── style.css                     # Component styles + animations
│
├── lib/
│   ├── a2a-middleware.ts             # Fixed A2A middleware ⭐
│   └── a2a-middleware-utils.ts       # Middleware utilities
│
├── agents/                           # Python agents (5 total)
│   ├── orchestrator.py               # ADK orchestrator (9000) ⭐
│   │
│   ├── # LangGraph Agents (Python + OpenAI)
│   ├── itinerary_agent.py            # Itinerary planning (9001) ⭐
│   ├── restaurant_agent.py           # Restaurant recommendations (9003) ⭐
│   │
│   ├── # ADK Agents (Python + Gemini)
│   ├── budget_agent.py               # Budget estimation (9002) ⭐
│   ├── weather_agent.py              # Weather forecasts (9005) ⭐
│   │
│   └── requirements.txt              # Python dependencies
│
├── package.json
├── .env.example
└── README.md
```

⭐ = Key files demonstrating multi-agent A2A communication patterns

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

Check that all 5 services are running:

```bash
# Orchestrator
curl http://localhost:9000

# LangGraph Agent
curl http://localhost:9001  # Itinerary

# ADK Agents
curl http://localhost:9002  # Budget
curl http://localhost:9003  # Restaurant
curl http://localhost:9005  # Weather
```

### "GOOGLE_API_KEY not set"?

Make sure `.env` has your Google API key for ADK agents:

```bash
export GOOGLE_API_KEY="your-key-here"
```

### "OPENAI_API_KEY not set"?

Make sure `.env` has your OpenAI key for LangGraph agents:

```bash
export OPENAI_API_KEY="your-key-here"
```

### Frontend can't reach agents?

Check that agent URLs in `.env` match where agents are running:

```env
# Orchestrator
ORCHESTRATOR_URL=http://localhost:9000

# LangGraph Agent
ITINERARY_AGENT_URL=http://localhost:9001

# ADK Agents
BUDGET_AGENT_URL=http://localhost:9002
RESTAURANT_AGENT_URL=http://localhost:9003
WEATHER_AGENT_URL=http://localhost:9005
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

## 🤝 What's Been Demonstrated

This demo showcases:

- ✅ **4 Specialized Agents**: Focused multi-agent architecture with clear workflows
- ✅ **Multi-Framework Integration**: 1 LangGraph + 3 ADK agents
- ✅ **Orchestrator-Mediated A2A**: Full UI visibility of agent communication
- ✅ **Structured JSON Outputs**: All agents return validated data structures
- ✅ **Generative UI**: WeatherCard displays as rich UI component in chat and main panel
- ✅ **Progressive Data Reveal**: Itinerary → Weather → Meals → Budget workflow
- ✅ **Human-in-the-Loop**: Budget approval workflow
- ✅ **Sequential Coordination**: Agents called one-at-a-time with context passing
- ✅ **Production Patterns**: Well-documented, clean code

## 🚀 Ideas to Extend Further

- **Direct Peer-to-Peer**: Enable agents to call each other without orchestrator
- **Agent Memory**: Add persistent memory across sessions
- **More UI Components**: Custom visualizations for weather, activities, etc.
- **Advanced Workflows**: Conditional agent routing based on user preferences
- **Real API Integration**: Connect to actual travel APIs (Google Places, OpenWeather, etc.)
- **Multi-User Support**: Session management for multiple concurrent users

## 📄 License

MIT

---

Built with ❤️ to demonstrate the power of agent interoperability through A2A and AG-UI protocols.
