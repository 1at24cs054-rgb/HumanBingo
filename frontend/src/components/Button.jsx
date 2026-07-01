import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-display font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary/45 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/10',
    secondary: 'bg-sage/20 text-primary border border-sage/40 hover:bg-sage/35',
    gold: 'bg-gold text-white hover:bg-gold/90 shadow-md shadow-gold/10',
    danger: 'bg-error text-white hover:bg-error/90 shadow-md shadow-error/10',
    outline: 'bg-transparent text-primary border-2 border-primary hover:bg-primary/10',
    minimal: 'bg-transparent text-primary hover:bg-primary/5',
    dark: 'bg-sidebar text-white hover:bg-sidebar/95',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base rounded-2xl',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </motion.button>
  );
};

export default Button;
