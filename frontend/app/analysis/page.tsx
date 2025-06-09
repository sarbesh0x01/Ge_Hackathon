"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  SlidersHorizontal,
  Layers,
  Eye,
  EyeOff,
  Building,
  Droplets,
  Ruler,
  Share2,
  CameraOff,
  Sparkles,
  PlusCircle,
  FileText
} from "lucide-react";

import { mockImageAnalysis } from "@/app/lib/mockData";

export default function AdvancedAnalysisPage() {
  const [activeTab, setActiveTab] = useState("visualization");
  const [overlayOpacity, setOverlayOpacity] = useState(70);
  const [setSelectedFilter] = useState("all");
  const [detectionThreshold, setDetectionThreshold] = useState(50);
  const [zoom, setZoom] = useState(100);
  const [showLayers, setShowLayers] = useState({
    buildings: true,
    roads: true,
    water: true,
    vegetation: true
  });

  // Simulated analysis state
  const [analysisProgress, setAnalysisProgress] = useState(100);
  const [analysisComplete, setAnalysisComplete] = useState(true);

  const handleZoom = (direction: "in" | "out") => {
    if (direction === "in" && zoom < 200) {
      setZoom(prev => Math.min(prev + 10, 200));
    } else if (direction === "out" && zoom > 50) {
      setZoom(prev => Math.max(prev - 10, 50));
    }
  };

  const toggleLayer = (layer: keyof typeof showLayers) => {
    setShowLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  const runEnhancedAnalysis = () => {
    setAnalysisComplete(false);
    setAnalysisProgress(0);

    // Simulate analysis progress
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setAnalysisComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const { buildingDamage, roadDamage, floodedAreas, vegetationLoss } = mockImageAnalysis.analysisResults;

  // Helper for badge color based on severity
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "collapsed":
      case "severe":
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "partially damaged":
      case "moderate":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "minor damage":
      case "minor":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Image Analysis</h1>
          <p className="text-gray-500">
            Detailed damage assessment and visualization tools
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select defaultValue="hurricane_atlas">
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
            <PlusCircle className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main image and controls panel */}
        <div className="col-span-12 lg:col-span-8">
          <Card className="overflow-hidden">
            {/* Image viewer toolbar */}
            <div className="flex items-center justify-between border-b p-2 bg-gray-50">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleZoom("out")}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
                <Button variant="ghost" size="icon" onClick={() => handleZoom("in")}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <div className="h-4 border-r mx-1"></div>
                <Button variant="ghost" size="icon">
                  <RotateCw className="h-4 w-4" />
                </Button>
                <div className="h-4 border-r mx-1"></div>
                <Button variant="ghost" size="icon" className="relative">
                  <Layers className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2">Overlay Opacity: {overlayOpacity}%</span>
                <div className="w-36">
                  <Slider
                    value={[overlayOpacity]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(value) => setOverlayOpacity(value[0])}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Select defaultValue="damage">
                  <SelectTrigger className="h-8 text-xs w-[130px]">
                    <SelectValue placeholder="Overlay type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damage">Damage Overlay</SelectItem>
                    <SelectItem value="before-after">Before/After</SelectItem>
                    <SelectItem value="heatmap">Damage Heatmap</SelectItem>
                    <SelectItem value="classification">Classification</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="ghost" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Main image display area */}
            <div className="relative h-[500px] overflow-hidden">
              {/* The after disaster image with damage overlay */}
              <div
                className="relative w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${mockImageAnalysis.afterImageUrl})`,
                  backgroundSize: `${zoom}%`,
                  backgroundPosition: "center"
                }}
              >
                {/* Damage overlay with adjustable opacity */}
                <div
                  className="absolute inset-0 bg-red-500 mix-blend-multiply pointer-events-none"
                  style={{ opacity: overlayOpacity / 100 * 0.3 }}
                ></div>

                {/* Building damage markers */}
                {showLayers.buildings && buildingDamage.map((building) => (
                  <div
                    key={building.id}
                    className="absolute border-2 border-red-500 bg-red-500 bg-opacity-20 pointer-events-none"
                    style={{
                      left: `${building.coordinates[0] / 10}%`,
                      top: `${building.coordinates[1] / 10}%`,
                      width: `${(building.coordinates[2] - building.coordinates[0]) / 10}%`,
                      height: `${(building.coordinates[3] - building.coordinates[1]) / 10}%`
                    }}
                  >
                    <div className="absolute -top-6 -left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-sm">
                      B{building.id}: {building.severity}
                    </div>
                  </div>
                ))}

                {/* Road damage markers */}
                {showLayers.roads && roadDamage.map((road) => (
                  <div
                    key={road.id}
                    className="absolute border-2 border-amber-500 bg-amber-500 bg-opacity-20 pointer-events-none"
                    style={{
                      left: `${road.coordinates[0] / 10}%`,
                      top: `${road.coordinates[1] / 10}%`,
                      width: `${(road.coordinates[2] - road.coordinates[0]) / 10}%`,
                      height: `${(road.coordinates[3] - road.coordinates[1]) / 10}%`
                    }}
                  >
                    <div className="absolute -top-6 -left-1 bg-amber-600 text-white text-xs px-1.5 py-0.5 rounded-sm">
                      R{road.id}: {road.severity}
                    </div>
                  </div>
                ))}

                {/* Flooded areas markers */}
                {showLayers.water && floodedAreas.map((area) => (
                  <div
                    key={area.id}
                    className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
                    style={{
                      left: `${area.coordinates[0] / 10}%`,
                      top: `${area.coordinates[1] / 10}%`,
                      width: `${(area.coordinates[2] - area.coordinates[0]) / 10}%`,
                      height: `${(area.coordinates[3] - area.coordinates[1]) / 10}%`
                    }}
                  >
                    <div className="absolute -top-6 -left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-sm">
                      F{area.id}: {area.waterDepth}
                    </div>
                  </div>
                ))}

                {/* Vegetation loss markers */}
                {showLayers.vegetation && vegetationLoss.map((loss) => (
                  <div
                    key={loss.id}
                    className="absolute border-2 border-green-500 bg-green-500 bg-opacity-20 pointer-events-none"
                    style={{
                      left: `${loss.coordinates[0] / 10}%`,
                      top: `${loss.coordinates[1] / 10}%`,
                      width: `${(loss.coordinates[2] - loss.coordinates[0]) / 10}%`,
                      height: `${(loss.coordinates[3] - loss.coordinates[1]) / 10}%`
                    }}
                  >
                    <div className="absolute -top-6 -left-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-sm">
                      V{loss.id}: {loss.area}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image progress bar and statistics */}
            <div className="p-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Analysis Status:</div>
                {analysisComplete ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    Processing
                  </Badge>
                )}
              </div>

              {!analysisComplete && (
                <div className="mb-3">
                  <Progress value={analysisProgress} className="h-2" />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">Analyzing image data</span>
                    <span className="text-xs text-gray-500">{analysisProgress}%</span>
                  </div>
                </div>
              )}

              <div className="text-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-500">Building Damage</div>
                    <div className="font-medium">{buildingDamage.length} detected</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-500">Road Damage</div>
                    <div className="font-medium">{roadDamage.length} sections</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-500">Flooded Areas</div>
                    <div className="font-medium">{floodedAreas.length} detected</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-500">Vegetation Loss</div>
                    <div className="font-medium">{vegetationLoss.length} areas</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Analysis configuration and details sidebar */}
        <div className="col-span-12 lg:col-span-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="visualization">Layers</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="visualization" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Damage Layers</CardTitle>
                  <CardDescription>
                    Toggle visibility of damage categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-red-500" />
                      <div>
                        <div className="font-medium">Building Damage</div>
                        <div className="text-xs text-gray-500">{buildingDamage.length} buildings affected</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleLayer("buildings")}
                    >
                      {showLayers.buildings ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">Road Damage</div>
                        <div className="text-xs text-gray-500">{roadDamage.length} sections affected</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleLayer("roads")}
                    >
                      {showLayers.roads ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">Flooded Areas</div>
                        <div className="text-xs text-gray-500">{floodedAreas.length} areas detected</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleLayer("water")}
                    >
                      {showLayers.water ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">Vegetation Loss</div>
                        <div className="text-xs text-gray-500">{vegetationLoss.length} areas affected</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleLayer("vegetation")}
                    >
                      {showLayers.vegetation ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Damage Filter</CardTitle>
                  <CardDescription>
                    Filter by damage severity or type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-3">
                    <RadioGroup defaultValue="all" onValueChange={setSelectedFilter}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all">All Damage</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="critical" id="critical" />
                        <Label htmlFor="critical">Critical Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="buildings" id="buildings" />
                        <Label htmlFor="buildings">Buildings Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="infrastructure" id="infrastructure" />
                        <Label htmlFor="infrastructure">Infrastructure Only</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Detection Threshold: {detectionThreshold}%</Label>
                      <Slider
                        value={[detectionThreshold]}
                        min={10}
                        max={90}
                        step={5}
                        onValueChange={(value) => setDetectionThreshold(value[0])}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="auto-detect" />
                      <Label htmlFor="auto-detect">Auto-detect new damage</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Analysis Settings</CardTitle>
                  <CardDescription>
                    Configure advanced detection settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Detection Model</Label>
                    <Select defaultValue="accurate">
                      <SelectTrigger id="model">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast">Fast Detection</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="accurate">High Accuracy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disaster-type">Disaster Type</Label>
                    <Select defaultValue="hurricane">
                      <SelectTrigger id="disaster-type">
                        <SelectValue placeholder="Select disaster type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hurricane">Hurricane</SelectItem>
                        <SelectItem value="flood">Flood</SelectItem>
                        <SelectItem value="earthquake">Earthquake</SelectItem>
                        <SelectItem value="wildfire">Wildfire</SelectItem>
                        <SelectItem value="tornado">Tornado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Detection Categories</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="flex items-center space-x-2">
                        <Switch id="detect-buildings" defaultChecked />
                        <Label htmlFor="detect-buildings" className="text-sm">Buildings</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="detect-roads" defaultChecked />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="detect-water" defaultChecked />
                        <Label htmlFor="detect-water" className="text-sm">Water</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="detect-vegetation" defaultChecked />
                        <Label htmlFor="detect-vegetation" className="text-sm">Vegetation</Label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      className="w-full"
                      onClick={runEnhancedAnalysis}
                      disabled={!analysisComplete}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Run Enhanced Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">View Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Overlay Type</Label>
                    <Select defaultValue="heatmap">
                      <SelectTrigger>
                        <SelectValue placeholder="Select overlay" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heatmap">Heat Map</SelectItem>
                        <SelectItem value="boundary">Boundary Boxes</SelectItem>
                        <SelectItem value="mask">Segmentation Mask</SelectItem>
                        <SelectItem value="split">Split View</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Color Scheme</Label>
                    <Select defaultValue="severity">
                      <SelectTrigger>
                        <SelectValue placeholder="Select color scheme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="severity">Severity Levels</SelectItem>
                        <SelectItem value="category">Damage Category</SelectItem>
                        <SelectItem value="confidence">Confidence Score</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="show-labels" defaultChecked />
                    <Label htmlFor="show-labels">Show Damage Labels</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="show-grid" />
                    <Label htmlFor="show-grid">Show Grid</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Damage Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Building Damage Severity</div>
                      <div className="space-y-2">
                        {[
                          { label: "Collapsed", percentage: 22, count: 1 },
                          { label: "Severely Damaged", percentage: 38, count: 1 },
                          { label: "Minor Damage", percentage: 40, count: 1 }
                        ].map((item, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="flex items-center">
                                <Badge className={getSeverityColor(item.label)}>
                                  {item.count}
                                </Badge>
                                <span className="ml-2">{item.label}</span>
                              </span>
                              <span>{item.percentage}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${item.label.toLowerCase().includes("collapsed") ? "bg-red-500" :
                                  item.label.toLowerCase().includes("severe") ? "bg-amber-500" :
                                    "bg-yellow-500"
                                  }`}
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="space-y-2">
                        {[
                          { label: "Severe", percentage: 25, count: 1 },
                          { label: "Moderate", percentage: 75, count: 1 }
                        ].map((item, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="flex items-center">
                                <Badge className={getSeverityColor(item.label)}>
                                  {item.count}
                                </Badge>
                                <span className="ml-2">{item.label}</span>
                              </span>
                              <span>{item.percentage}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${item.label === "Severe" ? "bg-red-500" : "bg-amber-500"
                                  }`}
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Flooded Areas</div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="grid grid-cols-2 gap-1">
                          <div className="text-xs text-gray-500">Total Area:</div>
                          <div className="text-xs font-medium text-right">12,500 sqm</div>
                          <div className="text-xs text-gray-500">Average Depth:</div>
                          <div className="text-xs font-medium text-right">1.8m</div>
                          <div className="text-xs text-gray-500">Affected Buildings:</div>
                          <div className="text-xs font-medium text-right">12</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Vegetation Loss</div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="grid grid-cols-2 gap-1">
                          <div className="text-xs text-gray-500">Total Area:</div>
                          <div className="text-xs font-medium text-right">12,500 sqm</div>
                          <div className="text-xs text-gray-500">Percentage:</div>
                          <div className="text-xs font-medium text-right">43%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Detection Confidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-sm font-medium text-gray-800">92.8%</div>
                        <div className="text-xs text-gray-500">Building Detection</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-sm font-medium text-gray-800">88.5%</div>
                        <div className="text-xs text-gray-500">Road Detection</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-sm font-medium text-gray-800">96.2%</div>
                        <div className="text-xs text-gray-500">Flood Detection</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-sm font-medium text-gray-800">94.1%</div>
                        <div className="text-xs text-gray-500">Vegetation Detection</div>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        Export Report
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Results
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Recent analyses */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Analyses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              id: 1,
              name: "Downtown District",
              date: "Mar 15, 2025",
              type: "Hurricane",
              buildings: 32,
              roads: 8,
              flooding: 5,
              image: mockImageAnalysis.afterImageUrl
            },
            {
              id: 2,
              name: "Harbor Area",
              date: "Mar 14, 2025",
              type: "Hurricane",
              buildings: 18,
              roads: 4,
              flooding: 12,
              image: "/mockImages/after.jpg"
            },
            {
              id: 3,
              name: "Residential Zone B",
              date: "Mar 13, 2025",
              type: "Hurricane",
              buildings: 47,
              roads: 6,
              flooding: 3,
              image: "/mockImages/after.jpg"
            }
          ].map((analysis) => (
            <Card key={analysis.id} className="overflow-hidden">
              <div className="relative h-40 overflow-hidden">
                {analysis.image ? (
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${analysis.image})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <CameraOff className="h-8 w-8 text-gray-400" />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <div className="font-medium">{analysis.name}</div>
                  <div className="text-xs">{analysis.date} • {analysis.type}</div>
                </div>
              </div>

              <CardContent className="p-3">
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-sm font-medium">{analysis.buildings}</div>
                    <div className="text-xs text-gray-500">Buildings</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{analysis.roads}</div>
                    <div className="text-xs text-gray-500">Roads</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{analysis.flooding}</div>
                    <div className="text-xs text-gray-500">Flooded</div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between items-center p-3 pt-0">
                <Button variant="link" size="sm" className="h-8 px-0">
                  View Details
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Share2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  SlidersHorizontal,
  Layers,
  Eye,
  EyeOff,
  Building,
  Droplets,
  Ruler,
  Share2,
  CameraOff,
  Sparkles,
  PlusCircle,
  FileText
} from "lucide-react";

import { mockImageAnalysis } from "@/app/lib/mockData";

export default function AdvancedAnalysisPage() {
  const [activeTab, setActiveTab] = useState("visualization");
  const [overlayOpacity, setOverlayOpacity] = useState(70);
  const [setSelectedFilter] = useState("all");
  const [detectionThreshold, setDetectionThreshold] = useState(50);
  const [zoom, setZoom] = useState(100);
  const [showLayers, setShowLayers] = useState({
    buildings: true,
    roads: true,
    water: true,
    vegetation: true
  });

  // Simulated analysis state
  const [analysisProgress, setAnalysisProgress] = useState(100);
  const [analysisComplete, setAnalysisComplete] = useState(true);

  const handleZoom = (direction: "in" | "out") => {
    if (direction === "in" && zoom < 200) {
      setZoom(prev => Math.min(prev + 10, 200));
    } else if (direction === "out" && zoom > 50) {
      setZoom(prev => Math.max(prev - 10, 50));
    }
  };

  const toggleLayer = (layer: keyof typeof showLayers) => {
    setShowLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  const runEnhancedAnalysis = () => {
    setAnalysisComplete(false);
    setAnalysisProgress(0);

    // Simulate analysis progress
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setAnalysisComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const { buildingDamage, roadDamage, floodedAreas, vegetationLoss } = mockImageAnalysis.analysisResults;

  // Helper for badge color based on severity
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "collapsed":
      case "severe":
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "partially damaged":
      case "moderate":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "minor damage":
      case "minor":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Image Analysis</h1>
          <p className="text-gray-500">
            Detailed damage assessment and visualization tools
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select defaultValue="hurricane_atlas">
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
            <PlusCircle className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main image and controls panel */}
        <div className="col-span-12 lg:col-span-8">
          <Card className="overflow-hidden">
            {/* Image viewer toolbar */}
            <div className="flex items-center justify-between border-b p-2 bg-gray-50">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleZoom("out")}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
                <Button variant="ghost" size="icon" onClick={() => handleZoom("in")}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <div className="h-4 border-r mx-1"></div>
                <Button variant="ghost" size="icon">
                  <RotateCw className="h-4 w-4" />
                </Button>
                <div className="h-4 border-r mx-1"></div>
                <Button variant="ghost" size="icon" className="relative">
                  <Layers className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2">Overlay Opacity: {overlayOpacity}%</span>
                <div className="w-36">
                  <Slider
                    value={[overlayOpacity]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(value) => setOverlayOpacity(value[0])}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Select defaultValue="damage">
                  <SelectTrigger className="h-8 text-xs w-[130px]">
                    <SelectValue placeholder="Overlay type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damage">Damage Overlay</SelectItem>
                    <SelectItem value="before-after">Before/After</SelectItem>
                    <SelectItem value="heatmap">Damage Heatmap</SelectItem>
                    <SelectItem value="classification">Classification</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="ghost" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Main image display area */}
            <div className="relative h-[500px] overflow-hidden">
              {/* The after disaster image with damage overlay */}
              <div
                className="relative w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${mockImageAnalysis.afterImageUrl})`,
                  backgroundSize: `${zoom}%`,
                  backgroundPosition: "center"
                }}
              >
                {/* Damage overlay with adjustable opacity */}
                <div
                  className="absolute inset-0 bg-red-500 mix-blend-multiply pointer-events-none"
                  style={{ opacity: overlayOpacity / 100 * 0.3 }}
                ></div>

                {/* Building damage markers */}
                {showLayers.buildings && buildingDamage.map((building) => (
                  <div
                    key={building.id}
                    className="absolute border-2 border-red-500 bg-red-500 bg-opacity-20 pointer-events-none"
                    style={{
                      left: `${building.coordinates[0] / 10}%`,
                      top: `${building.coordinates[1] / 10}%`,
                      width: `${(building.coordinates[2] - building.coordinates[0]) / 10}%`,
                      height: `${(building.coordinates[3] - building.coordinates[1]) / 10}%`
                    }}
                  >
                    <div className="absolute -top-6 -left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-sm">
                      B{building.id}: {building.severity}
                    </div>
                  </div>
                ))}

                {/* Road damage markers */}
                {showLayers.roads && roadDamage.map((road) => (
                  <div
                    key={road.id}
                    className="absolute border-2 border-amber-500 bg-amber-500 bg-opacity-20 pointer-events-none"
                    style={{
                      left: `${road.coordinates[0] / 10}%`,
                      top: `${road.coordinates[1] / 10}%`,
                      width: `${(road.coordinates[2] - road.coordinates[0]) / 10}%`,
                      height: `${(road.coordinates[3] - road.coordinates[1]) / 10}%`
                    }}
                  >
                    <div className="absolute -top-6 -left-1 bg-amber-600 text-white text-xs px-1.5 py-0.5 rounded-sm">
                      R{road.id}: {road.severity}
                    </div>
                  </div>
                ))}

                {/* Flooded areas markers */}
                {showLayers.water && floodedAreas.map((area) => (
                  <div
                    key={area.id}
                    className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
                    style={{
                      left: `${area.coordinates[0] / 10}%`,
                      top: `${area.coordinates[1] / 10}%`,
                      width: `${(area.coordinates[2] - area.coordinates[0]) / 10}%`,
                      height: `${(area.coordinates[3] - area.coordinates[1]) / 10}%`
                    }}
                  >
                    <div className="absolute -top-6 -left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-sm">
                      F{area.id}: {area.waterDepth}
                    </div>
                  </div>
                ))}

                {/* Vegetation loss markers */}
                {showLayers.vegetation && vegetationLoss.map((loss) => (
                  <div
                    key={loss.id}
                    className="absolute border-2 border-green-500 bg-green-500 bg-opacity-20 pointer-events-none"
                    style={{
                      left: `${loss.coordinates[0] / 10}%`,
                      top: `${loss.coordinates[1] / 10}%`,
                      width: `${(loss.coordinates[2] - loss.coordinates[0]) / 10}%`,
                      height: `${(loss.coordinates[3] - loss.coordinates[1]) / 10}%`
                    }}
                  >
                    <div className="absolute -top-6 -left-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-sm">
                      V{loss.id}: {loss.area}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image progress bar and statistics */}
            <div className="p-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Analysis Status:</div>
                {analysisComplete ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    Processing
                  </Badge>
                )}
              </div>

              {!analysisComplete && (
                <div className="mb-3">
                  <Progress value={analysisProgress} className="h-2" />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">Analyzing image data</span>
                    <span className="text-xs text-gray-500">{analysisProgress}%</span>
                  </div>
                </div>
              )}

              <div className="text-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-500">Building Damage</div>
                    <div className="font-medium">{buildingDamage.length} detected</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-500">Road Damage</div>
                    <div className="font-medium">{roadDamage.length} sections</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-500">Flooded Areas</div>
                    <div className="font-medium">{floodedAreas.length} detected</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-500">Vegetation Loss</div>
                    <div className="font-medium">{vegetationLoss.length} areas</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Analysis configuration and details sidebar */}
        <div className="col-span-12 lg:col-span-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="visualization">Layers</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="visualization" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Damage Layers</CardTitle>
                  <CardDescription>
                    Toggle visibility of damage categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-red-500" />
                      <div>
                        <div className="font-medium">Building Damage</div>
                        <div className="text-xs text-gray-500">{buildingDamage.length} buildings affected</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleLayer("buildings")}
                    >
                      {showLayers.buildings ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">Road Damage</div>
                        <div className="text-xs text-gray-500">{roadDamage.length} sections affected</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleLayer("roads")}
                    >
                      {showLayers.roads ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">Flooded Areas</div>
                        <div className="text-xs text-gray-500">{floodedAreas.length} areas detected</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleLayer("water")}
                    >
                      {showLayers.water ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">Vegetation Loss</div>
                        <div className="text-xs text-gray-500">{vegetationLoss.length} areas affected</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleLayer("vegetation")}
                    >
                      {showLayers.vegetation ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Damage Filter</CardTitle>
                  <CardDescription>
                    Filter by damage severity or type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-3">
                    <RadioGroup defaultValue="all" onValueChange={setSelectedFilter}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all">All Damage</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="critical" id="critical" />
                        <Label htmlFor="critical">Critical Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="buildings" id="buildings" />
                        <Label htmlFor="buildings">Buildings Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="infrastructure" id="infrastructure" />
                        <Label htmlFor="infrastructure">Infrastructure Only</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Detection Threshold: {detectionThreshold}%</Label>
                      <Slider
                        value={[detectionThreshold]}
                        min={10}
                        max={90}
                        step={5}
                        onValueChange={(value) => setDetectionThreshold(value[0])}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="auto-detect" />
                      <Label htmlFor="auto-detect">Auto-detect new damage</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Analysis Settings</CardTitle>
                  <CardDescription>
                    Configure advanced detection settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Detection Model</Label>
                    <Select defaultValue="accurate">
                      <SelectTrigger id="model">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast">Fast Detection</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="accurate">High Accuracy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disaster-type">Disaster Type</Label>
                    <Select defaultValue="hurricane">
                      <SelectTrigger id="disaster-type">
                        <SelectValue placeholder="Select disaster type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hurricane">Hurricane</SelectItem>
                        <SelectItem value="flood">Flood</SelectItem>
                        <SelectItem value="earthquake">Earthquake</SelectItem>
                        <SelectItem value="wildfire">Wildfire</SelectItem>
                        <SelectItem value="tornado">Tornado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Detection Categories</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="flex items-center space-x-2">
                        <Switch id="detect-buildings" defaultChecked />
                        <Label htmlFor="detect-buildings" className="text-sm">Buildings</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="detect-roads" defaultChecked />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="detect-water" defaultChecked />
                        <Label htmlFor="detect-water" className="text-sm">Water</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="detect-vegetation" defaultChecked />
                        <Label htmlFor="detect-vegetation" className="text-sm">Vegetation</Label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      className="w-full"
                      onClick={runEnhancedAnalysis}
                      disabled={!analysisComplete}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Run Enhanced Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">View Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Overlay Type</Label>
                    <Select defaultValue="heatmap">
                      <SelectTrigger>
                        <SelectValue placeholder="Select overlay" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heatmap">Heat Map</SelectItem>
                        <SelectItem value="boundary">Boundary Boxes</SelectItem>
                        <SelectItem value="mask">Segmentation Mask</SelectItem>
                        <SelectItem value="split">Split View</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Color Scheme</Label>
                    <Select defaultValue="severity">
                      <SelectTrigger>
                        <SelectValue placeholder="Select color scheme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="severity">Severity Levels</SelectItem>
                        <SelectItem value="category">Damage Category</SelectItem>
                        <SelectItem value="confidence">Confidence Score</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="show-labels" defaultChecked />
                    <Label htmlFor="show-labels">Show Damage Labels</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="show-grid" />
                    <Label htmlFor="show-grid">Show Grid</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Damage Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Building Damage Severity</div>
                      <div className="space-y-2">
                        {[
                          { label: "Collapsed", percentage: 22, count: 1 },
                          { label: "Severely Damaged", percentage: 38, count: 1 },
                          { label: "Minor Damage", percentage: 40, count: 1 }
                        ].map((item, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="flex items-center">
                                <Badge className={getSeverityColor(item.label)}>
                                  {item.count}
                                </Badge>
                                <span className="ml-2">{item.label}</span>
                              </span>
                              <span>{item.percentage}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${item.label.toLowerCase().includes("collapsed") ? "bg-red-500" :
                                  item.label.toLowerCase().includes("severe") ? "bg-amber-500" :
                                    "bg-yellow-500"
                                  }`}
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="space-y-2">
                        {[
                          { label: "Severe", percentage: 25, count: 1 },
                          { label: "Moderate", percentage: 75, count: 1 }
                        ].map((item, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="flex items-center">
                                <Badge className={getSeverityColor(item.label)}>
                                  {item.count}
                                </Badge>
                                <span className="ml-2">{item.label}</span>
                              </span>
                              <span>{item.percentage}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${item.label === "Severe" ? "bg-red-500" : "bg-amber-500"
                                  }`}
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Flooded Areas</div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="grid grid-cols-2 gap-1">
                          <div className="text-xs text-gray-500">Total Area:</div>
                          <div className="text-xs font-medium text-right">12,500 sqm</div>
                          <div className="text-xs text-gray-500">Average Depth:</div>
                          <div className="text-xs font-medium text-right">1.8m</div>
                          <div className="text-xs text-gray-500">Affected Buildings:</div>
                          <div className="text-xs font-medium text-right">12</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Vegetation Loss</div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="grid grid-cols-2 gap-1">
                          <div className="text-xs text-gray-500">Total Area:</div>
                          <div className="text-xs font-medium text-right">12,500 sqm</div>
                          <div className="text-xs text-gray-500">Percentage:</div>
                          <div className="text-xs font-medium text-right">43%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Detection Confidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-sm font-medium text-gray-800">92.8%</div>
                        <div className="text-xs text-gray-500">Building Detection</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-sm font-medium text-gray-800">88.5%</div>
                        <div className="text-xs text-gray-500">Road Detection</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-sm font-medium text-gray-800">96.2%</div>
                        <div className="text-xs text-gray-500">Flood Detection</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-sm font-medium text-gray-800">94.1%</div>
                        <div className="text-xs text-gray-500">Vegetation Detection</div>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        Export Report
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Results
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Recent analyses */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Analyses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              id: 1,
              name: "Downtown District",
              date: "Mar 15, 2025",
              type: "Hurricane",
              buildings: 32,
              roads: 8,
              flooding: 5,
              image: mockImageAnalysis.afterImageUrl
            },
            {
              id: 2,
              name: "Harbor Area",
              date: "Mar 14, 2025",
              type: "Hurricane",
              buildings: 18,
              roads: 4,
              flooding: 12,
              image: "/mockImages/after.jpg"
            },
            {
              id: 3,
              name: "Residential Zone B",
              date: "Mar 13, 2025",
              type: "Hurricane",
              buildings: 47,
              roads: 6,
              flooding: 3,
              image: "/mockImages/after.jpg"
            }
          ].map((analysis) => (
            <Card key={analysis.id} className="overflow-hidden">
              <div className="relative h-40 overflow-hidden">
                {analysis.image ? (
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${analysis.image})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <CameraOff className="h-8 w-8 text-gray-400" />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <div className="font-medium">{analysis.name}</div>
                  <div className="text-xs">{analysis.date} • {analysis.type}</div>
                </div>
              </div>

              <CardContent className="p-3">
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-sm font-medium">{analysis.buildings}</div>
                    <div className="text-xs text-gray-500">Buildings</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{analysis.roads}</div>
                    <div className="text-xs text-gray-500">Roads</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{analysis.flooding}</div>
                    <div className="text-xs text-gray-500">Flooded</div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between items-center p-3 pt-0">
                <Button variant="link" size="sm" className="h-8 px-0">
                  View Details
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Share2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}