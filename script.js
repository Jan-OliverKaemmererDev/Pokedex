let allPokemon = [];
let pokemonIndex = [];
let listStart = 1;
const step = 25;
let currentMaxId = 151;
let isLoading = false;

async function init() {
  renderRegionButtons();
  setupSearchListener();
  await loadPokemonIndex();
  await loadRegion(1, 151);
}

function setupSearchListener() {
  let input = document.getElementById("searchInput");
  input.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      searchPokemon();
    }
  });
}

async function loadPokemonIndex() {
  try {
    let response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=898");
    let data = await response.json();
    pokemonIndex = data.results;
  } catch (e) {
    console.error("Fehler beim Laden des Pokémon-Index", e);
  }
}

async function loadAndShowPkm() {
  if (isLoading || listStart > currentMaxId) return;
  isLoading = true;
  showLoadingSpinner();
  let remaining = currentMaxId - listStart + 1;
  let currentStep = Math.min(step, remaining);
  if (currentStep > 0) {
    let newBatch = await fetchPkmRange(listStart, currentStep);
    let filteredBatch = newBatch.filter((p) => p.id <= currentMaxId);
    allPokemon = allPokemon.concat(filteredBatch);
    renderList(allPokemon);
    listStart += currentStep;
  }
  hideLoadingSpinner();
  updateLoadMoreButtonVisibility();
  isLoading = false;
}

async function fetchPkmRange(start, count) {
  let promises = [];
  for (let i = start; i < start + count; i++) {
    if (i <= currentMaxId) {
      promises.push(fetchPokemonData(i));
    }
  }
  return await Promise.all(promises);
}

async function fetchPokemonData(id) {
  let response = await fetch("https://pokeapi.co/api/v2/pokemon/" + id);
  return await response.json();
}

function showLoadingSpinner() {
  document.getElementById("loadingSpinner").classList.remove("hidden");
  document.getElementById("loadMoreBtn").disabled = true;
}

function hideLoadingSpinner() {
  document.getElementById("loadingSpinner").classList.add("hidden");
  document.getElementById("loadMoreBtn").disabled = false;
}

function renderList(pkmArray) {
  let container = document.getElementById("contentBox");
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
  let pkm = allPokemon.find((p) => p.id === id);
  if (!pkm) pkm = await fetchPokemonData(id);
  let overlay = document.getElementById("overlay");
  overlay.innerHTML = await getDetailTemplate(pkm);
  overlay.classList.remove("hidden");
  document.getElementById("body").classList.add("no-scroll");
}

function closeDetailView() {
  document.getElementById("overlay").classList.add("hidden");
  document.getElementById("body").classList.remove("no-scroll");
}

async function getDetailTemplate(pkm) {
    let name = pkm.name.charAt(0).toUpperCase() + pkm.name.slice(1);
    let typeClass = pkm.types[0].type.name;
    let img = pkm.sprites.other["official-artwork"].front_default;

    return `
        <div class="detail-card" onclick="event.stopPropagation()">
            <div class="detail-header ${typeClass}">
                <div class="header-top">
                    <button class="back-btn" onclick="closeDetailView()">
                        <img src="./assets/img/back.png" alt="Back">
                    </button>
                </div>
                <div class="detail-title-row">
                    <h2>${name}</h2>
                    <p>#${pkm.id.toString().padStart(3, "0")}</p>
                </div>
                <div class="detail-types">${renderTypes(pkm.types)}</div>
                <img class="main-img animate-wobble" src="${img}">
            </div>
            
            <div class="detail-info-container">
                <div class="tabs">
                    <button class="active" onclick="showTab('about', ${pkm.id})">About</button>
                    <button onclick="showTab('stats', ${pkm.id})">Base Stats</button>
                    <button onclick="showTab('evolution', ${pkm.id})">Evolution</button>
                    <button onclick="showTab('moves', ${pkm.id})">Moves</button>
                </div>
                <div id="tabContent" class="tab-content">
                    ${renderAbout(pkm)}
                </div>
            </div>
            ${await renderNavArrows(pkm.id)}
        </div>
    `;
}

async function renderNavArrows(currentId) {
  let prevId = currentId - 1;
  let nextId = currentId + 1;

  let prevImg =
    prevId >= 1
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${prevId}.png`
      : "";
  let nextImg = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nextId}.png`;

  return `
        <div class="nav-arrows">
            <button class="nav-btn-left" onclick="navigatePkm(${prevId})" ${
    prevId < 1 ? 'style="visibility:hidden"' : ""
  }>
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

async function navigatePkm(newId) {
  if (newId < 1) return;
  showLoadingSpinner();
  let pkm = await fetchPokemonData(newId);
  let overlay = document.getElementById("overlay");
  overlay.innerHTML = await getDetailTemplate(pkm);
  hideLoadingSpinner();
}

function showTab(tabName, pkmId) {
    const buttons = document.querySelectorAll('.tabs button');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    const pkm = allPokemon.find(p => p.id === pkmId);
    const contentDiv = document.getElementById('tabContent');
    
    if (tabName === 'about') contentDiv.innerHTML = renderAbout(pkm);
    if (tabName === 'stats') contentDiv.innerHTML = renderStats(pkm);
    if (tabName === 'evolution') contentDiv.innerHTML = `<p>Evolution chain coming soon...</p>`; // API-Abfrage für Evolution ist komplexer
    if (tabName === 'moves') contentDiv.innerHTML = renderMoves(pkm);
}

function renderAbout(pkm) {
    const abilities = pkm.abilities.map(a => a.ability.name).join(', ');
    return `
        <table class="info-table">
            <tr><td class="label-td">Species</td><td class="value-td">Seed</td></tr>
            <tr><td class="label-td">Height</td><td class="value-td">${pkm.height / 10} m</td></tr>
            <tr><td class="label-td">Weight</td><td class="value-td">${pkm.weight / 10} kg</td></tr>
            <tr><td class="label-td">Abilities</td><td class="value-td">${abilities}</td></tr>
        </table>
        <h4 class="breeding-title">Breeding</h4>
        <table class="info-table">
            <tr><td class="label-td">Gender</td><td class="value-td">♂ 87.5% ♀ 12.5%</td></tr>
            <tr><td class="label-td">Egg Groups</td><td class="value-td">Monster</td></tr>
            <tr><td class="label-td">Egg Cycle</td><td class="value-td">Grass</td></tr>
        </table>
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

function renderStats(pkm) {
    let html = "";
    const statsMap = {
        'hp': 'HP', 'attack': 'Attack', 'defense': 'Defense', 
        'special-attack': 'Sp. Atk', 'special-defense': 'Sp. Def', 'speed': 'Speed'
    };
    
    let total = 0;
    pkm.stats.forEach(s => {
        total += s.base_stat;
        const barColor = s.base_stat >= 50 ? '#48d0b0' : '#fb7676';
        html += `
            <div class="stat-row">
                <div class="stat-label">${statsMap[s.stat.name] || s.stat.name}</div>
                <div class="stat-value">${s.base_stat}</div>
                <div class="stat-bar-bg">
                    <div class="stat-bar-fill" style="width: ${(s.base_stat/150)*100}%; background-color: ${barColor}"></div>
                </div>
            </div>
        `;
    });
    
    html += `<div class="stat-row"><div class="stat-label">Total</div><div class="stat-value">${total}</div></div>`;
    return html;
}

function renderMoves(pkm) {
    const movesHtml = pkm.moves.slice(0, 20).map(m => `<span class="move-tag">${m.move.name}</span>`).join('');
    return `<div class="moves-container">${movesHtml}</div>`;
}

function getPkmCardTemplate(pkm) {
  let name = pkm.name.charAt(0).toUpperCase() + pkm.name.slice(1);
  let mainType = pkm.types[0].type.name;
  let img = pkm.sprites.other["official-artwork"].front_default;

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
    { name: "Kanto", start: 1, end: 151 },
    { name: "Johto", start: 152, end: 251 },
  ];
  let nav = document.getElementById("regionFilters");
  for (let i = 0; i < regions.length; i++) {
    nav.innerHTML += `<button onclick="loadRegion(${regions[i].start})">${regions[i].name}</button>`;
  }
}

function searchPokemon() {
  let inputField = document.getElementById("searchInput");
  let query = inputField.value.toLowerCase().trim();
  if (query.length < 3) {
    alert("Please enter at least 3 letters to search.");
    return;
  }
  processSearch(query);
}

async function processSearch(query) {
  showLoadingSpinner();
  let matches = [];

  for (let i = 0; i < pokemonIndex.length; i++) {
    let p = pokemonIndex[i];
    let id = i + 1;
    if (p.name.includes(query) || id.toString() === query) {
      matches.push(p);
    }
  }

  if (matches.length > 0) {
    let searchResults = [];
    let limit = Math.min(matches.length, 25);
    
    for (let i = 0; i < limit; i++) {
      let m = matches[i];
      let id = m.url.split("/").filter(Boolean).pop();
      let data = await fetchPokemonData(id);
      searchResults.push(data);
    }
    
    renderList(searchResults);
    document.getElementById("loadMoreBtn").style.display = "none";
  } else {
    renderNoResultsFound();
  }
  
  hideLoadingSpinner();
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
  let container = document.getElementById("contentBox");
  container.innerHTML = `
        <div class="no-results">
            <p>No matching Pokémon found. Please try another name.</p>
        </div>
    `;
}

function getRegions() {
  return [
    { name: "Kanto", start: 1, end: 151 },
    { name: "Johto", start: 152, end: 251 },
    { name: "Hoenn", start: 252, end: 386 },
    { name: "Sinnoh", start: 387, end: 493 },
    { name: "Unova", start: 494, end: 649 },
    { name: "Kalos", start: 650, end: 721 },
    { name: "Alola", start: 722, end: 809 },
    { name: "Galar", start: 810, end: 898 },
  ];
}

function renderRegionButtons() {
  let regions = getRegions();
  let nav = document.getElementById("regionFilters");
  nav.innerHTML = "";
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
  if (isLoading) return;
  isLoading = true;
  currentMaxId = endId;
  listStart = startId;
  allPokemon = [];
  showLoadingSpinner();
  let remaining = endId - startId + 1;
  let count = Math.min(step, remaining);
  let firstBatch = await fetchPkmRange(startId, count);
  allPokemon = firstBatch.filter((p) => p.id <= currentMaxId);
  listStart += count;
  renderList(allPokemon);
  updateLoadMoreButtonVisibility();
  hideLoadingSpinner();
  isLoading = false;
  document.getElementById("sideMenu").classList.remove("active");
  document.getElementById("menuOverlay").classList.add("hidden");
  document.body.style.overflow = "auto";
}

function updateLoadMoreButtonVisibility() {
  let btn = document.getElementById("loadMoreBtn");
  if (listStart > currentMaxId) {
    btn.style.display = "none";
  } else {
    btn.style.display = "block";
  }
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("menuOverlay");

  menu.classList.toggle("active");
  overlay.classList.toggle("hidden");

  if (menu.classList.contains("active")) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }
}
