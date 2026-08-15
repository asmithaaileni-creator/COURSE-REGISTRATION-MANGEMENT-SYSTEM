import { useState } from "react";
import { Link } from "wouter";
import { useListCourses } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Clock, User, Filter, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const DEPARTMENTS = ["CS", "MATH", "ENG", "PHYS", "BIO", "CHEM", "HIST", "ART", "BUS"];

export function CourseCatalog() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [department, setDepartment] = useState<string>("all");
  
  const { data, isLoading } = useListCourses({
    search: debouncedSearch || undefined,
    department: department !== "all" ? department : undefined,
    limit: 50
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Course Catalog</h1>
        <p className="text-muted-foreground mt-1">Browse and enroll in available courses.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by course code or name..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : data?.courses && data.courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.courses.map((course) => {
            const isFull = course.availableSeats <= 0;
            const fillPercentage = (course.enrolledCount / course.maxSeats) * 100;
            
            return (
              <Card key={course.id} className="flex flex-col h-full hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-secondary/10 text-secondary font-semibold">
                      {course.department}
                    </Badge>
                    <Badge variant={isFull ? "destructive" : fillPercentage > 80 ? "secondary" : "default"} className="font-mono">
                      {course.availableSeats} seats left
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">
                    <span className="text-muted-foreground font-mono text-sm block mb-1">{course.code}</span>
                    {course.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 flex-1 space-y-3">
                  <div className="text-sm flex items-center text-muted-foreground">
                    <User className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">{course.instructorName}</span>
                  </div>
                  <div className="text-sm flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">{course.schedule || "TBA"}</span>
                  </div>
                  <div className="text-sm flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">{course.classroom || "TBA"}</span>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Capacity</span>
                      <span>{course.enrolledCount} / {course.maxSeats}</span>
                    </div>
                    <Progress value={fillPercentage} className={`h-1.5 ${isFull ? '[&>div]:bg-destructive' : fillPercentage > 80 ? '[&>div]:bg-secondary' : ''}`} />
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Link href={`/courses/${course.id}`} className="w-full">
                    <Button variant="secondary" className="w-full">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No courses found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your search or department filter.</p>
        </div>
      )}
    </div>
  );
}
