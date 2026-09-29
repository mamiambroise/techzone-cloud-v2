import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pageDefinitions } from '../../app/navigationConfig.js';
import { api } from '../../services/apiClient.js';

const unwrap = (res) => res.data;

export function BMSidebarNav({ applicationId, selectedVersion, onVersionChange }) {
  const [versions, setVersions] = useState([]);
  const versionRoutes = pageDefinitions.filter(entry => entry.versionSection);

  useEffect(() => {
    if (!applicationId) return;
    api
      .get(`/business-manager/applications/${applicationId}/versions`)
      .then(unwrap)
      .then(setVersions)
      .catch(() => setVersions([]));
  }, [applicationId]);

  return (
    <div className="flex h-full">
      <div className="w-60 border-r border-gray-200 bg-gray-50 min-h-[400px]">
        <div className="p-3 border-b">
          <h3 className="text-xs font-semibold text-gray-500 uppercase">Versions</h3>
        </div>
        <div className="p-1">
          {versions.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">Aucune version</div>
          ) : (
            versions.map(v => (
              <button
                key={v.id}
                onClick={() => onVersionChange(v.id)}
                className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                  selectedVersion === v.id
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {v.version || v.code}
              </button>
            ))
          )}
          <button
            disabled title="Création de version non implémentée"
            className="block w-full text-left px-3 py-2 rounded-md text-sm text-blue-600 hover:bg-blue-50"
          >
            + Nouvelle version
          </button>
        </div>
      </div>
      {selectedVersion && (
        <div className="flex-1 overflow-y-auto">
          <nav className="p-3 space-y-1">
            {versionRoutes.map(item => {
              const path = item.route
                .replace(':applicationId', applicationId)
                .replace(':versionId', selectedVersion);
              return (
                <Link
                  key={item.id}
                  to={path}
                  className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                >
                  {item.label}
                  <span className="ml-2 text-xs text-gray-400">Phase {item.phase}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
