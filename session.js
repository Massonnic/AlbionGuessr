var modes = ["regions", "zones"];
var contents = ["bz", "royal", "all"];

var options = {
    content: contents[0],
    mode: modes[0],
    nosafe: false,
    training: false,
};
writeOptions();

// syncro des ids, au cas où le nom des modes changeraient
document.getElementById("regions").id = modes[0];
document.getElementById("zones").id = modes[1];

// modification du comportement du formulaire, empeche le changement de page et lance le jeu à la place
document.getElementById("submit").addEventListener('click', launch);

var circles = new Map(); // liste des cercles créer sur la map
var tab = Array(); // tableau des noms de zones, supposé etre fix
var tmp_tab = Array(); // idem mais variables
var counter = 0; // counter des bons points
var popup = L.popup({
    closeButton: false
});

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent(e.latlng.toString())
        .openOn(map);
}

function onZoneHover(circle, content) {
    popup
        .setLatLng([circle.getLatLng().lat + circle.getRadius(), circle.getLatLng().lng])
        .setContent(content)
        .openOn(map);
}

// ajoute un cercle sur la map, l'enregistre dans notre liste pour les retrouver
function registerCircle(zone) {
    let circle = L.circle([zone.position.lat, zone.position.lng], {
        radius: _radius
    });

    // si on s'entraine, on veut voir le nom de la zone au survol
    if (options.training) {
        circle.on('mouseover', () => onZoneHover(circle, zone.name));
        circle.on('mouseout', () => popup.close());
    }
    circle.addTo(map).on('click', () => {
        guess(circle, zone);
    });
    circles.set(zone, circle);
}

// appel lors de la validation du formulaire
function launch() {
    readOption();

    let f = () => {
        if (!options.nosafe) {
            zones.outlands.safes.forEach((zone) => registerCircle(zone));
        }
        if (true /*option bosses*/) {
            zones.outlands.bosses.forEach((zone) => registerCircle(zone));
        }
    };

    if (options.content == contents[2]) { // All
        zones.outlands.others.forEach((zone) => registerCircle(zone));
        zones.royals.blues.forEach((zone) => registerCircle(zone));
        zones.royals.yellows.forEach((zone) => registerCircle(zone));
        zones.royals.reds.forEach((zone) => registerCircle(zone));

        f();
    }
    else if (options.content == contents[0]) { // Blackzones
        zones.outlands.others.forEach((zone) => {
            if (options.mode == modes[0]) { // Regions
                zone.region = zone.name.split(' ')[0];
            }
            registerCircle(zone);
        });
        f();
    }
    else if (options.content == contents[1]) { // Royals
        zones.royals.blues.forEach((zone) => registerCircle(zone));
        zones.royals.yellows.forEach((zone) => registerCircle(zone));
        zones.royals.reds.forEach((zone) => registerCircle(zone));
    }

    // si on est en mode région, on veut s'assurer que la liste des tirages ne soit pas remplie de doublons
    if (options.mode == modes[0]) { // Regions
        let filterTab = Array();
        tab = Array.from(circles.keys().filter((zone) => {
            if (!filterTab.includes(zone.region) && zone.region != undefined) {
                filterTab.push(zone.region);
                return zone;
            }
            else if (zone.region == undefined) { // Au cas où c'est un portail / avant-poste / boss (qui n'ont pas de region)
                zone.region = zone.name;
                return zone;
            }
        }));
    }
    else {
        tab = Array.from(circles.keys());
    }
    tmp_tab = tab;

    // Cache le formulaire et Affiche la carte
    document.getElementById("option").style.visibility = "hidden";
    document.getElementById("option").style.position = "absolute";
    document.getElementById("game").style.visibility = "visible";

    // début du tirage
    pick();
}

function stop() {
    let result = `Fin ! ${counter}/${tab.length}\nRechargez la page pour une autre partie`;
    document.getElementById("guess_name").innerText = result;
}

function writeOptions() {
    document.getElementById(`${options.content}`).checked = true;

    // Assure que seul le contenu bz puisse choisir un mode (region pour le royal n'a pas trop d'interet)
    document.getElementsByName("content").forEach(() => addEventListener('change', (e) => {
        if (e.target.name != "content") return;
        if (e.target.id == "bz" && e.target.checked) {
            document.getElementById("mode").style = "";
        }
        else {
            document.getElementById("mode").style.visibility = "hidden";
            document.getElementById("mode").style.position = "absolute";
        }
    }));

    // Idem, assure que le comportement est actif sans changement
    if (options.content != contents[0]) {
        document.getElementById("mode").style.visibility = "hidden";
        document.getElementById("mode").style.position = "absolute";
    }

    document.getElementById(`${options.mode}`).checked = true;
    document.getElementById("nosafe").checked = options.nosafe;
    document.getElementById("training").checked = options.training;
}

function readOption() {
    document.getElementsByName("mode").forEach((e) => {
        if (e.checked) {
            options.mode = e.id;
        }
    });
    document.getElementsByName("content").forEach((e) => {
        if (e.checked) {
            options.content = e.id;
        }
    });
    options.nosafe = document.getElementById("nosafe").checked;
    options.training = document.getElementById("training").checked;
}

// traitement du choix du joueur
function guess(circle, zone) {
    let name = document.getElementById("guess_name").innerText;
    
    if (options.mode == modes[0]) { // Regions
        if (zone.region === name) { // si bonne reponse, on passe la zone en verte et infobulle
            colorize_circles(name, "green");
            circle.off();
            circle.on('mouseover', () => onZoneHover(circle, zone.name));
            circle.on('mouseout', () => popup.close());

            counter++; // +1 bonne réponse
            pick()
        }
        else { // si mauvaise réponse même chose mais la zone non trouvé passe en rouge et infobulle
            colorize_circles(zone.region, "orange");
            let pop = createPopup(circle.getLatLng(), zone.region)
            setTimeout(() => {
                pop.close();
                colorize_circles(zone.region, "#3388ff");
                map.setView(get_region_center(name), map.zoom);
                circles.forEach((circle, zone) => {
                    if (zone.region === name) {
                        circle.off();
                        circle.on('mouseover', () => onZoneHover(circle, zone.name));
                        circle.on('mouseout', () => popup.close());
                    }
                });
                pick();
            }, 1500);
            colorize_circles(name, "red");
        }
    }
    else if (name === zone.name) { // mode Zones et bonne réponse
        circles.get(zone).setStyle({
            color: "green"
        });
        circles.get(zone).off();
        circles.get(zone).on('mouseover', () => onZoneHover(circle, zone.name));
        circles.get(zone).on('mouseout', () => popup.close());

        counter++;
        pick();
    }
    else { // mode Zones, mauvaise réponse
        let goodCircle;
        circles.forEach((circle, zone) => { //cherche la zone à trouver
            if (zone.name === name) {
                circle.setStyle({
                    color: "red"
                });
                circle.off();
                circle.on('mouseover', () => onZoneHover(circle, zone.name));
                circle.on('mouseout', () => popup.close());

                goodCircle = circle;
            }
        });

        // notifie que la zone choisi n'etait pas la bonne
        colorize_circle(circle, "orange");
        let pop = createPopup(circle.getLatLng(), zone.name)
        setTimeout(() => {
            pop.close();
            colorize_circle(circle, "#3388ff");
            map.setView(goodCircle.getLatLng(), map.zoom);
            pick();
        }, 1500);
    }
}

function createPopup(latLng, content) {
    return L.popup(latLng, {
        content: content,
        closeButton: false,
    }).openOn(map);
}

function colorize_circles(region_name, color) {
    circles.forEach((circle, zone) => {
        if (zone.region === region_name) {
            colorize_circle(circle, color)
        }
    })
}

function colorize_circle(circle, color) {
    circle.setStyle({
        color: color
    });
}

function get_region_center(name) {
    let minLat = Number.MAX_SAFE_INTEGER, maxLat = Number.MIN_SAFE_INTEGER;
    let minLng = Number.MAX_SAFE_INTEGER, maxLng = Number.MIN_SAFE_INTEGER;
    circles.forEach((circle, zone) => {
        if (zone.region == name) {
            if (circle.getLatLng().lat < minLat) {
                minLat = circle.getLatLng().lat;
            }
            if (circle.getLatLng().lat > maxLat) {
                maxLat = circle.getLatLng().lat;
            }
            if (circle.getLatLng().lng < minLng) {
                minLng = circle.getLatLng().lng;
            }
            if (circle.getLatLng().lng > maxLng) {
                maxLng = circle.getLatLng().lng;
            }
        }
    });
    return L.latLngBounds([minLat, minLng], [maxLat, maxLng]).getCenter();
}

// tirage d'un nom
function pick() {
    let max = tmp_tab.length;
    /* if (options.training) { 
        max = tab.length;
    } */

    if (max > 0) {
        let x = Math.floor(Math.random() * max);
        if (options.mode == modes[0]) { // Regions
            /* if (tmp_tab[x].region == undefined) {
                tmp_tab[x].region = tmp_tab[x].name;
            } */
            document.getElementById("guess_name").innerText = tmp_tab[x].region; //on affiche le nom de la zone que pas sa region
        }
        else { // Zones
            document.getElementById("guess_name").innerText = tmp_tab[x].name; //on affiche le nom complet
        }
    
        //if (!options.training) {
            delete tmp_tab[x];
            tmp_tab = tmp_tab.filter((el) => {
                return el != null;
            });
        //}
    }
    else { // quand la liste est vide, alors c'est la fin du jeu
        stop();
    }
}

/* function shuffle() {
    let currentIndex = tmp_tab.length;

    while (currentIndex != 0) {
        let index = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [tmp_tab[currentIndex], tmp_tab[index]] = [tmp_tab[index], tmp_tab[currentIndex]];
    }
} */