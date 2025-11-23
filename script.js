const webcam = document.getElementById('webcam');
const captureButton = document.getElementById('capture');
const downloadButton = document.getElementById('download');
const backgroundSelect = document.getElementById('backgrounds');
const refreshButton = document.getElementById('refresh');

const slots = [
  document.getElementById('slot1'),
  document.getElementById('slot2'),
  document.getElementById('slot3')
];

let currentSlot = 0;

// Edit the template position here
const templateSlots = [
  { x: 100, y: 200, width: 500, height: 500 },   // top frame
  { x: 100, y: 740, width: 500, height: 500 },   // middle frame
  { x: 100, y: 1300, width: 500, height: 500 }   // bottom frame
];

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    webcam.srcObject = stream;
  })
  .catch(error => console.error('Error accessing webcam:', error));

captureButton.addEventListener('click', () => {
  if (currentSlot >= slots.length) return;

  const canvas = document.createElement('canvas');
  const aspectRatio = webcam.videoWidth / webcam.videoHeight;

  canvas.width = 600;
  canvas.height = Math.round(canvas.width / aspectRatio);

  const ctx = canvas.getContext('2d');

  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);

  ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);

  slots[currentSlot].src = canvas.toDataURL('image/png');
  slots[currentSlot].style.display = 'block';
  currentSlot++;
});

refreshButton.addEventListener('click', () => {
  location.reload();
});

downloadButton.addEventListener('click', () => {
  if (currentSlot === 0) {
    alert('Take at least one photo before downloading.');
    return;
  }

  const stripCanvas = document.createElement('canvas');
  const ctx = stripCanvas.getContext('2d');

  const background = new Image();
  background.src = backgroundSelect.value;

  background.onload = () => {
    stripCanvas.width = background.width;
    stripCanvas.height = background.height;

    let loaded = 0;
    const toLoad = slots.filter(s => s.src).length;

    slots.forEach((slot, i) => {
      if (!slot.src) return;

      const img = new Image();
      img.src = slot.src;

      img.onload = () => {
        const { x, y, width, height } = templateSlots[i];

        const scale = Math.max(width / img.width, height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const dx = x + (width - w) / 2;
        const dy = y + (height - h) / 2;

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();

        ctx.drawImage(img, dx, dy, w, h);
        ctx.restore();

        loaded++;
        if (loaded === toLoad) {
          ctx.drawImage(background, 0, 0, stripCanvas.width, stripCanvas.height);

          const link = document.createElement('a');
          link.download = 'photo-strip.png';
          link.href = stripCanvas.toDataURL('image/png');
          link.click();
        }
      };
    });
  };
});
