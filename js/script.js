        // !!! GANTI DENGAN URL WEB APP ANDA !!!
        const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzaQa_lbxl86f7n4h8QHcbHQ5CSrP0scgYfDaK1eKxw9jNdbKT4YR-FsqInzDI7-FqI/exec";
        // !!! GANTI USERNAME & REPO_NAME untuk preview URL !!!
        const githubUsername = "eprmod";
        const githubRepoName = "com";

        function generateRandomString(length = 6) {
            const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return result;
        }

        function addLink() {
            const longUrlInput = document.getElementById('longUrl');
            const shortCodeInput = document.getElementById('shortCode');
            const secretKeyInput = document.getElementById('secretKey');
            const resultDiv = document.getElementById('result');
            const shortUrlPreviewSpan = document.getElementById('shortUrlPreview');
            const serverResponseDiv = document.getElementById('server-response');

            const longUrl = longUrlInput.value.trim();
            let shortCode = shortCodeInput.value.trim();
            const secretKey = secretKeyInput.value.trim();

            // Reset tampilan hasil sebelumnya
            serverResponseDiv.textContent = '';
            serverResponseDiv.className = '';
            resultDiv.style.display = 'none';

            if (!longUrl || !secretKey) {
                alert('URL Panjang dan Kunci Rahasia tidak boleh kosong!');
                return;
            }
            try { new URL(longUrl); } catch (_) { alert('URL Panjang tidak valid.'); return; }

            if (!shortCode) {
                shortCode = generateRandomString();
                shortCodeInput.value = shortCode; // Update input field
            } else {
                shortCode = shortCode.replace(/[^a-zA-Z0-9-]/g, '');
                if (!shortCode) {
                    alert('Kode Pendek tidak valid. Gunakan huruf, angka, atau tanda hubung (-).');
                    return; // Jangan fallback, biar user perbaiki
                }
            }

            // Tampilkan preview
            const baseUrl = `https://${githubUsername}.github.io/${githubRepoName}/`;
            const finalShortUrl = baseUrl + shortCode;
            shortUrlPreviewSpan.textContent = finalShortUrl;
            resultDiv.style.display = 'block';
            serverResponseDiv.textContent = 'Mengirim data ke server...';

            // Data untuk dikirim ke Apps Script (POST)
            const postData = {
                secret: secretKey,
                shortCode: shortCode,
                longUrl: longUrl
            };

            // Kirim data ke Google Apps Script Web App (POST)
            fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'cors', // Diperlukan untuk cross-origin request
                cache: 'no-cache',
                // Penting: Redirect 'follow' mungkin tidak berfungsi seperti yang diharapkan
                // dengan Apps Script saat POST, 'manual' bisa membantu debug jika perlu
                redirect: 'follow',
                headers: {
                    // Tipe konten HARUS 'text/plain' untuk Apps Script doPost default
                    // meskipun kita mengirim JSON stringified. Apps Script akan parse.
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                // Kirim data sebagai string JSON
                body: JSON.stringify(postData)
            })
                .then(response => response.json()) // Harapkan JSON kembali dari Apps Script
                .then(data => {
                    console.log("Respons server:", data);
                    if (data && data.status === "success") {
                        serverResponseDiv.textContent = `Sukses: ${data.message}. Tautan ${finalShortUrl} seharusnya sudah aktif.`;
                        serverResponseDiv.className = 'success';
                        // Kosongkan input setelah berhasil
                        longUrlInput.value = '';
                        shortCodeInput.value = '';
                        secretKeyInput.value = ''; // Atau jangan kosongkan secret key
                    } else {
                        serverResponseDiv.textContent = `Gagal: ${data.message || 'Respons tidak dikenal.'}`;
                        serverResponseDiv.className = 'error';
                    }
                })
                .catch(error => {
                    console.error("Error saat POST ke Apps Script:", error);
                    serverResponseDiv.textContent = `Error jaringan atau script: ${error.message}`;
                    serverResponseDiv.className = 'error';
                });
        }
  
