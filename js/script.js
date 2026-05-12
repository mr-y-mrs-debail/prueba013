import { searchPrincipal } from './search.js';
import { allMusic } from './music-list.js';

window.allMusic = allMusic;

const colorThief = new ColorThief();
const rgbToCss = (rgb) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

const wrapper = document.querySelector(".wrapper");
const imgArea = document.querySelector(".img-area");
const musicImg = imgArea.querySelector("img");
const deviceDisplay = wrapper.querySelector(".device-display");
export const musicName = wrapper.querySelector(".song-details .name");
export const musicArtist = wrapper.querySelector(".song-details .artist");
const playPauseBtn = wrapper.querySelector(".play-pause");
const prevBtn = document.querySelector("#prev");
const nextBtn = document.querySelector("#next");
const mainAudio = wrapper.querySelector("#main-audio");
const progressArea = document.querySelector(".progress-area");
const progressBar = progressArea.querySelector(".progress-bar");
const repeatBtn = document.querySelector("#repeat-plist");
export const ulTag = wrapper.querySelector("ul");

const spinnerHtml = `<div class="loading-spinner"><div class="loader"></div></div>`;
imgArea.insertAdjacentHTML('beforeend', spinnerHtml); 

function showLoadingSpinner() {
    imgArea.classList.remove("loaded", "playing");
}

function hideLoadingSpinner() {
    imgArea.classList.add("loaded");
    if (!mainAudio.paused) imgArea.classList.add("playing");
}

window.addEventListener("load", () => {
    if (isShuffle) shuffleMusicInitial();
    loadMusic(musicIndex);
    
    if (deviceDisplay) deviceDisplay.textContent = "PC"; 
});


export let musicIndex = Math.floor(Math.random() * window.allMusic.length);
let isShuffle = true;
let shuffledPlaylist = [];

export function updatePlayerColor() {
    if (!wrapper || !musicImg) return;
    
    if (musicImg.complete && musicImg.naturalHeight !== 0) {
        try {
            const colorPalette = colorThief.getPalette(musicImg, 3);
            const dominantColor = colorPalette[0];
            
            wrapper.style.setProperty('--dominant-color', rgbToCss(dominantColor));
            wrapper.style.setProperty('--secondary-color', rgbToCss(colorPalette[1] || dominantColor));
            wrapper.style.setProperty('--tertiary-color', rgbToCss(colorPalette[2] || dominantColor));
            
            const brightness = (dominantColor[0] * 299 + dominantColor[1] * 587 + dominantColor[2] * 114) / 1000;
            wrapper.style.color = brightness > 150 ? '#000' : '#fff';
            
        } catch (e) {
            console.error("Error paleta:", e);
        }
    } else {
        musicImg.addEventListener('load', updatePlayerColor, { once: true });
    }
}

export function playMusic() {
    if (mainAudio.src && mainAudio.paused) {
        wrapper.classList.remove("paused");
        playPauseBtn.querySelector("i").className = "bi bi-pause-fill";

        mainAudio.play().then(() => {
            imgArea.classList.add("playing");
            if (navigator.mediaSession) navigator.mediaSession.playbackState = 'playing';
        }).catch(error => console.error("Error en reproducción:", error));
    }
}

export function pauseMusic() {
    if (!mainAudio.paused) {
        wrapper.classList.add("paused");
        playPauseBtn.querySelector("i").className = "bi bi-play-fill";
        mainAudio.pause();
        imgArea.classList.remove("playing");
        if (navigator.mediaSession) navigator.mediaSession.playbackState = 'paused';
    }
}

export function playPauseMusic() {
    mainAudio.paused ? playMusic() : pauseMusic();
}

export function loadMusic(index) { 
    showLoadingSpinner();
    const song = allMusic[index];
    
    const formattedName = song.name.replace(/ - /g, ' <br> ');
    musicName.innerHTML = formattedName;
    musicArtist.innerText = song.artist;
    musicImg.src = `img/${song.img}.jpg`;
    
    mainAudio.src = `music/${song.src}.mp3`;
    mainAudio.load(); 

    updateMediaSession(song);
    localStorage.setItem('lastMusicIndex', index);
    
    updatePlayerColor();
}

export function setMusicAndPlay(index) {
    musicIndex = index;
    loadMusic(musicIndex);
    playMusic();
}

function nextMusic() {
    if (repeatBtn.getAttribute("title") === "Song looped") {
        mainAudio.currentTime = 0;
        playMusic();
        return;
    }
    if (isShuffle) {
        const currentPos = shuffledPlaylist.findIndex(song => song.src === allMusic[musicIndex].src);
        let nextPos = (currentPos + 1) % shuffledPlaylist.length;
        musicIndex = allMusic.findIndex(song => song.src === shuffledPlaylist[nextPos].src);
    } else {
        musicIndex = (musicIndex + 1) % allMusic.length;
    }
    setMusicAndPlay(musicIndex);
}

function prevMusic() {
    if (isShuffle) {
        const currentPos = shuffledPlaylist.findIndex(song => song.src === allMusic[musicIndex].src);
        let prevPos = (currentPos - 1 + shuffledPlaylist.length) % shuffledPlaylist.length;
        musicIndex = allMusic.findIndex(song => song.src === shuffledPlaylist[prevPos].src);
    } else {
        musicIndex = (musicIndex - 1 + allMusic.length) % allMusic.length;
    }
    setMusicAndPlay(musicIndex);
}

function shuffleMusicInitial() {
    shuffledPlaylist = [...allMusic];
    for (let i = shuffledPlaylist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPlaylist[i], shuffledPlaylist[j]] = [shuffledPlaylist[j], shuffledPlaylist[i]];
    }
}

playPauseBtn.addEventListener("click", () => playPauseMusic());
nextBtn.addEventListener("click", () => nextMusic());
prevBtn.addEventListener("click", () => prevMusic());

mainAudio.addEventListener("timeupdate", (e) => {
    const { currentTime, duration } = e.target;
    if (duration) {
        let progressWidth = (currentTime / duration) * 100;
        progressBar.style.width = `${progressWidth}%`;
        
        const currentElem = wrapper.querySelector(".current-time");
        let min = Math.floor(currentTime / 60);
        let sec = Math.floor(currentTime % 60);
        if (currentElem) currentElem.innerText = `${min}:${sec < 10 ? '0'+sec : sec}`;
    }
});

progressArea.addEventListener("click", (e) => {
    let progressWidth = progressArea.clientWidth;
    let clickedOffsetX = e.offsetX;
    mainAudio.currentTime = (clickedOffsetX / progressWidth) * mainAudio.duration;
    playMusic();
});

mainAudio.addEventListener("ended", () => nextMusic());


repeatBtn.addEventListener("click", () => {
    // cambio
    let mode = repeatBtn.dataset.mode || "Modo aleatorio"; 
    
    switch(mode) {
        case "Modo aleatorio":
            repeatBtn.className = "bi bi-arrow-left-right active"; // cambio
            repeatBtn.dataset.mode = "Lista en bucle";
            showToast("Lista en bucle"); 
            isShuffle = false;
            break;
        case "Lista en bucle": 
            repeatBtn.className = "bi bi-repeat-1 active";
            repeatBtn.dataset.mode = "Canción en bucle";
            showToast("Canción en bucle");
            isShuffle = false;
            break;
        default:
            repeatBtn.className = "bi bi-shuffle active";
            repeatBtn.dataset.mode = "Modo aleatorio";
            showToast("Modo aleatorio");
            isShuffle = true;
            shuffleMusicInitial();
            break;
    }
});

function showToast(message) {
    let toast = document.getElementById("toast-container");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-container";
        document.body.appendChild(toast);
    }
    
    // agregado
    toast.classList.remove("show");
    void toast.offsetWidth;
    
    toast.innerText = message;
    toast.classList.add("show");

    if (toast.timeout) clearTimeout(toast.timeout);
    
    toast.timeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}

const updateMediaSession = (song) => {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.name,
            artist: song.artist,
            artwork: [{ src: `img/${song.img}.jpg`, sizes: '512x512', type: 'image/jpg' }]
        });
        navigator.mediaSession.setActionHandler('play', playMusic);
        navigator.mediaSession.setActionHandler('pause', pauseMusic);
        navigator.mediaSession.setActionHandler('nexttrack', nextMusic);
        navigator.mediaSession.setActionHandler('previoustrack', prevMusic);
    }
};

window.addEventListener("load", () => {
    if (isShuffle) shuffleMusicInitial();
    loadMusic(musicIndex);
});

musicImg.onload = () => {
    hideLoadingSpinner();
    updatePlayerColor();
};

mainAudio.onwaiting = () => showLoadingSpinner();
mainAudio.oncanplay = () => hideLoadingSpinner();

window.playMusic = playMusic;
window.pauseMusic = pauseMusic;
window.setMusicAndPlay = setMusicAndPlay;
window.updatePlayerColor = updatePlayerColor;

//colores img__________________________________________________________________________________________________________________-




const likeCheckbox = document.getElementById("like-checkbox");
const dislikeCheckbox = document.getElementById("dislike-checkbox");

const heartOutline = document.querySelector(".heart-container .svg-outline");
const heartFilled = document.querySelector(".heart-container .svg-filled");

const thumbRegular = document.querySelector(".dislike-container .dislike-empty");
const thumbSolid = document.querySelector(".dislike-container .dislike-filled");

function updateLikeDislikeButtons(liked, disliked) {
    if (likeCheckbox) likeCheckbox.checked = liked;
    if (dislikeCheckbox) dislikeCheckbox.checked = disliked;

    if (heartOutline && heartFilled) {
        heartOutline.style.display = liked ? "none" : "block";
        heartFilled.style.display = liked ? "block" : "none";
        
        if (liked) {
            heartFilled.style.fill = "#ff4757";
            heartFilled.classList.add('animate-heart'); 
        } else {
            heartFilled.classList.remove('animate-heart');
        }
    }

    if (thumbRegular && thumbSolid) {
        if (disliked) {
            thumbRegular.style.opacity = "0";
            thumbSolid.style.opacity = "1";
            thumbSolid.style.display = "block";
            thumbSolid.classList.add('animate-dislike');
        } else {
            thumbRegular.style.opacity = "1";
            thumbSolid.style.opacity = "0";
            thumbSolid.classList.remove('animate-dislike');
            setTimeout(() => {
                if (!dislikeCheckbox.checked) thumbSolid.style.display = "none";
            }, 200);
        }
    }
}

function handleLike() {
    const isCurrentlyLiked = likeCheckbox ? likeCheckbox.checked : false;
    updateLikeDislikeButtons(!isCurrentlyLiked, false);
}

function handleDislike() {
    const isCurrentlyDisliked = dislikeCheckbox ? dislikeCheckbox.checked : false;
    updateLikeDislikeButtons(false, !isCurrentlyDisliked);
}

document.querySelector(".heart-container")?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLike();
});

document.querySelector(".dislike-container")?.addEventListener('click', (e) => {
    if(e.target.type === 'checkbox') return;
    
    e.preventDefault();
    e.stopPropagation();
    handleDislike();
});

function loadInitialLikesDislikes(songId) {
    updateLikeDislikeButtons(false, false);
}


function removeAccents(str) {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}





const alphabet = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];
const backToAlphabetBtn = document.getElementById('back-to-alphabet');
const alphabetListDiv = document.querySelector(".alphabet-list");
const songListUl = document.getElementById("playlist"); 
const musicListDiv = document.querySelector(".music-list");
const moreMusicBtn = document.getElementById("more-music");
const closeMoreMusic = document.getElementById("close");

let lastActiveAlphabetA = null;

function updatePlayingSong() {
    const currentSong = allMusic[musicIndex];
    if (!currentSong) return;

    const allLi_ulTag = ulTag.querySelectorAll("li");
    allLi_ulTag.forEach(li => {
        li.classList.remove("playing");
        const span = li.querySelector("span");
        const p = li.querySelector("p");
        if (span) span.style.fontWeight = "normal";
        if (p) p.style.fontWeight = "normal";
    });

    const currentLi_ulTag = ulTag.querySelector(`li[li-index="${musicIndex + 1}"]`);
    if (currentLi_ulTag) {
        currentLi_ulTag.classList.add("playing");
        const span = currentLi_ulTag.querySelector("span");
        if (span) span.style.fontWeight = "bold";
    }

    const allLi_songList = songListUl.querySelectorAll("li");
    allLi_songList.forEach(li => {
        li.classList.remove("playing");
        const span = li.querySelector("span");
        if (span) {
            span.style.fontWeight = "normal";
            span.style.color = "";
        }
    });

    const currentLi_songListUl = songListUl.querySelector(`li[li-index="${musicIndex + 1}"]`);
    if (currentLi_songListUl && songListUl.style.display === "block") {
        currentLi_songListUl.classList.add("playing");
        const span = currentLi_songListUl.querySelector("span");
        if (span) {
            span.style.fontWeight = "bold";
            span.style.color = 'var(--secondary-color)'; 
        }
    }

    if (lastActiveAlphabetA) {
        lastActiveAlphabetA.classList.remove("active-letter");
    }

    const alphabetElement = document.getElementById('alphabet');
    if (alphabetElement && currentSong.name) {
        const firstChar = removeAccents(currentSong.name).charAt(0).toUpperCase();
        const currentSongInitial = (firstChar >= 'A' && firstChar <= 'Z') ? firstChar : '#';
        
        const currentLetterItem = alphabetElement.querySelector(`.alphabet-item[data-letter="${currentSongInitial}"]`);
        if (currentLetterItem) {
            currentLetterItem.classList.add("active-letter");
            lastActiveAlphabetA = currentLetterItem;
        }
    }
}

function loadAlphabet() {
    const alphabetElement = document.getElementById('alphabet');
    if (!alphabetElement) return;
    alphabetElement.innerHTML = '';
    
    const observerOptions = {
        root: alphabetElement,
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    alphabet.forEach(letter => {
        const songCount = (letter === "#")
            ? allMusic.filter(song => /^[^a-zA-Z]/.test(song.name)).length
            : allMusic.filter(song => removeAccents(song.name).toUpperCase().startsWith(letter)).length;

        const liTag = document.createElement('li');
        liTag.classList.add('alphabet-item');
        liTag.setAttribute('data-letter', letter);
        
        const aTag = document.createElement('a');
        aTag.href = "#";
        
        aTag.innerHTML = `
            <span class="letter">${letter}</span>
            <span class="count">${songCount}</span>
        `;
        
        if (songCount > 0) {
            aTag.addEventListener('click', (e) => {
                e.preventDefault();
                loadSongsByLetter(letter);
            });
        } else {
            liTag.classList.add('empty');
            aTag.addEventListener('click', (e) => e.preventDefault());
        }
        
        liTag.appendChild(aTag);
        alphabetElement.appendChild(liTag);
        observer.observe(liTag);
    });
}

function loadSongsByLetter(letter) {
    songListUl.innerHTML = "";

    const titleTag = document.querySelector(".title-list");
    if(titleTag) titleTag.textContent = `Lista con ${letter}`;
        
    const filteredSongs = (letter === "#")
        ? allMusic.filter(song => /^[^a-zA-Z]/.test(song.name))
        : allMusic.filter(song => removeAccents(song.name).toUpperCase().startsWith(letter));

    if (filteredSongs.length > 0) {
        const songObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { root: songListUl, threshold: 0.05 });

        const fragment = document.createDocumentFragment();
        
        filteredSongs.forEach(song => {
            const songIndexInAll = allMusic.findIndex(s => s.src === song.src);
            const liTag = document.createElement('li');
            liTag.classList.add('song-item');
            liTag.setAttribute('li-index', songIndexInAll + 1);
            
            liTag.innerHTML = `
                <div class="row">
                    <span>${song.name}</span>
                    <p>${song.artist}</p>
                </div>
            `;
            
            liTag.addEventListener("click", () => selectSong(liTag));
            fragment.appendChild(liTag);
            songObserver.observe(liTag);
        });

        songListUl.appendChild(fragment); 

        alphabetListDiv.style.display = "none";
        songListUl.style.display = "block";
        backToAlphabetBtn.classList.remove("hidden");
        
        updatePlayingSong();
        songListUl.scrollTop = 0;
        
        history.pushState({ view: 'songsByLetter', letter: letter }, '', `#${letter}`);
    }
}

function displayAlphabetList() {
    const titleTag = document.querySelector(".title-list");
    if(titleTag) titleTag.textContent = "Lista de canciones";
    
    songListUl.innerHTML = "";     
    alphabetListDiv.style.display = "flex"; 
    
    songListUl.style.display = "none";   
    backToAlphabetBtn.classList.add("hidden");
    
    loadAlphabet();
}

function showAlphabetView() {
    musicListDiv.classList.add("show");
    displayAlphabetList();
    history.pushState({ view: 'alphabet' }, '', '#abecedario');
}

function closeMusicList() {
    musicListDiv.classList.remove("show");
    history.replaceState(null, '', window.location.origin + window.location.pathname);
}

function selectSong(element) {
    const indexToPlay = parseInt(element.getAttribute('li-index')) - 1;
    if (indexToPlay >= 0) {
        setMusicAndPlay(indexToPlay); 
        closeMusicList(); 
        updatePlayingSong(); 
    }
}

// Event Listeners
if (moreMusicBtn) moreMusicBtn.addEventListener("click", showAlphabetView);
if (closeMoreMusic) closeMoreMusic.addEventListener("click", closeMusicList);

if (backToAlphabetBtn) {
    backToAlphabetBtn.addEventListener("click", () => {
        displayAlphabetList();
        history.pushState({ view: 'alphabet' }, '', '#abecedario');
    });
}

window.addEventListener('popstate', (event) => {
    const state = event.state;
    if (!state) {
        closeMusicList();
        return;
    }
    if (state.view === 'alphabet') displayAlphabetList();
    if (state.view === 'songsByLetter') loadSongsByLetter(state.letter);
});

window.addEventListener('load', () => {
    const hash = window.location.hash;
    if (hash === '#abecedario') {
        showAlphabetView();
    } else if (hash.length === 2 || hash === '##') {
        showAlphabetView();
        loadSongsByLetter(hash.replace('#', ''));
    } else {
        history.replaceState(null, '', ' ');
    }
    updatePlayingSong();
});

window.updatePlayingSong = updatePlayingSong;

document.addEventListener('DOMContentLoaded', function() {
    const folderIcon = document.getElementById('folder-icon');
    const folderOpenIcon = document.getElementById('folder-open-icon');
    const blurOverlay = document.getElementById('blur-overlay');
    const albumContainer = document.getElementById('album-container');
    const albumItems = document.querySelectorAll('#album-list-items .album-item'); 
    const closeAlbumList = document.getElementById('close-album-list');
    const songListContainer = document.getElementById('song-list-container');
    const artistNameDisplay = document.getElementById('artist-name');
    const songListDiv = document.getElementById('song-list');
    const closeSongList = document.getElementById('close-song-list');
    const favoritesTrigger = document.querySelector('.menu-item.item-4'); 
    const favoritesContainer = document.getElementById('favorites-container');
    const closeFavoritesList = document.getElementById('close-favorites-list');
    const favoritesAlbumItems = document.querySelectorAll('#favorites-list-items .album-item'); 

    let previousView = null; 

    function closeAllViews() {
        blurOverlay.style.display = 'none';
        albumContainer.style.display = 'none'; 
        favoritesContainer.style.display = 'none';
        songListContainer.style.display = 'none';
        folderIcon.style.display = 'inline-block';
        folderOpenIcon.style.display = 'none';
    }

    function showFavoritesList() {
        folderIcon.style.display = 'none';
        folderOpenIcon.style.display = 'inline-block';
        blurOverlay.style.display = 'flex';
        favoritesContainer.style.display = 'block'; 
        albumContainer.style.display = 'none'; 
        songListContainer.style.display = 'none';
        if (typeof updateArtistAndSongHighlight === "function") updateArtistAndSongHighlight(); 
    }

    function showAlbumList() {
        folderIcon.style.display = 'none';
        folderOpenIcon.style.display = 'inline-block';
        blurOverlay.style.display = 'flex';
        albumContainer.style.display = 'block';
        favoritesContainer.style.display = 'none'; 
        songListContainer.style.display = 'none';
        if (typeof updateArtistAndSongHighlight === "function") updateArtistAndSongHighlight();
    }

    function showSongList(artistName, callerType) {
        artistNameDisplay.textContent = artistName;
        blurOverlay.style.display = 'flex';
        albumContainer.style.display = 'none';
        favoritesContainer.style.display = 'none'; 
        songListContainer.style.display = 'block';
        previousView = callerType; 
    }

    function hideFavoritesList() { closeAllViews(); }
    function hideAlbumList() { closeAllViews(); }

    function closeSongListAction() {
        if (previousView === 'favorites') {
            showFavoritesList(); 
        } else {
            showAlbumList();     
        }
    }
    
    if (favoritesTrigger) favoritesTrigger.addEventListener('click', showFavoritesList);
    if (closeFavoritesList) closeFavoritesList.addEventListener('click', hideFavoritesList); 

    folderIcon.addEventListener('click', showAlbumList);
    folderOpenIcon.addEventListener('click', hideAlbumList);
    closeAlbumList.addEventListener('click', hideAlbumList);

    if (closeSongList) closeSongList.addEventListener('click', closeSongListAction); 

    blurOverlay.addEventListener('click', function(event) {
        if (event.target === blurOverlay) {
            if (songListContainer.style.display === 'block') {
                 closeSongListAction(); 
            } else {
                closeAllViews();
            }
        }
    });

    function renderSongList(songs) {
        songListDiv.innerHTML = '';
        if (songs.length === 0) {
            songListDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">No hay canciones aquí todavía.</div>';
            return;
        }

        songs.sort((a, b) => a.name.localeCompare(b.name));

        const fragment = document.createDocumentFragment();
        songs.forEach((song) => {
            const songIndexInAll = allMusic.findIndex(s => s.src === song.src);
            const songItem = document.createElement('div');
            songItem.classList.add('song-item');
            songItem.setAttribute('data-index', songIndexInAll); 

            songItem.style.cssText = `cursor: pointer; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 5px;`;

            songItem.innerHTML = `
                <div class="song-name-text" style="color: #ffffff; font-weight: 500;">• ${song.name}</div>
                <div style="font-size: 0.85em; color: rgba(255,255,255,0.5); margin-left: 1.2em;">${song.artist}</div>
            `;

            songItem.addEventListener('click', function() {
                const indexToPlay = parseInt(this.getAttribute('data-index'));
                if (window.setMusicAndPlay) window.setMusicAndPlay(indexToPlay, true);
                closeAllViews(); 
                if (typeof updateArtistAndSongHighlight === "function") updateArtistAndSongHighlight(); 
            });

            fragment.appendChild(songItem);
        });
        songListDiv.appendChild(fragment);
    }

    albumItems.forEach(item => {
        item.addEventListener('click', function() { 
            const albumArtist = this.dataset.artist.toLowerCase();
            let songsToShow = []; 

            if (albumArtist === 'otros') {
                const explicitArtists = Array.from(albumItems)
                    .map(i => i.dataset.artist.toLowerCase())
                    .filter(art => art !== 'otros' && art !== 'me gusta' && art !== 'no me gusta');
                
                songsToShow = allMusic.filter(song => {
                    const firstArtist = song.artist.split(/ ft | x | & /)[0].toLowerCase().trim();
                    return !explicitArtists.includes(firstArtist);
                });
            } else {
                songsToShow = allMusic.filter(song => {
                    const firstArtist = song.artist.split(/ ft | x | & /)[0].toLowerCase().trim();
                    return firstArtist === albumArtist;
                });
            } 

            renderSongList(songsToShow);
            showSongList(this.dataset.artist, 'artists'); 
        });
    });

    favoritesAlbumItems.forEach(item => {
        item.addEventListener('click', function() {
            const listType = this.dataset.artist; 
            
            let songsToShow = allMusic.slice(0, 5); 
            
            renderSongList(songsToShow);
            showSongList(listType, 'favorites'); 
        });
    });
});

// Canciones en lista y orden__________________________________________________________________________________________________________

//const openAllSongsBtn = document.querySelector('#open-all-songs');
const allSongsContainer = document.getElementById('all-songs-container');
const closeAllSongsList = document.getElementById('close-all-songs-list');
const allSongsListItems = document.getElementById('all-songs-list-items');
const openSortMenuBtn = document.getElementById('open-sort-menu');
const sortMenu = document.getElementById('sort-menu');
const miniPrevBtn = document.getElementById('mini-prev');
const miniNextBtn = document.getElementById('mini-next');
const mainDiscArt = document.getElementById('main-disc-art'); 
const mainSongName = document.getElementById('main-song-name'); 
const mainSongArtist = document.getElementById('main-song-artist'); 
const mainPlayPauseIcon = document.getElementById('main-play-pause-icon'); 
const mainPlayPauseBtn = document.getElementById('main-play-pause-btn'); 
const miniPlayerBar = document.getElementById('mini-player-bar');
const miniDiscArt = document.getElementById('mini-disc-art');
const miniPlayPauseIcon = document.getElementById('mini-play-pause-icon');
const miniPlayPauseBtn = document.getElementById('mini-play-pause-btn');
const miniSongName = document.getElementById('mini-song-name'); 
const miniSongArtist = document.getElementById('mini-song-artist'); 
const miniDiscWrapper = document.getElementById('suggestions-container-principal');
const songsSearchInput = document.getElementById('search-input-songs');
const songsListSubtitle = document.querySelectorAll('.songs-list-subtitle');
const sortMenuWrapper = document.getElementById('sort-menu-wrapper');
const recentSongsListItems = document.getElementById('recent-songs-list-items');
const allSongsSubtitle = document.querySelector('[data-list-type="all"]');
const recentSongsSubtitle = document.querySelector('[data-list-type="recent"]');
const favCarousel = document.querySelector('.fav-carousel-wrapper');
const RECENT_SONGS_LIMIT = 50;

window.currentSort = 'name';
window.currentListType = 'all';

window.syncAllMusicPlays = async function() {
    if (!window.allMusic || !db) return;

    try {
        const querySnapshot = await getDocs(collection(db, 'song_plays'));        
        const playDataMap = {};
            
        querySnapshot.forEach((doc) => {
            playDataMap[doc.id] = doc.data().plays || 0;
        });

        window.allMusic = window.allMusic.map(song => {
            const plays = playDataMap[song.src] || 0;
            return { ...song, plays: plays };
        });
        
    } catch (e) {
        console.error("ERROR: Fallo al sincronizar plays con allMusic:", e);
    }
};

function updatePlayPauseIcons(isPlaying) {
    const playClass = 'bi-play-fill';
    const pauseClass = 'bi-pause-fill';
    const iconClass = isPlaying ? pauseClass : playClass;
    const oppositeClass = isPlaying ? playClass : pauseClass;

    if (miniPlayPauseIcon) {
        miniPlayPauseIcon.classList.remove(oppositeClass);
        miniPlayPauseIcon.classList.add(iconClass);
    }

    if (mainPlayPauseIcon) {
        mainPlayPauseIcon.classList.remove(oppositeClass);
        mainPlayPauseIcon.classList.add(iconClass);
    }

    const discWrapper = miniDiscArt ? miniDiscArt.closest('.mini-disc-wrapper') : null;
    if (discWrapper) {
        const isMiniPlayerActive = allSongsContainer && allSongsContainer.classList.contains('visible');
        
        if (isPlaying && isMiniPlayerActive) {
            discWrapper.classList.add('is-playing');
        } else {
            discWrapper.classList.remove('is-playing');
        }
    }
}
window.updatePlayPauseIcons = updatePlayPauseIcons; 

function updatePlayerUI(song) {
    if (!song) return;
    const imgSrc = `img/${song.img}.jpg`;
    
    if (mainDiscArt) mainDiscArt.src = imgSrc;
    if (mainSongName) mainSongName.textContent = song.name;
    if (mainSongArtist) mainSongArtist.textContent = song.artist;
    
    if (miniDiscArt) miniDiscArt.src = imgSrc;
    if (miniSongName) miniSongName.textContent = song.name;
    if (miniSongArtist) miniSongArtist.textContent = song.artist;
    
    if (window.mainAudio) { 
        updatePlayPauseIcons(!window.mainAudio.paused); 
    }

    if (miniPlayerBar && allSongsContainer && allSongsContainer.style.display === 'flex') {
        miniPlayerBar.classList.add('is-visible');
    }
}

function showAllSongsList(isFromHistory = false) {
    const wrapper = document.querySelector(".wrapper");
    if (wrapper) {
        wrapper.classList.add('hidden');
    }
    if (miniPlayerBar) {
        miniPlayerBar.classList.add('is-visible');
        miniPlayerBar.style.display = 'flex';
    }
    if (window.musicIndex !== undefined && window.allMusic) {
        updatePlayerUI(window.allMusic[window.musicIndex]);
    }
    
    if (allSongsContainer) {
        allSongsContainer.style.display = 'flex';
        allSongsContainer.classList.add('transition-active'); 
        setTimeout(() => {
            allSongsContainer.classList.add('visible'); 
            if (window.mainAudio) {
        updatePlayPauseIcons(!window.mainAudio.paused);
    } 
        }, 10);
    }
    
    history.pushState({ view: 'allSongsList' }, '', '#all-songs');
    
    if (window.currentListType === 'recent') {
        if (typeof loadRecentSongs === 'function') {
            loadRecentSongs(); 
        }
    } else {
        if (typeof loadFavoriteCards === 'function') {
            loadFavoriteCards();
        }
        sortAndLoadAllSongs(window.currentSort);
    } 
    setTimeout(() => {
        if (typeof applyLazyLoading === 'function') applyLazyLoading();
    }, 100);  
}

function hideAllSongsList(isFromHistory = false) {
    if (allSongsContainer) {
        allSongsContainer.classList.remove('visible');
    }
    updatePlayPauseIcons(false);
    if (miniPlayerBar) {
        miniPlayerBar.classList.remove('is-visible');
    }
    
    setTimeout(() => {
        const wrapper = document.querySelector(".wrapper");
        if (wrapper) {
            wrapper.classList.remove('hidden'); 
        }
        if (allSongsContainer) {
            allSongsContainer.style.display = 'none'; 
            allSongsContainer.classList.remove('transition-active');
        }
        
        if (!isFromHistory) {
            history.replaceState({ view: 'defaultPlayer' }, '', window.location.pathname + window.location.search);
        }
    }, 400); 
}

function displayNoResultsMessage(show, term) {
    let noResultsDiv = document.getElementById('no-results-songs-message');
    
    if (!noResultsDiv) {
        noResultsDiv = document.createElement('div');
        noResultsDiv.id = 'no-results-songs-message';
        noResultsDiv.classList.add('no-results-message');
        document.getElementById('all-songs-container').appendChild(noResultsDiv);
    }
    
    if (show && term.length > 0) {
        noResultsDiv.innerHTML = `
            <p class="no-results-highlight">¡Ups!</p> 
            <p>No se encontraron canciones que coincidan con <strong>"${term}"</strong>.</p>
        `;
        noResultsDiv.classList.remove('hidden');
    } else {
        noResultsDiv.classList.add('hidden');
    }
}

function filterSongsList(searchTerm) {
    if (window.currentListType === 'recent' && searchTerm.length > 0) {
        if (recentSongsListItems) {
             recentSongsListItems.innerHTML = '<p class="text-center p-4">La búsqueda no está disponible en Recientes amor.</p>';
          }
          displayNoResultsMessage(true, 'La búsqueda no está disponible en Recientes amor.');
          return;
    }
    const term = typeof window.removeAccents === 'function' 
        ? window.removeAccents(searchTerm).toLowerCase().trim() 
        : searchTerm.toLowerCase().trim();
        
    const songItems = allSongsListItems.querySelectorAll('.song-list-item');
    
    if (term.length === 0) {
        songItems.forEach(item => {
            item.style.display = 'flex';
            item.classList.remove('search-highlight');
        });
        displayNoResultsMessage(false, term);
        return;
    }
    if (typeof Fuse === 'undefined') {
        displayNoResultsMessage(true, searchTerm);
        return;
    }
    if (!window.allMusic || window.allMusic.length === 0) {
        displayNoResultsMessage(true, searchTerm);
        return;
    }
    const fuseOptions = { 
        keys: ['name', 'artist'], 
        threshold: 0.3, 
        ignoreAccents: true,
        ignoreLocation: true 
    };
    
    try {
        const fuse = new Fuse(window.allMusic, fuseOptions);
        const results = fuse.search(term);
        const matchingSongsSrc = new Set(results.map(r => r.item.src));
        
        let firstMatchItem = null;
        let matchesFound = 0;
        songItems.forEach(item => {
            item.classList.remove('search-highlight');
            
            const index = parseInt(item.dataset.index);
            const songData = window.allMusic[index]; 
            
            if (!songData) {
                item.style.display = 'none';
                return; 
            }

            const isMatch = matchingSongsSrc.has(songData.src);

            if (window.currentSort === 'name') {
                item.style.display = 'flex'; 
                if (isMatch) {
                    matchesFound++;
                    if (!firstMatchItem) {
                        firstMatchItem = item;
                    }
                }
            } else {
                if (isMatch) {
                    item.style.display = 'flex';
                    matchesFound++;
                } else {
                    item.style.display = 'none';
                }
            }
        });

        if (window.currentSort === 'name' && firstMatchItem) {
            firstMatchItem.classList.add('search-highlight');
            scrollToSongItem(firstMatchItem);
        }

        if (matchesFound === 0) {
            displayNoResultsMessage(true, searchTerm);
        } else {
            displayNoResultsMessage(false, searchTerm);
        }

        applyLazyLoading();
        
    } catch (e) {
        displayNoResultsMessage(true, searchTerm);
    }
}

function scrollToSongItem(songItem) {
    const songListContainer = document.getElementById('all-songs-container');
    
    if (songItem && songListContainer) {
        const itemRect = songItem.getBoundingClientRect();
        const containerRect = songListContainer.getBoundingClientRect();
        const stickyHeaderHeight = document.querySelector('.sticky-header-songs').offsetHeight || 100;
        
        songListContainer.scrollTo({
            top: songListContainer.scrollTop + itemRect.top - containerRect.top - stickyHeaderHeight - 20, 
            behavior: 'smooth'
        });
    }
}

window.scrollToSongItem = scrollToSongItem;

function updateMiniPlayerProgress() {
    const miniDisc = document.querySelector('.mini-disc-wrapper');
    const currentTime = window.mainAudio.currentTime;
    const duration = window.mainAudio.duration;
    if (miniDisc && duration > 0 && isFinite(duration)) {
        const progressDegrees = (currentTime / duration) * 360;        
        miniDisc.style.setProperty('--progress', `${progressDegrees}deg`);
    }
}

function resetMiniPlayerProgress() {
    if (typeof miniDiscWrapper !== 'undefined' && miniDiscWrapper) {
        miniDiscWrapper.style.setProperty('--progress', '0deg');
    }
}

function updateAllSongsListHighlight() {
    document.querySelectorAll('#all-songs-list-items .song-list-item').forEach(item => {
        item.classList.remove('playing-song');
    });
    if (allSongsContainer && allSongsContainer.classList.contains('visible') && window.musicIndex !== undefined && window.allMusic && window.allMusic[window.musicIndex]) {
        const currentSongIndex = window.musicIndex;
        const currentSongItem = document.querySelector(`#all-songs-list-items .song-list-item[data-index="${currentSongIndex}"]`);
        if (currentSongItem) {
            currentSongItem.classList.add('playing-song');
        }
    }
}
window.updateAllSongsListHighlight = updateAllSongsListHighlight;


async function loadRecentSongs() { 
    const songsToRender = await window.loadRecentSongsHistory(RECENT_SONGS_LIMIT); 

    if (recentSongsListItems) {
        recentSongsListItems.innerHTML = '<p class="text-center p-4">Cargando canciones recientes...</p>'; 
    }

    const recentSongs = songsToRender.map(song => {
        const songIndexInAll = window.allMusic.findIndex(s => s.src === song.src);
        return { ...song, songIndexInAll: songIndexInAll }; 
    }).filter(song => song.songIndexInAll !== -1);
    
    const originalSort = window.currentSort;
    window.currentSort = 'lastPlayed';
    
    if (recentSongsListItems) {
        renderSongsList(recentSongs, recentSongsListItems); 
    }
    
    window.currentSort = originalSort;
    
    if (recentSongsListItems && recentSongs.length === 0) {
        recentSongsListItems.innerHTML = `
            <div class="list-empty-message">
                <h3 class="list-empty-highlight">¡Ups!</h3>
                <p>Tu lista de Recientes está vacía.</p>
            </div>
        `;
    }
}
window.loadRecentSongs = loadRecentSongs;
    
function renderSongsList(songsToDisplay, targetContainer) {
    if (!targetContainer) return;
    targetContainer.innerHTML = '';
    
    if (!window.allMusic || window.allMusic.length === 0) { 
        return;
    }
    
    const currentSort = window.currentSort; 
    
    if (currentSort === 'plays' && songsToDisplay.every(song => (parseInt(song.plays, 10) || 0) === 0) && targetContainer === allSongsListItems) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message-plays-empty', 'list-empty-message');
        
        messageDiv.innerHTML = `
        <h3 class="list-empty-highlight">¡Ups!</h3>
        <p>Escucha más canciones para tener acceso a esta función</p>`;
        targetContainer.appendChild(messageDiv);
        return;
    }
    
    const fragment = document.createDocumentFragment();
    let currentLetter = null;

    songsToDisplay.forEach((song) => {
        const songIndexInAll = song.originalIndex !== undefined 
            ? song.originalIndex 
            : song.songIndexInAll !== undefined
            ? song.songIndexInAll
            : window.allMusic.findIndex(s => s.src === song.src);
        
        if (songIndexInAll === -1) return;

        let shouldAddHeader = false;
        if (targetContainer === allSongsListItems && window.currentSort === 'name') {
            const firstChar = typeof window.removeAccents === 'function' 
                ? window.removeAccents(song.name).charAt(0).toUpperCase() 
                : song.name.charAt(0).toUpperCase();
            let letterHeader = (firstChar >= 'A' && firstChar <= 'Z') ? firstChar : '#';
            if (letterHeader !== currentLetter) {
                shouldAddHeader = true;
                currentLetter = letterHeader;
            }
        }
        
        if (shouldAddHeader) {
            const header = document.createElement('h3');
            header.classList.add('letter-header');
            header.textContent = currentLetter;
            fragment.appendChild(header);
        }
        
        const songItem = document.createElement('div');
        songItem.classList.add('song-list-item', 'song-item');
        
        songItem.setAttribute('data-index', songIndexInAll);
        songItem.setAttribute('data-song-name', song.name);
        songItem.setAttribute('data-artist-name', song.artist);
        
        songItem.innerHTML = `
        <div class="song-list-content">
            <img data-src="img/${song.img}.jpg" 
                 src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
                 alt="${song.name}" 
                 class="song-list-img"> 
            <div class="song-info">
                <div class="song-title">${song.name}</div>
                <div class="song-artist">${song.artist}</div>
            </div>
        </div>`;
        
        songItem.addEventListener('click', function() {
            const indexToPlay = parseInt(this.getAttribute('data-index'));
            if (typeof window.setMusicAndPlay === 'function') { 
                window.setMusicAndPlay(indexToPlay, true); 
            }
            hideAllSongsList();
        });

        fragment.appendChild(songItem);
    });
    
    targetContainer.appendChild(fragment);

    if (typeof applyLazyLoading === 'function') {
        applyLazyLoading();
    }

    if (targetContainer === allSongsListItems) {
        setTimeout(() => {
            updateAllSongsListHighlight();
        }, 0);
    }
}

function switchSongsList(listType) {

    window.currentListType = listType;

    songsListSubtitle.forEach(subtitle => {
        subtitle.classList.remove('is-active');
    });
    document.querySelector(`[data-list-type="${listType}"]`).classList.add('is-active');

    const isAll = (listType === 'all');

    if (sortMenuWrapper) {
        sortMenuWrapper.style.display = isAll ? 'flex' : 'none'; 
    }
    
    if (songsSearchInput) {
        const searchContainer = songsSearchInput.closest('#search-container-songs');
        
        if (searchContainer) {
            searchContainer.style.display = isAll ? 'flex' : 'none';
        }
        
        songsSearchInput.disabled = !isAll;
    }
    
    if (allSongsListItems && recentSongsListItems) {
        allSongsListItems.style.display = isAll ? 'block' : 'none';
        recentSongsListItems.style.display = isAll ? 'none' : 'block';
    }
    
    if (listType === 'all') {
        if (typeof sortAndLoadAllSongs === 'function') {
             sortAndLoadAllSongs(window.currentSort); 
        }

    } else if (listType === 'recent') {
        if (typeof loadRecentSongs === 'function') {
            loadRecentSongs(); 
        }
    }

    if (songsSearchInput) songsSearchInput.value = '';
    filterSongsList(''); 
    setTimeout(() => {
    applyLazyLoading();
}, 50);
}

async function loadFavoriteCards() {
    const favCarousel = document.getElementById('fav-carousel');
    if (!favCarousel) return;    
    favCarousel.innerHTML = ''; 

    const topTenSongs = await getTopTenFavoriteSongs();     
    let noPlaysMessage = document.getElementById('no-favorites-message');
    
    if (topTenSongs.length === 0) {
        if (!noPlaysMessage) {
            const messageDiv = document.createElement('div');
            messageDiv.id = 'no-favorites-message';
            messageDiv.classList.add('no-favorites-message');
            
            messageDiv.innerHTML = `
                <p class="no-results-highlight">¡Ups!</p>
                <p>Aún no tienes canciones favoritas</p>
            `;
            favCarousel.appendChild(messageDiv);
            noPlaysMessage = messageDiv;
        } else {
            noPlaysMessage.classList.remove('hidden');
        }
        return;
    } else if (noPlaysMessage) {
        noPlaysMessage.classList.add('hidden');
    }

    topTenSongs.forEach(song => {
        const songIndexInAll = window.allMusic.findIndex(s => s.src === song.src); 
        const cardHTML = `
            <div class="fav-card" data-index="${songIndexInAll}">
                <div class="card-img-wrapper">
                    <img data-src="img/${song.img}.jpg" 
                         src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
                         alt="${song.name}"> 
                    <div class="card-play-pause-btn"> 
                        <i class="bi bi-play-fill card-play-pause-icon"></i> 
                    </div>
                </div>
                <div class="card-info">
                    <span class="card-title">${song.name}</span>
                    <p class="card-artist">${song.artist}</p>
                </div>
            </div>`;
        favCarousel.insertAdjacentHTML('beforeend', cardHTML);
    });

    if (typeof applyLazyLoading === 'function') {
        applyLazyLoading();
    }

    document.querySelectorAll('#fav-carousel .fav-card').forEach(card => {
        const playBtn = card.querySelector('.card-play-pause-btn');
        if (playBtn) {
            playBtn.addEventListener('click', function(e) {
                e.stopPropagation(); 
                const indexToPlay = parseInt(card.dataset.index);
                if (indexToPlay >= 0 && typeof window.setMusicAndPlay === 'function') {
                    window.setMusicAndPlay(indexToPlay, true); 
                }
            });
        }
    });
    
    setTimeout(updateCenteredCard, 10);
}
window.loadFavoriteCards = loadFavoriteCards;

function updateCenteredCard() {
    const favCarousel = document.getElementById('fav-carousel');
    if (!favCarousel) return;

    const carouselCenter = favCarousel.scrollLeft + favCarousel.offsetWidth / 2;

    let closestCard = null;
    let minDistance = Infinity;

    document.querySelectorAll('#fav-carousel .fav-card').forEach(card => {
        card.classList.remove('centered-card');

        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        
        const distance = Math.abs(cardCenter - carouselCenter);

        if (distance < minDistance) {
            minDistance = distance;
            closestCard = card;
        }
    });

    if (closestCard) {
        closestCard.classList.add('centered-card');
    }
}

function sortAndLoadAllSongs(sortType) {
    if (!window.allMusic || window.allMusic.length === 0) { 
        renderSongsList([], allSongsListItems); 
        return;
    }
    
    let sortedSongs = [...window.allMusic];
    window.currentSort = sortType || window.currentSort; 
    
    if (window.currentSort === 'name') {
        sortedSongs.sort((a, b) => {
            const nameA = typeof window.removeAccents === 'function' ? window.removeAccents(a.name).toUpperCase() : a.name.toUpperCase();
            const nameB = typeof window.removeAccents === 'function' ? window.removeAccents(b.name).toUpperCase() : b.name.toUpperCase();
            return nameA.localeCompare(nameB);
        });
        
    } else if (window.currentSort === 'date') {
        sortedSongs.reverse();
        
    } else if (window.currentSort === 'plays') {
        sortedSongs.sort((a, b) => {
            const playsA = parseInt(a.plays, 10) || 0;
            const playsB = parseInt(b.plays, 10) || 0;
            return playsB - playsA; 
        });
    } 
    
    if (allSongsListItems) {
        renderSongsList(sortedSongs, allSongsListItems);
    }
}

function handleSortSelection(newSort) {
    if (window.currentSort !== newSort) {
        window.currentSort = newSort; 
        
        if (newSort === 'plays' && typeof window.syncAllMusicPlays === 'function') {
            window.syncAllMusicPlays().then(() => {
                sortAndLoadAllSongs(); 
                updateSortMenuVisuals(); 
            });
        } else {
            sortAndLoadAllSongs(); 
            updateSortMenuVisuals(); 
        }
        
        if (allSongsContainer.classList.contains('visible') && typeof loadFavoriteCards === 'function') {
            loadFavoriteCards();
        }
    }
}

function updateSortMenuVisuals() {
    document.querySelectorAll('#sort-menu .sort-option').forEach(opt => {
        const isSelected = opt.dataset.sort === window.currentSort;
        opt.classList.toggle('selected', isSelected);
        const checkIcon = opt.querySelector('.check-icon');
        if (checkIcon) {
            checkIcon.style.display = isSelected ? 'inline-block' : 'none';
        }
    });
}

function showSortMenu() {
    if (typeof Swal === 'undefined') {
        console.error("SweetAlert2 no está cargado.");
        return;
    }
    
    updateSortMenuVisuals();
        
    const sortMenuHTML = document.getElementById('sort-menu').innerHTML;
    Swal.fire({
        title: 'Ordenar canciones', 
        html: sortMenuHTML,
        showConfirmButton: false,
        showCloseButton: false,
        customClass: {
            container: 'sort-menu-swal-container', 
            popup: 'sort-menu-swal-popup',
            title: 'sort-menu-swal-title', 
        },        
        didRender: () => {
            document.querySelectorAll('.swal2-html-container .sort-option').forEach(option => {
                option.addEventListener('click', function() {
                    const newSort = this.dataset.sort;
                    handleSortSelection(newSort);
                    Swal.close(); 
                });
            });
        },        
        position: 'top-end', 
        backdrop: true, 
        width: '300px', 
        grow: false,
        padding: '0.5em', 
    });
}

window.addEventListener('popstate', (event) => {
    if (!event.state || event.state.view === 'defaultPlayer') {
        hideAllSongsList(true); 
    } else if (event.state.view === 'allSongsList') {
        showAllSongsList(true);
    }
});

window.addEventListener('allMusicLoaded', () => sortAndLoadAllSongs(window.currentSort));

window.addEventListener('songChanged', () => {
    updatePlayerUI(window.allMusic[window.musicIndex]);
    updateAllSongsListHighlight();
});

allSongsContainer.addEventListener('scroll', () => {
    const scrollTop = allSongsContainer.scrollTop;
    const fadeRange = 200;
    let opacity = 1 - (scrollTop / fadeRange);

    if (opacity < 0) opacity = 0;
    if (opacity > 1) opacity = 1;

    if (typeof favCarousel !== 'undefined' && favCarousel) {
        favCarousel.style.opacity = opacity;
        const scale = 0.95 + (opacity * 0.05); 
        favCarousel.style.transform = `scale(${scale})`;
        if (opacity === 0) {
            favCarousel.classList.add('is-hidden');
        } else {
            favCarousel.classList.remove('is-hidden');
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    loadFavoriteCards(); 
    const favCarouselElement = document.getElementById('fav-carousel');
    if (favCarouselElement) {
        favCarouselElement.addEventListener('scroll', updateCenteredCard);
        setTimeout(updateCenteredCard, 100); 
    }

    if (typeof window.mainAudio !== 'undefined') { 
        window.mainAudio.addEventListener("play", () => updatePlayPauseIcons(true));
        window.mainAudio.addEventListener("pause", () => {
            updatePlayPauseIcons(false);
            if (window.playTimer) clearTimeout(window.playTimer);
        });
        
        window.mainAudio.addEventListener("playing", () => {
            if (window.playCountIncremented) return;
            const songToCount = window.allMusic[window.musicIndex];
            if (!songToCount) return;

            if (window.playTimer) clearTimeout(window.playTimer);
            window.playTimer = setTimeout(() => {
                if (typeof window.incrementPlayCount === 'function' && songToCount.src) {
                    window.incrementPlayCount(songToCount.src); 
                    window.playCountIncremented = true; 
                    console.log(`🎶 Reproducción validada: ${songToCount.name}`);
                }
            }, 10000);
        });

        window.mainAudio.addEventListener("emptied", () => {
            if (window.playTimer) clearTimeout(window.playTimer);
        });

        window.mainAudio.addEventListener("timeupdate", (e) => {
            const currentTime = e.target.currentTime;
            const duration = e.target.duration;
            if (typeof window.progressBar !== 'undefined' && window.progressBar && duration > 0) {
                let progressWidth = (currentTime / duration) * 100;
                window.progressBar.style.width = `${progressWidth}%`;
            }
            if (typeof window.updateCurrentTime === 'function') {
                window.updateCurrentTime(currentTime);
            }
            updateMiniPlayerProgress(); 
        });

        window.mainAudio.addEventListener("loadeddata", () => {
            const duration = window.mainAudio.duration;
            const wrapper = document.querySelector(".wrapper"); 
            const totalElem = wrapper ? wrapper.querySelector(".max-duration") : null;            
            if (totalElem) {
                let totalMinutes = Math.floor(duration / 60);
                let totalSeconds = Math.floor(duration % 60);
                totalElem.innerText = `${totalMinutes}:${totalSeconds < 10 ? '0' + totalSeconds : totalSeconds}`;
            }
            updateMiniPlayerProgress();
        });

        window.mainAudio.addEventListener('ended', () => {
            resetMiniPlayerProgress();
            if (window.playTimer) clearTimeout(window.playTimer);
        });
    }

    if (allSongsSubtitle) allSongsSubtitle.addEventListener('click', () => switchSongsList('all'));
    if (recentSongsSubtitle) recentSongsSubtitle.addEventListener('click', () => switchSongsList('recent'));
    if (openAllSongsBtn) openAllSongsBtn.addEventListener('click', showAllSongsList);
    if (closeAllSongsList) closeAllSongsList.addEventListener('click', hideAllSongsList);
    
    if (songsSearchInput) {
        songsSearchInput.addEventListener('input', (e) => filterSongsList(e.target.value));
    } 

    if (miniPlayPauseBtn && typeof window.playPauseMusic === 'function') {
        miniPlayPauseBtn.addEventListener('click', window.playPauseMusic); 
    }
    if (miniPrevBtn && typeof window.prevMusic === 'function') {
        miniPrevBtn.addEventListener('click', () => window.prevMusic());
    }
    if (miniNextBtn && typeof window.nextMusic === 'function') {
        miniNextBtn.addEventListener('click', () => window.nextMusic());
    }
    if (window.playPauseBtn && typeof window.playPauseMusic === 'function') {
        window.playPauseBtn.addEventListener('click', window.playPauseMusic);
    }    
    if (openSortMenuBtn) {
        openSortMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showSortMenu();
        });
    }

    const favHeader = document.querySelector('.fav-header');
    const allSongsContainerElem = document.getElementById('all-songs-container');
    if (favHeader && allSongsContainerElem) {
        favHeader.addEventListener('click', (e) => {
            if (e.target.id === 'close-all-songs-list' || e.target.classList.contains('fav-close-btn')) return; 
            allSongsContainerElem.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    updateSortMenuVisuals(); 
    
    if (window.location.hash === '#all-songs') {
        showAllSongsList();
        history.replaceState({ view: 'allSongsList' }, '', '#all-songs');
    } else {
        history.replaceState({ view: 'defaultPlayer' }, '', window.location.pathname + window.location.search);
        if (miniPlayerBar) miniPlayerBar.style.display = 'none';
    }
    
    if (window.musicIndex !== undefined && window.allMusic && window.allMusic[window.musicIndex]) {
        updatePlayerUI(window.allMusic[window.musicIndex]);
    }
});