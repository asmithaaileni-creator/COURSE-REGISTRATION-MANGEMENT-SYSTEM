import { useState } from "react";
import { useListEnrollments, useSubmitFeedback, getListFeedbackQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, MessageSquare } from "lucide-react";

export function StudentFeedback() {
  const { data: enrollmentsData, isLoading } = useListEnrollments();
  const submitFeedback = useSubmitFeedback();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [courseId, setCourseId] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      toast({ title: "Please select a course", variant: "destructive" });
      return;
    }
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }

    submitFeedback.mutate(
      { data: { courseId: parseInt(courseId), rating, comment } },
      {
        onSuccess: () => {
          toast({ title: "Feedback submitted successfully" });
          queryClient.invalidateQueries({ queryKey: getListFeedbackQueryKey() });
          setCourseId("");
          setRating(0);
          setComment("");
        },
        onError: (error: any) => {
          toast({ title: "Failed to submit feedback", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  const courses = enrollmentsData?.enrollments?.map(e => e.course).filter(Boolean) || [];
  // deduplicate
  const uniqueCourses = Array.from(new Map(courses.map(c => [c!.id, c])).values());

  if (isLoading) {
    return <div className="space-y-4 animate-pulse max-w-2xl mx-auto">
      <div className="h-8 w-48 bg-muted rounded"></div>
      <div className="h-64 bg-muted rounded"></div>
    </div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Course Feedback</h1>
        <p className="text-muted-foreground mt-1">Share your experience to help improve our courses.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
          <CardDescription>Your feedback is anonymous to instructors but recorded in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {uniqueCourses.length > 0 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Select Course</Label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course you've taken" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCourses.map(course => (
                      <SelectItem key={course!.id} value={course!.id.toString()}>
                        {course!.code} - {course!.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Overall Rating</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-md hover:bg-muted transition-colors ${rating >= star ? 'text-yellow-500' : 'text-muted-foreground'}`}
                    >
                      <Star className="w-8 h-8" fill={rating >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Comments (Optional)</Label>
                <Textarea 
                  placeholder="What did you like? What could be improved?" 
                  rows={5}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitFeedback.isPending}>
                {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="mx-auto h-12 w-12 mb-3 opacity-20" />
              <p>You need to enroll in a course before you can submit feedback.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
