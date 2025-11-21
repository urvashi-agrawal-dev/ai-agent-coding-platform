import { useState } from 'react';
import { uploadFiles } from '../services/api';

export default function FileUpload() {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('files', file));
      
      const result = await uploadFiles(formData);
      alert(`Uploaded ${result.count} files successfully`);
    } catch (error) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <h3>Project Files</h3>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        disabled={uploading}
        className="file-input"
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
