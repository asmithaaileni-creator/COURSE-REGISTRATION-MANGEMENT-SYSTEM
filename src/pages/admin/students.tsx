import { useState } from "react";
import { useListStudents, useDeleteStudent, getListStudentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Trash2, Edit, Eye } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function AdminStudents() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  
  const { data, isLoading } = useListStudents({ search: debouncedSearch, limit: 100 });
  const deleteStudent = useDeleteStudent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this student? All their enrollments will be removed.")) return;
    
    deleteStudent.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Student deleted" });
          queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
        },
        onError: (error: any) => {
          toast({ title: "Failed to delete student", description: error.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">Manage student accounts and enrollment limits.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href="/api/export/students" target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </a>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm max-w-sm">
        <Search className="w-4 h-4 ml-2 text-muted-foreground" />
        <Input 
          placeholder="Search by name, email, or username..." 
          className="border-0 focus-visible:ring-0 shadow-none h-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Enrolled Courses</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Loading students...</TableCell>
              </TableRow>
            ) : data?.students && data.students.length > 0 ? (
              data.students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono text-xs">{student.id}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/admin/students/${student.id}`} className="hover:underline text-primary">
                      {student.firstName} {student.lastName}
                    </Link>
                    <div className="text-xs text-muted-foreground">{student.username}</div>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.enrollmentCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(student.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Link href={`/admin/students/${student.id}`}>
                        <Button variant="ghost" size="icon" title="View details">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(student.id)}
                        disabled={deleteStudent.isPending}
                        title="Delete student"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
