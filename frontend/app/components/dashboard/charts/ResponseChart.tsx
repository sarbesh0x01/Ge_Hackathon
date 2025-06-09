"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Type definitions for response data
interface ResourceAllocation {
  personnel: number;
  vehicles: number;
  equipment: number;
  efficiency: number;
}

interface EmergencyResponse {
  resourceAllocation: ResourceAllocation;
  callsResponded: number;
  callsReceived: number;
  responseRate: number;
  averageResponseTime: number;
}

interface ResponseChartData {
  emergencyResponse: EmergencyResponse;
}

interface TimeSeriesData {
  dates: string[];
  responseEfficiency: number[];
  rescuedPeople: number[];
}

interface ResponseChartProps {
  data: ResponseChartData;
  timeSeriesData: TimeSeriesData;
}

// Chart data interfaces
interface ResponseTimeDataItem {
  date: string;
  responseEfficiency: number;
  rescuedPeople: number;
}

interface ResourceDataItem {
  name: string;
  available: number;
  required: number;
}

interface CallResponseDataItem {
  name: string;
  value: number;
}

interface EfficiencyChangeItem {
  date: string;
  change: number;
}

const ResponseChart: React.FC<ResponseChartProps> = ({ data, timeSeriesData }) => {
  const { emergencyResponse } = data;

  // Format data for charts
  const responseTimeData: ResponseTimeDataItem[] = timeSeriesData.dates.map((date: string, index: number) => ({
    date,
    responseEfficiency: timeSeriesData.responseEfficiency[index],
    rescuedPeople: timeSeriesData.rescuedPeople[index]
  }));

  const resourceData: ResourceDataItem[] = [
    {
      name: "Personnel",
      available: emergencyResponse.resourceAllocation.personnel,
      required: emergencyResponse.resourceAllocation.personnel * 1.4
    },
    {
      name: "Vehicles",
      available: emergencyResponse.resourceAllocation.vehicles,
      required: emergencyResponse.resourceAllocation.vehicles * 1.3
    },
    {
      name: "Equipment",
      available: emergencyResponse.resourceAllocation.equipment,
      required: emergencyResponse.resourceAllocation.equipment * 1.5
    },
  ];


  // Calculate daily response efficiency change
  const efficiencyChanges: EfficiencyChangeItem[] = [];
  for (let i = 1; i < timeSeriesData.responseEfficiency.length; i++) {
    efficiencyChanges.push({
      date: timeSeriesData.dates[i],
      change: timeSeriesData.responseEfficiency[i] - timeSeriesData.responseEfficiency[i - 1]
    });
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Emergency Response</CardTitle>
        <CardDescription>
          Response metrics and resource allocation over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="efficiency">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="efficiency">Response Efficiency</TabsTrigger>
            <TabsTrigger value="resources">Resource Utilization</TabsTrigger>
            <TabsTrigger value="trends">Response Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="efficiency" className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, Math.max(...timeSeriesData.rescuedPeople) * 1.1]} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="responseEfficiency"
                  stroke="#3b82f6"
                  name="Response Efficiency (%)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rescuedPeople"
                  stroke="#10b981"
                  name="People Rescued"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="resources" className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={resourceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Units']} />
                <Legend />
                <Bar dataKey="available" fill="#3b82f6" name="Available" />
                <Bar dataKey="required" fill="#f59e0b" name="Required" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="trends" className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={efficiencyChanges}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Daily Change']} />
                <Legend />
                <Bar dataKey="change" fill="#3b82f6" name="Daily Efficiency Change" />
              </ComposedChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="border rounded-lg p-3 bg-blue-50">
            <div className="text-sm font-medium text-gray-600">Response Rate</div>
            <div className="text-2xl font-bold mt-1">{emergencyResponse.responseRate}%</div>
            <div className="text-xs text-gray-500">of emergency calls</div>
          </div>

          <div className="border rounded-lg p-3 bg-green-50">
            <div className="text-sm font-medium text-gray-600">Avg. Response Time</div>
            <div className="text-2xl font-bold mt-1">{emergencyResponse.averageResponseTime} min</div>
            <div className="text-xs text-gray-500">improving daily</div>
          </div>

          <div className="border rounded-lg p-3 bg-amber-50">
            <div className="text-sm font-medium text-gray-600">Resource Efficiency</div>
            <div className="text-2xl font-bold mt-1">{emergencyResponse.resourceAllocation.efficiency}%</div>
            <div className="text-xs text-gray-500">allocation effectiveness</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResponseChart;