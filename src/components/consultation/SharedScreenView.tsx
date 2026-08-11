import React, { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';
import { RemoteControlProtocol } from '../../services/remoteControlProtocol';
import { RemoteControlEvent } from '../../types/remoteControl';

interface SharedScreenViewProps {
  /** The MediaStream from VideoSDK screenShareStream or getDisplayMedia */
  screenStream: MediaStream | null;
  isControlActive: boolean;
  meetingId: string;
  customerId: string;
  controllerId: string;
  onSendEvent: (event: RemoteControlEvent) => void;
}

export const SharedScreenView: React.FC<SharedScreenViewProps> = ({
  screenStream,
  isControlActive,
  meetingId,
  customerId,
  controllerId,
  onSendEvent,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Attach stream to video element whenever it changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (screenStream) {
      video.srcObject = screenStream;
      setIsLoading(true);
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
      setIsLoading(true);
    }
  }, [screenStream]);

  // Compute normalized coordinates accounting for object-fit:contain letterboxing
  const getNorm = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return null;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;

    const rect = container.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;

    const videoAspect = vw / vh;
    const containerAspect = cw / ch;

    let displayW = cw;
    let displayH = ch;
    let offsetX = 0;
    let offsetY = 0;

    if (videoAspect > containerAspect) {
      // Letterbox: black bars top/bottom
      displayH = cw / videoAspect;
      offsetY = (ch - displayH) / 2;
    } else {
      // Pillarbox: black bars left/right
      displayW = ch * videoAspect;
      offsetX = (cw - displayW) / 2;
    }

    const relX = clientX - rect.left - offsetX;
    const relY = clientY - rect.top - offsetY;

    return {
      x: Math.max(0, Math.min(1, relX / displayW)),
      y: Math.max(0, Math.min(1, relY / displayH)),
    };
  };

  // ── Mouse event handlers (only active when isControlActive) ──────────────

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isControlActive) return;
    const c = getNorm(e.clientX, e.clientY);
    if (!c) return;
    onSendEvent(RemoteControlProtocol.createMouseMoveEvent(meetingId, customerId, controllerId, c.x, c.y));
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isControlActive) return;
    const c = getNorm(e.clientX, e.clientY);
    if (!c) return;
    const button = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left';
    onSendEvent(RemoteControlProtocol.createMouseClickEvent(meetingId, customerId, controllerId, c.x, c.y, button));
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isControlActive) return;
    const c = getNorm(e.clientX, e.clientY);
    if (!c) return;
    onSendEvent(RemoteControlProtocol.createMouseDoubleClickEvent(meetingId, customerId, controllerId, c.x, c.y));
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isControlActive) return;
    e.preventDefault();
    onSendEvent(RemoteControlProtocol.createScrollEvent(meetingId, customerId, controllerId, e.deltaY > 0 ? 3 : -3));
  };

  // ── Keyboard event handlers ───────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isControlActive) return;
    e.preventDefault();
    onSendEvent(RemoteControlProtocol.createKeyDownEvent(meetingId, customerId, controllerId, e.code));
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (!isControlActive) return;
    onSendEvent(RemoteControlProtocol.createKeyUpEvent(meetingId, customerId, controllerId, e.code));
  };

  if (!screenStream) return null;

  return (
    <div
      ref={containerRef}
      tabIndex={isControlActive ? 0 : -1}
      className={`w-full h-full bg-black rounded-2xl overflow-hidden relative flex items-center justify-center outline-none ${
        isControlActive ? 'cursor-crosshair ring-2 ring-green-500' : 'cursor-default'
      }`}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onContextMenu={e => isControlActive && e.preventDefault()}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 z-10">
          <Loader className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
        onLoadedMetadata={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
      />
      {isControlActive && (
        <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 z-10">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Remote Control Active
        </div>
      )}
      <div className="absolute top-3 left-3 bg-slate-900/80 text-white px-3 py-1.5 rounded-lg text-xs font-semibold z-10">
        🖥 Customer Screen
      </div>
    </div>
  );
};
