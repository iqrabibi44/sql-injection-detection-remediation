import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import type { MonitoringEvent } from "@shared/schema";

export default function Monitoring() {
  const [, setLocation] = useLocation();
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const [isLive, setIsLive] = useState(false);

  const { data: historyEvents = [] } = useQuery<MonitoringEvent[]>({
    queryKey: ["/api/admin/monitoring/history"],
  });

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      if (userData.role !== "admin") {
        setLocation("/dashboard");
        return;
      }
    } else {
      setLocation("/login");
    }
  }, [setLocation]);

  useEffect(() => {
    // Initialize with history
    if (historyEvents.length > 0) {
      setEvents(historyEvents);
    }

    // WebSocket connection for real-time events
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host || "localhost:5000";
    const wsUrl = `${protocol}//${host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsLive(true);
      console.log("WebSocket connected for monitoring");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "monitoring_event") {
          setEvents((prev) => [data.event, ...prev].slice(0, 100));
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      setIsLive(false);
      console.log("WebSocket disconnected");
    };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsLive(false);
      };

      return () => {
        ws.close();
      };
    } catch (error) {
      console.error("WebSocket connection failed:", error);
      setIsLive(false);
    }
  }, [historyEvents]);

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case "high": return "destructive";
      case "medium": return "warning";
      case "low": return "success";
      default: return "secondary";
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "scan_started": return "default";
      case "scan_completed": return "success";
      case "high_risk_detected": return "destructive";
      case "user_login": return "outline";
      default: return "secondary";
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Real-Time Monitoring</h1>
              <p className="text-muted-foreground">
                Live system events and activity monitoring
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLive ? "bg-success animate-pulse" : "bg-muted"}`} />
              <span className="text-sm text-muted-foreground">
                {isLive ? "Live" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Feed</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No events yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Events will appear here in real-time
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {events.map((event: MonitoringEvent, index) => (
                  <div
                    key={`${event.id}-${index}`}
                    className="flex items-start gap-3 p-4 rounded-lg border border-border"
                    data-testid={`event-${event.id}`}
                  >
                    <div className={`w-1 h-full rounded-full ${
                      event.severity === "high" ? "bg-destructive" :
                      event.severity === "medium" ? "bg-warning" :
                      event.severity === "low" ? "bg-success" :
                      "bg-primary"
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getEventTypeColor(event.type) as "default" | "destructive" | "outline" | "secondary"}>
                          {event.type.replace(/_/g, " ")}
                        </Badge>
                        {event.severity && (
                          <Badge variant={getSeverityColor(event.severity) as "default" | "destructive" | "outline" | "secondary"}>
                            {event.severity}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{event.message}</p>
                      {event.userId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          User ID: {event.userId}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
