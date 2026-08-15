import { useState } from "react";
import { useListCourses, useDeleteCourse, getListCoursesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Download, Plus, Trash2, Edit } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";

export function AdminCourses() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  
  const { data, isLoading } = useListCourses({ search: debouncedSearch, limit: 100 });
  const deleteCourse = useDeleteCourse();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone and will affect student enrollments.")) return;
    
    deleteCourse.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Course deleted" });
          queryClient.invalidateQueries({ queryKey: getListCoursesQueryKey() });
        },
        onError: (error: any) => {
          toast({ title: "Failed to delete course", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-1">Manage course catalog, capacity, and details.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href="/api/export/courses" target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </a>
          </Button>
          <Link href="/admin/courses/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Course
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm max-w-sm">
        <Search className="w-4 h-4 ml-2 text-muted-foreground" />
        <Input 
          placeholder="Search courses..." 
          className="border-0 focus-visible:ring-0 shadow-none h-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Course Name</TableHead>
              <TableHead>Dept</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Loading courses...</TableCell>
              </TableRow>
            ) : data?.courses && data.courses.length > 0 ? (
              data.courses.map((course) => {
                const fillPercentage = (course.enrolledCount / course.maxSeats) * 100;
                const isFull = course.availableSeats <= 0;
                
                return (
                  <TableRow key={course.id}>
                    <TableCell className="font-mono text-xs font-semibold">{course.code}</TableCell>
                    <TableCell className="font-medium max-w-[250px] truncate" title={course.name}>
                      {course.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-secondary/10">
                        {course.department}
                      </Badge>
                    </TableCell>
                    <TableCell>{course.instructorName}</TableCell>
                    <TableCell className="w-[200px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Progress value={fillPercentage} className={`h-2 ${isFull ? '[&>div]:bg-destructive' : ''}`} />
                        </div>
                        <span className="text-xs w-10 text-right font-mono">
                          {course.enrolledCount}/{course.maxSeats}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Link href={`/admin/courses/${course.id}/edit`}>
                          <Button variant="ghost" size="icon" title="Edit course">
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(course.id)}
                          disabled={deleteCourse.isPending}
                          title="Delete course"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No courses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
