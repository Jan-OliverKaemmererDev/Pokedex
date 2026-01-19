let allPokemon = [];
let pokemonIndex = [];
let currentList = [];
let isSearchActive = false;
let listStart = 1;
const step = 25;
let currentMinId = 1;
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
  input.addEventListener("keydown", function (event) {
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
    handleNewBatch(newBatch);
  }
  finishLoading();
}

function handleNewBatch(newBatch) {
  addBatchToAllPokemon(newBatch);
  renderList(allPokemon);
  listStart += newBatch.length;
}

function addBatchToAllPokemon(newBatch) {
  for (let i = 0; i < newBatch.length; i++) {
    let pkm = newBatch[i];
    if (pkm.id <= currentMaxId) {
      let exists = findPkmInArray(pkm.id);
      if (!exists) {
        allPokemon.push(pkm);
      }
    }
  }
}

function finishLoading() {
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
  try {
    let pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    let speciesRes = await fetch(
      `https://pokeapi.co/api/v2/pokemon-species/${id}`,
    );
    let pokemonData = await pokemonRes.json();
    let speciesData = await speciesRes.json();
    pokemonData.species = speciesData;
    return pokemonData;
  } catch (e) {
    console.error("Fehler beim Laden der Pokémon-Daten", e);
  }
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
  currentList = pkmArray;
  let container = document.getElementById("contentBox");
  container.innerHTML = "";
  for (let i = 0; i < pkmArray.length; i++) {
    container.innerHTML += getPkmCardTemplate(pkmArray[i]);
  }
}

function preventDefault(e) {
  e.preventDefault();
}

async function openDetailView(id) {
  let pkm = findPkmInArray(id);
  if (!pkm) pkm = await fetchPokemonData(id);
  let overlay = document.getElementById("overlay");
  overlay.innerHTML = await getDetailTemplate(pkm);
  overlay.classList.remove("hidden");
  document.getElementById("body").classList.add("no-scroll");
}

function findPkmInArray(id) {
  for (let i = 0; i < allPokemon.length; i++) {
    if (allPokemon[i].id === id) return allPokemon[i];
  }
  return null;
}

function closeDetailView() {
  document.getElementById("overlay").classList.add("hidden");
  document.getElementById("body").classList.remove("no-scroll");
}

function isNavigationValid(newId) {
  if (newId === null || newId === undefined) return false;
  if (!isSearchActive) {
    if (newId < currentMinId || newId > currentMaxId) return false;
  }
  return true;
}

async function navigatePkm(newId) {
  if (!isNavigationValid(newId)) return;
  let pkm = findPkmInArray(newId);
  if (!pkm) {
    showLoadingSpinner();
    pkm = await fetchPokemonData(newId);
    if (pkm) allPokemon.push(pkm);
    hideLoadingSpinner();
  }
  if (pkm) {
    let overlay = document.getElementById("overlay");
    overlay.innerHTML = await getDetailTemplate(pkm);
  }
}

async function showTab(tabName, pkmId) {
  updateTabButtons();
  let pkm = findPkmInArray(pkmId);
  if (!pkm || !pkm.species || !pkm.species.genera) {
    const data = await fetchPokemonData(pkmId);
    if (pkm) Object.assign(pkm, data);
    else pkm = data;
  }
  const contentDiv = document.getElementById("tabContent");
  if (tabName === "about") contentDiv.innerHTML = renderAbout(pkm);
  if (tabName === "stats") contentDiv.innerHTML = renderStats(pkm);
  if (tabName === "moves") contentDiv.innerHTML = renderMoves(pkm);
  if (tabName === "evolution") {
    contentDiv.innerHTML = "<p>Loading evolution chain...</p>";
    await loadAndRenderEvolution(pkmId);
  }
}

function updateTabButtons() {
  const buttons = document.querySelectorAll(".tabs button");
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove("active");
  }
  if (event) event.currentTarget.classList.add("active");
}

async function loadAndRenderEvolution(pkmId) {
  try {
    let speciesRes = await fetch(
      "https://pokeapi.co/api/v2/pokemon-species/" + pkmId,
    );
    let speciesData = await speciesRes.json();
    let evoRes = await fetch(speciesData.evolution_chain.url);
    let evoData = await evoRes.json();
    processEvolutionChain(evoData.chain);
  } catch (e) {
    document.getElementById("tabContent").innerHTML =
      "<p>No evolution data.</p>";
  }
}

function createEvoObject(currentPart) {
  let parts = currentPart.species.url.split("/");
  let id = parts[parts.length - 2];
  return {
    name: currentPart.species.name,
    id: parseInt(id),
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/" +
      id +
      ".png",
  };
}

function processEvolutionChain(chainData) {
  let evoChain = [];
  let currentPart = chainData;
  while (currentPart) {
    evoChain.push(createEvoObject(currentPart));
    currentPart = currentPart.evolves_to[0];
  }
  renderEvolutionChain(evoChain);
}

function searchPokemon() {
  let inputField = document.getElementById("searchInput");
  let query = inputField.value.toLowerCase().trim();
  if (query.length < 3) {
    alert("Please enter at least 3 letters to search.");
    return;
  }
  processSearch(query);
  inputField.value = "";
}

async function processSearch(query) {
  showLoadingSpinner();
  isSearchActive = true;
  let matches = await performSearchLoop(query);
  currentList = matches;
  displaySearchResults(matches);
  hideLoadingSpinner();
}

async function performSearchLoop(query) {
  let matches = [];
  for (let i = 0; i < pokemonIndex.length; i++) {
    let id = i + 1;
    if (pokemonIndex[i].name.includes(query) || id.toString() === query) {
      let cachedPkm = findPkmInArray(id);
      if (cachedPkm) {
        matches.push(cachedPkm);
      } else {
        let freshPkm = await fetchPokemonData(id);
        if (freshPkm) {
          allPokemon.push(freshPkm);
          matches.push(freshPkm);
        }
      }
    }
  }
  return matches;
}

async function fetchAndRenderMatches(matches) {
  if (matches.length > 0) {
    let searchResults = [];
    let limit = Math.min(matches.length, 25);
    for (let i = 0; i < limit; i++) {
      let id = matches[i].url.split("/").filter(Boolean).pop();
      searchResults.push(await fetchPokemonData(id));
    }
    renderList(searchResults);
    document.getElementById("loadMoreBtn").style.display = "none";
  } else {
    renderNoResultsFound();
  }
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

async function loadRegion(startId, endId) {
  if (isLoading) return;
  isSearchActive = false;
  isLoading = true;
  currentMinId = startId;
  currentMaxId = endId;
  listStart = startId;
  allPokemon = [];
  showLoadingSpinner();
  let count = Math.min(step, endId - startId + 1);
  let firstBatch = await fetchPkmRange(startId, count);
  handleNewBatch(firstBatch);
  finishLoading();
  closeMenus();
}

function closeMenus() {
  document.getElementById("sideMenu").classList.remove("active");
  document.getElementById("menuOverlay").classList.add("hidden");
  document.body.style.overflow = "auto";
}

function updateLoadMoreButtonVisibility() {
  let btn = document.getElementById("loadMoreBtn");
  btn.style.display = listStart > currentMaxId ? "none" : "block";
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("menuOverlay");
  menu.classList.toggle("active");
  overlay.classList.toggle("hidden");
  document.body.style.overflow = menu.classList.contains("active")
    ? "hidden"
    : "auto";
}