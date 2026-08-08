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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// PATH GAMBAR WARNING PERINGATAN
const PATH_LICENSE_EXPIRED_IMAGE = "Image/Beacon TV Licensed Expired Warning.png";
const PATH_PROGRAM_RESTRICTED_IMAGE = "Image/Beacon TV Broadcast Rights Restrict Atau Geoblock Warning.png";

// DATA CHANNEL BEACON TV
const channels = [
    {
        name: "Endless For Beacon TV",
        url: "http://127.0.0.1:8000/stream/channels/1.m3u8",
        poster: "Image/Beacon TV Thumbnail/Endless For Beacon TV.png",
        isEndlessOwned: true,
        category: "official"
    },
    {
        name: "Beacon Hype",
        url: "https://k-s.tvri.go.id/live/tvri.m3u8",
        poster: "logo-tvri.jpg",
        isEndlessOwned: true,
        category: "official"
    },
    {
        name: "Endless For Beacon Sports Channel 1",
        url: "https://live.antaranews.com/hls/live.m3u8",
        poster: "logo-antara.jpg",
        isEndlessOwned: true,
        category: "official"
    },
    {
        name: "Beacon Sports Channel 2",
        url: "https://live.antaranews.com/hls/live.m3u8",
        poster: "logo-antara.jpg",
        isEndlessOwned: true,
        category: "official"
    },
    {
        name: "Endless For Beacon Music TV Channel",
        url: "https://live.antaranews.com/hls/live.m3u8",
        poster: "logo-antara.jpg",
        isEndlessOwned: true,
        category: "official"
    },
    {
        name: "Beacon Kids TV",
        url: "https://live.antaranews.com/hls/live.m3u8",
        poster: "logo-antara.jpg",
        isEndlessOwned: true,
        category: "official"
    },
    {
        name: "Endless For Beacon Movie & Drama",
        url: "https://live.antaranews.com/hls/live.m3u8",
        poster: "logo-antara.jpg",
        isEndlessOwned: true,
        category: "official"
    },
    {
        name: "TVRI",
        url: "https://ott-balancer.tvri.go.id/live/eds/Nasional/hls/Nasional-avc1_1500000=10000-mp4a_96000_eng=20000.m3u8",
        poster: "Image/Beacon TV Thumbnail/TVRI.png",
        isEndlessOwned: false,
        category: "national",
        expiryDate: "2027-01-01T00:00:00"
    },
    {
        name: "MDTV",
        url: "https://live.antaranews.com/hls/live.m3u8",
        poster: "Image/Beacon TV Thumbnail/MDTV.png",
        isEndlessOwned: false,
        category: "national",
        expiryDate: "2025-12-01T00:00:00"
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
const playerWatermark = document.getElementById('player-watermark');

let hls = null;
let plyrPlayer = null;
let selectedChannel = null;
let currentCategoryFilter = 'all';
let searchQuery = '';

// ==========================================
// 1. FITUR JAM 3 ZONA WAKTU INDONESIA
// ==========================================
function updateIndonesiaClocks() {
    const now = new Date();

    const optionsWib = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const optionsWita = { timeZone: 'Asia/Makassar', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const optionsWit = { timeZone: 'Asia/Jayapura', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

    document.getElementById('clock-wib').textContent = new Intl.DateTimeFormat('id-ID', optionsWib).format(now);
    document.getElementById('clock-wita').textContent = new Intl.DateTimeFormat('id-ID', optionsWita).format(now);
    document.getElementById('clock-wit').textContent = new Intl.DateTimeFormat('id-ID', optionsWit).format(now);
}

setInterval(updateIndonesiaClocks, 1000);
updateIndonesiaClocks();

// ==========================================
// 2. FIREBASE AUTH LOGIC & PROFIL KUSTOM
// ==========================================
const btnAuthAction = document.getElementById('btn-auth-action');
const tabLoginBtn = document.getElementById('tab-login-btn');
const tabRegisterBtn = document.getElementById('tab-register-btn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authAlert = document.getElementById('authAlert');

const updateProfileForm = document.getElementById('updateProfileForm');
const profileDisplayName = document.getElementById('profileDisplayName');
const profileEmail = document.getElementById('profileEmail');
const profileAvatarSeed = document.getElementById('profileAvatarSeed');
const profileAvatarPreview = document.getElementById('profileAvatarPreview');
const profileAlert = document.getElementById('profileAlert');
const btnModalLogout = document.getElementById('btn-modal-logout');

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
        openProfileModal();
    } else {
        const authModal = new bootstrap.Modal(document.getElementById('authModal'));
        authModal.show();
    }
});

function openProfileModal() {
    const user = auth.currentUser;
    if (!user) return;

    profileDisplayName.value = user.displayName || '';
    profileEmail.value = user.email || '';
    
    const avatarUrl = user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`;
    profileAvatarPreview.src = avatarUrl;
    
    profileAlert.classList.add('d-none');
    const userProfileModal = new bootstrap.Modal(document.getElementById('userProfileModal'));
    userProfileModal.show();
}

profileAvatarSeed.addEventListener('change', function() {
    const seed = this.value;
    profileAvatarPreview.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
});

updateProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const newName = profileDisplayName.value;
    const selectedSeed = profileAvatarSeed.value;
    const newAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedSeed}`;

    try {
        await updateProfile(user, {
            displayName: newName,
            photoURL: newAvatarUrl
        });

        showProfileAlert("Profil berhasil diperbarui!", "success");
        updateNavbarUserUI(user);

        setTimeout(() => {
            const modalEl = document.getElementById('userProfileModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        }, 1200);

    } catch (error) {
        showProfileAlert("Gagal memperbarui profil: " + error.message, "danger");
    }
});

btnModalLogout.addEventListener('click', async () => {
    try {
        await signOut(auth);
        const modalEl = document.getElementById('userProfileModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    } catch (error) {
        alert("Gagal keluar dari akun: " + error.message);
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${name.replace(/\s+/g, '')}`;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        await updateProfile(userCredential.user, { 
            displayName: name,
            photoURL: defaultAvatar
        });
        
        showAuthAlert("Akun berhasil dibuat!", "success");
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
        showAuthAlert("Berhasil masuk!", "success");
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
        updateNavbarUserUI(user);
    } else {
        btnAuthAction.className = "btn btn-danger btn-sm rounded-pill px-3 fw-bold";
        btnAuthAction.innerHTML = `<i class="fa-solid fa-right-to-bracket me-1"></i> Masuk`;
    }
});

function updateNavbarUserUI(user) {
    const name = user.displayName || user.email.split('@')[0];
    const avatar = user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`;

    btnAuthAction.className = "btn btn-outline-light btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-2";
    btnAuthAction.innerHTML = `
        <img src="${avatar}" class="rounded-circle" width="22" height="22" style="object-fit: cover;">
        <span>${name}</span>
    `;
}

function showAuthAlert(msg, type) {
    authAlert.className = `alert alert-${type} py-2 small fw-bold mb-3`;
    authAlert.textContent = msg;
    authAlert.classList.remove('d-none');
}

function showProfileAlert(msg, type) {
    profileAlert.className = `alert alert-${type} py-2 small fw-bold mb-3`;
    profileAlert.textContent = msg;
    profileAlert.classList.remove('d-none');
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
// 3. PENGECEKAN LISENSI & DETEKSI HAK SIAR/GEOBLOCK
// ==========================================
function isChannelLicenseValid(channel) {
    if (channel.isEndlessOwned) return true;
    if (!channel.expiryDate) return true;
    return new Date() < new Date(channel.expiryDate);
}

function isVisibleInList(channel) {
    if (channel.isEndlessOwned) return true;
    if (!channel.expiryDate) return true;
    const hideDate = new Date(new Date(channel.expiryDate).getTime() + (30 * 24 * 60 * 60 * 1000));
    return new Date() < hideDate;
}

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

    if (!isChannelLicenseValid(channel)) {
        showRestrictionScreen(PATH_LICENSE_EXPIRED_IMAGE);
        playTitle.textContent = "Saluran Non-Aktif (Izin Layanan Habis): " + channel.name;
        return;
    }

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
    if (playerWatermark) playerWatermark.style.display = 'none'; // Sembunyikan watermark saat blackout

    if (restrictionImage) { restrictionImage.src = imagePath; }
    blackoutOverlay.classList.remove('d-none');
    blackoutOverlay.classList.add('d-flex');
}

function hideRestrictionScreen() {
    blackoutOverlay.classList.remove('d-flex');
    blackoutOverlay.classList.add('d-none');
    if (playerWatermark) playerWatermark.style.display = 'block'; // Tampilkan kembali watermark
}

function startStream() {
    if (!selectedChannel || !isChannelLicenseValid(selectedChannel)) return;

    playTitle.textContent = "Sedang Memutar: " + selectedChannel.name;
    playOverlay.style.setProperty('display', 'none', 'important');

    if (hls) { hls.destroy(); hls = null; }

    if (Hls.isSupported()) {
        hls = new Hls({ manifestLoadingMaxRetry: 1, levelLoadingMaxRetry: 1, fragLoadingMaxRetry: 1 });
        hls.loadSource(selectedChannel.url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            hideRestrictionScreen();
            plyrPlayer.play();
        });

        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        const responseCode = data.response ? data.response.code : 0;
                        if ([0, 401, 403, 404].includes(responseCode)) {
                            hls.destroy();
                            hls = null;
                            showRestrictionScreen(PATH_PROGRAM_RESTRICTED_IMAGE);
                            playTitle.textContent = "Dibatasi Sementara (Program Hak Siar): " + selectedChannel.name;
                        } else {
                            hls.startLoad();
                        }
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        hls.recoverMediaError();
                        break;
                    default:
                        hls.destroy();
                        showRestrictionScreen(PATH_PROGRAM_RESTRICTED_IMAGE);
                        playTitle.textContent = "Dibatasi Sementara (Program Hak Siar): " + selectedChannel.name;
                        break;
                }
            }
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = selectedChannel.url;
        video.addEventListener('loadedmetadata', function() { plyrPlayer.play(); });
        video.onerror = function() {
            showRestrictionScreen(PATH_PROGRAM_RESTRICTED_IMAGE);
            playTitle.textContent = "Dibatasi Sementara (Program Hak Siar): " + selectedChannel.name;
        };
    }
}

// ==========================================
// 4. RENDER & FILTER DAFTAR SALURAN
// ==========================================
function initChannels() {
    channelsContainer.innerHTML = ''; 
    
    let filteredChannels = channels.filter(isVisibleInList);

    if (currentCategoryFilter === 'official') {
        filteredChannels = filteredChannels.filter(c => c.isEndlessOwned);
    } else if (currentCategoryFilter === 'national') {
        filteredChannels = filteredChannels.filter(c => !c.isEndlessOwned);
    }

    if (searchQuery.trim() !== '') {
        filteredChannels = filteredChannels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (filteredChannels.length === 0) {
        channelsContainer.innerHTML = `<div class="p-3 no-channel-msg text-center small">Tidak ada saluran TV yang ditemukan.</div>`;
        return;
    }

    filteredChannels.forEach((channel) => {
        const item = document.createElement('div');
        const isLicenseValid = isChannelLicenseValid(channel);
        
        item.className = `channel-item d-flex justify-content-between align-items-center ${!isLicenseValid ? 'expired-item' : ''} ${selectedChannel && selectedChannel.name === channel.name ? 'active' : ''}`;
        
        let badge = '';
        if (channel.isEndlessOwned) {
            badge = `<span class="badge bg-danger ms-2" style="font-size: 0.65rem;">OFFICIAL</span>`;
        } else if (!isLicenseValid) {
            badge = `<span class="badge bg-secondary ms-2" style="font-size: 0.65rem;">NON-AKTIF</span>`;
        }

        item.innerHTML = `
            <div class="d-flex align-items-center">
                <span>${channel.name}</span>
                ${badge}
            </div>
            <i class="fa-solid fa-tv text-muted fs-6"></i>
        `;
        
        item.addEventListener('click', function() {
            document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            prepareStream(channel);
        });

        channelsContainer.appendChild(item);
    });

    if (!selectedChannel && filteredChannels.length > 0) {
        prepareStream(filteredChannels[0]);
    }
}

document.getElementById('search-channel-input').addEventListener('input', function(e) {
    searchQuery = e.target.value;
    initChannels();
});

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.remove('active', 'btn-outline-danger');
            b.classList.add('btn-outline-secondary', 'text-light');
        });
        
        this.classList.add('active', 'btn-outline-danger');
        this.classList.remove('btn-outline-secondary', 'text-light');
        
        currentCategoryFilter = this.getAttribute('data-category');
        initChannels();
    });
});

// ==========================================
// 5. LAPORAN BUG & KENDALA (EMAILJS)
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
                { val: "search_error", text: "Pencarian Saluran Tidak Berfungsi" }
            ];
            bugOptions.forEach(opt => typeSelect.innerHTML += `<option value="${opt.val}">${opt.text}</option>`);

        } else if (category === 'stream_issue') {
            channelContainer.classList.remove('d-none');
            channelInput.value = selectedChannel ? selectedChannel.name : 'Tidak Ada Saluran Dipilih';

            const streamOptions = [
                { val: "stream_offline", text: "Siaran Terputus / Black Screen / Offline" },
                { val: "audio_issue", text: "Audio Mati / Suara Tidak Sinkron" },
                { val: "video_lag", text: "Video Lag / Buffering Terus-Menerus" }
            ];
            streamOptions.forEach(opt => typeSelect.innerHTML += `<option value="${opt.val}">${opt.text}</option>`);

        } else {
            channelContainer.classList.add('d-none');
            typeSelect.innerHTML += `<option value="general_feedback">Saran / Masukan Fitur</option>`;
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
        .then(function() {
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
        });
});

// INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
    initPlyr();
    initChannels();
    startStreamBtn.addEventListener('click', startStream);
});