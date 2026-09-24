export type ItemId = string | number;

export interface TreeItem {
  id: ItemId;
  parent: ItemId | null;
}
