"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  Camera,
  Download,
  Home,
  Map,
  Search,
  Settings,
  Menu,
  X,
  MessageSquare
} from "lucide-react";

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  const NavItem = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => {
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-blue-50 hover:text-blue-700",
          isActive ? "bg-blue-100 text-blue-800 font-medium" : "text-gray-700"
        )}
        onClick={() => setIsMenuOpen(false)}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and desktop navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <span>DisasterSense</span>
            </Link>

            <nav className="hidden md:ml-8 md:flex md:items-center md:space-x-1">
              <NavItem href="/" icon={<Home className="h-4 w-4" />} label="Home" />
              <NavItem href="/dashboard" icon={<BarChart3 className="h-4 w-4" />} label="Dashboard" />
              <NavItem href="/comparison" icon={<Camera className="h-4 w-4" />} label="Image Analysis" />
              <NavItem href="/reports" icon={<Download className="h-4 w-4" />} label="Reports" />
              <NavItem href="/map" icon={<Map className="h-4 w-4" />} label="Map View" />
              <NavItem href="/chat" icon={<MessageSquare className="h-4 w-4" />} label="Disaster Chat" />
            </nav>
          </div>

          {/* Right side controls */}
          <div className="relative hidden md:block w-64">

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
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
          <div className="space-y-1 px-4 py-3 pt-2 pb-4 border-t">
            <NavItem href="/" icon={<Home className="h-5 w-5" />} label="Home" />
            <NavItem href="/dashboard" icon={<BarChart3 className="h-5 w-5" />} label="Dashboard" />
            <NavItem href="/comparison" icon={<Camera className="h-5 w-5" />} label="Image Analysis" />
            <NavItem href="/reports" icon={<Download className="h-5 w-5" />} label="Reports" />
            <NavItem href="/map" icon={<Map className="h-5 w-5" />} label="Map View" />
            <NavItem href="/chat" icon={<MessageSquare className="h-5 w-5" />} label="Disaster Chat" />

            <div className="pt-2 pb-1">
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <Button className="mt-3 w-full">New Analysis</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
