import { useListWaitlist, useLeaveWaitlist, getListWaitlistQueryKey, getGetCourseQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { List, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function StudentWaitlist() {
  const { data: waitlistData, isLoading } = useListWaitlist();
  const leaveWaitlist = useLeaveWaitlist();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLeave = (id: number, courseId?: number) => {
    leaveWaitlist.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Removed from waitlist" });
          queryClient.invalidateQueries({ queryKey: getListWaitlistQueryKey() });
          if (courseId) {
            queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) });
          }
        },
        onError: (error: any) => {
          toast({ title: "Failed to leave waitlist", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
    return <div className="space-y-4 animate-pulse max-w-4xl mx-auto">
      <div className="h-8 w-48 bg-muted rounded"></div>
      <div className="h-32 bg-muted rounded"></div>
    </div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Waitlist</h1>
        <p className="text-muted-foreground mt-1">Courses you are currently waiting to enroll in.</p>
      </div>

      <div className="space-y-4">
        {waitlistData && waitlistData.length > 0 ? (
          <div className="grid gap-4">
            {waitlistData.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
                        Position: {entry.position}
                      </Badge>
                      <h3 className="font-semibold text-lg hover:underline text-primary">
                        <Link href={`/courses/${entry.course?.id}`}>
                          {entry.course?.code}: {entry.course?.name}
                        </Link>
                      </h3>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Clock className="w-4 h-4 mr-1" /> {entry.course?.schedule || "TBA"}
                    </div>
                    <div className="text-xs text-muted-foreground pt-1">
                      Joined on {format(new Date(entry.joinedAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button 
                      variant="outline" 
                      onClick={() => handleLeave(entry.id, entry.courseId)}
                      disabled={leaveWaitlist.isPending}
                    >
                      Leave Waitlist
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg border border-dashed">
            <List className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-3" />
            <p className="text-muted-foreground">You are not on any waitlists.</p>
            <Link href="/courses">
              <Button variant="outline" className="mt-4">Browse Catalog</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
