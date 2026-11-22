import { ChangeEvent, useRef } from 'react';
import { Upload, RotateCcw } from 'lucide-react';
import { ResilientImage } from './ResilientImage';

interface AdminImageFieldProps {
  label: string;
  value: string;
  onChange: (nextUrl: string) => void;
  defaultUrl?: string;
  aspectClass?: string;
  fitMode?: 'cover' | 'contain';
}

export function AdminImageField({
  label,
  value,
  onChange,
  defaultUrl,
  aspectClass = 'aspect-[16/10]',
  fitMode = 'cover',
}: AdminImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[#1B3B2B]">{label}</label>
        {defaultUrl && value !== defaultUrl && (
          <button
            type="button"
            onClick={() => onChange(defaultUrl)}
            className="inline-flex items-center gap-1 text-xs text-[#C87D55] hover:text-[#1B3B2B] cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>Reset Default</span>
          </button>
        )}
      </div>

      <div
        className={`w-full ${aspectClass} rounded-sm overflow-hidden border border-[#1B3B2B]/15 ${
          fitMode === 'contain'
            ? 'bg-[#FAF9F6] p-3 flex items-center justify-center'
            : 'bg-[#F3F0EA]'
        }`}
      >
        <ResilientImage
          src={value}
          alt={label}
          fallbackLabel={label}
          className={`w-full h-full object-center ${
            fitMode === 'contain' ? 'object-contain' : 'object-cover'
          }`}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={value.startsWith('data:') ? '(Uploaded local image)' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          aria-label={`${label} URL`}
          className="flex-1 px-3 py-2 text-xs bg-white border border-[#1B3B2B]/20 rounded-sm text-[#1C2822] focus:outline-none focus:ring-2 focus:ring-[#1B3B2B]"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#1B3B2B] bg-[#F3F0EA] hover:bg-[#E8E3DA] border border-[#1B3B2B]/20 rounded-sm whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Upload File</span>
        </button>
      </div>
    </div>
  );
}
