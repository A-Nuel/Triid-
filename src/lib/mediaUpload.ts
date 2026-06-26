export async function uploadMedia(file: File | Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/v1/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Failed to upload media. Server responded with " + res.status);
  }

  const data = await res.json();
  return data.url;
}
