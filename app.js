// ==========================================
// LISTA DE SAGESTII RAPIDE (Peste 100 de lucrări mecanice dese)
// ==========================================
const SUGESTII_LUCRARI = [
    // Revizii & Întreținere Uzuală
    "Revizie completă (Ulei + 4 filtre)", "Schimb ulei motor", "Schimb filtru ulei", "Schimb filtru aer", "Schimb filtru habitaclu (polen)", "Schimb filtru combustibil", "Schimb lichid de frână", "Schimb antigel / Curățare instalație", "Schimb ulei cutie de viteze manuală", "Schimb ulei cutie automată (Metoda prin cădere)", "Schimb ulei cutie automată (Aparat / Dinamic)", "Schimb ulei diferențial", "Schimb ulei cutie de transfer (4x4)", "Resetare interval service / Ulei",
    
    // Sistem de Frânare
    "Schimb plăcuțe frână față", "Schimb plăcuțe frână spate", "Schimb discuri și plăcuțe frână față", "Schimb discuri și plăcuțe frână spate", "Schimb lichid frână + Aerisire sistem", "Schimb etrier frână", "Recondiționare etrier (Garnituri + Piston)", "Schimb cablu frână de mână", "Reglaj frână de mână", "Schimb senzori uzură plăcuțe", "Schimb furtunuri frână (flexibile)", "Schimb pompă centrală de frână",
    
    // Direcție, Suspensie & Rulare
    "Schimb amortizoare față", "Schimb amortizoare spate", "Schimb arcuri suspensie față", "Schimb arcuri suspensie spate", "Schimb flanșe amortizor", "Schimb bielete antiruliu față", "Schimb bielete antiruliu spate", "Schimb bucșe bară stabilizatoare", "Schimb braț suspensie / Pivot față", "Schimb braț suspensie / Bucșe spate", "Schimb pivoți direcție", "Schimb capăt de bară", "Schimb bieletă direcție", "Schimb casetă de direcție", "Schimb pompă servo-direcție", "Schimb rulment roată față", "Schimb rulment roată spate", "Geometrie roți (Unghi fugă)",
    
    // Motor, Distribuție & Transmisie Auxiliară
    "Schimb kit distribuție (Curea + Role + Pompă apă)", "Schimb kit distribuție pe lanț", "Schimb curea accesorii (Transmisie)", "Schimb întinzător / Role curea accesorii", "Schimb pompă de apă", "Schimb termostat", "Schimb garnitură capac culbutori", "Schimb garnitură chiulasă", "Rectificare chiulasă / Schimb simeringuri supape", "Schimb garnitură baie ulei", "Schimb suport motor (Tampon față/spate)", "Schimb suport cutie de viteze", "Curățare/Înlocuire clapetă accelerație", "Măsurare compresie cilindri",
    
    // Sistem de Alimentare & Injecție
    "Schimb injectoare (Set)", "Curățare / Calibrare injectoare", "Schimb șaibe foc injectoare", "Schimb pompă înaltă presiune (HPFP)", "Schimb pompă combustibil din rezervor", "Schimb rampă injecție / Senzor presiune", "Schimb bujii incandescente (Diesel)", "Schimb bujii scânteie (Benzină)", "Schimb fise / Bobine inducție",
    
    // Evacuare & Tratare Emisii
    "Curățare chimică filtru de particule (DPF)", "Schimb senzor presiune diferențială DPF", "Completare lichid AdBlue / Cerină", "Schimb senzor NOx", "Anulare / Curățare valvă EGR", "Schimb valvă EGR", "Schimb sondă Lambda", "Schimb racord flexibil evacuare", "Schimb tobă eșapament (Finală/Medie)",
    
    // Ambreiaj & Transmisie
    "Schimb kit ambreiaj complet (Placă + Disc + Rulment)", "Schimb kit ambreiaj + Volantă cu masă dublă", "Schimb cilindru receptor / Pompă ambreiaj", "Schimb planetară completă", "Schimb kit burduf planetară (Spre roată/cutie)", "Schimb racord flexibil cardan (Flanșă)", "Schimb rulment intermediar cardan",
    
    // Climatizare & Răcire
    "Igienizare sistem climatizare (Ozon / Spray)", "Reîncărcare freon auto (R134a)", "Reîncărcare freon auto (R1234yf)", "Schimb compresor aer condiționat", "Schimb radiator climă (Condensator)", "Schimb radiator răcire motor", "Schimb electroventilator",
    
    // Electrică & Diagnoză
    "Diagnoză computerizată / Citire erori", "Ștergere erori / Interpretare parametri în timp real", "Schimb baterie auto + Înregistrare (Codare)", "Schimb alternator", "Schimb electromotor (Demaror)", "Schimb senzori motor (Ax cu came / Arbore / ABS)", "Reparație cablaj electric", "Reglaj faruri", "Schimb becuri / Kit Xenon / LED",
    
    // Turbo & Admisie
    "Schimb turbosuflantă (Turbină)", "Recondiționare turbosuflantă", "Schimb actuator turbină (Electric/Vacuumatic)", "Curățare galerie admisie / Clapete swirl", "Schimb radiator intercooler", "Schimb furtun intercooler (Presiune)"
];

// ==========================================
// LOGICA DE AUTOCOMPLETE PENTRU DESCHIDEREA INTERFEȚEI
// ==========================================
window.initializeazaAutocompleteDescriere = function() {
    const inputDesc = document.getElementById('inputDescriere');
    const containerSugestii = document.getElementById('sugestii-descriere-container');
    
    if (!inputDesc || !containerSugestii) return;

    // Ascundem lista când dăm click în altă parte a ecranului
    document.addEventListener('click', function(e) {
        if (e.target !== inputDesc && e.target !== containerSugestii) {
            containerSugestii.style.display = 'none';
        }
    });

    inputDesc.addEventListener('input', function() {
        const valoare = this.value.toLowerCase().trim();
        containerSugestii.innerHTML = '';
        
        if (!valoare) {
            containerSugestii.style.display = 'none';
            return;
        }

        // Filtrăm lista de 100+ lucrări în funcție de ce scrie mecanicul
        const filtrate = SUGESTII_LUCRARI.filter(lucrare => 
            lucrare.toLowerCase().includes(valoare)
        ).slice(0, 6); // Limităm la max 6 sugestii pe ecran pentru vizibilitate pe telefon

        if (filtrate.length === 0) {
            containerSugestii.style.display = 'none';
            return;
        }

        filtrate.forEach(lucrare => {
            const item = document.createElement('div');
            item.style.cssText = "padding: 12px; cursor: pointer; border-bottom: 1px solid #EEE; color: #333; font-size: 14px; font-weight: 500; text-align: left;";
            
            // Evidențiem textul potrivit
            const index = lucrare.toLowerCase().indexOf(valoare);
            item.innerHTML = lucrare.substring(0, index) + 
                             "<strong>" + lucrare.substring(index, index + valoare.length) + "</strong>" + 
                             lucrare.substring(index + valoare.length);

            // Când dai click pe o sugestie, o pune în câmp și închide lista
            item.addEventListener('click', function() {
                inputDesc.value = lucrare;
                containerSugestii.style.display = 'none';
            });

            containerSugestii.appendChild(item);
        });

        containerSugestii.style.display = 'block';
    });
};

// Modificăm funcția existentă de salvare ca să citească noul câmp text input
window.salveazaLucrareNoua = function() {
    const km = document.getElementById('inputKM').value.trim();
    let desc = document.getElementById('inputDescriere').value.trim(); // Citese direct valoarea din input text
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
        document.querySelectorAll('#layoutMecanic input').forEach(i => i.value = "");
        document.getElementById('sugestii-descriere-container').innerHTML = '';
        incarcaIstoric();
    });
};

// Apelăm inițializarea la pornirea scriptului
setTimeout(window.initializeazaAutocompleteDescriere, 500);
