const express = require('express');
const StellarSdk = require('stellar-sdk');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// Update this line
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const campaignCreator = 'GAA4E52UMSP45OE54HCG3KYNDL3LCMUCRS2NE3F3XWGGC7B7PQUJ2TQK';
//secret = SAJ5KMOXHHD4VHRWXLWY3NTEG5K5BCULNQ7PKSUIB66JPCQICJJUNNY6
const contributor1 = 'GDJYQND2RUIA6BI5MQNERT7NRKUUJHCFQE3XIA4BNM2VHAGPFX4VRUTK'; 
//secret = SAABUEDXXK5HJXEWGY36WNMB6VOBQU3SCTOJYKTKK7HWDTU5QUKRBTM4
const contributor2 = 'GC5JDZFD7CZC3B4DQHNKJGTN7M2J4DIVNXAUWB4SCY34TDFJM5POAQ45';
//secret = SAAVN5CWI3PVW4KFLF55NBHUXB7RYV76RFMKZYVYZJPK6JAGAQ2662I7

class CrowdfundingCampaign {
  constructor(creator, goal, deadline) {
    this.creator = creator;
    this.goal = goal;
    this.deadline = deadline;
    this.raised = 0;
    this.contributions = {};
  }

  async createCampaign() {
    // Implementation omitted for brevity
    console.log('Campaign created');
  }

  async contribute(contributor, amount) {
    // Implementation omitted for brevity
    this.contributions[contributor] = (this.contributions[contributor] || 0) + parseFloat(amount);
    this.raised += parseFloat(amount);
    console.log(`Contribution of ${amount} XLM received from ${contributor}`);
  }

  async finalizeCampaign() {
    // Implementation omitted for brevity
    console.log('Campaign finalized');
  }

  async makePayment(sourcePublicKey, destinationId, amount) {
    // Configure StellarSdk to use the testnet
    StellarSdk.Network.useTestNetwork();
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

    try {
      // Fetch the source account
      const sourceAccount = await server.loadAccount(sourcePublicKey);

      // Create a payment transaction
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET
      })
        .addOperation(StellarSdk.Operation.payment({
          destination: destinationId,
          asset: StellarSdk.Asset.native(),
          amount: amount.toString()
        }))
        .setTimeout(30)
        .build();

      // Here, you would typically sign the transaction with the source account's secret key
      // For security reasons, we're not doing that in this example
      // transaction.sign(StellarSdk.Keypair.fromSecret(sourceSecretKey));

      // Submit the transaction to the Stellar network
      const transactionResult = await server.submitTransaction(transaction);
      console.log(`Transaction Successful! Hash: ${transactionResult.hash}`);
    } catch (error) {
      console.error('An error has occurred:', error);
      throw error;
    }
  }

  async getAccountDetails(publicKey) {
    try {
      const account = await server.loadAccount(publicKey);
      console.log('Balances for account: ' + publicKey);
      account.balances.forEach((balance) => {
        console.log('Type:', balance.asset_type, ', Balance:', balance.balance);
      });
    } catch (error) {
      console.error('Error fetching account details:', error);
    }
  }

  async getRecentTransactions(publicKey) {
    try {
      const transactions = await server.transactions()
        .forAccount(publicKey)
        .order('desc')
        .limit(10)
        .call();
      
      console.log('Recent transactions for account: ' + publicKey);
      transactions.records.forEach((tx) => {
        console.log('Transaction ID:', tx.id);
        console.log('Created at:', tx.created_at);
        console.log('---');
      });
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
    }
  }
  // Usage
  //getRecentTransactions(campaignCreator);
}

const campaigns = [];

app.post('/campaigns', async (req, res) => {
  const { creator, goal, deadline } = req.body;
  const campaign = new CrowdfundingCampaign(creator, goal, new Date(deadline));
  await campaign.createCampaign();
  campaigns.push(campaign);
  res.status(201).json({ message: 'Campaign created successfully', campaignId: campaigns.length - 1 });
});

app.get('/campaigns', (req, res) => {
  res.json(campaigns);
});

app.post('/campaigns/:id/contribute', async (req, res) => {
    const { id } = req.params;
    const { contributor, amount } = req.body;
    try {
      await campaigns[id].contribute(contributor, amount);
      res.json({ message: 'Contribution successful' });
    } catch (error) {
      res.status(500).json({ message: 'Contribution failed', error: error.message });
    }
});

app.post('/campaigns/:id/finalize', async (req, res) => {
  const { id } = req.params;
  await campaigns[id].finalizeCampaign();
  res.json({ message: 'Campaign finalized' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});