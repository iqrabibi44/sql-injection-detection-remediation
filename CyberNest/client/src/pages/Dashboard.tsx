import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, FileText, AlertTriangle, CheckCircle, ArrowRight, TrendingUp, Code2, Zap, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import type { Scan, User } from "@shared/schema";

/* ─── Display name helper ─── */
const LANG_EXT: Record<string, string> = {
  javascript: "js", python: "py", java: "java", cpp: "cpp",
  php: "php", ruby: "rb", go: "go", rust: "rs",
};
function getScanDisplayName(scan: any): string {
  if (scan.fileName && scan.fileName.trim() && scan.fileName !== "Untitled Scan") {
    return scan.fileName;
  }
  const ext = LANG_EXT[scan.language] || "txt";
  const date = new Date(scan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${scan.language}_scan_${date}.${ext}`;
}


export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: scans = [], isLoading: scansLoading, isFetching } = useQuery<Scan[]>({
    queryKey: ["/api/user/scans"],
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: profile } = useQuery<User>({
    queryKey: ["/api/user/profile"],
  });


  const totalScans = scans.length;

  // Flatten all vulnerabilities across all scans for accurate totals
  const allVulns = (scans as any[]).flatMap((s: any) => s.vulnerabilities || []);
  const highVulns = allVulns.filter((v: any) => v.severity === "high");
  const medVulns = allVulns.filter((v: any) => v.severity === "medium");
  const totalVulns = allVulns.length;

  const highRiskCount = (scans as any[]).filter((scan: any) =>
    (scan.vulnerabilities || []).some((v: any) => v.severity === "high")
  ).length;

  const completedScans = (scans as any[]).filter((scan: any) => scan.status === "completed").length;

  const recentScans = scans.slice(0, 5);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "destructive" as const;
      case "medium": return "outline" as const;
      case "low": return "outline" as const;
      default: return "outline" as const;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 md:p-12 space-y-8">
        {/* Header Section */}
        <div className="mb-12 animate-slideInDown flex items-start justify-between">
          <div>
            <h1 className="text-5xl font-bold mb-3 gradient-text">Security Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Welcome back, <span className="text-primary font-semibold">{profile?.name || "User"}</span>
            </p>
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/user/scans"] })}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-sm text-muted-foreground hover:text-foreground transition-all duration-200 disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-primary" : ""}`} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
          {/* Total Scans Card */}
          <div className="glass card-hover rounded-2xl p-6 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/20 glow-blue">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1 font-medium">Total Scans</p>
            <p className="text-4xl font-bold mb-2" data-testid="stat-total-scans">{totalScans}</p>
            <div className="flex items-center gap-1 text-xs text-blue-400">
              <TrendingUp className="w-3 h-3" />
              <span>Security audits</span>
            </div>
          </div>

          {/* Completed Card */}
          <div className="glass card-hover rounded-2xl p-6 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-success/20">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1 font-medium">Completed</p>
            <p className="text-4xl font-bold text-success mb-2" data-testid="stat-completed">{completedScans}</p>
            <div className="flex items-center gap-1 text-xs text-success">
              <TrendingUp className="w-3 h-3" />
              <span>Finished</span>
            </div>
          </div>

          {/* High Risk Card */}
          <div className="glass card-hover rounded-2xl p-6 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-destructive/20 glow-orange">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1 font-medium">High Risk Scans</p>
            <p className="text-4xl font-bold text-destructive mb-2" data-testid="stat-high-risk">{highRiskCount}</p>
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="w-3 h-3" />
              <span>{highVulns.length > 0 ? `${highVulns.length} high-severity issues` : "All clear"}</span>
            </div>
          </div>

          {/* Critical Vulns Card */}
          <div className="glass card-hover rounded-2xl p-6 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/20 glow-purple">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1 font-medium">Vulnerabilities</p>
            <p className="text-4xl font-bold text-purple-400 mb-2" data-testid="stat-vulns">{totalVulns}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-red-400 font-semibold">{highVulns.length} high</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-yellow-400 font-semibold">{medVulns.length} med</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 animate-slideInUp">
          {/* Start Scanning Card */}
          <div className="glass card-hover rounded-2xl p-8 border-l-4 border-l-blue-500">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold mb-2 gradient-text">Start New Scan</h3>
                <p className="text-muted-foreground">
                  Upload your code or paste it directly to scan for SQL vulnerabilities in seconds
                </p>
              </div>
              <Code2 className="w-12 h-12 text-blue-400 opacity-20" />
            </div>
            <Link href="/scanner">
              <Button size="lg" className="gap-2 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-blue-500/50" data-testid="button-new-scan">
                <Zap className="w-4 h-4" />
                Start Scanning <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* AI Assistant Card */}
          <div className="glass card-hover rounded-2xl p-8 border-l-4 border-l-purple-500">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold mb-2 gradient-text-scanner">AI Fix Assistant</h3>
                <p className="text-muted-foreground">
                  Get automated fix suggestions powered by GPT for detected vulnerabilities
                </p>
              </div>
              <Zap className="w-12 h-12 text-purple-400 opacity-20" />
            </div>
            <Link href="/ai-assistant">
              <Button size="lg" variant="outline" className="gap-2 w-full border-purple-500/30 hover:bg-purple-500/10" data-testid="button-ai-assistant">
                <Code2 className="w-4 h-4" />
                Open Assistant <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Scans Section */}
        <div className="animate-slideInUp">
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Recent Activity</h2>
            <p className="text-muted-foreground">Your latest vulnerability scans and findings</p>
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              {scansLoading ? (
                <div className="text-center py-12">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-white/10 rounded w-3/4 mx-auto"></div>
                    <div className="h-4 bg-white/10 rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              ) : recentScans.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">No scans yet</p>
                  <p className="text-muted-foreground mb-6">Start your first security scan to analyze your code</p>
                  <Link href="/scanner">
                    <Button size="lg" data-testid="button-first-scan">Start Your First Scan</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentScans.map((scan: any) => (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300 group"
                      data-testid={`scan-item-${scan.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                            <Code2 className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{getScanDisplayName(scan)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(scan.createdAt).toLocaleDateString()} at {new Date(scan.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-12">
                          <Badge variant="outline" className="bg-white/5">{scan.language}</Badge>
                          <Badge 
                            variant={scan.status === "completed" ? "outline" : "outline"}
                            className={scan.status === "completed" ? "bg-success/20 text-success border-success/30" : "bg-warning/20 text-warning border-warning/30"}
                          >
                            {scan.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {scan.vulnerabilities?.length > 0 && (
                          <div className="text-right p-3 rounded-lg bg-white/5">
                            <div className="text-lg font-bold text-destructive">
                              {scan.vulnerabilities.length}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {scan.vulnerabilities.filter((v: any) => v.severity === "high").length} high
                            </div>
                          </div>
                        )}
                        <Link href={`/scanner?scan=${scan.id}`}>
                          <Button variant="outline" size="sm" className="gap-1" data-testid={`button-view-scan-${scan.id}`}>
                            View <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
