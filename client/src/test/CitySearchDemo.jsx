import React, { useState } from 'react';
import { worldCities, cityAliases } from '../data/worldCities';

const CitySearchDemo = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);

  const searchCities = (input) => {
    if (!input || input.length < 2) return [];
    
    const searchTerm = input.toLowerCase().trim();
    
    // Check aliases first
    const aliasMatch = cityAliases[input.toUpperCase()];
    if (aliasMatch) {
      return [aliasMatch];
    }
    
    // Search through all cities
    const scoredCities = worldCities.map(city => {
      const cityLower = city.toLowerCase();
      let score = 0;
      
      if (cityLower === searchTerm) score = 100;
      else if (cityLower.startsWith(searchTerm)) score = 90;
      else if (cityLower.includes(searchTerm)) score = 50;
      else {
        const words = cityLower.split(/[\s,]+/);
        if (words.some(word => word.startsWith(searchTerm))) score = 70;
        if (words.some(word => word.includes(searchTerm) && word.length > 3)) score = 30;
      }
      
      return { city, score };
    });
    
    return scoredCities
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.city);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    const searchResults = searchCities(value);
    setResults(searchResults);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🌍 Global City Search Demo</h1>
      <p>Test the free city search with 500+ cities worldwide!</p>
      
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Try: London, Tokyo, NYC, Mumbai, São Paulo..."
          value={searchTerm}
          onChange={handleSearch}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '2px solid #ddd',
            borderRadius: '8px'
          }}
        />
      </div>
      
      {results.length > 0 && (
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {results.map((city, index) => (
            <div
              key={index}
              style={{
                padding: '0.75rem',
                borderBottom: index < results.length - 1 ? '1px solid #eee' : 'none',
                cursor: 'pointer',
                backgroundColor: '#fff'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
              onClick={() => {
                setSearchTerm(city);
                setResults([]);
              }}
            >
              {city}
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        <h3>✨ Features:</h3>
        <ul>
          <li>🌍 <strong>500+ Cities</strong> from all continents</li>
          <li>🔍 <strong>Smart Search</strong> with aliases (NYC → New York, NY)</li>
          <li>🏙️ <strong>Major Cities</strong> + regional options</li>
          <li>🏞️ <strong>Rural Areas</strong> for privacy</li>
          <li>⚡ <strong>Instant Results</strong> - no API calls needed</li>
          <li>💰 <strong>Completely Free</strong> - no billing required</li>
        </ul>
        
        <h3>🧪 Try These Searches:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
          {['London', 'Tokyo', 'NYC', 'Mumbai', 'São Paulo', 'Rural', 'Greater'].map(term => (
            <button
              key={term}
              onClick={() => {
                setSearchTerm(term);
                setResults(searchCities(term));
              }}
              style={{
                padding: '0.25rem 0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: '#f9f9f9',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CitySearchDemo;