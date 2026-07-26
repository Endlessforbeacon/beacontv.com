// Import Firebase SDK (Modular v10+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ==========================================
// KONFIGURASI FIREBASE BEACON TV
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAnVMmhW6_-gjFWZPYoFisoKXCM46qMb8c",
    authDomain: "beacon-tv-926fb.firebaseapp.com",
    projectId: "beacon-tv-926fb",
    storageBucket: "beacon-tv-926fb.firebasestorage.app",
    messagingSenderId: "372003061472",
    appId: "1:372003061472:web:d57dbec882701a41221a85"
};

// Inisialisasi Firebase Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ==========================================
// PATH GAMBAR WARNING PERINGATAN (DIPISAH)
// ==========================================
// 1. Gambar Peringatan Izin Hak Siar Terpisah / Expired (Permanent Notice)
const PATH_LICENSE_EXPIRED_IMAGE = "Image/Beacon TV Licensed Expired Warning.png";

// 2. Gambar Peringatan Saluran Sedang Menayangkan Program Hak Siar / Geoblock (Temporary Program Notice)
const PATH_PROGRAM_RESTRICTED_IMAGE = "Image/Beacon TV Broadcast Rights Restrict Atau Geoblock Warning.png";

// ==========================================
// DATA CHANNEL BEACON TV
// ==========================================
const channels = [
    {
        name: "Endless For Beacon TV",
        url: "http://127.0.0.1:8000/stream/channels/1.m3u8",
        poster: "Image/Beacon TV Thumbnail/Endless For Beacon TV.png",
        allowedCountries: ["ID"],
        isEndlessOwned: true,
        isProgramRestricted: false // Parameter program sementara
    },
    {
        name: "Beacon Hype",
        url: "https://k-s.tvri.go.id/live/tvri.m3u8",
        poster: "logo-tvri.jpg",
        allowedCountries: ["ID"],
        isEndlessOwned: true,
        isProgramRestricted: false
    },
    {
        name: "Endless For Beacon Sports Channel",
        url: "https://live.antaranews.com/hls/live.m3u8",
        poster: "logo-antara.jpg",
        allowedCountries: ["ID"],
        isEndlessOwned: true,
        isProgramRestricted: false
    },
    {
        name: "TVRI",
        url: "https://live.antaranews.com/hls/live.m3u8",
        poster: "Image/Beacon TV Thumbnail/TVRI.png",
        allowedCountries: ["ID"],
        isEndlessOwned: false,
        expiryDate: "2026-07-21T00:00:00",
        isProgramRestricted: false
    },
    {
        name: "MDTV",
        url: "https://live.antaranews.com/hls/live.m3u8",
        poster: "Image/Beacon TV Thumbnail/MDTV.png",
        allowedCountries: ["ID"],
        isEndlessOwned: false,
        expiryDate: "2027-12-31T00:00:00",
        isProgramRestricted: true // CONTOH: Sedang Menayangkan Program Ber-Hak Siar
    }
];

// DOM Elements
const video = document.getElementById('video-player');
const playTitle = document.getElementById('playing-title');
const channelsContainer = document.getElementById('channels-container');
const playOverlay = document.getElementById('play-overlay');
const blackoutOverlay = document.getElementById('blackout-overlay');
const restrictionImage = document.getElementById('restriction-image');
const startStreamBtn = document.getElementById('start-stream-btn');

let hls = null;
let plyrPlayer = null;
let selectedChannel = null;
let userCountry = "UNKNOWN";

// ==========================================
// 1. FIREBASE AUTH LOGIC
// ==========================================
const btnAuthAction = document.getElementById('btn-auth-action');
const tabLoginBtn = document.getElementById('tab-login-btn');
const tabRegisterBtn = document.getElementById('tab-register-btn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authAlert = document.getElementById('authAlert');

tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.classList.remove('d-none');
    registerForm.classList.add('d-none');
    authAlert.classList.add('d-none');
});

tabRegisterBtn.addEventListener('click', () => {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    registerForm.classList.remove('d-none');
    loginForm.classList.add('d-none');
    authAlert.classList.add('d-none');
});

btnAuthAction.addEventListener('click', () => {
    if (auth.currentUser) {
        if (confirm("Apakah Anda yakin ingin keluar dari akun Beacon TV?")) {
            signOut(auth);
        }
    } else {
        const authModal = new bootstrap.Modal(document.getElementById('authModal'));
        authModal.show();
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        showAuthAlert("Akun berhasil dibuat! Mengalihkan...", "success");
        setTimeout(() => {
            const modalEl = document.getElementById('authModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        }, 1500);

    } catch (error) {
        showAuthAlert(getFirebaseErrorMessage(error.code), "danger");
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showAuthAlert("Berhasil masuk! Selamat datang.", "success");
        setTimeout(() => {
            const modalEl = document.getElementById('authModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        }, 1500);

    } catch (error) {
        showAuthAlert(getFirebaseErrorMessage(error.code), "danger");
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        const name = user.displayName || user.email.split('@')[0];
        btnAuthAction.className = "btn btn-outline-light btn-sm rounded-pill px-3 fw-bold";
        btnAuthAction.innerHTML = `<i class="fa-solid fa-user-check text-success me-1"></i> ${name}`;
    } else {
        btnAuthAction.className = "btn btn-danger btn-sm rounded-pill px-3 fw-bold";
        btnAuthAction.innerHTML = `<i class="fa-solid fa-right-to-bracket me-1"></i> Masuk`;
    }
});

function showAuthAlert(msg, type) {
    authAlert.className = `alert alert-${type} py-2 small fw-bold mb-3`;
    authAlert.textContent = msg;
    authAlert.classList.remove('d-none');
}

function getFirebaseErrorMessage(code) {
    switch (code) {
        case 'auth/email-already-in-use': return 'Email ini sudah terdaftar.';
        case 'auth/invalid-email': return 'Format email tidak valid.';
        case 'auth/weak-password': return 'Kata sandi minimal 6 karakter.';
        case 'auth/invalid-credential': return 'Email atau kata sandi salah.';
        default: return 'Terjadi kesalahan. Silakan coba lagi.';
    }
}

// ==========================================
// 2. PENGECEKAN KELAYAKAN SIARAN (PEMISAHAN LOGIKA)
// ==========================================
// Pengecekan 1: Izin Hak Siar & Masa Penayangan Keseluruhan Saluran
function isChannelLicenseValid(channel) {
    if (channel.isEndlessOwned) return true;
    if (!channel.expiryDate) return true;

    const now = new Date();
    const expiry = new Date(channel.expiryDate);

    return now < expiry;
}

// Pengecekan 2: Apakah Saluran Sedang Menayangkan Program Terbatas (Program Hak Siar)
function isProgramRestricted(channel) {
    return channel.isProgramRestricted === true;
}

function isVisibleInList(channel) {
    if (channel.isEndlessOwned) return true;
    if (!channel.expiryDate) return true;

    const now = new Date();
    const expiry = new Date(channel.expiryDate);
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const hideDate = new Date(expiry.getTime() + thirtyDaysInMs);

    return now < hideDate;
}

// ==========================================
// 3. DETEKSI LOKASI IP (GEOBLOCKING)
// ==========================================
async function detectUserCountry() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        userCountry = data.country_code;
    } catch (error) {
        userCountry = "ID";
    }
}

// ==========================================
// 4. PLAYER & LOGIKA TAMPILAN KEDUA GAMBAR PERINGATAN
// ==========================================
function initPlyr() {
    plyrPlayer = new Plyr(video, {
        controls: ['play-large', 'play', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
        live: { showBadge: true }
    });
}

function prepareStream(channel) {
    selectedChannel = channel;

    if (hls) { hls.destroy(); hls = null; }
    if (plyrPlayer) { plyrPlayer.stop(); }
    video.removeAttribute('src');

    // -------------------------------------------------------------
    // KONDISI 1: Saluran Tidak Bisa Diakses Karena Perubahan Izin Hak Siar & Masa Penayangan Habis
    // -------------------------------------------------------------
    if (!isChannelLicenseValid(channel)) {
        showRestrictionScreen(PATH_LICENSE_EXPIRED_IMAGE);
        playTitle.textContent = "Saluran Non-Aktif (Izin Layanan Habis): " + channel.name;
        return;
    }

    // -------------------------------------------------------------
    // KONDISI 2: Saluran Tidak Bisa Diakses Sementara Karena Sedang Menayangkan Program Yang Bersifat Hak Siar ( / Geoblocking )
    // -------------------------------------------------------------
    const isGlobal = channel.allowedCountries.includes("ALL");
    const isCountryAllowed = channel.allowedCountries.includes(userCountry);

    if (isProgramRestricted(channel) || (!isGlobal && !isCountryAllowed)) {
        showRestrictionScreen(PATH_PROGRAM_RESTRICTED_IMAGE);
        playTitle.textContent = "Dibatasi Sementara (Program Hak Siar): " + channel.name;
        return;
    }

    // -------------------------------------------------------------
    // KONDISI 3: Normal Stream (Lolos Semua Pengecekan)
    // -------------------------------------------------------------
    hideRestrictionScreen();
    playTitle.textContent = "Saluran Terpilih: " + channel.name;

    if (channel.poster) {
        plyrPlayer.poster = channel.poster;
        video.poster = channel.poster;
    }

    video.load();
    playOverlay.style.setProperty('display', 'flex', 'important');
}

function showRestrictionScreen(imagePath) {
    playOverlay.style.setProperty('display', 'none', 'important');
    if (restrictionImage) {
        restrictionImage.src = imagePath;
    }
    blackoutOverlay.classList.remove('d-none');
    blackoutOverlay.classList.add('d-flex');
}

function hideRestrictionScreen() {
    blackoutOverlay.classList.remove('d-flex');
    blackoutOverlay.classList.add('d-none');
}

function startStream() {
    if (!selectedChannel || !isChannelLicenseValid(selectedChannel) || isProgramRestricted(selectedChannel)) return;

    playTitle.textContent = "Sedang Memutar: " + selectedChannel.name;
    playOverlay.style.setProperty('display', 'none', 'important');

    if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(selectedChannel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            plyrPlayer.play();
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = selectedChannel.url;
        video.addEventListener('loadedmetadata', function() {
            plyrPlayer.play();
        });
    }
}

// ==========================================
// 5. RENDER DAFTAR SALURAN
// ==========================================
function initChannels() {
    channelsContainer.innerHTML = ''; 
    const visibleChannels = channels.filter(isVisibleInList);

    if (visibleChannels.length === 0) {
        channelsContainer.innerHTML = `<div class="p-3 text-muted text-center">Tidak ada saluran yang tersedia saat ini.</div>`;
        return;
    }

    visibleChannels.forEach((channel) => {
        const item = document.createElement('div');
        const isLicenseValid = isChannelLicenseValid(channel);
        const isRestricted = isProgramRestricted(channel);
        
        item.className = `channel-item d-flex justify-content-between align-items-center ${(!isLicenseValid || isRestricted) ? 'expired-item' : ''}`;
        
        let badge = '';
        if (channel.isEndlessOwned) {
            badge = `<span class="badge bg-danger ms-2" style="font-size: 0.65rem;">OFFICIAL</span>`;
        } else if (!isLicenseValid) {
            badge = `<span class="badge bg-secondary ms-2" style="font-size: 0.65rem;">NON-AKTIF</span>`;
        } else if (isRestricted) {
            badge = `<span class="badge bg-warning text-dark ms-2" style="font-size: 0.65rem;">HAK SIAR</span>`;
        }

        item.innerHTML = `
            <div class="d-flex align-items-center">
                <span>${channel.name}</span>
                ${badge}
            </div>
            <i class="fa-solid fa-shield-cat text-muted fs-6"></i>
        `;
        
        item.addEventListener('click', function() {
            document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            prepareStream(channel);
        });

        channelsContainer.appendChild(item);
    });

    if (visibleChannels.length > 0) {
        channelsContainer.children[0].classList.add('active');
        prepareStream(visibleChannels[0]);
    }
}

// ==========================================
// 6. LAPORAN BUG & KENDALA (EMAILJS)
// ==========================================
function openReportModal() {
    const reportForm = document.getElementById('reportForm');
    const alertBox = document.getElementById('reportAlert');
    const typeSelect = document.getElementById('reportType');
    
    reportForm.reset();
    alertBox.classList.add('d-none');
    document.getElementById('channelSelectContainer').classList.add('d-none');
    
    document.querySelectorAll('.category-card').forEach(card => card.classList.remove('active'));
    document.getElementById('reportCategory').value = '';
    
    typeSelect.disabled = true;
    typeSelect.innerHTML = '<option value="" selected disabled>-- Pilih Kategori Di Atas Terlebih Dahulu --</option>';
    
    const reportModal = new bootstrap.Modal(document.getElementById('reportModal'));
    reportModal.show();
}

document.getElementById('btn-open-report').addEventListener('click', openReportModal);
document.getElementById('btn-report-channel').addEventListener('click', openReportModal);

document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', function() {
        document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        
        const category = this.getAttribute('data-category');
        document.getElementById('reportCategory').value = category;
        
        const typeSelect = document.getElementById('reportType');
        const channelContainer = document.getElementById('channelSelectContainer');
        const channelInput = document.getElementById('reportChannelName');

        typeSelect.disabled = false;
        typeSelect.innerHTML = '<option value="" selected disabled>-- Pilih Jenis Kendala --</option>';

        if (category === 'system_bug') {
            channelContainer.classList.add('d-none');
            const bugOptions = [
                { val: "ui_broken", text: "Tampilan / Layout Website Rusak" },
                { val: "button_not_working", text: "Fitur / Tombol Tidak Mau Diklik" },
                { val: "search_error", text: "Pencarian Saluran Tidak Berfungsi" },
                { val: "player_controls_bug", text: "Kontrol Player Error" }
            ];
            bugOptions.forEach(opt => typeSelect.innerHTML += `<option value="${opt.val}">${opt.text}</option>`);

        } else if (category === 'stream_issue') {
            channelContainer.classList.remove('d-none');
            channelInput.value = selectedChannel ? selectedChannel.name : 'Tidak Ada Saluran Dipilih';

            const streamOptions = [
                { val: "stream_offline", text: "Siaran Terputus / Black Screen / Offline" },
                { val: "audio_issue", text: "Audio Mati / Suara Tidak Sinkron" },
                { val: "video_lag", text: "Video Lag / Buffering Terus-Menerus" },
                { val: "wrong_stream", text: "Acara Tidak Sesuai Nama Saluran" }
            ];
            streamOptions.forEach(opt => typeSelect.innerHTML += `<option value="${opt.val}">${opt.text}</option>`);

        } else {
            channelContainer.classList.add('d-none');
            typeSelect.innerHTML += `<option value="general_feedback">Saran / Masukan Fitur</option>`;
            typeSelect.innerHTML += `<option value="other">Lain-lain</option>`;
        }
    });
});

document.getElementById('reportForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const btnSubmit = document.getElementById('btnSubmitReport');
    const alertBox = document.getElementById('reportAlert');

    const category = document.getElementById('reportCategory').value;
    const typeSelect = document.getElementById('reportType');
    const typeText = typeSelect.options[typeSelect.selectedIndex] ? typeSelect.options[typeSelect.selectedIndex].text : '-';
    const description = document.getElementById('reportDescription').value;
    const channelName = document.getElementById('reportChannelName').value || 'Tidak Ada (Bug System)';
    const userEmail = (auth && auth.currentUser) ? auth.currentUser.email : 'Guest (Pengguna Tanpa Login)';

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Mengirim Laporan...`;

    const templateParams = {
        category: category === 'system_bug' ? 'Bug System' : (category === 'stream_issue' ? 'Kendala TV' : 'Lainnya'),
        type: typeText,
        channel_name: channelName,
        description: description,
        user_email: userEmail,
        report_time: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' }) + ' WITA'
    };

    emailjs.send('service_ulavdup', 'template_qky3acq', templateParams)
        .then(function(response) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Kirim Laporan`;

            alertBox.className = "alert alert-success py-2 small fw-bold";
            alertBox.textContent = "Laporan berhasil terkirim! Tim Beacon TV Support akan segera menindaklanjuti.";
            alertBox.classList.remove('d-none');

            setTimeout(() => {
                const modalEl = document.getElementById('reportModal');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();
            }, 1800);

        }, function(error) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Kirim Laporan`;

            alertBox.className = "alert alert-danger py-2 small fw-bold";
            alertBox.textContent = "Gagal mengirim laporan. Silakan coba beberapa saat lagi.";
            alertBox.classList.remove('d-none');
            console.error('EmailJS Error:', error);
        });
});

// ==========================================
// 7. INITIALIZATION ON LOAD
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
    initPlyr();
    await detectUserCountry();
    initChannels();
    startStreamBtn.addEventListener('click', startStream);
});

setInterval(() => {
    if (selectedChannel && !selectedChannel.isEndlessOwned) {
        if (!isChannelLicenseValid(selectedChannel) || isProgramRestricted(selectedChannel)) {
            prepareStream(selectedChannel);
        }
    }
}, 5000);