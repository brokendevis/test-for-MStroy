import type { ItemId, TreeItem } from './types';

export class TreeStore<T extends TreeItem = TreeItem> {
  private readonly items = new Map<ItemId, T>();

  private readonly childrenById = new Map<ItemId, T[]>();

  constructor(items: readonly T[] = []) {
    this.setItems(items);
  }

  getAll(): T[] {
    return [...this.items.values()];
  }

  getItem(id: T['id']): T | undefined {
    return this.items.get(id);
  }

  getChildren(id: T['id']): T[] {
    const children = this.childrenById.get(id);
    return children === undefined ? [] : [...children];
  }

  getAllChildren(id: T['id']): T[] {
    const directChildren = this.childrenById.get(id);
    if (directChildren === undefined) {
      return [];
    }

    const result: T[] = [];
    const visited = new Set<ItemId>([id]);
    const stack: T[] = [...directChildren].reverse();

    let node = stack.pop();
    while (node !== undefined) {
      result.push(node);

      const children = this.childrenById.get(node.id);
      if (children !== undefined) {
        for (let i = children.length - 1; i >= 0; i -= 1) {
          const child = children[i];
          if (child === undefined || visited.has(child.id)) {
            continue;
          }
          visited.add(child.id);
          stack.push(child);
        }
      }

      node = stack.pop();
    }

    return result;
  }

  getAllParents(id: T['id']): T[] {
    const item = this.items.get(id);
    if (item === undefined) {
      return [];
    }

    const result: T[] = [item];
    const visited = new Set<ItemId>([id]);

    let parentId = item.parent;
    while (parentId !== null && !visited.has(parentId)) {
      visited.add(parentId);

      const parent = this.items.get(parentId);
      if (parent === undefined) {
        break;
      }

      result.push(parent);
      parentId = parent.parent;
    }

    return result;
  }

  setItems(items: readonly T[]): void {
    this.items.clear();
    this.childrenById.clear();

    for (const item of items) {
      this.addItem(item);
    }
  }

  addItem(item: T): void {
    const previous = this.items.get(item.id);
    if (previous !== undefined && previous !== item) {
      this.detachFromParent(previous);
    }

    this.items.set(item.id, item);

    if (item.parent !== null) {
      this.attachToParent(item);
    }
  }

  removeItem(id: T['id']): void {
    const target = this.items.get(id);
    if (target === undefined) {
      return;
    }

    const subtreeIds: ItemId[] = [id];
    const visited = new Set<ItemId>([id]);
    const stack: T[] = [target];

    let node = stack.pop();
    while (node !== undefined) {
      const children = this.childrenById.get(node.id);
      if (children !== undefined) {
        for (const child of children) {
          if (visited.has(child.id)) {
            continue;
          }
          visited.add(child.id);
          subtreeIds.push(child.id);
          stack.push(child);
        }
      }

      node = stack.pop();
    }

    for (const subtreeId of subtreeIds) {
      this.items.delete(subtreeId);
      this.childrenById.delete(subtreeId);
    }

    this.detachFromParent(target);
  }

  updateItem(item: T): void {
    const stored = this.items.get(item.id);
    if (stored === undefined) {
      return;
    }

    const parentChanged = stored.parent !== item.parent;
    if (parentChanged) {
      this.detachFromParent(stored);
    }

    Object.assign(stored, item);

    if (parentChanged && stored.parent !== null) {
      this.attachToParent(stored);
    }
  }

  private attachToParent(item: T): void {
    const parentId = item.parent;
    if (parentId === null) {
      return;
    }

    const siblings = this.childrenById.get(parentId);
    if (siblings === undefined) {
      this.childrenById.set(parentId, [item]);
      return;
    }

    siblings.push(item);
  }

  private detachFromParent(item: T): void {
    const parentId = item.parent;
    if (parentId === null) {
      return;
    }

    const siblings = this.childrenById.get(parentId);
    if (siblings === undefined) {
      return;
    }

    const index = siblings.indexOf(item);
    if (index === -1) {
      return;
    }

    siblings.splice(index, 1);
    if (siblings.length === 0) {
      this.childrenById.delete(parentId);
    }
  }
}

export default TreeStore;
