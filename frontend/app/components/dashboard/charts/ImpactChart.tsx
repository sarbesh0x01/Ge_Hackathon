"use client";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

// Type definitions for impact data
interface CriticalInfrastructureItem {
  type: string;
  affectedPercentage: number;
  status: string;
}

interface ImpactAnalysis {
  peopleAffected: number;
  peopleDisplaced: number;
  peopleInjured: number;
  fatalitiesReported: number;
  criticalInfrastructure: CriticalInfrastructureItem[];
}

interface ImpactChartData {
  impactAnalysis: ImpactAnalysis;
}

interface ImpactChartProps {
  data: ImpactChartData;
}

// Interface for chart data structures
interface PeopleAffectedDataItem {
  name: string;
  value: number;
}

interface InfrastructureDataItem {
  name: string;
  affectedPercentage: number;
  status: string;
}

const ImpactChart: React.FC<ImpactChartProps> = ({ data }) => {
  const { impactAnalysis } = data;

  // Format people affected data for chart
  const peopleAffectedData: PeopleAffectedDataItem[] = [
    { name: "Displaced", value: impactAnalysis.peopleDisplaced },
    { name: "Injured", value: impactAnalysis.peopleInjured },
    { name: "Fatalities", value: impactAnalysis.fatalitiesReported },
    { name: "Other", value: impactAnalysis.peopleAffected - impactAnalysis.peopleDisplaced - impactAnalysis.peopleInjured - impactAnalysis.fatalitiesReported }
  ];

  // Format critical infrastructure data for chart
  const infrastructureData: InfrastructureDataItem[] = impactAnalysis.criticalInfrastructure.map((item: CriticalInfrastructureItem) => ({
    name: item.type,
    affectedPercentage: item.affectedPercentage,
    status: item.status
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FF8042', '#FFBB28'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Impact Analysis</CardTitle>
        <CardDescription>
          Human and infrastructure impact assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="people">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="people">People Affected</TabsTrigger>
            <TabsTrigger value="infrastructure">Critical Infrastructure</TabsTrigger>
          </TabsList>
          
          <TabsContent value="people" className="h-80 pt-4">
            <div className="mb-2 text-center">
              <div className="text-2xl font-bold">{impactAnalysis.peopleAffected.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Total People Affected</div>
            </div>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={peopleAffectedData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value, percent }) => `${name}: ${percent.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {peopleAffectedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value.toLocaleString(), 'People']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="infrastructure" className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={infrastructureData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(value) => [`${value}%`, 'Affected']} />
                <Legend />
                <Bar dataKey="affectedPercentage" fill="#FF8042" name="Affected %" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ImpactChart;