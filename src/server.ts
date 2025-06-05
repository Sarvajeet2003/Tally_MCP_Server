import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TallyClient, TallyDAO } from './apis/tally-client.js';
import { GovernanceAnalyzer } from './analyzers/governance-analyzer.js';
import NodeCache from 'node-cache';

export class GovernanceHealthMCPServer {
  private server: Server;
  private tallyClient: TallyClient;
  private analyzer: GovernanceAnalyzer;
  private cache: NodeCache;

  constructor(tallyApiKey: string) {
    this.server = new Server(
      {
        name: 'governance-health-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.tallyClient = new TallyClient(tallyApiKey);
    this.analyzer = new GovernanceAnalyzer();
    this.cache = new NodeCache({ stdTTL: 300 });

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_dao_health',
          description: 'Analyze the governance health of a specific DAO',
          inputSchema: {
            type: 'object',
            properties: {
              dao_identifier: {
                type: 'string',
                description: 'The DAO name or identifier (e.g., "uniswap", "compound", "makerdao")',
              },
            },
            required: ['dao_identifier'],
          },
        },
        {
          name: 'compare_daos',
          description: 'Compare governance health across multiple DAOs',
          inputSchema: {
            type: 'object',
            properties: {
              dao_identifiers: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of DAO names to compare',
              },
            },
            required: ['dao_identifiers'],
          },
        },
        {
          name: 'identify_risks',
          description: 'Identify governance risks for a specific DAO',
          inputSchema: {
            type: 'object',
            properties: {
              dao_identifier: {
                type: 'string',
                description: 'The DAO name or identifier',
              },
            },
            required: ['dao_identifier'],
          },
        },
        {
          name: 'get_detailed_report',
          description: 'Generate a comprehensive governance report for a DAO',
          inputSchema: {
            type: 'object',
            properties: {
              dao_identifier: {
                type: 'string',
                description: 'The DAO name or identifier',
              },
            },
            required: ['dao_identifier'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'analyze_dao_health':
            return await this.handleAnalyzeDAOHealth(request.params.arguments);
          
          case 'compare_daos':
            return await this.handleCompareDAOs(request.params.arguments);
          
          case 'identify_risks':
            return await this.handleIdentifyRisks(request.params.arguments);
          
          case 'get_detailed_report':
            return await this.handleGetDetailedReport(request.params.arguments);
          
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error: any) {
        console.error('Tool error:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message || 'Unknown error occurred'}. Please try with a different DAO identifier like: uniswap, compound, aave, makerdao.`,
            },
          ],
        };
      }
    });
  }

  private async handleAnalyzeDAOHealth(args: any) {
    const { dao_identifier } = args;
    const cacheKey = `health_${dao_identifier}`;
    
    let cached = this.cache.get(cacheKey);
    if (cached) {
      return { content: [{ type: 'text', text: JSON.stringify(cached, null, 2) }] };
    }

    const dao = await this.tallyClient.getDAOByIdentifier(dao_identifier);
    
    if (!dao) {
      throw new Error(`DAO '${dao_identifier}' not found. Try: uniswap, compound, aave, makerdao, curve, yearn, sushi, arbitrum, optimism, ens, balancer`);
    }

    const health = this.analyzer.analyzeGovernanceHealth(dao);
    this.cache.set(cacheKey, health);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(health, null, 2),
        },
      ],
    };
  }

  private async handleCompareDAOs(args: any) {
    const { dao_identifiers } = args;
    
    const analyses = await Promise.allSettled(
      dao_identifiers.map(async (identifier: string) => {
        const dao = await this.tallyClient.getDAOByIdentifier(identifier);
        if (!dao) {
          throw new Error(`DAO '${identifier}' not found`);
        }
        return this.analyzer.analyzeGovernanceHealth(dao);
      })
    );

    const successful = analyses
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);

    if (successful.length === 0) {
      throw new Error('No DAOs could be analyzed. Check the identifiers.');
    }

    const comparison = this.analyzer.compareDAOs(successful);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(comparison, null, 2),
        },
      ],
    };
  }

  private async handleIdentifyRisks(args: any) {
    const { dao_identifier } = args;
    
    const dao = await this.tallyClient.getDAOByIdentifier(dao_identifier);
    
    if (!dao) {
      throw new Error(`DAO '${dao_identifier}' not found. Try: uniswap, compound, aave, makerdao, curve, yearn, sushi, arbitrum, optimism, ens, balancer`);
    }

    const risks = this.analyzer.identifyRisks(dao);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(risks, null, 2),
        },
      ],
    };
  }

  private async handleGetDetailedReport(args: any) {
    const { dao_identifier } = args;
    
    const dao = await this.tallyClient.getDAOByIdentifier(dao_identifier);
    
    if (!dao) {
      throw new Error(`DAO '${dao_identifier}' not found. Try: uniswap, compound, aave, makerdao, curve, yearn, sushi, arbitrum, optimism, ens, balancer`);
    }

    const report = this.analyzer.generateDetailedReport(dao);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(report, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Governance Health MCP server running on stdio');
  }
}
