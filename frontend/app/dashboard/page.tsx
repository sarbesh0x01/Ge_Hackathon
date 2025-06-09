"use client";

import React from "react";
import { disasterData, timeSeriesData } from "@/app/lib/mockData";
// import DashboardStats from "@/app/components/dashboard/DashboardStats";
import DamageChart from "@/app/components/dashboard/charts/DamageChart";
import ImpactChart from "@/app/components/dashboard/charts/ImpactChart";
import ResponseChart from "@/app/components/dashboard/charts/ResponseChart";
// import ResourceChart from "@/app/components/dashboard/charts/ResourceChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";

// Type definitions for better type safety
interface DamageType {
  type: string;
  percentage: number;
}

interface CriticalInfrastructure {
  type: string;
  affectedPercentage: number;
}

export default function DashboardPage() {
  const { disasterInfo } = disasterData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{disasterInfo.name} Dashboard</h1>
          <p className="text-gray-500">
            {disasterInfo.type} • {disasterInfo.location} • {disasterInfo.date}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
          <Button size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      {/* <DashboardStats data={disasterData} /> */}

      {/* Charts Section */}
      <Tabs defaultValue="damage" className="w-full">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="damage">Damage Assessment</TabsTrigger>
          <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
          <TabsTrigger value="response">Emergency Response</TabsTrigger>
          <TabsTrigger value="resources">Resource Allocation</TabsTrigger>
        </TabsList>

        <TabsContent value="damage">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DamageChart data={disasterData} />

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-lg border p-4">
                <h3 className="text-lg font-medium mb-3">Damage Hotspots</h3>
                <div className="space-y-3">
                  {disasterData.damageAssessment.buildingDamage.types.map((item: DamageType, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${index === 0 ? "bg-red-500" :
                          index === 1 ? "bg-blue-500" :
                            index === 2 ? "bg-amber-500" :
                              "bg-green-500"
                          }`}></span>
                        <span>{item.type}</span>
                      </div>
                      <div className="font-medium">{item.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <h3 className="text-lg font-medium mb-3">Recovery Timeline</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Essential Services</span>
                    <span className="font-medium text-green-600">6 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Basic Infrastructure</span>
                    <span className="font-medium text-amber-600">3 weeks</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Non-Essential Buildings</span>
                    <span className="font-medium text-red-600">2-3 months</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Complete Reconstruction</span>
                    <span className="font-medium text-purple-600">1-2 years</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="impact">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImpactChart data={disasterData} />

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-lg border p-4">
                <h3 className="text-lg font-medium mb-3">Critical Infrastructure</h3>
                <div className="space-y-3">
                  {disasterData.impactAnalysis.criticalInfrastructure.map((item: CriticalInfrastructure, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{item.type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full">
                          <div
                            className={`h-full rounded-full ${item.affectedPercentage > 70 ? "bg-red-500" :
                              item.affectedPercentage > 40 ? "bg-amber-500" :
                                "bg-green-500"
                              }`}
                            style={{ width: `${item.affectedPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{item.affectedPercentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <h3 className="text-lg font-medium mb-2">Economic Impact</h3>
                <div className="text-3xl font-bold text-red-600 mb-1">
                  ${(disasterData.impactAnalysis.economicLoss / 1000000000).toFixed(2)}B
                </div>
                <p className="text-sm text-gray-600 mb-4">Estimated total economic damage</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Property Damage</span>
                    <span className="font-medium">$100k</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Business Interruption</span>
                    <span className="font-medium">$750k</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Infrastructure Damage</span>
                    <span className="font-medium">$400k</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="response">
          <ResponseChart data={disasterData} timeSeriesData={timeSeriesData} />
        </TabsContent>

        <TabsContent value="resources">
          {/* <ResourceChart data={disasterData} /> */}
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-medium mb-2">Recent Updates</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 border-l-2 border-blue-500 pl-3">
              <div className="text-xs text-gray-500 w-24 flex-shrink-0">Today, 11:52 AM</div>
              <div className="flex-1">
                <p className="text-sm">Search and rescue operations completed in the northern sector</p>
              </div>
            </li>
            <li className="flex gap-2 border-l-2 border-green-500 pl-3">
              <div className="text-xs text-gray-500 w-24 flex-shrink-0">Today, 10:15 AM</div>
              <div className="flex-1">
                <p className="text-sm">Emergency water supply restored to downtown district</p>
              </div>
            </li>
            <li className="flex gap-2 border-l-2 border-amber-500 pl-3">
              <div className="text-xs text-gray-500 w-24 flex-shrink-0">Today, 08:30 AM</div>
              <div className="flex-1">
                <p className="text-sm">New evacuation order issued for riverside communities</p>
              </div>
            </li>
            <li className="flex gap-2 border-l-2 border-purple-500 pl-3">
              <div className="text-xs text-gray-500 w-24 flex-shrink-0">Yesterday</div>
              <div className="flex-1">
                <p className="text-sm">Additional 150 emergency personnel deployed from neighboring regions</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}