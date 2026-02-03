"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store";
import { cn } from "@/lib/utils";
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
    <div className="space-y-6 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Settings className="h-4.5 w-4.5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
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
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary text-lg font-display font-semibold">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div>
                <div className="font-semibold">{user?.name || "Guest"}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
                <Badge className="mt-1.5 capitalize">{user?.role}</Badge>
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
              <div key={item.label} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
                <div className={cn(
                  "h-5 w-9 rounded-full relative transition-colors cursor-default",
                  item.enabled ? "bg-primary" : "bg-muted-foreground/20"
                )}>
                  <div className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                    item.enabled ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </div>
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
            <div className="space-y-1">
              <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                <span className="text-sm">Internal Portfolio Data</span>
                <Badge variant="high">Full Access</Badge>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                <span className="text-sm">External Benchmark Data</span>
                <Badge variant="high">Full Access</Badge>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm">Admin Functions</span>
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
            <div className="flex gap-3">
              <button className="flex-1 h-16 rounded-lg border-2 border-primary bg-primary/5 flex flex-col items-center justify-center gap-1 transition-colors">
                <div className="h-4 w-8 rounded bg-white border border-border" />
                <span className="text-xs font-medium">Light</span>
              </button>
              <button className="flex-1 h-16 rounded-lg border border-border flex flex-col items-center justify-center gap-1 opacity-50 cursor-default">
                <div className="h-4 w-8 rounded bg-slate-800 border border-slate-700" />
                <span className="text-xs text-muted-foreground">Dark</span>
              </button>
              <button className="flex-1 h-16 rounded-lg border border-border flex flex-col items-center justify-center gap-1 opacity-50 cursor-default">
                <div className="h-4 w-8 rounded bg-gradient-to-r from-white to-slate-800 border border-border" />
                <span className="text-xs text-muted-foreground">System</span>
              </button>
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
