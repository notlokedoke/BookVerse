// Design System — Material Design with Green Theme
// Reusable CSS Classes and Utilities

export const buttonStyles = {
  base: "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  
  sizes: {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  },
  
  variants: {
    primary: "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500 shadow-sm hover:shadow-md",
    secondary: "bg-slate-700 text-white hover:bg-slate-800 focus:ring-slate-500 shadow-sm hover:shadow-md",
    accent: "bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-500 shadow-sm hover:shadow-md",
    outline: "border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-50 focus:ring-emerald-500",
    ghost: "text-emerald-500 hover:bg-emerald-50 focus:ring-emerald-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md",
  }
};

export const inputStyles = {
  base: "w-full px-4 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1",
  default: "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500",
  error: "border-red-500 focus:border-red-500 focus:ring-red-500",
  disabled: "bg-slate-100 cursor-not-allowed",
};

export const cardStyles = {
  base: "bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200",
  padding: {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  }
};

export const badgeStyles = {
  base: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
  variants: {
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-700",
    info: "bg-teal-100 text-teal-700",
    neutral: "bg-slate-100 text-slate-700",
  }
};

export const containerStyles = {
  page: "min-h-screen bg-slate-100",
  content: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
  section: "mb-8",
};

// Helper function to combine classes
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};
