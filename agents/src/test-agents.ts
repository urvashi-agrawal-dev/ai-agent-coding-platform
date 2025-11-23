import { DebuggerAgent } from './debugger-agent';
import { ArchitectAgent } from './architect-agent';
import { AgentRequest, AgentType } from '../../shared/src/types';

async function testAgents() {
    console.log("Testing Debugger Agent...");
    const debuggerAgent = new DebuggerAgent();
    const debugRequest: AgentRequest = {
        agentType: AgentType.DEBUGGER,
        code: "function test() { console.log(x); }", // ReferenceError
        context: { language: 'javascript' }
    };

    try {
        const debugResponse = await debuggerAgent.process(debugRequest);
        console.log("Debugger Response:", JSON.stringify(debugResponse, null, 2));
    } catch (error) {
        console.error("Debugger Agent failed:", error);
    }

    console.log("\nTesting Architect Agent...");
    const architectAgent = new ArchitectAgent();
    const architectRequest: AgentRequest = {
        agentType: AgentType.ARCHITECT,
        code: "import express from 'express'; const app = express();",
        projectFiles: [
            { path: 'server.ts', content: "import express from 'express'; const app = express();", language: 'typescript' }
        ]
    };

    try {
        const architectResponse = await architectAgent.process(architectRequest);
        console.log("Architect Response:", JSON.stringify(architectResponse, null, 2));
    } catch (error) {
        console.error("Architect Agent failed:", error);
    }
}

testAgents();
