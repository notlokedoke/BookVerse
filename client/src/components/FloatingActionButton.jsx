import React from 'react';
import { Link } from 'react-router-dom';
import './FloatingActionButton.css';

const FloatingActionButton = ({ to, icon, label, onClick }) => {
  if (onClick) {
    return (
      <button
        className="fab"
        aria-label={label}
        onClick={onClick}
        title={label}
      >
        {icon}
      </button>
    );
  }

  return (
    <Link
      to={to}
      className="fab"
      aria-label={label}
      title={label}
    >
      {icon}
    </Link>
  );
};

export default FloatingActionButton;
