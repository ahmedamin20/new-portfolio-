import { ApiResponse } from './apiResponse';
import { apiFetch } from './apiFetch';

// Cloudinary force-downloads SVGs instead of rendering them inline (a fixed security default).
// Rasterizing to PNG client-side before upload sidesteps that entirely.
function svgFileToPngFile(file: File, size = 256): Promise<File> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(url);
                reject(new Error('No 2d context'));
                return;
            }
            ctx.drawImage(img, 0, 0, size, size);
            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url);
                if (!blob) {
                    reject(new Error('Failed to rasterize SVG'));
                    return;
                }
                resolve(new File([blob], file.name.replace(/\.svg$/i, '.png'), { type: 'image/png' }));
            }, 'image/png');
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load SVG for rasterization'));
        };
        img.src = url;
    });
}

export async function uploadToCloudinary(file: File, folder?: string): Promise<string> {
    const uploadFile = file.type === 'image/svg+xml' ? await svgFileToPngFile(file) : file;

    const formData = new FormData();
    formData.append('file', uploadFile);
    if (folder) formData.append('folder', folder);

    const res = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error('Cloudinary upload failed');
    const body: ApiResponse<{ publicId: string; url: string }> = await res.json();
    if (!body.data) throw new Error(body.message || 'Cloudinary upload failed');
    return body.data.url;
}

function extractPublicIdFromUrl(url: string): string | null {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
    return match ? match[1] : null;
}

export async function deleteFromCloudinaryUrl(url: string): Promise<void> {
    const publicId = extractPublicIdFromUrl(url);
    if (!publicId) return;

    const res = await apiFetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
    });
    if (!res.ok) throw new Error('Cloudinary delete failed');
}
