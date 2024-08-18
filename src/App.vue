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
              <p>StellarFund is a platform that leverages the power of the Stellar blockchain to enable secure and transparent crowdfunding campaigns.</p>
              
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
            <div v-if="!userAccount">
              <h2>Create Stellar Test Account</h2>
              <p>For testing the functionality, create a new testnet account along with a secret key that will be used to create campaigns where a goal can be set and funds can be raised/contributed to.</p>
              <Button label="Create Test Account" @click="createAccount"
              :loading="isCreatingAccount"
              loadingIcon="pi pi-spinner pi-spin"
              :disabled="isCreatingAccount" />
            </div>
            <div v-else-if="isCreatingAccount" class="account-creation-animation">
              <ProgressSpinner />
              <p>Creating your Stellar test account...</p>
            </div>
            <div v-else>
              <h2>Your Stellar Test Account</h2>

              <Fieldset>
                  <template #legend>
                      <div class="flex items-center gap-2 px-2">
                          <Avatar :image="userAccount.imageUrl" shape="circle" />
                          <span class="font-bold">{{ userAccount.name }} (Dummy Name)</span>
                      </div>
                  </template>
                  <div class="flex flex-col gap-2">
                    <label for="publicKey">Public Key</label>
                    <InputGroup>
                      <InputText id="publicKey" v-model="userAccount.publicKey" readonly disabled v-tooltip.top="'This is the testnet accont public key and not an actual account key.'" />
                      <Button icon="pi pi-copy" @click="copyToClipboard(userAccount.publicKey)" />
                    </InputGroup>
                  </div>
                  <div class="flex flex-col gap-2">
                    <label for="secretKey">Secret Key</label>
                    <InputGroup>
                      <InputText id="secretKey" v-model="maskedSecretKey" readonly disabled v-tooltip.top="'This is the testnet accont secret key and not an actual account key.'" />
                      <Button icon="pi pi-copy" @click="copyToClipboard(userAccount.secretKey)" />
                    </InputGroup>
                  </div>
              </Fieldset>

              <h2>Create New Campaign</h2>
              <form @submit.prevent="createCampaign">
                <div class="p-fluid">
                  <div class="flex flex-col gap-2">
                    <label for="goal">Goal Amount (XLM)</label>
                    <InputNumber id="goal" v-model="newCampaign.goal" required :min="0.01" />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label for="deadline">Deadline</label>
                    <DatePicker v-model="newCampaign.deadline" dateFormat="yy-mm-dd" :minDate="new Date()" />
                  </div>
                  <Button type="submit" :disabled="isCreatingCampaign || !isFormValid">
                    <span v-if="isCreatingCampaign" class="spinner"></span>
                    <span v-else>Create Campaign</span>
                  </Button>
                </div>
              </form>
            </div>

            <div v-if="campaigns.length > 0">
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
            </div>
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
import InputGroup from 'primevue/inputgroup';
import InputText from 'primevue/inputtext';
import Fieldset from 'primevue/fieldset';
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
    ProgressSpinner,
    InputGroup,
    InputText,
    Fieldset
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
    console.log(this.userAccount);
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
    async getRandomUser() {
      try {
        const response = await axios.get('https://randomuser.me/api/');
        const user = response.data.results[0];
        return {
          name: `${user.name.first} ${user.name.last}`,
          imageUrl: user.picture.medium,
          email: user.email
        };
      } catch (error) {
        console.error('Error fetching random user:', error);
        return {
          name: 'Anonymous User',
          imageUrl: 'https://via.placeholder.com/150',
          email: 'anonymous@example.com'
        };
      }
    },
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
        const stellarResponse = await axios.post('http://localhost:3000/create-account');
        // Get random user data
        const randomUser = await this.getRandomUser();

        this.userAccount = {
          ...stellarResponse.data,
          ...randomUser
        };
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
    },
    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.showSuccess('Copied to clipboard');
      }, (err) => {
        console.error('Could not copy text: ', err);
        this.showError('Failed to copy to clipboard');
      });
    },
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