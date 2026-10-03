import { createSlice } from '@reduxjs/toolkit';

// REAL DATA ONLY : le registre des contrats démarre vide et se remplit
// uniquement via l'API réelle (GET /business-manager/contracts).
const initialContracts = [];

const contractsSlice = createSlice({
  name: 'contracts',
  initialState: {
    contracts: initialContracts,
    selectedContractId: null,
    filterStatus: 'ALL',
  },
  reducers: {
    setSelectedContractId: (state, action) => {
      state.selectedContractId = action.payload;
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    lockContract: (state, action) => {
      const contract = state.contracts.find((c) => c.id === action.payload);
      if (contract) {
        contract.status = 'LOCKED';
      }
    },
    updateContractStatus: (state, action) => {
      const { id, status } = action.payload;
      const contract = state.contracts.find((c) => c.id === id);
      if (contract) {
        contract.status = status;
        if (status === 'ACTIVE' && !contract.publishedAt) {
          contract.publishedAt = new Date().toISOString();
        }
        if (status === 'DEPRECATED' && !contract.deprecatedAt) {
          contract.deprecatedAt = new Date().toISOString();
        }
      }
    },
    addContract: (state, action) => {
      const newContract = {
        id: 'CONTR-' + Date.now().toString(36).toUpperCase(),
        status: 'DRAFT',
        publishedAt: null,
        deprecatedAt: null,
        consumers: [],
        providers: [],
        ...action.payload,
      };
      state.contracts.unshift(newContract);
      state.selectedContractId = newContract.id;
    },
  },
});

export const {
  setSelectedContractId,
  setFilterStatus,
  lockContract,
  updateContractStatus,
  addContract,
} = contractsSlice.actions;

export default contractsSlice.reducer;
