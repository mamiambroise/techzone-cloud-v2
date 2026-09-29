export function Card({ title, description, footer, children, action, onClick }) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
      {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      {children && <div className="mt-3">{children}</div>}
      {footer && <div className="mt-3 text-sm text-gray-500 border-t pt-2">{footer}</div>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
