import { useGetMe, useListEnrollments, useListNotifications } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Bell, ArrowRight, Clock } from "lucide-react";
import { format } from "date-fns";

export function StudentDashboard() {
  const { data: user } = useGetMe();
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useListEnrollments({ studentId: user?.id, limit: 5 });
  const { data: notifications, isLoading: notificationsLoading } = useListNotifications();

  const activeEnrollments = enrollmentsData?.enrollments.filter(e => e.status === "active") || [];
  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.firstName}</h1>
        <p className="text-muted-foreground mt-1">Here is your academic overview for the current semester.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEnrollments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Enrolled in current term
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeEnrollments.reduce((sum, e) => sum + (e.course?.credits || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered credit hours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unread Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending notifications
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Current Schedule</CardTitle>
            <CardDescription>Your active class enrollments</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollmentsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            ) : activeEnrollments.length > 0 ? (
              <div className="space-y-4">
                {activeEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium text-primary hover:underline">
                        <Link href={`/courses/${enrollment.courseId}`}>{enrollment.course?.code} - {enrollment.course?.name}</Link>
                      </div>
                      <div className="text-sm flex items-center text-muted-foreground mt-1">
                        <Clock className="mr-1 h-3 w-3" />
                        {enrollment.course?.schedule || "TBA"} • {enrollment.course?.classroom || "TBA"}
                      </div>
                    </div>
                    <div className="text-sm font-medium bg-secondary/20 text-secondary-foreground px-2 py-1 rounded">
                      {enrollment.course?.credits} CR
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="mx-auto h-8 w-8 mb-3 opacity-20" />
                <p>You are not enrolled in any courses.</p>
                <Link href="/courses">
                  <Button variant="outline" className="mt-4">Browse Catalog</Button>
                </Link>
              </div>
            )}
            <div className="mt-6">
              <Link href="/enrollments">
                <Button variant="ghost" className="w-full flex items-center justify-between text-primary">
                  View full schedule <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Updates on your academic status</CardDescription>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            ) : notifications && notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className={`flex items-start gap-3 p-3 rounded-md ${notification.isRead ? 'bg-transparent' : 'bg-muted/50'}`}>
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${notification.isRead ? 'bg-transparent' : 'bg-primary'}`} />
                    <div>
                      <p className={`text-sm ${notification.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="mx-auto h-8 w-8 mb-3 opacity-20" />
                <p>No new notifications</p>
              </div>
            )}
            <div className="mt-6">
              <Link href="/notifications">
                <Button variant="ghost" className="w-full flex items-center justify-between text-primary">
                  View all notifications <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
