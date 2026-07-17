export interface DemoSceneHandle {
  id: string;
  deactivate: (immediate?: boolean) => void;
}

let activeScene: DemoSceneHandle | null = null;

export function claimDemoScene(scene: DemoSceneHandle): void {
  if (activeScene?.id === scene.id) return;
  activeScene?.deactivate(true);
  activeScene = scene;
}

export function releaseDemoScene(id: string): void {
  if (activeScene?.id === id) activeScene = null;
}
