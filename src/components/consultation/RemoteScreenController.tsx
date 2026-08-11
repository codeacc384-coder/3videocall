import React, { useRef, useEffect, useState } from 'react';
import { RemoteControlProtocol } from '../../services/remoteControlProtocol';
import { RemoteControlEvent } from '../../types/remoteControl';

interface RemoteScreenControllerProps {
  isControlActive: boolean;
  meetingId: string;
  customerId: string;
  controllerId: string;
  onSendEvent: (event: RemoteControlEvent) => void;
  children: React.ReactNode;
}

export const RemoteScreenController: React.FC<RemoteScreenControllerProps> = ({
  isControlActive,
  meetingId,
  customerId,
  controllerId,
  onSendEvent,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasFocus, setHasFocus] = useState(false);

  useEffect(() => {
    if (!isControlActive || !containerRef.current) return;

    const container = containerRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isControlActive) return;

      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Clamp to 0-1
      const normalizedX = Math.max(0, Math.min(1, x));
      const normalizedY = Math.max(0, Math.min(1, y));

      const event = RemoteControlProtocol.createMouseMoveEvent(
        meetingId,
        customerId,
        controllerId,
        normalizedX,
        normalizedY
      );
      onSendEvent(event);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!isControlActive) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const normalizedX = Math.max(0, Math.min(1, x));
      const normalizedY = Math.max(0, Math.min(1, y));

      const button = e.button === 0 ? 'left' : e.button === 2 ? 'right' : 'middle';
      const event = RemoteControlProtocol.createMouseClickEvent(
        meetingId,
        customerId,
        controllerId,
        normalizedX,
        normalizedY,
        button
      );
      onSendEvent(event);
    };

    const handleDoubleClick = (e: MouseEvent) => {
      if (!isControlActive) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const normalizedX = Math.max(0, Math.min(1, x));
      const normalizedY = Math.max(0, Math.min(1, y));

      const event = RemoteControlProtocol.createMouseDoubleClickEvent(
        meetingId,
        customerId,
        controllerId,
        normalizedX,
        normalizedY
      );
      onSendEvent(event);
    };

    const handleWheel = (e: WheelEvent) => {
      if (!isControlActive || !hasFocus) return;
      e.preventDefault();

      const event = RemoteControlProtocol.createScrollEvent(
        meetingId,
        customerId,
        controllerId,
        e.deltaY > 0 ? 3 : -3
      );
      onSendEvent(event);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isControlActive || !hasFocus) return;

      const event = RemoteControlProtocol.createKeyDownEvent(
        meetingId,
        customerId,
        controllerId,
        e.code
      );
      onSendEvent(event);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isControlActive || !hasFocus) return;

      const event = RemoteControlProtocol.createKeyUpEvent(
        meetingId,
        customerId,
        controllerId,
        e.code
      );
      onSendEvent(event);
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (isControlActive) {
        e.preventDefault();
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('dblclick', handleDoubleClick);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const handleFocus = () => setHasFocus(true);
    const handleBlur = () => setHasFocus(false);

    container.addEventListener('focus', handleFocus);
    container.addEventListener('blur', handleBlur);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('dblclick', handleDoubleClick);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      container.removeEventListener('focus', handleFocus);
      container.removeEventListener('blur', handleBlur);
    };
  }, [isControlActive, meetingId, customerId, controllerId, onSendEvent, hasFocus]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`relative ${isControlActive ? 'cursor-crosshair' : 'cursor-default'}`}
      style={{
        outline: isControlActive ? '2px solid #3b82f6' : 'none',
      }}
    >
      {isControlActive && (
        <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-semibold">
          Remote Control Active
        </div>
      )}
      {children}
    </div>
  );
};
