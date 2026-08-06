// ==========================================================================
// ADMIN DASHBOARD LOGIC
// ==========================================================================

const ADMIN_PASSWORD = "luiz123"; // Default admin password
let viewsChartInstance = null;
let channelsChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    
    // Check if user is already authenticated in this session
    if (sessionStorage.getItem('admin_authenticated') === 'true') {
        showDashboard();
    } else {
        showLogin();
    }

    // ==========================================================================
    // 1. AUTHENTICATION HANDLER
    // ==========================================================================
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('admin-password');
    const loginError = document.getElementById('login-error-msg');
    const logoutBtn = document.getElementById('btn-logout');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = passwordInput.value.trim();
        
        if (pwd === ADMIN_PASSWORD) {
            sessionStorage.setItem('admin_authenticated', 'true');
            loginError.style.display = 'none';
            passwordInput.value = '';
            showDashboard();
        } else {
            loginError.style.display = 'block';
            passwordInput.focus();
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('admin_authenticated');
        showLogin();
    });
});

function showLogin() {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    initDashboard();
}

// ==========================================================================
// 2. DASHBOARD INITIALIZATION & RENDER
// ==========================================================================
function initDashboard() {
    // 1. DOM Elements
    const searchInput = document.getElementById('filter-search');
    const segmentFilter = document.getElementById('filter-segment');
    const revenueFilter = document.getElementById('filter-revenue');
    const btnExport = document.getElementById('btn-export-csv');
    const btnClear = document.getElementById('btn-clear-stats');
    const btnMock = document.getElementById('btn-generate-mock');
    
    // Modal elements
    const modal = document.getElementById('confirm-modal');
    const modalCancel = document.getElementById('modal-btn-cancel');
    const modalConfirm = document.getElementById('modal-btn-confirm');

    // 2. Load Stats Data & Update KPI Cards
    updateKPIs();

    // 3. Render Charts
    renderCharts();

    // 4. Render Leads Table
    renderLeadsTable();

    // 5. Setup Live Filters
    searchInput.addEventListener('input', renderLeadsTable);
    segmentFilter.addEventListener('change', renderLeadsTable);
    revenueFilter.addEventListener('change', renderLeadsTable);

    // 6. Action Listeners
    btnExport.addEventListener('click', exportLeadsToCSV);
    
    // Clear data flow
    btnClear.addEventListener('click', () => modal.classList.remove('hidden'));
    modalCancel.addEventListener('click', () => modal.classList.add('hidden'));
    modalConfirm.addEventListener('click', () => {
        localStorage.removeItem('leads');
        localStorage.removeItem('site_stats');
        modal.classList.add('hidden');
        updateKPIs();
        renderCharts();
        renderLeadsTable();
    });

    // Mock Data Generator
    btnMock.addEventListener('click', () => {
        generateMockAnalyticsData();
        updateKPIs();
        renderCharts();
        renderLeadsTable();
        alert('Dados de teste gerados com sucesso para demonstração do painel!');
    });
}

// ==========================================================================
// 3. METRICS AND KPI CALCULATIONS
// ==========================================================================
function updateKPIs() {
    const stats = JSON.parse(localStorage.getItem('site_stats') || '{}');
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');

    let totalViews = 0;
    let uniqueViews = 0;
    let waClicks = 0;
    let emailClicks = 0;
    let instagramClicks = 0;
    let formLeads = leads.length;

    // Loop through daily metrics
    Object.keys(stats).forEach(date => {
        const dayData = stats[date];
        totalViews += dayData.views || 0;
        uniqueViews += dayData.unique_views || 0;
        waClicks += dayData.whatsapp_clicks || 0;
        emailClicks += dayData.email_clicks || 0;
        instagramClicks += dayData.instagram_clicks || 0;
    });

    // Total Contacts = direct whatsapp + direct email + form submissions
    // (Note: we use formLeads.length as form_submissions since formLeads is the actual concrete list)
    const totalContacts = waClicks + emailClicks + formLeads;

    // Conversion rate
    const conversionRate = totalViews > 0 ? ((totalContacts / totalViews) * 100).toFixed(1) : '0.0';

    // Update UI elements
    document.getElementById('kpi-total-views').textContent = totalViews.toLocaleString('pt-BR');
    document.getElementById('sub-kpi-uniques').textContent = `${uniqueViews.toLocaleString('pt-BR')} visitantes únicos`;
    document.getElementById('kpi-total-contacts').textContent = totalContacts.toLocaleString('pt-BR');
    document.getElementById('kpi-form-leads').textContent = formLeads.toLocaleString('pt-BR');
    document.getElementById('kpi-wa-clicks').textContent = waClicks.toLocaleString('pt-BR');
    document.getElementById('kpi-email-clicks').textContent = emailClicks.toLocaleString('pt-BR');
    document.getElementById('kpi-conversion-rate').textContent = `${conversionRate}%`;
}

// ==========================================================================
// 4. CHART RENDERING (Chart.js)
// ==========================================================================
function renderCharts() {
    const stats = JSON.parse(localStorage.getItem('site_stats') || '{}');
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');

    // Get sorted dates (last 15 days)
    const sortedDates = Object.keys(stats).sort();
    const last15Dates = sortedDates.slice(-15);
    
    // If no stats exist, create a baseline default empty state
    if (last15Dates.length === 0) {
        const today = new Date().toLocaleDateString('sv-SE');
        last15Dates.push(today);
        stats[today] = { views: 0, unique_views: 0, whatsapp_clicks: 0, email_clicks: 0, form_submissions: 0 };
    }

    const viewsData = [];
    const uniqueViewsData = [];
    const conversionsData = [];

    last15Dates.forEach(date => {
        const dayData = stats[date] || {};
        viewsData.push(dayData.views || 0);
        uniqueViewsData.push(dayData.unique_views || 0);
        
        // Count form leads matching this date
        const formLeadsOnDay = leads.filter(l => {
            if (!l.timestamp) return false;
            return l.timestamp.startsWith(date);
        }).length;

        const totalConvsOnDay = (dayData.whatsapp_clicks || 0) + (dayData.email_clicks || 0) + formLeadsOnDay;
        conversionsData.push(totalConvsOnDay);
    });

    // Format dates to DD/MM
    const labels15Days = last15Dates.map(date => {
        const parts = date.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}`;
        }
        return date;
    });

    // 1. Views vs Conversions Chart (Line Chart)
    const ctxViews = document.getElementById('viewsChart').getContext('2d');
    if (viewsChartInstance) {
        viewsChartInstance.destroy();
    }
    
    viewsChartInstance = new Chart(ctxViews, {
        type: 'line',
        data: {
            labels: labels15Days,
            datasets: [
                {
                    label: 'Acessos Totais',
                    data: viewsData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 2
                },
                {
                    label: 'Visitantes Únicos',
                    data: uniqueViewsData,
                    borderColor: '#a1a1aa',
                    backgroundColor: 'transparent',
                    tension: 0.3,
                    borderWidth: 2,
                    borderDash: [5, 5]
                },
                {
                    label: 'Conversões (Contatos)',
                    data: conversionsData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#a1a1aa', font: { family: 'Plus Jakarta Sans', size: 11 } }
                },
                tooltip: {
                    backgroundColor: '#18181b',
                    titleColor: '#fff',
                    bodyColor: '#a1a1aa',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: { color: '#71717a' }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: { color: '#71717a', stepSize: 1 }
                }
            }
        }
    });

    // 2. Channels Breakdown Chart (Doughnut Chart)
    let waClicksTotal = 0;
    let emailClicksTotal = 0;
    let instagramClicksTotal = 0;
    let formLeadsTotal = leads.length;

    Object.keys(stats).forEach(date => {
        const dayData = stats[date];
        waClicksTotal += dayData.whatsapp_clicks || 0;
        emailClicksTotal += dayData.email_clicks || 0;
        instagramClicksTotal += dayData.instagram_clicks || 0;
    });

    const ctxChannels = document.getElementById('channelsChart').getContext('2d');
    if (channelsChartInstance) {
        channelsChartInstance.destroy();
    }

    const hasData = (waClicksTotal + emailClicksTotal + instagramClicksTotal + formLeadsTotal) > 0;
    const channelsDataArray = hasData 
        ? [formLeadsTotal, waClicksTotal, emailClicksTotal, instagramClicksTotal] 
        : [1, 0, 0, 0]; // default layout if empty

    channelsChartInstance = new Chart(ctxChannels, {
        type: 'doughnut',
        data: {
            labels: hasData ? ['Formulário (Leads)', 'WhatsApp Direto', 'E-mail Direto', 'Instagram'] : ['Nenhum Contato'],
            datasets: [{
                data: channelsDataArray,
                backgroundColor: hasData 
                    ? ['#8b5cf6', '#14b8a6', '#f97316', '#3b82f6'] 
                    : ['rgba(113, 113, 122, 0.2)'],
                borderColor: '#121214',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#a1a1aa', font: { family: 'Plus Jakarta Sans', size: 11 }, boxWidth: 12 }
                },
                tooltip: {
                    enabled: hasData,
                    backgroundColor: '#18181b',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            },
            cutout: '70%'
        }
    });
}

// ==========================================================================
// 5. LEADS TABLE MANAGEMENT AND FILTERS
// ==========================================================================
function renderLeadsTable() {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const tableBody = document.getElementById('leads-table-body');
    
    // Filters input
    const searchQuery = document.getElementById('filter-search').value.toLowerCase().trim();
    const selectedSegment = document.getElementById('filter-segment').value;
    const selectedRevenue = document.getElementById('filter-revenue').value;

    // Filter Leads
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchQuery) || 
                              lead.company.toLowerCase().includes(searchQuery);
        
        const matchesSegment = selectedSegment === "" || lead.segment === selectedSegment;
        
        const matchesRevenue = selectedRevenue === "" || lead.revenue === selectedRevenue;

        return matchesSearch && matchesSegment && matchesRevenue;
    });

    // Sort by timestamp descending (newest first)
    filteredLeads.sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // Render Rows
    if (filteredLeads.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-state-row">
                <td colspan="8">Nenhum lead correspondente aos filtros foi encontrado.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = '';
    
    filteredLeads.forEach(lead => {
        // Format timestamp
        let formattedDate = 'N/A';
        if (lead.timestamp) {
            const dateObj = new Date(lead.timestamp);
            formattedDate = dateObj.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // WhatsApp direct link logic (clean format)
        let cleanPhone = lead.whatsapp ? lead.whatsapp.replace(/\D/g, '') : '';
        // If it doesn't have country code, prepend Brazil country code (55)
        if (cleanPhone.length > 0 && !cleanPhone.startsWith('55')) {
            cleanPhone = '55' + cleanPhone;
        }
        const waLink = `https://wa.me/${cleanPhone}`;

        // Get class representing the Segment for Badge styling
        let segmentClass = 'outro';
        if (lead.segment) {
            if (lead.segment.includes('Estética') || lead.segment.includes('Harmonização')) segmentClass = 'estetica';
            else if (lead.segment.includes('Dermatologia')) segmentClass = 'dermatologia';
            else if (lead.segment.includes('Odontologia') || lead.segment.includes('Trícologia')) segmentClass = 'odontologia';
            else if (lead.segment.includes('Médica') || lead.segment.includes('Injetaveis')) segmentClass = 'clinica';
            else if (lead.segment.includes('Spa') || lead.segment.includes('Ginecologia')) segmentClass = 'spa';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="lead-time">${formattedDate}</td>
            <td><span class="lead-name">${escapeHTML(lead.name)}</span></td>
            <td>
                <a href="${waLink}" target="_blank" rel="noopener noreferrer" style="color: var(--color-green); text-decoration: underline; font-weight: 500;">
                    ${escapeHTML(lead.whatsapp)}
                </a>
            </td>
            <td>${escapeHTML(lead.company)}</td>
            <td><span class="segment-tag ${segmentClass}">${escapeHTML(lead.segment || 'Outro')}</span></td>
            <td><span class="revenue-val">${escapeHTML(lead.revenue || 'Até R$ 40k')}</span></td>
            <td>${escapeHTML(lead.challenge || 'Não informado')}</td>
            <td class="table-actions">
                <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-icon-only whatsapp-link" title="Iniciar Conversa">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                </a>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Utility to escape HTML and prevent injection
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// ==========================================================================
// 6. CSV EXPORTER (Excel Friendly)
// ==========================================================================
function exportLeadsToCSV() {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    if (leads.length === 0) {
        alert('Não há leads disponíveis para exportação.');
        return;
    }

    // Build headers
    const headers = ['Data', 'Nome', 'WhatsApp', 'Clinica', 'Segmento', 'Faturamento', 'Maior Gargalo'];
    
    // Format rows
    const rows = leads.map(lead => {
        let dateStr = '';
        if (lead.timestamp) {
            dateStr = new Date(lead.timestamp).toLocaleString('pt-BR');
        }
        return [
            dateStr,
            lead.name || '',
            lead.whatsapp || '',
            lead.company || '',
            lead.segment || '',
            lead.revenue || '',
            lead.challenge || ''
        ];
    });

    // Escape elements and join by semicolons (Standard in Brazil Excel)
    let csvContent = "\uFEFF"; // UTF-8 BOM to keep special accents in Portuguese
    csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(';') + '\r\n';
    
    rows.forEach(row => {
        csvContent += row.map(val => `"${val.replace(/"/g, '""')}"`).join(';') + '\r\n';
    });

    // Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_luiz_henrique_${new Date().toLocaleDateString('sv-SE')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==========================================================================
// 7. MOCK DATA GENERATOR (Demonstration Mode)
// ==========================================================================
function generateMockAnalyticsData() {
    const stats = {};
    const leads = [];
    const today = new Date();

    const segments = ['Estética Avançada', 'Dermatologia / Plástica', 'Odontologia', 'Clínica Médica / Nutrologia / Outros', 'Spa / Beleza / Bem-estar', 'Outro segmento'];
    const revenues = ['Até R$ 20k', 'R$ 20k a R$ 50k', 'R$ 50k a R$ 100k', 'Acima de R$ 100k'];
    const challenges = ['Leads sem resposta', 'Falta de processo', 'CRM abandonado/inexistente', 'Desperdício de tráfego', 'Outros'];
    
    const mockNames = [
        'Dra. Ana Carolina Rocha', 'Dr. Eduardo Vasconcelos', 'Dra. Juliana Mendes', 
        'Dr. Henrique Porto', 'Dra. Camila Nogueira', 'Dr. Ricardo Teixeira', 
        'Dra. Roberta Fontes', 'Dr. Gustavo Gouveia', 'Dra. Vanessa Andrade', 
        'Dra. Marina Castro', 'Dr. Fábio Azevedo', 'Dra. Patrícia Alencar'
    ];
    
    const mockClinics = [
        'Bella Pelle Estética', 'Inova Odontologia', 'Clínica São Lucas', 
        'Harmonize Clinic', 'Slim Spa & Bem Estar', 'Oral Sin Premium', 
        'Vitale Ginecologia', 'Derma Care Dermatologia', 'Doutor do Sorriso', 
        'Atelier da Face', 'Revitalize Odonto', 'Plena Clinica Integrada'
    ];

    const mockPhones = [
        '(11) 98112-3344', '(81) 99922-1100', '(21) 97123-5566', 
        '(31) 98844-3322', '(81) 99234-9988', '(51) 99122-8877', 
        '(61) 98234-4455', '(11) 99231-5544', '(81) 98877-6655', 
        '(21) 99345-6677', '(81) 99654-3210', '(31) 97321-4455'
    ];

    // Generate stats for last 30 days
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toLocaleDateString('sv-SE'); // YYYY-MM-DD

        // Generate traffic
        const totalViews = Math.floor(Math.random() * 80) + 40; // 40-120 views
        const uniqueViews = Math.floor(totalViews * (Math.random() * 0.3 + 0.5)); // 50-80% of total
        
        // Generate direct conversions
        const waClicks = Math.floor(Math.random() * 5); // 0-4
        const emailClicks = Math.floor(Math.random() * 2); // 0-1
        const instagramClicks = Math.floor(Math.random() * 3) + 1; // 1-3

        stats[dateStr] = {
            views: totalViews,
            unique_views: uniqueViews,
            whatsapp_clicks: waClicks,
            email_clicks: emailClicks,
            instagram_clicks: instagramClicks,
            form_submissions: 0 // Will increment as we add forms
        };

        // Randomly insert forms on this day (15% chance per day)
        if (Math.random() < 0.35 && leads.length < mockNames.length) {
            const index = leads.length;
            const hour = Math.floor(Math.random() * 12) + 9; // 9 AM to 9 PM
            const min = Math.floor(Math.random() * 60);
            
            const timestamp = new Date(d);
            timestamp.setHours(hour, min, 0, 0);

            const lead = {
                name: mockNames[index],
                whatsapp: mockPhones[index],
                company: mockClinics[index],
                segment: segments[Math.floor(Math.random() * segments.length)],
                revenue: revenues[Math.floor(Math.random() * revenues.length)],
                challenge: challenges[Math.floor(Math.random() * challenges.length)],
                timestamp: timestamp.toISOString()
            };

            leads.push(lead);
            stats[dateStr].form_submissions++;
        }
    }

    // Save to localStorage
    localStorage.setItem('site_stats', JSON.stringify(stats));
    localStorage.setItem('leads', JSON.stringify(leads));
}
