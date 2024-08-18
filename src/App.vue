<template>
  <div id="app">
    <Toast />
    <Card>
      <template #title>
        <h1>Welcome to StellarFund</h1>
      </template>
      <template #content>
        <TabView>
          <TabPanel header="About">
            <div class="about-section">
              <h2>Decentralized Crowdfunding on Stellar</h2>
              <p>StellarFund is a revolutionary platform that leverages the power of the Stellar blockchain to enable secure and transparent crowdfunding campaigns.</p>
              
              <h3>Key Features:</h3>
              <ul>
                <li>Create and manage crowdfunding campaigns using Stellar accounts</li>
                <li>Contribute to campaigns using Stellar Lumens (XLM)</li>
                <li>Real-time updates on campaign progress</li>
                <li>Secure transactions on the Stellar blockchain</li>
              </ul>
            </div>
          </TabPanel>
          
          <TabPanel header="Campaigns">
            <div v-if="!userAccount && !isCreatingAccount">
              <h2>Create Stellar Test Account</h2>
              <Button label="Create Test Account" @click="createAccount" :disabled="isCreatingAccount" />
            </div>
            <div v-else-if="isCreatingAccount" class="account-creation-animation">
              <ProgressSpinner />
              <p>Creating your Stellar test account...</p>
            </div>
            <div v-else>
              <p>Your Public Key: {{ userAccount.publicKey }}</p>
              <p>Your Secret Key: {{ maskedSecretKey }}</p>
              <h2>Create New Campaign</h2>
              <form @submit.prevent="createCampaign">
                <div class="p-fluid">
                  <div class="p-field">
                    <label for="goal">Goal Amount (XLM)</label>
                    <InputNumber id="goal" v-model="newCampaign.goal" required />
                  </div>
                  <div class="p-field">
                    <label for="deadline">Deadline</label>
                    <DatePicker v-model="newCampaign.deadline" dateFormat="yy-mm-dd" />
                  </div>
                  <Button type="submit" :label="isCreatingCampaign ? '' : 'Create Campaign'" :disabled="isCreatingCampaign">
                  <template #icon>
                    <i :class="{'pi pi-spin pi-spinner': isCreatingCampaign}" />
                  </template>
                  <span v-if="!isCreatingCampaign">Create Campaign</span>
                </Button>
                </div>
              </form>
            </div>

            <h2>Active Campaigns</h2>
            <DataTable :value="campaigns">
              <Column field="id" header="ID"></Column>
              <Column field="goal" header="Goal (XLM)"></Column>
              <Column field="raised" header="Raised (XLM)"></Column>
              <Column field="deadline" header="Deadline">
                <template #body="slotProps">
                  {{ new Date(slotProps.data.deadline).toLocaleDateString() }}
                </template>
              </Column>
              <Column header="Contribute">
                <template #body="slotProps">
                  <InputNumber v-model="slotProps.data.contributionAmount" placeholder="Amount" />
                  <Button label="Contribute" @click="contribute(slotProps.data.id, slotProps.data.contributionAmount)" />
                </template>
              </Column>
            </DataTable>
          </TabPanel>
        </TabView>
      </template>
    </Card>
  </div>
</template>

<script>
import axios from 'axios';
import { useToast } from "primevue/usetoast";
import Card from 'primevue/card';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Toast from 'primevue/toast';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import ProgressSpinner from 'primevue/progressspinner';
import { Keypair, Networks, Transaction } from 'stellar-sdk';

export default {
  name: 'App',
  components: {
    Card,
    InputNumber,
    DatePicker,
    Button,
    DataTable,
    Column,
    Toast,
    TabView,
    TabPanel,
    ProgressSpinner
  },
  setup() {
    const toast = useToast();
    return { toast }
  },
  data() {
    return {
      campaigns: [],
      newCampaign: {
        goal: null,
        deadline: null
      },
      pollingInterval: null,
      userAccount: null,
      isCreatingAccount: false,
      isCreatingCampaign: false,
    }
  },
  created() {
    this.fetchCampaigns();
    this.startPolling();
    this.loadUserAccount();
    this.validateUserAccount();
  },
  beforeUnmount() {
    this.stopPolling();
  },
  computed: {
    maskedSecretKey() {
      if (this.userAccount && this.userAccount.secretKey) {
        const key = this.userAccount.secretKey;
        const visiblePart = key.slice(0, 4) + '...' + key.slice(-4);
        const maskedPart = '*'.repeat(key.length - 8);
        return visiblePart.slice(0, 4) + maskedPart + visiblePart.slice(-4);
      }
      return '';
    }
  },
  methods: {
    async loadUserAccount() {
      const storedAccount = localStorage.getItem('userAccount');
      if (storedAccount) {
        try {
          this.userAccount = JSON.parse(storedAccount);
          this.validateUserAccount();
        } catch (error) {
          console.error('Error parsing stored user account:', error);
          localStorage.removeItem('userAccount');
        }
      }
    },
    validateUserAccount() {
      if (this.userAccount) {
        if (!this.userAccount.publicKey || !this.userAccount.secretKey) {
          console.error('Invalid user account structure:', this.userAccount);
          this.userAccount = null;
          localStorage.removeItem('userAccount');
          this.showError('Invalid user account. Please create a new account.');
        }
      }
    },
    async createAccount() {
      this.isCreatingAccount = true;
      try {
        const response = await axios.post('http://localhost:3000/create-account');
        this.userAccount = response.data;
        localStorage.setItem('userAccount', JSON.stringify(this.userAccount));
        this.showSuccess('Stellar test account created successfully');
      } catch (error) {
        console.error('Error creating Stellar account:', error);
        this.showError('Failed to create Stellar account');
      } finally {
        this.isCreatingAccount = false;
      }
    },
    async fetchCampaigns() {
      try {
        const response = await axios.get('http://localhost:3000/campaigns');
        this.campaigns = response.data;
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        this.showError('Failed to fetch campaigns');
      }
    },
    async createCampaign() {
      this.isCreatingCampaign = true;
      try {
        if (!this.userAccount) {
          this.showError('Please create a Stellar account first');
          return;
        }
        
        const response = await axios.post('http://localhost:3000/campaigns', {
          creator: this.userAccount.publicKey,
          goal: this.newCampaign.goal,
          deadline: this.newCampaign.deadline,
          creatorPublicKey: this.userAccount.publicKey
        });
        console.log('respone', response.data);
        const { transactionXDR, campaignId } = response.data;
        
        // Sign the transaction
        const sourceKeypair = Keypair.fromSecret(this.userAccount.secretKey);
        const transaction = new Transaction(transactionXDR, Networks.TESTNET);
        transaction.sign(sourceKeypair);
        
        // Finalize the campaign creation
        await axios.post(`http://localhost:3000/campaigns/${campaignId}/finalize`, {
          signedTransactionXDR: transaction.toXDR()
        });
        
        this.newCampaign = { goal: null, deadline: null };
        await this.fetchCampaigns();
        this.showSuccess('Campaign created successfully');
      } catch (error) {
        console.error('Error creating campaign:', error);
        this.showError('Failed to create campaign: ' + error.message);
      } finally {
        this.isCreatingCampaign = false;
      }
    },

    async contribute(campaignId, amount) {
      try {
        if (!this.userAccount) {
          this.showError('Please create a Stellar account first');
          return;
        }

        const response = await axios.post(`http://localhost:3000/campaigns/${campaignId}/contribute`, {
          contributorPublicKey: this.userAccount.publicKey,
          amount
        });
        
        const { transactionXDR } = response.data;
        
        // Sign the transaction
        const sourceKeypair = Keypair.fromSecret(this.userAccount.secretKey);
        const transaction = new Transaction(transactionXDR, Networks.TESTNET);
        transaction.sign(sourceKeypair);
        
        // Finalize the contribution
        await axios.post(`http://localhost:3000/campaigns/${campaignId}/finalize-contribution`, {
          signedTransactionXDR: transaction.toXDR(),
          contributorPublicKey: this.userAccount.publicKey,
          amount
        });
        
        await this.fetchCampaigns();
        this.showSuccess('Contribution made successfully');
      } catch (error) {
        console.error('Error contributing to campaign:', error);
        this.showError('Failed to make contribution: ' + error.message);
      }
    },
    startPolling() {
      this.pollingInterval = setInterval(() => {
        this.fetchCampaigns();
      }, 30000); // Fetch every 30 seconds
    },
    stopPolling() {
      clearInterval(this.pollingInterval);
    },
    showSuccess(message) {
      this.toast.add({severity:'success', summary: 'Success', detail: message, life: 3000});
    },
    showError(message) {
      this.toast.add({severity:'error', summary: 'Error', detail: message, life: 3000});
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.p-card {
  margin: 0 auto;
  max-width: 800px;
}

.p-field {
  margin-bottom: 1rem;
}

.about-section {
  text-align: left;
  padding: 1rem;
}

.about-section h2 {
  color: #4caf50;
}

.about-section h3 {
  color: #2196f3;
}

.about-section ul {
  padding-left: 20px;
}
.account-creation-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 2rem 0;
}

.account-creation-animation .p-progress-spinner {
  width: 50px;
  height: 50px;
}

.account-creation-animation p {
  margin-top: 1rem;
  font-weight: bold;
}
</style>