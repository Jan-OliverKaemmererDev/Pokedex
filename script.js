let allPokemon = [];
let listStart = 1;
const step = 25;
let currentMaxId = 898;

function init() {
    loadAndShowPkm();
    renderRegionButtons();
}

async function loadAndShowPkm() {
    if (listStart > currentMaxId) return;
    showLoadingSpinner();
    let remaining = currentMaxId - listStart + 1;
    let currentStep = Math.min(step, remaining);
    if (currentStep > 0) {
        let newBatch = await fetchPkmRange(listStart, currentStep);
        allPokemon = allPokemon.concat(newBatch);
        renderList(allPokemon);
        listStart += currentStep;
    }
    hideLoadingSpinner();
    if (listStart > currentMaxId) {
        document.getElementById('loadMoreBtn').style.display = 'none';
    }
}

async function fetchPkmRange(start, count) {
    let promises = [];
    for (let i = start; i < start + count; i++) {
        promises.push(fetchPokemonData(i));
    }
    return await Promise.all(promises);
}

async function fetchPokemonData(id) {
    let response = await fetch("https://pokeapi.co/api/v2/pokemon/" + id);
    return await response.json();
}

function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
    document.getElementById('loadMoreBtn').disabled = true;
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('hidden');
    document.getElementById('loadMoreBtn').disabled = false;
}

function renderList(pkmArray) {
    let container = document.getElementById('contentBox');
    container.innerHTML = "";
    for (let i = 0; i < pkmArray.length; i++) {
        container.innerHTML += getPkmCardTemplate(pkmArray[i]);
    }
}

function renderTypes(types) {
    let html = "";
    for (let i = 0; i < types.length; i++) {
        html += `<span class="type-badge ${types[i].type.name}">${types[i].type.name}</span>`;
    }
    return html;
}

async function openDetailView(id) {
    let pkm = allPokemon.find(function(p) { return p.id === id; });
    if (!pkm) return;
    let overlay = document.getElementById('overlay');
    overlay.innerHTML = await getDetailTemplate(pkm);
    overlay.classList.remove('hidden');
    document.getElementById('body').classList.add('no-scroll');
}

function closeDetailView() {
    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('body').classList.remove('no-scroll');
}

async function getDetailTemplate(pkm) {
    let name = pkm.name.charAt(0).toUpperCase() + pkm.name.slice(1);
    let typeClass = pkm.types[0].type.name;
    let img = pkm.sprites.other['official-artwork'].front_default;
    
    return `
        <div class="detail-card" onclick="event.stopPropagation()">
            <div class="detail-header ${typeClass}">
                <div class="header-top">
                    <button class="back-btn" onclick="closeDetailView()">←</button>
                </div>
                <div class="detail-title-row">
                    <h2>${name}</h2>
                    <p>#${pkm.id.toString().padStart(3, '0')}</p>
                </div>
                <div class="detail-types">${renderTypes(pkm.types)}</div>
                <img class="main-img animate-wobble" src="${img}">
            </div>
            
            <div class="detail-info-container">
                ${renderDetailTabs(pkm)}
            </div>
            
            ${await renderNavArrows(pkm.id)}
        </div>
    `;
}

function renderNavArrows(currentId) {
    return `
        <div class="nav-arrows">
            <button onclick="navigatePkm(${currentId - 1})">
                <img src="./assets/img/arrow_left.png">
            </button>
            <button onclick="navigatePkm(${currentId + 1})">
                <img src="./assets/img/arrow_right.png">
            </button>
        </div>
    `;
}

async function navigatePkm(newId) {
    if (newId < 1) return;
    showLoadingSpinner();
    let pkm = await fetchPokemonData(newId);
    let overlay = document.getElementById('overlay');
    overlay.innerHTML = await getDetailTemplate(pkm);
    hideLoadingSpinner();
}

async function renderNavArrows(currentId) {
    let prevId = currentId - 1;
    let nextId = currentId + 1;
    
    // Bilder laden (Falls ID < 1, gibt es kein Bild)
    let prevImg = prevId >= 1 ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${prevId}.png` : "";
    let nextImg = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nextId}.png`;

    return `
        <div class="nav-arrows">
            <button class="nav-btn-left" onclick="navigatePkm(${prevId})" ${prevId < 1 ? 'style="visibility:hidden"' : ''}>
                <img src="./assets/img/arrow_left.png" class="arrow-icon">
                <img src="${prevImg}" class="preview-img">
            </button>
            <button class="nav-btn-right" onclick="navigatePkm(${nextId})">
                <img src="${nextImg}" class="preview-img">
                <img src="./assets/img/arrow_right.png" class="arrow-icon">
            </button>
        </div>
    `;
}

function renderDetailTabs(pkm) {
    return `
        <div class="tabs">
            <button onclick="showTab('about')">About</button>
            <button onclick="showTab('stats')">Base Stats</button>
        </div>
        <div id="tabContent" class="tab-content">
            ${renderStats(pkm.stats)}
        </div>
    `;
}

function renderStats(stats) {
    let html = "";
    for (let i = 0; i < stats.length; i++) {
        html += `<div>${stats[i].stat.name}: ${stats[i].base_stat}</div>`;
    }
    return html;
}

function getPkmCardTemplate(pkm) {
    let name = pkm.name.charAt(0).toUpperCase() + pkm.name.slice(1);
    let mainType = pkm.types[0].type.name;
    let img = pkm.sprites.other['official-artwork'].front_default;
    
    return `
        <div class="pkm-card ${mainType}" onclick="openDetailView(${pkm.id})">
            <span class="card-id">#${pkm.id}</span>
            <div class="card-content">
                <div class="card-info-left">
                    <h3>${name}</h3>
                    <div class="types-column">
                        ${renderTypes(pkm.types)}
                    </div>
                </div>
                <div class="card-image-right">
                    <img src="${img}" alt="${name}">
                </div>
            </div>
            <div class="card-bg-icon"></div> 
        </div>
    `;
}

function createRegionButtons() {
    let regions = [
        { name: 'Kanto', start: 1, end: 151 },
        { name: 'Johto', start: 152, end: 251 }
    ];
    let nav = document.getElementById('regionFilters');
    for (let i = 0; i < regions.length; i++) {
        nav.innerHTML += `<button onclick="loadRegion(${regions[i].start})">${regions[i].name}</button>`;
    }
}

function searchPokemon() {
    let inputField = document.getElementById('searchInput');
    let query = inputField.value.toLowerCase();
    if (query.length < 3) {
        alert("Please enter at least 3 letters to search.");
        return;
    }
    processSearch(query);
}

function processSearch(query) {
    showLoadingSpinner();
    let filteredResults = [];
    for (let i = 0; i < allPokemon.length; i++) {
        let pkm = allPokemon[i];
        if (pkm.name.toLowerCase().includes(query)) {
            filteredResults.push(pkm);
        }
    }
    displaySearchResults(filteredResults);
}

function displaySearchResults(results) {
    if (results.length === 0) {
        renderNoResultsFound();
    } else {
        renderList(results);
    }
    hideLoadingSpinner();
}

function renderNoResultsFound() {
    let container = document.getElementById('contentBox');
    container.innerHTML = `
        <div class="no-results">
            <p>No matching Pokémon found. Please try another name.</p>
        </div>
    `;
}

function getRegions() {
    return [
        { name: 'Kanto', start: 1, end: 151 },
        { name: 'Johto', start: 152, end: 251 },
        { name: 'Hoenn', start: 252, end: 386 },
        { name: 'Sinnoh', start: 387, end: 493 },
        { name: 'Unova', start: 494, end: 649 },
        { name: 'Kalos', start: 650, end: 721 },
        { name: 'Alola', start: 722, end: 809 },
        { name: 'Galar', start: 810, end: 898 }
    ];
}

function renderRegionButtons() {
    let regions = getRegions();
    let nav = document.getElementById('regionFilters');
    nav.innerHTML = '';
    for (let i = 0; i < regions.length; i++) {
        nav.innerHTML += getRegionButtonTemplate(regions[i]);
    }
}

function getRegionButtonTemplate(region) {
    let regionClass = region.name.toLowerCase();
    return `
        <button class="region-btn btn-${regionClass}" onclick="loadRegion(${region.start}, ${region.end})">
            ${region.name}
        </button>
    `;
}

async function loadRegion(startId, endId) {
    currentMaxId = endId;
    showLoadingSpinner();
    allPokemon = [];
    listStart = startId;
    let remaining = endId - startId + 1;
    let count = Math.min(step, remaining);
    allPokemon = await fetchPkmRange(startId, count);
    listStart += count;
    renderList(allPokemon);
    let btn = document.getElementById('loadMoreBtn');
    if (listStart <= currentMaxId) {
        btn.style.display = 'block';
    } else {
        btn.style.display = 'none';
    }
    hideLoadingSpinner();
}