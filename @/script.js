const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('fileName');
const previewArea = document.getElementById('previewArea');
const statusMessage = document.getElementById('statusMessage');
const linkArea = document.getElementById('linkArea');
const shareableLinkInput = document.getElementById('shareableLink');
const copyButton = document.getElementById('copyButton');

// --- KONFIGURASI ---
// PASTE URL WEB APP GOOGLE APPS SCRIPT ANDA DI SINI
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxFYXqXJohUhNFx1AJWaXL0isMYEybV7MVJky5zd3RgEIoBH6sOVwd39mqvL85rStlE/exec';
// --- AKHIR KONFIGURASI ---

fileInput.addEventListener('change', handleFileSelect);
copyButton.addEventListener('click', copyLinkToClipboard);

if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL === 'https://script.google.com/macros/s/AKfycbxFYXqXJohUhNFx1AJWaXL0isMYEybV7MVJky5zd3RgEIoBH6sOVwd39mqvL85rStlE/exec') {
    setStatus('Kesalahan Konfigurasi: URL Google Apps Script belum diatur dalam script.js!', 'status-error');
    console.error("GAS_WEB_APP_URL needs to be set in script.js");
}

function handleFileSelect(event) {
    const file = event.target.files[0];

    if (!file) {
        fileNameDisplay.textContent = 'Belum ada file dipilih';
        clearPreview();
        hideLinkArea();
        setStatus('', '');
        return;
    }

    if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL === 'https://script.google.com/macros/s/AKfycbxFYXqXJohUhNFx1AJWaXL0isMYEybV7MVJky5zd3RgEIoBH6sOVwd39mqvL85rStlE/exec') {
         setStatus('Kesalahan Konfigurasi: URL Google Apps Script belum diatur!', 'status-error');
         return; // Jangan lanjutkan jika URL belum diatur
    }


    fileNameDisplay.textContent = file.name;
    displayPreview(file);
    uploadFileViaGAS(file); // Panggil fungsi baru
}

function displayPreview(file) {
    // (Kode displayPreview tetap sama seperti sebelumnya)
    clearPreview();
    const fileType = file.type;
    const reader = new FileReader();

    if (fileType.startsWith('image/')) {
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            previewArea.appendChild(img);
        }
        reader.readAsDataURL(file);
    } else if (fileType.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.controls = true;
        previewArea.appendChild(video);
    } else if (fileType.startsWith('audio/')) {
        const audio = document.createElement('audio');
        audio.src = URL.createObjectURL(file);
        audio.controls = true;
        previewArea.appendChild(audio);
    } else if (fileType === 'application/pdf') {
         const object = document.createElement('object');
         object.data = URL.createObjectURL(file);
         object.type = 'application/pdf';
         object.width = '100%';
         object.height = '300px';
         const fallbackText = document.createElement('p');
         fallbackText.textContent = 'Pratinjau PDF tidak didukung atau file rusak. ';
         const downloadLink = document.createElement('a');
         downloadLink.href = URL.createObjectURL(file);
         downloadLink.textContent = 'Unduh PDF';
         downloadLink.target = '_blank';
         fallbackText.appendChild(downloadLink);
         object.appendChild(fallbackText);
         previewArea.appendChild(object);
    } else {
        previewArea.innerHTML = `<p>Pratinjau tidak tersedia untuk tipe file ini (${fileType || 'tidak diketahui'}). Nama file: ${file.name}</p>`;
    }
}

function clearPreview() {
    // (Kode clearPreview tetap sama seperti sebelumnya)
    while (previewArea.firstChild) {
        const child = previewArea.firstChild;
        if (child.src && child.src.startsWith('blob:')) {
            URL.revokeObjectURL(child.src);
        }
         if (child.data && child.data.startsWith('blob:')) {
            URL.revokeObjectURL(child.data);
        }
        previewArea.removeChild(child);
    }
    previewArea.style.border = '1px dashed #ccc';
}

// Fungsi baru untuk mengunggah ke Google Apps Script
function uploadFileViaGAS(file) {
    setStatus('Mempersiapkan unggahan...', 'status-uploading');
    hideLinkArea();

    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const base64Data = e.target.result.split(',')[1]; // Ambil bagian base64 setelah koma

            setStatus('Mengunggah ke Google...', 'status-uploading');

            const payload = {
                filename: file.name,
                mimeType: file.type || 'application/octet-stream', // Default MIME type jika tidak ada
                base64Data: base64Data
            };

            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                // Penting: GAS doPost biasanya mengharapkan body sebagai string
                // dan tipe konten yang sesuai (bisa 'text/plain' atau biarkan default fetch
                // jika GAS bisa menangani application/json dari e.postData.contents)
                headers: {
                   // 'Content-Type': 'text/plain', // Coba ini jika application/json tidak bekerja
                   'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                 // mode: 'no-cors' // JANGAN gunakan no-cors, Anda perlu melihat responsnya
            });

            // Periksa status HTTP dulu
             if (!response.ok) {
                 // Coba baca pesan error dari server jika ada
                 let errorMsg = `Gagal mengunggah: Server GAS merespons dengan status ${response.status}`;
                 try {
                    // GAS biasanya mengembalikan JSON bahkan untuk error
                     const errorData = await response.json();
                     errorMsg = `Gagal mengunggah: ${errorData.error || response.statusText}`;
                 } catch (e) {
                     // Jika bukan JSON, coba baca sebagai teks
                     try {
                        const textError = await response.text();
                        if(textError) errorMsg = `Gagal mengunggah: ${textError}`;
                     } catch (e2) { /* Abaikan jika teks juga gagal dibaca */ }
                 }
                throw new Error(errorMsg);
            }

            // Jika response.ok, coba parse sebagai JSON
            const result = await response.json();

            if (result.success && result.url) {
                setStatus('Unggahan ke Google Drive berhasil!', 'status-success');
                shareableLinkInput.value = result.url;
                showLinkArea();
            } else {
                // Ambil pesan error dari respons JSON server GAS
                throw new Error(`Gagal mengunggah: ${result.error || 'Terjadi kesalahan yang tidak diketahui di server skrip.'}`);
            }

        } catch (error) {
            console.error('Error uploading file via GAS:', error);
            setStatus(`Kesalahan: ${error.message}`, 'status-error');
            hideLinkArea();
        }
    };

    reader.onerror = function(e) {
         console.error("FileReader error:", e);
         setStatus('Gagal membaca file di browser.', 'status-error');
         hideLinkArea();
    };

    // Baca file sebagai Data URL untuk mendapatkan Base64
    reader.readAsDataURL(file);
}


function setStatus(message, className) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${className}`;
}

function showLinkArea() {
    linkArea.style.display = 'block';
}

function hideLinkArea() {
    linkArea.style.display = 'none';
    shareableLinkInput.value = '';
}

function copyLinkToClipboard() {
    // (Kode copyLinkToClipboard tetap sama seperti sebelumnya)
    shareableLinkInput.select();
    shareableLinkInput.setSelectionRange(0, 99999);

    try {
        const successful = document.execCommand('copy');
        const msg = successful ? 'Tautan disalin!' : 'Gagal menyalin.';
        const originalButtonText = copyButton.textContent;
        copyButton.textContent = msg;
        setTimeout(() => {
            copyButton.textContent = originalButtonText;
        }, 1500);
    } catch (err) {
        console.error('Gagal menyalin:', err);
        alert('Maaf, browser Anda mungkin tidak mendukung penyalinan otomatis.');
         const originalButtonText = copyButton.textContent;
         copyButton.textContent = 'Gagal';
         setTimeout(() => {
             copyButton.textContent = originalButtonText;
         }, 1500);
    }
     window.getSelection().removeAllRanges();
}