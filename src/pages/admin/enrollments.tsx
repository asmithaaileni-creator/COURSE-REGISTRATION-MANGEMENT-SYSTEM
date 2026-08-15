import { useState } from "react";
import { useListEnrollments, useDropEnrollment, getListEnrollmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminEnrollments() {
  const { data: enrollmentsData, isLoading } = useListEnrollments({ limit: 500 });
  const dropEnrollment = useDropEnrollment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDrop = (id: number) => {
    if (!confirm("Are you sure you want to drop this enrollment?")) return;
    
    dropEnrollment.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Enrollment removed successfully" });
          queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey() });
        },
        onError: (error: any) => {
          toast({ title: "Failed to remove enrollment", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  const enrollments = enrollmentsData?.enrollments || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Enrollments</h1>
          <p className="text-muted-foreground mt-1">Manage system-wide course enrollments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href="/api/export/enrollments" target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </a>
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Loading enrollments...</TableCell>
              </TableRow>
            ) : enrollments.length > 0 ? (
              enrollments.map((enrollment) => (
                <TableRow key={enrollment.id} className={enrollment.status === 'dropped' ? 'opacity-60' : ''}>
                  <TableCell>
                    <div className="font-medium">
                      <Link href={`/admin/students/${enrollment.studentId}`} className="hover:underline">
                        {enrollment.student?.firstName} {enrollment.student?.lastName}
                      </Link>
                    </div>
                    <div className="text-xs text-muted-foreground">{enrollment.student?.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{enrollment.course?.code}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1 max-w-[250px]">{enrollment.course?.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                      {enrollment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(enrollment.enrolledAt), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell className="text-right">
                    {enrollment.status === 'active' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDrop(enrollment.id)}
                        disabled={dropEnrollment.isPending}
                        title="Remove enrollment"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No enrollments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
