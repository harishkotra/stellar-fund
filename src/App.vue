<template>
  <div id="app">
    <Toast />
    <Card>
      <template #title>
        StellarFund
      </template>
      <template #content>
        <h2>Create New Campaign</h2>
        <form @submit.prevent="createCampaign">
          <div class="p-fluid">
            <div class="p-field">
              <label for="creator">Creator Address</label>
              <InputText id="creator" v-model="newCampaign.creator" required />
            </div>
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

        <h2>Active Campaigns</h2>
        <DataTable :value="campaigns">
          <Column field="title" header="Title"></Column>
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
              <Button label="Contribute" @click="contribute(slotProps.index, slotProps.data.contributionAmount)" />
            </template>
          </Column>
          <Column header="Actions">
            <template #body="slotProps">
              <Button icon="pi pi-eye" @click="showCampaignDetails(slotProps.data)" />
            </template>
          </Column>
          <Column header="Progress">
            <template #body="slotProps">
              <ProgressBar :value="(slotProps.data.raised / slotProps.data.goal) * 100" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Add this Dialog component -->
    <Dialog v-model:visible="displayCampaignDetails" :header="selectedCampaign?.title" :modal="true">
      <p>Goal: {{ selectedCampaign?.goal }} XLM</p>
      <p>Raised: {{ selectedCampaign?.raised }} XLM</p>
      <p>Deadline: {{ new Date(selectedCampaign?.deadline).toLocaleDateString() }}</p>
      <ProgressBar :value="(selectedCampaign?.raised / selectedCampaign?.goal) * 100" />
    </Dialog>
  </div>
</template>

<script>
import axios from 'axios';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Toast from 'primevue/toast';
import { useToast } from "primevue/usetoast";
import ProgressBar from 'primevue/progressbar';

export default {
  name: 'App',
  components: {
    Card,
    InputText,
    InputNumber,
    Calendar,
    Button,
    DataTable,
    Column,
    Toast,
    ProgressBar,
  },
  data() {
    return {
      campaigns: [],
      newCampaign: {
        creator: '',
        goal: null,
        deadline: null
      },
      displayCampaignDetails: false,
      selectedCampaign: null
    }
  },
  created() {
    this.fetchCampaigns();
  },
  setup() {
    const toast = useToast();
    return { toast }
  },
  methods: {
    async fetchCampaigns() {
      try {
        const response = await axios.get('http://localhost:3000/campaigns');
        this.campaigns = response.data;
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
    },
    async createCampaign() {
      try {
        await axios.post('http://localhost:3000/campaigns', this.newCampaign);
        this.newCampaign = { creator: '', goal: null, deadline: null };
        await this.fetchCampaigns();
      } catch (error) {
        console.error('Error creating campaign:', error);
      }
    },
    async contribute(campaignId, amount) {
      try {
        const contributorId = '1'; // Hardcoded for testing, should be dynamic in real app
        await axios.post(`http://localhost:3000/campaigns/${campaignId}/contribute`, {
          contributorId,
          amount
        });
        await this.fetchCampaigns();
      } catch (error) {
        console.error('Error contributing to campaign:', error);
      }
    },
    showCampaignDetails(campaign) {
      this.selectedCampaign = campaign;
      this.displayCampaignDetails = true;
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