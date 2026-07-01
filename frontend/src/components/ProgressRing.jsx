import React from 'react';

export const ProgressRing = ({
  progress = 0,
  total = 16,
  size = 60,
  strokeWidth = 5,
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeProgress = Math.min(total, Math.max(0, progress));
  const offset = circumference - (safeProgress / total) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Track Circle */}
        <circle
          className="text-primary/10"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Circle */}
        <circle
          className="text-primary transition-all duration-500 ease-out"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Percentage Center Text */}
      <div className="absolute text-xs font-mono font-bold text-primary">
        {Math.round((safeProgress / total) * 100)}%
      </div>
    </div>
  );
};

export default ProgressRing;
