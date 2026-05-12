import { allMusic } from './music-list.js';
import { musicIndex, musicName, musicArtist, setMusicAndPlay } from './script.js'; 

let lastClickSearch = 0;

const fuseOptions = { 
    keys: ['name', 'artist'], 
    threshold: 0.3, 
    ignoreAccents: true 
};

const fuse = new Fuse(allMusic, fuseOptions);

// --- UTILIDADES ---
function debounce(func, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isCurrentSong(songName, songArtist) {
    if (!musicName || !musicArtist) return false;
    const currentName = removeAccents(musicName.innerText.toLowerCase());
    const currentArtist = removeAccents(musicArtist.innerText.toLowerCase());
    return currentName.includes(removeAccents(songName.toLowerCase())) && 
           currentArtist.includes(removeAccents(songArtist.toLowerCase()));
}

function selectSongByName(songName, songArtist) {
    const songIndex = allMusic.findIndex(song => 
        removeAccents(song.name.toLowerCase()) === removeAccents(songName.toLowerCase()) && 
        removeAccents(song.artist.toLowerCase()) === removeAccents(songArtist.toLowerCase())
    );

    if (songIndex !== -1) {
        if (typeof setMusicAndPlay === 'function') {
            setMusicAndPlay(songIndex);
        }
        
        const uiElements = {
            defaultView: document.getElementById("default-view"),
            suggestP: document.getElementById("suggestions-container-principal"),
            inputP: document.getElementById("search-input-principal")
        };

        if (uiElements.defaultView) uiElements.defaultView.classList.remove("show-search");
        if (uiElements.suggestP) uiElements.suggestP.style.display = 'none';
        if (uiElements.inputP) uiElements.inputP.value = '';
    }
}

export function searchPrincipal(searchInput) {
    const suggestionsContainerPrincipal = document.getElementById("suggestions-container-principal");
    
    if (!suggestionsContainerPrincipal || typeof Fuse === 'undefined') return;

    const queryText = searchInput.value.trim();
    const searchQuery = removeAccents(queryText.toLowerCase());
    
    if (searchQuery.length === 0) {
        suggestionsContainerPrincipal.innerHTML = '';
        suggestionsContainerPrincipal.style.display = 'none';
        return;
    }

    const fragment = document.createDocumentFragment();
    const results = fuse.search(searchQuery);

    if (results.length > 0) {
        results.forEach(({ item: song }) => {
            const suggestionItem = document.createElement('div');
            suggestionItem.classList.add('suggestion-item');
            
            const playing = isCurrentSong(song.name, song.artist);
            
            if (playing) {
                suggestionItem.classList.add('active');
            }

            suggestionItem.innerHTML = `
                <div class="suggestion-info">
                    <strong>${song.name}</strong>
                    <span>${song.artist}</span>
                </div>
            `;
            
            suggestionItem.addEventListener("click", () => {
                selectSongByName(song.name, song.artist);
            });
            fragment.appendChild(suggestionItem);
        });
    } else {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.setAttribute('style', 'padding: 30px 20px; text-align: center; color: rgba(255,255,255,0.5); font-size: 0.9rem;');
        noResultsDiv.innerHTML = '¡Ups!<br>No tenemos esa canción por aquí amor.';
        fragment.appendChild(noResultsDiv);
    }

    suggestionsContainerPrincipal.innerHTML = '';
    suggestionsContainerPrincipal.appendChild(fragment);
    suggestionsContainerPrincipal.style.display = 'block';
}

// --- EVENTOS DE CARGA ---
document.addEventListener("DOMContentLoaded", () => {
    const inputP = document.getElementById("search-input-principal");
    const searchOption = document.getElementById("search-option");
    const defaultView = document.getElementById("default-view");
    const closeSearch = document.getElementById("close-search");
    const clearBtn = document.getElementById("clear-search-input");
    const suggestP = document.getElementById("suggestions-container-principal");

    if (searchOption && defaultView && inputP) {
        // Abrir buscador
        searchOption.addEventListener("click", (e) => {
            e.preventDefault();
            
            const currentTime = Date.now();
            if (currentTime - lastClickSearch < 300) return;
            lastClickSearch = currentTime;

            defaultView.classList.add("show-search");
            
            setTimeout(() => {
                inputP.focus();
            }, 350);
        });

        // Cerrar buscador
        if (closeSearch) {
            closeSearch.addEventListener("click", (e) => {
                e.preventDefault();

                const currentTime = Date.now();
                if (currentTime - lastClickSearch < 300) return;
                lastClickSearch = currentTime;

                defaultView.classList.remove("show-search");
                inputP.value = '';
                if (clearBtn) clearBtn.style.display = "none";
                if (suggestP) {
                    suggestP.innerHTML = "";
                    suggestP.style.display = 'none';
                }
            });
        }

        // Input con Debounce
        inputP.addEventListener("input", debounce(function() {
            searchPrincipal(this);
            if (clearBtn) {
                clearBtn.style.display = this.value.length > 0 ? "block" : "none";
            }
        }, 150)); 
    }

    // Botón de limpiar input (X)
    if (clearBtn && inputP) {
        clearBtn.addEventListener("click", () => {
            inputP.value = "";
            inputP.focus();
            clearBtn.style.display = "none";
            if (suggestP) {
                suggestP.innerHTML = "";
                suggestP.style.display = "none";
            }
        });
    }
});