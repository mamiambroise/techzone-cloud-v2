import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ERPList from './pages/ERPList';
import ERPCreate from './pages/ERPCreate';
import ERPEdit from './pages/ERPEdit';

function Mapping() {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center">
      <h2 className="text-xl font-semibold text-gray-600">Mapping</h2>
      <p className="text-gray-400 mt-2">Module a venir — Phase 3</p>
    </div>
  );
}

function Adapters() {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center">
      <h2 className="text-xl font-semibold text-gray-600">Adapters</h2>
      <p className="text-gray-400 mt-2">Module a venir — Phase 3</p>
    </div>
  );
}

function Settings() {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center">
      <h2 className="text-xl font-semibold text-gray-600">Parametres</h2>
      <p className="text-gray-400 mt-2">Module a venir — Phase 3</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/erps" element={<ERPList />} />
          <Route path="/erps/create" element={<ERPCreate />} />
          <Route path="/erps/edit/:id" element={<ERPEdit />} />
          <Route path="/mapping" element={<Mapping />} />
          <Route path="/adapters" element={<Adapters />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
