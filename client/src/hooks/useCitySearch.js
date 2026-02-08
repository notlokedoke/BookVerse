import { useState, useEffect, useCallback } from 'react';
import { worldCities } from '../data/worldCities';

const REC_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const REC_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

export const useCitySearch = (initialValue = '') => {
    const [query, setQuery] = useState(initialValue);
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isLocating, setIsLocating] = useState(false);

    // Debounce helper
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    const fetchCities = async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 2) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Nominatim Search
            const params = new URLSearchParams({
                q: searchTerm,
                format: 'json',
                addressdetails: 1,
                limit: 5,
                featuretype: 'city'
            });

            const response = await fetch(`${REC_SEARCH_URL}?${params.toString()}`, {
                headers: {
                    'User-Agent': 'BookVerse-App/1.0'
                }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            const formatted = data.map(item => {
                const addr = item.address;
                const city = addr.city || addr.town || addr.village || addr.hamlet || addr.municipality || item.name;
                const state = addr.state || addr.region;
                const country = addr.country;

                return [city, state, country].filter(Boolean).join(', ');
            });

            // Dedup
            const unique = [...new Set(formatted)];

            if (unique.length > 0) {
                setSuggestions(unique);
            } else {
                // Fallback to local if API returns nothing but we have local matches
                const local = worldCities.filter(c =>
                    c.toLowerCase().includes(searchTerm.toLowerCase())
                ).slice(0, 5);
                setSuggestions(local);
            }

        } catch (err) {
            // Silently fallback to local data (CORS errors are expected in development)
            const local = worldCities.filter(c =>
                c.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 5);
            setSuggestions(local);
        } finally {
            setIsLoading(false);
        }
    };

    // Build the debounced function
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedFetch = useCallback(debounce(fetchCities, 500), []);

    useEffect(() => {
        if (query.length >= 2) {
            debouncedFetch(query);
        } else {
            setSuggestions([]);
        }
    }, [query, debouncedFetch]);


    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported');
            return;
        }

        setIsLocating(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { latitude, longitude } = pos.coords;
                const params = new URLSearchParams({
                    lat: latitude,
                    lon: longitude,
                    format: 'json',
                    addressdetails: 1
                });

                const response = await fetch(`${REC_REVERSE_URL}?${params.toString()}`, {
                    headers: {
                        'User-Agent': 'BookVerse-App/1.0'
                    }
                });

                if (!response.ok) throw new Error("Reverse geocode failed");

                const data = await response.json();
                const addr = data.address;
                const city = addr.city || addr.town || addr.village || addr.hamlet || addr.municipality || addr.county;
                const state = addr.state || addr.region;
                const country = addr.country;

                const locStr = [city, state, country].filter(Boolean).join(', ');
                setQuery(locStr);
                setSuggestions([]);

            } catch (err) {
                // Silently fail - CORS errors are expected in development
                setError('Failed to detect location');
            } finally {
                setIsLocating(false);
            }
        }, (err) => {
            setError('Location access denied or failed');
            setIsLocating(false);
        });
    };

    return {
        query,
        setQuery,
        suggestions,
        isLoading,
        error,
        isLocating,
        getCurrentLocation,
        setSuggestions
    };
};
