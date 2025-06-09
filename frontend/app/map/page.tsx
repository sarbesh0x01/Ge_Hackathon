"use client";

import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Filter,
  Building,
  Droplets,
  Ambulance,
  Truck,
  Users,
  Tent,
  AlertTriangle,
  Share2,
  Download,
  Clock,
  CircleAlert,
  Car,
  FileText,
  BellRing,
  Loader
} from "lucide-react";
import { disasterData } from "@/app/lib/mockData";

// Define proper types for the data structures
interface MapLayer {
  id: string;
  name: string;
  color: string;
  count: number;
  enabled: boolean;
}

interface DisasterPoint {
  id: number;
  type: string;
  severity: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
}

interface AlertZone {
  id: string;
  name: string;
  type: string;
  level: string;
  color: string;
  fillColor: string;
  description: string;
  coordinates: number[][];
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface MapData {
  points: DisasterPoint[];
  polygons: AlertZone[];
  heatmap: HeatmapPoint[];
}

// Load the map component dynamically with no SSR since Leaflet requires the browser
const DisasterMap = dynamic(() => import('@/app/components/maps/DisasterMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-[600px] bg-gray-100">
      <div className="text-center">
        <Loader className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        <div className="mt-2 text-gray-500">Loading map...</div>
      </div>
    </div>
  )
});

// Create mock geospatial data
const mockMapLayers: MapLayer[] = [
  { id: "buildings", name: "Buildings", color: "red", count: 124, enabled: true },
  { id: "roads", name: "Roads", color: "amber", count: 38, enabled: true },
  { id: "water", name: "Flooded Areas", color: "blue", count: 17, enabled: true },
  { id: "vegetation", name: "Vegetation Loss", color: "green", count: 23, enabled: false },
  { id: "power", name: "Power Infrastructure", color: "yellow", count: 42, enabled: false },
  { id: "emergency", name: "Emergency Services", color: "purple", count: 18, enabled: true },
  { id: "shelters", name: "Evacuation Centers", color: "sky", count: 12, enabled: true },
  { id: "resources", name: "Resource Depots", color: "orange", count: 9, enabled: false }
];

// Create mock disaster points
const mockDisasterPoints: DisasterPoint[] = [
  { id: 1, type: "building", severity: "critical", lat: 29.7625, lng: -95.3630, title: "Memorial Hospital", description: "Critical structural damage to east wing" },
  { id: 2, type: "building", severity: "high", lat: 29.7524, lng: -95.3640, title: "Downtown High School", description: "Severe roof damage and flooding" },
  { id: 3, type: "road", severity: "critical", lat: 29.7440, lng: -95.3751, title: "I-45 Bridge", description: "Complete collapse of north section" },
  { id: 4, type: "road", severity: "medium", lat: 29.7350, lng: -95.3701, title: "Main Street", description: "Multiple sinkholes and surface damage" },
  { id: 5, type: "water", severity: "critical", lat: 29.7680, lng: -95.3920, title: "Downtown District", description: "Severe flooding of 6+ feet" },
  { id: 6, type: "water", severity: "high", lat: 29.7690, lng: -95.3550, title: "Residential Zone B", description: "Flooding of 3-4 feet in residential area" },
  { id: 7, type: "emergency", severity: "none", lat: 29.7580, lng: -95.3710, title: "Central Fire Station", description: "Operational - Command center established" },
  { id: 8, type: "shelter", severity: "none", lat: 29.7540, lng: -95.3505, title: "Convention Center", description: "Emergency shelter - Capacity: 2,500" },
  { id: 9, type: "resource", severity: "none", lat: 29.7622, lng: -95.3450, title: "Supply Distribution Hub", description: "Water, food, and medical supplies available" },
  { id: 10, type: "building", severity: "medium", lat: 29.7520, lng: -95.3672, title: "City Apartments", description: "Water damage to lower floors" },
];

// Alert zones (polygon data)
const mockAlertZones: AlertZone[] = [
  {
    id: "zone-1",
    name: "Downtown",
    type: "evacuation",
    level: "mandatory",
    color: "#ef4444",
    fillColor: "#ef4444",
    description: "All residents must evacuate immediately",
    coordinates: [
      [29.754, -95.380],
      [29.754, -95.350],
      [29.734, -95.350],
      [29.734, -95.380]
    ]
  },
  {
    id: "zone-2",
    name: "East Side",
    type: "evacuation",
    level: "voluntary",
    color: "#f59e0b",
    fillColor: "#f59e0b",
    description: "Voluntary evacuation recommended",
    coordinates: [
      [29.775, -95.340],
      [29.775, -95.310],
      [29.755, -95.310],
      [29.755, -95.340]
    ]
  },
  {
    id: "zone-3",
    name: "North District",
    type: "flooding",
    level: "warning",
    color: "#3b82f6",
    fillColor: "#3b82f6",
    description: "Flash flooding expected in low-lying areas",
    coordinates: [
      [29.790, -95.360],
      [29.790, -95.330],
      [29.770, -95.330],
      [29.770, -95.360]
    ]
  },
];

// Heatmap data for damage intensity
const mockHeatmapData: HeatmapPoint[] = [
  // Downtown cluster
  { lat: 29.758, lng: -95.369, intensity: 0.9 },
  { lat: 29.760, lng: -95.371, intensity: 0.8 },
  { lat: 29.756, lng: -95.368, intensity: 1.0 },
  { lat: 29.755, lng: -95.366, intensity: 0.7 },
  { lat: 29.759, lng: -95.361, intensity: 0.6 },

  // East side cluster
  { lat: 29.765, lng: -95.350, intensity: 0.8 },
  { lat: 29.763, lng: -95.347, intensity: 0.7 },
  { lat: 29.768, lng: -95.345, intensity: 0.9 },

  // North cluster
  { lat: 29.780, lng: -95.362, intensity: 0.6 },
  { lat: 29.782, lng: -95.358, intensity: 0.5 },
  { lat: 29.778, lng: -95.355, intensity: 0.7 },
];

export default function MapViewPage() {
  const [activeTab, setActiveTab] = useState("damage");
  const [mapLayers, setMapLayers] = useState(mockMapLayers);
  const [mapView, setMapView] = useState("satellite");
  const [showLabels, setShowLabels] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(70);
  const [disasterEvent, setDisasterEvent] = useState("hurricane_atlas");

  // State for actual map component props
  const [activeLayers, setActiveLayers] = useState<string[]>(["damage"]);
  const [mapData, setMapData] = useState<MapData>({
    points: [],
    polygons: [],
    heatmap: []
  });

  // Simulate API data loading
  useEffect(() => {
    // In a real app, we would fetch data from APIs here
    // For now, we'll use a timeout to simulate network request
    const timer = setTimeout(() => {
      setMapData({
        points: mockDisasterPoints,
        polygons: activeTab === "alerts" ? mockAlertZones : [],
        heatmap: activeTab === "damage" ? mockHeatmapData : []
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [disasterEvent, activeTab]);

  const toggleLayer = (layerId: string) => {
    setMapLayers(prev =>
      prev.map(layer =>
        layer.id === layerId
          ? { ...layer, enabled: !layer.enabled }
          : layer
      )
    );

    // Update active layers for the map
    if (activeLayers.includes(layerId)) {
      setActiveLayers(prev => prev.filter(id => id !== layerId));
    } else {
      setActiveLayers(prev => [...prev, layerId]);
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "evacuation":
        return "bg-red-500";
      case "flooding":
        return "bg-blue-500";
      case "hazmat":
        return "bg-purple-500";
      case "power":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case "mandatory":
        return "bg-red-100 text-red-800 border-red-200";
      case "voluntary":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "alert":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Map View</h1>
          <p className="text-gray-500">
            Geospatial visualization of disaster impact and resources
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            defaultValue="hurricane_atlas"
            onValueChange={(value) => setDisasterEvent(value)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select disaster" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hurricane_atlas">Hurricane Atlas - Mar 2025</SelectItem>
              <SelectItem value="flood_delta">Delta Flooding - Feb 2025</SelectItem>
              <SelectItem value="wildfire_omega">Omega Wildfire - Jan 2025</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share Map
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main map display area */}
        <div className="col-span-12 lg:col-span-9">
          {/* Map toolbar */}
          <div className="flex items-center justify-between p-2 bg-white border rounded-t-lg">
            <div className="flex items-center gap-1">
              <Tabs defaultValue={mapView} onValueChange={setMapView}>
                <TabsList className="h-8">
                  <TabsTrigger value="satellite" className="text-xs px-2 py-1">Satellite</TabsTrigger>
                  <TabsTrigger value="terrain" className="text-xs px-2 py-1">Terrain</TabsTrigger>
                  <TabsTrigger value="street" className="text-xs px-2 py-1">Street</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Label htmlFor="labels-toggle" className="mr-2 text-xs">Labels</Label>
                <Switch
                  id="labels-toggle"
                  checked={showLabels}
                  onCheckedChange={setShowLabels}
                />
              </div>

              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2">Opacity: {overlayOpacity}%</span>
                <Slider
                  value={[overlayOpacity]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => setOverlayOpacity(value[0])}
                  className="w-24"
                />
              </div>

              <Select defaultValue="damage" onValueChange={(value) => setActiveTab(value)}>
                <SelectTrigger className="h-8 text-xs w-[130px]">
                  <SelectValue placeholder="Map overlay" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="damage">Damage Overlay</SelectItem>
                  <SelectItem value="alerts">Alert Zones</SelectItem>
                  <SelectItem value="resources">Response Units</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Leaflet Map Component */}
          <DisasterMap
            center={[29.7604, -95.3698]} // Houston coordinates
            zoom={13}
            mapLayers={activeLayers}
            overlayOpacity={overlayOpacity}
            mapStyle={mapView}
            showLabels={showLabels}
            pointData={mapData.points}
            polygonData={mapData.polygons}
            heatmapData={mapData.heatmap}
          />

          {/* Map legend and tools */}
          <div className="p-3 border border-t-0 rounded-b-lg bg-white">
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-1.5"></div>
                  <span>Critical</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-1.5"></div>
                  <span>High</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1.5"></div>
                  <span>Medium</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-1.5"></div>
                  <span>Low</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-1.5"></div>
                  <span>Operational</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">
                  Last updated: 2 hours ago
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export Map
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar with layers and details */}
        <div className="col-span-12 lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="damage">Damage</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="damage" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Damage Layers</CardTitle>
                  <CardDescription>
                    Toggle visibility of damage categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mapLayers
                    .filter(layer => ["buildings", "roads", "water", "vegetation", "power"].includes(layer.id))
                    .map(layer => (
                      <div key={layer.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`rounded-full h-3 w-3 bg-${layer.color}-500`}></div>
                          <div>
                            <div className="font-medium">{layer.name}</div>
                            <div className="text-xs text-gray-500">{layer.count} points</div>
                          </div>
                        </div>
                        <Switch
                          checked={layer.enabled}
                          onCheckedChange={() => toggleLayer(layer.id)}
                        />
                      </div>
                    ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Damage Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">Building Damage</div>
                    <div className="font-medium">{disasterData.damageAssessment.buildingDamage.percentage}%</div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${disasterData.damageAssessment.buildingDamage.percentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="text-sm">Infrastructure Damage</div>
                    <div className="font-medium">{disasterData.damageAssessment.infrastructureDamage.percentage}%</div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${disasterData.damageAssessment.infrastructureDamage.percentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="text-sm">Flooding</div>
                    <div className="font-medium">43%</div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: "43%" }}
                    ></div>
                  </div>

                  <div className="pt-2">
                    <Button variant="outline" className="w-full" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      View Detailed Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Resource Layers</CardTitle>
                  <CardDescription>
                    Toggle visibility of resources
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mapLayers
                    .filter(layer => ["emergency", "shelters", "resources"].includes(layer.id))
                    .map(layer => (
                      <div key={layer.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`rounded-full h-3 w-3 bg-${layer.color}-500`}></div>
                          <div>
                            <div className="font-medium">{layer.name}</div>
                            <div className="text-xs text-gray-500">{layer.count} points</div>
                          </div>
                        </div>
                        <Switch
                          checked={layer.enabled}
                          onCheckedChange={() => toggleLayer(layer.id)}
                        />
                      </div>
                    ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Active Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="bg-purple-100 p-1.5 rounded-md">
                          <Ambulance className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Emergency Response</div>
                          <div className="text-xs text-gray-500">18 units active</div>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="bg-sky-100 p-1.5 rounded-md">
                          <Tent className="h-4 w-4 text-sky-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Evacuation Centers</div>
                          <div className="text-xs text-gray-500">12 centers | 4,520 capacity</div>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">87% Full</Badge>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="bg-orange-100 p-1.5 rounded-md">
                          <Truck className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Resource Depots</div>
                          <div className="text-xs text-gray-500">9 depots operational</div>
                        </div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">Limited</Badge>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button variant="outline" className="w-full" size="sm">
                      <Filter className="h-4 w-4 mr-1" />
                      Filter Resources
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Current Alerts</CardTitle>
                  <CardDescription>
                    Active warnings and evacuation orders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockAlertZones.map(zone => (
                    <div key={zone.id} className="border rounded-md overflow-hidden">
                      <div className={`${getAlertColor(zone.type)} px-3 py-1.5 text-white font-medium flex items-center justify-between`}>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{zone.name}</span>
                        </div>
                        <Badge className={getLevelBadgeColor(zone.level)}>
                          {zone.level.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="p-2 bg-gray-50">
                        <div className="text-sm">
                          {zone.type === "evacuation" && (
                            <div className="flex items-start gap-1">
                              <Users className="h-4 w-4 text-gray-500 mt-0.5" />
                              <div>
                                <div>All residents must evacuate immediately</div>
                                <div className="text-xs text-gray-500 mt-0.5">Order issued: Mar 16, 10:15 AM</div>
                              </div>
                            </div>
                          )}

                          {zone.type === "flooding" && (
                            <div className="flex items-start gap-1">
                              <Droplets className="h-4 w-4 text-gray-500 mt-0.5" />
                              <div>
                                <div>Flash flooding expected in low-lying areas</div>
                                <div className="text-xs text-gray-500 mt-0.5">Warning issued: Mar 15, 8:30 PM</div>
                              </div>
                            </div>
                          )}

                          {zone.type === "hazmat" && (
                            <div className="flex items-start gap-1">
                              <CircleAlert className="h-4 w-4 text-gray-500 mt-0.5" />
                              <div>
                                <div>Chemical spill reported - Shelter in place</div>
                                <div className="text-xs text-gray-500 mt-0.5">Alert issued: Mar 16, 2:45 PM</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 flex gap-2">
                    <Button variant="outline" className="w-full" size="sm">
                      <BellRing className="h-4 w-4 mr-1" />
                      Subscribe
                    </Button>
                    <Button className="w-full" size="sm">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Hazard Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="border-l-4 border-blue-500 pl-3">
                      <div className="font-medium">Flood Warning</div>
                      <div className="text-sm text-gray-600">Rivers at critical levels</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Expires in 8 hours
                      </div>
                    </div>

                    <div className="border-l-4 border-amber-500 pl-3">
                      <div className="font-medium">Infrastructure Alert</div>
                      <div className="text-sm text-gray-600">Multiple road closures</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <Car className="h-3.5 w-3.5 mr-1" />
                        Avoid downtown area
                      </div>
                    </div>

                    <div className="border-l-4 border-red-500 pl-3">
                      <div className="font-medium">Evacuation Order</div>
                      <div className="text-sm text-gray-600">Zones A, B, and C</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                        Mandatory evacuation in effect
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Map analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-1">
              <Building className="h-4 w-4 text-red-500" />
              Building Damage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-3xl font-bold text-red-600">{disasterData.damageAssessment.buildingDamage.percentage}%</div>
            <div className="text-sm text-gray-500">of structures affected</div>

            <div className="grid grid-cols-3 gap-1 text-center text-xs mt-3">
              <div>
                <div className="font-medium">{disasterData.damageAssessment.buildingDamage.types[0].percentage}%</div>
                <div className="text-gray-500">Severe</div>
              </div>
              <div>
                <div className="font-medium">{disasterData.damageAssessment.buildingDamage.types[1].percentage}%</div>
                <div className="text-gray-500">Moderate</div>
              </div>
              <div>
                <div className="font-medium">{disasterData.damageAssessment.buildingDamage.types[2].percentage}%</div>
                <div className="text-gray-500">Minor</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-1">
              Road Network
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-3xl font-bold text-amber-600">{disasterData.damageAssessment.infrastructureDamage.percentage}%</div>
            <div className="text-sm text-gray-500">of roads impacted</div>

            <div className="mt-2 border-l-2 border-amber-300 pl-2">
              <div className="text-sm">8 major routes closed</div>
              <div className="text-xs text-gray-500">15 bridges damaged</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-1">
              <Tent className="h-4 w-4 text-blue-500" />
              Evacuation Centers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-3xl font-bold text-blue-600">12</div>
            <div className="text-sm text-gray-500">active shelters</div>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-blue-500" style={{ width: "87%" }}></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>4,520 capacity</span>
              <span className="font-medium">87% occupied</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-1">
              <Droplets className="h-4 w-4 text-sky-500" />
              Flooded Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-3xl font-bold text-sky-600">43%</div>
            <div className="text-sm text-gray-500">of land area flooded</div>

            <div className="mt-2 border-l-2 border-sky-300 pl-2">
              <div className="text-sm">17 critical zones</div>
              <div className="text-xs text-gray-500">Water levels rising</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}