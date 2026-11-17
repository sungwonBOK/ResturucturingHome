import { getWorkflowRoute } from './workflowRoute';

assertEqual(getWorkflowRoute('roomPlanSetup', 'draft-1'), '/(main)/room-plan-setup?draftId=draft-1', 'room setup route');
assertEqual(getWorkflowRoute('furnitureEditor', 'draft-1'), '/(main)/furniture-editor?draftId=draft-1', 'furniture route');
assertEqual(getWorkflowRoute('recommendationStyle', 'draft-1'), '/(main)/recommendation-style?draftId=draft-1', 'style route');
assertEqual(getWorkflowRoute('recommendationResults', 'draft-1'), '/(main)/recommendation-results?draftId=draft-1', 'result route');

function assertEqual(actual: string, expected: string, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}
