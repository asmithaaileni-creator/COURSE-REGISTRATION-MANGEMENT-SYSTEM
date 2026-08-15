import { useListNotifications, useMarkNotificationRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Info, GraduationCap, AlertCircle, List } from "lucide-react";
import { format } from "date-fns";

export function StudentNotifications() {
  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const queryClient = useQueryClient();

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    });
  };

  const handleMarkAllRead = () => {
    if (!notifications) return;
    const unread = notifications.filter(n => !n.isRead);
    unread.forEach(n => {
      markRead.mutate({ id: n.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        }
      });
    });
  };

  if (isLoading) {
    return <div className="space-y-4 animate-pulse max-w-3xl mx-auto">
      <div className="h-8 w-48 bg-muted rounded"></div>
      <div className="h-24 bg-muted rounded"></div>
      <div className="h-24 bg-muted rounded"></div>
    </div>;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'enrollment': return <GraduationCap className="w-5 h-5 text-green-500" />;
      case 'dropped': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'waitlist': return <List className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Updates on your academic status and enrollments.</p>
        </div>
        {notifications?.some(n => !n.isRead) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <Card key={notification.id} className={notification.isRead ? 'opacity-70 bg-muted/20' : 'bg-card border-primary/20 shadow-sm'}>
              <CardContent className="p-4 flex gap-4">
                <div className="mt-1 shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${notification.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleMarkRead(notification.id)}
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-card rounded-lg border border-dashed">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-3" />
            <p className="text-muted-foreground">You have no notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
