# DevMentor-360 🤖

> AI-Powered Multi-Agent Development Platform with Real-Time Code Execution

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)

## 🌟 Features

### 🤖 Multi-Agent AI System
- **Architect Agent** - Analyzes code architecture, detects patterns, finds design flaws
- **Debugger Agent** - Runs code in sandbox, captures stack traces, explains bugs in plain English
- **Reviewer Agent** - Performs code review, suggests improvements, checks best practices
- **Tester Agent** - Generates Jest unit tests automatically, runs tests, reports coverage
- **Productivity Agent** - Auto-generates documentation, creates README files, generates diagrams

### 💻 Multi-Language Code Execution
- **JavaScript** (Node.js VM)
- **Python** (subprocess execution)
- **Java** (javac + java runtime)
- **C** (gcc compiler)
- **C++** (g++ compiler)
- Safe sandbox execution with 30-second timeout
- Real-time output and error capture
- Stdin/Stdout support

### 🎨 Modern UI Features
- **Monaco Code Editor** with syntax highlighting
- **Tailwind CSS** dark theme dashboard
- **Real-time execution output** panel
- **Project save/load** functionality
- **Voice Assistant** with Web Speech API
- **Test results visualization** with coverage metrics
- **Bug trace viewer** with root cause analysis
- **Architecture diagrams** with Mermaid
- **Documentation generator** with downloadable files

### 🔧 Developer Tools
- **File Management** - Upload project folders, manage files
- **Testing Engine** - Jest integration with auto-fix
- **Debug Reports** - Real-time debugging with suggestions
- **Documentation** - Auto-generate README, API docs, function summaries
- **Diagrams** - Architecture, flow, class, and sequence diagrams

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Python 3.x (for Python execution)
- Java JDK (for Java execution)
- GCC/G++ (for C/C++ execution)

### Installation

```bash
# Clone the repository
git clone https://github.com/urvashi-agrawal-dev/ai-agent-coding-platform.git
cd ai-agent-coding-platform

# Install dependencies
npm install

# Start development servers
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

### Environment Setup

Create `.env` files:

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
SANDBOX_TIMEOUT=30000
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

## 📁 Project Structure

```
DevMentor-360/
├── frontend/              # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API services
│   │   └── Dashboard.tsx # Main application
│   └── tailwind.config.js
├── backend/              # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   └── index.ts      # Server entry point
│   └── tsconfig.json
├── agents/               # AI Agent implementations
│   └── src/
│       ├── architect-agent.ts
│       ├── debugger-agent.ts
│       ├── reviewer-agent.ts
│       ├── tester-agent.ts
│       └── productivity-agent.ts
├── shared/               # Shared TypeScript types
│   └── src/types.ts
└── package.json          # Workspace configuration
```

## 🎯 Usage

### 1. Code Execution
1. Write code in the Monaco editor
2. Select language (JavaScript, Python, Java, C, C++)
3. Click **Run Code**
4. View output, errors, and execution time

### 2. AI Agent Analysis
- Click on any AI agent button in the sidebar
- View analysis results in the right panel
- Get suggestions and recommendations

### 3. Save/Load Projects
- Click **Save** to store your project
- Click **Load** to browse and load saved projects
- Projects are stored locally in `.storage/projects.json`

### 4. Generate Tests
1. Navigate to **Tests** tab
2. Click **Generate Tests**
3. View auto-generated Jest test cases
4. Run tests and see coverage report

### 5. Debug Code
1. Navigate to **Bugs** tab
2. Click **Analyze**
3. View stack traces and root cause analysis
4. Get fix suggestions with confidence scores

### 6. Generate Documentation
1. Navigate to **Docs** tab
2. Enter project name
3. Click **Generate**
4. Download README.md and API documentation

## 🛠️ API Endpoints

### Code Execution
```
POST /api/code/execute
Body: { code, language, input?, timeout? }
Response: { success, output, error, executionTime, language }
```

### Project Management
```
POST /api/project/save
Body: { id?, name, code, language }

GET /api/project/load/:id
GET /api/project/list
DELETE /api/project/delete/:id
```

### AI Agents
```
POST /api/agents/execute
Body: { agentType, code, context?, projectFiles? }

GET /api/agents/status
```

### Testing
```
POST /api/tests/generate
POST /api/tests/run
POST /api/tests/full-cycle
```

### Debugging
```
POST /api/debug/analyze
Body: { code, language, autoFix }

POST /api/debug/apply-patch
```

## 🧪 Testing

```bash
# Run backend tests
npm run test --workspace=backend

# Run frontend tests
npm run test --workspace=frontend

# Run all tests
npm test
```

## 🏗️ Architecture

### Frontend Architecture
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Monaco Editor** for code editing
- **Axios** for API calls
- **React Icons** for UI icons

### Backend Architecture
- **Express.js** with TypeScript
- **Multi-agent orchestration** system
- **Sandbox code execution** with child processes
- **File-based storage** for projects
- **WebSocket** support for real-time updates

### Agent System
Each agent implements the `Agent` interface:
```typescript
interface Agent {
  process(request: AgentRequest): Promise<AgentResponse>;
}
```

## 🔒 Security

- **Sandbox Execution**: Code runs in isolated processes
- **Timeout Protection**: 30-second execution limit
- **Input Validation**: All inputs are validated
- **File System Isolation**: Temp files are cleaned up
- **CORS Protection**: Configured for localhost only

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Urvashi Agrawal** - [urvashi-agrawal-dev](https://github.com/urvashi-agrawal-dev)

## 🙏 Acknowledgments

- Monaco Editor by Microsoft
- Tailwind CSS for the beautiful UI
- React Icons for the icon library
- All open-source contributors

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ using React, TypeScript, and Node.js**
