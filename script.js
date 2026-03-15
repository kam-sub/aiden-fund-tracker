// The link to your published CSV
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTlWxydd94rO_Pp7Gj5ELL2bZX7t23FAFz5qHDBlfG3H_AzQj45nEm4VfX82koZS6yVYcpjHRrmqdUh/pub?gid=366620999&single=true&output=csv';

// Free open-source currency API
const EXCHANGE_API_URL = 'https://api.frankfurter.app/latest?from=EUR&to=CAD';

// The updated goal
const GOAL_EUR = 2000; 

async function initTracker() {
    try {
        // 1. Fetch live exchange rate
        const rateResponse = await fetch(EXCHANGE_API_URL);
        const rateData = await rateResponse.json();
        const eurToCadRate = rateData.rates.CAD;

        // 2. Fetch Google Sheets CSV data
        const csvResponse = await fetch(CSV_URL);
        const csvText = await csvResponse.text();

        // 3. Parse CSV and update the page
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

    // 1. Extract the data into an array of objects
    const contributions = [];
    
    for (let i = 0; i < rows.length; i++) {
        if (!rows[i].trim()) continue; 

        const cols = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const cleanCols = cols.map(col => col.replace(/^"|"$/g, '').trim());

        if (cleanCols.length >= 3) {
            const amount = parseFloat(cleanCols[2]) || 0;
            totalEur += amount; // Add to the running total

            contributions.push({
                rawDate: cleanCols[0],
                name: cleanCols[1],
                amount: amount,
                message: cleanCols[3] || '',
                dateObj: new Date(cleanCols[0]) // Convert the timestamp string into a real Date object
            });
        }
    }

    // 2. Sort the array strictly by date (Newest first)
    contributions.sort((a, b) => b.dateObj - a.dateObj);

    // 3. Build the HTML list from the sorted data
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

    // Update the visual tracker with the total
    updateUI(totalEur, exchangeRate);
}

function updateUI(totalEur, exchangeRate) {
    const goalCad = GOAL_EUR * exchangeRate;

    // 1. Generate the Left Side Static Labels (Combined EUR and CAD)
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

    // 2. Update the Top Header Text
    document.getElementById('goal-eur').innerText = `\u20AC${GOAL_EUR.toLocaleString()}`;
    document.getElementById('goal-cad').innerText = `$${Math.round(goalCad).toLocaleString()} CAD`;

    // 3. Calculate Percentage
    let percentage = (totalEur / GOAL_EUR) * 100;
    if (percentage > 100) percentage = 100; 
    
    // 4. Animate the Progress Bar
    document.getElementById('progress-fill').style.height = `${percentage}%`;

    // 5. Update and Move the Floating Current Indicator
    const currentIndicator = document.getElementById('current-indicator');
    const currentCad = Math.round(totalEur * exchangeRate);
    
    currentIndicator.style.bottom = `${percentage}%`;
    
    currentIndicator.innerHTML = `
        <span class="eur-current">\u20AC${totalEur.toLocaleString()}</span>
        <span class="cad-current">$${currentCad.toLocaleString()} CAD</span>
    `;
}

// Start the whole process
initTracker();