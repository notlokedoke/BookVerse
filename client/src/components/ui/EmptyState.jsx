import React from 'react';
import Button from './Button';

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="text-center py-12 px-4">
      {icon && (
        <div className="mx-auto h-16 w-16 text-neutral-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-neutral-600 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
