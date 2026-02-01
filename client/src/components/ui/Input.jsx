import React from 'react';
import { inputStyles, cn } from '../../styles/theme';

const Input = ({ 
  label,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <input
        disabled={disabled}
        className={cn(
          inputStyles.base,
          error ? inputStyles.error : inputStyles.default,
          disabled && inputStyles.disabled,
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-error-600 animate-slide-down">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
