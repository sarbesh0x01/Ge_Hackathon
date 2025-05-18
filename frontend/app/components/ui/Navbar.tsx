"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Camera,
  Clock,
  Download,
  Home,
  Map,
  Menu,
  MessageSquare,
  Search,
  Shield,
  X,
} from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [alertCount, setAlertCount] = useState(3);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Handle scrolling effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleEmergencyMode = () => {
    setEmergencyMode(!emergencyMode);
  };

  const NavItem = ({ href, icon, label, alert = false }) => {
    return (
      <Link
        href={href}
        className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
          ${scrolled || emergencyMode
            ? "hover:bg-red-100 hover:text-red-700"
            : "hover:bg-gray-100 hover:text-blue-700"}`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div className={`relative ${emergencyMode ? 'text-red-600' : ''}`}>
          {icon}
          {alert && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </div>
        <span className={emergencyMode ? 'text-red-700' : ''}>{label}</span>
      </Link>
    );
  };

  return (
    <header
      className={`sticky top-0 z-30 w-full transition-colors duration-300 ${scrolled
        ? "bg-white shadow-md"
        : emergencyMode
          ? "bg-red-50 border-b border-red-200"
          : "bg-white border-b"
        }`}
    >
      {/* Emergency alert banner */}
      {emergencyMode && (
        <div className="bg-red-600 text-white px-4 py-1.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4 animate-pulse" />
          <span>EMERGENCY MODE ACTIVATED: Prioritizing critical response actions</span>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and desktop navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
              <div className={`relative flex items-center justify-center ${emergencyMode ? "animate-pulse text-red-600" : "text-red-600"
                }`}>
                <AlertTriangle className="h-6 w-6" />
                {emergencyMode && (
                  <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </div>
              <span className={emergencyMode ? "text-red-700" : ""}>DisasterSense</span>
            </Link>

            {/* Live status indicator */}
            <div className="hidden md:flex ml-4 items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-gray-600">LIVE</span>
              <span className="text-gray-500 ml-1">{currentTime}</span>
            </div>

            <nav className="hidden md:ml-8 md:flex md:items-center md:space-x-1">
              <NavItem href="/" icon={<Home className="h-4 w-4" />} label="Home" />
              <NavItem
                href="/dashboard"
                icon={<BarChart3 className="h-4 w-4" />}
                label="Dashboard"
                alert={emergencyMode}
              />
              <NavItem href="/comparison" icon={<Camera className="h-4 w-4" />} label="Image Analysis" />
              <NavItem href="/reports" icon={<Download className="h-4 w-4" />} label="Reports" />
              <NavItem href="/map" icon={<Map className="h-4 w-4" />} label="Map View" alert={emergencyMode} />
              <NavItem href="/chat" icon={<MessageSquare className="h-4 w-4" />} label="Disaster Chat" />
            </nav>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Emergency mode toggle */}
            <Button
              variant={emergencyMode ? "destructive" : "outline"}
              size="sm"
              onClick={toggleEmergencyMode}
              className={`hidden md:flex items-center gap-1.5 h-9 ${emergencyMode
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "border-red-300 text-red-700 hover:bg-red-50"
                }`}
            >
              <Shield className="h-4 w-4" />
              <span>{emergencyMode ? "Exit Emergency Mode" : "Emergency Mode"}</span>
            </Button>

            {/* Notifications button */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className={`relative ${emergencyMode ? "text-red-600 hover:bg-red-100" : "hover:bg-gray-100"
                  }`}
              >
                <Bell className="h-5 w-5" />
                {alertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-medium text-white">
                    {alertCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Search bar - desktop */}
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="search"
                placeholder="Search disasters, locations..."
                className="w-full rounded-lg border border-gray-300 bg-gray-50 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden ${emergencyMode ? "text-red-600" : ""}`}
              onClick={toggleMenu}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className={`space-y-1 px-4 py-3 pt-2 pb-4 border-t ${emergencyMode ? "bg-red-50" : ""
            }`}>
            <NavItem href="/" icon={<Home className="h-5 w-5" />} label="Home" />
            <NavItem
              href="/dashboard"
              icon={<BarChart3 className="h-5 w-5" />}
              label="Dashboard"
              alert={emergencyMode}
            />
            <NavItem href="/comparison" icon={<Camera className="h-5 w-5" />} label="Image Analysis" />
            <NavItem href="/reports" icon={<Download className="h-5 w-5" />} label="Reports" />
            <NavItem
              href="/map"
              icon={<Map className="h-5 w-5" />}
              label="Map View"
              alert={emergencyMode}
            />
            <NavItem href="/chat" icon={<MessageSquare className="h-5 w-5" />} label="Disaster Chat" />

            <div className="pt-3 pb-1 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="search"
                  placeholder="Search disasters, locations..."
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>


              <Button
                variant="outline"
                className="w-full mt-2"
              >
                <Clock className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
