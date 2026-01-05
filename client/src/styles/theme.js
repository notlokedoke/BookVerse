// Design System - Reusable CSS Classes and Utilities

export const buttonStyles = {
  base: "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  
  sizes: {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  },
  
  variants: {
    primary: "bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-sm hover:shadow-md",
    secondary: "bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500 shadow-sm hover:shadow-md",
    accent: "bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-500 shadow-sm hover:shadow-md",
    outline: "border-2 border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-500",
    ghost: "text-primary-500 hover:bg-primary-50 focus:ring-primary-500",
    danger: "bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 shadow-sm hover:shadow-md",
  }
};

export const inputStyles = {
  base: "w-full px-4 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1",
  default: "border-neutral-300 focus:border-primary-500 focus:ring-primary-500",
  error: "border-error-500 focus:border-error-500 focus:ring-error-500",
  disabled: "bg-neutral-100 cursor-not-allowed",
};

export const cardStyles = {
  base: "bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow duration-300",
  padding: {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  }
};

export const badgeStyles = {
  base: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
  variants: {
    success: "bg-success-100 text-success-700",
    warning: "bg-warning-100 text-warning-700",
    error: "bg-error-100 text-error-700",
    info: "bg-primary-100 text-primary-700",
    neutral: "bg-neutral-100 text-neutral-700",
  }
};

export const containerStyles = {
  page: "min-h-screen bg-neutral-50",
  content: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
  section: "mb-8",
};

// Helper function to combine classes
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};
