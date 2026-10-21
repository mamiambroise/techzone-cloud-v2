import { useEffect, useRef } from 'react';
import ConfirmModal from '../ui/ConfirmModal.jsx';

/** Reuse the shared confirmation and contain keyboard focus while it is open. */
export default function RuntimeConfirmation(props) {
  const root = useRef(null);
  useEffect(() => {
    if (!props.open) return undefined;
    const element = root.current;
    function trap(event) {
      if (event.key !== 'Tab') return;
      const dialog = element.querySelector('[role="dialog"]');
      const buttons = [...(dialog?.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]') || [])];
      if (!buttons.length) { event.preventDefault(); dialog?.focus(); return; }
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
    }
    element.addEventListener('keydown', trap);
    return () => element.removeEventListener('keydown', trap);
  }, [props.open]);
  return <div ref={root}><ConfirmModal {...props} /></div>;
}
