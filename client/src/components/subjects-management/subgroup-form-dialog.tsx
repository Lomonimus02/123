import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { InsertSubgroup, Class, Subject } from "@shared/schema";
import { Loader2 } from "lucide-react";

// Схема валидации формы подгруппы
const subgroupFormSchema = z.object({
  name: z.string().min(1, "Название подгруппы обязательно"),
  description: z.string().optional().nullable(),
  classId: z.string().min(1, { message: "Выберите класс" }),
  studentIds: z.array(z.string()).optional().default([]),
  // Добавляем поле для связи с предметом (опционально, но рекомендуется)
  // Мы не будем сохранять это в БД напрямую, но используем для логики
  // subjectId: z.string().optional().nullable(),
});

type SubgroupFormData = z.infer<typeof subgroupFormSchema>;

interface SubgroupFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<InsertSubgroup, 'schoolId'>) => void; // Передаем только нужные поля
  isLoading: boolean;
  classes: Class[]; // Список классов для выбора
  subjects: Subject[]; // Список предметов для выбора (если нужно)
}

export function SubgroupFormDialog({ isOpen, onClose, onSubmit, isLoading, classes, subjects }: SubgroupFormDialogProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const form = useForm<SubgroupFormData>({
    resolver: zodResolver(subgroupFormSchema),
    defaultValues: {
      name: "",
      description: "",
      classId: "",
      studentIds: [],
    },
  });

  useEffect(() => {
    if (selectedClassId) {
      setIsLoadingStudents(true);
      fetch(`/api/students-by-class/${selectedClassId}`)
        .then(res => res.json())
        .then(data => setStudents(data))
        .catch(() => setStudents([]))
        .finally(() => setIsLoadingStudents(false));
    } else {
      setStudents([]);
    }
  }, [selectedClassId]);

  // Сброс формы при закрытии диалога
  const handleClose = () => {
    form.reset();
    setSelectedClassId("");
    setStudents([]);
    onClose();
  };

  const handleFormSubmit = (values: SubgroupFormData) => {
    onSubmit({
      name: values.name,
      description: values.description || null,
      classId: parseInt(values.classId),
      studentIds: (values.studentIds || []).map((id: string) => parseInt(id)),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Добавить подгруппу</DialogTitle>
          <DialogDescription>
            Введите информацию о новой подгруппе.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Класс</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={value => {
                      field.onChange(value);
                      setSelectedClassId(value);
                      form.setValue("studentIds", []);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите класс" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.length === 0 ? (
                        <SelectItem value="loading" disabled>Загрузка...</SelectItem>
                      ) : (
                        classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название подгруппы</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: Группа 1 (Англ. язык)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание (необязательно)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Краткое описание подгруппы"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="studentIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ученики</FormLabel>
                  {isLoadingStudents ? (
                    <div>Загрузка учеников...</div>
                  ) : students.length === 0 && selectedClassId ? (
                    <div className="text-muted-foreground">Нет учеников в выбранном классе</div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto border rounded p-2">
                      {students.map((student) => (
                        <label key={student.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            value={student.id}
                            checked={field.value?.includes(student.id.toString())}
                            onChange={e => {
                              if (e.target.checked) {
                                field.onChange([...(field.value || []), student.id.toString()]);
                              } else {
                                field.onChange((field.value || []).filter((id: string) => id !== student.id.toString()));
                              }
                            }}
                          />
                          <span>{student.lastName} {student.firstName}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <FormDescription>Выберите учеников, которых нужно добавить в подгруппу</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Отмена
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Создать подгруппу
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}