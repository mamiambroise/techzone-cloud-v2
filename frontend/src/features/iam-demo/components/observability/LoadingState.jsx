export function LoadingState({ message = 'Chargement…' }) {
  return (
    <div className="obs-loading-state">
      <div className="obs-loading-spinner" />
      <div className="obs-loading-message">{message}</div>
    </div>
  );
}
