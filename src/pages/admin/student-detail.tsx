import { useGetStudent, useListEnrollments, useDropEnrollment, getListEnrollmentsQueryKey, getGetStudentQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Mail, Calendar, Hash, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminStudentDetail({ params }: { params: { id: string } }) {
  const studentId = parseInt(params.id);
  const { data: student, isLoading: studentLoading } = useGetStudent(studentId, {
    query: { enabled: !!studentId, queryKey: getGetStudentQueryKey(studentId) }
  });
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useListEnrollments({ studentId, limit: 100 });
  const dropEnrollment = useDropEnrollment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDrop = (id: number) => {
    if (!confirm("Remove student from this course?")) return;
    
    dropEnrollment.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Enrollment removed" });
          queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStudentQueryKey(studentId) });
        },
        onError: (error: any) => {
          toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  if (studentLoading || !student) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const activeEnrollments = enrollmentsData?.enrollments.filter(e => e.status === "active") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/students">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{student.firstName} {student.lastName}</h1>
          <p className="text-muted-foreground mt-1">Student Profile</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Student ID / Username</p>
                <p className="font-medium">{student.id} / {student.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Email</p>
                <p className="font-medium">{student.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Registered On</p>
                <p className="font-medium">{format(new Date(student.createdAt), 'MMMM d, yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Active Enrollments ({activeEnrollments.length})</CardTitle>
            <CardDescription>Courses the student is currently taking</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollmentsLoading ? (
              <div className="text-center py-4">Loading enrollments...</div>
            ) : activeEnrollments.length > 0 ? (
              <div className="space-y-4">
                {activeEnrollments.map(enrollment => (
                  <div key={enrollment.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">
                        {enrollment.course?.code}: {enrollment.course?.name}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <Badge variant="outline">{enrollment.course?.credits} Credits</Badge>
                        <span>Enrolled {format(new Date(enrollment.enrolledAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDrop(enrollment.id)}
                      disabled={dropEnrollment.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No active enrollments found for this student.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
