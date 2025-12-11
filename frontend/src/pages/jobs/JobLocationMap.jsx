import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue with Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different job statuses
const createColoredIcon = (color) => new L.Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
      <path fill="${color}" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.4 12.5 28.5 12.5 28.5S25 20.9 25 12.5C25 5.6 19.4 0 12.5 0z"/>
      <circle fill="white" cx="12.5" cy="12.5" r="6"/>
    </svg>
  `)}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const statusIcons = {
  'Interested': createColoredIcon('#9e9e9e'),
  'Applied': createColoredIcon('#2196f3'),
  'Screening': createColoredIcon('#ff9800'),
  'Interview': createColoredIcon('#ff5722'),
  'Offer': createColoredIcon('#4caf50'),
  'Rejected': createColoredIcon('#f44336')
};

// Component to fit map bounds to markers
function FitBounds({ bounds }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  
  return null;
}

// Helper function to get user-specific cache keys (only for geocoded jobs, not home location)
const getUserCacheKey = (key) => {
  const uuid = localStorage.getItem('uuid');
  return uuid ? `${key}_${uuid}` : key;
};

// Single Job Location Component (for use in JobDetailsModal)
export function SingleJobLocation({ job, compact = false, ProfilesAPI }) {
  const [geocoded, setGeocoded] = useState(null);
  const [homeLocation, setHomeLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    const loadHomeLocation = async () => {
      try {
        const response = await ProfilesAPI.get();
        const profileData = response.data || response;
        
        if (profileData.address) {
          // Geocode the profile address
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(profileData.address)}&limit=1`,
            { headers: { 'User-Agent': 'JobTrackerApp' } }
          );
          
          const geoData = await geoResponse.json();
          
          if (geoData && geoData.length > 0) {
            const home = {
              coords: {
                lat: parseFloat(geoData[0].lat),
                lng: parseFloat(geoData[0].lon)
              },
              address: profileData.address
            };
            
            setHomeLocation(home);
            console.log('Home location loaded:', home);
          }
        } else {
          console.log('No address in profile');
        }
      } catch (error) {
        console.error('Failed to load profile address:', error);
      } finally {
        setProfileLoaded(true);
      }
    };

    loadHomeLocation();
  }, [ProfilesAPI]);

  // Re-geocode job when home location is loaded
  useEffect(() => {
    if (homeLocation && job?.location) {
      console.log('Home location available, re-geocoding job');
      geocodeJob();
    }
  }, [homeLocation]);

  useEffect(() => {
    if (job?.location) {
      geocodeJob();
    }
  }, [job]);

  const geocodeJob = async () => {
    if (!job?.location) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(job.location)}&limit=1`,
        { headers: { 'User-Agent': 'JobTrackerApp' } }
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        
        let distance = null;
        let travelTime = null;
        
        if (homeLocation) {
          distance = calculateDistance(homeLocation.coords, coords);
          travelTime = estimateTravelTime(homeLocation.coords, coords);
        }
        
        setGeocoded({ coords, distance, travelTime });
        console.log('Geocoded job location:', { coords, distance, travelTime, homeLocation });
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
    setLoading(false);
  };

  const calculateDistance = (coord1, coord2) => {
    const R = 6371;
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const estimateTravelTime = (coord1, coord2) => {
    const distance = calculateDistance(coord1, coord2);
    return distance / 40 * 60;
  };

  // Calculate bearing/direction from home to job
  const calculateBearing = (coord1, coord2) => {
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
    const lat1 = coord1.lat * Math.PI / 180;
    const lat2 = coord2.lat * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    
    return (bearing + 360) % 360;
  };

  // Convert bearing to compass direction
  const bearingToDirection = (bearing) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(bearing / 22.5) % 16;
    return directions[index];
  };

  // Get direction arrow
  const getDirectionArrow = (bearing) => {
    if (bearing >= 337.5 || bearing < 22.5) return '↑'; // N
    if (bearing >= 22.5 && bearing < 67.5) return '↗'; // NE
    if (bearing >= 67.5 && bearing < 112.5) return '→'; // E
    if (bearing >= 112.5 && bearing < 157.5) return '↘'; // SE
    if (bearing >= 157.5 && bearing < 202.5) return '↓'; // S
    if (bearing >= 202.5 && bearing < 247.5) return '↙'; // SW
    if (bearing >= 247.5 && bearing < 292.5) return '←'; // W
    if (bearing >= 292.5 && bearing < 337.5) return '↖'; // NW
    return '•';
  };

  if (!job?.location) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        No location information available
      </div>
    );
  }

  return (
    <div style={{ padding: compact ? '0' : '15px' }}>
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          <div>🗺️ Loading location data...</div>
        </div>
      )}

      {!loading && geocoded && (
        <>
          {/* Location Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div style={{
              background: '#e3f2fd',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #90caf9'
            }}>
              <div style={{ fontSize: '12px', color: '#1976d2', fontWeight: '600', marginBottom: '5px' }}>
                📍 LOCATION
              </div>
              <div style={{ fontSize: '14px', color: '#333', marginBottom: '12px' }}>
                {job.location}
              </div>
              
              {/* Location details */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '8px',
                paddingTop: '12px',
                borderTop: '1px solid #90caf9'
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Work Location</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>
                    {job.work_location || 'Not specified'}
                  </div>
                </div>
                
                {homeLocation && geocoded?.distance ? (
                  <>
                    <div>
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Distance</div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>
                        {geocoded.distance.toFixed(1)} km
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Direction</div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>
                        {(() => {
                          const bearing = calculateBearing(homeLocation.coords, geocoded.coords);
                          const direction = bearingToDirection(bearing);
                          const arrow = getDirectionArrow(bearing);
                          return `${arrow} ${direction}`;
                        })()}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Travel Time</div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>
                        ~{Math.round(geocoded.travelTime)} min
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ gridColumn: '1 / -1', fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
                    {!homeLocation ? 'Set home address in profile to see distance & travel time' : 'Calculating...'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #ddd',
            height: '400px'
          }}>
            <MapContainer
              center={[geocoded.coords.lat, geocoded.coords.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Home marker */}
              {homeLocation && (
                <Marker 
                  position={[homeLocation.coords.lat, homeLocation.coords.lng]}
                  icon={createColoredIcon('#000000')}
                >
                  <Popup>
                    <div style={{ fontSize: '13px' }}>
                      <strong>🏠 Home</strong>
                      <div>{homeLocation.address}</div>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Job marker */}
              <Marker
                position={[geocoded.coords.lat, geocoded.coords.lng]}
                icon={createColoredIcon('#2196f3')}
              >
                <Popup>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                      {job.title}
                    </div>
                    <div style={{ color: '#666' }}>
                      {typeof job.company === 'object' ? job.company.name : job.company}
                    </div>
                    <div style={{ marginTop: '5px' }}>
                      📍 {job.location}
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Line between home and job */}
              {homeLocation && geocoded.distance && (
                <Circle
                  center={[homeLocation.coords.lat, homeLocation.coords.lng]}
                  radius={geocoded.distance * 1000}
                  pathOptions={{ color: '#2196f3', fillColor: '#2196f3', fillOpacity: 0.05, weight: 2, dashArray: '5, 10' }}
                />
              )}
            </MapContainer>
          </div>

          {/* Comparison Summary Table */}
          {homeLocation && geocoded.distance && (() => {
            const bearing = calculateBearing(homeLocation.coords, geocoded.coords);
            const direction = bearingToDirection(bearing);
            const arrow = getDirectionArrow(bearing);
            
            return (
              <div style={{
                marginTop: '20px',
                background: '#f0f7ff',
                border: '1px solid #90caf9',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: '#1976d2',
                  color: 'white',
                  padding: '12px 16px',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  📊 Location Summary
                </div>
                <div style={{ padding: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e3f2fd' }}>
                        <td style={{ padding: '12px 8px', fontWeight: '600', color: '#555', fontSize: '13px' }}>
                          Job Location
                        </td>
                        <td style={{ padding: '12px 8px', color: '#333', fontSize: '13px', textAlign: 'right' }}>
                          {job.location}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e3f2fd' }}>
                        <td style={{ padding: '12px 8px', fontWeight: '600', color: '#555', fontSize: '13px' }}>
                          Your Home
                        </td>
                        <td style={{ padding: '12px 8px', color: '#333', fontSize: '13px', textAlign: 'right' }}>
                          {homeLocation.address}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e3f2fd' }}>
                        <td style={{ padding: '12px 8px', fontWeight: '600', color: '#555', fontSize: '13px' }}>
                          Direction
                        </td>
                        <td style={{ padding: '12px 8px', color: '#333', fontSize: '13px', textAlign: 'right' }}>
                          <span style={{ fontSize: '16px', marginRight: '8px' }}>{arrow}</span>
                          {direction} ({bearing.toFixed(0)}°)
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e3f2fd' }}>
                        <td style={{ padding: '12px 8px', fontWeight: '600', color: '#555', fontSize: '13px' }}>
                          Distance
                        </td>
                        <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'right' }}>
                          <div style={{ color: '#333', fontWeight: '600' }}>
                            {geocoded.distance.toFixed(1)} km
                          </div>
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            ({(geocoded.distance * 0.621371).toFixed(1)} miles)
                          </div>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e3f2fd' }}>
                        <td style={{ padding: '12px 8px', fontWeight: '600', color: '#555', fontSize: '13px' }}>
                          Est. Travel Time
                        </td>
                        <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'right' }}>
                          <div style={{ color: '#333', fontWeight: '600' }}>
                            ~{Math.round(geocoded.travelTime)} minutes
                          </div>
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            (~{(geocoded.travelTime / 60).toFixed(1)} hours)
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 8px', fontWeight: '600', color: '#555', fontSize: '13px' }}>
                          Job Type
                        </td>
                        <td style={{ padding: '12px 8px', color: '#333', fontSize: '13px', textAlign: 'right' }}>
                          {job.job_type || 'Not specified'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  {/* Visual distance bar */}
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px', fontWeight: '600' }}>
                      COMMUTE DIFFICULTY
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      background: '#e3f2fd', 
                      borderRadius: '4px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${Math.min((geocoded.distance / 50) * 100, 100)}%`,
                        background: geocoded.distance < 10 ? '#4caf50' : 
                                   geocoded.distance < 25 ? '#ff9800' : '#f44336',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '10px', 
                      color: '#999',
                      marginTop: '4px'
                    }}>
                      <span>Easy (0-10km)</span>
                      <span>Moderate (10-25km)</span>
                      <span>Long (25km+)</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {!homeLocation && profileLoaded && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              background: '#fff3e0',
              border: '1px solid #ffb74d',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#ef6c00'
            }}>
              💡 <strong>Tip:</strong> Add your address in your profile settings to automatically calculate distances and travel times.
            </div>
          )}
        </>
      )}

      {!loading && !geocoded && (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#999',
          border: '2px dashed #ddd',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📍</div>
          <div>Unable to geocode location: {job.location}</div>
          <div style={{ fontSize: '13px', marginTop: '8px' }}>
            Try a more specific address
          </div>
        </div>
      )}
    </div>
  );
}

// Main Map Page Component
export default function JobLocationMap({ jobs = [], ProfilesAPI }) {
  const [geocodedJobs, setGeocodedJobs] = useState([]);
  const [homeLocation, setHomeLocation] = useState(null);
  const [homeAddress, setHomeAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [maxDistance, setMaxDistance] = useState('');
  const [maxTime, setMaxTime] = useState('');
  const [workLocationFilter, setWorkLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonJobs, setComparisonJobs] = useState([]);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load profile address and cached geocoding results
  useEffect(() => {
    const loadProfileAddress = async () => {
      try {
        const response = await ProfilesAPI.get();
        const profileData = response.data || response;
        
        if (profileData.address) {
          setHomeAddress(profileData.address);
          // Auto-geocode profile address
          await geocodeAddress(profileData.address);
        }
      } catch (error) {
        console.error('Failed to load profile address:', error);
      } finally {
        setProfileLoaded(true);
      }
    };

    const cached = localStorage.getItem(getUserCacheKey('geocodedJobs'));
    if (cached) {
      setGeocodedJobs(JSON.parse(cached));
    }

    loadProfileAddress();
  }, [ProfilesAPI]);

  // Geocode jobs using OpenStreetMap Nominatim
  const geocodeJobs = async () => {
    setLoading(true);
    const results = [];
    
    for (const job of jobs) {
      if (!job.location || job.archived) continue;
      
      // Check cache first
      const cached = geocodedJobs.find(g => g.id === job.id && g.location === job.location);
      if (cached) {
        results.push(cached);
        continue;
      }
      
      try {
        // Rate limiting: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(job.location)}&limit=1`,
          { headers: { 'User-Agent': 'JobTrackerApp' } }
        );
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          const coords = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
          
          const geocoded = {
            ...job,
            coords,
            distance: homeLocation ? calculateDistance(homeLocation.coords, coords) : null,
            travelTime: homeLocation ? estimateTravelTime(homeLocation.coords, coords) : null
          };
          
          results.push(geocoded);
        }
      } catch (error) {
        console.error(`Failed to geocode ${job.location}:`, error);
      }
    }
    
    setGeocodedJobs(results);
    localStorage.setItem('geocodedJobs', JSON.stringify(results));
    setLoading(false);
  };

  // Set home location
  const geocodeAddress = async (address) => {
    if (!address.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { 'User-Agent': 'JobTrackerApp' } }
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const home = {
          coords: {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          },
          address: address
        };
        
        setHomeLocation(home);
        
        // Recalculate distances
        const updated = geocodedJobs.map(job => ({
          ...job,
          distance: calculateDistance(home.coords, job.coords),
          travelTime: estimateTravelTime(home.coords, job.coords)
        }));
        
        setGeocodedJobs(updated);
        localStorage.setItem(getUserCacheKey('geocodedJobs'), JSON.stringify(updated));
        
        return true;
      } else {
        alert('Location not found. Please try a different address.');
        return false;
      }
    } catch (error) {
      console.error('Failed to geocode address:', error);
      alert('Failed to geocode address. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const setHome = async () => {
    await geocodeAddress(homeAddress);
  };

  // Calculate distance using Haversine formula (in km)
  const calculateDistance = (coord1, coord2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Estimate travel time (rough estimate: 40 km/h average for city driving)
  const estimateTravelTime = (coord1, coord2) => {
    const distance = calculateDistance(coord1, coord2);
    const avgSpeed = 40; // km/h
    return distance / avgSpeed * 60; // minutes
  };

  // Filter jobs
  const filteredJobs = geocodedJobs.filter(job => {
    if (statusFilter !== 'all' && job.status !== statusFilter) return false;
    if (workLocationFilter !== 'all' && job.work_location !== workLocationFilter) return false;
    if (maxDistance && job.distance && job.distance > parseFloat(maxDistance)) return false;
    if (maxTime && job.travelTime && job.travelTime > parseFloat(maxTime)) return false;
    return true;
  });

  // Toggle job in comparison
  const toggleComparison = (job) => {
    if (comparisonJobs.find(j => j.id === job.id)) {
      setComparisonJobs(comparisonJobs.filter(j => j.id !== job.id));
    } else {
      setComparisonJobs([...comparisonJobs, job]);
    }
  };

  // Get map bounds
  const getBounds = () => {
    const bounds = [];
    if (homeLocation) bounds.push([homeLocation.coords.lat, homeLocation.coords.lng]);
    filteredJobs.forEach(job => {
      if (job.coords) bounds.push([job.coords.lat, job.coords.lng]);
    });
    return bounds;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', color: '#1976d2' }}>📍 Job Location Map</h1>
      
      {/* Controls */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Home Location */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
            🏠 Home Location
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              placeholder={profileLoaded ? "Enter your address or update from profile" : "Loading profile address..."}
              disabled={!profileLoaded}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: !profileLoaded ? '#f5f5f5' : 'white'
              }}
            />
            <button
              onClick={setHome}
              disabled={loading || !homeAddress.trim() || !profileLoaded}
              style={{
                padding: '10px 20px',
                background: loading ? '#ccc' : '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (loading || !profileLoaded) ? 'not-allowed' : 'pointer',
                fontWeight: '600'
              }}
            >
              {loading ? '⏳' : '📍'} Set Home
            </button>
          </div>
          {homeLocation && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              ✓ Home set: {homeLocation.address}
            </div>
          )}
          {profileLoaded && !homeAddress && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#ff9800' }}>
              💡 Tip: Add your address in your profile settings to auto-populate your home location
            </div>
          )}
        </div>

        {/* Geocode Button */}
        <button
          onClick={geocodeJobs}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: loading ? '#ccc' : '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            marginBottom: '20px'
          }}
        >
          {loading ? '⏳ Processing...' : '🗺️ Geocode All Jobs'}
        </button>

        {/* Filters */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px' 
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Interested">Interested</option>
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Job Type
            </label>
            <select
              value={workLocationFilter}
              onChange={(e) => setWorkLocationFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="all">All</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Max Distance (km)
            </label>
            <input
              type="number"
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
              placeholder="Any distance"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Max Travel Time (min)
            </label>
            <input
              type="number"
              value={maxTime}
              onChange={(e) => setMaxTime(e.target.value)}
              placeholder="Any time"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div style={{ 
          marginTop: '15px', 
          padding: '12px', 
          background: '#f5f5f5', 
          borderRadius: '6px',
          display: 'flex',
          gap: '20px',
          fontSize: '13px'
        }}>
          <span>📍 Total Jobs: {geocodedJobs.length}</span>
          <span>✓ Filtered: {filteredJobs.length}</span>
          {homeLocation && (
            <span>🏠 Home Set: {homeLocation.address}</span>
          )}
        </div>
      </div>

      {/* Comparison Toggle */}
      <button
        onClick={() => setShowComparison(!showComparison)}
        style={{
          padding: '10px 20px',
          background: showComparison ? '#ff9800' : '#9c27b0',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600',
          marginBottom: '20px'
        }}
      >
        {showComparison ? '🗺️ Show Map' : '📊 Compare Locations'} ({comparisonJobs.length} selected)
      </button>

      {/* Map View */}
      {!showComparison && (
        <div style={{ 
          background: 'white', 
          borderRadius: '8px', 
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          height: '600px'
        }}>
          {filteredJobs.length === 0 && !homeLocation ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#999'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗺️</div>
                <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                  No jobs geocoded yet
                </div>
                <div style={{ fontSize: '14px' }}>
                  Click "Geocode All Jobs" to place jobs on the map
                </div>
              </div>
            </div>
          ) : (
            <MapContainer
              center={homeLocation ? [homeLocation.coords.lat, homeLocation.coords.lng] : [40.7357, -74.1724]}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <FitBounds bounds={getBounds()} />
              
              {/* Home marker */}
              {homeLocation && (
                <>
                  <Marker 
                    position={[homeLocation.coords.lat, homeLocation.coords.lng]}
                    icon={createColoredIcon('#000000')}
                  >
                    <Popup>
                      <div style={{ fontSize: '14px' }}>
                        <strong>🏠 Home</strong>
                        <div>{homeLocation.address}</div>
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* Distance circle if maxDistance is set */}
                  {maxDistance && (
                    <Circle
                      center={[homeLocation.coords.lat, homeLocation.coords.lng]}
                      radius={parseFloat(maxDistance) * 1000}
                      pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                    />
                  )}
                </>
              )}
              
              {/* Job markers */}
              {filteredJobs.map(job => (
                <Marker
                  key={job.id}
                  position={[job.coords.lat, job.coords.lng]}
                  icon={statusIcons[job.status] || statusIcons['Interested']}
                >
                  <Popup maxWidth={300}>
                    <div style={{ fontSize: '13px' }}>
                      <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '8px' }}>
                        {job.title}
                      </div>
                      <div style={{ color: '#666', marginBottom: '4px' }}>
                        {typeof job.company === 'object' ? job.company.name : job.company}
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        📍 {job.location}
                      </div>
                      <div style={{ 
                        padding: '6px 8px', 
                        background: '#f0f0f0', 
                        borderRadius: '4px',
                        marginTop: '8px'
                      }}>
                        <div><strong>Status:</strong> {job.status}</div>
                        {job.work_location && <div><strong>Job Type:</strong> {job.work_location}</div>}
                        {job.job_type && <div><strong>Employment Type:</strong> {job.job_type}</div>}
                        {job.distance && (
                          <div><strong>Distance:</strong> {job.distance.toFixed(1)} km</div>
                        )}
                        {job.travelTime && (
                          <div><strong>Travel Time:</strong> ~{Math.round(job.travelTime)} min</div>
                        )}
                      </div>
                      <button
                        onClick={() => toggleComparison(job)}
                        style={{
                          marginTop: '8px',
                          padding: '6px 12px',
                          background: comparisonJobs.find(j => j.id === job.id) ? '#ff9800' : '#2196f3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          width: '100%'
                        }}
                      >
                        {comparisonJobs.find(j => j.id === job.id) ? '✓ In Comparison' : '+ Add to Compare'}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      )}

      {/* Comparison View */}
      {showComparison && (
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '20px' }}>📊 Location Comparison</h2>
          
          {comparisonJobs.length === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: '#999',
              border: '2px dashed #ddd',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📍</div>
              <div>Click on job markers to add them to comparison</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Job</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Company</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Location</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Work Location</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Distance</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Travel Time</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonJobs.map((job, idx) => (
                    <tr key={job.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>{job.title}</td>
                      <td style={{ padding: '12px' }}>
                        {typeof job.company === 'object' ? job.company.name : job.company}
                      </td>
                      <td style={{ padding: '12px' }}>{job.location}</td>
                      <td style={{ padding: '12px' }}>{job.job_type || 'N/A'}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {job.distance ? `${job.distance.toFixed(1)} km` : 'N/A'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {job.travelTime ? `~${Math.round(job.travelTime)} min` : 'N/A'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: statusIcons[job.status] ? '#e3f2fd' : '#f5f5f5',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {job.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleComparison(job)}
                          style={{
                            padding: '6px 12px',
                            background: '#ff3b30',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}