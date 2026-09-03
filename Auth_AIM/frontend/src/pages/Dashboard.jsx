function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Utilisateurs', value: '24', color: 'blue' },
          { title: 'Organisations', value: '5', color: 'green' },
          { title: 'Tenants', value: '12', color: 'purple' },
          { title: 'Roles', value: '8', color: 'yellow' },
        ].map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500">{card.title}</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Activite recente</h3>
        <p className="text-gray-500">Aucune activite recente.</p>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Context Explorer</h3>
        <p className="text-gray-500">Explorateur de contexte en cours de developpement.</p>
      </div>
    </div>
  );
}

export default Dashboard;
