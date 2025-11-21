import { AgentRequest, AgentResponse } from '../../../shared/src/types';
import { ArchitectAgent } from '../../../agents/src/architect-agent';
import { DebuggerAgent } from '../../../agents/src/debugger-agent';
import { ReviewerAgent } from '../../../agents/src/reviewer-agent';
import { TesterAgent } from '../../../agents/src/tester-agent';
import { ProductivityAgent } from '../../../agents/src/productivity-agent';

interface Agent {
  process(request: AgentRequest): Promise<AgentResponse>;
}

export class AgentOrchestrator {
  private agents: Record<string, Agent>;

  constructor() {
    this.agents = {
      architect: new ArchitectAgent(),
      debugger: new DebuggerAgent(),
      reviewer: new ReviewerAgent(),
      tester: new TesterAgent(),
      productivity: new ProductivityAgent()
    };
  }

  async execute(request: AgentRequest): Promise<AgentResponse> {
    const agentKey = typeof request.agentType === 'string' ? request.agentType : String(request.agentType);
    const agent = this.agents[agentKey];
    if (!agent) {
      throw new Error(`Agent ${request.agentType} not found`);
    }
    return await agent.process(request);
  }

  getAgentStatus() {
    return Object.keys(this.agents).map(type => ({
      type,
      status: 'active'
    }));
  }
}
