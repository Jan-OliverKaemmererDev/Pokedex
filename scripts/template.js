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
  let prevId, nextId, showPrev, showNext, prevPkm, nextPkm;
  if (isSearchActive) {
    let currentIndex = currentList.findIndex(function(p) {
      return p.id === currentId;
    });
    showPrev = currentIndex > 0;
    showNext = currentIndex < currentList.length - 1;
    if (showPrev) {
      prevPkm = currentList[currentIndex - 1];
      prevId = prevPkm.id;
    }
    if (showNext) {
      nextPkm = currentList[currentIndex + 1];
      nextId = nextPkm.id;
    }
  } else {
    prevId = currentId - 1;
    nextId = currentId + 1;
    showPrev = prevId >= currentMinId;
    showNext = nextId <= currentMaxId;
    prevPkm = allPokemon.find(function(p) { return p.id === prevId; });
    nextPkm = allPokemon.find(function(p) { return p.id === nextId; });
  }
  let prevImg = "";
  if (showPrev) {
    prevImg = (prevPkm && prevPkm.sprites) ? prevPkm.sprites.front_default : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${prevId}.png`;
  }
  let nextImg = "";
  if (showNext) {
    nextImg = (nextPkm && nextPkm.sprites) ? nextPkm.sprites.front_default : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nextId}.png`;
  }
  return `
        <div class="nav-arrows">
            <button class="nav-btn-left" onclick="navigatePkm(${prevId})" 
                style="visibility: ${showPrev ? "visible" : "hidden"}">
                <img src="./assets/img/arrow_left.png" class="arrow-icon">
                <img src="${prevImg}" class="preview-img">
            </button>
            
            <button class="nav-btn-right" onclick="navigatePkm(${nextId})"
                style="visibility: ${showNext ? "visible" : "hidden"}">
                <img src="${nextImg}" class="preview-img">
                <img src="./assets/img/arrow_right.png" class="arrow-icon">
            </button>
        </div>
    `;
}

function renderEvolutionChain(chain) {
  let html = '<div class="evolution-container">';
  for (let i = 0; i < chain.length; i++) {
    let pkm = chain[i];
    let name = pkm.name.charAt(0).toUpperCase() + pkm.name.slice(1);

    html += `
            <div class="evo-step" onclick="navigatePkm(${pkm.id})">
                <div class="evo-img-bg">
                    <img src="${pkm.image}" alt="${name}">
                </div>
                <p>${name}</p>
            </div>
        `;
    if (i < chain.length - 1) {
      html += '<div class="evo-arrow">➜</div>';
    }
  }
  html += "</div>";
  document.getElementById("tabContent").innerHTML = html;
}

function getRegionButtonTemplate(region) {
  let regionClass = region.name.toLowerCase();
  return `
        <button class="region-btn btn-${regionClass}" onclick="loadRegion(${region.start}, ${region.end})">
            ${region.name}
        </button>
    `;
}

function renderAbout(pkm) {
  const hasFullSpecies = pkm.species && pkm.species.genera;
  const genus = hasFullSpecies ? getGenus(pkm) : "Unknown";
  const eggGroups = hasFullSpecies ? getEggGroups(pkm) : "Unknown";
  let habitat = (hasFullSpecies && pkm.species.habitat) ? pkm.species.habitat.name : "Unknown";

  const heightInMeters = pkm.height / 10;
  const weightInKg = pkm.weight / 10;

  let abilityNames = pkm.abilities.map(function(a) {
        return a.ability.name;
    });
    let abilities = abilityNames.join(', ');

  return `
    <table class="info-table">
        <tr><td class="label-td">Species</td><td class="value-td">${genus}</td></tr>
        <tr><td class="label-td">Height</td><td class="value-td">${heightInMeters} m</td></tr>
        <tr><td class="label-td">Weight</td><td class="value-td">${weightInKg} kg</td></tr>
        <tr><td class="label-td">Abilities</td><td class="value-td">${abilities}</td></tr>
    </table>
    
    <h4 class="breeding-title">Breeding</h4>
    
    <table class="info-table">
        <tr><td class="label-td">Egg Groups</td><td class="value-td">${eggGroups}</td></tr>
        <tr><td class="label-td">Habitat</td><td class="value-td" style="text-transform: capitalize;">${habitat}</td></tr>
    </table>
  `;
}

function getGenus(pkm) {
    if (!pkm.species || !pkm.species.genera) {
        return "Unknown";
    }
    let genusEntry = pkm.species.genera.find(function(g) {
        return g.language.name === "en";
    });
    if (genusEntry) {
        return genusEntry.genus;
    } else {
        return "Unknown";
    }
}

function getEggGroups(pkm) {
    if (!pkm.species || !pkm.species.egg_groups) {
        return "Unknown";
    }
    let groups = pkm.species.egg_groups.map(function(group) {
        let name = group.name;
        return name.charAt(0).toUpperCase() + name.slice(1);
    });
    return groups.join(', ');
}

function renderStats(pkm) {
  let html = "";
  const statsMap = {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    "special-attack": "Sp. Atk",
    "special-defense": "Sp. Def",
    speed: "Speed",
  };

  let total = 0;
  pkm.stats.forEach((s) => {
    total += s.base_stat;
    const barColor = s.base_stat >= 50 ? "#48d0b0" : "#fb7676";
    html += `
            <div class="stat-row">
                <div class="stat-label">${statsMap[s.stat.name] || s.stat.name}</div>
                <div class="stat-value">${s.base_stat}</div>
                <div class="stat-bar-bg">
                    <div class="stat-bar-fill" style="width: ${(s.base_stat / 150) * 100}%; background-color: ${barColor}"></div>
                </div>
            </div>
        `;
  });

  html += `<div class="stat-row"><div class="stat-label">Total</div><div class="stat-value">${total}</div></div>`;
  return html;
}

function renderMoves(pkm) {
  const movesHtml = pkm.moves
    .slice(0, 20)
    .map((m) => `<span class="move-tag">${m.move.name}</span>`)
    .join("");
  return `<div class="moves-container">${movesHtml}</div>`;
}

function renderTypes(types) {
  let html = "";
  for (let i = 0; i < types.length; i++) {
    html += `<span class="type-badge ${types[i].type.name}">${types[i].type.name}</span>`;
  }
  return html;
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
