export const EXTS_IMAGEN = ["jpg", "jpeg", "png"];
export const EXTS_DOC    = ["pdf", "doc", "docx"];

export function extensionValida(file, permitidas) {
  if (!file) return true;
  const ext = String(file.name).split(".").pop().toLowerCase();
  return permitidas.includes(ext);
}

export function leerComoBase64(file) {
  if (!file) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

export function comprimirImagen(file, maxWidth = 1200, calidad = 0.75) {
  if (!file) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", calidad));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo procesar la imagen")); };
    img.src = url;
  });
}
