import { useListFeedback } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export function AdminFeedback() {
  const { data: feedbackList, isLoading } = useListFeedback();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Course Feedback</h1>
        <p className="text-muted-foreground mt-1">Review student ratings and comments across all courses.</p>
      </div>

      <div className="bg-card rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Date</TableHead>
              <TableHead className="w-[200px]">Course</TableHead>
              <TableHead className="w-[200px]">Student</TableHead>
              <TableHead className="w-[100px]">Rating</TableHead>
              <TableHead>Comment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Loading feedback...</TableCell>
              </TableRow>
            ) : feedbackList && feedbackList.length > 0 ? (
              feedbackList.map((feedback) => (
                <TableRow key={feedback.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(feedback.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{feedback.course?.code}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1" title={feedback.course?.name}>
                      {feedback.course?.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">
                      {feedback.student?.firstName} {feedback.student?.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {feedback.student?.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex text-yellow-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-3 h-3 ${star <= feedback.rating ? 'fill-current' : 'text-muted-foreground/30'}`} 
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {feedback.comment ? (
                      <span className="italic">"{feedback.comment}"</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                    <p>No feedback submissions found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
