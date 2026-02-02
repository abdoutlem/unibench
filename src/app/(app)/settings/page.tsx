"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store";
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Palette,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
          <Settings className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and application preferences
          </p>
        </div>
      </div>

      {/* Settings sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Your account information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div>
                <div className="font-semibold text-lg">{user?.name || "Guest"}</div>
                <div className="text-muted-foreground">{user?.email}</div>
                <Badge className="mt-1 capitalize">{user?.role}</Badge>
              </div>
            </div>
            <div className="pt-4 border-t">
              <Button variant="outline" disabled>
                Edit Profile
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Profile editing will be available in Phase 1
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive alerts and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Data updates", description: "When new data is available", enabled: true },
              { label: "Weekly reports", description: "Summary of portfolio changes", enabled: true },
              { label: "Benchmark alerts", description: "Significant changes in rankings", enabled: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
                <Badge variant={item.enabled ? "default" : "secondary"}>
                  {item.enabled ? "On" : "Off"}
                </Badge>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-2 border-t">
              Notification settings will be configurable in Phase 1
            </p>
          </CardContent>
        </Card>

        {/* Data Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Data Access
            </CardTitle>
            <CardDescription>
              Your permissions and data access levels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span>Internal Portfolio Data</span>
                <Badge variant="high">Full Access</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>External Benchmark Data</span>
                <Badge variant="high">Full Access</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Admin Functions</span>
                <Badge variant={user?.role === "admin" ? "high" : "low"}>
                  {user?.role === "admin" ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              Contact your administrator to request access changes
            </p>
          </CardContent>
        </Card>

        {/* Data Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Preferences
            </CardTitle>
            <CardDescription>
              Default views and data display options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span>Default Peer Group</span>
                <Badge variant="outline">Research Public</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Default Time Range</span>
                <Badge variant="outline">10 Years</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Number Format</span>
                <Badge variant="outline">Compact ($1.2M)</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              Preference customization will be available in Phase 1
            </p>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Theme and display settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 h-20 flex-col">
                <span className="text-2xl mb-1">☀️</span>
                <span>Light</span>
              </Button>
              <Button variant="outline" className="flex-1 h-20 flex-col" disabled>
                <span className="text-2xl mb-1">🌙</span>
                <span>Dark</span>
              </Button>
              <Button variant="outline" className="flex-1 h-20 flex-col" disabled>
                <span className="text-2xl mb-1">💻</span>
                <span>System</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Dark mode and system preference will be available in Phase 1
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
