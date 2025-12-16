import React, { useRef, useState, useEffect } from 'react';

const Timeline = ({ 
  duration, 
  currentTime, 
  onSeek, 
  timedTexts, 
  onUpdateText, 
  editingId 
}) => {
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(null); // { id, type: 'start'|'end'|'move', initialX, initialTime }

  // Helper to get time from mouse position
  const getTimeFromEvent = (e) => {
    if (!containerRef.current || !duration) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    return (x / rect.width) * duration;
  };

  const handleMouseDown = (e, id, type) => {
    e.stopPropagation();
    const text = timedTexts.find(t => t.id === id);
    if (!text) return;
    
    setDragging({
      id,
      type,
      start: text.start,
      end: text.end
    });
  };

  // Global mouse move/up handlers for dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging || !duration) return;

      const time = getTimeFromEvent(e);
      let newStart = dragging.start;
      let newEnd = dragging.end;

      if (dragging.type === 'start') {
        newStart = Math.min(time, dragging.end - 0.1); // Prevent creating negative duration
        newStart = Math.max(0, newStart);
      } else if (dragging.type === 'end') {
        newEnd = Math.max(time, dragging.start + 0.1);
        newEnd = Math.min(duration, newEnd);
      }

      // Notify parent of update (live preview)
      onUpdateText(dragging.id, newStart, newEnd);
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, duration, onUpdateText]);

  // Handle seeking on the track itself
  const handleTrackClick = (e) => {
    // Only seek if we aren't dragging a handle
    if (!dragging) {
      const time = getTimeFromEvent(e);
      onSeek(time);
    }
  };

  return (
    <div className="flex flex-col w-full h-16 select-none">
       {/* Time labels */}
       <div className="flex justify-between text-xs text-slate-500 font-mono px-1 mb-1">
        <span>00:00</span>
        <span>{duration ? new Date(duration * 1000).toISOString().substr(14, 5) : '00:00'}</span>
      </div>

      <div 
        ref={containerRef}
        className="relative flex-1 bg-slate-800 rounded-lg cursor-pointer group overflow-hidden ring-1 ring-white/10"
        onMouseDown={handleTrackClick}
      >
        {/* Playhead Progress Background (elapsed time) */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-slate-700/50 pointer-events-none"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />

        {/* Text Segments */}
        {timedTexts.map(text => {
          const left = (text.start / duration) * 100;
          const width = ((text.end - text.start) / duration) * 100;
          const isEditing = editingId === text.id;

          return (
            <div
              key={text.id}
              className={`absolute top-2 bottom-2 rounded text-xs overflow-hidden flex items-center justify-center 
                ${isEditing ? 'bg-blue-500/30 border border-blue-400/50 z-20' : 'bg-rose-500/30 border border-rose-400/50 z-10 hover:z-20 hover:bg-rose-500/40'}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`${text.content} (${text.start.toFixed(1)}s - ${text.end.toFixed(1)}s)`}
            >
              {/* Drag Handles */}
              
              {/* Left Handle (Start) */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-2 hover:w-3 cursor-ew-resize bg-green-400/80 hover:bg-green-300 transition-all flex items-center justify-center z-30"
                onMouseDown={(e) => handleMouseDown(e, text.id, 'start')}
              >
                <div className="w-[1px] h-3 bg-black/50" />
              </div>

              {/* Label */}
              <span className="truncate px-3 text-white/90 font-medium drop-shadow-md pointer-events-none">
                {text.content}
              </span>

              {/* Right Handle (End) */}
              <div 
                className="absolute right-0 top-0 bottom-0 w-2 hover:w-3 cursor-ew-resize bg-red-400/80 hover:bg-red-300 transition-all flex items-center justify-center z-30"
                onMouseDown={(e) => handleMouseDown(e, text.id, 'end')}
              >
                <div className="w-[1px] h-3 bg-black/50" />
              </div>
            </div>
          );
        })}

        {/* Playhead Indicator Line */}
        <div 
          className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-40 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.8)]"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default Timeline;
