import { apiFetch } from "./api";

export type UploadResult = {
  success?: boolean;
  url?: string;
  path?: string;
  filename?: string;
  originalName?: string;
  size?: number;
  contentType?: string;
  error?: string;
};

/** Public URL/path returned by academy upload (and compatible attachment endpoints). */
export function uploadPublicPath(result: UploadResult): string {
  return (result.url || result.path || "").trim();
}

/**
 * Authenticated multipart upload — uses HttpOnly cookies / Bearer via {@link apiFetch}.
 */
export async function uploadFile(
  file: File,
  options?: { endpoint?: string; fieldName?: string }
): Promise<UploadResult> {
  const endpoint = options?.endpoint ?? "/api/upload";
  const fieldName = options?.fieldName ?? "file";
  const formData = new FormData();
  formData.append(fieldName, file);
  return (await apiFetch(endpoint, { method: "POST", body: formData })) as UploadResult;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  return uploadFile(file, { endpoint: "/api/upload/image" });
}

export type ChatAttachmentResult = {
  id?: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  mimeType?: string;
  message?: string;
  error?: string;
};

/** Connect chat / stories attachment (connect_service). */
export async function uploadChatAttachment(
  file: File,
  options?: { uploadedBy?: string; messageId?: string }
): Promise<ChatAttachmentResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (options?.uploadedBy) {
    formData.append("uploadedBy", options.uploadedBy);
  }
  if (options?.messageId) {
    formData.append("messageId", options.messageId);
  }
  return (await apiFetch("/api/attachments/upload", {
    method: "POST",
    body: formData,
  })) as ChatAttachmentResult;
}
