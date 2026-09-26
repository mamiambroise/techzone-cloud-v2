import { useDispatch } from 'react-redux';
import { addToast as addToastAction } from '../store/platformSlice.js';

export function useToast() {
  const dispatch = useDispatch();
  return {
    toast: {
      success: (message, title = 'Succès') =>
        dispatch(addToastAction({ type: 'success', title, message })),
      error: (message, title = 'Erreur') =>
        dispatch(addToastAction({ type: 'error', title, message })),
      info: (message, title = 'Information') =>
        dispatch(addToastAction({ type: 'info', title, message })),
      warning: (message, title = 'Attention') =>
        dispatch(addToastAction({ type: 'warning', title, message })),
    },
  };
}
