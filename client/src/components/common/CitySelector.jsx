import React, { useEffect, useRef, useState } from 'react';
import { useCitySearch } from '../../hooks/useCitySearch';
import { inputStyles, cn } from '../../styles/theme';
import './CitySelector.css';

const CitySelector = ({
    value,
    onChange,
    label = "City / Region",
    error,
    disabled = false,
    placeholder = "Search for a city...",
    className,
    required = false,
    name = "city"
}) => {
    const {
        query,
        setQuery,
        suggestions,
        isLoading,
        error: searchError,
        isLocating,
        getCurrentLocation,
        setSuggestions
    } = useCitySearch(value || '');

    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    const initialValueRef = useRef(value);
    
    // Sync external value only on mount or when externally changed (not from internal updates)
    useEffect(() => {
        if (value !== undefined && value !== query && value !== initialValueRef.current) {
            setQuery(value);
            initialValueRef.current = value;
        }
    }, [value]);

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const newVal = e.target.value;
        setQuery(newVal);
        initialValueRef.current = newVal;
        onChange && onChange({ target: { name, value: newVal } });
        setShowSuggestions(true);
    };

    const handleSelect = (city) => {
        setQuery(city);
        initialValueRef.current = city;
        setSuggestions([]);
        setShowSuggestions(false);
        onChange && onChange({ target: { name, value: city } });
    };


    return (
        <div className={`w-full ${className || ''}`} ref={wrapperRef}>
            {label && (
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    {label}
                    {required && <span className="text-error-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <input
                    type="text"
                    name={name}
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                    placeholder={placeholder}
                    disabled={disabled || isLocating}
                    className={cn(
                        inputStyles.base,
                        (error || searchError) ? inputStyles.error : inputStyles.default,
                        (disabled || isLocating) && inputStyles.disabled,
                        "pr-10" // Space for location button
                    )}
                    autoComplete="off"
                />

                {/* Location Button */}
                <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={disabled || isLocating}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-neutral-100 transition-colors ${isLocating ? 'text-primary-500 animate-pulse' : 'text-neutral-400 hover:text-primary-500'
                        }`}
                    title="Use my current location"
                >
                    {isLocating ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>

                {/* Suggestions Dropdown */}
                {showSuggestions && (suggestions.length > 0 || isLoading) && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {isLoading ? (
                            <div className="p-3 text-sm text-neutral-500 flex items-center justify-center">
                                <span className="w-4 h-4 border-2 border-neutral-300 border-t-primary-500 rounded-full animate-spin mr-2"></span>
                                Searching globally...
                            </div>
                        ) : (
                            <ul className="py-1">
                                {suggestions.map((city, idx) => (
                                    <li
                                        key={idx}
                                        onClick={() => handleSelect(city)}
                                        className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 cursor-pointer flex items-center"
                                    >
                                        <span className="mr-2">📍</span>
                                        {city}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {(error || searchError) && (
                <p className="mt-1.5 text-sm text-error-600 animate-slide-down">
                    {error || searchError}
                </p>
            )}
        </div>
    );
};

export default CitySelector;
