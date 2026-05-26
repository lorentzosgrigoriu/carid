import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, push, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
let canvasFinalPentruSalvare = null;
let vinCurentQR = "";

// Helper inteligent: elimina diacriticele si face textul cu litere mici pentru comparare rapida
const normalizeazaText = (text) => {
    if (!text) return "";
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const SUGESTII_LUCRARI = [
    "Revizie completa (Ulei + 4 filtre)", "Schimb ulei motor", "Schimb filtru ulei", "Schimb filtru aer", "Schimb filtru habitaclu (polen)", "Schimb filtru combustibil", "Schimb lichid de frana", "Schimb antigel / Curatare instalatie", "Schimb ulei cutie de viteze manuala", "Schimb ulei cutie automata (Metoda prin cadere)", "Schimb ulei cutie automata (Aparat / Dinamic)", "Schimb ulei diferential", "Schimb ulei cutie de transfer (4x4)", "Resetare interval service / Ulei",
    "Schimb placute frana fata", "Schimb placute frana spate", "Schimb discuri si placute frana fata", "Schimb discuri si placute frana spate", "Schimb lichid frana + Aerisire sistem", "Schimb etrier frana", "Reconditionare etrier (Garnituri + Piston)", "Schimb cablu frana de mana", "Reglaj frana de mana", "Schimb senzori uzura placute", "Schimb furtunuri frana (flexibile)", "Schimb pompa centrala di frana",
    "Schimb amortizoare fata", "Schimb amortizoare spate", "Schimb arcuri suspensie fata", "Schimb arcuri suspensie spate", "Schimb flanse amortizor", "Schimb bielete antiruliu fata", "Schimb bielete antiruliu spate", "Schimb bucse bara stabilizatoare", "Schimb brat suspensie / Pivot fata", "Schimb brat suspensie / Bucse spate", "Schimb pivoti directie", "Schimb capat de bara", "Schimb bieleta directie", "Schimb caseta de directie", "Schimb pompa servo-directie", "Schimb rulment roata fata", "Schimb rulment roata spate", "Geometrie roti (Unghi fuga)",
    "Schimb kit distributie (Curea + Role + Pompa apa)", "Schimb kit distributie pe lant", "Schimb curea accesorii (Transmisie)", "Schimb intinzator / Role curea accesorii", "Schimb pompa de apa", "Schimb termostat", "Schimb garnitura capac culbutori", "Schimb garnitura chiulasa", "Rectificare chiulasa / Schimb simeringuri supape", "Schimb garnitura baie ulei", "Schimb suport motor (Tampon fata/spate)", "Schimb suport cutie di viteze", "Curatare/Inlocuire clapeta acceleratie", "Masurare compresie cilindri",
    "Schimb injectoare (Set)", "Curatare / Calibrare injectoare", "Schimb saibe foc injectoare", "Schimb pompa inalta presiune (HPFP)", "Schimb pompa combustibil din rezervor", "Schimb rampa injectie / Senzor presiune", "Schimb bujii incandescente (Diesel)", "Schimb bujii scanteie (Benzina)", "Schimb fise / Bobine inductie",
    "Curatare chimica filtru de particule (DPF)", "Schimb senzor presiune diferentiala DPF", "Completare lichid AdBlue / Cerina", "Schimb senzor NOx", "Anulare / Curatare valva EGR", "Schimb valva EGR", "Schimb sonda Lambda", "Schimb racord flexibil evacuare", "Schimb toba esapament (Finala/Medie)",
    "Schimb kit ambreiaj complet (Placa + Disc + Rulment)", "Schimb kit ambreiaj + Volanta cu masa dubla", "Schimb cilindru receptor / Pompa ambreiaj", "Schimb planetara completa", "Schimb kit burduf planetara (Spre roata/cutie)", "Schimb racord flexibil cardan (Flansa)", "Schimb rulment intermediar cardan",
    "Igienizare sistem climatizare (Ozon / Spray)", "Reincarcare freon auto (R134a)", "Reincarcare freon auto (R1234yf)", "Schimb compresor aer conditionat", "Schimb radiator clima (Condensator)", "Schimb radiator racire motor", "Schimb electroventilator",
    "Diagnoza computerizata / Citire erori", "Stergere erori / Interpretare parametri in timp real", "Schimb baterie auto + Inregistrare (Codare)", "Schimb alternator", "Schimb electromotor (Demaror)", "Schimb senzori motor (Ax cu came / Arbore / ABS)", "Reparatie cablaj electric", "Reglaj faruri", "Schimb becuri / Kit Xenon / LED",
    "Schimb turbosuflanta (Turbina)", "Reconditionare turbosuflanta", "Schimb actuator turbina (Electric/Vacuumatic)", "Curatare galerie admisie / Clapete swirl", "Schimb radiator intercooler", "Schimb furtun intercooler (Presiune)"
];

// NAVIGARE INTELIGENTĂ CU SUPORT PENTRU ISTORICUL DISPOZITIVULUI (BACK BUTTON)
window.navigateTo = function(pageId, pushState = true) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
    
    if (pageId !== 'home-page') opresteScanner();
    if (pageId === 'garaj-page') incarcaGarajLocal();

    // Dacă navigarea se face prin click pe butoanele din pagină, salvăm starea în istoric
    if (pushState) {
        window.history.pushState({ pageId: pageId }, "", pageId === 'home-page' ? window.location.pathname : `?page=${pageId}`);
    }
};

window.toggleDrawer = function(open) {
    document.getElementById('drawerMenu').classList.toggle('open', open);
    document.getElementById('drawerOverlay').style.display = open ? 'block' : 'none';
};

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
        const vinIndex = vinCurat.indexOf(":") + 1;
        vinCurat = vinCurat.substring(vinIndex).trim();
    }
    vinCurat = vinCurat.toUpperCase();

    if (vinCurat.length === 17) {
        opresteScanner();
        if (esteProprietarMod) {
            let vreaSalvare = confirm(`🚗 Vehicul detectat (${vinCurat})!\n\nDoresti sa SALVEZI aceasta masina in Garajul tau?`);
            if (vreaSalvare) salveazaInGarajLocal(vinCurat);
        }
        deschideDetalii(vinCurat);
    } else {
        alert("Codul QR nu contine un VIN valid!");
    }
};

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
        containerGaraj.innerHTML = `<p style="color:#757575; font-style:italic; text-align:center; margin-top:15px;">Nicio masina salvata in garaj.</p>`;
        return;
    }

    garaj.forEach(vin => {
        const cardMasina = document.createElement('div');
        cardMasina.style.cssText = "background:#1565C0; color:white; padding:15px; margin:10px 0; border-radius:8px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 4px rgba(0,0,0,0.2); font-weight:bold; cursor:pointer;";
        cardMasina.onclick = function(e) {
            if(e.target.tagName === 'BUTTON') return;
            esteProprietarMod = true;
            deschideDetalii(vin);
        };
        cardMasina.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span>🚗</span>
                <span style="font-size:15px; letter-spacing:1px; font-family:monospace;">${vin}</span>
            </div>
            <button onclick="stergeDinGaraj('${vin}')" style="background:transparent; border:none; color:white; font-size:1.2rem; cursor:pointer; padding:5px;">🗑️</button>
        `;
        containerGaraj.appendChild(cardMasina);
    });
}

window.stergeDinGaraj = function(vin) {
    if (confirm(`Stergi masina ${vin}?`)) {
        let garaj = JSON.parse(localStorage.getItem('garaj_carid')) || [];
        garaj = garaj.filter(item => item !== win);
        localStorage.setItem('garaj_carid', JSON.stringify(garaj));
        incarcaGarajLocal();
    }
};

function deschideDetalii(vin) {
    vinCurent = vin;
    document.getElementById('vin-title').innerText = "VIN: " + vin;
    document.getElementById('etPin').value = "";
    
    const layoutMecanic = document.getElementById('layoutMecanic');
    const ecranPin = document.getElementById('ecran-pin-blocat');
    const continutMasina = document.getElementById('continut-detalii-masina');

    if (esteProprietarMod) {
        layoutMecanic.style.display = 'none';
        ecranPin.style.display = 'flex';
        continutMasina.style.display = 'none';
    } else {
        layoutMecanic.style.display = 'block';
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
            document.getElementById('layoutMecanic').style.display = 'flex';
            incarcaIstoric();
        } else {
            alert("PIN Incorect!");
            document.getElementById('etPin').value = "";
        }
    });
};

function incarcaIstoric() {
    get(ref(db, `Masini/${vinCurent}/lucrari`)).then((snapshot) => {
        listaLucrariCompleta = [];
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                let l = child.val();
                l.id = child.key;
                listaLucrariCompleta.push(l);
            });
            // Curățare sigură și sortare descrescătoare matematică perfectă (fără erori de string-uri sau spații)
            listaLucrariCompleta.sort((a, b) => {
                const kmA = parseInt(String(a.km).replace(/\D/g, '')) || 0;
                const kmB = parseInt(String(b.km).replace(/\D/g, '')) || 0;
                return kmB - kmA;
            });
        }
        filtreazaLucrari("");
        actualizeazaSemafor();
    });
}

window.filtreazaLucrari = function(query) {
    const q = normalizeazaText(query);
    const container = document.getElementById('istoric-lucrari-container');
    container.innerHTML = "";
    
    const filtrate = listaLucrariCompleta.filter(l => 
        (l.descriere && normalizeazaText(l.descriere).includes(q)) || 
        (l.km && l.km.toString().includes(q))
    );

    filtrate.forEach(l => {
        const card = document.createElement('div');
        card.style.cssText = "background:#FFF; padding:12px; margin-bottom:8px; border-radius:6px; border:1px solid #E0E0E0; box-shadow:0 1px 3px rgba(0,0,0,0.05);";
        let topHeader = `<div style="display:flex; justify-content:space-between; align-items:center; width:100%;"><span style="color:#1A237E; font-weight:bold; font-size:15px;">📅 ${l.data} — 🚗 ${l.km} KM</span>`;
        if (!esteProprietarMod) topHeader += `<button onclick="stergeLucrare('${l.id}')" style="background:transparent; border:none; font-size:1.2rem; cursor:pointer; padding:2px;">🗑️</button>`;
        topHeader += `</div>`;
        let piese = l.piese ? `<div style="color:#555; font-size:13px; margin-top:4px; line-height:1.4;">⚙️ <strong>Piese:</strong> ${l.piese}</div>` : '';
        let cost = (l.cost && l.cost !== "0") ? `<div style="color:#2E7D32; font-weight:bold; font-size:13px; margin-top:3px;">💰 Cost Total: ${l.cost} RON</div>` : '';
        let rem = (l.urmatorKm || l.urmatoareaData) ? `<div style="background:#E8EAF6; color:#1A237E; font-size:12px; font-weight:600; margin-top:6px; padding:4px 8px; border-radius:4px; display:inline-block;">🔄 Următoarea scadență: ${l.urmatorKm || '—'} KM / ${l.urmatoareaData || '—'}</div>` : '';
        let obs = l.observatii ? `<div style="color:#757575; font-size:12px; margin-top:5px; border-top:1px dashed #EEE; padding-top:4px;">📝 <strong>Note:</strong> ${l.observatii}</div>` : '';
        card.innerHTML = `${topHeader} <div style="color:#222; font-size:15px; margin-top:6px; font-weight:600;">${l.descriere}</div> ${piese} ${cost} ${obs} ${rem}`;
        container.appendChild(card);
    });
};

// GESTIONARE PANOU FLOTANT MOD MECANIC (BOTTOM SHEET)
window.deschideFormularLucrare = function(open) {
    const sheet = document.getElementById('bottomSheetFormular');
    const overlay = document.getElementById('overlayFormular');
    if (!sheet || !overlay) return;

    if (open) {
        overlay.style.display = 'block';
        setTimeout(() => { sheet.style.bottom = '0'; }, 10);
        window.history.pushState({ subPage: 'formular_lucrare' }, "");
    } else {
        sheet.style.bottom = '-100%';
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
        if (window.history.state && window.history.state.subPage === 'formular_lucrare') {
            window.history.back();
        }
    }
};

window.initializeazaAutocompleteDescriere = function() {
    const inputDesc = document.getElementById('inputDescriere');
    const containerSugestii = document.getElementById('sugestii-descriere-container');
    if (!inputDesc || !containerSugestii) return;

    document.addEventListener('click', function(e) {
        if (e.target !== inputDesc && e.target !== containerSugestii) containerSugestii.style.display = 'none';
    });

    inputDesc.addEventListener('input', function() {
        const valoare = normalizeazaText(this.value.trim());
        containerSugestii.innerHTML = '';
        if (!valoare) { containerSugestii.style.display = 'none'; return; }
        
        const filtrate = SUGESTII_LUCRARI.filter(lucrare => 
            normalizeazaText(lucrare).includes(valoare)
        ).slice(0, 6);
        
        if (filtrate.length === 0) { containerSugestii.style.display = 'none'; return; }

        filtrate.forEach(lucrare => {
            const item = document.createElement('div');
            item.style.cssText = "padding:12px; cursor:pointer; border-bottom:1px solid #EEE; color:#333; font-size:14px; font-weight:500; text-align:left;";
            
            const normLucrare = normalizeazaText(lucrare);
            const index = normLucrare.indexOf(valoare);
            
            if (index >= 0) {
                item.innerHTML = lucrare.substring(0, index) + "<strong>" + lucrare.substring(index, index + valoare.length) + "</strong>" + lucrare.substring(index + valoare.length);
            } else {
                item.innerText = lucrare;
            }

            item.addEventListener('click', function() { 
                inputDesc.value = lucrare; 
                containerSugestii.style.display = 'none'; 
            });
            containerSugestii.appendChild(item);
        });
        containerSugestii.style.display = 'block';
    });
};

window.salveazaLucrareNouaModificata = function() {
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
        
        deschideFormularLucrare(false); // Închide automat panoul glisant de jos
        incarcaIstoric();
    }).catch((error) => {
        alert("Eroare la salvare: " + error.message);
    });
};

window.stergeLucrare = function(id) {
    if (confirm("Sigur stergi inregistrarea?")) remove(ref(db, `Masini/${vinCurent}/lucrari/${id}`)).then(() => incarcaIstoric());
};

function actualizeazaSemafor() {
    const semafor = document.getElementById('cardStatus');
    const txt = document.getElementById('tvStatusRevizie');
    if (listaLucrariCompleta.length > 0) {
        semafor.style.backgroundColor = "#2E7D32";
        txt.innerText = `🟢 Sisteme Verificate. Ultima intervenție: ${listaLucrariCompleta[0].km} KM`;
    } else {
        semafor.style.backgroundColor = "#EF6C00"; txt.innerText = "🟠 Nicio lucrare înregistrată în istoric.";
    }
}

window.deschideMeniuActiuni = function() {
    document.getElementById('actionSheetMenu').style.display = 'block';
    document.getElementById('actionMenuOverlay').style.display = 'block';
    document.getElementById('optiuni-proprietar-web').style.display = esteProprietarMod ? 'flex' : 'none';
};
window.lockMeniuActiuni = function() {
    document.getElementById('actionSheetMenu').style.display = 'none';
    document.getElementById('actionMenuOverlay').style.display = 'none';
};
window.inchideMeniuActiuni = window.lockMeniuActiuni;

window.afiseazaStatusDocument = function(tip) {
    inchideMeniuActiuni();
    const docRef = ref(db, `Masini/${vinCurent}/documente/${tip}`);
    get(docRef).then((snap) => {
        const dataC = snap.exists() ? snap.val() : "Nesetata";
        let nouaD = prompt(`📋 ${tip.toUpperCase()}\nExpira la: ${dataC}\nNoua data (DD.MM.YYYY):`, dataC);
        if (nouaD) set(docRef, nouaD.trim()).then(() => alert("Data salvata!"));
    });
};

window.afiseazaSpecificatiiWeb = function() {
    inchideMeniuActiuni();
    const specsRef = ref(db, `Masini/${vinCurent}/specs`);
    get(specsRef).then((snap) => {
        let u = snap.child("ulei").val() || "", a = snap.child("anvelope").val() || "";
        let nouU = prompt("Tip Ulei recomandat:", u), nouA = prompt("Dimensiuni Anvelope:", a);
        if (nouU !== null || nouA !== null) set(specsRef, { ulei: nouU || u, anvelope: nouA || a }).then(() => alert("Salvat!"));
    });
};

window.deschideCalculatorConsum = function() {
    inchideMeniuActiuni();
    let litri = parseFloat(prompt("Litri alimentati:")), km = parseFloat(prompt("Kilometri parcursi:"));
    if (litri && km) alert(`🧮 Consum mediu: ${((litri / km) * 100).toFixed(2)} L/100km`);
};

window.partajeazaVinWeb = function() {
    inchideMeniuActiuni();
    if (navigator.share) navigator.share({ title: 'CarID', text: `VIN: ${vinCurent}` });
    else prompt("Copiati VIN-ul:", vinCurent);
};

window.genereazaCodQRWeb = function() {
    const vin = document.getElementById('inputVIN_Client').value.trim().toUpperCase();
    const pin = document.getElementById('inputPIN_Securitate').value.trim();
    const conf = document.getElementById('inputPIN_Confirmare').value.trim();

    if (vin.length !== 17 || pin.length !== 4 || pin !== conf) { alert("Verifica VIN (17 caractere) si PIN (4 cifre)!"); return; }

    vinCurentQR = vin;
    set(ref(db, `Masini/${vin}/pin`), pin).then(() => {
        const adresaBazaSite = window.location.href.split('?')[0];
        const linkCompletInterfata = `${adresaBazaSite}?vin=${vin}`;

        const tempDiv = document.createElement("div");
        new QRCode(tempDiv, { text: linkCompletInterfata, width: 440, height: 440, correctLevel: QRCode.CorrectLevel.H });

        setTimeout(() => {
            const qrCanvas = tempDiv.querySelector('canvas');
            if (!qrCanvas) return;

            const canvasFinal = document.createElement('canvas');
            canvasFinal.width = 540; canvasFinal.height = 630;
            const ctx = canvasFinal.getContext('2d');

            ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, 540, 630);
            ctx.drawImage(qrCanvas, 50, 50);

            ctx.fillStyle = "#000000"; ctx.font = "bold 38px Arial"; ctx.textAlign = "center";
            ctx.fillText("CarID - Istoric Digital", 270, 575);

            const img = document.getElementById('imgQRCode'); img.innerHTML = "";
            const webImg = document.createElement("img");
            webImg.src = canvasFinal.toDataURL("image/png"); webImg.style.width = "100%";
            img.appendChild(webImg);

            canvasFinalPentruSalvare = canvasFinal;
            document.getElementById('qrContainer').style.display = 'flex';
            alert("Cod QR Generat!");
        }, 150);
    });
};

window.salveazaInGalerieWeb = function() {
    if (!canvasFinalPentruSalvare) return;
    const link = document.createElement('a');
    link.download = `CarID_${Date.now()}.png`; link.href = canvasFinalPentruSalvare.toDataURL("image/png"); link.click();
};

window.partajeazaQRWeb = function() {
    if (!canvasFinalPentruSalvare) return;
    const msg = `🚗 Codul tau digital CarID pentru VIN: ${vinCurentQR}`;
    canvasFinalPentruSalvare.toBlob((blob) => {
        const f = new File([blob], "share_qr.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: "CarID QR", text: msg });
        else alert("Salvati imaginea si trimiteti-o manual!");
    });
};

function verificaDacaVineDinScanareDirecta() {
    const urlParams = new URLSearchParams(window.location.search);
    const vinDetectatDinLink = urlParams.get('vin');

    if (vinDetectatDinLink && vinDetectatDinLink.length === 17) {
        const vinCurat = vinDetectatDinLink.toUpperCase();
        salveazaInGarajLocal(vinCurat);
        esteProprietarMod = true;
        deschideDetalii(vinCurat);
        window.history.replaceState({ pageId: 'details-page' }, document.title, `?page=details-page`);
    }
}

// ========================================================
// ASCULTĂTOR LOGIC PENTRU BUTONUL FIZIC / SYSTEM BACK AL TELEFONULUI
// ========================================================
window.addEventListener('popstate', function(event) {
    // 1. Dacă e deschis formularul de adăugare mecanic (Bottom Sheet), îl închidem primul
    const sheet = document.getElementById('bottomSheetFormular');
    if (sheet && sheet.style.bottom === '0px') {
        const overlay = document.getElementById('overlayFormular');
        sheet.style.bottom = '-100%';
        if (overlay) overlay.style.display = 'none';
        return;
    }

    // 2. Dacă e deschis meniul lateral (Drawer), îl închidem
    const drawer = document.getElementById('drawerMenu');
    if (drawer && drawer.classList.contains('open')) {
        window.toggleDrawer(false);
        return;
    }

    // 3. Dacă e deschis meniul de acțiuni (Action Sheet), îl închidem
    const actionMenu = document.getElementById('actionSheetMenu');
    if (actionMenu && actionMenu.style.display === 'block') {
        window.lockMeniuActiuni();
        return;
    }

    // 4. Navigăm la pagina din istoric, sau implicit la Home-Page
    if (event.state && event.state.pageId) {
        window.navigateTo(event.state.pageId, false);
    } else {
        window.navigateTo('home-page', false);
    }
});

// INITIALIZARE DE BAZĂ LA PORNIRE
if (!window.history.state) {
    window.history.replaceState({ pageId: 'home-page' }, "", window.location.pathname);
}

verificaDacaVineDinScanareDirecta();
window.initializeazaAutocompleteDescriere();

// ÎNREGISTRARE SERVICE WORKER (PWA - OFFLINE SUPPORT)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('CarID PWA: Service Worker înregistrat cu succes!', reg.scope))
            .catch(err => console.error('CarID PWA: Eroare SW:', err));
    });
}
