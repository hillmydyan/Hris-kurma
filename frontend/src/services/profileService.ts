import api from '../lib/api';
import { resizeImageToMax512 } from '../utils/imageUtils';

/**
 * Service untuk upload foto profil karyawan ke backend
 * Endpoint: POST /api/employees/{employeeId}/photo
 */
export async function uploadProfilePhoto(
  employeeId: number | string,
  file: File
): Promise<{ photo: string; photo_url: string }> {
  // Kompres / resize gambar di sisi client (maks 512x512)
  const resizedBlob = await resizeImageToMax512(file);
  const compressedFile = new File([resizedBlob], file.name, {
    type: resizedBlob.type,
  });

  const formData = new FormData();
  formData.append('photo', compressedFile);

  const response = await api.post(`/employees/${employeeId}/photo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return {
    photo: response.data?.photo,
    photo_url: response.data?.photo_url,
  };
}

/**
 * Service untuk menghapus foto profil karyawan di backend
 * Endpoint: DELETE /api/employees/{employeeId}/photo
 */
export async function deleteProfilePhoto(
  employeeId: number | string
): Promise<{ photo: null; photo_url: null }> {
  await api.delete(`/employees/${employeeId}/photo`);
  return {
    photo: null,
    photo_url: null,
  };
}
