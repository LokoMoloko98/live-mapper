import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './App.css'

interface VehicleData {
  data: {
    event_ts: string
    bearing: number
    speed: number
    ignition: boolean
    odometer: number
    altitude: number
    location: {
      updated: string
      longitude: number
      latitude: number
      position_description: string
    }
  }
}

const API_URL = import.meta.env.VITE_API_URL || ''

function App() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const marker = useRef<maplibregl.Marker | null>(null)
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastPosition = useRef<{ lng: number; lat: number } | null>(null)

  // Fetch vehicle data
  const fetchVehicleData = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(`${API_URL}/api/vehicle/status`, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      
      if (!response.ok) throw new Error('Failed to fetch vehicle data')
      const data: VehicleData = await response.json()
      setVehicleData(data)
      setError(null)
      return data
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timeout - API is slow')
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
      return null
    }
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [18.50841, -33.827274], // Default to Cape Town
      zoom: 12,
      maxZoom: 19,
      minZoom: 2,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right')

    // Wait for map to load before fetching data
    map.current.on('load', () => {
      setLoading(false)
      fetchVehicleData()
    })

    return () => {
      map.current?.remove()
    }
  }, [])

  // Update marker when vehicle data changes
  useEffect(() => {
    if (!map.current || !vehicleData) return

    const { longitude, latitude, position_description } = vehicleData.data.location
    const { speed, ignition, odometer } = vehicleData.data

    // Check if position has actually changed
    const positionChanged = 
      !lastPosition.current ||
      lastPosition.current.lng !== longitude ||
      lastPosition.current.lat !== latitude

    // Create or update marker
    if (marker.current) {
      // Only update position if it actually changed
      if (positionChanged) {
        marker.current.setLngLat([longitude, latitude])
        lastPosition.current = { lng: longitude, lat: latitude }
      }
    } else {
      // Create custom marker element
      const el = document.createElement('div')
      el.className = 'custom-marker'
      el.style.width = '40px'
      el.style.height = '40px'
      el.style.cursor = 'pointer'
      el.innerHTML = `
        <div class="flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-transform hover:scale-110" 
             style="background-color: ${ignition ? '#10B981' : '#EF4444'}">
          <span class="text-2xl">🚗</span>
        </div>
      `

      // Create popup
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3">
          <h3 class="font-bold text-lg mb-2">Vehicle Status</h3>
          <div class="space-y-1 text-sm">
            <p><strong>Speed:</strong> ${speed} km/h</p>
            <p><strong>Ignition:</strong> <span class="${ignition ? 'text-green-600' : 'text-red-600'}">${ignition ? 'On' : 'Off'}</span></p>
            <p><strong>Location:</strong> ${position_description}</p>
          </div>
        </div>
      `)

      marker.current = new maplibregl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map.current)

      lastPosition.current = { lng: longitude, lat: latitude }

      // Fly to marker on first load
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 14,
        duration: 2000,
      })
    }
  }, [vehicleData])

  // Poll for updates every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchVehicleData()
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-screen h-screen">
      {/* Map container */}
      <div id="map" ref={mapContainer} className="absolute inset-0" />

      {/* Info panel */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10">
        <h1 className="text-xl font-bold mb-2 text-gray-800">Live Vehicle Tracker</h1>
        
        {loading && (
          <div className="flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <span>Loading vehicle data...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded">
            Error: {error}
          </div>
        )}

        {vehicleData && !loading && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${vehicleData.data.ignition ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-semibold">
                {vehicleData.data.ignition ? 'Engine Running' : 'Engine Off'}
              </span>
            </div>
            <p><strong>Speed:</strong> {vehicleData.data.speed} km/h</p>
            <p><strong>Updated:</strong> {new Date(vehicleData.data.event_ts).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">Auto-updates every 15 seconds</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
