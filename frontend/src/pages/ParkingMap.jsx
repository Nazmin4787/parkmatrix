import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import Loading from '../UIcomponents/Loading';
import { getParkingLotsByLocation } from '../services/parkingLot';

const containerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  margin: '20px 0'
};

// Updated libraries to include marker
const libraries = ['places', 'marker'];

const ParkingMap = () => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries,
    });

    const [map, setMap] = useState(null);
    const [center, setCenter] = useState({ lat: 3.1390, lng: 101.6869 }); // Default center to Kuala Lumpur
    const [parkingLots, setParkingLots] = useState([]);
    const [selectedLot, setSelectedLot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [markers, setMarkers] = useState([]);

    // Log API key for debugging (remove in production)
    useEffect(() => {
        if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
            console.error("Google Maps API Key is missing. Check your .env file.");
            setError('Google Maps API Key is missing. Please check your configuration.');
        }
    }, []);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setCenter(userLocation);
                    fetchParkingLots(userLocation.lat, userLocation.lng);
                },
                () => {
                    setError('Geolocation permission denied. Using default location.');
                    fetchParkingLots(center.lat, center.lng);
                }
            );
        } else {
            setError('Geolocation is not supported by this browser.');
            fetchParkingLots(center.lat, center.lng);
        }
    }, []);

    const fetchParkingLots = async (lat, lng) => {
        try {
            setLoading(true);
            const response = await getParkingLotsByLocation(lat, lng);
            // The API returns the data directly, so we need to access it
            setParkingLots(response.data);
        } catch (err) {
            setError('Failed to load parking data. Please try again later.');
            console.error('Error fetching parking lots:', err);
        } finally {
            setLoading(false);
        }
    };

    const onLoad = useCallback(function callback(map) {
        const bounds = new window.google.maps.LatLngBounds(center);
        map.fitBounds(bounds);
        setMap(map);
    }, [center]);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    // Create advanced markers when map and parking lots are available
    useEffect(() => {
        if (isLoaded && map && parkingLots.length > 0) {
            // Clear any existing markers
            markers.forEach(marker => marker.map = null);
            
            // Create new markers
            const newMarkers = [];
            
            // Create user location marker
            const userMarker = new window.google.maps.marker.AdvancedMarkerElement({
                map,
                position: center,
                title: "Your Location",
                content: createMarkerElement("blue")
            });
            newMarkers.push(userMarker);
            
            // Create parking lot markers
            parkingLots.forEach(lot => {
                const marker = new window.google.maps.marker.AdvancedMarkerElement({
                    map,
                    position: { lat: lot.latitude, lng: lot.longitude },
                    title: lot.name,
                    content: createMarkerElement("red")
                });
                
                marker.addListener("click", () => {
                    setSelectedLot(lot);
                });
                
                newMarkers.push(marker);
            });
            
            setMarkers(newMarkers);
        }
    }, [isLoaded, map, parkingLots, center]);

    // Helper function to create custom marker elements
    const createMarkerElement = (color) => {
        const pinBackground = color === "blue" ? "#1877F2" : "#E74C3C";
        const pinElement = document.createElement("div");
        pinElement.innerHTML = `
            <div style="
                background-color: ${pinBackground};
                width: 24px;
                height: 24px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
                <div style="
                    width: 12px;
                    height: 12px;
                    background-color: white;
                    border-radius: 50%;
                    transform: rotate(45deg);
                "></div>
            </div>
        `;
        return pinElement;
    };

    if (loadError) {
        return (
            <div className="error-container" style={{ padding: '20px', textAlign: 'center' }}>
                <h3>Error Loading Google Maps</h3>
                <p>Please check your API key and internet connection.</p>
                <p>Error details: {loadError.message}</p>
            </div>
        );
    }

    if (!isLoaded) return <Loading />;

    return (
        <div className="parking-map-container">
            <h2>Find Parking Near You</h2>
            {error && <p className="error-message" style={{ color: 'red', padding: '10px' }}>{error}</p>}
            
            <div className="map-wrapper" style={{ position: 'relative' }}>
                {loading && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}><Loading /></div>}
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={14}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                        fullscreenControl: true,
                        streetViewControl: true,
                        mapTypeControl: true,
                        zoomControl: true
                    }}
                >
                    {/* InfoWindow is still used from react-google-maps/api */}
                    {selectedLot && (
                        <InfoWindow
                            position={{ lat: selectedLot.latitude, lng: selectedLot.longitude }}
                            onCloseClick={() => setSelectedLot(null)}
                        >
                            <div>
                                <h4>{selectedLot.name}</h4>
                                <p>{selectedLot.address}</p>
                                <p><strong>Hourly Rate:</strong> ${selectedLot.hourly_rate}</p>
                                <p><strong>Daily Rate:</strong> ${selectedLot.daily_rate}</p>
                                <p><strong>Monthly Rate:</strong> ${selectedLot.monthly_rate}</p>
                                <p><em>{selectedLot.distance} away</em></p>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            </div>
        </div>
    );
};

export default ParkingMap;
