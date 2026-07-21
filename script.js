// DATA CHANNEL TV
const channels = [
    {
        name: "Endless For Beacon TV",
        url: "http://127.0.0.1:8000/stream/channels/1.m3u8",
        poster: "Image/Beacon TV Thumbnail/Endless For Beacon TV.png",
        allowedCountries: ["ID"]
    },
    {
        name: "Beacon Hype",
        url: "https://k-s.tvri.go.id/live/tvri.m3u8",
        poster: "logo-tvri.jpg",
        allowedCountries: ["ID"]
    },
    {
        name: "Endless For Beacon Sports Channel",
        url: "https://live.antaranews.com/hls/live.m3u8",
        poster: "logo-antara.jpg",
        allowedCountries: ["ID"]
    },
    {
        name: "Endless For Beacon Music Channels",
        url: "https://live.antaranews.com/hls/live.m3u8",
        poster: "logo-antara.jpg",
        allowedCountries: ["ID"]
    },
    {
        name: "Beacon Sports Channel 2",
        url: "https://live.antaranews.com/hls/live.m3u8",
        poster: "logo-antara.jpg",
        allowedCountries: ["ID"]
    },
    {
        name: "Endless For Beacon Food & Travel Time",
        url: "https://live.antaranews.com/hls/live.m3u8",
        poster: "logo-antara.jpg",
        allowedCountries: ["ID"]
    },
    {
        name: "Beacon Super Basket TV",
        url: "https://live.antaranews.com/hls/live.m3u8",
        poster: "logo-antara.jpg",
        allowedCountries: ["ID"]
    },
    {
        name: "Endless For Beacon Drama & Movies",
        url: "https://live.antaranews.com/hls/live.m3u8",
        poster: "logo-antara.jpg",
        allowedCountries: ["ID"]
    },
];

// Elemen DOM
const video = document.getElementById('video-player');
const playTitle = document.getElementById('playing-title');
const channelsContainer = document.getElementById('channels-container');
const playOverlay = document.getElementById('play-overlay');
const blackoutOverlay = document.getElementById('blackout-overlay');
const startStreamBtn = document.getElementById('start-stream-btn');

const restrictionTitle = document.getElementById('restriction-title');
const restrictionReason = document.getElementById('restriction-reason');
const restrictionCode = document.getElementById('restriction-code');

let hls = null;
let plyrPlayer = null;
let selectedChannel = null;
let userCountry = "UNKNOWN";

// ==========================================
// 1. SISTEM DETEKSI OTOMATIS HAK SIAR (MANIFEST SCANNER)
// ==========================================
async function scanHLSManifestForRights(streamUrl) {
    // Kata kunci penanda hak siar di dalam file manifest HLS/SCTE-35
    const copyrightMarkers = [
        "EXT-X-CUE-OUT",      // Penanda resmi SCTE-35 Siaran Dibatasi/Iklan Terikat
        "EXT-OATCLS-SCTE35",  // SCTE-35 Broadcast Tag
        "BLACKOUT=YES",       // Tag khusus streaming CDN
        "RESTRICTED",         // Tag Restriksi
        "RIGHTS_BLOCKED"
    ];

    const sportsKeywords = [
        "MATCH", "LEAGUE", "CHAMPIONSHIP", "WORLD-CUP", "OLYMPICS", "PREMIER-LEAGUE"
    ];

    try {
        const response = await fetch(streamUrl);
        if (!response.ok) return { isBlocked: false };

        const manifestText = await response.text();
        const upperManifest = manifestText.toUpperCase();

        // 1. Cek SCTE-35 / Marker Siaran Terikat
        const hasSCTE35Marker = copyrightMarkers.some(marker => upperManifest.includes(marker));
        if (hasSCTE35Marker) {
            return {
                isBlocked: true,
                reason: "Sistem mendeteksi SCTE-35 Digital Cue-Out (Sinyal otomatis pemblokiran hak siar dari stasiun TV).",
                code: "SCTE35-AUTO-BLACKOUT"
            };
        }

        // 2. Cek Kata Kunci Sensitif pada URL / Segment Manifest
        const hasSportsKeyword = sportsKeywords.some(keyword => upperManifest.includes(keyword));
        if (hasSportsKeyword) {
            return {
                isBlocked: true,
                reason: "Aliran data video teridentifikasi mengandung segmen program olahraga/film ber-hak siar.",
                code: "STREAM-KEYWORD-BLACKOUT"
            };
        }

        return { isBlocked: false };

    } catch (error) {
        console.warn("Pemeriksaan otomatis manifest gagal (CORS/Network), meloloskan ke player:", error);
        return { isBlocked: false };
    }
}

// ==========================================
// 2. DETEKSI LOKASI IP (GEOBLOCKING)
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
// 3. INISIALISASI PLYR
// ==========================================
function initPlyr() {
    plyrPlayer = new Plyr(video, {
        controls: ['play-large', 'play', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
        live: { showBadge: true }
    });
}

// ==========================================
// 4. PERSIAPAN STREAM & EKSEKUSI PEMERIKSAAN
// ==========================================
async function prepareStream(channel) {
    selectedChannel = channel;
    playTitle.textContent = "Memeriksa Keamanan Siaran: " + channel.name + "...";

    if (hls) { hls.destroy(); hls = null; }
    if (plyrPlayer) { plyrPlayer.stop(); }
    video.removeAttribute('src');

    // === PENGECEKAN 1: GEOBLOCKING ===
    const isGlobal = channel.allowedCountries.includes("ALL");
    const isCountryAllowed = channel.allowedCountries.includes(userCountry);

    if (!isGlobal && !isCountryAllowed) {
        showRestrictionScreen(
            "Akses Wilayah Dibatasi",
            `Mohon maaf, siaran ${channel.name} tidak dapat diputar di wilayah/negara Anda (${userCountry}).`,
            "BEACON-GEOBLOCK-403"
        );
        return;
    }

    // === PENGECEKAN 2: OTOMATIS SCAN MANIFEST HLS / SCTE-35 ===
    const autoRightsCheck = await scanHLSManifestForRights(channel.url);

    if (autoRightsCheck.isBlocked) {
        showRestrictionScreen(
            "Program Dibatasi Otomatis",
            `Saluran ${channel.name} tidak dapat diputar. ${autoRightsCheck.reason}`,
            autoRightsCheck.code
        );
        playTitle.textContent = "Saluran Terpilih: " + channel.name + " (Terikat Hak Siar)";
        return;
    }

    // Lolos Semua Pengecekan
    hideRestrictionScreen();
    playTitle.textContent = "Saluran Terpilih: " + channel.name;

    if (channel.poster) {
        plyrPlayer.poster = channel.poster;
        video.poster = channel.poster;
    }

    video.load();
    playOverlay.style.setProperty('display', 'flex', 'important');
}

function showRestrictionScreen(title, reason, code) {
    playOverlay.style.setProperty('display', 'none', 'important');
    restrictionTitle.textContent = title;
    restrictionReason.textContent = reason;
    restrictionCode.textContent = code;
    blackoutOverlay.classList.remove('d-none');
    blackoutOverlay.classList.add('d-flex');
}

function hideRestrictionScreen() {
    blackoutOverlay.classList.remove('d-flex');
    blackoutOverlay.classList.add('d-none');
}

// ==========================================
// 5. JALANKAN STREAMING & REAL-TIME EVENT LISTENER
// ==========================================
function startStream() {
    if (!selectedChannel) return;

    playTitle.textContent = "Sedang Memutar: " + selectedChannel.name;
    playOverlay.style.setProperty('display', 'none', 'important');

    const url = selectedChannel.url;

    if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            plyrPlayer.play();
        });

        // DETEKSI REAL-TIME: Jika saat ditonton mendadak ada sinyal Blackout SCTE-35
        hls.on(Hls.Events.FRAG_PARSED, function(event, data) {
            if (data.frag && data.frag.tagList) {
                const tags = JSON.stringify(data.frag.tagList).toUpperCase();
                if (tags.includes("EXT-X-CUE-OUT") || tags.includes("BLACKOUT")) {
                    hls.stopLoad();
                    plyrPlayer.stop();
                    showRestrictionScreen(
                        "Program Dibatasi Otomatis",
                        "Siaran mendadak dibatasi secara otomatis karena stasiun TV mulai menayangkan program ber-hak siar.",
                        "REALTIME-SCTE35-BLACKOUT"
                    );
                }
            }
        });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', function() {
            plyrPlayer.play();
        });
    }
}

// ==========================================
// 6. RENDER MENU SIDEBAR
// ==========================================
function initChannels() {
    channelsContainer.innerHTML = ''; 

    channels.forEach((channel, index) => {
        const item = document.createElement('div');
        item.className = 'channel-item d-flex justify-content-between align-items-center';
        item.innerHTML = `<span>${channel.name}</span> <i class="fa-solid fa-shield-cat text-muted fs-6" title="Auto Protection Enabled"></i>`;
        item.setAttribute('data-index', index);
        
        item.addEventListener('click', function() {
            document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            prepareStream(channel);
        });

        channelsContainer.appendChild(item);
    });

    if (channels.length > 0) {
        channelsContainer.children[0].classList.add('active');
        prepareStream(channels[0]);
    }
}

window.onload = async function() {
    initPlyr();
    await detectUserCountry();
    initChannels();
    startStreamBtn.addEventListener('click', startStream);
};