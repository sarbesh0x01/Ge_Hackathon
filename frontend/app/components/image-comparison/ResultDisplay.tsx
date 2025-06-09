"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Download, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Type definitions for result data
interface ImageData {
  image_id: string;
  url?: string;
  filename?: string;
  size?: number;
  type?: string;
  uploadedAt?: string;
}

interface DamagedArea {
  id: string;
  confidence: number;
  severity: "Critical" | "High" | "Medium" | "Low";
  type: string;
  area: number | string;
  estimated_recovery?: string;
}

interface BuildingDamage {
  id: string;
  confidence: number;
  severity: "Critical" | "High" | "Medium" | "Low";
}

interface RoadDamage {
  id: string;
  confidence: number;
  severity?: string;
}

interface FloodedArea {
  id: string;
  confidence: number;
  water_depth: string;
}

interface VegetationLoss {
  id: string;
  confidence: number;
  density: string;
}

interface SeverityDistribution {
  Critical: number;
  High: number;
  Medium: number;
  Low: number;
}

interface DamageTypes {
  [key: string]: number;
}

interface DamageOverview {
  severity_distribution: SeverityDistribution;
  damage_types?: DamageTypes;
}

interface AnalysisResults {
  changed_pixels_percentage: number;
  severity_score: number;
  damaged_areas: DamagedArea[];
  building_damage: BuildingDamage[];
  road_damage: RoadDamage[];
  flooded_areas: FloodedArea[];
  vegetation_loss: VegetationLoss[];
  damage_overview: DamageOverview;
  before_image_url: string;
  after_image_url: string;
  difference_image_url: string;
  comparison_id: string;
  created_at: string;
  analysis_level: string;
  region?: string;
  disaster_type?: string;
}

interface ResultDisplayProps {
  beforeImage: ImageData;
  afterImage: ImageData;
  results: AnalysisResults;
  onReset: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  beforeImage,
  afterImage,
  results,
  onReset
}) => {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Get severity color
  const getSeverityColor = (score: number) => {
    if (score >= 8) return 'bg-red-600 text-white';
    if (score >= 6) return 'bg-orange-500 text-white';
    if (score >= 4) return 'bg-yellow-500 text-black';
    if (score >= 2) return 'bg-blue-500 text-white';
    return 'bg-green-500 text-white';
  };

  // Summary cards
  const renderSummaryCards = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{results.changed_pixels_percentage.toFixed(1)}%</div>
              <p className="text-sm text-gray-500">Changed Area</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                <span className={`px-2 py-1 rounded-md ${getSeverityColor(results.severity_score)}`}>
                  {results.severity_score.toFixed(1)}/10
                </span>
              </div>
              <p className="text-sm text-gray-500">Severity Score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{results.damaged_areas.length}</div>
              <p className="text-sm text-gray-500">Damaged Areas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{results.building_damage.length}</div>
              <p className="text-sm text-gray-500">Buildings Affected</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render damage cards
  const renderDamageCards = () => {
    const categories = {
      building_damage: { title: "Building Damage", color: "bg-red-50", icon: "building" },
      road_damage: { title: "Road Damage", color: "bg-amber-50", icon: "road" },
      flooded_areas: { title: "Flooded Areas", color: "bg-blue-50", icon: "water" },
      vegetation_loss: { title: "Vegetation Loss", color: "bg-green-50", icon: "tree" }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(categories).map(([key, { title, color }]) => (
          <Card key={key} className={`overflow-hidden ${color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">{title}</h3>
                <Badge variant="secondary">
                  {results[key as keyof AnalysisResults].length}
                </Badge>
              </div>
              {results[key as keyof AnalysisResults].length > 0 ? (
                <div className="max-h-40 overflow-y-auto">
                  {(results[key as keyof AnalysisResults] as Array<BuildingDamage | RoadDamage | FloodedArea | VegetationLoss>).map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-1 border-b last:border-0">
                      <div className="flex items-center">
                        <Badge variant={item.confidence > 0.9 ? "default" : "outline"} className="mr-2">
                          {Math.round(item.confidence * 100)}%
                        </Badge>
                        <span className="text-sm">
                          {'severity' in item ? item.severity : 
                           'water_depth' in item ? item.water_depth : 
                           'density' in item ? item.density : ''}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        ID: {item.id}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No {title.toLowerCase()} detected</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render severity distribution
  const renderSeverityDistribution = () => {
    return (
      <Card className="mt-4">
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">Damage Severity Distribution</h3>
          <div className="space-y-4">
            {Object.entries(results.damage_overview.severity_distribution).map(([severity, count]: [string, number]) => (
              <div key={severity} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{severity}</span>
                  <span>{count}</span>
                </div>
                <Progress value={(count / results.damaged_areas.length) * 100} max={100}
                  className={`h-2 ${severity === 'Critical' ? 'bg-red-100' :
                      severity === 'High' ? 'bg-orange-100' :
                        severity === 'Medium' ? 'bg-yellow-100' :
                          'bg-blue-100'
                    }`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render image comparison
  const renderImageComparison = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Before Disaster</h3>
            <div className="border rounded-md overflow-hidden">
              <img
                src={`/api/results/${results.before_image_url.split('/').pop()}`}
                alt="Before disaster"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">After Disaster</h3>
            <div className="border rounded-md overflow-hidden">
              <img
                src={`/api/results/${results.after_image_url.split('/').pop()}`}
                alt="After disaster"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-2">Difference Visualization</h3>
            <div className="border rounded-md overflow-hidden">
              <img
                src={`/api/results/${results.difference_image_url.split('/').pop()}`}
                alt="Difference visualization"
                className="w-full h-auto object-cover"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Red highlights indicate areas with significant changes detected between the images.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render detailed analysis
  const renderDetailedAnalysis = () => {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-2">Analysis Details</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-gray-500">Analysis ID</p>
                  <p className="text-sm font-mono">{results.comparison_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="text-sm">{new Date(results.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Analysis Level</p>
                  <p className="text-sm capitalize">{results.analysis_level}</p>
                </div>
                {results.region && (
                  <div>
                    <p className="text-sm text-gray-500">Region</p>
                    <p className="text-sm capitalize">{results.region}</p>
                  </div>
                )}
                {results.disaster_type && (
                  <div>
                    <p className="text-sm text-gray-500">Disaster Type</p>
                    <p className="text-sm capitalize">{results.disaster_type}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Damage Type Distribution */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-2">Damage Type Distribution</h3>
            <div className="space-y-2">
              {Object.entries(results.damage_overview.damage_types || {}).map(([type, count]: [string, number]) => (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{type}</span>
                    <span>{count}</span>
                  </div>
                  <Progress value={(count / results.damaged_areas.length) * 100} max={100} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Damage List */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-2">All Detected Damages</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.damaged_areas.map((area: DamagedArea) => (
                <div key={area.id} className="border p-3 rounded-md">
                  <div className="flex justify-between">
                    <span className="font-medium">Area #{area.id}</span>
                    <Badge
                      className={
                        area.severity === 'Critical' ? 'bg-red-500' :
                          area.severity === 'High' ? 'bg-orange-500' :
                            area.severity === 'Medium' ? 'bg-yellow-500' :
                              'bg-blue-500'
                      }
                    >
                      {area.severity}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>
                      <span className="text-gray-500">Type: </span>
                      {area.type}
                    </div>
                    <div>
                      <span className="text-gray-500">Area: </span>
                      {typeof area.area === 'number' ? area.area.toFixed(2) + ' px²' : area.area}
                    </div>
                    <div>
                      <span className="text-gray-500">Confidence: </span>
                      {(area.confidence * 100).toFixed(0)}%
                    </div>
                    {area.estimated_recovery && (
                      <div>
                        <span className="text-gray-500">Est. Recovery: </span>
                        {area.estimated_recovery}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Handle report generation
  const handleGenerateReport = () => {
    // In a real app, this would call an API endpoint to generate a PDF report
    alert("Report generation would be implemented here");
  };

  return (
    <div className="space-y-6">
      <Alert variant="default" className="bg-green-50 border-green-200 mb-4">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle>Analysis Complete</AlertTitle>
        <AlertDescription>
          We've analyzed your images and detected {results.damaged_areas.length} areas with changes.
        </AlertDescription>
      </Alert>

      {renderSummaryCards()}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Image Comparison</TabsTrigger>
          <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          {renderDamageCards()}
          {renderSeverityDistribution()}
        </TabsContent>

        <TabsContent value="comparison" className="pt-4">
          {renderImageComparison()}
        </TabsContent>

        <TabsContent value="details" className="pt-4">
          {renderDetailedAnalysis()}
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={onReset}>
          Start New Analysis
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateReport} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
          <Button className="flex items-center gap-2" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;