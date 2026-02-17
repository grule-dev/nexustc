import type { ChangeEvent } from "react";
import { useState } from "react";
import { convertImage } from "@/lib/utils";

export function useMultipleFileUpload() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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

      event.target.value = ""; // Clear input to allow re-selecting same file if removed
    }
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((file) => file.name !== fileName)
    );
  };

  return {
    selectedFiles,
    setSelectedFiles,
    handleFileChange,
    removeFile,
  };
}
