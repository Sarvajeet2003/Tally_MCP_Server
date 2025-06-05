import axios from 'axios';

export class CompoundClient {
  private baseUrl = 'https://api.compound.finance/api/v2';

  async getGovernanceData(proposalId?: string): Promise<any> {
    try {
      const url = proposalId 
        ? `${this.baseUrl}/governance/proposals/${proposalId}`
        : `${this.baseUrl}/governance/proposals`;
        
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Compound API error:', error);
      throw error;
    }
  }

  async getAccountData(address: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/governance/accounts/${address}`);
      return response.data;
    } catch (error) {
      console.error('Compound account API error:', error);
      throw error;
    }
  }
}
