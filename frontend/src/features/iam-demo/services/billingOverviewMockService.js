import { billingOverview as initialOverview } from '../data/mock';

let store = { ...initialOverview };

export function getOverview() {
  return { ...store, stats: store.stats.map((s) => ({ ...s })), flow: [...store.flow] };
}
