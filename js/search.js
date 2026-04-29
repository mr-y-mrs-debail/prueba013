
import { allMusic } from './music-list.js';
import { musicIndex, musicName, musicArtist, setMusicAndPlay } from './script.js'; 

const fuseOptions = { 
    keys: ['name', 'artist'], 
    threshold: 0.3, 
    ignoreAccents: true 
};

// Inicializamos Fuse con el array local
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

// Verifica si la canción en la lista de búsqueda es la que está sonando
function isCurrentSong(songName, songArtist) {
    if (!musicName || !musicArtist) return false;
    const currentName = removeAccents(musicName.innerText.toLowerCase());
    const currentArtist = removeAccents(musicArtist.innerText.toLowerCase());
    return currentName.includes(removeAccents(songName.toLowerCase())) && 
           currentArtist.includes(removeAccents(songArtist.toLowerCase()));
}

// Selecciona y reproduce
function selectSongByName(songName, songArtist) {
    const songIndex = allMusic.findIndex(song => 
        removeAccents(song.name.toLowerCase()) === removeAccents(songName.toLowerCase()) && 
        removeAccents(song.artist.toLowerCase()) === removeAccents(songArtist.toLowerCase())
    );

    if (songIndex !== -1) {
        if (typeof setMusicAndPlay === 'function') {
            setMusicAndPlay(songIndex);
        }
        
        // Limpiar UI tras seleccionar
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

// --- LÓGICA DE BÚSQUEDA PRINCIPAL ---
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
            
            // Mantenemos tu diseño de "Playing"
            suggestionItem.innerHTML = `
                <div class="search-result-content ${playing ? 'is-playing' : ''}">
                    <span class="song-name">${playing ? `<strong>${song.name}</strong>` : song.name}</span>
                    <span class="song-artist">${song.artist}</span>
                </div>
            `;
            
            suggestionItem.addEventListener("click", () => {
                selectSongByName(song.name, song.artist);
            });
            fragment.appendChild(suggestionItem);
        });
    } else {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.setAttribute('style', 'padding: 30px 20px; text-align: center; color: #888;');
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
            defaultView.classList.add("show-search");
            inputP.focus();
        });

        // Cerrar buscador
        if (closeSearch) {
            closeSearch.addEventListener("click", () => {
                defaultView.classList.remove("show-search");
                inputP.value = '';
                if (suggestP) suggestP.style.display = 'none';
            });
        }

        // Input con Debounce para rendimiento
        inputP.addEventListener("input", debounce(function() {
            searchPrincipal(this);
            // Mostrar/Ocultar botón X de limpiar
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