const axios = require('axios');

const client = axios.create({
    baseURL: 'https://api.tally.xyz/query',
    headers: {
        'Api-Key': '0986c1db003112a75d56df4951677b882a22088f9b3cc6a2ce6dc71953c90bb0',
        'Content-Type': 'application/json',
    },
});

const query = `
  query {
    governor(input: { slug: "uniswap" }) {
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
      }
    }
  }
`;

client.post('', { query }).then(response => {
    if (response.data.errors) {
        console.log('❌ Errors:', JSON.stringify(response.data.errors, null, 2));
    } else {
        console.log('✅ Success!');
        console.log(JSON.stringify(response.data.data.governor, null, 2));
    }
}).catch(error => {
    console.error('Failed:', error.message);
});
