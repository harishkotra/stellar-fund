<template>
  <div id="app">
    <Toast />
    <Card>
      <template #title>
        <h1>Welcome to StellarFund</h1>
      </template>
      <template #content>
        <Tabs value="0">
          <TabList>
              <Tab value="0">🫶 About</Tab>
              <Tab value="1">🎗️ Campaigns</Tab>
              <Tab value="2">🤔 FAQs</Tab>
          </TabList>
          <TabPanels>
              <TabPanel value="0">
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
              <TabPanel value="1">
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
                        <Button type="submit" :disabled="isCreatingCampaign" :loading="isCreatingCampaign"
                        loadingIcon="pi pi-spinner pi-spin">
                          <span v-if="isCreatingCampaign"></span>
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
                      <Column field="raised" header="Raised (XLM)">
                        <template #body="slotProps">
                          <div class="flex flex-column align-items-start">
                            <span>{{ slotProps.data.raised }} / {{ slotProps.data.goal }} XLM</span>
                            <ProgressBar 
                              :value="(slotProps.data.raised / slotProps.data.goal) * 100" 
                              :showValue="true"
                              style="width: 100%; height: 12px;"
                            ></ProgressBar>
                          </div>
                        </template>
                      </Column>
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
              <TabPanel value="2">
                <div class="faqs-content justify-left text-align-left">
                  <Accordion value="0">
                    <AccordionPanel value="0">
                        <AccordionHeader>What is StellarFund?</AccordionHeader>
                        <AccordionContent>
                            <p class="m-0">
                              StellarFund is a decentralized crowdfunding platform built on the Stellar blockchain. It allows users to create and contribute to crowdfunding campaigns using Stellar Lumens (XLM).
                            </p>
                        </AccordionContent>
                    </AccordionPanel>
                    <AccordionPanel value="1">
                        <AccordionHeader>Do I need a Stellar account to use StellarFund?</AccordionHeader>
                        <AccordionContent>
                            <p class="m-0">
                              No, you don't need an existing Stellar account<sup>*</sup>. Our app allows you to create a Stellar testnet account directly within the platform for testing and using the app.
                              <br />
                              <sup>*</sup> This is only while we're testing and gathering user feedback. Once the app moves to production, you'll be able to link your existing wallets and create campaigns.
                            </p>
                        </AccordionContent>
                    </AccordionPanel>
                    <AccordionPanel value="2">
                        <AccordionHeader>Is StellarFund free to use?</AccordionHeader>
                        <AccordionContent>
                            <p class="m-0">
                              StellarFund itself is free to use. However, transactions on the Stellar network incur a small fee (typically a fraction of a cent) to prevent spam.
                            </p>
                        </AccordionContent>
                    </AccordionPanel>
                    <AccordionPanel value="3">
                      <AccordionHeader>How do I create a campaign?</AccordionHeader>
                      <AccordionContent>
                        <p class="m-0">
                          Once you have a Stellar testnet account, you can create a campaign by specifying your funding goal and deadline. The app will guide you through the process.
                        </p>
                      </AccordionContent>
                    </AccordionPanel>

                    <AccordionPanel value="4">
                      <AccordionHeader>How do I contribute to a campaign?</AccordionHeader>
                      <AccordionContent>
                        <p class="m-0">
                          You can contribute to any active campaign by selecting it from the list of campaigns and entering the amount of XLM you wish to contribute.
                        </p>
                      </AccordionContent>
                    </AccordionPanel>

                    <AccordionPanel value="5">
                      <AccordionHeader>What happens if a campaign doesn't reach its goal?</AccordionHeader>
                      <AccordionContent>
                        <p class="m-0">
                          If a campaign doesn't reach its funding goal by the deadline, all contributions are automatically returned to the contributors.
                        </p>
                      </AccordionContent>
                    </AccordionPanel>


                    <AccordionPanel value="6">
                      <AccordionHeader>How secure is StellarFund?</AccordionHeader>
                      <AccordionContent>
                        <p class="m-0">
                          StellarFund leverages the security of the Stellar blockchain. All transactions are recorded on the blockchain, ensuring transparency and immutability.
                        </p>
                      </AccordionContent>
                    </AccordionPanel>

                    <AccordionPanel value="7">
                      <AccordionHeader>Can I use real money on StellarFund?</AccordionHeader>
                      <AccordionContent>
                        <p class="m-0">
                          Currently, StellarFund operates on the Stellar testnet, which uses test XLM. These have no real-world value and are used for testing purposes only.
                        </p>
                      </AccordionContent>
                    </AccordionPanel>

                    <AccordionPanel value="8">
                      <AccordionHeader>How long does it take for a transaction to be processed?</AccordionHeader>
                      <AccordionContent>
                        <p class="m-0">
                          Stellar transactions typically settle in 2-5 seconds.
                        </p>
                      </AccordionContent>
                    </AccordionPanel>

                    <AccordionPanel value="9">
                      <AccordionHeader>Can I cancel a campaign after it's been created?</AccordionHeader>
                      <AccordionContent>
                        <p class="m-0">
                          Once a campaign is created and published on the blockchain, it cannot be canceled or altered. This ensures fairness and transparency for all participants.
                        </p>
                      </AccordionContent>
                    </AccordionPanel>

                    <AccordionPanel value="10">
                      <AccordionHeader>What information do I need to provide to create an account?</AccordionHeader>
                      <AccordionContent>
                        <p class="m-0">
                          To create a testnet account, you don't need to provide any personal information. The app generates a random profile for testing purposes.
                        </p>
                      </AccordionContent>
                    </AccordionPanel>

                    <AccordionPanel value="11">
                      <AccordionHeader>Can I use StellarFund on my mobile device?</AccordionHeader>
                      <AccordionContent>
                        <p class="m-0">
                          Currently, StellarFund is a web-based application accessible through web browsers. A dedicated mobile app is planned for future development.
                        </p>
                      </AccordionContent>
                    </AccordionPanel>


                    <AccordionPanel value="12">
                      <AccordionHeader>How do I keep track of my contributions?</AccordionHeader>
                      <AccordionContent>
                        <p class="m-0">
                          All your contributions are recorded on the Stellar blockchain and visible within the app. You can view your contribution history in your account dashboard. (Coming soon!)
                        </p>
                      </AccordionContent>
                    </AccordionPanel>


                    <AccordionPanel value="13">
                      <AccordionHeader>What happens to my testnet account and campaigns when I close the browser?</AccordionHeader>
                      <AccordionContent>
                        <p class="m-0">
                          Your testnet account information is stored locally in your browser. As long as you don't clear your browser data, you can return to the app and continue using the same account.
                        </p>
                      </AccordionContent>
                    </AccordionPanel>
                  </Accordion>
                </div>
                
              </TabPanel>
          </TabPanels>
      </Tabs>



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
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import ProgressSpinner from 'primevue/progressspinner';
import InputGroup from 'primevue/inputgroup';
import InputText from 'primevue/inputtext';
import Fieldset from 'primevue/fieldset';
import ProgressBar from 'primevue/progressbar';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
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
    Tabs,
    Tab,
    TabList,
    TabPanels,
    TabPanel,
    ProgressSpinner,
    InputGroup,
    InputText,
    ProgressBar,
    Accordion,
    AccordionPanel, 
    AccordionHeader,
    AccordionContent,
    Fieldset,
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
        const campaign = this.campaigns.find(c => c.id === campaignId);
        if (campaign) {
          campaign.raised += parseFloat(amount);
        }
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
.p-progressbar .p-progressbar-value {
  transition: width 0.5s ease;
}
.p-accordioncontent-content {
  text-align: left;
}
</style>