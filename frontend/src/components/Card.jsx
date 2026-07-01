import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({
  children,
  className = '',
  onClick,
  hoverable = false,
  glass = false,
  ...props
}) => {
  const baseClasses = `bg-card-cream border border-primary/5 rounded-3xl p-6 shadow-premium transition-shadow ${
    glass ? 'glass' : ''
  } ${onClick ? 'cursor-pointer' : ''}`;
  
  const hoverClasses = hoverable || onClick
    ? 'hover:shadow-hover hover:-translate-y-0.5 transform duration-300'
    : '';

  if (onClick) {
    return (
      <motion.div
        onClick={onClick}
        whileHover={{ y: -4, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`${baseClasses} ${hoverClasses} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
