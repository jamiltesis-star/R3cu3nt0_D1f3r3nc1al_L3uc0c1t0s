// Stream de la cámara activa
let stream = null;

// Array donde se almacenan las imágenes capturadas (Base64)
let imagenes = [];

// URL del endpoint de Google Apps Script
const URL_GAS =
  "https://script.google.com/macros/s/AKfycbylBYf_wEG7Uu6ode7E8p7sXkheeoSHiMYotA6RZyS6z6g-mDCwA4-A8Erb6KJ3XYfx/exec";

// Referencias a elementos del DOM
const sendBtn = document.getElementById("btnEnviar");
const tituloInput = document.getElementById("tituloVisual");
const galeria = document.getElementById("galeria");

// Gestión de cámaras
let dispositivosVideo = [];
let currentDeviceIndex = 0;

// Validar si el botón de envío debe habilitarse
tituloInput.addEventListener("input", validarEnvio);

function validarEnvio() {
  sendBtn.disabled = !(imagenes.length > 0 && tituloInput.value.trim());
}

// Detener la cámara actual
function stopStream() {
  if (stream) stream.getTracks().forEach(t => t.stop());
}

// Abrir cámara (por ID o por defecto)
function abrirCamara(deviceId) {
  stopStream();

  const constraints = deviceId
    ? { video: { deviceId: { exact: deviceId } } }
    : { video: { facingMode: "environment" } };

  navigator.mediaDevices.getUserMedia(constraints).then(s => {
    stream = s;
    video.srcObject = stream;

    navigator.mediaDevices.enumerateDevices().then(devs => {
      dispositivosVideo = devs.filter(d => d.kind === "videoinput");
      updateCameraLabel();
    });
  });
}

// Actualizar texto de cámara activa
function updateCameraLabel() {
  if (!dispositivosVideo.length) return;
  cameraLabel.textContent =
    "Cámara: " + (dispositivosVideo[currentDeviceIndex].label || "dispositivo");
}

// Cambiar entre cámaras disponibles
function cambiarCamara() {
  if (dispositivosVideo.length <= 1) return;
  currentDeviceIndex = (currentDeviceIndex + 1) % dispositivosVideo.length;
  abrirCamara(dispositivosVideo[currentDeviceIndex].deviceId);
}

// Capturar imagen, convertir a blanco y negro y guardar
function tomarImagen() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  // Conversión a blanco y negro
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
    d[i] = d[i+1] = d[i+2] = g;
  }
  ctx.putImageData(imgData, 0, 0);

  // Convertir a WebP para reducir tamaño
  const dataURL = canvas.toDataURL("image/webp", 0.8);
  imagenes.push(dataURL);

  // Mostrar miniatura
  const img = document.createElement("img");
  img.src = dataURL;
  galeria.appendChild(img);

  validarEnvio();
}

// Enviar imágenes al backend
function enviarImagenes() {
  sendBtn.disabled = true;
  sendBtn.textContent = "Enviando...";

  fetch(URL_GAS, {
    method: "POST",
    body: new URLSearchParams({
      titulo: tituloInput.value.trim(),
      imagenes: JSON.stringify(imagenes)
    })
  })
  .then(() => {
    alert("Enviado correctamente");
    imagenes = [];
    galeria.innerHTML = "";
    tituloInput.value = "";
    sendBtn.textContent = "⬆️ Enviar imágenes";
  })
  .catch(() => {
    alert("Error al enviar");
    sendBtn.disabled = false;
  });
}

// Inicializar cámara al cargar la página
navigator.mediaDevices.enumerateDevices()
  .then(() => abrirCamara())
  .catch(() => abrirCamara());
