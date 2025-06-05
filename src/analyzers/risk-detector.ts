import type { DAOMetrics, Risk } from '../types/governance.js';

export class RiskDetector {
  identifyRisks(metrics: DAOMetrics, categoryScores: any): Risk[] {
    const risks: Risk[] = [];

    // Participation risks
    if (metrics.avgVoterTurnout < 10) {
      risks.push({
        type: 'HIGH',
        category: 'Participation',
        description: 'Extremely low voter turnout indicates governance apathy',
        impact: 'Decisions may not represent community consensus',
        mitigation: 'Implement voter incentives and education programs'
      });
    }

    // Centralization risks
    if (metrics.tokenConcentration > 70) {
      risks.push({
        type: 'HIGH',
        category: 'Centralization',
        description: 'High token concentration among few holders',
        impact: 'Risk of governance capture and manipulation',
        mitigation: 'Encourage token distribution and delegate diversity'
      });
    }

    // Activity risks
    if (metrics.totalProposals < 5) {
      risks.push({
        type: 'MEDIUM',
        category: 'Activity',
        description: 'Low governance activity may indicate disengagement',
        impact: 'Important decisions may be delayed or ignored',
        mitigation: 'Stimulate governance participation with clear processes'
      });
    }

    // Stability risks
    if (metrics.proposalSuccessRate < 30) {
      risks.push({
        type: 'HIGH',
        category: 'Stability',
        description: 'Very low proposal success rate indicates governance dysfunction',
        impact: 'Inability to make necessary protocol changes',
        mitigation: 'Review proposal processes and consensus mechanisms'
      });
    }

    // Delegate risks
    if (metrics.delegateActivity < 20) {
      risks.push({
        type: 'MEDIUM',
        category: 'Delegation',
        description: 'Low delegate activity may create governance bottlenecks',
        impact: 'Reduced governance efficiency and representation',
        mitigation: 'Implement delegate accountability and incentive systems'
      });
    }

    return risks;
  }
}
