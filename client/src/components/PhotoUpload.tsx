import { useRef, useState } from 'react';
import { HiCamera, HiPhotograph, HiX } from 'react-icons/hi';

interface PhotoUploadProps {
  onUpload: (file: File) => Promise<any>;
  preview?: string;
  onRemove?: () => void;
  label?: string;
}

export function PhotoUpload({ onUpload, preview, onRemove, label = 'Photo' }: PhotoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const displayPreview = localPreview || preview;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (displayPreview) {
    return (
      <div className="relative inline-block">
        <img
          src={displayPreview.startsWith('blob:') ? displayPreview : `/uploads/${displayPreview}`}
          alt={label}
          className="w-20 h-20 object-cover rounded-lg border border-surface-700"
        />
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full 
                       flex items-center justify-center text-xs"
          >
            <HiX />
          </button>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => fileRef.current?.click()}
      disabled={uploading}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-surface-600 
                 text-surface-400 hover:text-surface-200 hover:border-surface-500 transition-colors text-sm"
    >
      {uploading ? (
        <div className="w-4 h-4 border-2 border-surface-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <HiCamera className="w-4 h-4" />
      )}
      {label}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
    </button>
  );
}

export function MultiPhotoUpload({
  photos,
  onUpload,
  onDelete,
}: {
  photos: { id: string; filename: string; photoType?: string }[];
  onUpload: (file: File, photoType?: string) => Promise<any>;
  onDelete: (photoId: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await onUpload(file);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="photo-grid mb-2">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group">
            <img
              src={`/uploads/${photo.filename}`}
              alt=""
              className="w-full aspect-square object-cover rounded-lg border border-surface-700"
            />
            <button
              onClick={() => onDelete(photo.id)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 text-white rounded-full 
                         flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <HiX />
            </button>
          </div>
        ))}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-lg border-2 border-dashed border-surface-600 
                     flex flex-col items-center justify-center text-surface-400 hover:border-surface-500 
                     hover:text-surface-200 transition-colors"
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-surface-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <HiPhotograph className="w-6 h-6" />
              <span className="text-[10px] mt-1">Add</span>
            </>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple onChange={handleFile} className="hidden" />
      </div>
    </div>
  );
}
