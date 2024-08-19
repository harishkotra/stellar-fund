const express = require('express');
//const fs = require('fs').promises;
//const path = require('path');
const cors = require('cors');
const StellarSdk = require('stellar-sdk');
require('dotenv').config();
const admin = require('firebase-admin');
//require('firebase/database');

const app = express();
const port = 3000;
//const dataFile = path.join(__dirname, 'campaigns.json');

app.use(express.json());
app.use(cors());

// Initialize Firebase Admin
const serviceAccount = require(`${process.env.FB_SERVICEACC_PATH}`);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `${process.env.FB_REALTIME_DB_URL}`
});

const database = admin.database();

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

class CrowdfundingCampaign {
  constructor(creator, goal, deadline, creatorPublicKey) {
    this.creator = creator || 'Anonymous';
    this.goal = goal;
    this.deadline = deadline instanceof Date ? deadline : new Date(deadline);
    this.raised = 0;
    this.contributions = {};
    this.id = Date.now().toString();
    this.stellarAddress = '';
    this.creatorPublicKey = creatorPublicKey;
    this.transactionXDR = null;
  }

  // async createCampaign() {
  //   // Create a Stellar account for the campaign
  //   const campaignKeypair = StellarSdk.Keypair.random();
    
  //   const transaction = new StellarSdk.TransactionBuilder(
  //     await server.loadAccount(testnetAccount),
  //     { fee: StellarSdk.BASE_FEE, networkPassphrase: StellarSdk.Networks.TESTNET }
  //   )
  //     .addOperation(StellarSdk.Operation.createAccount({
  //       destination: campaignKeypair.publicKey(),
  //       startingBalance: '1' // Minimum balance to create an account
  //     }))
  //     .setTimeout(30)
  //     .build();

  //   transaction.sign(StellarSdk.Keypair.fromSecret(testnetSecretKey));
  //   await server.submitTransaction(transaction);
  //   this.stellarAddress = campaignKeypair.publicKey();
  //   console.log('Campaign created with Stellar address:', this.stellarAddress);
  // }

  async createCampaign() {
    // Create a Stellar account for the campaign
    const campaignKeypair = StellarSdk.Keypair.random();
    this.stellarAddress = campaignKeypair.publicKey(); 
    
    const transaction = new StellarSdk.TransactionBuilder(
      await server.loadAccount(this.creatorPublicKey),
      { fee: StellarSdk.BASE_FEE, networkPassphrase: StellarSdk.Networks.TESTNET }
    )
      .addOperation(StellarSdk.Operation.createAccount({
        destination: campaignKeypair.publicKey(),
        startingBalance: '1' // Minimum balance to create an account
      }))
      .setTimeout(30)
      .build();

    // The transaction needs to be signed by the creator
    // We'll return the transaction XDR for the frontend to sign
    return transaction.toXDR();
  }

  // async contribute(contributor, amount) {
  //   const transaction = new StellarSdk.TransactionBuilder(
  //     await server.loadAccount(testnetAccount),
  //     { fee: StellarSdk.BASE_FEE, networkPassphrase: StellarSdk.Networks.TESTNET }
  //   )
  //     .addOperation(StellarSdk.Operation.payment({
  //       destination: this.stellarAddress,
  //       asset: StellarSdk.Asset.native(),
  //       amount: amount.toString()
  //     }))
  //     .setTimeout(30)
  //     .build();

  //   transaction.sign(StellarSdk.Keypair.fromSecret(testnetSecretKey));
  //   await server.submitTransaction(transaction);

  //   this.contributions[contributor] = (this.contributions[contributor] || 0) + parseFloat(amount);
  //   this.raised += parseFloat(amount);
  //   console.log(`Contribution of ${amount} XLM received from ${contributor}`);
  // }

  async contribute(contributorPublicKey, amount) {
    if (!this.stellarAddress) {
      throw new Error('Campaign stellar address not set. The campaign may not be finalized yet.');
    }
  
    const transaction = new StellarSdk.TransactionBuilder(
      await server.loadAccount(contributorPublicKey),
      { fee: StellarSdk.BASE_FEE, networkPassphrase: StellarSdk.Networks.TESTNET }
    )
      .addOperation(StellarSdk.Operation.payment({
        destination: this.stellarAddress,
        asset: StellarSdk.Asset.native(),
        amount: amount.toString()
      }))
      .setTimeout(30)
      .build();
  
    return transaction.toXDR();
  }
  
  async finalizeCampaign() {
    // Implementation for finalizing the campaign
    console.log('Campaign finalized');
  }

  async getAccountDetails() {
    try {
      const account = await server.loadAccount(this.stellarAddress);
      console.log('Balances for campaign account:', this.stellarAddress);
      account.balances.forEach((balance) => {
        console.log('Type:', balance.asset_type, ', Balance:', balance.balance);
      });
    } catch (error) {
      console.error('Error fetching account details:', error);
    }
  }

  async getRecentTransactions() {
    try {
      const transactions = await server.transactions()
        .forAccount(this.stellarAddress)
        .order('desc')
        .limit(10)
        .call();
      
      console.log('Recent transactions for campaign account:', this.stellarAddress);
      transactions.records.forEach((tx) => {
        console.log('Transaction ID:', tx.id);
        console.log('Created at:', tx.created_at);
        console.log('---');
      });
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
    }
  }
  
  toJSON() {
    return {
      id: this.id,
      creator: this.creator,
      goal: this.goal,
      deadline: this.deadline,
      raised: this.raised,
      contributions: this.contributions,
      creatorPublicKey: this.creatorPublicKey,
      stellarAddress: this.stellarAddress
    };
  }
}

// Load campaigns from Firebase
async function loadCampaigns() {
  try {
    const snapshot = await admin.database().ref('campaigns').once('value');
    const campaignsData = snapshot.val() || {};
    
    const campaigns = {};
    Object.entries(campaignsData).forEach(([id, campaignData]) => {
      campaigns[id] = new CrowdfundingCampaign(
        campaignData.creator,
        campaignData.goal,
        new Date(campaignData.deadline),
        campaignData.creatorPublicKey
      );
      Object.assign(campaigns[id], campaignData);
    });
    
    return campaigns;
  } catch (error) {
    console.error('Error loading campaigns from Firebase:', error);
    return {};
  }
}

// Save campaign to Firebase
async function saveCampaign(campaign) {
  try {
    const cleanCampaign = Object.entries(campaign).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        if (key === 'deadline' && value instanceof Date) {
          acc[key] = value.toISOString();
        } else if (key === 'contributions' && typeof value === 'object') {
          acc[key] = Object.entries(value).reduce((contAcc, [contKey, contValue]) => {
            if (contValue !== undefined) {
              contAcc[contKey] = contValue;
            }
            return contAcc;
          }, {});
        } else {
          acc[key] = value;
        }
      }
      return acc;
    }, {});

    console.log('Clean campaign data to save:', cleanCampaign);

    await admin.database().ref('campaigns/' + campaign.id).set(cleanCampaign);

    return 'Campaign saved successfully';
  } catch (error) {
    console.error('Error saving campaign:', error);
    throw error;
  }
}

app.post('/create-account', async (req, res) => {
  try {
    const pair = StellarSdk.Keypair.random();
    const publicKey = pair.publicKey();
    const secretKey = pair.secret();

    // Fund the account using Friendbot
    await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);

    res.json({ publicKey, secretKey });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create account', error: error.message });
  }
});

app.post('/campaigns', async (req, res) => {
  const { creator, goal, deadline, creatorPublicKey } = req.body;
  try {
    const campaign = new CrowdfundingCampaign(creator, goal, new Date(deadline), creatorPublicKey);
    const transactionXDRData = await campaign.createCampaign();
    
    // Save the campaign to Firebase immediately after creation
    await saveCampaign(campaign);

    res.status(201).json({ 
      message: 'Campaign creation prepared', 
      campaignId: campaign.id,
      transactionXDR: transactionXDRData
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Failed to create campaign', error: error.message });
  }
});

app.get('/campaigns', async (req, res) => {
  const campaigns = await loadCampaigns();
  res.json(Object.values(campaigns));
});

app.post('/campaigns/:id/contribute', async (req, res) => {
  const { id } = req.params;
  const { contributorPublicKey, amount } = req.body;
  try {
    const campaigns = await loadCampaigns();
    const campaign = campaigns[id];
    if (campaign && typeof campaign.contribute === 'function') {
      const transactionXDR = await campaign.contribute(contributorPublicKey, amount);
      res.json({ message: 'Contribution prepared', transactionXDR });
    } else {
      res.status(404).json({ message: 'Campaign not found or invalid' });
    }
  } catch (error) {
    console.error('Contribution error:', error);
    res.status(500).json({ message: 'Contribution failed', error: error.message });
  }
});

app.post('/campaigns/:id/finalize-contribution', async (req, res) => {
  const { id } = req.params;
  const { signedTransactionXDR, contributorPublicKey, amount } = req.body;
  try {
    const campaigns = await loadCampaigns();
    const campaign = campaigns[id];
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      signedTransactionXDR,
      StellarSdk.Networks.TESTNET
    );
    await server.submitTransaction(transaction);

    campaign.contributions[contributorPublicKey] = (campaign.contributions[contributorPublicKey] || 0) + parseFloat(amount);
    campaign.raised += parseFloat(amount);
    await saveCampaign(campaign);

    res.json({ message: 'Contribution finalized' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to finalize contribution', error: error.message });
  }
});

app.post('/campaigns/:id/finalize', async (req, res) => {
  const { id } = req.params;
  const { signedTransactionXDR } = req.body;
  
  try {
    const campaigns = await loadCampaigns();
    const campaign = campaigns[id];
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (!signedTransactionXDR) {
      return res.status(400).json({ message: 'signedTransactionXDR is required' });
    }

    let transaction;
    try {
      transaction = StellarSdk.TransactionBuilder.fromXDR(
        signedTransactionXDR,
        StellarSdk.Networks.TESTNET
      );
    } catch (error) {
      return res.status(400).json({ message: 'Invalid transaction XDR', error: error.message });
    }

    try {
      const transactionResult = await server.submitTransaction(transaction);
      
      // Extract the stellarAddress from the transaction
      const createAccountOp = transaction.operations.find(op => op.type === 'createAccount');
      if (createAccountOp) {
        campaign.stellarAddress = createAccountOp.destination;
      }

      const saveResult = await saveCampaign(campaign);
      console.log(saveResult);

      res.json({ 
        message: 'Campaign finalized', 
        stellarAddress: campaign.stellarAddress,
        transactionId: transactionResult.id
      });
    } catch (error) {
      console.error('Error details:', error);
      return res.status(500).json({ 
        message: 'Failed to submit transaction', 
        error: error.message,
        extras: error.response?.data?.extras
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to finalize campaign', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});