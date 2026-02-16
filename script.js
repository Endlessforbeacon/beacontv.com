const channels = [
    { id: 1, name: "TVRI", logo: "Image/TVRI Logo.png", url: "https://ott-balancer.tvri.go.id/live/eds/Nasional/hls/Nasional.m3u8" },
    { id: 2, name: "Trans TV", logo: "Image/Trans TV Logo.jpg", url: "https://video.detik.com/transtv/smil:transtv.smil/chunklist_w2114898498_b744100_sleng.m3u8" },
    { id: 3, name: "MDTV", logo: "Image/Logo MDTV.jpg", url: "https://op-group1-swiftservehd-1.dens.tv/h/h223/01.m3u8" },
    { id: 4, name: "Trans 7", logo: "Image/Logo Trans 7.jpg", url: "https://video.detik.com/trans7/smil:trans7.smil/chunklist_w958793894_b744100_sleng.m3u8" },
    { id: 5, name: "JTV", logo: "Image/JTV Logo.png", url: "https://63b2dc7196c38.streamlock.net:1937/JTVSURABAYA/_definst_/myStream/chunklist_w1422371055.m3u8" },
    { id: 6, name: "Metro TV", logo: "Image/Metro TV Logo.jpg", url: "https://op-group1-swiftservehd-1.dens.tv/h/h12/02.m3u8" },
    { id: 7, name: "MNC TV", logo: "Image/Logo MNC TV.png", url: "http://202.80.222.171/000001/2/ch14041511111714365733/index.m3u8?virtualDomain=000001.live_hls.zte.com" },
    { id: 8, name: "TVRI World", logo: "Image/Logo TVRI World.png", url: "https://ott-balancer.tvri.go.id/live/eds/TVRIWorld/hls/TVRIWorld-avc1_500000=10001-mp4a_64000=20001.m3u8" },
    { id: 9, name: "Fajar TV", logo: "Image/Fajar TV Logo.jpg", url: "http://122.248.32.234:1935/ch27/myStream/live.m3u8" },
    { id: 10, name: "GTV", logo: "Image/GTV Logo.jpg", url: "https://1s1.rctiplus.id/anevia3/gtv-sdi-avc1_100000=10-mp4a_96000=1.m3u8?auth_key=1771165564-5503cb60f8966f99e384a33127c49b70-10463947-844352b8f5af04271ae9ba9d10822e1b" }
];

const video = document.getElementById('videoPlayer');
const errorScreen = document.getElementById('errorOverlay');
const listContainer = document.getElementById('channelList');
const titleDisplay = document.getElementById('currentChannelTitle');
const pipButton = document.getElementById('pipButton');
let hls = new Hls();

function loadStream(url, name) {
    titleDisplay.innerText = "Memuat: " + name;
    errorScreen.style.display = "none";
    video.style.display = "block";

    if (Hls.isSupported()) {
        hls.destroy();
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play();
            titleDisplay.innerText = name;
        });

        // DETEKSI JIKA CHANNEL MATI / HENGKANG
        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                showError();
            }
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.play();
        video.onerror = () => showError();
    }
}

function showError() {
    video.style.display = "none";
    errorScreen.style.display = "flex";
    titleDisplay.innerText = "Offline";
}

// Fitur Picture-in-Picture
pipButton.addEventListener('click', async () => {
    try {
        if (video !== document.pictureInPictureElement) {
            await video.requestPictureInPicture();
        } else {
            await document.exitPictureInPicture();
        }
    } catch (e) { console.error("PiP Error"); }
});

function renderChannels() {
    channels.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `<img src="${ch.logo}"><span>${ch.name}</span>`;
        card.onclick = () => {
            document.querySelectorAll('.channel-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            loadStream(ch.url, ch.name);
        };
        listContainer.appendChild(card);
    });
}

window.onload = () => {
    renderChannels();
    if (channels[0]) loadStream(channels[0].url, channels[0].name);
};