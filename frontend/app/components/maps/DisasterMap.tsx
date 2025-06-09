"use client";

import React, { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { Card } from "@/components/ui/card";

// Import Leaflet plugins and extensions
import "leaflet-fullscreen/dist/Leaflet.fullscreen.js";
import "leaflet-fullscreen/dist/leaflet.fullscreen.css";
import "leaflet.markercluster/dist/leaflet.markercluster.js";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.heat/dist/leaflet-heat.js";

// Type definitions for map data
interface PointData {
  id: string;
  lat: number;
  lng: number;
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "none";
  title?: string;
  description?: string;
}

interface PolygonData {
  coordinates: [number, number][];
  color?: string;
  fillColor?: string;
  name?: string;
  description?: string;
  level?: "mandatory" | "voluntary" | "warning" | "alert";
}

interface HeatmapData {
  lat: number;
  lng: number;
  intensity?: number;
}

// Extend Leaflet types using module augmentation instead of namespace
declare module "leaflet" {
  function heatLayer(
    latlngs: [number, number, number][],
    options?: {
      radius?: number;
      blur?: number;
      maxZoom?: number;
      gradient?: { [key: number]: string };
    }
  ): L.Layer;
}

interface DisasterMapProps {
  center: [number, number]; // [latitude, longitude]
  zoom: number;
  mapLayers: string[];
  overlayOpacity: number;
  mapStyle: string;
  showLabels: boolean;
  pointData?: PointData[];
  polygonData?: PolygonData[];
  heatmapData?: HeatmapData[];
}

const DisasterMap: React.FC<DisasterMapProps> = ({
  center = [29.7604, -95.3698], // Default to Houston, TX coordinates
  zoom = 12,
  mapLayers = ["damage"],
  overlayOpacity = 70,
  mapStyle = "satellite",
  showLabels = true,
  pointData = [],
  polygonData = [],
  heatmapData = []
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupsRef = useRef<{ [key: string]: L.LayerGroup }>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  // Initialize the map when the component mounts
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
      attributionControl: false,
      fullscreenControl: true,
    });

    // Set base map layer based on style
    let baseLayer;
    if (mapStyle === "satellite") {
      baseLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });
    } else if (mapStyle === "terrain") {
      baseLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
      });
    } else {
      // Default to street view
      baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      });
    }
    baseLayer.addTo(map);

    // Add labels layer if enabled
    if (showLabels && mapStyle === "satellite") {
      const labelsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors, &copy; CARTO',
        opacity: 0.7
      });
      labelsLayer.addTo(map);
    }

    // Create layer groups for different data types
    const damageLayer = L.layerGroup().addTo(map);
    const resourcesLayer = L.layerGroup();
    const alertsLayer = L.layerGroup();

    // Store layer groups in ref for later access
    layerGroupsRef.current = {
      damage: damageLayer,
      resources: resourcesLayer,
      alerts: alertsLayer
    };

    // Add zoom controls to a custom position
    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    // Add scale control
    L.control.scale({
      position: 'bottomleft',
      imperial: true,
      metric: true
    }).addTo(map);

    // Add attribution control
    L.control.attribution({
      position: 'bottomright'
    }).addTo(map);

    // Store map reference and update state
    mapRef.current = map;
    setIsMapInitialized(true);

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, zoom, mapStyle, showLabels]);

  // Update active layers when mapLayers prop changes
  useEffect(() => {
    if (!isMapInitialized || !mapRef.current) return;

    // Show/hide layer groups based on mapLayers prop
    Object.keys(layerGroupsRef.current).forEach(layerName => {
      const layerGroup = layerGroupsRef.current[layerName];
      if (mapLayers.includes(layerName)) {
        if (!mapRef.current?.hasLayer(layerGroup)) {
          layerGroup.addTo(mapRef.current);
        }
      } else {
        if (mapRef.current?.hasLayer(layerGroup)) {
          mapRef.current.removeLayer(layerGroup);
        }
      }
    });
  }, [mapLayers, isMapInitialized]);

  // Function to create custom icons based on point type and severity
  const getPointIcon = (type: string, severity: PointData["severity"]) => {
    // Define colors for different severities
    const colors = {
      critical: '#ef4444', // red
      high: '#f59e0b',     // amber
      medium: '#eab308',   // yellow
      low: '#3b82f6',      // blue
      none: '#10b981'      // green
    };

    // Get color based on severity
    const color = colors[severity] || colors.medium;

    // Create icon with different shapes based on type
    return L.divIcon({
      className: `custom-marker-icon ${type} ${severity}`,
      html: `<div style="background-color: ${color};" class="marker-icon-inner"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  // Update point data when it changes
  useEffect(() => {
    if (!isMapInitialized || !mapRef.current || !pointData.length) return;

    // Clear existing points from damage layer
    layerGroupsRef.current.damage.clearLayers();

    // Create marker cluster group for better performance with many points
    const markers = L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 16
    });

    // Add points to marker cluster
    pointData.forEach(point => {
      const icon = getPointIcon(point.type, point.severity);
      const marker = L.marker([point.lat, point.lng], { icon });

      // Add popup with point information
      marker.bindPopup(`
        <div class="popup-content">
          <h3 class="font-medium">${point.title || `Point #${point.id}`}</h3>
          <p>${point.description || 'No description available'}</p>
          ${point.severity ? `<span class="severity ${point.severity}">${point.severity.toUpperCase()}</span>` : ''}
        </div>
      `);

      markers.addLayer(marker);
    });

    // Add marker cluster to the appropriate layer group
    layerGroupsRef.current.damage.addLayer(markers);
  }, [pointData, isMapInitialized]);

  // Update polygon data when it changes
  useEffect(() => {
    if (!isMapInitialized || !mapRef.current || !polygonData.length) return;

    // Clear existing polygons from alerts layer
    layerGroupsRef.current.alerts.clearLayers();

    // Add polygons to the map
    polygonData.forEach(poly => {
      const polygon = L.polygon(poly.coordinates, {
        color: poly.color || '#ef4444',
        fillColor: poly.fillColor || poly.color || '#ef4444',
        fillOpacity: (overlayOpacity / 100) * 0.4,
        weight: 2
      });

      // Add popup with polygon information
      if (poly.name || poly.description) {
        polygon.bindPopup(`
          <div class="popup-content">
            ${poly.name ? `<h3 class="font-medium">${poly.name}</h3>` : ''}
            ${poly.description ? `<p>${poly.description}</p>` : ''}
            ${poly.level ? `<span class="level ${poly.level}">${poly.level.toUpperCase()}</span>` : ''}
          </div>
        `);
      }

      layerGroupsRef.current.alerts.addLayer(polygon);
    });
  }, [polygonData, overlayOpacity, isMapInitialized]);

  // Create heatmap when heatmapData changes
  useEffect(() => {
    if (!isMapInitialized || !mapRef.current || !heatmapData.length) return;

    // Make sure we have the heatmap layer
    if (!layerGroupsRef.current.heatmap) {
      layerGroupsRef.current.heatmap = L.layerGroup().addTo(mapRef.current);
    } else {
      layerGroupsRef.current.heatmap.clearLayers();
    }

    // Create heatmap layer
    const heatLayer = L.heatLayer(
      heatmapData.map(point => [point.lat, point.lng, point.intensity || 1]),
      {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: { 0.4: 'blue', 0.6: 'cyan', 0.8: 'yellow', 1.0: 'red' }
      }
    );

    layerGroupsRef.current.heatmap.addLayer(heatLayer);
  }, [heatmapData, isMapInitialized]);

  return (
    <Card className="overflow-hidden">
      <div
        ref={mapContainerRef}
        className="w-full h-[600px]"
        style={{ position: 'relative' }}
      >
        {/* Map will be rendered here */}
      </div>
      <style jsx global>{`
        .custom-marker-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .marker-icon-inner {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        
        .popup-content {
          padding: 5px;
        }
        
        .severity, .level {
          display: inline-block;
          padding: 2px 6px;
          margin-top: 5px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }
        
        .severity.critical, .level.mandatory {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        
        .severity.high, .level.voluntary {
          background-color: #fff7ed;
          color: #c2410c;
        }
        
        .severity.medium, .level.warning {
          background-color: #fef9c3;
          color: #854d0e;
        }
        
        .severity.low, .level.alert {
          background-color: #e0f2fe;
          color: #075985;
        }
        
        .severity.none {
          background-color: #dcfce7;
          color: #166534;
        }
      `}</style>
    </Card>
  );
};

export default DisasterMap;