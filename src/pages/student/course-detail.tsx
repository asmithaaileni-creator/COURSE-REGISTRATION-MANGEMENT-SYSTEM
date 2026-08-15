import { useGetCourse, useCreateEnrollment, useJoinWaitlist, useListEnrollments, useListWaitlist, useListCourses, getGetCourseQueryKey, getListEnrollmentsQueryKey, getListWaitlistQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Clock, MapPin, BookOpen, AlertCircle, CheckCircle2, List, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

function friendlyError(error: any): string {
  return error?.data?.error ?? error?.data?.message ?? error?.message ?? "Something went wrong";
}

export function CourseDetail({ params }: { params: { id: string } }) {
  const courseId = parseInt(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useGetCourse(courseId, { 
    query: { enabled: !!courseId, queryKey: getGetCourseQueryKey(courseId) } 
  });

  // Fetch all courses so we can resolve prerequisite names
  const { data: allCoursesData } = useListCourses({});
  const courseNameMap: Record<number, string> = {};
  for (const c of allCoursesData?.courses ?? []) {
    courseNameMap[c.id] = `${c.code}: ${c.name}`;
  }
  
  const { data: enrollmentsData } = useListEnrollments({});
  const { data: waitlistData } = useListWaitlist();

  const createEnrollment = useCreateEnrollment();
  const joinWaitlist = useJoinWaitlist();

  const activeEnrollment = enrollmentsData?.enrollments?.find(
    e => e.courseId === courseId && e.status === 'active'
  );
  const isEnrolled = !!activeEnrollment;
  const waitlistEntry = waitlistData?.find(w => w.courseId === courseId);
  const isWaitlisted = !!waitlistEntry;

  // Which prerequisites has the student already completed?
  const completedCourseIds = new Set(
    (enrollmentsData?.enrollments ?? [])
      .filter(e => e.status === 'active')
      .map(e => e.courseId)
  );
  const missingPrereqs = (course?.prerequisites ?? []).filter(
    (id: number) => !completedCourseIds.has(id)
  );
  const hasUnmetPrereqs = missingPrereqs.length > 0;

  const handleEnroll = () => {
    createEnrollment.mutate(
      { data: { courseId } },
      {
        onSuccess: () => {
          toast({ title: "Successfully enrolled in course!" });
          queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) });
        },
        onError: (error: any) => {
          toast({ title: "Enrollment failed", description: friendlyError(error), variant: "destructive" });
        }
      }
    );
  };

  const handleWaitlist = () => {
    joinWaitlist.mutate(
      { data: { courseId } },
      {
        onSuccess: () => {
          toast({ title: "Joined waitlist successfully" });
          queryClient.invalidateQueries({ queryKey: getListWaitlistQueryKey() });
        },
        onError: (error: any) => {
          toast({ title: "Failed to join waitlist", description: friendlyError(error), variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
    return <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-10 bg-muted rounded w-1/3"></div>
      <div className="h-64 bg-muted rounded"></div>
    </div>;
  }

  if (!course) {
    return <div className="text-center py-12">Course not found.</div>;
  }

  const isFull = course.availableSeats <= 0;
  const fillPercentage = (course.enrolledCount / course.maxSeats) * 100;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <Badge variant="outline" className="bg-secondary/10 text-secondary font-semibold mb-2">
            {course.department}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {course.code}: {course.name}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {course.description || "No description provided."}
              </p>
              
              {course.prerequisites && course.prerequisites.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium flex items-center mb-2">
                    <BookOpen className="w-4 h-4 mr-2" /> Prerequisites
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {(course.prerequisites as number[]).map((id: number) => (
                      <Badge
                        key={id}
                        variant={completedCourseIds.has(id) ? "default" : "secondary"}
                        className={completedCourseIds.has(id) ? "bg-green-100 text-green-800 border-green-200" : ""}
                      >
                        {completedCourseIds.has(id) ? "✓ " : ""}
                        {courseNameMap[id] ?? `Course #${id}`}
                      </Badge>
                    ))}
                  </div>
                  {hasUnmetPrereqs && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You must complete the prerequisites above before enrolling. Start with courses that have no prerequisites.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 mr-3 text-muted-foreground" />
                <span><span className="text-muted-foreground mr-1">Instructor:</span> {course.instructorName}</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-3 text-muted-foreground" />
                <span><span className="text-muted-foreground mr-1">Schedule:</span> {course.schedule || "TBA"}</span>
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="w-4 h-4 mr-3 text-muted-foreground" />
                <span><span className="text-muted-foreground mr-1">Location:</span> {course.classroom || "TBA"}</span>
              </div>
              <div className="flex items-center text-sm">
                <BookOpen className="w-4 h-4 mr-3 text-muted-foreground" />
                <span><span className="text-muted-foreground mr-1">Credits:</span> {course.credits}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enrollment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Capacity</span>
                  <span className="font-medium">{course.enrolledCount} / {course.maxSeats}</span>
                </div>
                <Progress value={fillPercentage} className={`h-2 ${isFull ? '[&>div]:bg-destructive' : fillPercentage > 80 ? '[&>div]:bg-secondary' : ''}`} />
                <p className={`text-xs mt-2 font-medium ${isFull ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {course.availableSeats} seats available
                </p>
              </div>

              {isEnrolled ? (
                <div className="bg-primary/10 text-primary p-3 rounded-md flex items-center text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Currently enrolled
                </div>
              ) : isWaitlisted ? (
                <div className="bg-secondary/10 text-secondary p-3 rounded-md flex items-center text-sm font-medium">
                  <List className="w-4 h-4 mr-2" />
                  On waitlist (Position: {waitlistEntry.position})
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {!isEnrolled && !isWaitlisted && (
                isFull ? (
                  <Button 
                    className="w-full" 
                    variant="secondary"
                    onClick={handleWaitlist}
                    disabled={joinWaitlist.isPending}
                  >
                    {joinWaitlist.isPending ? "Joining..." : "Join Waitlist"}
                  </Button>
                ) : hasUnmetPrereqs ? (
                  <div className="w-full space-y-2">
                    <Button className="w-full" disabled>
                      <Lock className="w-4 h-4 mr-2" />
                      Prerequisites Not Met
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Complete the required courses first
                    </p>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={handleEnroll}
                    disabled={createEnrollment.isPending}
                  >
                    {createEnrollment.isPending ? "Enrolling..." : "Enroll Now"}
                  </Button>
                )
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
