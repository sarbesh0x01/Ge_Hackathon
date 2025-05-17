"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface DamageChartProps {
  data: any;
}

const DamageChart: React.FC<DamageChartProps> = ({ data }) => {
  const buildingDamageData = data.damageAssessment.buildingDamage.types;
  const infrastructureDamageData = data.damageAssessment.infrastructureDamage.types;
  const agriculturalDamageData = data.damageAssessment.agriculturalDamage.types;

  const COLORS = {
    building: ['#FF8042', '#0088FE', '#FFBB28', '#00C49F'],
    infrastructure: ['#FF8042', '#0088FE', '#FFBB28', '#00C49F'],
    agriculture: ['#0088FE', '#00C49F', '#FFBB28']
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Damage Assessment</CardTitle>
        <CardDescription>
          Analysis of structural and environmental damage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buildings">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="buildings">Buildings</TabsTrigger>
            <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
            <TabsTrigger value="agriculture">Agriculture</TabsTrigger>
          </TabsList>

          <TabsContent value="buildings" className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={buildingDamageData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                  nameKey="type"
                >
                  {buildingDamageData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS.building[index % COLORS.building.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="infrastructure" className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={infrastructureDamageData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="type" type="category" width={80} />
                <Tooltip formatter={(value) => [`${value}%`, 'Damage']} />
                <Bar dataKey="percentage" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="agriculture" className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={agriculturalDamageData}
                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Damage']} />
                <Bar dataKey="percentage" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DamageChart;
