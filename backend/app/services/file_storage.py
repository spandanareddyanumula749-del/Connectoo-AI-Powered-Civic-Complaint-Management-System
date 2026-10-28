import os
import uuid
import shutil
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

class FileStorageService:
    def __init__(self, base_upload_dir: str = settings.UPLOAD_DIR):
        self.upload_dir = base_upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    async def save_upload(self, upload_file: UploadFile, subfolder: str = "evidence") -> Tuple[str, str, int]:
        """
        Validates and safely persists an uploaded file.
        Returns (relative_file_path, original_filename, file_size_bytes).
        """
        # Validate filename
        filename = upload_file.filename or "uploaded_media"
        ext = os.path.splitext(filename)[1].lower()
        if not ext:
            ext = ".jpg"

        # Sanitize extension
        allowed_extensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".mp4"]
        if ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type '{ext}'. Allowed types: {', '.join(allowed_extensions)}"
            )

        target_dir = os.path.join(self.upload_dir, subfolder)
        os.makedirs(target_dir, exist_ok=True)

        # Generate non-colliding secure filename
        unique_name = f"{uuid.uuid4().hex[:16]}_{os.path.basename(filename)}"
        target_path = os.path.join(target_dir, unique_name)

        # Stream save and enforce size limit
        file_size = 0
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024

        with open(target_path, "wb") as buffer:
            while chunk := await upload_file.read(1024 * 64):
                file_size += len(chunk)
                if file_size > max_bytes:
                    os.remove(target_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
                    )
                buffer.write(chunk)

        # Relative path for web serving
        rel_path = f"/uploads/{subfolder}/{unique_name}"
        return rel_path, filename, file_size

file_storage = FileStorageService()
