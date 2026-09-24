import type { TreeItem } from '@/store/types';

export interface Item extends TreeItem {
  label: string;
}

export const ITEMS_URL = '/items.json';

export const ITEMS_LOAD_DELAY_MS = 2000;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const fetchItems = async (url: string = ITEMS_URL): Promise<Item[]> => {
  const [items] = await Promise.all([
    fetch(url).then((response) => response.json() as Promise<Item[]>),
    delay(ITEMS_LOAD_DELAY_MS),
  ]);

  return items;
};
