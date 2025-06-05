import type { GovernanceHealth, DAOMetrics, Risk } from '../types/governance.js';
import { TallyClient } from '../apis/tally-client.js';
import { HealthScorer } from './health-scorer.js';
import { RiskDetector } from './risk-detector.js';
import { CacheManager } from '../utils/cache.js';

export class GovernanceAnalyzer {
  private tallyClient: TallyClient;
  private healthScorer: HealthScorer;
  private riskDetector: RiskDetector;
  private cache: CacheManager;

  constructor(tallyApiKey: string) {
    this.tallyClient = new TallyClient(tallyApiKey);
    this.healthScorer = new HealthScorer();
    this.riskDetector = new RiskDetector();
    this.cache = new CacheManager(1800); // 30 minutes cache
  }

  async analyzeDAO(daoIdentifier: string, platform: string = 'tally'): Promise<GovernanceHealth> {
    const cacheKey = `analysis_${platform}_${daoIdentifier}`;
    const cached = this.cache.get<GovernanceHealth>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const metrics = await this.getDAOMetrics(daoIdentifier, platform);
      const categoryScores = this.healthScorer.calculateCategoryScores(metrics);
      const overallScore = this.healthScorer.calculateOverallScore(categoryScores);
      const risks = this.riskDetector.identifyRisks(metrics, categoryScores);
      const recommendations = this.generateRecommendations(metrics, risks);

      const health: GovernanceHealth = {
        dao: metrics.name,
        overallScore,
        categoryScores,
        risks,
        recommendations,
        lastUpdated: new Date()
      };

      this.cache.set(cacheKey, health);
      return health;
    } catch (error) {
      console.error(`Error analyzing DAO ${daoIdentifier}:`, error);
      throw error;
    }
  }

  async compareDAOs(daoIdentifiers: string[], platform: string = 'tally'): Promise<GovernanceHealth[]> {
    const analyses = await Promise.all(
      daoIdentifiers.map(id => this.analyzeDAO(id, platform))
    );

    return analyses.sort((a, b) => b.overallScore - a.overallScore);
  }

  async getDetailedReport(daoIdentifier: string): Promise<string> {
    const health = await this.analyzeDAO(daoIdentifier);
    
    return `
# ${health.dao} Governance Health Report

## Executive Summary
**Overall Score: ${health.overallScore}/100**
**Investment Signal: ${this.getInvestmentSignal(health.overallScore)}**

## Category Breakdown
${Object.entries(health.categoryScores)
  .map(([category, score]) => `- **${category}**: ${score}/100`)
  .join('\n')}

## Risk Assessment
**Total Risks Identified: ${health.risks.length}**

### High Priority Risks
${health.risks
  .filter(r => r.type === 'HIGH')
  .map(r => `- **${r.category}**: ${r.description}`)
  .join('\n') || 'None identified'}

### Medium Priority Risks  
${health.risks
  .filter(r => r.type === 'MEDIUM')
  .map(r => `- **${r.category}**: ${r.description}`)
  .join('\n') || 'None identified'}

## Investment Recommendations
${health.recommendations.map(rec => `- ${rec}`).join('\n')}

## Key Metrics Summary
- **Risk Level**: ${this.getRiskLevel(health.risks)}
- **Governance Maturity**: ${health.overallScore > 70 ? 'High' : health.overallScore > 50 ? 'Medium' : 'Low'}
- **Diversification**: ${health.categoryScores.decentralization > 60 ? 'Well distributed' : 'Concentrated'}

---
*Report generated on ${health.lastUpdated.toISOString()}*
    `.trim();
  }

  private async getDAOMetrics(daoIdentifier: string, platform: string): Promise<DAOMetrics> {
    switch (platform) {
      case 'tally':
        return await this.tallyClient.getDAOMetrics(daoIdentifier);
      default:
        throw new Error(`Platform ${platform} not supported`);
    }
  }

  private generateRecommendations(metrics: DAOMetrics, risks: Risk[]): string[] {
    const recommendations: string[] = [];

    if (metrics.avgVoterTurnout < 20) {
      recommendations.push('Consider implementing voter incentive programs to increase participation');
    }

    if (metrics.tokenConcentration > 50) {
      recommendations.push('Token distribution is concentrated - diversification would improve governance health');
    }

    if (metrics.delegateActivity < 30) {
      recommendations.push('Delegate engagement is low - consider delegate recognition programs');
    }

    if (risks.filter(r => r.type === 'HIGH').length > 0) {
      recommendations.push('Address high-priority risks immediately to improve governance stability');
    }

    if (metrics.proposalSuccessRate < 40) {
      recommendations.push('Low proposal success rate indicates potential consensus issues');
    }

    return recommendations;
  }

  private getInvestmentSignal(score: number): string {
    if (score >= 80) return 'STRONG_BUY';
    if (score >= 60) return 'BUY';
    if (score >= 40) return 'HOLD';
    return 'AVOID';
  }

  private getRiskLevel(risks: Risk[]): string {
    const highRisks = risks.filter(r => r.type === 'HIGH').length;
    if (highRisks > 2) return 'CRITICAL';
    if (highRisks > 0) return 'HIGH';
    if (risks.length > 3) return 'MEDIUM';
    return 'LOW';
  }
}
