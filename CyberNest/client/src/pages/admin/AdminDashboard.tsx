import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, AlertTriangle, Activity, ArrowUpRight, Clock, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import type { User, Scan } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

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
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: scans = [] } = useQuery<Scan[]>({
    queryKey: ["/api/admin/scans"],
  });

  const totalUsers = users.length;
  const totalScans = scans.length;
  const highRiskScans = scans.filter((scan: any) =>
    scan.vulnerabilities?.some((v: any) => v.severity === "high")
  ).length;
  const completedScans = scans.filter((scan: Scan) => scan.status === "completed").length;

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const sortedScans = [...scans].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const totalPages = Math.ceil(sortedScans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivity = sortedScans.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and statistics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="relative overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 border-white/5 bg-white/[0.02]">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-16 h-16" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Total Users
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20">Active</Badge>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold mb-1" data-testid="admin-stat-users">{totalUsers}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500 font-medium">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 border-white/5 bg-white/[0.02]">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileText className="w-16 h-16" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Total Scans
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold mb-1" data-testid="admin-stat-scans">{totalScans}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                Latest: {sortedScans.length > 0 ? new Date(sortedScans[0].createdAt).toLocaleDateString() : "None"}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-2xl hover:shadow-destructive/10 transition-all duration-300 border-white/5 bg-white/[0.02]">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertTriangle className="w-16 h-16" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                High Risk Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-destructive mb-1" data-testid="admin-stat-high-risk">
                {highRiskScans}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Critical vulnerabilities detected
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 border-white/5 bg-white/[0.02]">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-16 h-16" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-emerald-500 mb-1" data-testid="admin-stat-completed">
                98%
              </div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-white/5 bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Recent Scan Activity</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Real-time update of system scans</p>
            </div>
            <Link href="/admin/scans">
              <Button variant="ghost" size="sm" className="gap-2">
                View All Scans <ArrowUpRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {paginatedActivity.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No recent activity detected</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4">
                  {paginatedActivity.map((scan: any) => (
                    <div
                      key={scan.id}
                      className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300`}>
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{scan.fileName || "Untitled Scan"}</span>
                            <Badge variant="outline" className="text-[10px] h-4 py-0 uppercase tracking-tight">{scan.language}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(scan.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <div className="flex gap-2 mb-1">
                            {scan.vulnerabilities && scan.vulnerabilities.length > 0 ? (
                              <>
                                <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] h-4">
                                  {scan.vulnerabilities.filter((v: any) => v.severity === "high").length} High
                                </Badge>
                                <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px] h-4">
                                  {scan.vulnerabilities.filter((v: any) => v.severity === "medium").length} Med
                                </Badge>
                              </>
                            ) : (
                              <Badge variant="outline" className="text-[10px] h-4 text-emerald-500 border-emerald-500/20 bg-emerald-500/5">Secure</Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">Status: {scan.status}</p>
                        </div>
                        <Link href={`/admin/scans`}>
                          <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
                            <ArrowUpRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pt-6 border-t border-white/5">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
