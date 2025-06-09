"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Badge } from "@/components/ui/badge";

// Type definitions for resource data
interface ResourceItem {
  available: number;
  required: number;
}

interface AvailableResources {
  [key: string]: ResourceItem;
}

interface PriorityArea {
  area: string;
  priority: "Critical" | "High" | "Medium" | "Low";
}

type SupplyChainStatus = "Critical" | "Limited" | "Strained" | "Available" | "Unavailable";

interface SupplyChainStatusMap {
  [key: string]: SupplyChainStatus;
}

interface ResourceAllocation {
  availableResources: AvailableResources;
  priorityAreas: PriorityArea[];
  supplyChainStatus: SupplyChainStatusMap;
}

interface ResourceChartData {
  resourceAllocation: ResourceAllocation;
}

interface ResourceChartProps {
  data: ResourceChartData;
}

// Chart data interfaces
interface ResourceDataItem {
  name: string;
  available: number;
  required: number;
  deficit: number;
  fulfillmentRate: number;
}

interface PriorityDataItem {
  name: string;
  value: number;
  priority: "Critical" | "High" | "Medium" | "Low";
}

interface SupplyChainDataItem {
  name: string;
  status: SupplyChainStatus;
  value: number;
}

const ResourceChart: React.FC<ResourceChartProps> = ({ data }) => {
  const { resourceAllocation } = data;

  // Format data for resource availability chart
  const resourceData: ResourceDataItem[] = Object.entries(resourceAllocation.availableResources).map(([key, value]: [string, ResourceItem]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    available: value.available,
    required: value.required,
    deficit: value.required - value.available,
    fulfillmentRate: Math.round((value.available / value.required) * 100)
  }));

  // Format data for priority areas chart
  const priorityData: PriorityDataItem[] = resourceAllocation.priorityAreas.map((item: PriorityArea) => ({
    name: item.area,
    value: item.priority === "Critical" ? 100 :
      item.priority === "High" ? 75 :
        item.priority === "Medium" ? 50 : 25,
    priority: item.priority
  }));

  // Format data for supply chain status
  const supplyChainData: SupplyChainDataItem[] = Object.entries(resourceAllocation.supplyChainStatus).map(([key, value]: [string, SupplyChainStatus]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    status: value,
    value: value === "Critical" ? 20 :
      value === "Limited" ? 40 :
        value === "Strained" ? 60 :
          value === "Available" ? 80 : 30,
  }));

  const PRIORITY_COLORS = {
    "Critical": "#ef4444",
    "High": "#f97316",
    "Medium": "#eab308",
    "Low": "#84cc16"
  } as const;

  const STATUS_COLORS = {
    "Critical": "#ef4444",
    "Limited": "#f97316",
    "Strained": "#eab308",
    "Available": "#84cc16",
    "Unavailable": "#64748b"
  } as const;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resource Allocation</CardTitle>
        <CardDescription>
          Available resources, priorities, and supply chain status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="availability">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="availability">Resource Availability</TabsTrigger>
            <TabsTrigger value="priorities">Priority Areas</TabsTrigger>
            <TabsTrigger value="supplychain">Supply Chain</TabsTrigger>
          </TabsList>

          <TabsContent value="availability" className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={resourceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
              formatter={(value, name) => [
  value,
  name === "fulfillmentRate"
    ? "Fulfillment Rate (%)"
    : typeof name === "string"
      ? name.charAt(0).toUpperCase() + name.slice(1)
      : name
]}

                />
                <Legend />
                <Bar dataKey="available" stackId="a" fill="#3b82f6" name="Available" />
                <Bar dataKey="deficit" stackId="a" fill="#f87171" name="Deficit" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="priorities" className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={90} data={priorityData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="Priority Level"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Tooltip
                  formatter={(value, name, props) => [
                    props.payload.priority,
                    "Priority Level"
                  ]}
                />
              </RadarChart>
            </ResponsiveContainer>

            <div className="flex justify-center mt-2 gap-2">
              {(["Critical", "High", "Medium", "Low"] as const).map(priority => (
                <Badge
                  key={priority}
                  variant="outline"
                  className="flex items-center gap-1"
                  style={{ borderColor: PRIORITY_COLORS[priority] }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLORS[priority] }}
                  ></span>
                  {priority}
                </Badge>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="supplychain" className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={supplyChainData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name }) => name}
                >
                  {supplyChainData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    props.payload.status,
                    props.payload.name
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex justify-center mt-2 flex-wrap gap-2">
              {(Object.keys(STATUS_COLORS) as Array<keyof typeof STATUS_COLORS>).map(status => (
                <Badge
                  key={status}
                  variant="outline"
                  className="flex items-center gap-1"
                  style={{ borderColor: STATUS_COLORS[status] }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[status] }}
                  ></span>
                  {status}
                </Badge>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 bg-gray-50 rounded-lg p-3 border">
          <h3 className="font-medium text-gray-700">Resource Gaps</h3>
          <div className="mt-2 space-y-2">
            {resourceData.filter(item => item.fulfillmentRate < 90).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{item.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.fulfillmentRate < 50 ? "bg-red-500" :
                          item.fulfillmentRate < 75 ? "bg-amber-500" :
                            "bg-green-500"
                        }`}
                      style={{ width: `${item.fulfillmentRate}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium w-12 text-right">
                    {item.fulfillmentRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceChart;