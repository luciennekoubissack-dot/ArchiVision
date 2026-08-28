export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, filename);
}

export function downloadSvg(svg: string, filename: string): void {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  triggerDownload(blob, filename);
}

/** Convertit un SVG (avec width/height explicites sur la racine) en PNG côté client. */
export function downloadPng(svg: string, filename: string): void {
  const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      URL.revokeObjectURL(url);
      return;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      if (blob) triggerDownload(blob, filename);
    }, 'image/png');
  };

  image.onerror = () => URL.revokeObjectURL(url);
  image.src = url;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
