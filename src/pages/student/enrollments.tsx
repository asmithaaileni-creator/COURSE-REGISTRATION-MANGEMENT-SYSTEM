import { useListEnrollments, useDropEnrollment, getListEnrollmentsQueryKey, getGetCourseQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, Clock, MapPin, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function StudentEnrollments() {
  const { data: enrollmentsData, isLoading } = useListEnrollments();
  const dropEnrollment = useDropEnrollment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDrop = (id: number, courseId?: number) => {
    if (!confirm("Are you sure you want to drop this course?")) return;
    
    dropEnrollment.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Course dropped successfully" });
          queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey() });
          if (courseId) {
            queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) });
          }
        },
        onError: (error: any) => {
          toast({ title: "Failed to drop course", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  const activeEnrollments = enrollmentsData?.enrollments.filter(e => e.status === "active") || [];
  const droppedEnrollments = enrollmentsData?.enrollments.filter(e => e.status === "dropped") || [];

  if (isLoading) {
    return <div className="space-y-4 animate-pulse max-w-4xl mx-auto">
      <div className="h-8 w-48 bg-muted rounded"></div>
      <div className="h-32 bg-muted rounded"></div>
      <div className="h-32 bg-muted rounded"></div>
    </div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Enrollments</h1>
        <p className="text-muted-foreground mt-1">Manage your active and dropped courses.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Active Courses ({activeEnrollments.length})</h2>
        {activeEnrollments.length > 0 ? (
          <div className="grid gap-4">
            {activeEnrollments.map((enrollment) => (
              <Card key={enrollment.id}>
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-secondary/10 text-secondary font-semibold">
                        {enrollment.course?.department}
                      </Badge>
                      <h3 className="font-semibold text-lg hover:underline text-primary">
                        <Link href={`/courses/${enrollment.course?.id}`}>
                          {enrollment.course?.code}: {enrollment.course?.name}
                        </Link>
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" /> {enrollment.course?.schedule || "TBA"}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" /> {enrollment.course?.classroom || "TBA"}
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-1" /> {enrollment.course?.credits} Credits
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground pt-1">
                      Enrolled on {format(new Date(enrollment.enrolledAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button 
                      variant="destructive" 
                      onClick={() => handleDrop(enrollment.id, enrollment.courseId)}
                      disabled={dropEnrollment.isPending}
                    >
                      Drop Course
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg border border-dashed">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-3" />
            <p className="text-muted-foreground">You don't have any active enrollments.</p>
            <Link href="/courses">
              <Button variant="outline" className="mt-4">Browse Catalog</Button>
            </Link>
          </div>
        )}
      </div>

      {droppedEnrollments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2 text-muted-foreground">Dropped Courses</h2>
          <div className="grid gap-4">
            {droppedEnrollments.map((enrollment) => (
              <Card key={enrollment.id} className="opacity-70 bg-muted/30">
                <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium">
                      {enrollment.course?.code}: {enrollment.course?.name}
                    </h3>
                    <div className="text-xs text-muted-foreground">
                      Dropped • Originally enrolled on {format(new Date(enrollment.enrolledAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div>
                    <Badge variant="secondary">Dropped</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
