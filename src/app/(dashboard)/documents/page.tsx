"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, FileText, CheckCircle2, Loader2, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { workersApi } from "@/lib/api";
import { toast } from "sonner";

const DOC_TYPE_LABELS: Record<string, string> = {
  aadhaar: "Aadhaar Card",
  pan: "PAN Card",
  bank_passbook: "Bank Passbook",
  photo: "Passport Photo",
  medical_certificate: "Medical Certificate",
  training_certificate: "Training Certificate",
  police_verification: "Police Verification",
  offer_letter: "Offer Letter",
  appointment_letter: "Appointment Letter",
  exit_form: "Exit Form",
};

interface Document {
  id: string;
  worker_id: string;
  employee_code: string;
  worker_name: string;
  document_type: string;
  document_number: string;
  file_url: string;
  file_name: string;
  expiry_date: string | null;
  is_verified: boolean;
  uploaded_at: string;
}

interface DocumentsResponse {
  data: Document[];
  total: number;
  page: number;
  page_size: number;
}

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [docType, setDocType] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [response, setResponse] = useState<DocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, page_size: 20 };
      if (search) params.search = search;
      if (docType !== "all") params.document_type = docType;
      if (verifiedFilter !== "all") params.is_verified = verifiedFilter === "verified";
      const res = await workersApi.allDocuments(params);
      setResponse(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load documents";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [search, docType, verifiedFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments();
    }, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchDocuments, search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, docType, verifiedFilter]);

  async function handleVerify(docId: string) {
    setVerifyingId(docId);
    try {
      await workersApi.verifyDocument(docId);
      toast.success("Document verified successfully");
      fetchDocuments();
    } catch {
      toast.error("Failed to verify document");
    } finally {
      setVerifyingId(null);
    }
  }

  const docs = response?.data ?? [];
  const totalPages = response ? Math.ceil(response.total / response.page_size) : 0;

  if (error && !response) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Failed to load documents</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={fetchDocuments} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by worker name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        {loading ? (
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-muted-foreground">Loading documents...</span>
            </div>
          </CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 border-b">
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Worker</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden sm:table-cell">Code</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Document Type</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden md:table-cell">Number</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground">Verified</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground hidden lg:table-cell">Uploaded</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {docs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-secondary/20">
                      <td className="px-4 py-2.5 font-medium">{doc.worker_name}</td>
                      <td className="px-4 py-2.5 hidden sm:table-cell font-mono text-xs">{doc.employee_code}</td>
                      <td className="px-4 py-2.5">{DOC_TYPE_LABELS[doc.document_type] || doc.document_type}</td>
                      <td className="px-4 py-2.5 hidden md:table-cell font-mono text-xs">{doc.document_number || "-"}</td>
                      <td className="px-4 py-2.5 text-center">
                        {doc.is_verified ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5 hidden lg:table-cell text-muted-foreground">
                        {formatDate(doc.uploaded_at)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {!doc.is_verified && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-7 text-xs text-green-600 hover:text-green-700"
                            onClick={() => handleVerify(doc.id)}
                            disabled={verifyingId === doc.id}
                          >
                            {verifyingId === doc.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Verify
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {docs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-30" />
                        <p className="font-medium text-muted-foreground">No documents found</p>
                        <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing page {page} of {totalPages} ({response?.total} total)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
