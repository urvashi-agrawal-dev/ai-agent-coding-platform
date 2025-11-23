import { ArchitectAgent } from './architect-agent';
import { AgentRequest, AgentType } from '../../shared/src/types';
import * as fs from 'fs';
import * as path from 'path';

async function generateArchitecture() {
    console.log("Generating Architecture Diagram...");
    const agent = new ArchitectAgent();

    // Read key files to analyze
    const files = [
        'agents/src/architect-agent.ts',
        'agents/src/debugger-agent.ts',
        'agents/src/reviewer-agent.ts',
        'agents/src/tester-agent.ts',
        'agents/src/services/llm.service.ts',
        'backend/src/index.ts',
        'frontend/src/App.tsx'
    ].map(filePath => {
        const fullPath = path.join(process.cwd(), '../', filePath);
        return {
            path: filePath,
            content: fs.readFileSync(fullPath, 'utf-8'),
            language: 'typescript'
        };
    });

    const request: AgentRequest = {
        agentType: AgentType.ARCHITECT,
        code: '',
        projectFiles: files
    };

    try {
        const response = await agent.process(request);
        const analysis = response.data;

        const diagram = `
graph TD
    subgraph Frontend
        App[App.tsx]
        Components[Components]
    end

    subgraph Backend
        API[API Routes]
        Orchestrator[Agent Orchestrator]
    end

    subgraph Agents
        LLM[LLM Service]
        Arch[Architect Agent]
        Debug[Debugger Agent]
        Review[Reviewer Agent]
        Test[Tester Agent]
    end

    subgraph AWS
        Bedrock[AWS Bedrock]
        Claude[Claude 3.5 Sonnet]
    end

    App --> API
    API --> Orchestrator
    Orchestrator --> Arch
    Orchestrator --> Debug
    Orchestrator --> Review
    Orchestrator --> Test
    
    Arch --> LLM
    Debug --> LLM
    Review --> LLM
    Test --> LLM
    
    LLM --> Bedrock
    Bedrock --> Claude
`;

        console.log("\nGenerated Mermaid Diagram:");
        console.log(diagram);

        // Save to file
        fs.writeFileSync('architecture_diagram.mermaid', diagram);
        console.log("\nSaved to architecture_diagram.mermaid");

    } catch (error) {
        console.error("Failed to generate architecture:", error);
    }
}

generateArchitecture();
