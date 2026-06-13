"use client";

import { useEffect, useState } from "react";
import ChatPanel, { type ChatRecipient } from "../../../components/ChatPanel";
import { loadMyChildren, loadTeachersForChild } from "../../../../lib/parent-context";

export default function ParentMessagesPage() {
  const [teachers, setTeachers] = useState<ChatRecipient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const children = await loadMyChildren();
        const lists = await Promise.all(
          children.map(async (child) => {
            const contacts = await loadTeachersForChild(child.id);
            return contacts.map<ChatRecipient>((t) => ({
              id: t.id,
              name: t.fullname,
              subtitle: [child.fullname, t.className].filter(Boolean).join(" · "),
            }));
          })
        );
        // De-duplicate by teacher userId (a teacher may teach several of the children).
        const byId = new Map<string, ChatRecipient>();
        for (const r of lists.flat()) if (!byId.has(r.id)) byId.set(r.id, r);
        setTeachers(Array.from(byId.values()));
      } catch (err) {
        console.error(err);
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ChatPanel
      recipients={teachers}
      recipientsLoading={loading}
      recipientNoun="teacher"
      breadcrumbHref="/dashboard/parent"
      breadcrumbLabel="Dashboard"
    />
  );
}
