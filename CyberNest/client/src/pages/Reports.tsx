import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Report } from "@shared/schema";
import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
 
export default function Reports() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const totalPages = Math.ceil(reports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReports = reports.slice(startIndex, startIndex + itemsPerPage);
 
  const handleDownload = async (reportId: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${baseUrl}/api/reports/${reportId}/download`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
 
      const responseText = await response.text();
      
      if (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html")) {
        throw new Error("Backend route not found or server error. Please restart the server.");
      }
      
      const data = JSON.parse(responseText);
      
      if (!response.ok) {
         throw new Error(data.message || "Failed to download report.");
      }
 
      // Decode Base64 to Binary PDF
      const byteCharacters = atob(data.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
 
      // Trigger Download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', data.filename);
      document.body.appendChild(link);
      link.click();
     
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
     
      toast({
        title: "Success",
        description: "Report downloaded successfully!",
      });
    } catch (error: any) {
      console.error("Download Error:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Could not download the PDF.",
        variant: "destructive",
      });
    }
  };
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Reports</h1>
          <p className="text-muted-foreground">
            View and download your security scan reports
          </p>
        </div>
 
        <Card>
          <CardHeader>
            <CardTitle>Generated Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No reports generated yet</p>
                <p className="text-sm text-muted-foreground">
                  Complete a scan and generate a report to see them here
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {paginatedReports.map((report: any) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate transition-all"
                      data-testid={`report-item-${report.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <FileText className="w-5 h-5 text-primary" />
                          <p className="font-medium">
                            Scan Report - {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                          {report.summary?.totalVulnerabilities > 0 && (
                            <Badge variant="destructive">
                              {report.summary.totalVulnerabilities} issues
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Generated at {new Date(report.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(report.id || report._id)}
                        className="gap-2"
                        data-testid={`button-download-${report.id}`}
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </Button>
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
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, reports.length)} of {reports.length} reports
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