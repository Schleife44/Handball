/* Diesen Code in eine Datei namens script.js kopieren */

// --- 1. Alle HTML-Elemente holen ---
const timerAnzeige = document.getElementById('timerAnzeige');
const spielSteuerung = document.getElementById('spielSteuerung');
const protokollBereich = document.getElementById('protokoll');
const protokollAusgabe = document.getElementById('protokollAusgabe');
const torButton = document.getElementById('torButton');
const siebenMeterButton = document.getElementById('siebenMeterButton');
const aktionButton = document.getElementById('aktionButton');
const kommentarBereich = document.getElementById('kommentarBereich');
const kommentarInput = document.getElementById('kommentarInput');
const kommentarSpeichernButton = document.getElementById('kommentarSpeichernButton');
const pauseButton = document.getElementById('pauseButton');
const zeitSprungBereich = document.getElementById('zeitSprung');
const zurueckButton = document.getElementById('zurueckButton');
const vorButton = document.getElementById('vorButton');
const startBereich = document.getElementById('startBereich');
const startButtonStart7 = document.getElementById('startButtonStart7');
const startButtonBank = document.getElementById('startButtonBank');
const wechselButton = document.getElementById('wechselButton');
const aktionVorauswahl = document.getElementById('aktionVorauswahl');
const abwehrButton = document.getElementById('abwehrButton');
const tgPassButton = document.getElementById('tgPassButton');
const guterPassButton = document.getElementById('guterPassButton');
const anderesButton = document.getElementById('anderesButton');
const aktionAbbrechenButton = document.getElementById('aktionAbbrechenButton');

// NEUE Elemente
const verwaltung = document.getElementById('verwaltung');
const neuesSpielButton = document.getElementById('neuesSpielButton');
const exportButton = document.getElementById('exportButton');


// --- 2. Spiel-Zustand (Variablen) ---
let timerInterval; 
let aktuelleAktionTyp = ''; 

// Der gesamte Spielstand in einem Objekt, das wir speichern
let spielstand = {
    protokoll: [],
    istPausiert: true,
    segmentStartZeit: 0,
    verstricheneSekundenBisher: 0, 
    istEinwechseln: true,
    spielGestartet: false
};

const SPEICHER_KEY = 'handballGameState'; // Name für den Local Storage

// --- 3. Local Storage & Speicher-Funktionen ---

function speichereSpielstand() {
    // Speichert das 'spielstand'-Objekt als Text im Browser
    localStorage.setItem(SPEICHER_KEY, JSON.stringify(spielstand));
}

function ladeSpielstand() {
    const gespeicherterStand = localStorage.getItem(SPEICHER_KEY);
    if (gespeicherterStand) {
        spielstand = JSON.parse(gespeicherterStand);
        
        // Nach dem Laden ist das Spiel IMMER pausiert
        spielstand.istPausiert = true; 
        
        // UI wiederherstellen, wenn das Spiel schonmal gestartet war
        if (spielstand.spielGestartet) {
            zeigeSpielUI(false); // UI anzeigen (ohne Timer zu starten)
            updateProtokollAnzeige();
            timerAnzeige.textContent = formatiereZeit(spielstand.verstricheneSekundenBisher);
            pauseButton.textContent = 'Weiter';
            setSteuerungAktiv(false); // Da es pausiert ist
            wechselButton.textContent = spielstand.istEinwechseln ? 'Einwechseln' : 'Auswechseln';
        }
    }
}

// --- 4. Kern-Funktionen (Timer, Protokoll) ---

function formatiereZeit(sekunden) {
    const min = Math.floor(sekunden / 60);
    const sek = sekunden % 60;
    const formatierteMin = min < 10 ? '0' + min : min;
    const formatierteSek = sek < 10 ? '0' + sek : sek;
    return `${formatierteMin}:${formatierteSek}`;
}

function updateTimer() {
    const aktuelleSegmentSekunden = (Date.now() - spielstand.segmentStartZeit) / 1000;
    const totalSekunden = spielstand.verstricheneSekundenBisher + aktuelleSegmentSekunden;
    
    if (totalSekunden < 0) {
        spielstand.verstricheneSekundenBisher = 0;
        spielstand.segmentStartZeit = Date.now(); 
        timerAnzeige.textContent = formatiereZeit(0);
    } else {
        timerAnzeige.textContent = formatiereZeit(Math.floor(totalSekunden));
    }
}

function logAktion(aktion, kommentar = null) {
    const aktuelleZeit = timerAnzeige.textContent;
    const eintrag = {
        zeit: aktuelleZeit,
        aktion: aktion,
        kommentar: kommentar
    };
    spielstand.protokoll.unshift(eintrag);
    updateProtokollAnzeige();
    speichereSpielstand(); // Bei jeder Aktion speichern
}

function updateProtokollAnzeige() {
    protokollAusgabe.innerHTML = '';
    
    spielstand.protokoll.forEach((eintrag, index) => {
        const p = document.createElement('p');
        const textSpan = document.createElement('span');
        let text = `<strong>[${eintrag.zeit}] ${eintrag.aktion}</strong>`;
        if (eintrag.kommentar) {
            text += `: ${eintrag.kommentar}`;
        }
        textSpan.innerHTML = text;
        
        const loeschButton = document.createElement('button');
        loeschButton.textContent = 'Löschen';
        loeschButton.className = 'loeschButton'; 
        
        loeschButton.addEventListener('click', function() {
            loescheEintrag(index);
        });

        p.appendChild(textSpan);
        p.appendChild(loeschButton);
        protokollAusgabe.appendChild(p);
    });
}

function loescheEintrag(index) {
    spielstand.protokoll.splice(index, 1);
    updateProtokollAnzeige();
    speichereSpielstand(); // Nach dem Löschen speichern
}

// --- 5. UI-Helfer-Funktionen ---

function setSteuerungAktiv(aktiv) {
    torButton.disabled = !aktiv;
    siebenMeterButton.disabled = !aktiv;
    aktionButton.disabled = !aktiv;
    wechselButton.disabled = !aktiv; 
}

function toggleHauptSteuerung(sichtbar) {
    if (sichtbar) {
        spielSteuerung.classList.remove('versteckt');
        wechselButton.classList.remove('versteckt');
    } else {
        spielSteuerung.classList.add('versteckt');
        wechselButton.classList.add('versteckt');
    }
}

// Zeigt alle Elemente für ein laufendes Spiel
function zeigeSpielUI(timerStarten) {
    timerAnzeige.classList.remove('versteckt');
    zeitSprungBereich.classList.remove('versteckt');
    pauseButton.classList.remove('versteckt');
    spielSteuerung.classList.remove('versteckt');
    wechselButton.classList.remove('versteckt');
    protokollBereich.classList.remove('versteckt');
    verwaltung.classList.remove('versteckt'); // NEU
    
    startBereich.classList.add('versteckt');

    if (timerStarten) {
        spielstand.istPausiert = false;
        timerInterval = setInterval(updateTimer, 1000);
    }
}

function handleGuteAktion(typ) {
    aktuelleAktionTyp = 'Gute Aktion: ' + typ;
    aktionVorauswahl.classList.add('versteckt');
    kommentarBereich.classList.remove('versteckt');
    kommentarInput.focus();
}

// --- 6. Export & Neues Spiel Funktionen ---

function exportiereAlsTxt() {
    let dateiInhalt = "Protokoll Handball-Tracker\n\n";
    
    // Protokoll-Array rückwärts durchlaufen, damit 00:00 oben steht
    [...spielstand.protokoll].reverse().forEach(eintrag => {
        dateiInhalt += `[${eintrag.zeit}] ${eintrag.aktion}`;
        if (eintrag.kommentar) {
            dateiInhalt += `: ${eintrag.kommentar}`;
        }
        dateiInhalt += "\n"; // Zeilenumbruch
    });

    // Download-Link erstellen
    const blob = new Blob([dateiInhalt], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'handball_protokoll.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function starteNeuesSpiel() {
    if (confirm("Bist du sicher? Alle Daten dieses Spiels werden gelöscht.")) {
        localStorage.removeItem(SPEICHER_KEY);
        // Seite neu laden ist der einfachste Weg, alles zurückzusetzen
        location.reload(); 
    }
}

// --- 7. Event Listener (Was passiert bei Klicks) ---

// 7.1 Start-Knöpfe
function starteSpiel(startGrund, istAufDemFeld) {
    spielstand.segmentStartZeit = Date.now();
    spielstand.verstricheneSekundenBisher = 0;
    
    timerAnzeige.textContent = '00:00';
    
    if (istAufDemFeld) {
        wechselButton.textContent = 'Auswechseln';
        spielstand.istEinwechseln = false;
    } else {
        wechselButton.textContent = 'Einwechseln';
        spielstand.istEinwechseln = true;
    }

    spielstand.spielGestartet = true;
    zeigeSpielUI(true); // Spiel-UI anzeigen UND Timer starten
    logAktion(startGrund); // Loggt mit 00:00 (speichert auch)
}

startButtonStart7.addEventListener('click', function() {
    starteSpiel('Spielstart (Start 7)', true);
});
startButtonBank.addEventListener('click', function() {
    starteSpiel('Spielstart (Bank)', false);
});

// 7.2 Timer-Steuerung
pauseButton.addEventListener('click', function() {
    if (spielstand.istPausiert === false) {
        clearInterval(timerInterval);
        const segmentSekunden = (Date.now() - spielstand.segmentStartZeit) / 1000;
        spielstand.verstricheneSekundenBisher += segmentSekunden;
        spielstand.istPausiert = true;
        pauseButton.textContent = 'Weiter';
        setSteuerungAktiv(false); 
    } else {
        spielstand.segmentStartZeit = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
        spielstand.istPausiert = false;
        pauseButton.textContent = 'Pause';
        setSteuerungAktiv(true);
    }
    speichereSpielstand(); // Pausenstatus speichern
});

zurueckButton.addEventListener('click', function() {
    if (spielstand.istPausiert) {
        spielstand.verstricheneSekundenBisher -= 30;
        if (spielstand.verstricheneSekundenBisher < 0) {
            spielstand.verstricheneSekundenBisher = 0;
        }
        timerAnzeige.textContent = formatiereZeit(spielstand.verstricheneSekundenBisher);
    } else {
        spielstand.segmentStartZeit += 30000;
        updateTimer();
    }
    speichereSpielstand(); // Zeit-Änderung speichern
});
vorButton.addEventListener('click', function() {
    if (spielstand.istPausiert) {
        spielstand.verstricheneSekundenBisher += 30;
        timerAnzeige.textContent = formatiereZeit(spielstand.verstricheneSekundenBisher);
    } else {
        spielstand.segmentStartZeit -= 30000;
        updateTimer();
    }
    speichereSpielstand(); // Zeit-Änderung speichern
});

// 7.3 Haupt-Aktionsknöpfe
torButton.addEventListener('click', function() { logAktion('Tor'); });
siebenMeterButton.addEventListener('click', function() { logAktion('7Meter rausgeholt'); });

wechselButton.addEventListener('click', function() {
    if (spielstand.istEinwechseln) {
        logAktion('Einwechseln');
        wechselButton.textContent = 'Auswechseln';
        spielstand.istEinwechseln = false;
    } else {
        logAktion('Auswechseln');
        wechselButton.textContent = 'Einwechseln';
        spielstand.istEinwechseln = true;
    }
    speichereSpielstand(); // Wechsel-Status speichern
});

// 7.4 "Gute Aktion" Vorauswahl-Logik
aktionButton.addEventListener('click', function() {
    toggleHauptSteuerung(false);
    aktionVorauswahl.classList.remove('versteckt');
});
abwehrButton.addEventListener('click', function() { handleGuteAktion('Abwehr'); });
tgPassButton.addEventListener('click', function() { handleGuteAktion('TG Pass'); });
guterPassButton.addEventListener('click', function() { handleGuteAktion('Guter Pass'); });
anderesButton.addEventListener('click', function() { handleGuteAktion('Anderes'); });
aktionAbbrechenButton.addEventListener('click', function() {
    aktionVorauswahl.classList.add('versteckt');
    toggleHauptSteuerung(true);
});

// 7.5 Kommentar Speichern
kommentarSpeichernButton.addEventListener('click', function() {
    const kommentarText = kommentarInput.value;
    logAktion(aktuelleAktionTyp, kommentarText.trim() !== '' ? kommentarText : null);
    
    kommentarInput.value = '';
    kommentarBereich.classList.add('versteckt');
    aktuelleAktionTyp = '';
    
    toggleHauptSteuerung(true);
    // logAktion ruft bereits speichereSpielstand() auf
});

// 7.6 Verwaltung
neuesSpielButton.addEventListener('click', starteNeuesSpiel);
exportButton.addEventListener('click', exportiereAlsTxt);


// --- 8. Initialisierung ---
// Wenn die Seite geladen wird, versuche, einen alten Spielstand zu laden
ladeSpielstand();