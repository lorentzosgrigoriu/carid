import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, push, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Configurare Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAD1-X7o_jzV5OjjA3p341VMP-wWsnjjmg",
    authDomain: "carid-eae71.firebaseapp.com",
    databaseURL: "https://carid-eae71-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "carid-eae71",
    storageBucket: "carid-eae71.firebasestorage.app",
    messagingSenderId: "571042772219",
    appId: "1:571042772219:web:925420319b3e8b898bac5e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let html5QrcodeScanner = null;
let esteProprietarMod = false;
let vinCurent = "";
let listaLucrariCompleta = [];

// Matricea de sugestii auto-complete pentru mecanic
const SUGESTII_LUCRARI = [
    "Revizie completa (Ulei + 4 filtre)", "Schimb ulei motor", "Schimb filtru ulei", "Schimb filtru aer", "Schimb filtru habitaclu (polen)", "Schimb filtru combustibil", "Schimb lichid de frana", "Schimb antigel / Curatare instalatie", "Schimb ulei cutie de viteze manuala", "Schimb ulei cutie automata (Metoda prin cadere)", "Schimb ulei cutie automata (Aparat / Dinamic)", "Schimb ulei diferential", "Schimb ulei cutie de transfer (4x4)", "Resetare interval service / Ulei",
    "Schimb placute frana fata", "Schimb placute frana spate", "Schimb discuri si placute frana fata", "Schimb discuri si placute frana spate", "Schimb lichid frana + Aerisire sistem", "Schimb etrier frana", "Reconditionare etrier (Garnituri + Piston)", "Schimb cablu frana de mana", "Reglaj frana de mana", "Schimb senzori uzura placute", "Schimb furtunuri frana (flexibile)", "Schimb pompa centrala de frana",
    "Schimb amortizoare fata", "Schimb amortizoare spate", "Schimb arcuri suspensie fata", "Schimb arcuri suspensie spate", "Schimb flanse amortizor", "Schimb bielete antiruliu fata", "Schimb bielete antiruliu spate", "Schimb bucse bara stabilizatoare", "Schimb brat suspensie / Pivot fata", "Schimb brat suspensie / Bucse spate", "Schimb pivoti directie", "Schimb capat de bara", "Schimb bieleta directie", "Schimb caseta de directie", "Schimb pompa servo-directie", "Schimb rulment roata fata", "Schimb rulment roata spate", "Geometrie roti (Unghi fuga)",
    "Schimb kit distributie (Curea + Role + Pompa apa)", "Schimb kit distributie pe lant", "Schimb curea accesorii (Transmisie)", "Schimb intinzator / Role curea accesorii", "Schimb pompa de apa", "Schimb termostat", "Schimb garnitura capac culbutori", "Schimb garnitura chiulasa", "Rectificare chiulasa / Schimb simeringuri supape", "Schimb garnitura baie ulei", "Schimb suport motor (Tampon fata/spate)", "Schimb suport cutie de viteze", "Curatare/Inlocuire clapeta acceleratie", "Masurare compresie cilindri",
    "Schimb injectoare (Set)", "Curatare / Calibrare injectoare", "Schimb saibe foc injectoare", "Schimb pompa inalta presiune (HPFP)", "Schimb pompa combustibil din rezervor", "Schimb rampa injectie / Senzor presiune", "Schimb bujii incandescente (Diesel)", "Schimb bujii scanteie (Benzina)", "Schimb fise / Bobine inductie",
    "Curatare chimica filtru de particule (DPF)", "Schimb senzor presiune diferentiala DPF", "Completare lichid AdBlue / Cerina", "Schimb senzor NOx", "Anulare / Curatare valva EGR", "Schimb valva EGR", "Schimb sonda Lambda", "Schimb racord flexibil evacuare", "Schimb toba esapament (Finala/Medie)",
    "Schimb kit ambreiaj complet (Placa + Disc + Rulment)", "Schimb kit ambreiaj + Volanta cu masa dubla", "Schimb cilindru receptor / Pompa ambreiaj", "Schimb planetara completa", "Schimb kit burduf planetara (Spre roata/cutie)", "Schimb racord flexibil cardan (Flansa)", "Schimb rulment intermediar cardan",
    "Igienizare sistem climatizare (Ozon / Spray)", "Reincarcare freon auto (R134a)", "Reincarcare freon auto (R1234yf)", "Schimb compresor aer conditionat", "Schimb radiator clima (Condensator)", "Schimb radiator racire motor", "Schimb electroventilator",
    "Diagnoza computerizata / Citire erori", "Stergere erori / Interpretare parametri in timp real", "Schimb baterie auto + Inregistrare (Codare)", "Schimb alternator", "Schimb electromotor (Demaror)", "Schimb senzori motor (Ax cu came / Arbore / ABS)", "Reparatie cablaj electric", "Reglaj faruri", "Schimb becuri / Kit Xenon / LED",
    "Schimb turbosuflanta (Turbina)", "Reconditionare turbosuflanta", "Schimb actuator turbina (Electric/Vacuumatic)", "Curatare galerie admisie / Clapete swirl", "Schimb radiator intercooler", "Schimb furtun intercooler (Presiune)"
];

// Navigatie intre ecrane
window.navigateTo = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if (pageId !== 'home-page') opresteScanner();
    if (pageId === 'garaj-page') incarcaGarajLocal();
    window.toggleFormPopup(false);
};

window.toggleDrawer = function(open) {
    document.getElementById('drawerMenu').classList.toggle('open', open);
    document.getElementById('drawerOverlay').style.display = open ? 'block' : 'none';
};

// NOU: Deschidere/Inchidere Pop-up de adaugare lucrare
window.toggleFormPopup = function(show) {
    const container = document.getElementById('formPopupContainer');
    const overlay = document.getElementById('formPopupOverlay');
    if(show) {
        container.classList.add('open');
        overlay.style.display = 'block';
        initializeazaAutocompleteDescriere();
    } else {
        container.classList.remove('open');
        overlay.style.display = 'none';
    }
};

// Seteaza rol si deschide scanner
window.setRol = function(rol) {
    esteProprietarMod = (rol === 'proprietar');
    document.getElementById('scanner-container').style.display = 'block';
    
    html5QrcodeScanner = new Html5Qrcode("reader");
    html5QrcodeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        window.proceseazaCodScanat,
        () => {}
    ).catch(err => alert("Eroare acces camera: " + err));
};

window.opresteScanner = function() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            document.getElementById('scanner-container').style.display = 'none';
            html5QrcodeScanner = null;
        }).catch(e => console.log(e));
    }
};

window.proceseazaCodScanat = function(textScanat) {
    let vinCurat = textScanat.trim();
    if (vinCurat.includes("?vin=")) {
        const urlParams = new URLSearchParams(vinCurat.substring(vinCurat.indexOf('?')));
        vinCurat = urlParams.get('vin') || "";
    } else if (vinCurat.startsWith("VIN:")) {
        vinCurat = vinCurat.replace("VIN:", "").trim();
    }
    vinCurat = vinCurat.toUpperCase();

    if (vinCurat.length === 17) {
        opresteScanner();
        if (esteProprietarMod) {
            let vreaSalvare = confirm(`🚗 Vehicul detectat (${vinCurat})!\n\nDoresti sa SALVEZI aceasta masina in Garajul tau pentru acces rapid?`);
            if (vreaSalvare) salveazaInGarajLocal(vinCurat);
        }
        deschideDetalii(vinCurat);
    } else {
        alert("Codul QR nu contine un VIN valid de 17 caractere!");
    }
};

// Management Garaj Local (LocalStorage)
function salveazaInGarajLocal(vin) {
    try {
        let garaj = JSON.parse(localStorage.getItem('garaj_carid')) || [];
        if (!garaj.includes(vin)) {
            garaj.push(vin);
            localStorage.setItem('garaj_carid', JSON.stringify(garaj));
        }
    } catch (e) { console.error(e); }
}

function incarcaGarajLocal() {
    const containerGaraj = document.getElementById('lista-garaj');
    if (!containerGaraj) return; 
    containerGaraj.innerHTML = "";
    let garaj = JSON.parse(localStorage.getItem('garaj_carid')) || [];

    if (garaj.length === 0) {
        containerGaraj.innerHTML = `<p style="color: #757575; font-style: italic; text-align: center; margin-top: 15px;">Nicio masina salvata in garaj. Scaneaza un cod QR pentru a adauga.</p>`;
        return;
    }

    garaj.forEach(vin => {
        const cardMasina = document.createElement('div');
        cardMasina.style.cssText = "background: #1565C0; color: white; padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2); font-weight: bold; cursor: pointer;";
        cardMasina.onclick = function(e) {
            if(e.target.tagName === 'BUTTON') return;
            esteProprietarMod = true;
            deschideDetalii(vin);
        };
        cardMasina.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>🚘</span>
                <span style="font-size: 15px; letter-spacing: 1px; font-family: monospace;">${vin}</span>
            </div>
            <button onclick="stergeDinGaraj('${vin}')" style="background: transparent; border: none; color: white; font-size: 1.2rem; cursor: pointer; padding: 5px;">🗑️</button>
        `;
        containerGaraj.appendChild(cardMasina);
    });
}

window.stergeDinGaraj = function(vin) {
    if (confirm(`Sigur vrei sa stergi masina cu VIN-ul ${vin}?`)) {
        let garaj = JSON.parse(localStorage.getItem('garaj_carid')) || [];
        garaj = garaj.filter(item => item !== vin);
        localStorage.setItem('garaj_carid', JSON.stringify(garaj));
        incarcaGarajLocal();
    }
};

// Deschidere pagina detalii masina
function deschideDetalii(vin) {
    vinCurent = vin;
    document.getElementById('vin-title').innerText = "VIN: " + vin;
    document.getElementById('etPin').value = "";
    
    const btnPlutitor = document.getElementById('btnDeschideFormular');
    const ecranPin = document.getElementById('ecran-pin-blocat');
    const continutMasina = document.getElementById('continut-detalii-masina');

    if (esteProprietarMod) {
        btnPlutitor.style.display = 'none';
        ecranPin.style.display = 'flex';
        continutMasina.style.display = 'none';
    } else {
        btnPlutitor.style.display = 'flex'; // Afisat doar pentru Mecanic
        ecranPin.style.display = 'none';
        continutMasina.style.display = 'block';
        incarcaIstoric();
    }
    navigateTo('details-page');
}

window.verificaPinWeb = function() {
    const pinIntrodus = document.getElementById('etPin').value.trim();
    get(ref(db, `Masini/${vinCurent}/pin`)).then((snapshot) => {
        if (snapshot.exists() && snapshot.val().toString() === pinIntrodus) {
            document.getElementById('ecran-pin-blocat').style.display = 'none';
            document.getElementById('continut-detalii-masina').style.display = 'block';
            incarcaIstoric();
        } else {
            alert("PIN Incorect! Acces refuzat.");
            document.getElementById('etPin').value = "";
        }
    });
};

// Incarcare si filtrare istoric din Firebase
function incarcaIstoric() {
    get(ref(db, `Masini/${vinCurent}/lucrari`)).then((snapshot) => {
        listaLucrariCompleta = [];
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                let l = child.val();
                l.id = child.key;
                listaLucrariCompleta.push(l);
            });
            listaLucrariCompleta.sort((a, b) => parseInt(b.km || 0) - parseInt(a.km || 0));
        }
        filtreazaLucrari("");
        actualizeazaSemafor();
    });
}

window.filtreazaLucrari = function(query) {
    const q = query.toLowerCase();
    const container = document.getElementById('istoric-lucrari-container');
    container.innerHTML = "";
    const filtrate = listaLucrariCompleta.filter(l => (l.descriere && l.descriere.toLowerCase().includes(q)) || (l.km && l.km.toString().includes(q)));

    filtrate.forEach(l => {
        const card = document.createElement('div');
        card.style.cssText = "background: #FFF; padding: 12px; margin-bottom: 8px; border-radius: 6px; border: 1px solid #E0E0E0;";
        let topHeader = `<div style="display: flex; justify-content: space-between; align-items: center; width:100%;"><span style="color:#000; font-weight:bold; font-size:16px;">${l.data} - ${l.km} KM</span>`;
        if (!esteProprietarMod) topHeader += `<button onclick="stergeLucrare('${l.id}')" style="background:transparent; border:none; font-size:1.2rem; cursor:pointer;">🗑️</button>`;
        topHeader += `</div>`;
        let piese = l.piese ? `<div style="color:#555; font-style:italic; font-size:14px; margin-top:2px;">Piese: ${l.piese}</div>` : '';
        let cost = (l.cost && l.cost !== "0") ? `<div style="color:#388E3C; font-weight:bold; font-size:14px; margin-top:2px;">Cost: ${l.cost} RON</div>` : '';
        let rem = (l.urmatorKm || l.urmatoareaData) ? `<div style="color:#1A237E; font-size:13px; font-weight:500; margin-top:4px;">Urmatoarea: ${l.urmatorKm || ''} KM / ${l.urmatoareaData || ''}</div>` : '';
        let obs = l.observatii ? `<div style="color:#757575; font-size:12px; margin-top:2px;">Note: ${l.observatii}</div>` : '';
        card.innerHTML = `${topHeader} <div style="color:#333; font-size:15px; margin-top:4px; font-weight:500;">${l.descriere}</div> ${piese} ${cost} ${rem} ${obs}`;
        container.appendChild(card);
    });
};

// Autocomplete logic
function initializeazaAutocompleteDescriere() {
    const inputDesc = document.getElementById('inputDescriere');
    const containerSugestii = document.getElementById('sugestii-descriere-container');
    if (!inputDesc || !containerSugestii) return;

    document.addEventListener('click', function(e) {
        if (e.target !== inputDesc && e.target !== containerSugestii) containerSugestii.style.display = 'none';
    });

    inputDesc.addEventListener('input', function() {
        const valoare = this.value.toLowerCase().trim();
        containerSugestii.innerHTML = '';
        if (!valoare) { containerSugestii.style.display = 'none'; return; }
        const filtrate = SUGESTII_LUCRARI.filter(lucrare => lucrare.toLowerCase().includes(valoare)).slice(0, 6);
        if (filtrate.length === 0) { containerSugestii.style.display = 'none'; return; }

        filtrate.forEach(lucrare => {
            const item = document.createElement('div');
            item.style.cssText = "padding: 12px; cursor: pointer; border-bottom: 1px solid #EEE; color: #333; font-size: 14px; font-weight: 500; text-align: left;";
            const index = lucrare.toLowerCase().indexOf(valoare);
            item.innerHTML = lucrare.substring(0, index) + "<strong>" + lucrare.substring(index, index + valoare.length) + "</strong>" + lucrare.substring(index + valoare.length);
            item.addEventListener('click', function() { inputDesc.value = lucrare; containerSugestii.style.display = 'none'; });
            containerSugestii.appendChild(item);
        });
        containerSugestii.style.display = 'block';
    });
}

// Salvare lucrare in Firebase
window.salveazaLucrareNoua = function() {
    const km = document.getElementById('inputKM').value.trim();
    let desc = document.getElementById('inputDescriere').value.trim();
    const piese = document.getElementById('inputPiese').value.trim();
    const costP = parseFloat(document.getElementById('inputCostPiese').value) || 0;
    const costM = parseFloat(document.getElementById('inputCostManopera').value) || 0;
    const urmatorKm = document.getElementById('inputUrmatorKm').value.trim();
    const urmatoareData = document.getElementById('inputUrmatoareaData').value.trim();
    const obs = document.getElementById('inputObservatii').value.trim();

    if (!km || !desc) { alert("Kilometrii si Tipul interventiei sunt obligatorii!"); return; }
    if (desc.length > 0) desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    const costTotalStr = (costP + costM).toString();
    const dataAzi = new Date().toLocaleDateString('ro-RO');

    const nouaLucrare = { km, descriere: desc, piese, cost: costTotalStr, urmatorKm, urmatoareaData, observatii: obs, data: dataAzi };
    
    push(ref(db, `Masini/${vinCurent}/lucrari`), nouaLucrare).then(() => {
        alert("Lucrare salvata cu succes!");
        document.getElementById('inputKM').value = ""; document.getElementById('inputDescriere').value = ""; document.getElementById('inputPiese').value = "";
        document.getElementById('inputCostPiese').value = ""; document.getElementById('inputCostManopera').value = ""; document.getElementById('inputUrmatorKm').value = "";
        document.getElementById('inputUrmatoareaData').value = ""; document.getElementById('inputObservatii').value = "";
        
        window.toggleFormPopup(false); // NOU: Inchide pop-up-ul automat după salvare
        incarcaIstoric();
    }).catch((error) => {
        alert("Eroare la salvare: " + error.message);
    });
};

window.stergeLucrare = function(id) {
    if (confirm("Sigur vrei sa stergi aceasta inregistrare?")) remove(ref(db, `Masini/${vinCurent}/lucrari/${id}`)).then(() => incarcaIstoric());
};

function actualizeazaSemafor() {
    const semafor = document.getElementById('cardStatus');
    const txt = document.getElementById('tvStatusRevizie');
    if (listaLucrariCompleta.length > 0) {
        semafor.style.backgroundColor = "#4CAF50";
        txt.innerText = `Sisteme Verificate. Ultima revizie: ${listaLucrariCompleta[0].km} KM`;
    } else {
        semafor.style.backgroundColor = "#FF6D00"; txt.innerText = "Nicio lucrare inregistrata in istoric.";
    }
}

// ==========================================
// TOATE FUNCTIILE TALE VECHI PASTRATE INTACTE
// ==========================================

window.deschideMeniuActiuni = function() {
    document.getElementById('actionSheetMenu').style.display = 'block';
    document.getElementById('actionMenuOverlay').style.display = 'block';
    
    const optiuniProprietar = document.getElementById('optiuni-proprietar-web');
    if (optiuniProprietar) {
        optiuniProprietar.style.display = esteProprietarMod ? 'block' : 'none';
    }
};

window.lockMeniuActiuni = function() {
    document.getElementById('actionSheetMenu').style.display = 'none';
    document.getElementById('actionMenuOverlay').style.display = 'none';
};

window.afiseazaStatusDocument = function(tipDoc) {
    lockMeniuActiuni();
    get(ref(db, `Masini/${vinCurent}/documente/${tipDoc}`)).then((snapshot) => {
        let valoareCurenta = snapshot.exists() ? snapshot.val() : "Nespecificat";
        let nouaData = prompt(`Data curenta pentru ${tipDoc.toUpperCase()} este: ${valoareCurenta}\n\nIntrodu noua data (sau apasa Cancel):`, valoareCurenta);
        if (nouaData !== null && nouaData.trim() !== "") {
            set(ref(db, `Masini/${vinCurent}/documente/${tipDoc}`), nouaData.trim()).then(() => alert("Data actualizata cu succes!"));
        }
    });
};

window.afiseazaSpecificatiiWeb = function() {
    lockMeniuActiuni();
    get(ref(db, `Masini/${vinCurent}/specificatii`)).then((snapshot) => {
        let dateSpec = snapshot.exists() ? snapshot.val() : { ulei: "Nespecificat", anvelope: "Nespecificat" };
        let msg = `⚙️ Specificatii tehnice curente:\n\n🛢️ Spec ulei: ${dateSpec.ulei || 'Nespecificat'}\n🚗 Dimensiuni anvelope: ${dateSpec.anvelope || 'Nespecificat'}`;
        
        if(!esteProprietarMod) {
            let vreaModificare = confirm(`${msg}\n\nDoresti sa modifici aceste specificatii?`);
            if(vreaModificare) {
                let nouUlei = prompt("Introdu tipul de ulei recomandat (ex: 5W30 VW 507.00):", dateSpec.ulei || "");
                let noiAnvelope = prompt("Introdu dimensiunile anvelopelor (ex: 205/55 R16):", dateSpec.anvelope || "");
                if (nouUlei !== null && noiAnvelope !== null) {
                    set(ref(db, `Masini/${vinCurent}/specificatii`), { ulei: nouUlei, anvelope: noiAnvelope }).then(() => alert("Specificatii salvate!"));
                }
            }
        } else {
            alert(msg);
        }
    });
};

window.deschideCalculatorConsum = function() {
    lockMeniuActiuni();
    let kmParcursi = prompt("Introdu numarul de kilometri parcursi de la plin la plin:");
    let litriAlimentati = prompt("Introdu numarul de litri alimentati:");
    if(kmParcursi && litriAlimentati) {
        let consumMediu = (parseFloat(litriAlimentati) / parseFloat(kmParcursi)) * 100;
        alert(`🧮 Consumul mediu calculat este: ${consumMediu.toFixed(2)} L / 100 KM`);
    }
};

window.partajeazaVinWeb = function() {
    lockMeniuActiuni();
    if (navigator.clipboard) {
        navigator.clipboard.writeText(vinCurent).then(() => alert("VIN copiat in clipboard!"));
    } else {
        alert("VIN-ul masinii este: " + vinCurent);
    }
};

window.genereazaCodQRWeb = function() {
    const vinInput = document.getElementById('inputVIN_Client').value.trim().toUpperCase();
    const pin1 = document.getElementById('inputPIN_Securitate').value.trim();
    const pin2 = document.getElementById('inputPIN_Confirmare').value.trim();

    if(vinInput.length !== 17 || pin1.length !== 4 || pin1 !== pin2) {
        alert("Asigura-te ca VIN are 17 caractere si PIN-urile coincid (4 cifre)!");
        return;
    }

    set(ref(db, `Masini/${vinInput}/pin`), pin1).then(() => {
        document.getElementById('imgQRCode').innerHTML = "";
        new QRCode(document.getElementById('imgQRCode'), {
            text: `https://carid-eae71.web.app/?vin=${vinInput}`,
            width: 256,
            height: 256
        });
        document.getElementById('qrContainer').style.display = 'flex';
        alert("Masina inregistrata cu succes pe server!");
    });
};
