import { createContext, useContext } from 'react';
import { Gesture } from 'react-native-gesture-handler';

export const FlowScrollGesture = createContext<ReturnType<typeof Gesture.Native> | null>(null);

export function useCanvasPanGesture() {
  const scrollGesture = useContext(FlowScrollGesture);
  const pan = Gesture.Pan()
    .minDistance(0)
    .shouldCancelWhenOutside(false)
    .runOnJS(true);

  if (scrollGesture) {
    pan.blocksExternalGesture(scrollGesture);
  }

  return pan;
}
