import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// 🔥 FIX: Rename the Scan icon to ScanIcon to avoid collision with the 'Scan' type
import { History as HistoryIcon, Search, Scan as ScanIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useState } from "react";
import type { Scan } from "@shared/schema";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useEffect } from "react";

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

 
export default function History() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
 
  const { data: scans = [], isLoading } = useQuery<Scan[]>({
    queryKey: ["/api/user/scans"],
  });
 
  const filteredScans = scans.filter((scan: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      scan.fileName?.toLowerCase().includes(searchLower) ||
      scan.language?.toLowerCase().includes(searchLower) ||
      new Date(scan.createdAt).toLocaleDateString().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredScans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedScans = filteredScans.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
 
  // 🔥 FIX: Ensure return types match the allowed Badge variants
  const getSeverityColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case "completed": return "default"; // "success" is not a standard shadcn variant
      case "pending": return "outline";
      case "failed": return "destructive";
      default: return "secondary";
    }
  };
 
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Scan History</h1>
          <p className="text-muted-foreground">
            View and search through your past security scans
          </p>
        </div>
 
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by filename, language, or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-history"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading history...</div>
            ) : filteredScans.length === 0 ? (
              <div className="text-center py-12">
                <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "No scans found matching your search" : "No scan history yet"}
                </p>
                {!searchTerm && (
                  <Link href="/scanner">
                    <Button data-testid="button-start-first-scan">Start Your First Scan</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  {paginatedScans.map((scan: any) => (
                    <div
                      key={scan.id || scan._id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate transition-all"
                      data-testid={`history-item-${scan.id || scan._id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-medium">{getScanDisplayName(scan)}</p>
                          <Badge variant="outline">{scan.language}</Badge>
                          <Badge variant={getSeverityColor(scan.status)}>
                            {scan.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                          <span>{new Date(scan.createdAt).toLocaleTimeString()}</span>
                          {scan.vulnerabilities?.length > 0 && (
                            <span className="text-destructive font-medium">
                              {scan.vulnerabilities.length} vulnerabilities detected
                            </span>
                          )}
                        </div>
                      </div>
                     
                      <Link href={`/scanner?scan=${scan.id || scan._id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 border border-white/10 hover:bg-purple-500/20 hover:text-white"
                        >
                          <ScanIcon className="w-4 h-4" />
                          Reopen Scan
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pt-4 border-t border-border/50">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                    <p className="text-center text-xs text-muted-foreground mt-2">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredScans.length)} of {filteredScans.length} scans
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}