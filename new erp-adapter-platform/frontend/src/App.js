import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ERPList from './pages/ERPList';
import ERPCreate from './pages/ERPCreate';
import ERPEdit from './pages/ERPEdit';
import DataRuntime from './pages/DataRuntime';
import DataRuntimeHistory from './pages/DataRuntimeHistory';
import AutomationCockpit from './pages/AutomationCockpit';
import AutomationRules from './pages/AutomationRules';
import AutomationWorkflows from './pages/AutomationWorkflows';
import AutomationTriggers from './pages/AutomationTriggers';
import AutomationConditions from './pages/AutomationConditions';
import AutomationHistory from './pages/AutomationHistory';
import ErpModule from './pages/ErpModule';
import Adapters from './pages/Adapters';
import Mapping from './pages/Mapping';
import Settings from './pages/Settings';
import { ThemeProvider } from './ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/erps" element={<ERPList />} />
            <Route path="/erps/create" element={<ERPCreate />} />
            <Route path="/erps/edit/:id" element={<ERPEdit />} />
            <Route path="/mapping" element={<Mapping />} />
            <Route path="/adapters" element={<Adapters />} />
            <Route path="/data-runtime" element={<DataRuntime />} />
            <Route path="/data-runtime/history" element={<DataRuntimeHistory />} />
            <Route path="/automation" element={<AutomationCockpit />} />
            <Route path="/automation/rules" element={<AutomationRules />} />
            <Route path="/automation/workflows" element={<AutomationWorkflows />} />
            <Route path="/automation/triggers" element={<AutomationTriggers />} />
            <Route path="/automation/conditions" element={<AutomationConditions />} />
            <Route path="/automation/history" element={<AutomationHistory />} />
            <Route path="/erp/:moduleKey" element={<ErpModule />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
