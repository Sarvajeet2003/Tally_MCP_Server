export interface DAOMetrics {
  name: string;
  symbol: string;
  totalProposals: number;
  activeProposals: number;
  avgVoterTurnout: number;
  tokenConcentration: number;
  delegateActivity: number;
  proposalSuccessRate: number;
  avgProposalDuration: number;
  treasuryHealth: number;
  communityEngagement: number;
}

export interface GovernanceHealth {
  dao: string;
  overallScore: number;
  categoryScores: {
    participation: number;
    decentralization: number;
    activity: number;
    transparency: number;
    stability: number;
  };
  risks: Risk[];
  recommendations: string[];
  lastUpdated: Date;
}

export interface Risk {
  type: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  impact: string;
  mitigation: string;
}

export interface Proposal {
  id: string;
  title: string;
  status: string;
  votes: number;
  turnout: number;
  createdAt: Date;
  endTime: Date;
}

export interface Delegate {
  address: string;
  votes: number;
  proposals: number;
  participation: number;
}

export interface DAOComparison {
  rankings: Array<{
    rank: number;
    dao: string;
    score: number;
    investmentSignal: string;
    topStrength: string;
    topWeakness: string;
    riskLevel: string;
  }>;
  summary: string;
}
