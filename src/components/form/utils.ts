export const MIN_IMAGE_MEASUREMENT: [number, number] = [512, 512]; // [width, height] in pixels
export const MAX_IMAGE_MEASUREMENT: [number, number] = [1024, 1024]; // [width, height] in pixels
export const MAX_FILE_SIZE = 2; // in MB

export interface Photo {
  file: File | null;
  isValid: boolean;
  hasBeenUploaded: boolean;
  error: string | null;
}
