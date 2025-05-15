
// Keep track of all nodes in the workspace
const nodes: HTMLElement[] = [];

/**
 * Add a node to the tracked nodes
 */
export function addNode(node: HTMLElement): void {
  nodes.push(node);
}

/**
 * Get all tracked nodes
 */
export function getNodes(): HTMLElement[] {
  return nodes;
}

/**
 * Set the nodes array to a new list of nodes
 */
export function setNodes(newNodes: HTMLElement[]): void {
  nodes.length = 0; // Clear existing nodes
  nodes.push(...newNodes); // Add new nodes
}

/**
 * Remove a node by its id
 */
export function removeNodeById(nodeId: string): void {
  const index = nodes.findIndex(node => node.id === nodeId || node.dataset.nodeId === nodeId);
  if (index !== -1) {
    nodes.splice(index, 1);
  }
}

/**
 * Initialize nodes tracking
 */
export function initializeNodes(): void {
  nodes.length = 0; // Clear any existing nodes
}