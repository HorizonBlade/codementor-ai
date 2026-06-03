import React, { useState, useEffect, useRef } from 'react';
import TaskPanel from '../components/TaskPanel';
import CodeEditor from '../components/CodeEditor';
import FeedbackPanel from '../components/FeedbackPanel';

function PracticePage() {
  const [leftWidth, setLeftWidth] = useState(45); // percentage (45% default)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const startResize = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidthPx = e.clientX - containerRect.left;
      const newWidthPercent = (newWidthPx / containerRect.width) * 100;
      
      // Enforce bounds (30% to 70%)
      if (newWidthPercent >= 30 && newWidthPercent <= 70) {
        setLeftWidth(newWidthPercent);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="practice-page animate-fade-in" ref={containerRef}>
      <div className="practice-page__main">
        {/* Left Side: Task Description */}
        <div 
          className="practice-page__left" 
          style={{ flexBasis: `${leftWidth}%`, width: `${leftWidth}%` }}
        >
          <TaskPanel />
        </div>

        {/* Draggable Divider */}
        <div 
          className={`practice-page__divider ${isDragging ? 'practice-page__divider--dragging' : ''}`}
          onMouseDown={startResize}
        />

        {/* Right Side: Monaco Editor + Feedback Panel */}
        <div className="practice-page__right">
          {/* Editor occupies top space */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <CodeEditor />
          </div>

          {/* Feedback occupies bottom space */}
          <div className="practice-page__bottom">
            <FeedbackPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PracticePage;
