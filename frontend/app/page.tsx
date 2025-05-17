"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, BarChart3, Camera, Download, MapPin } from "lucide-react";
import { disasterData } from "@/app/lib/mockData";

export default function HomePage() {
  const { disasterInfo } = disasterData;

  return (
    <div className="space-y-10">
      <section className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center rounded-full bg-red-100 px-3 py-1 text-sm text-red-700 mb-4">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            <span>Disaster Assessment Platform</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            Analyze Disaster Impact with <span className="text-blue-600">AI-Powered</span> Image Comparison
          </h1>

          <p className="text-gray-600 max-w-2xl mx-auto md:text-lg">
            Upload before and after images to quickly assess damage, plan response, and coordinate recovery efforts with precision.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8">
            <Button size="lg" asChild>
              <Link href="/comparison">
                <Camera className="mr-2 h-4 w-4" />
                Analyze Images
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-6">Current Disaster:</h2>

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                {disasterInfo.name} - {disasterInfo.severity}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {disasterInfo.location}
                <span className="text-gray-400 mx-1">•</span>
                {disasterInfo.date}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-lg border flex flex-col items-center">
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {disasterData.damageAssessment.buildingDamage.percentage}%
                  </div>
                  <div className="text-sm text-gray-600">Building Damage</div>
                </div>
                <div className="bg-white p-3 rounded-lg border flex flex-col items-center">
                  <div className="text-3xl font-bold text-amber-600 mb-1">
                    {disasterData.impactAnalysis.peopleDisplaced.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">People Displaced</div>
                </div>
                <div className="bg-white p-3 rounded-lg border flex flex-col items-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {disasterData.emergencyResponse.responseRate}%
                  </div>
                  <div className="text-sm text-gray-600">Emergency Response Rate</div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-white rounded-b-lg">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard">
                  View Complete Assessment
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-6">Key Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-500" />
                  Image Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Compare before and after images to detect structural changes, assess damage severity, and identify priority areas.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/comparison">Try Now</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Data Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Interactive dashboards present damage assessment, impact analysis, and resource allocation metrics for informed decisions.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard">Explore</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-500" />
                  Report Generation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Generate comprehensive reports for different stakeholders including emergency responders, government agencies, and NGOs.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/reports">View Reports</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
