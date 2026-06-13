import { redirect } from "next/navigation";

/** Legacy route — canonical class management lives under Classrooms. */
export default function ClassesPage() {
  redirect("/dashboard/academy/classrooms");
}
