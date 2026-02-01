import React from 'react';
import { cardStyles, cn } from '../../styles/theme';

const Card = ({ 
  children, 
  padding = 'md',
  className = '',
  ...props 
}) => {
  return (
    <div
      className={cn(
        cardStyles.base,
        cardStyles.padding[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
