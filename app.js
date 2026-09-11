// ==========================================
// 1. INIȚIALIZARE SUPABASE
// ==========================================
const SUPABASE_URL = "https://ojavleqyxxxrggpuxeln.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qYXZsZXF5eHh4cmdncHV4ZWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMTYxNDQsImV4cCI6MjEwNDY5MjE0NH0.y8koscm9HIn72x1zyUVwTBGuwnkFjCF3gwo1b46IdN8";

// Se folosește clientul încărcat din CDN în index.html
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let html5QrcodeScanner = null;
let esteProprietarMod = false;
let vinCurent = "";
let listaLucrariCompleta = [];
let canvasFinalPentruSalvare = null;
let vinCurentQR = "";

// Helper pentru normalizarea textului (fără diacritice, litere mici)
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

// ==========================================
// 2. NAVIGARE ȘI UTILITARE UI
// ==========================================
window.navigateTo = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if (pageId !== 'home-page') opresteScanner();
    if (pageId === 'garaj-page') incarcaGarajLocal();
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
            let vreaSalvare = confirm(`🚗 Vehicul detectat (${vinCurat})!\n\nDorești să SALVEZI această mașină în Garajul tău?`);
            if (vreaSalvare) salveazaInGarajLocal(vinCurat);
        }
        deschideDetalii(vinCurat);
    } else {
        alert("Codul QR nu conține un VIN valid!");
    }
};

// ==========================================
// 3. GARAJUL LOCAL
// ==========================================
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
        containerGaraj.innerHTML = `<p style="color:#757575; font-style:italic; text-align:center; margin-top:15px;">Nicio mașină salvată în garaj.</p>`;
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
    if (confirm(`Ștergi mașina ${vin}?`)) {
        let garaj = JSON.parse(localStorage.getItem('garaj_carid')) || [];
        garaj = garaj.filter(item => item !== vin);
        localStorage.setItem('garaj_carid', JSON.stringify(garaj));
        incarcaGarajLocal();
    }
};

// ==========================================
// 4. LOGICĂ DETALII & INTERACȚIUNE CU SUPABASE
// ==========================================
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

window.verificaPinWeb = async function() {
    const pinIntrodus = document.getElementById('etPin').value.trim();
    if (!pinIntrodus) { alert("Introdu PIN-ul!"); return; }

    const { data, error } = await supabaseClient
        .from('masini')
        .select('pin')
        .eq('vin', vinCurent)
        .single();

    if (error || !data) {
        alert("Mașina nu a fost găsită în baza de date!");
        return;
    }

    if (data.pin === pinIntrodus) {
        document.getElementById('ecran-pin-blocat').style.display = 'none';
        document.getElementById('continut-detalii-masina').style.display = 'block';
        incarcaIstoric();
    } else {
        alert("PIN Incorect!");
        document.getElementById('etPin').value = "";
    }
};

async function incarcaIstoric() {
    const { data, error } = await supabaseClient
        .from('lucrari')
        .select('*')
        .eq('vin', vinCurent)
        .order('km', { ascending: false });

    listaLucrariCompleta = [];
    if (!error && data) {
        listaLucrariCompleta = data;
    }
    filtreazaLucrari("");
    actualizeazaSemafor();
}

window.filtreazaLucrari = function(query) {
    const q = normalizeazaText(query);
    const container = document.getElementById('istoric-lucrari-container');
    if (!container) return;
    container.innerHTML = "";
    
    const filtrate = listaLucrariCompleta.filter(l => 
        (l.descriere && normalizeazaText(l.descriere).includes(q)) || 
        (l.km && l.km.toString().includes(q))
    );

    filtrate.forEach(l => {
        const card = document.createElement('div');
        card.style.cssText = "background:#FFF; padding:12px; margin-bottom:8px; border-radius:6px; border:1px solid #E0E0E0;";
        let topHeader = `<div style="display:flex; justify-content:space-between; align-items:center; width:100%;"><span style="color:#000; font-weight:bold; font-size:16px;">${l.data} - ${l.km} KM</span>`;
        if (!esteProprietarMod) topHeader += `<button onclick="stergeLucrare('${l.id}')" style="background:transparent; border:none; font-size:1.2rem; cursor:pointer;">🗑️</button>`;
        topHeader += `</div>`;
        let piese = l.piese ? `<div style="color:#555; font-style:italic; font-size:14px; margin-top:2px;">Piese: ${l.piese}</div>` : '';
        let cost = (l.cost && l.cost !== "0") ? `<div style="color:#388E3C; font-weight:bold; font-size:14px; margin-top:2px;">Cost: ${l.cost} RON</div>` : '';
        let rem = (l.urmator_km || l.urmatoarea_data) ? `<div style="color:#1A237E; font-size:13px; font-weight:500; margin-top:4px;">Urmatoarea: ${l.urmator_km || ''} KM / ${l.urmatoarea_data || ''}</div>` : '';
        let obs = l.observatii ? `<div style="color:#757575; font-size:12px; margin-top:2px;">Note: ${l.observatii}</div>` : '';
        card.innerHTML = `${topHeader} <div style="color:#333; font-size:15px; margin-top:4px; font-weight:500;">${l.descriere}</div> ${piese} ${cost} ${rem} ${obs}`;
        container.appendChild(card);
    });
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

window.salveazaLucrareNoua = async function() {
    const km = document.getElementById('inputKM').value.trim();
    let desc = document.getElementById('inputDescriere').value.trim();
    const piese = document.getElementById('inputPiese').value.trim();
    const costP = parseFloat(document.getElementById('inputCostPiese').value) || 0;
    const costM = parseFloat(document.getElementById('inputCostManopera').value) || 0;
    const urmatorKm = document.getElementById('inputUrmatorKm').value.trim();
    const urmatoareData = document.getElementById('inputUrmatoareaData').value.trim();
    const obs = document.getElementById('inputObservatii').value.trim();

    if (!km || !desc) { alert("Kilometrii și Tipul intervenției sunt obligatorii!"); return; }
    if (desc.length > 0) desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    const costTotalStr = (costP + costM).toString();
    const dataAzi = new Date().toLocaleDateString('ro-RO');

    const nouaLucrare = {
        vin: vinCurent,
        km: parseInt(km),
        descriere: desc,
        piese: piese,
        cost: costTotalStr,
        urmator_km: urmatorKm ? parseInt(urmatorKm) : null,
        urmatoarea_data: urmatoareData,
        observatii: obs,
        data: dataAzi
    };
    
    const { error } = await supabaseClient.from('lucrari').insert([nouaLucrare]);

    if (!error) {
        alert("Lucrare salvată cu succes!");
        document.getElementById('inputKM').value = ""; document.getElementById('inputDescriere').value = ""; document.getElementById('inputPiese').value = "";
        document.getElementById('inputCostPiese').value = ""; document.getElementById('inputCostManopera').value = ""; document.getElementById('inputUrmatorKm').value = "";
        document.getElementById('inputUrmatoareaData').value = ""; document.getElementById('inputObservatii').value = "";
        incarcaIstoric();
    } else {
        alert("Eroare la salvare: " + error.message);
    }
};

window.stergeLucrare = async function(id) {
    if (confirm("Sigur ștergi înregistrarea?")) {
        const { error } = await supabaseClient.from('lucrari').delete().eq('id', id);
        if (!error) incarcaIstoric();
        else alert("Eroare la ștergere: " + error.message);
    }
};

function actualizeazaSemafor() {
    const semafor = document.getElementById('cardStatus');
    const txt = document.getElementById('tvStatusRevizie');
    if (!semafor || !txt) return;
    if (listaLucrariCompleta.length > 0) {
        semafor.style.backgroundColor = "#4CAF50";
        txt.innerText = `Sisteme Verificate. Ultima revizie: ${listaLucrariCompleta[0].km} KM`;
    } else {
        semafor.style.backgroundColor = "#FF6D00"; txt.innerText = "Nicio lucrare înregistrată în istoric.";
    }
}

// ==========================================
// 5. MENIURI & DOCUMENTE SUPABASE
// ==========================================
window.deschideMeniuActiuni = function() {
    document.getElementById('actionSheetMenu').style.display = 'block';
    document.getElementById('actionMenuOverlay').style.display = 'block';
    document.getElementById('optiuni-proprietar-web').style.display = esteProprietarMod ? 'block' : 'none';
};

window.lockMeniuActiuni = function() {
    document.getElementById('actionSheetMenu').style.display = 'none';
    document.getElementById('actionMenuOverlay').style.display = 'none';
};
window.inchideMeniuActiuni = window.lockMeniuActiuni;

window.afiseazaStatusDocument = async function(tip) {
    inchideMeniuActiuni();
    const { data } = await supabaseClient
        .from('documente')
        .select('data_expirare')
        .eq('vin', vinCurent)
        .eq('tip', tip)
        .maybeSingle();

    const dataC = data ? data.data_expirare : "Nesetată";
    let nouaD = prompt(`📋 ${tip.toUpperCase()}\nExpiră la: ${dataC}\nNoua dată (DD.MM.YYYY):`, dataC);
    
    if (nouaD) {
        const { error } = await supabaseClient
            .from('documente')
            .upsert({ vin: vinCurent, tip: tip, data_expirare: nouaD.trim() });
            
        if (!error) alert("Dată salvată!");
        else alert("Eroare: " + error.message);
    }
};

window.afiseazaSpecificatiiWeb = async function() {
    inchideMeniuActiuni();
    const { data } = await supabaseClient
        .from('masini')
        .select('ulei, anvelope')
        .eq('vin', vinCurent)
        .single();

    let u = (data && data.ulei) ? data.ulei : "Nespecificat";
    let a = (data && data.anvelope) ? data.anvelope : "Nespecificat";

    if (!esteProprietarMod) {
        let nouU = prompt("Tip Ulei recomandat:", u);
        let nouA = prompt("Dimensiuni Anvelope:", a);
        if (nouU !== null || nouA !== null) {
            await supabaseClient
                .from('masini')
                .update({ ulei: nouU || u, anvelope: nouA || a })
                .eq('vin', vinCurent);
            alert("Specificații salvate!");
        }
    } else {
        alert(`⚙️ Specificații Tehnice:\n\n🛢️ Ulei Motor: ${u}\n🚗 Anvelope: ${a}`);
    }
};

window.deschideCalculatorConsum = function() {
    inchideMeniuActiuni();
    let litri = parseFloat(prompt("Litri alimentați:"));
    let km = parseFloat(prompt("Kilometri parcurși:"));
    if (litri && km) alert(`🧮 Consum mediu: ${((litri / km) * 100).toFixed(2)} L/100km`);
};

window.partajeazaVinWeb = function() {
    inchideMeniuActiuni();
    if (navigator.share) navigator.share({ title: 'CarID', text: `VIN: ${vinCurent}` });
    else prompt("Copiați VIN-ul:", vinCurent);
};

// ==========================================
// 6. GENERARE COD QR & SALVARE ÎN SUPABASE
// ==========================================
window.genereazaCodQRWeb = async function() {
    const vin = document.getElementById('inputVIN_Client').value.trim().toUpperCase();
    const pin = document.getElementById('inputPIN_Securitate').value.trim();
    const conf = document.getElementById('inputPIN_Confirmare').value.trim();

    if (vin.length !== 17 || pin.length !== 4 || pin !== conf) { 
        alert("Verifică VIN (17 caractere) și PIN (4 cifre)!"); 
        return; 
    }

    vinCurentQR = vin;

    // Salvare sau actualizare mașină nouă în Supabase
    const { error } = await supabaseClient
        .from('masini')
        .upsert({ vin: vin, pin: pin });

    if (error) {
        alert("Eroare la crearea contului mașinii: " + error.message);
        return;
    }

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
        alert("Cod QR Generat și Mașină Înregistrată!");
    }, 150);
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

window.deschideGhidUlei = function() {
    window.open("https://www.liqui-moly.com/en/service/oil-guide.html", '_blank', 'noopener,noreferrer');
    alert("Te-am direcționat către ghidul oficial.\n\nDupă ce ai aflat specificațiile (ulei/anvelope), copiază-le și revino în aplicație pentru a le salva!");
};

window.deschideModalInvatare = function() {
    document.getElementById('modalInvatare').style.display = 'flex';
};

window.inchideModalInvatare = function() {
    document.getElementById('modalInvatare').style.display = 'none';
};

window.salveazaSiInchide = async function() {
    if (!vinCurent) {
        alert("Niciun VIN activ selectat!");
        return;
    }
    const ulei = document.getElementById('modalUlei').value.trim();
    const anvelope = document.getElementById('modalAnvelope').value.trim();
    
    if (!ulei && !anvelope) {
        alert("Completați cel puțin un câmp!");
        return;
    }

    const { error } = await supabaseClient
        .from('masini')
        .update({ ulei: ulei, anvelope: anvelope })
        .eq('vin', vinCurent);

    if (!error) {
        alert("Date salvate cu succes în CarID!");
        inchideModalInvatare();
    } else {
        alert("Eroare la salvare: " + error.message);
    }
};

function verificaDacaVineDinScanareDirecta() {
    const urlParams = new URLSearchParams(window.location.search);
    const vinDetectatDinLink = urlParams.get('vin');

    if (vinDetectatDinLink && vinDetectatDinLink.length === 17) {
        const vinCurat = vinDetectatDinLink.toUpperCase();
        salveazaInGarajLocal(vinCurat);
        esteProprietarMod = true;
        deschideDetalii(vinCurat);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// ==========================================
// 7. EXECUȚIE INIȚIALĂ ȘI SUPORT PWA
// ==========================================
verificaDacaVineDinScanareDirecta();
window.initializeazaAutocompleteDescriere();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('CarID PWA: Service Worker înregistrat cu succes! Domeniu:', reg.scope))
            .catch(err => console.error('CarID PWA: Eroare la înregistrarea Service Worker-ului:', err));
    });
}
