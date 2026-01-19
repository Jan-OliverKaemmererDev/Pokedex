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
                    <div class="types-column">${renderTypes(pkm.types)}</div>
                </div>
                <div class="card-image-right"><img src="${img}" alt="${name}"></div>
            </div>
            <div class="card-bg-icon"></div> 
        </div>
    `;
}

async function getDetailTemplate(pkm) {
  let name = pkm.name.charAt(0).toUpperCase() + pkm.name.slice(1);
  let typeClass = pkm.types[0].type.name;
  let img = pkm.sprites.other["official-artwork"].front_default;
  let headerHtml = getDetailHeaderHtml(pkm, name, typeClass, img);
  let infoHtml = getDetailInfoHtml(pkm);
  let navHtml = await renderNavArrows(pkm.id);
  return `
        <div class="detail-card" onclick="event.stopPropagation()">
            ${headerHtml}
            ${infoHtml}
            ${navHtml}
        </div>
    `;
}

function getDetailHeaderHtml(pkm, name, typeClass, img) {
  return `
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
    `;
}

function getDetailInfoHtml(pkm) {
  return `
        <div class="detail-info-container">
            <div class="tabs">
                <button class="active" onclick="showTab('about', ${pkm.id})">About</button>
                <button onclick="showTab('stats', ${pkm.id})">Base Stats</button>
                <button onclick="showTab('evolution', ${pkm.id})">Evolution</button>
                <button onclick="showTab('moves', ${pkm.id})">Moves</button>
            </div>
            <div id="tabContent" class="tab-content">${renderAbout(pkm)}</div>
        </div>
    `;
}

async function renderNavArrows(currentId) {
  let navData = isSearchActive ? getSearchNav(currentId) : getRegionNav(currentId);
  let prevImg = getNavImg(navData.showPrev, navData.prevId, navData.prevPkm);
  let nextImg = getNavImg(navData.showNext, navData.nextId, navData.nextPkm);
  return `
        <div class="nav-arrows">
            <button class="nav-btn-left" onclick="navigatePkm(${navData.prevId})" 
                style="visibility: ${navData.showPrev ? "visible" : "hidden"}">
                <img src="./assets/img/arrow_left.png" class="arrow-icon">
                <img src="${prevImg}" class="preview-img">
            </button>
            <button class="nav-btn-right" onclick="navigatePkm(${navData.nextId})"
                style="visibility: ${navData.showNext ? "visible" : "hidden"}">
                <img src="${nextImg}" class="preview-img">
                <img src="./assets/img/arrow_right.png" class="arrow-icon">
            </button>
        </div>
    `;
}

function getSearchNav(currentId) {
  let idx = currentList.findIndex(function(p) { return p.id === currentId; });
  let prev = currentList[idx - 1];
  let next = currentList[idx + 1];
  return {
    showPrev: idx > 0,
    showNext: idx < currentList.length - 1,
    prevId: prev ? prev.id : null,
    nextId: next ? next.id : null,
    prevPkm: prev,
    nextPkm: next
  };
}

function getRegionNav(currentId) {
  let pId = currentId - 1;
  let nId = currentId + 1;
  return {
    showPrev: pId >= currentMinId,
    showNext: nId <= currentMaxId,
    prevId: pId,
    nextId: nId,
    prevPkm: allPokemon.find(function(p) { return p.id === pId; }),
    nextPkm: allPokemon.find(function(p) { return p.id === nId; })
  };
}

function getNavImg(show, id, pkm) {
  if (!show) return "";
  if (pkm && pkm.sprites) return pkm.sprites.front_default;
  return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" + id + ".png";
}

function renderAbout(pkm) {
  const hasSpecies = pkm.species && pkm.species.genera;
  const genus = hasSpecies ? getGenus(pkm) : "Unknown";
  const eggGroups = hasSpecies ? getEggGroups(pkm) : "Unknown";
  const habitat = (hasSpecies && pkm.species.habitat) ? pkm.species.habitat.name : "Unknown";
  const height = pkm.height / 10;
  const weight = pkm.weight / 10;
  let names = [];
  for (let i = 0; i < pkm.abilities.length; i++) {
    names.push(pkm.abilities[i].ability.name);
  }
  return renderAboutTables(genus, height, weight, names.join(', '), eggGroups, habitat);
}

function renderAboutTables(genus, h, w, abil, eggs, hab) {
  return `
    <table class="info-table">
        <tr><td class="label-td">Species</td><td class="value-td">${genus}</td></tr>
        <tr><td class="label-td">Height</td><td class="value-td">${h} m</td></tr>
        <tr><td class="label-td">Weight</td><td class="value-td">${w} kg</td></tr>
        <tr><td class="label-td">Abilities</td><td class="value-td">${abil}</td></tr>
    </table>
    <h4 class="breeding-title">Breeding</h4>
    <table class="info-table">
        <tr><td class="label-td">Egg Groups</td><td class="value-td">${eggs}</td></tr>
        <tr><td class="label-td">Habitat</td><td class="value-td" style="text-transform: capitalize;">${hab}</td></tr>
    </table>
  `;
}

function renderStats(pkm) {
  let html = "";
  const statsMap = { hp: "HP", attack: "Attack", defense: "Defense", "special-attack": "Sp. Atk", "special-defense": "Sp. Def", speed: "Speed" };
  let total = 0;
  for (let i = 0; i < pkm.stats.length; i++) {
    let s = pkm.stats[i];
    total += s.base_stat;
    let barColor = s.base_stat >= 50 ? "#48d0b0" : "#fb7676";
    let label = statsMap[s.stat.name] || s.stat.name;
    html += `
        <div class="stat-row">
            <div class="stat-label">${label}</div>
            <div class="stat-value">${s.base_stat}</div>
            <div class="stat-bar-bg">
                <div class="stat-bar-fill" style="width: ${(s.base_stat / 150) * 100}%; background-color: ${barColor}"></div>
            </div>
        </div>`;
  }
  return html + `<div class="stat-row"><div class="stat-label">Total</div><div class="stat-value">${total}</div></div>`;
}

function renderMoves(pkm) {
  let movesHtml = "";
  let limit = Math.min(pkm.moves.length, 20);
  for (let i = 0; i < limit; i++) {
    movesHtml += `<span class="move-tag">${pkm.moves[i].move.name}</span>`;
  }
  return `<div class="moves-container">${movesHtml}</div>`;
}

function renderTypes(types) {
  let html = "";
  for (let i = 0; i < types.length; i++) {
    html += `<span class="type-badge ${types[i].type.name}">${types[i].type.name}</span>`;
  }
  return html;
}

function getRegionButtonTemplate(region) {
    let regionClass = "btn-" + region.name.toLowerCase();
    return `
        <button class="region-btn ${regionClass}" onclick="loadRegion(${region.start}, ${region.end})">
            ${region.name}
        </button>
    `;
}

function getGenus(pkm) {
    let genusObj = pkm.species.genera.find(g => g.language.name === "en");
    return genusObj ? genusObj.genus : "Unknown";
}

function getEggGroups(pkm) {
    if (!pkm.species.egg_groups) return "Unknown";
    return pkm.species.egg_groups.map(group => group.name).join(", ");
}

function renderEvolutionChain(evoChain) {
    if (evoChain.length < 2) {
        document.getElementById("tabContent").innerHTML = '<p>No evolution data.</p>';
        return;
    }
    let html = '<div class="evolution-container pyramid-layout">';

    html += `
        <div class="evo-row top-row">
            <div class="evo-step" onclick="openDetailView(${evoChain[0].id})">
                <div class="evo-img-bg">
                    <img src="${evoChain[0].image}" alt="${evoChain[0].name}">
                </div>
                <p>${evoChain[0].name.charAt(0).toUpperCase() + evoChain[0].name.slice(1)}</p>
            </div>
        </div>
    `;

    html += '<div class="evo-arrow down-arrow">↓</div>';

    html += '<div class="evo-row bottom-row">';
    for (let i = 1; i < evoChain.length; i++) {
        html += `
            <div class="evo-step" onclick="openDetailView(${evoChain[i].id})">
                <div class="evo-img-bg">
                    <img src="${evoChain[i].image}" alt="${evoChain[i].name}">
                </div>
                <p>${evoChain[i].name.charAt(0).toUpperCase() + evoChain[i].name.slice(1)}</p>
            </div>
        `;

        if (i < evoChain.length - 1) {
            html += '<span class="evo-arrow">➔</span>';
        }
    }
    html += '</div></div>';
    
    document.getElementById("tabContent").innerHTML = html;
}

function displaySearchResults(matches) {
    if (matches.length > 0) {
        renderList(matches);
        document.getElementById("loadMoreBtn").style.display = "none";
    } else {
        renderNoResultsFound();
    }
}

function renderNoResultsFound() {
    document.getElementById("contentBox").innerHTML = `
        <div class="no-results">
            <p>No Pokémon found matching your search.</p>
        </div>
    `;
}