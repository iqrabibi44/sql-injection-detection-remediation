import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, RefreshCw, User as UserIcon, Search, Eye, Filter, Shield, AlertCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { Scan } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function Scans() {
  const [, setLocation] = useLocation();
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScan, setSelectedScan] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  const queryClient = useQueryClient();
  const { data: scans = [], isLoading, isFetching } = useQuery<Scan[]>({
    queryKey: ["/api/admin/scans"],
    staleTime: 0,
    refetchOnMount: true,
  });

  const filteredScans = scans.filter((scan: any) => {
    // Search filter
    const matchesSearch = 
      (scan.fileName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (scan.userId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (scan.language?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    // Severity filter
    if (severityFilter === "all") return true;
    return scan.vulnerabilities?.some((v: any) => v.severity === severityFilter);
  });

  const totalPages = Math.ceil(filteredScans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedScans = filteredScans.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [severityFilter]);

  const getSeverityColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case "completed": return "secondary";
      case "pending": return "secondary";
      case "failed": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Scan Management</h1>
          <p className="text-muted-foreground">
            View and manage all security scans in the system
          </p>
        </div>

        <Card className="border-white/5 bg-white/[0.02] backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search scans, users, or languages..." 
                    className="pl-9 bg-white/5 border-white/10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[180px] bg-white/5 border-white/10" data-testid="select-severity-filter">
                    <Filter className="w-4 h-4 mr-2 opacity-50" />
                    <SelectValue placeholder="All Severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="high">High Severity</SelectItem>
                    <SelectItem value="medium">Medium Severity</SelectItem>
                    <SelectItem value="low">Low Severity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/scans"] })}
                  disabled={isFetching}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-all disabled:opacity-50 active:scale-95"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-primary" : ""}`} />
                  {isFetching ? "Syncing..." : "Sync Data"}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading scans...</div>
            ) : filteredScans.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {severityFilter !== "all" ? "No scans found with selected severity" : "No scans yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4">
                  {paginatedScans.map((scan: any) => (
                    <div
                      key={scan.id}
                      className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-300"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                              {scan.fileName && scan.fileName !== "Untitled Scan" ? scan.fileName : "Untitled Security Scan"}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <Badge variant="outline" className="bg-primary/5 border-primary/10 text-primary capitalize">{scan.language}</Badge>
                              <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {scan.userId}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(scan.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mt-4 md:mt-0">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            {scan.vulnerabilities && scan.vulnerabilities.length > 0 ? (
                              <>
                                <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-bold">
                                  {scan.vulnerabilities.filter((v: any) => v.severity === "high").length} HIGH
                                </Badge>
                                <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-bold">
                                  {scan.vulnerabilities.filter((v: any) => v.severity === "medium").length} MED
                                </Badge>
                              </>
                            ) : (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold">CLEAN</Badge>
                            )}
                          </div>
                          <Badge variant={getSeverityColor(scan.status)} className="text-[10px] uppercase tracking-widest px-2 h-5">
                            {scan.status}
                          </Badge>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-xl bg-white/5 border-white/10 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all active:scale-95"
                              onClick={() => setSelectedScan(scan)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-white/10">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 text-2xl">
                                <Shield className="w-6 h-6 text-primary" />
                                Scan Report Details
                              </DialogTitle>
                            </DialogHeader>
                            {selectedScan && (
                              <div className="space-y-6 py-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                  <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Filename</p>
                                    <p className="text-sm font-medium truncate">{selectedScan.fileName || "Untitled"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Language</p>
                                    <p className="text-sm font-medium uppercase">{selectedScan.language}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">User ID</p>
                                    <p className="text-sm font-medium truncate">{selectedScan.userId}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Date</p>
                                    <p className="text-sm font-medium">{new Date(selectedScan.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-primary" />
                                    Vulnerability List ({selectedScan.vulnerabilities?.length || 0})
                                  </h4>
                                  <div className="space-y-3">
                                    {selectedScan.vulnerabilities?.length > 0 ? (
                                      selectedScan.vulnerabilities.map((v: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/5 flex items-start gap-4">
                                          <Badge variant={v.severity === "high" ? "destructive" : "outline"} className="mt-1 uppercase text-[10px]">
                                            {v.severity}
                                          </Badge>
                                          <div className="flex-1">
                                            <p className="font-bold text-sm mb-1">{v.type}</p>
                                            <p className="text-xs text-muted-foreground mb-2">{v.description}</p>
                                            {v.line && (
                                              <div className="p-2 rounded bg-black/40 font-mono text-[10px] border border-white/5">
                                                Line {v.line}: {v.snippet}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-center py-8 rounded-xl border border-dashed border-white/10 bg-white/5">
                                        <p className="text-muted-foreground text-sm">No vulnerabilities found in this scan.</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pt-8 border-t border-white/5">
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
                              className="cursor-pointer rounded-lg"
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
                    <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-widest font-medium opacity-50">
                      Record {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredScans.length)} of {filteredScans.length}
                    </p>
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
