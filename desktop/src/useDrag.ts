import { useRef, type PointerEvent } from "react";

export function useDrag(onClick?: () => void) {
  const down = useRef<{ x: number; y: number; dragging: boolean } | null>(null);

  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      down.current = { x: event.screenX, y: event.screenY, dragging: false };
      void window.desktop?.beginDrag();
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      if (!down.current) return;
      const distance = Math.hypot(event.screenX - down.current.x, event.screenY - down.current.y);
      if (!down.current.dragging && distance < 5) return;
      down.current.dragging = true;
      void window.desktop?.dragMove();
    },
    onPointerUp() {
      const dragged = down.current?.dragging;
      down.current = null;
      if (dragged) void window.desktop?.endDrag();
      else onClick?.();
    },
    onPointerCancel() {
      if (down.current?.dragging) void window.desktop?.endDrag();
      down.current = null;
    },
  };
}
