// Add srcObject property to HTML video elements
interface HTMLVideoElement extends HTMLMediaElement {
  srcObject: MediaStream | null;
}