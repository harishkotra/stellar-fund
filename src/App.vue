<template>
  <div id="app">
    <Toast />
    <Card>
      <template #title>
        StellarFund
      </template>
      <template #content>
        <div v-if="!userAccount">
          <h2>Create Stellar Account</h2>
          <Button label="Create Account" @click="createAccount" />
        </div>
        <div v-else>
          <p>Your Public Key: {{ userAccount.publicKey }}</p>
          <p>Your Secret Key: {{ userAccount.secretKey }}</p>
          <h2>Create New Campaign</h2>
          <form @submit.prevent="createCampaign">
            <div class="p-fluid">
              <div class="p-field">
                <label for="goal">Goal Amount (XLM)</label>
                <InputNumber id="goal" v-model="newCampaign.goal" required />
              </div>
              <div class="p-field">
                <label for="deadline">Deadline</label>
                <Calendar id="deadline" v-model="newCampaign.deadline" dateFormat="yy-mm-dd" required />
              </div>
              <Button type="submit" label="Create Campaign" />
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
      </template>
    </Card>
  </div>
</template>

<script>
import axios from 'axios';
import { useToast } from "primevue/usetoast";
import Card from 'primevue/card';
import InputNumber from 'primevue/inputnumber';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Toast from 'primevue/toast';
import { Keypair, Networks, Transaction } from 'stellar-sdk';

export default {
  name: 'App',
  components: {
    Card,
    InputNumber,
    Calendar,
    Button,
    DataTable,
    Column,
    Toast
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
      userAccount: null
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
  methods: {
    async validateUserAccount() {
      if (this.userAccount) {
        console.log('Validating user account:', this.userAccount);
        if (!this.userAccount.publicKey || !this.userAccount.secretKey) {
          console.error('Invalid user account structure:', this.userAccount);
          this.userAccount = null;
          localStorage.removeItem('userAccount');
          this.showError('Invalid user account. Please create a new account.');
        }
      }
    },
    async loadUserAccount() {
      const storedAccount = localStorage.getItem('userAccount');
      if (storedAccount) {
        try {
          this.userAccount = JSON.parse(storedAccount);
          //console.log('User account loaded:', this.userAccount);
        } catch (error) {
          console.error('Error parsing stored user account:', error);
          localStorage.removeItem('userAccount');
        }
      }
    },
    async createAccount() {
      try {
        const response = await axios.post('http://localhost:3000/create-account');
        this.userAccount = response.data;
        localStorage.setItem('userAccount', JSON.stringify(this.userAccount));
        this.showSuccess('Stellar account created successfully');
      } catch (error) {
        console.error('Error creating Stellar account:', error);
        this.showError('Failed to create Stellar account');
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
</style>