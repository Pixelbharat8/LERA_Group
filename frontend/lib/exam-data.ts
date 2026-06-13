import { apiFetch } from "./api";

/** Exams for the given academy class ids (uses scoped `/api/exams/class/{id}`). */
export async function loadExamsForClassIds(classIds: string[]): Promise<unknown[]> {
  if (classIds.length === 0) return [];
  const batches = await Promise.all(
    classIds.map((id) => apiFetch(`/api/exams/class/${id}`).catch(() => []))
  );
  return batches.flatMap((batch) => (Array.isArray(batch) ? batch : []));
}

/** Exam results for the given class ids (uses `/api/exam-results?classId=`). */
export async function loadExamResultsForClassIds(classIds: string[]): Promise<unknown[]> {
  if (classIds.length === 0) return [];
  const batches = await Promise.all(
    classIds.map((id) =>
      apiFetch(`/api/exam-results?classId=${encodeURIComponent(id)}`).catch(() => [])
    )
  );
  return batches.flatMap((batch) => (Array.isArray(batch) ? batch : []));
}
