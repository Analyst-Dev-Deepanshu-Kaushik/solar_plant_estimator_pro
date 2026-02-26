// 1. GLOBAL STATE & CONFIGURATION
let currentStep = 1;
const totalSteps = 5;
const states = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"];

// Safe Value Fetcher
const f = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : "";
};

// 2. INITIALIZATION
window.addEventListener('load', () => {
    // Populate States
    const stateSelect = document.getElementById('state');
    if (stateSelect) {
        states.forEach(st => stateSelect.add(new Option(st, st)));
    }

    // Load Permanent Logo
    const savedLogo = localStorage.getItem('permanentCompanyLogo');
    if (savedLogo) applyLogoToUI(savedLogo);

    // Load Usage History
    loadUsageLog();

    // Initialize Default Terms
    const termsField = document.getElementById('customTerms');
    if (termsField && !termsField.value) {
        termsField.value = 
`1. Payment: 60% advance with order, 30% on delivery, 10% post installation.
2. Delivery: 15-20 days from date of advance payment.
3. Warranty: Modules (25Yrs Performance), Inverter (5Yrs), Batteries (3Yrs).
4. Validity: This offer is valid for 7 days only.
5. Installation: Complete labor, testing & commissioning included.
6. Legal: Subject to local jurisdiction of ${f('city') || 'local'} courts. Force Majeure applies.`;
    }

    lucide.createIcons();
});

// 3. NAVIGATION & UI LOGIC
function nextStep() {
    if (currentStep < totalSteps) {
        document.getElementById(`step${currentStep}`).classList.add('d-none');
        currentStep++;
        document.getElementById(`step${currentStep}`).classList.remove('d-none');
        updateUI();
    }
}

function prevStep() {
    if (currentStep > 1) {
        document.getElementById(`step${currentStep}`).classList.add('d-none');
        currentStep--;
        document.getElementById(`step${currentStep}`).classList.remove('d-none');
        updateUI();
    }
}

function updateUI() {
    // Update Progress Bar
    const progress = (currentStep / totalSteps) * 100;
    const progressBar = document.getElementById('mainProgress');
    const badge = document.getElementById('currentStepBadge');

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (badge) badge.innerText = `Step ${currentStep} of ${totalSteps}`;

    // Manage History Visibility (Hide on final preview screen)
    const history = document.getElementById('historySection');
    const previewVisible = !document.getElementById('viewingScreen').classList.contains('d-none');
    
    if (history) {
        history.style.display = previewVisible ? 'none' : 'block';
    }

    lucide.createIcons();
    // Smooth scroll to top for better Mobile UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 4. BRANDING & LOGO PERSISTENCE
function toggleLogoUpload(show) {
    const section = document.getElementById('logoUploadSection');
    if (show) section.classList.remove('d-none');
    else nextStep();
}

function handleCompanyLogo(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result;
            localStorage.setItem('permanentCompanyLogo', data);
            applyLogoToUI(data);
            alert("Company Logo saved successfully!");
        };
        reader.readAsDataURL(file);
    }
}

function applyLogoToUI(imageData) {
    const navLogo = document.getElementById('navLogo');
    if (navLogo) {
        navLogo.src = imageData;
        navLogo.style.display = 'block';
    }
}

// 5. ACTIVITY LOGGING
function saveToLog(client, capacity, unit) {
    let logs = JSON.parse(localStorage.getItem('solarUsageLogs') || '[]');
    const newEntry = {
        user: f('createdBy') || "Admin",
        client: client,
        system: `${capacity} ${unit}`,
        time: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    };
    logs.unshift(newEntry);
    localStorage.setItem('solarUsageLogs', JSON.stringify(logs.slice(0, 10)));
    loadUsageLog();
}

function clearUsageLog() {
    if (confirm("Delete all recent activity history? This cannot be undone.")) {
        localStorage.removeItem('solarUsageLogs');
        loadUsageLog();
    }
}

function loadUsageLog() {
    const logs = JSON.parse(localStorage.getItem('solarUsageLogs') || '[]');
    const container = document.getElementById('usageLog');
    if (!container) return;

    if (logs.length > 0) {
        container.innerHTML = logs.map(l => `
            <div class="list-group-item border-0 border-bottom px-0 py-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1 fw-bold">${l.client}</h6>
                        <p class="mb-0 text-muted tiny-label">${l.system} • By ${l.user}</p>
                    </div>
                    <span class="badge bg-light text-dark border fw-normal">${l.time}</span>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<div class="text-center py-4 text-muted small italic">No previous estimates recorded.</div>';
    }
    if (window.lucide) lucide.createIcons();
}

// 6. SYSTEM LOGIC
function toggleBatteryUI() {
    const type = f('systemType');
    const section = document.getElementById('batteryInputSection');
    if (section) section.classList.toggle('d-none', type === 'On-grid');
}

// 7. CALCULATION & PDF ENGINE
function generateProfessionalPreview() {
    const client = f('clientName');
    const cap = f('capacity');
    const unit = f('unit');

    if (!client || !cap) {
        alert("Please fill in Client Name and System Capacity.");
        return;
    }

    // Save to local history
    saveToLog(client, cap, unit);

    // Transition UI
    document.getElementById('wizardWrapper').classList.add('d-none');
    document.getElementById('viewingScreen').classList.remove('d-none');
    updateUI();

    // Calculations
    const watts = unit === 'MW' ? parseFloat(cap) * 1000000 : parseFloat(cap) * 1000;
    const modWp = parseFloat(f('modWp')) || 545;
    const moduleCount = Math.ceil(watts / modWp);
    const ppw = parseFloat(f('pricePerWatt')) || 0;
    const gstRate = parseFloat(f('gstRate')) || 0;
    const totalRaw = watts * ppw;

    let base, gst, grand;
    if (f('gstType') === 'included') {
        base = totalRaw / (1 + (gstRate / 100));
        gst = totalRaw - base;
        grand = totalRaw;
    } else {
        base = totalRaw;
        gst = (base * gstRate) / 100;
        grand = base + gst;
    }

    // Build Material Rows
    let bomRows = `
        <tr><td class="text-center">1</td><td>Solar PV Modules</td><td>${f('modBrand') || 'Tier-1'}</td><td>${modWp}Wp Mono-Perc</td><td class="text-center">${moduleCount} Nos</td></tr>
        <tr><td class="text-center">2</td><td>Solar Inverter</td><td>${f('invBrand') || 'Smart Series'}</td><td>${cap}${unit} (${f('systemType')})</td><td class="text-center">1 Unit</td></tr>
    `;

    if (f('systemType') !== 'On-grid') {
        const kwh = parseFloat(f('reqKwh')) || 0;
        const ah = parseFloat(f('battAh')) || 150;
        const volt = parseFloat(f('sysVolt')) || 12;
        const battCount = Math.ceil((kwh * 1000) / (ah * volt));
        bomRows += `<tr><td class="text-center">3</td><td>Solar Battery Bank</td><td>${f('battBrand') || 'Solar Grade'}</td><td>${ah}Ah / ${volt}V</td><td class="text-center">${battCount} Nos</td></tr>`;
    }

    bomRows += `
        <tr><td class="text-center">#</td><td>Mounting Structure</td><td>Hot-Dipped GI</td><td>Wind Resistant</td><td class="text-center">1 Set</td></tr>
        <tr><td class="text-center">#</td><td>Protection Gear</td><td>ACDB / DCDB</td><td>IP65 Enclosures</td><td class="text-center">1 Set</td></tr>
        <tr><td class="text-center">#</td><td>Electrical Kit</td><td>Cables & Earthing</td><td>UV Protected / FRLS</td><td class="text-center">1 Set</td></tr>
    `;

    // Process Branding
    const savedLogo = localStorage.getItem('permanentCompanyLogo');
    const logoHtml = savedLogo ? `<img src="${savedLogo}" style="max-height: 80px;">` : `<h2 style="color:#f09c13; font-weight:bold;">SOLAR SOLUTIONS A Sample Company</h2>`;

    // Inject into PDF Container
    document.getElementById('pdfContent').innerHTML = `
        <div class="pdf-container p-4 p-md-5 bg-white" style="border-top: 15px solid #f09c13; min-height: 297mm; position:relative;">
            <div class="row align-items-center mb-4 pb-4 border-bottom">
                <div class="col-6">${logoHtml}</div>
                <div class="col-6 text-end">
                    <h1 class="fw-bold mb-0" style="color:#2c3e50;">QUOTATION</h1>
                    <p class="text-muted small mb-0">Date: ${new Date().toLocaleDateString('en-IN')}</p>
                    <p class="text-muted small">Ref: SS/QT/${new Date().getFullYear()}/${Math.floor(Math.random()*900)+100}</p>
                </div>
            </div>

            <div class="row mb-5">
                <div class="col-7">
                    <h6 class="tiny-label text-muted">PREPARED FOR:</h6>
                    <h5 class="fw-bold mb-1">${f('clientName')}</h5>
                    <p class="small text-muted mb-0">${f('address')}, ${f('city')}, ${f('state')}</p>
                    <p class="small text-muted">Ph: ${f('contactNumber')}</p>
                </div>
                <div class="col-5 text-end">
                    <h6 class="tiny-label text-muted">SYSTEM SPECIFICATION:</h6>
                    <h5 class="fw-bold text-success mb-1">${cap} ${unit} ${f('systemType')}</h5>
                    <p class="small text-muted">Module Count: ${moduleCount} x ${modWp}Wp</p>
                </div>
            </div>

            <table class="table table-bordered mb-5" style="font-size: 11px;">
                <thead style="background:#f8f9fa;">
                    <tr><th class="text-center">#</th><th>Description</th><th>Brand</th><th>Spec</th><th class="text-center">Qty</th></tr>
                </thead>
                <tbody>${bomRows}</tbody>
            </table>

            <div class="row mb-4">
                <div class="col-7">
                    <h6 class="fw-bold small border-bottom pb-1">TERMS & CONDITIONS</h6>
                    <div style="font-size: 10px; line-height: 1.6; color:#555;">${f('customTerms').replace(/\n/g, '<br>')}</div>
                </div>
                <div class="col-5">
                    <div class="p-3 bg-light rounded shadow-sm border">
                        <div class="d-flex justify-content-between mb-1 small"><span>Sub Total:</span><span>₹${base.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span></div>
                        <div class="d-flex justify-content-between mb-1 small"><span>GST (${gstRate}%):</span><span>₹${gst.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span></div>
                        <hr class="my-2">
                        <div class="d-flex justify-content-between fw-bold h5 text-primary mb-0"><span>TOTAL:</span><span>₹${grand.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span></div>
                    </div>
                </div>
            </div>

            <div class="text-center pt-5 mt-5 border-top">
                <p class="small text-muted mb-0">Authorized Representative: <strong>${f('createdBy')}</strong></p>
                <p class="text-muted" style="font-size: 8px;">This is a system generated document and requires no physical signature.</p>
            </div>
        </div>
    `;
}

// 8. EXPORT & UTILITIES
function downloadPDF() {
    const element = document.getElementById('pdfContent');
    const opt = {
        margin: 0,
        filename: `Solar_Quote_${f('clientName').replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}

function resetApp() {
    if (confirm("Clear all data and return to home screen?")) {
        location.reload();
    }
}

function backToEdit() {
    document.getElementById('viewingScreen').classList.add('d-none');
    document.getElementById('wizardWrapper').classList.remove('d-none');
    currentStep = 5;
    updateUI();
}