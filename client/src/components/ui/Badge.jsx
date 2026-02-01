import React from 'react';
import { badgeStyles, cn } from '../../styles/theme';

const Badge = ({ 
  children, 
  variant = 'neutral',
  className = '',
  ...props 
}) => {
  return (
    <span
      className={cn(
        badgeStyles.base,
        badgeStyles.variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
