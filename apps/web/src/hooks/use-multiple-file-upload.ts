import { useDragAndDrop } from "@formkit/drag-and-drop/react";
import { type ChangeEvent, useState } from "react";
import { convertImage } from "@/lib/utils";

type UploadProgressEntry = {
  progress: number;
  status: "queued" | "uploading" | "uploaded" | "error";
  error?: string;
  previewUrl?: string;
};

export function useMultipleFileUpload() {
  const [parentRef, selectedFiles, setSelectedFiles] = useDragAndDrop<
    HTMLDivElement,
    File
  >([], {
    draggingClass: "border-secondary",
    dropZoneClass: "border-secondary",
  });
  const [uploadProgress, setUploadProgress] = useState<
    Record<string, UploadProgressEntry>
  >({});

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFilesArray = Array.from(event.target.files);

      const uniqueNewFiles = (
        await Promise.all(
          newFilesArray
            .filter((file) => file.type.startsWith("image/"))
            .map((file) => {
              if (file.type.startsWith("image/gif")) {
                return file;
              }
              return convertImage(file, "webp", 0.8);
            })
        )
      ).filter(
        (newFile) =>
          !selectedFiles.some(
            (existingFile) => existingFile.name === newFile.name
          )
      );

      setSelectedFiles((prevFiles) => [...prevFiles, ...uniqueNewFiles]);

      const newProgressUpdates: Record<string, UploadProgressEntry> = {};

      for (const file of uniqueNewFiles) {
        let previewUrl: string | undefined;
        if (file.type.startsWith("image/")) {
          previewUrl = URL.createObjectURL(file);
        }
        newProgressUpdates[file.name] = {
          progress: 0,
          status: "queued",
          previewUrl,
        };
      }
      setUploadProgress((prev) => ({ ...prev, ...newProgressUpdates }));
      event.target.value = ""; // Clear input to allow re-selecting same file if removed
    }
  };

  // TODO: fix this effect as it's revoking urls when files are swapped around
  // Effect for revoking object URLs to prevent memory leaks
  // useEffect(() => {
  //   return () => {
  //     for (const entry of Object.values(uploadProgress)) {
  //       if (entry.previewUrl) {
  //         URL.revokeObjectURL(entry.previewUrl);
  //       }
  //     }
  //   };
  // }, [selectedFiles]);
  // Re-run if selectedFiles change, as new previews might be made or old ones implicitly removed
  // The dependency array for this cleanup is tricky.
  // A direct dependency on uploadProgress would cause loops.
  // Relying on selectedFiles covers removal. For unmount, it's fine.

  const removeFile = (fileName: string) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((file) => file.name !== fileName)
    );
    setUploadProgress((prev) => {
      const updatedProgress = { ...prev };
      if (updatedProgress[fileName]?.previewUrl) {
        URL.revokeObjectURL(updatedProgress[fileName].previewUrl);
      }
      delete updatedProgress[fileName];
      return updatedProgress;
    });
  };

  return {
    parentRef,
    selectedFiles,
    uploadProgress,
    setUploadProgress,
    handleFileChange,
    removeFile,
  };
}
