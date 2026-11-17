export type WorkflowRouteName =
  | 'roomPlanSetup'
  | 'furnitureEditor'
  | 'recommendationStyle'
  | 'recommendationResults';

const paths: Record<WorkflowRouteName, string> = {
  roomPlanSetup: '/(main)/room-plan-setup',
  furnitureEditor: '/(main)/furniture-editor',
  recommendationStyle: '/(main)/recommendation-style',
  recommendationResults: '/(main)/recommendation-results',
};

export function getWorkflowRoute(name: WorkflowRouteName, draftId: string): string {
  return `${paths[name]}?draftId=${encodeURIComponent(draftId)}`;
}
