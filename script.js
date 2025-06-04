const webcam = document.getElementById('webcam');
const captureButton = document.getElementById('capture');
const downloadButton = document.getElementById('download');
const backgroundSelect = document.getElementById('backgrounds');
const slots = [document.getElementById('slot1'), document.getElementById('slot2'), document.getElementById('slot3'), document.getElementById('slot4')];

let currentSlot = 0;

// Access webcam
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        webcam.srcObject = stream;
    })
    .catch(error => console.error('Error accessing webcam:', error));

// Capture photo and store in next available slot
captureButton.addEventListener('click', () => {
    if (currentSlot >= slots.length) return; // Stop if slots are full

    const canvas = document.createElement('canvas');
    const aspectRatio = webcam.videoWidth / webcam.videoHeight;
    canvas.width = 600;  // Maintain aspect ratio
    canvas.height = Math.round(canvas.width / aspectRatio);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);

    slots[currentSlot].src = canvas.toDataURL('image/png');
    slots[currentSlot].style.display = "block"; // Ensure the image is visible
    currentSlot++;
});

const refreshButton = document.getElementById('refresh');

refreshButton.addEventListener('click', () => {
    location.reload();
});

// Download entire photo strip as an image with selected background
downloadButton.addEventListener('click', () => {
    if (currentSlot === 0) {
        alert("Take at least one photo before downloading.");
        return;
    }

    const stripWidth = 600;  // Standard width for tall photo strips
    const slotHeight = 350;  // Keep aspect ratio
    const spacing = 40;      // Space between images
    const borderSize = 15;   // Keep the side padding narrow
    const topBottomPadding = 10; // Keep small padding at the top and bottom
    const stripHeight = slots.length * slotHeight + (slots.length - 1) * spacing + (topBottomPadding * 2);

    const stripCanvas = document.createElement('canvas');
    stripCanvas.width = stripWidth + (borderSize * 2); // Narrower white background
    stripCanvas.height = stripHeight;
    const ctx = stripCanvas.getContext('2d');

    // Load selected background
    const background = new Image();
    background.src = backgroundSelect.value;
    background.onload = () => {
        ctx.drawImage(background, 0, 0, stripCanvas.width, stripCanvas.height);

        // Draw the translucent white padding
        const whiteStripX = borderSize;
        const whiteStripWidth = stripCanvas.width - (borderSize * 2);
        const whiteOpacity = 0.5; // Adjust opacity (0 = fully transparent, 1 = solid)
        ctx.fillStyle = `rgba(255, 255, 255, ${whiteOpacity})`;
        ctx.fillRect(whiteStripX, 0, whiteStripWidth, stripCanvas.height);

        let loadedImages = 0;
        slots.forEach((slot, index) => {
            if (slot.src) {
                const img = new Image();
                img.src = slot.src;
                img.onload = () => {
                    const imgWidth = stripWidth * 0.85;  // Keep aspect ratio
                    const imgX = (stripCanvas.width - imgWidth) / 2; // Center horizontally
                    const imgY = topBottomPadding + index * (slotHeight + spacing); // Adjust for thin padding

                    // Apply rounded corners
                    ctx.save();
                    ctx.beginPath();
                    const radius = 10; // Keep rounded corners
                    ctx.moveTo(imgX + radius, imgY);
                    ctx.lineTo(imgX + imgWidth - radius, imgY);
                    ctx.quadraticCurveTo(imgX + imgWidth, imgY, imgX + imgWidth, imgY + radius);
                    ctx.lineTo(imgX + imgWidth, imgY + slotHeight - radius);
                    ctx.quadraticCurveTo(imgX + imgWidth, imgY + slotHeight, imgX + imgWidth - radius, imgY + slotHeight);
                    ctx.lineTo(imgX + radius, imgY + slotHeight);
                    ctx.quadraticCurveTo(imgX, imgY + slotHeight, imgX, imgY + slotHeight - radius);
                    ctx.lineTo(imgX, imgY + radius);
                    ctx.quadraticCurveTo(imgX, imgY, imgX + radius, imgY);
                    ctx.closePath();
                    ctx.clip();

                    // Draw the image inside the rounded area
                    ctx.drawImage(img, imgX, imgY, imgWidth, slotHeight);
                    ctx.restore();

                    loadedImages++;
                    if (loadedImages === currentSlot) {
                        const link = document.createElement('a');
                        link.download = 'photo-strip.png';
                        link.href = stripCanvas.toDataURL('image/png');
                        link.click();
                    }
                };
            }
        });
    };
});
