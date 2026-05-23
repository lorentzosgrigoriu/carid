import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, push, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Datele din google-services.json adaptate pentru web
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

// NAVIGARE ÎNTRE ECRANE
window.navigateTo = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if (pageId !== 'home-page') opresteScanner();
};

window.toggleDrawer = function(open) {
    document.getElementById('drawerMenu').classList.toggle('open', open);
    document.getElementById('drawerOverlay').style.display = open ? 'block' : 'none';
};

// LOGICĂ SELECȚIE ROL & PORNIRE CAMERA (MainActivity.kt)
window.setRol = function(rol) {
    esteProprietarMod = (rol === 'proprietar');
    document.getElementById('scanner-container').style.display = 'block';
    
    html5QrcodeScanner = new Html5Qrcode("reader");
    html5QrcodeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        window.proceseazaCodScanat,
        () => {} // Ignoră erorile mici de focus
    ).catch(err => alert("Eroare acces cameră: " + err));
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
    let vinCurat = textScanat.trim().toUpperCase();
    if (vinCurat.startsWith("VIN:")) {
        vinCurat = vinCurat.replace("VIN:", "").trim();
    }
    if (vinCurat.length === 17) {
        opresteScanner();
        
        // Dacă este proprietar, îl întrebăm ce dorește să facă înainte de afișare
        if (esteProprietarMod) {
            let vreaSalvare = confirm(`🚗 Vehicul detectat (${vinCurat})!\n\nDorești să SALVEZI această mașină în Garajul tău pentru acces rapid?\n\n[OK = Salvează în Garaj / Cancel = Doar Vizualizare Temporară]`);
            
            if (vreaSalvare) {
                salveazaInGarajLocal(vinCurat);
            }
        }
        
        deschideDetalii(vinCurat);
    } else {
        alert("Codul QR nu conține un VIN valid de 17 caractere!");
    }
};

// Funcție pentru salvarea locală a vehiculului în listă (Garajul meu)
function salveazaInGarajLocal(vin) {
    try {
        let garaj = JSON.parse(localStorage.getItem('garaj_carid')) || [];
        if (!garaj.includes(vin)) {
            garaj.push(vin);
            localStorage.setItem('garaj_carid', JSON.stringify(garaj));
            alert("Vehiculul a fost salvat cu succes în Garajul tău!");
        } else {
            alert("Vehiculul existat deja în Garajul tău.");
        }
    } catch (e) {
        console.error("Eroare salvare localStorage", e);
    }
}

// DESCHIDERE FIȘĂ VEHICUL & LOGICĂ PIN (PinActivity.kt + DetaliiMasinaActivity.kt)
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
            incarcaIstoric();
        } else {
            alert("PIN Incorect! Acces refuzat.");
            document.getElementById('etPin').value = "";
        }
    });
};

// ÎNCĂRCARE ȘI FILTRARE ISTORIC (LucrariAdapter.kt + Lucrare.kt)
function incarcaIstoric() {
    get(ref(db, `Masini/${vinCurent}/lucrari`)).then((snapshot) => {
        listaLucrariCompleta = [];
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                let l = child.val();
                l.id = child.key;
                listaLucrariCompleta.push(l);
            });
            // Sortare descrescătoare după KM (la fel ca în Android)
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

    const filtrate = listaLucrariCompleta.filter(l => 
        (l.descriere && l.descriere.toLowerCase().includes(q)) || (l.km && l.km.toString().includes(q))
    );

    filtrate.forEach(l => {
        const card = document.createElement('div');
        card.style.cssText = "background: #FFF; padding: 12px; margin-bottom: 8px; border-radius: 6px; border: 1px solid #E0E0E0;";
        
        let topHeader = `<div style="display: flex; justify-content: space-between; align-items: center; width:100%;">
            <span style="color:#000; font-weight:bold; font-size:16px;">${l.data} - ${l.km} KM</span>`;
        if (esteProprietarMod) { // Doar proprietarul are coșul de ștergere (Conform LucrariAdapter)
            topHeader += `<button onclick="stergeLucrare('${l.id}')" style="background:transparent; border:none; font-size:1.2rem; cursor:pointer;">🗑️</button>`;
        }
        topHeader += `</div>`;

        let piese = l.piese ? `<div style="color:#555; font-style:italic; font-size:14px; margin-top:2px;">Piese: ${l.piese}</div>` : '';
        let cost = (l.cost && l.cost !== "0") ? `<div style="color:#388E3C; font-weight:bold; font-size:14px; margin-top:2px;">Cost: ${l.cost} RON</div>` : '';
        let rem = (l.urmatorKm || l.urmatoareaData) ? `<div style="color:#1A237E; font-size:13px; font-weight:500; margin-top:4px;">Următoarea: ${l.urmatorKm || ''} KM / ${l.urmatoareaData || ''}</div>` : '';
        let obs = l.observatii ? `<div style="color:#757575; font-size:12px; margin-top:2px;">Note: ${l.observatii}</div>` : '';

        card.innerHTML = `${topHeader} <div style="color:#333; font-size:15px; margin-top:4px; font-weight:500;">${l.descriere}</div> ${piese} ${cost} ${rem} ${obs}`;
        container.appendChild(card);
    });
};

// ÎNREGISTRARE LUCRARE NOUĂ (Mecanic)
window.salveazaLucrareNoua = function() {
    const km = document.getElementById('inputKM').value.trim();
    let desc = document.getElementById('inputDescriere').value;
    const piese = document.getElementById('inputPiese').value.trim();
    const costP = parseFloat(document.getElementById('inputCostPiese').value) || 0;
    const costM = parseFloat(document.getElementById('inputCostManopera').value) || 0;
    const urmatorKm = document.getElementById('inputUrmatorKm').value.trim();
    const urmatoareData = document.getElementById('inputUrmatoareaData').value.trim();
    const obs = document.getElementById('inputObservatii').value.trim();

    if (!km || !desc) { alert("Kilometrii și Tipul intervenției sunt obligatorii!"); return; }
    
    // Capitalizează Descrierea (Logica din Lucrare.kt)
    if (desc.length > 0) desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    
    const costTotalStr = (costP + costM).toString();
    const dataAzi = new Date().toLocaleDateString('ro-RO');

    const nouaLucrare = { km, descriere: desc, piese, cost: costTotalStr, urmatorKm, urmatoareaData, observatii: obs, data: dataAzi };
    
    push(ref(db, `Masini/${vinCurent}/lucrari`), nouaLucrare).then(() => {
        alert("Lucrare salvată cu succes!");
        document.querySelectorAll('#layoutMecanic input, #layoutMecanic select').forEach(i => i.value = "");
        incarcaIstoric();
    });
};

window.stergeLucrare = function(id) {
    if (confirm("Sigur vrei să ștergi această înregistrare din istoric?")) {
        remove(ref(db, `Masini/${vinCurent}/lucrari/${id}`)).then(() => incarcaIstoric());
    }
};

function actualizeazaSemafor() {
    const semafor = document.getElementById('cardStatus');
    const txt = document.getElementById('tvStatusRevizie');
    if (listaLucrariCompleta.length > 0) {
        semafor.style.backgroundColor = "#4CAF50";
        txt.innerText = `Sisteme Verificate. Ultima revizie: ${listaLucrariCompleta[0].km} KM`;
    } else {
        semafor.style.backgroundColor = "#FF6D00";
        txt.innerText = "Nicio lucrare înregistrată în istoric.";
    }
}

// MANAGEMENT MENIU CONTEXTUAL & DOCS (drawer_menu.xml)
window.deschideMeniuActiuni = function() {
    document.getElementById('actionSheetMenu').style.display = 'block';
    document.getElementById('actionMenuOverlay').style.display = 'block';
    document.getElementById('optiuni-proprietar-web').style.display = esteProprietarMod ? 'block' : 'none';
    document.getElementById('optiuni-mecanic-web').style.display = esteProprietarMod ? 'none' : 'block';
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
        const dataC = snap.exists() ? snap.val() : "Nesetată";
        let nouaD = prompt(`📋 ${tip.toUpperCase()}\nExpiră la: ${dataC}\nIntroduceți noua dată (DD.MM.YYYY):`, dataC);
        if (nouaD) set(docRef, nouaD.trim()).then(() => alert("Dată salvată!"));
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
    let litri = parseFloat(prompt("Litri alimentați:")), km = parseFloat(prompt("Kilometri parcurși:"));
    if (litri && km) alert(`🧮 Consum mediu: ${((litri / km) * 100).toFixed(2)} L/100km`);
};

window.partajeazaVinWeb = function() {
    inchideMeniuActiuni();
    if (navigator.share) navigator.share({ title: 'CarID', text: `VIN: ${vinCurent}` });
    else prompt("Copiați VIN-ul:", vinCurent);
};

// GENERATOR COD QR CU EMBED BRANDING (CreareQRActivity.kt)
window.genereazaCodQRWeb = function() {
    const vin = document.getElementById('inputVIN_Client').value.trim().toUpperCase();
    const pin = document.getElementById('inputPIN_Securitate').value.trim();
    const conf = document.getElementById('inputPIN_Confirmare').value.trim();

    if (vin.length !== 17 || pin.length !== 4 || pin !== conf) { alert("Verifică lungimea VIN (17) și potrivirea PIN-ului (4 cifre)!"); return; }

    vinCurentQR = vin;
    set(ref(db, `Masini/${vin}/pin`), pin).then(() => {
        const tempDiv = document.createElement("div");
        new QRCode(tempDiv, { text: `VIN:${vin}`, width: 440, height: 440, correctLevel: QRCode.CorrectLevel.H });

        setTimeout(() => {
            const qrCanvas = tempDiv.querySelector('canvas');
            if (!qrCanvas) return;

            const canvasFinal = document.createElement('canvas');
            // Mărim dimensiunile canvas-ului final la 540x630px ca să facem loc marginii albe din jurul codului
            canvasFinal.width = 540; canvasFinal.height = 630;
            const ctx = canvasFinal.getContext('2d');

            // 1. Spatele complet ALB (Quiet Zone obligatoriu pentru telefoane)
            ctx.fillStyle = "#FFFFFF"; 
            ctx.fillRect(0, 0, 540, 630);
            
            // 2. Desenăm codul QR centrat, lăsând o margine de siguranță de 50px de jur împrejur
            ctx.drawImage(qrCanvas, 50, 50);

            // 3. Textul de branding din subsol
            ctx.fillStyle = "#000000"; 
            ctx.font = "bold 38px Arial"; 
            ctx.textAlign = "center";
            ctx.fillText("CarID - Istoric Digital", 270, 575);

            const img = document.getElementById('imgQRCode');
            img.innerHTML = "";
            const webImg = document.createElement("img");
            webImg.src = canvasFinal.toDataURL("image/png");
            webImg.style.width = "100%";
            img.appendChild(webImg);

            canvasFinalPentruSalvare = canvasFinal;
            document.getElementById('qrContainer').style.display = 'flex';
            alert("Cod QR Securizat Generat cu succes!");
        }, 150);
    });
};

window.salveazaInGalerieWeb = function() {
    if (!canvasFinalPentruSalvare) return;
    const link = document.createElement('a');
    link.download = `CarID_${Date.now()}.png`;
    link.href = canvasFinalPentruSalvare.toDataURL("image/png");
    link.click();
};

window.partajeazaQRWeb = function() {
    if (!canvasFinalPentruSalvare) return;
    const msg = `🚗 Codul tău digital CarID pentru VIN: ${vinCurentQR}`;
    canvasFinalPentruSalvare.toBlob((blob) => {
        const f = new File([blob], "share_qr.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: "CarID QR", text: msg });
        else alert("Salvați imaginea și trimiteți-o manual!");
    });
};
