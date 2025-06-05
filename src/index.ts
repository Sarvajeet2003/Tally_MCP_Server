#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const API_KEY = '0986c1db003112a75d56df4951677b882a22088f9b3cc6a2ce6dc71953c90bb0';

class TallyGovernanceServer {
  private server: Server;
  private client: any;

  constructor() {
    this.server = new Server(
      {
        name: 'governance-health-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = axios.create({
      baseURL: 'https://api.tally.xyz/query',
      headers: {
        'Api-Key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_dao_health',
          description: 'Analyze the governance health of a DAO using comprehensive metrics',
          inputSchema: {
            type: 'object',
            properties: {
              dao_identifier: {
                type: 'string',
                description: 'DAO name or slug (e.g. "uniswap", "compound", "aave")',
              },
              platform: {
                type: 'string',
                description: 'Platform to use (tally or snapshot)',
                default: 'tally'
              }
            },
            required: ['dao_identifier'],
          },
        },
        {
          name: 'compare_daos',
          description: 'Compare governance health between multiple DAOs',
          inputSchema: {
            type: 'object',
            properties: {
              dao_identifiers: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of DAO names to compare',
              },
              platform: {
                type: 'string',
                description: 'Platform to use (tally or snapshot)',
                default: 'tally'
              }
            },
            required: ['dao_identifiers'],
          },
        },
        {
          name: 'get_detailed_report',
          description: 'Generate comprehensive governance health reports with investment recommendations',
          inputSchema: {
            type: 'object',
            properties: {
              dao_identifier: {
                type: 'string',
                description: 'DAO name or slug',
              },
              platform: {
                type: 'string',
                description: 'Platform to use (tally or snapshot)',
                default: 'tally'
              }
            },
            required: ['dao_identifier'],
          },
        },
        {
          name: 'identify_risks',
          description: 'Identify specific governance risks and vulnerabilities for a DAO',
          inputSchema: {
            type: 'object',
            properties: {
              dao_identifier: {
                type: 'string',
                description: 'DAO name or slug',
              },
              platform: {
                type: 'string',
                description: 'Platform to use (tally or snapshot)',
                default: 'tally'
              }
            },
            required: ['dao_identifier'],
          },
        },
        {
          name: 'list_popular_daos',
          description: 'List popular DAOs with basic governance information',
          inputSchema: {
            type: 'object',
            properties: {
              platform: {
                type: 'string',
                description: 'Platform to use (tally or snapshot)',
                default: 'tally'
              }
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_dao_health':
            return await this.analyzeDAOHealth(args.dao_identifier, args.platform);
          case 'compare_daos':
            return await this.compareDAOs(args.dao_identifiers, args.platform);
          case 'get_detailed_report':
            return await this.getDetailedReport(args.dao_identifier, args.platform);
          case 'identify_risks':
            return await this.identifyRisks(args.dao_identifier, args.platform);
          case 'list_popular_daos':
            return await this.listPopularDAOs(args.platform);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async getGovernorData(slug: string) {
    const query = `
      query {
        governor(input: { slug: "${slug}" }) {
          id
          name
          slug
          type
          chainId
          proposalStats {
            total
            active
            passed
            failed
          }
          delegatesCount
          tokenOwnersCount
          token {
            id
            name
            symbol
            supply
          }
          organization {
            id
            name
            slug
            metadata {
              description
            }
          }
        }
      }
    `;

    const response = await this.client.post('', { query });
    
    if (response.data.errors) {
      throw new Error(`API Error: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data.data.governor;
  }

  private async analyzeDAOHealth(daoIdentifier: string, platform = 'tally') {
    if (platform !== 'tally') {
      throw new Error('Only Tally platform is currently supported');
    }

    const governor = await this.getGovernorData(daoIdentifier);
    
    if (!governor) {
      throw new Error(`DAO "${daoIdentifier}" not found`);
    }

    const healthScore = this.calculateHealthScore(governor);
    const analysis = this.generateHealthAnalysis(governor, healthScore);

    return {
      content: [
        {
          type: 'text',
          text: analysis,
        },
      ],
    };
  }

  private async compareDAOs(daoIdentifiers: string[], platform = 'tally') {
    const governors = await Promise.all(
      daoIdentifiers.map(id => this.getGovernorData(id).catch(() => null))
    );

    const validGovernors = governors.filter(g => g !== null);
    const comparison = this.generateDAOComparison(validGovernors);

    return {
      content: [
        {
          type: 'text',
          text: comparison,
        },
      ],
    };
  }

  private async getDetailedReport(daoIdentifier: string, platform = 'tally') {
    const governor = await this.getGovernorData(daoIdentifier);
    const healthScore = this.calculateHealthScore(governor);
    const report = this.generateDetailedReport(governor, healthScore);

    return {
      content: [
        {
          type: 'text',
          text: report,
        },
      ],
    };
  }

  private async identifyRisks(daoIdentifier: string, platform = 'tally') {
    const governor = await this.getGovernorData(daoIdentifier);
    const risks = this.generateRiskAnalysis(governor);

    return {
      content: [
        {
          type: 'text',
          text: risks,
        },
      ],
    };
  }

  private async listPopularDAOs(platform = 'tally') {
    const query = `
      query {
        organizations(input: { sort: { isDescending: true, sortBy: DELEGATES_VOTES_COUNT }, pagination: { limit: 15 } }) {
          nodes {
            name
            slug
            metadata {
              description
            }
            myRole
            chainIds
            delegatesVotesCount
            tokenOwnersCount
            activeGovernorsCount
          }
        }
      }
    `;

    const response = await this.client.post('', { query });
    
    if (response.data.errors) {
      throw new Error(`API Error: ${JSON.stringify(response.data.errors)}`);
    }

    const orgs = response.data.data.organizations.nodes.slice(0, 10);
    const formatted = this.formatOrganizationsList(orgs);

    return {
      content: [
        {
          type: 'text',
          text: formatted,
        },
      ],
    };
  }

  private calculateHealthScore(governor: any): number {
    let score = 0;
    
    // Proposal activity (30 points max)
    const totalProposals = governor.proposalStats.total || 0;
    score += Math.min(30, totalProposals * 2);
    
    // Success rate (20 points max)
    if (totalProposals > 0) {
      const successRate = governor.proposalStats.passed / totalProposals;
      score += successRate * 20;
    }
    
    // Participation (25 points max)
    const delegates = governor.delegatesCount || 0;
    score += Math.min(25, delegates / 1000 * 25);
    
    // Token distribution (25 points max) 
    const tokenHolders = governor.tokenOwnersCount || 0;
    score += Math.min(25, tokenHolders / 10000 * 25);

    return Math.min(100, Math.round(score));
  }

  private generateHealthAnalysis(governor: any, healthScore: number): string {
    return `# ${governor.name} Governance Health Analysis

## Overall Health Score: ${healthScore}/100 ${this.getHealthEmoji(healthScore)}

### Key Metrics
- **Total Proposals**: ${governor.proposalStats.total || 0}
- **Passed Proposals**: ${governor.proposalStats.passed || 0}
- **Active Proposals**: ${governor.proposalStats.active || 0} 
- **Success Rate**: ${governor.proposalStats.total ? Math.round((governor.proposalStats.passed / governor.proposalStats.total) * 100) : 0}%
- **Delegates**: ${(governor.delegatesCount || 0).toLocaleString()}
- **Token Holders**: ${(governor.tokenOwnersCount || 0).toLocaleString()}
- **Token**: ${governor.token?.symbol || 'N/A'}
- **Governance Type**: ${governor.type.toUpperCase()}
- **Chain**: ${governor.chainId}

### Health Assessment
${this.getHealthAssessment(healthScore)}

### Recommendations
${this.generateRecommendations(governor, healthScore).join('\n')}`;
  }

  private generateDetailedReport(governor: any, healthScore: number): string {
    return `# Detailed Governance Report: ${governor.name}

${this.generateHealthAnalysis(governor, healthScore)}

## Investment Perspective

### Strengths
${this.getGovernanceStrengths(governor).join('\n')}

### Weaknesses  
${this.getGovernanceWeaknesses(governor).join('\n')}

### Investment Recommendation
${this.getInvestmentRecommendation(healthScore)}`;
  }

  private generateRiskAnalysis(governor: any): string {
    const risks = this.identifyGovernanceRisks(governor);
    
    return `# Governance Risk Analysis: ${governor.name}

## Risk Level: ${this.getRiskLevel(governor)}

## Identified Risks

${risks.map(risk => `### ${risk.type}
**Risk Level**: ${risk.level}
**Description**: ${risk.description}
**Mitigation**: ${risk.mitigation}`).join('\n\n')}

## Risk Summary
${this.generateRiskSummary(risks)}`;
  }

  private identifyGovernanceRisks(governor: any) {
    const risks = [];
    const totalProposals = governor.proposalStats.total || 0;
    const delegates = governor.delegatesCount || 0;
    
    if (totalProposals < 10) {
      risks.push({
        type: "Low Activity Risk",
        level: "High", 
        description: "Very few governance proposals indicate low community engagement",
        mitigation: "Increase proposal frequency and community incentives"
      });
    }
    
    if (delegates < 100) {
      risks.push({
        type: "Centralization Risk",
        level: "High",
        description: "Low delegate count may lead to governance centralization", 
        mitigation: "Implement delegate incentive programs"
      });
    }

    if (governor.proposalStats.total > 0) {
      const successRate = governor.proposalStats.passed / governor.proposalStats.total;
      if (successRate < 0.3) {
        risks.push({
          type: "Execution Risk",
          level: "Medium",
          description: "Low proposal success rate indicates potential governance inefficiency",
          mitigation: "Improve proposal vetting and community alignment processes"
        });
      }
    }

    return risks;
  }

  private getRiskLevel(governor: any): string {
    const healthScore = this.calculateHealthScore(governor);
    if (healthScore >= 70) return "🟢 Low Risk";
    if (healthScore >= 50) return "🟡 Medium Risk"; 
    return "🔴 High Risk";
  }

  private generateRiskSummary(risks: any[]): string {
    const highRisks = risks.filter(r => r.level === "High").length;
    if (highRisks > 0) {
      return `⚠️ **High Priority**: ${highRisks} high-risk issues require immediate attention.`;
    }
    return "✅ **Overall**: Governance risks are manageable with recommended mitigations.";
  }

  private getInvestmentRecommendation(healthScore: number): string {
    if (healthScore >= 80) return "🟢 **Strong Buy**: Excellent governance fundamentals support long-term value creation.";
    if (healthScore >= 65) return "🟡 **Buy**: Good governance with some areas for improvement.";
    if (healthScore >= 50) return "🟠 **Hold**: Moderate governance concerns, monitor developments.";
    return "🔴 **Avoid**: Significant governance risks may impact protocol success.";
  }

  private getGovernanceStrengths(governor: any): string[] {
    const strengths = [];
    
    if (governor.proposalStats.total > 20) {
      strengths.push("- Active governance with substantial proposal history");
    }
    
    if (governor.delegatesCount > 500) {
      strengths.push("- Strong delegate participation indicates healthy decentralization");
    }
    
    if (governor.proposalStats.total > 0) {
      const successRate = governor.proposalStats.passed / governor.proposalStats.total;
      if (successRate > 0.7) {
        strengths.push("- High proposal success rate shows effective governance");
      }
    }

    return strengths.length > 0 ? strengths : ["- Governance system is operational"];
  }

  private getGovernanceWeaknesses(governor: any): string[] {
    const weaknesses = [];
    
    if (governor.proposalStats.total < 10) {
      weaknesses.push("- Low governance activity may indicate limited community engagement");
    }
    
    if (governor.delegatesCount < 100) {
      weaknesses.push("- Limited delegate participation raises centralization concerns");
    }

    return weaknesses.length > 0 ? weaknesses : ["- No major structural weaknesses identified"];
  }

  private generateRecommendations(governor: any, healthScore: number): string[] {
    const recommendations = [];
    
    if (governor.proposalStats.total < 10) {
      recommendations.push("- Increase governance participation through better incentives");
    }
    
    if (governor.delegatesCount < 500) {
      recommendations.push("- Implement delegate incentive programs to improve decentralization");
    }

    if (healthScore < 60) {
      recommendations.push("- Consider governance framework improvements to boost effectiveness");
    }

    return recommendations.length > 0 ? recommendations : ["- Maintain current governance practices"];
  }

  private formatOrganizationsList(orgs: any[]) {
    return `# Popular DAOs by Governance Activity

${orgs.map((org, index) => `${index + 1}. **${org.name}** (${org.slug})
   - Delegates: ${org.delegatesVotesCount?.toLocaleString() || 'N/A'}
   - Token Holders: ${org.tokenOwnersCount?.toLocaleString() || 'N/A'}
   - Active Governors: ${org.activeGovernorsCount || 0}
   - ${org.metadata?.description || 'No description available'}`).join('\n\n')}

*Use the slug (in parentheses) to analyze specific DAOs*`;
  }

  private generateDAOComparison(governors: any[]) {
    const withScores = governors.map(gov => ({
      ...gov,
      healthScore: this.calculateHealthScore(gov)
    })).sort((a, b) => b.healthScore - a.healthScore);

    return `# DAO Governance Comparison

## Rankings by Health Score
${withScores.map((dao, index) => `${index + 1}. **${dao.name}**: ${dao.healthScore}/100 ${this.getHealthEmoji(dao.healthScore)}`).join('\n')}

## Detailed Comparison
${withScores.map(dao => `### ${dao.name}
- **Health Score**: ${dao.healthScore}/100
- **Proposals**: ${dao.proposalStats.total} total, ${dao.proposalStats.passed} passed
- **Success Rate**: ${dao.proposalStats.total > 0 ? Math.round((dao.proposalStats.passed / dao.proposalStats.total) * 100) : 0}%
- **Participation**: ${dao.delegatesCount.toLocaleString()} delegates, ${dao.tokenOwnersCount.toLocaleString()} token holders`).join('\n\n')}`;
  }

  private getHealthEmoji(score: number) {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    if (score >= 40) return '🟠';
    return '🔴';
  }

  private getHealthAssessment(score: number) {
    if (score >= 80) return '🟢 **Excellent**: Outstanding governance health with strong participation and effectiveness.';
    if (score >= 60) return '🟡 **Good**: Solid governance fundamentals with room for improvement.';
    if (score >= 40) return '🟠 **Fair**: Moderate governance health requiring attention in several areas.';
    return '🔴 **Poor**: Significant governance challenges that may impact protocol success.';
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Governance Health MCP server running on stdio');
  }
}

const server = new TallyGovernanceServer();
server.run().catch(console.error);
