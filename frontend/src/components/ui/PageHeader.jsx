import { ChevronLeft } from 'lucide-react';

export function PageHeader({ title, subtitle, action, breadcrumb }) {
  return (
    <div className="border-b border-gray-200 px-6 py-4">
      {breadcrumb && (
        <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-2">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center">
              {i > 0 && <span className="mx-1">/</span>}
              {crumb.onClick ? (
                <button onClick={crumb.onClick} className="hover:text-gray-700">{crumb.label}</button>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function BackLink({ onClick, label = 'Retour' }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
    >
      <ChevronLeft size={16} className="mr-1" />
      {label}
    </button>
  );
}
