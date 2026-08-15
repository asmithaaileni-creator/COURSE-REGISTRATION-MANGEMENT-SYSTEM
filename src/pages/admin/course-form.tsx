import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCreateCourse, useUpdateCourse, useGetCourse, getListCoursesQueryKey, getGetCourseQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const courseSchema = z.object({
  code: z.string().min(1, "Course code is required"),
  name: z.string().min(1, "Course name is required"),
  department: z.string().min(1, "Department is required"),
  credits: z.coerce.number().min(1, "Must be at least 1 credit").max(10, "Max 10 credits"),
  instructorName: z.string().min(1, "Instructor name is required"),
  maxSeats: z.coerce.number().min(1, "Must have at least 1 seat"),
  schedule: z.string().optional(),
  classroom: z.string().optional(),
  description: z.string().optional(),
});

export function AdminCourseForm({ params }: { params?: { id: string } }) {
  const isEdit = !!params?.id;
  const courseId = isEdit ? parseInt(params.id) : undefined;
  
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();

  const { data: course, isLoading } = useGetCourse(courseId!, {
    query: { enabled: isEdit, queryKey: getGetCourseQueryKey(courseId!) }
  });

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      code: "",
      name: "",
      department: "",
      credits: 3,
      instructorName: "",
      maxSeats: 30,
      schedule: "",
      classroom: "",
      description: "",
    },
  });

  useEffect(() => {
    if (course && isEdit) {
      form.reset({
        code: course.code,
        name: course.name,
        department: course.department,
        credits: course.credits,
        instructorName: course.instructorName,
        maxSeats: course.maxSeats,
        schedule: course.schedule || "",
        classroom: course.classroom || "",
        description: course.description || "",
      });
    }
  }, [course, isEdit, form]);

  const onSubmit = (values: z.infer<typeof courseSchema>) => {
    if (isEdit) {
      updateCourse.mutate(
        { id: courseId!, data: values },
        {
          onSuccess: () => {
            toast({ title: "Course updated successfully" });
            queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId!) });
            setLocation("/admin/courses");
          },
          onError: (error: any) => {
            toast({ title: "Failed to update course", description: error.message, variant: "destructive" });
          }
        }
      );
    } else {
      createCourse.mutate(
        { data: values },
        {
          onSuccess: () => {
            toast({ title: "Course created successfully" });
            queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
            setLocation("/admin/courses");
          },
          onError: (error: any) => {
            toast({ title: "Failed to create course", description: error.message, variant: "destructive" });
          }
        }
      );
    }
  };

  if (isEdit && isLoading) {
    return <div className="p-8 text-center">Loading course...</div>;
  }

  const isPending = createCourse.isPending || updateCourse.isPending;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEdit ? 'Edit Course' : 'New Course'}</h1>
          <p className="text-muted-foreground mt-1">{isEdit ? 'Update course details and capacity.' : 'Add a new course to the catalog.'}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="CS101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduction to Computer Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department *</FormLabel>
                      <FormControl>
                        <Input placeholder="CS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instructorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructor Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. Alan Turing" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="credits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credits *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxSeats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (Max Seats) *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="schedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule</FormLabel>
                      <FormControl>
                        <Input placeholder="Mon/Wed 10:00 AM - 11:30 AM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="classroom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classroom</FormLabel>
                      <FormControl>
                        <Input placeholder="Science Building, Room 401" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of the course content..." 
                        className="h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Link href="/admin/courses">
                  <Button variant="outline" type="button">Cancel</Button>
                </Link>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Course"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
