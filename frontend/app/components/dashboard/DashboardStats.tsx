"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardMetric from "./DashboardMetric";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  Building,
  Users,
  Droplets,
  Rocket,
  Timer,
  Heart,
  Leaf,
  ArrowRight
} from "lucide-react";

interface DashboardStatsProps {
  data: any;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ data }) => {
  const { disasterInfo, damageAssessment, impactAnalysis, emergencyResponse, environmentalImpact } = data;

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="space-y-4">
      {/* Disaster Alert Banner */}
      <Alert variant="destructive" className="border-red-600 bg-red-50">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertTitle className="text-red-800 font-bold flex items-center gap-2">
          {disasterInfo.name} <span className="bg-red-200 text-red-800 px-2 py-0.5 text-xs rounded-full">{disasterInfo.severity}</span>
        </AlertTitle>
        <AlertDescription className="text-red-700">
          {disasterInfo.type} • {disasterInfo.location} • {disasterInfo.date}
        </AlertDescription>
      </Alert>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Building Damage */}
        <DashboardMetric
          title="Building Damage"
          value={`${damageAssessment.buildingDamage.percentage}%`}
          change={{ value: 5, isPositive: false }}
          icon={<Building className="h-5 w-5 text-red-600" />}
          description="of structures affected"
          variant="danger"
          trend={[15, 28, 42, 55, 68, 65]}
        />

        {/* People Affected */}
        <DashboardMetric
          title="People Affected"
          value={formatNumber(impactAnalysis.peopleAffected)}
          change={{ value: 12, isPositive: false }}
          icon={<Users className="h-5 w-5 text-amber-600" />}
          description="total impact"
          variant="warning"
          trend={[10000, 45000, 78000, 95000, 112000, 125000]}
        />

        {/* Emergency Response */}
        <DashboardMetric
          title="Response Rate"
          value={`${emergencyResponse.responseRate}%`}
          change={{ value: 8, isPositive: true }}
          icon={<Rocket className="h-5 w-5 text-green-600" />}
          description="of calls responded to"
          variant="success"
          trend={[60, 65, 72, 78, 83, 89.6]}
        />

        {/* Water Quality */}
        <DashboardMetric
          title="Water Quality"
          value={environmentalImpact.waterQuality.status}
          icon={<Droplets className="h-5 w-5 text-blue-600" />}
          description={environmentalImpact.waterQuality.hazardLevel}
          variant="warning"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Response Time */}
        <DashboardMetric
          title="Avg. Response Time"
          value={`${emergencyResponse.averageResponseTime} min`}
          change={{ value: 12, isPositive: true }}
          icon={<Timer className="h-5 w-5 text-purple-600" />}
          description="improving"
          trend={[65, 58, 50, 45, 40, 35]}
        />

        {/* Medical Services */}
        <DashboardMetric
          title="Medical Services"
          value="Operational"
          icon={<Heart className="h-5 w-5 text-red-600" />}
          description="75% capacity"
        />

        {/* Environmental Impact */}
        <DashboardMetric
          title="Ecosystem Impact"
          value={environmentalImpact.wildlifeImpact.status}
          icon={<Leaf className="h-5 w-5 text-green-600" />}
          description={`${environmentalImpact.wildlifeImpact.habitatsAffected} habitats affected`}
          variant="danger"
        />
      </div>

      {/* Critical Areas Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Critical Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.vulnerabilityAnalysis.highRiskAreas.map((area: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg border bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${area.riskLevel === "Extreme" ? "bg-red-500" :
                      area.riskLevel === "High" ? "bg-amber-500" :
                        "bg-yellow-500"
                    }`}></span>
                  <span className="font-medium">{area.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">{area.population.toLocaleString()} affected</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${area.riskLevel === "Extreme" ? "bg-red-100 text-red-800" :
                      area.riskLevel === "High" ? "bg-amber-100 text-amber-800" :
                        "bg-yellow-100 text-yellow-800"
                    }`}>
                    {area.riskLevel}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
