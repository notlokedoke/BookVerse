import React from 'react'
import './PrivacyToggle.css'

const PrivacyToggle = ({ 
  showCity, 
  onChange, 
  disabled = false,
  label = "Show city on profile",
  description = "When enabled, other users can see your city information"
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!showCity)
    }
  }

  return (
    <div className="privacy-toggle-container">
      <div className="privacy-toggle-content">
        <div className="privacy-toggle-info">
          <label className="privacy-toggle-label" htmlFor="city-visibility-toggle">
            {label}
          </label>
          {description && (
            <p className="privacy-toggle-description">
              {description}
            </p>
          )}
        </div>
        
        <div className="privacy-toggle-switch-container">
          <button
            id="city-visibility-toggle"
            type="button"
            role="switch"
            aria-checked={showCity}
            aria-label={`${showCity ? 'Hide' : 'Show'} city on profile`}
            className={`privacy-toggle-switch ${showCity ? 'enabled' : 'disabled'} ${disabled ? 'loading' : ''}`}
            onClick={handleToggle}
            disabled={disabled}
          >
            <span className="privacy-toggle-slider">
              <span className="privacy-toggle-thumb"></span>
            </span>
          </button>
          
          <span className="privacy-toggle-status" aria-live="polite">
            {showCity ? 'Visible' : 'Hidden'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PrivacyToggle