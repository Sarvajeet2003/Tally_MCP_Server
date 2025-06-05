# Governance Health MCP Server

A Model Context Protocol (MCP) server for comprehensive DAO governance health analysis. This server provides real-time assessment, risk identification, and detailed reporting for major DeFi governance protocols.

## 🔍 Overview

The Governance Health MCP Server analyzes decentralized autonomous organizations (DAOs) across multiple dimensions to provide comprehensive governance health insights. It integrates with governance APIs to fetch real-time data and applies sophisticated scoring algorithms to evaluate DAO performance.

## Features

- **🎯 Multi-Dimensional Health Scoring**: 5-category assessment framework
- **⚠️ Risk Identification**: Automated detection of governance vulnerabilities  
- **📊 Detailed Reporting**: Comprehensive governance analysis reports
- **⚡ Performance Optimized**: Built-in caching for fast response times
- **🔌 MCP Compatible**: Seamless integration with AI assistants and applications

##  Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MCP Client    │    │   MCP Server    │    │   Data Sources  │
│   (Claude/AI)   │◄──►│  (This Project) │◄──►│   (Tally API)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  Cache Manager  │
                       │  (Node Cache)   │
                       └─────────────────┘
```

##  Available Tools

### 1. `identify_risks`
Analyzes governance risks and vulnerabilities in a DAO.

**Parameters:**
- `dao_identifier` (string): DAO name/identifier

**Output:** JSON object containing:
- Risk categories and levels
- Specific vulnerability details
- Recommended mitigation strategies

### 2. `get_detailed_report`
Generates comprehensive governance health reports.

**Parameters:**
- `dao_identifier` (string): DAO name/identifier

**Output:** JSON object containing:
- Complete health assessment
- Category-specific analysis
- Historical trends
- Actionable recommendations

##  Health Scoring Framework

### Scoring Categories

| Category | Weight | Description |
|----------|--------|-------------|
| **Participation** | 25% | Voter turnout, delegate activity, community engagement |
| **Decentralization** | 25% | Token distribution, power concentration analysis |
| **Activity** | 20% | Proposal frequency, success rates, active governance |
| **Transparency** | 15% | Information availability, proposal clarity |
| **Stability** | 15% | Consistent performance, treasury health |

### Health Assessment Levels

| Score Range | Assessment | Description |
|-------------|------------|-------------|
| 80-100 | 🟢 **Excellent** | Robust governance with strong participation |
| 60-79 | 🟡 **Good** | Healthy governance with minor areas for improvement |
| 40-59 | 🟠 **Fair** | Moderate governance with notable concerns |
| 0-39 | 🔴 **Poor** | Significant governance challenges requiring attention |

##  Supported DAOs

The server currently supports analysis for these major DeFi protocols:

- **Uniswap** (`uniswap`)
- **Compound** (`compound`) 
- **Aave** (`aave`)
- **MakerDAO** (`makerdao`)
- **Curve** (`curve`)
- **Yearn** (`yearn`)
- **SushiSwap** (`sushi`)
- **Arbitrum** (`arbitrum`)
- **Optimism** (`optimism`)
- **ENS** (`ens`)
- **Balancer** (`balancer`)

##  Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd governance-health-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

##  Configuration

The server uses the following default configurations:

### Cache Settings
- **TTL**: 1 hour (3600 seconds)
- **Check Period**: 12 minutes (20% of TTL)
- **Clone Mode**: Disabled for better performance

### Scoring Weights
```typescript
const weights = {
  participation: 0.25,
  decentralization: 0.25,
  activity: 0.20,
  transparency: 0.15,
  stability: 0.15
};
```

## 🔧 Technical Details

### Core Components

#### 1. HealthScorer (`health-scorer.ts`)
Implements the scoring algorithms for governance health assessment.

**Key Methods:**
- `calculateCategoryScores()`: Computes individual category scores
- `calculateOverallScore()`: Weighted average of all categories
- Individual category calculators for each dimension

#### 2. CacheManager (`cache.ts`)
Provides efficient caching layer for API responses.

**Features:**
- Configurable TTL (Time To Live)
- Automatic cache cleanup
- Type-safe get/set operations
- Performance statistics

#### 3. Server Handler (`server.ts`)
Handles MCP tool requests and orchestrates the analysis flow.

**Workflow:**
1. Validate DAO identifier
2. Check cache for existing data
3. Fetch from API if cache miss
4. Process through scoring algorithms
5. Return formatted response

### Data Flow

```
Request → Validation → Cache Check → API Fetch → Scoring → Response
    ↓         ↓           ↓           ↓          ↓         ↓
   Tool    DAO ID     Hit/Miss    Tally API   Health   JSON
  Handler  Verify     Decision     GraphQL    Scorer   Output
```

##  Example Usage

### Risk Analysis
```bash
# Identify risks for Uniswap governance
Tool: identify_risks
Args: { "dao_identifier": "uniswap" }
```

### Detailed Report
```bash
# Get comprehensive report for Compound
Tool: get_detailed_report  
Args: { "dao_identifier": "compound" }
```

## MCP Integration

This server implements the Model Context Protocol, making it compatible with:

- **Claude Desktop/Web**: Direct integration with Anthropic's AI assistant
- **Other MCP Clients**: Any application supporting MCP protocol
- **Custom Integrations**: Build your own MCP-compatible applications

### Connection Setup
The server runs on stdio transport:
```typescript
const transport = new StdioServerTransport();
await this.server.connect(transport);
```

##  Metrics Analyzed

The system evaluates DAOs across these key metrics:

### Participation Metrics
- Average voter turnout percentage
- Delegate activity levels
- Community engagement scores

### Decentralization Metrics  
- Token concentration (Gini coefficient)
- Voting power distribution
- Number of active delegates

### Activity Metrics
- Total proposals submitted
- Currently active proposals
- Proposal success/failure rates

### Transparency Metrics
- Proposal documentation quality
- Average proposal duration
- Public discussion activity

### Stability Metrics
- Governance consistency over time
- Treasury health indicators
- Decision-making efficiency

##  Error Handling

The server includes comprehensive error handling:

- **Invalid DAO Identifier**: Clear error with supported DAO list
- **API Failures**: Graceful degradation with cached data
- **Network Issues**: Retry logic with exponential backoff
- **Cache Failures**: Fallback to direct API calls

##  Dependencies

### Production Dependencies
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `axios`: HTTP client for API requests
- `graphql-request`: GraphQL query client
- `node-cache`: In-memory caching solution
- `zod`: Runtime type validation

### Development Dependencies
- `typescript`: Type-safe JavaScript
- `tsx`: TypeScript execution engine
- `@types/node`: Node.js type definitions

