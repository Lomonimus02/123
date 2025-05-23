import { ClockIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Schedule, Subject, Class } from "@shared/schema";

export function TeacherSchedule() {
  const { user } = useAuth();
  
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
    enabled: !!user
  });
  
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    enabled: !!user
  });
  
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
    enabled: !!user
  });
  
  // Get today's schedules
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayOfWeek = today === 0 ? 7 : today; // Convert to 1-7 format where 1 is Monday, 7 is Sunday
  
  const todaySchedules = schedules
    .filter(schedule => schedule.dayOfWeek === dayOfWeek)
    .sort((a, b) => {
      // Sort by start time
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      
      if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
      return timeA[1] - timeB[1];
    });
  
  // Function to get subject name by ID
  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Предмет';
  };
  
  // Function to get class name by ID
  const getClassName = (classId: number) => {
    const classObj = classes.find(c => c.id === classId);
    return classObj?.name || 'Класс';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 col-span-1 lg:col-span-2">
      <h3 className="text-lg font-heading font-semibold text-gray-800 mb-4">Расписание на сегодня</h3>
      {schedulesLoading ? (
        <div className="text-center py-4 text-gray-500">Загрузка...</div>
      ) : todaySchedules.length === 0 ? (
        <div className="text-center py-4 text-gray-500">Нет занятий на сегодня</div>
      ) : (
        <div className="space-y-3">
          {todaySchedules.map((schedule) => (
            <div key={schedule.id} className="flex items-center p-3 bg-primary-50 bg-opacity-50 rounded-lg">
              <ClockIcon className="h-5 w-5 mr-3 text-primary-dark" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {schedule.startTime} - {schedule.endTime}
                </p>
                <p className="text-sm text-gray-700">
                  {getSubjectName(schedule.subjectId)}, {getClassName(schedule.classId)}
                </p>
                {schedule.room && (
                  <p className="text-xs text-gray-500">
                    Кабинет: {schedule.room}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
