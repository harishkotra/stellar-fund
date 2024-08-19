<template>
    <div id="app">
      <Toast />
      <header>
        <nav>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#campaigns">Campaigns</a></li>
          </ul>
        </nav>
      </header>
  
      <section id="hero">
        <h1>Decentralized Crowdfunding on Stellar</h1>
        <p>Secure, transparent, and powerful campaigns powered by blockchain technology</p>
        <Button label="Get Started" class="p-button-lg" @click="showCreateCampaign = true" />
      </section>
  
      
  
      <Dialog v-model:visible="showCreateCampaign" header="Create New Campaign" :style="{width: '50vw'}">
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
      </Dialog>
  
      <section id="campaigns">
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
      </section>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  import { useToast } from "primevue/usetoast";
  import InputNumber from 'primevue/inputnumber';
  import Calendar from 'primevue/calendar';
  import Button from 'primevue/button';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Toast from 'primevue/toast';
  import Dialog from 'primevue/dialog';
  
  export default {
    name: 'App',
    components: {
      InputNumber,
      Calendar,
      Button,
      DataTable,
      Column,
      Toast,
      Dialog
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
        showCreateCampaign: false
      }
    },
    created() {
      this.fetchCampaigns();
      this.startPolling();
    },
    beforeUnmount() {
      this.stopPolling();
    },
    methods: {
      async fetchCampaigns() {
        try {
          const response = await axios.get(`${process.env.VUE_APP_API_URL}/campaigns`);
          this.campaigns = response.data;
        } catch (error) {
          console.error('Error fetching campaigns:', error);
          this.showError('Failed to fetch campaigns');
        }
      },
      async createCampaign() {
        try {
          await axios.post(`${process.env.VUE_APP_API_URL}/campaigns`, this.newCampaign);
          this.newCampaign = { goal: null, deadline: null };
          await this.fetchCampaigns();
          this.showSuccess('Campaign created successfully');
          this.showCreateCampaign = false;
        } catch (error) {
          console.error('Error creating campaign:', error);
          this.showError('Failed to create campaign');
        }
      },
      async contribute(campaignId, amount) {
        try {
          await axios.post(`${process.env.VUE_APP_API_URL}/campaigns/${campaignId}/contribute`, { amount });
          await this.fetchCampaigns();
          this.showSuccess('Contribution made successfully');
        } catch (error) {
          console.error('Error contributing to campaign:', error);
          this.showError('Failed to make contribution');
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
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
  }
  
  header {
    background-color: #3498db;
    padding: 1rem;
  }
  
  nav ul {
    list-style-type: none;
    padding: 0;
  }
  
  nav ul li {
    display: inline;
    margin: 0 1rem;
  }
  
  nav ul li a {
    color: white;
    text-decoration: none;
  }
  
  #hero {
    background-image: url('');
    background-size: cover;
    color: white;
    padding: 4rem 2rem;
  }
  
  #hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    padding: 2rem;
  }
  
  .feature-item {
    background-color: #f8f9fa;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .feature-item i {
    font-size: 2rem;
    color: #3498db;
    margin-bottom: 1rem;
  }
  
  #campaigns {
    padding: 2rem;
  }
  
  .p-datatable {
    margin-top: 2rem;
  }
  </style>