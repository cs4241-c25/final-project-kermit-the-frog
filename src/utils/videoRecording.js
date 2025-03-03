/**
 * Check if the browser supports video recording
 * @returns {boolean} Whether the browser supports getUserMedia and MediaRecorder 
 */
export function isVideoRecordingSupported() {
  return !!(navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia && 
    window.MediaRecorder);
}

/**
 * Get the best supported video MIME type 
 * Try MP4 first, then fall back to WebM
 * @returns {string} Best supported MIME type
 */
export function getBestVideoMimeType() {
  const types = [
    'video/mp4',
    'video/webm;codecs=h264', 
    'video/webm;codecs=vp9',
    'video/webm'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log(`Using video format: ${type}`);
      return type;
    }
  }
  
  // Default fallback
  console.log('No preferred format supported, using default');
  return 'video/webm';
}

/**
 * Get appropriate file extension based on MIME type
 * @param {string} mimeType - The MIME type
 * @returns {string} File extension with dot prefix
 */
export function getFileExtension(mimeType) {
  if (mimeType.includes('mp4')) {
    return '.mp4';
  }
  return '.webm';
}

/**
 * Creates a download link for a recorded video blob
 * @param {Blob} blob - The recorded video blob
 * @param {string} [filename] - Optional custom filename
 */
export function downloadRecordedVideo(blob, filename) {
  const mimeType = blob.type;
  const extension = getFileExtension(mimeType);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename || `solve-${new Date().toISOString()}${extension}`;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Safely stops all tracks in a given media stream
 * @param {MediaStream} stream - The media stream to stop
 */
export function stopMediaTracks(stream) {
  if (!stream) return;
  
  const tracks = stream.getTracks();
  tracks.forEach(track => {
    try {
      track.stop();
    } catch (err) {
      console.error('Error stopping media track:', err);
    }
  });
} 