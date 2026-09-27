import {
  WorkflowDefinition,
  DAGValidationResult,
  DAGValidationError,
} from '@/types/workflowDSL';

export class DAGValidatorEngine {
  public validateDAG(workflow: WorkflowDefinition): DAGValidationResult {
    const errors: DAGValidationError[] = [];
    const { nodes, edges } = workflow;

    // 1. Basic Node & Uniqueness Check
    if (!nodes || nodes.length === 0) {
      errors.push({ type: 'SCHEMA', message: 'Workflow must contain at least one node.' });
      return { valid: false, errors };
    }

    const nodeMap = new Map<string, typeof nodes[0]>();
    const nodeIds = new Set<string>();

    for (const node of nodes) {
      if (!node.id || !node.id.trim()) {
        errors.push({ type: 'SCHEMA', message: 'Workflow contains a node with a missing or empty ID.' });
        continue;
      }
      if (nodeIds.has(node.id)) {
        errors.push({ nodeId: node.id, type: 'SCHEMA', message: `Duplicate node ID detected: '${node.id}'.` });
      }
      nodeIds.add(node.id);
      nodeMap.set(node.id, node);
    }

    // 2. Edge Integrity Check
    const inDegree = new Map<string, number>();
    const outDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    nodeIds.forEach((id) => {
      inDegree.set(id, 0);
      outDegree.set(id, 0);
      adj.set(id, []);
    });

    for (const edge of edges || []) {
      if (!nodeMap.has(edge.source)) {
        errors.push({ edgeId: edge.id, type: 'MISSING_NODE', message: `Edge '${edge.id}' references missing source node '${edge.source}'.` });
      }
      if (!nodeMap.has(edge.target)) {
        errors.push({ edgeId: edge.id, type: 'MISSING_NODE', message: `Edge '${edge.id}' references missing target node '${edge.target}'.` });
      }

      if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
        adj.get(edge.source)!.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
        outDegree.set(edge.source, (outDegree.get(edge.source) || 0) + 1);
      }
    }

    // 3. Condition Branch Validation
    for (const node of nodes) {
      if (node.type === 'CONDITION') {
        const outgoingEdges = (edges || []).filter((e) => e.source === node.id);
        const hasTrue = outgoingEdges.some((e) => e.condition?.label === 'TRUE' || e.condition?.expression?.toLowerCase().includes('true'));
        const hasFalse = outgoingEdges.some((e) => e.condition?.label === 'FALSE' || e.condition?.expression?.toLowerCase().includes('false'));

        if (outgoingEdges.length < 2 || (!hasTrue && !hasFalse && outgoingEdges.length < 2)) {
          errors.push({
            nodeId: node.id,
            type: 'INVALID_CONDITION',
            message: `Condition node '${node.name}' (${node.id}) must have both TRUE and FALSE outgoing branches.`,
          });
        }
      }
    }

    // 4. Entry & Terminal Node Analysis
    const entryNodeIds: string[] = [];
    const terminalNodeIds: string[] = [];

    nodeIds.forEach((id) => {
      if (inDegree.get(id) === 0) entryNodeIds.push(id);
      if (outDegree.get(id) === 0) terminalNodeIds.push(id);
    });

    if (entryNodeIds.length === 0) {
      errors.push({ type: 'CYCLE', message: 'Workflow graph contains no entry node (potential cycle).' });
    }

    // 5. Cycle Detection & Topological Ordering via Kahn's Algorithm
    const tempInDegree = new Map(inDegree);
    const queue: string[] = [...entryNodeIds];
    const topologicalOrder: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      topologicalOrder.push(current);

      for (const neighbor of adj.get(current) || []) {
        tempInDegree.set(neighbor, (tempInDegree.get(neighbor) || 0) - 1);
        if (tempInDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (topologicalOrder.length !== nodeIds.size) {
      errors.push({
        type: 'CYCLE',
        message: 'Cyclic dependency detected in workflow DAG. FlowMind Workflow Engine enforces acyclic graphs.',
      });
    }

    // 6. Unreachable Node Check
    const reachable = new Set<string>();
    const dfsReachable = (id: string) => {
      if (reachable.has(id)) return;
      reachable.add(id);
      for (const neighbor of adj.get(id) || []) {
        dfsReachable(neighbor);
      }
    };
    entryNodeIds.forEach(dfsReachable);

    nodeIds.forEach((id) => {
      if (!reachable.has(id)) {
        errors.push({
          nodeId: id,
          type: 'UNREACHABLE',
          message: `Node '${nodeMap.get(id)?.name}' (${id}) is unreachable from any trigger entry point.`,
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      topologicalOrder: errors.length === 0 ? topologicalOrder : undefined,
      entryNodeIds,
      terminalNodeIds,
    };
  }
}

export const dagValidator = new DAGValidatorEngine();
