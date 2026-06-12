"use client";

import { useEffect, useState } from "react";
import ChatPanel, { type ChatRecipient } from "../../../components/ChatPanel";
import { loadParentsForTeacher } from "../../../../lib/teacher-context";

export default function TeacherMessagesPage() {
  const [parents, setParents] = useState<ChatRecipient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const contacts = await loadParentsForTeacher();
        setParents(
          contacts.map<ChatRecipient>((p) => ({
            id: p.id,
            name: p.name,
            subtitle: [p.childName, p.className].filter(Boolean).join(" · "),
          }))
        );
      } catch (err) {
        console.error(err);
        setParents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ChatPanel
      recipients={parents}
      recipientsLoading={loading}
      recipientNoun="parent"
      breadcrumbHref="/dashboard/teacher"
      breadcrumbLabel="Dashboard"
    />
  );
}
