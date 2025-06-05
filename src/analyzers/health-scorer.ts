import type { DAOMetrics } from '../types/governance.js';

export class HealthScorer {
  calculateCategoryScores(metrics: DAOMetrics) {
    return {
      participation: this.calculateParticipationScore(metrics),
      decentralization: this.calculateDecentralizationScore(metrics),
      activity: this.calculateActivityScore(metrics),
      transparency: this.calculateTransparencyScore(metrics),
      stability: this.calculateStabilityScore(metrics)
    };
  }

  calculateOverallScore(categoryScores: any): number {
    const weights = {
      participation: 0.25,
      decentralization: 0.25,
      activity: 0.20,
      transparency: 0.15,
      stability: 0.15
    };

    return Math.round(
      Object.entries(categoryScores).reduce((total, [category, score]) => {
        return total + (score as number) * weights[category as keyof typeof weights];
      }, 0)
    );
  }

  private calculateParticipationScore(metrics: DAOMetrics): number {
    const turnoutScore = Math.min(100, metrics.avgVoterTurnout * 2);
    const delegateScore = Math.min(100, metrics.delegateActivity);
    const engagementScore = Math.min(100, metrics.communityEngagement);
    
    return Math.round((turnoutScore * 0.4) + (delegateScore * 0.3) + (engagementScore * 0.3));
  }

  private calculateDecentralizationScore(metrics: DAOMetrics): number {
    const concentrationScore = Math.max(0, 100 - metrics.tokenConcentration);
    const delegateDistributionScore = Math.min(100, metrics.delegateActivity);
    
    return Math.round((concentrationScore * 0.7) + (delegateDistributionScore * 0.3));
  }

  private calculateActivityScore(metrics: DAOMetrics): number {
    const proposalActivityScore = Math.min(100, (metrics.totalProposals / 12) * 20);
    const activeProposalsScore = Math.min(100, metrics.activeProposals * 25);
    const successRateScore = metrics.proposalSuccessRate;
    
    return Math.round((proposalActivityScore * 0.4) + (activeProposalsScore * 0.3) + (successRateScore * 0.3));
  }

  private calculateTransparencyScore(metrics: DAOMetrics): number {
    // Simplified scoring based on available data
    const proposalScore = metrics.totalProposals > 10 ? 80 : 50;
    const durationScore = metrics.avgProposalDuration > 3 ? 70 : 40;
    
    return Math.round((proposalScore * 0.6) + (durationScore * 0.4));
  }

  private calculateStabilityScore(metrics: DAOMetrics): number {
    const successRateScore = metrics.proposalSuccessRate;
    const treasuryScore = metrics.treasuryHealth;
    const durationScore = Math.min(100, metrics.avgProposalDuration * 10);
    
    return Math.round((successRateScore * 0.4) + (treasuryScore * 0.3) + (durationScore * 0.3));
  }
}
