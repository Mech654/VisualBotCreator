let allNodes: HTMLElement[] = [];

export function initializeNodes(): void {
  allNodes = Array.from(document.querySelectorAll('.node')) as HTMLElement[];
}

export function getNodes(): HTMLElement[] {
  return allNodes;
}

export function addNode(nodeElement: HTMLElement): void {
  allNodes.push(nodeElement);
}

export function setNodes(newNodeArray: HTMLElement[]): void {
  allNodes = newNodeArray;
}

export function removeNodeById(nodeId: string): void {
  allNodes = allNodes.filter(node => node.id !== nodeId);
}
