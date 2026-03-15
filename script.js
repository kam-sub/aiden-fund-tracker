const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTlWxydd94rO_Pp7Gj5ELL2bZX7t23FAFz5qHDBlfG3H_AzQj45nEm4VfX82koZS6yVYcpjHRrmqdUh/pub?gid=366620999&single=true&output=csv';
const EXCHANGE_API_URL = 'https://api.frankfurter.app/latest?from=EUR&to=CAD';
const GOAL_EUR = 2000; 

// Flag to prevent the confetti from firing in an endless loop
let hasCelebrated = false;

async function initTracker() {
    try {
        const rateResponse = await fetch(EXCHANGE_API_URL);
        const rateData = await rateResponse.json();
        const eurToCadRate = rateData.rates.CAD;

        const csvResponse = await fetch(CSV_URL);
        const csvText = await csvResponse.text();

        processData(csvText, eurToCadRate);
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('contribution-list').innerHTML = '<li>Error loading data. Please try again later.</li>';
    }
}

function processData(csvText, exchangeRate) {
    const rows = csvText.trim().split('\n').slice(1);
    
    let totalEur = 0;
    const historyList = document.getElementById('contribution-list');
    historyList.innerHTML = ''; 

    const contributions = [];
    
    for (let i = 0; i < rows.length; i++) {
        if (!rows[i].trim()) continue; 

        const cols = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const cleanCols = cols.map(col => col.replace(/^"|"$/g, '').trim());

        if (cleanCols.length >= 3) {
            const amount = parseFloat(cleanCols[2]) || 0;
            totalEur += amount; 

            contributions.push({
                rawDate: cleanCols[0],
                name: cleanCols[1],
                amount: amount,
                message: cleanCols[3] || '',
                dateObj: new Date(cleanCols[0]) 
            });
        }
    }

    contributions.sort((a, b) => b.dateObj - a.dateObj);

    contributions.forEach(contrib => {
        const formattedDate = isNaN(contrib.dateObj) ? '' : contrib.dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

        const li = document.createElement('li');
        li.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <strong>${contrib.name}</strong>
                <span style="font-size: 0.8rem; color: #666;">${formattedDate}</span>
            </div>
            <div>contributed <span style="color: #bb86fc; font-weight: bold;">\u20AC${contrib.amount.toLocaleString()}</span></div>
            <small style="color: #aaa; display: block; margin-top: 4px;">${contrib.message}</small>
        `;
        historyList.appendChild(li);
    });

    updateUI(totalEur, exchangeRate);
}

function updateUI(totalEur, exchangeRate) {
    const goalCad = GOAL_EUR * exchangeRate;

    const staticLabelsContainer = document.getElementById('static-labels');
    staticLabelsContainer.innerHTML = '';

    const steps = 5; 
    for (let i = steps - 1; i >= 0; i--) {
        const fraction = i / (steps - 1); 
        const stepEur = Math.round(GOAL_EUR * fraction);
        const stepCad = Math.round(goalCad * fraction);

        const labelDiv = document.createElement('div');
        labelDiv.innerHTML = `
            <div class="eur-step">\u20AC${stepEur.toLocaleString()}</div>
            <div class="cad-step">$${stepCad.toLocaleString()} CAD</div>
        `;
        staticLabelsContainer.appendChild(labelDiv);
    }

    document.getElementById('goal-eur').innerText = `\u20AC${GOAL_EUR.toLocaleString()}`;
    document.getElementById('goal-cad').innerText = `$${Math.round(goalCad).toLocaleString()} CAD`;

    let percentage = (totalEur / GOAL_EUR) * 100;
    
    // Trigger confetti if we hit 100%
    if (percentage >= 100) {
        percentage = 100; 
        if (!hasCelebrated) {
            triggerConfetti();
            hasCelebrated = true;
        }
    }
    
    document.getElementById('progress-fill').style.height = `${percentage}%`;

    const currentIndicator = document.getElementById('current-indicator');
    const currentCad = Math.round(totalEur * exchangeRate);
    
    currentIndicator.style.bottom = `${percentage}%`;
    
    currentIndicator.innerHTML = `
        <span class="eur-current">\u20AC${totalEur.toLocaleString()}</span>
        <span class="cad-current">$${currentCad.toLocaleString()} CAD</span>
    `;
}

// The custom confetti function
function triggerConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
        // Launch from left edge
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#bb86fc', '#ffffff', '#e0e0e0'] // Theme colors
        });
        // Launch from right edge
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#bb86fc', '#ffffff', '#e0e0e0']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

initTracker();