// 1. Daftar Channel
const channels = [
    {
        id: 1,
        name: "TVRI",
        logo: "Image/TVRI Logo.png",
        url: "https://ott-balancer.tvri.go.id/live/eds/Nasional/hls/Nasional.m3u8"
    },
    {
        id: 2,
        name: "Trans TV",
        logo: "Image/Trans TV Logo.jpg",
        url: "https://video.detik.com/transtv/smil:transtv.smil/chunklist_w2114898498_b744100_sleng.m3u8"
    },
    {
        id: 3,
        name: "MDTV",
        logo: "Image/Logo MDTV.jpg",
        url: "https://op-group1-swiftservehd-1.dens.tv/h/h223/01.m3u8"
    },
    {
        id: 4,
        name: "Trans 7",
        logo: "Image/Logo Trans 7.jpg",
        url: "https://video.detik.com/trans7/smil:trans7.smil/chunklist_w958793894_b744100_sleng.m3u8"
    },
    {
        id: 5,
        name: "JTV",
        logo: "Image/JTV Logo.png",
        url: "https://63b2dc7196c38.streamlock.net:1937/JTVSURABAYA/_definst_/myStream/chunklist_w1977479031.m3u8" // Trigger Peringatan Gambar
    }
];

const videoElement = document.getElementById('videoPlayer');
const channelListContainer = document.getElementById('channelList');
const titleElement = document.getElementById('currentChannelTitle');
const alertOverlay = document.getElementById('alertOverlay');
let hls = new Hls();

// 2. Fungsi Streaming
function loadStream(url, name) {
    titleElement.innerText = "Memuat: " + name;
    if (Hls.isSupported()) {
        hls.destroy();
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            videoElement.play();
            titleElement.innerText = name;
        });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = url;
        videoElement.play();
    }
}

// 3. Fungsi Overlay
function showAlert() { alertOverlay.style.display = "flex"; }
function closeAlert() { alertOverlay.style.display = "none"; }

// 4. Inisialisasi Sidebar
function displayChannels() {
    channels.forEach((ch) => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        if (ch.url === "") card.style.opacity = "0.6";

        card.innerHTML = `<img src="${ch.logo}" alt="${ch.name}"><span>${ch.name}</span>`;

        card.addEventListener('click', () => {
            if (ch.url === "") {
                showAlert();
            } else {
                document.querySelectorAll('.channel-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                loadStream(ch.url, ch.name);
            }
        });
        channelListContainer.appendChild(card);
    });
}

window.onload = () => {
    displayChannels();
    if (channels.length > 0 && channels[0].url !== "") {
        loadStream(channels[0].url, channels[0].name);
        document.querySelector('.channel-card').classList.add('active');
    }
};