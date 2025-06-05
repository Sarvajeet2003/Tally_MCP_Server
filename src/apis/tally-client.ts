import axios, { AxiosInstance } from 'axios';

export interface TallyDAO {
  id: string;
  name: string;
  slug: string;
  chainId: string;
  organization?: {
    name: string;
    slug: string;
  };
  tokens: Array<{
    symbol: string;
    supply: string;
  }>;
  proposals: {
    nodes: Array<{
      id: string;
      title: string;
      description: string;
      status: string;
      createdAt: string;
      votes: {
        nodes: Array<{
          support: string;
          weight: string;
          voter: {
            address: string;
          };
        }>;
      };
    }>;
  };
}

export class TallyClient {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://api.tally.xyz/query',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async getGovernanceBySlug(slug: string, chainId: string = "eip155:1"): Promise<TallyDAO | null> {
    const query = `
      query Governance($input: GovernanceInput!) {
        governance(input: $input) {
          id
          name
          slug
          chainId
          organization {
            name
            slug
          }
          tokens {
            id
            name
            symbol
            supply
          }
          stats {
            proposals {
              total
              active
            }
            tokens {
              voters
              delegatedVotes
            }
          }
          proposals(input: { 
            sort: { isDescending: true, sortBy: CREATED_AT }
            page: { limit: 20 }
          }) {
            nodes {
              id
              title
              description
              status
              createdAt
              executable {
                eta
              }
              votes(input: { page: { limit: 50 } }) {
                nodes {
                  ... on TokenVote {
                    id
                    support
                    weight
                    voter {
                      address
                      name
                    }
                  }
                }
              }
            }
            pageInfo {
              firstCursor
              lastCursor
            }
          }
        }
      }
    `;

    try {
      const response = await this.client.post('', {
        query,
        variables: {
          input: {
            filters: {
              slug: slug,
              chainId: chainId
            }
          }
        }
      });

      if (response.data.errors) {
        console.error('GraphQL errors:', response.data.errors);
        return null;
      }

      const governance = response.data.data?.governance;
      if (!governance) return null;

      return {
        id: governance.id,
        name: governance.name,
        slug: governance.slug,
        chainId: governance.chainId,
        organization: governance.organization,
        tokens: governance.tokens || [],
        proposals: governance.proposals || { nodes: [] }
      };
    } catch (error: any) {
      console.error(`Error fetching governance ${slug}:`, error.response?.data || error.message);
      return null;
    }
  }

  async searchGovernances(query: string): Promise<TallyDAO[]> {
    const searchQuery = `
      query Governances($input: GovernancesInput!) {
        governances(input: $input) {
          nodes {
            id
            name
            slug
            chainId
            organization {
              name
              slug
            }
            tokens {
              id
              name
              symbol
              supply
            }
            stats {
              proposals {
                total
              }
            }
          }
          pageInfo {
            firstCursor
            lastCursor
          }
        }
      }
    `;

    try {
      const response = await this.client.post('', {
        query: searchQuery,
        variables: {
          input: {
            filters: {
              search: query,
              chainId: "eip155:1"
            },
            sort: {
              isDescending: true,
              sortBy: "PROPOSAL_COUNT"
            },
            page: {
              limit: 10
            }
          }
        }
      });

      if (response.data.errors) {
        console.error('GraphQL errors:', response.data.errors);
        return [];
      }

      const governances = response.data.data?.governances?.nodes || [];
      
      return governances.map((gov: any) => ({
        id: gov.id,
        name: gov.name,
        slug: gov.slug,
        chainId: gov.chainId,
        organization: gov.organization,
        tokens: gov.tokens || [],
        proposals: { nodes: [] }
      }));
    } catch (error: any) {
      console.error('Error searching governances:', error.response?.data || error.message);
      return [];
    }
  }

  async getDAOByIdentifier(identifier: string): Promise<TallyDAO | null> {
    // First try known slugs
    const knownSlug = this.getKnownDAOSlug(identifier);
    
    let dao = await this.getGovernanceBySlug(knownSlug);
    if (dao) return dao;

    // If not found, try searching
    const searchResults = await this.searchGovernances(identifier);
    if (searchResults.length > 0) {
      // Get detailed data for the first result
      return this.getGovernanceBySlug(searchResults[0].slug);
    }

    return null;
  }

  getKnownDAOSlug(identifier: string): string {
    const knownMappings: Record<string, string> = {
      'uniswap': 'uniswap',
      'compound': 'compound',
      'aave': 'aave',
      'makerdao': 'makerdao',
      'maker': 'makerdao',
      'curve': 'curve-dao',
      'yearn': 'yearn-finance',
      'sushi': 'sushiswap',
      'sushiswap': 'sushiswap',
      'arbitrum': 'arbitrum-dao',
      'optimism': 'optimism-collective',
      'polygon': 'polygon-ecosystem-dao',
      'ens': 'ens',
      'ethereum-name-service': 'ens',
      'balancer': 'balancer',
      'gitcoin': 'gitcoin',
      'bankless': 'banklessdao',
      'nouns': 'nouns-dao',
      'apecoin': 'apecoin-dao'
    };

    return knownMappings[identifier.toLowerCase()] || identifier.toLowerCase();
  }
}
