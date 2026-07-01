import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-card-cream border border-primary/5 rounded-3xl p-6 shadow-premium animate-pulse space-y-4">
    <div className="h-6 w-1/3 bg-primary/10 rounded-lg"></div>
    <div className="h-4 w-full bg-primary/5 rounded-md"></div>
    <div className="h-4 w-2/3 bg-primary/5 rounded-md"></div>
    <div className="flex justify-between items-center pt-2">
      <div className="h-8 w-24 bg-primary/10 rounded-xl"></div>
      <div className="h-6 w-12 bg-primary/10 rounded-md"></div>
    </div>
  </div>
);

export const ListSkeleton = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        className="flex items-center gap-3 p-4 bg-card-cream border border-primary/5 rounded-2xl animate-pulse"
      >
        <div className="w-10 h-10 rounded-full bg-primary/10"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/4 bg-primary/10 rounded-md"></div>
          <div className="h-3 w-1/3 bg-primary/5 rounded-md"></div>
        </div>
        <div className="w-16 h-6 bg-primary/10 rounded-full"></div>
      </div>
    ))}
  </div>
);

export const GridSkeleton = ({ count = 16 }) => (
  <div className={`grid ${count === 16 ? 'grid-cols-4' : 'grid-cols-5'} gap-2 md:gap-4 animate-pulse`}>
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        className="aspect-square bg-card-cream border border-primary/5 rounded-2xl flex flex-col items-center justify-center p-2"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 mb-2"></div>
        <div className="h-3 w-2/3 bg-primary/5 rounded-md mb-1"></div>
        <div className="h-3 w-1/2 bg-primary/5 rounded-md"></div>
      </div>
    ))}
  </div>
);
