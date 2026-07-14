/**
 * Compresses an image represented as a base64 Data URL using HTML Canvas.
 * Scales the image down to maxWidth/maxHeight and outputs a compressed JPEG.
 */
export function compressImage(
  base64Str: string,
  callback: (resized: string) => void,
  maxWidth = 250,
  maxHeight = 250,
  quality = 0.7
) {
  if (!base64Str) {
    callback(base64Str);
    return;
  }
  
  if (base64Str.startsWith('data:image/svg+xml')) {
    // SVGs do not need compression and canvas compression destroys vector data
    callback(base64Str);
    return;
  }
  
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = base64Str;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width *= maxHeight / height;
        height = maxHeight;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const resized = canvas.toDataURL('image/jpeg', quality);
        callback(resized);
      } catch (e) {
        console.error("Canvas toDataURL failed", e);
        callback(base64Str);
      }
    } else {
      callback(base64Str);
    }
  };
  img.onerror = () => {
    callback(base64Str);
  };
}
