document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Convert local times
    const localTimeElements = document.querySelectorAll('.local-time');
    localTimeElements.forEach(el => {
        const utcTime = el.getAttribute('data-utc'); // expected "HH:MM"
        if (utcTime) {
            // Create a dummy date in UTC with that time to convert to local
            const [hours, minutes] = utcTime.split(':');
            const date = new Date();
            date.setUTCHours(parseInt(hours, 10));
            date.setUTCMinutes(parseInt(minutes, 10));
            date.setUTCSeconds(0);
            
            const localTimeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            el.textContent = localTimeString;
        }
    });

    // Chart default config for dark theme
    Chart.defaults.color = '#a3a3a3';
    Chart.defaults.borderColor = '#1f1f2e';
    Chart.defaults.font.family = "'Nunito Sans', sans-serif";
    
    const i18n = window.chillfishStatsi18n || {
        members: "Members",
        time: "Time / Date",
        meetupOption: "Meetup {n} ({date})"
    };

    // Calculate Nth Meetup
    const startDate = new Date(Date.UTC(2026, 0, 31, 23, 0, 0)); // Jan 31, 2026 UTC
    const now = new Date();
    // Milliseconds in a week
    const msInWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksPassed = Math.floor((now - startDate) / msInWeek);
    const currentMeetupN = weeksPassed + 1;

    const badge = document.getElementById('nth-meetup-badge');
    if (badge) {
        const template = badge.getAttribute('data-template');
        badge.textContent = template.replace('{n}', currentMeetupN);
    }

    // Helper: calculate meetup number from a given date
    function getMeetupNumberFromDate(dateStr) {
        const d = new Date(dateStr);
        // We use UTC 23:00 to avoid timezone offset issues when subtracting
        const testDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 0, 0));
        let diff = Math.floor((testDate - startDate) / msInWeek);
        if (diff < 0) diff = 0;
        return diff + 1;
    }

    // 2. Group Stats Chart
    let groupChart = null;
    fetch('/api/chillfish/stats/group')
        .then(res => res.json())
        .then(data => {
            if(!data || data.length === 0) return;
            
            const maxGroup = Math.max(...data.map(d => d.count));
            const maxEl = document.getElementById('stat-max-group');
            if (maxEl) maxEl.textContent = maxGroup;

            const ctx = document.getElementById('group-stats-chart').getContext('2d');
            
            const labels = data.map(d => new Date(d.date).toLocaleDateString());
            const counts = data.map(d => d.count);
            
            groupChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: i18n.members,
                        data: counts,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#0a0a0f',
                        pointBorderColor: '#3b82f6',
                        pointHoverBackgroundColor: '#3b82f6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: i18n.members } },
                        x: { title: { display: true, text: i18n.time } }
                    }
                }
            });
        })
        .catch(err => console.error("Error loading group stats", err));

    // 3. Instance Stats Chart
    let instanceChart = null;
    let instanceData = [];
    let uniqueDates = []; // Hoisted for access

    const instanceCtx = document.getElementById('instance-stats-chart').getContext('2d');

    function getLogicalDateString(timestamp) {
        const d = new Date(new Date(timestamp).getTime() - (4 * 60 * 60 * 1000));
        return d.toISOString().split('T')[0];
    }

    function renderInstanceChart(selection) {
        if(instanceChart) {
            instanceChart.destroy();
        }
        
        let labels = [];
        let counts = [];

        if (selection === 'all' || selection === 'last4') {
            const last4Dates = uniqueDates.slice(0, 4);
            const timeMap = {};
            
            instanceData.forEach(d => {
                const dString = getLogicalDateString(d.date);
                if (selection === 'last4' && !last4Dates.includes(dString)) return;
                
                const dt = new Date(d.date);
                const utcHour = dt.getUTCHours();
                const utcMin = dt.getUTCMinutes();
                const key = `${utcHour.toString().padStart(2, '0')}:${utcMin.toString().padStart(2, '0')}`;
                
                if (!timeMap[key]) {
                    // Orden lógico: Si es madrugada (00 a 11), le sumamos 24h para que gráficamente vaya DESPUÉS de las 23:00
                    const sortVal = (utcHour < 12 ? utcHour + 24 : utcHour) * 60 + utcMin;
                    timeMap[key] = { sum: 0, count: 0, sortVal: sortVal };
                }
                timeMap[key].sum += d.count;
                timeMap[key].count += 1;
            });
            
            const sortedKeys = Object.keys(timeMap).sort((a, b) => timeMap[a].sortVal - timeMap[b].sortVal);
            
            labels = sortedKeys.map(k => {
                const [h, m] = k.split(':');
                const tmp = new Date();
                tmp.setUTCHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
                return tmp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            });
            counts = sortedKeys.map(k => Math.round(timeMap[k].sum / timeMap[k].count));
            
        } else {
            // Specific Date
            const filteredData = instanceData.filter(d => {
                return getLogicalDateString(d.date) === selection;
            });
            
            labels = filteredData.map(d => {
                const dt = new Date(d.date);
                return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            });
            counts = filteredData.map(d => d.count);
        }

        instanceChart = new Chart(instanceCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: i18n.members,
                    data: counts,
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderRadius: 4,
                    hoverBackgroundColor: '#818cf8'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: i18n.members } },
                    x: { title: { display: true, text: i18n.time } }
                }
            }
        });
    }

    fetch('/api/chillfish/stats/instance')
        .then(res => res.json())
        .then(data => {
            if(!data || data.length === 0) return;
            instanceData = data;
            
            const maxInstance = Math.max(...data.map(d => d.count));
            const maxInstEl = document.getElementById('stat-max-instance');
            if (maxInstEl) maxInstEl.textContent = maxInstance;

            const avgInstance = Math.round(data.reduce((acc, curr) => acc + curr.count, 0) / data.length);
            const avgInstEl = document.getElementById('stat-avg-instance');
            if (avgInstEl) avgInstEl.textContent = avgInstance;
            
            uniqueDates = [...new Set(data.map(d => getLogicalDateString(d.date)))];
            uniqueDates.sort((a, b) => new Date(b) - new Date(a));
            
            const latestDate = uniqueDates[0];

            const customDropdown = document.getElementById('custom-select-dropdown');
            const customBtn = document.getElementById('custom-select-btn');
            const customText = document.getElementById('custom-select-text');
            
            const latestMeetupText = customText.textContent.trim();

            if (customBtn && customDropdown) {
                customBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    customDropdown.classList.toggle('hidden');
                });

                document.addEventListener('click', (e) => {
                    const container = document.getElementById('custom-dropdown-container');
                    if(container && !container.contains(e.target)) {
                        customDropdown.classList.add('hidden');
                    }
                });

                function selectOption(val, textContent) {
                    customText.innerHTML = `<i class="fas fa-list"></i> ${textContent}`;
                    customDropdown.classList.add('hidden');
                    
                    if (val === 'latest') renderInstanceChart(latestDate);
                    else renderInstanceChart(val);
                }

                const createOption = (val, text, isSub = false) => {
                    const opt = document.createElement('div');
                    opt.className = `p-3 hover:bg-[#1f1f2e] cursor-pointer text-sm transition-colors text-white ${isSub ? 'pl-8 bg-[#0d1525]/40' : 'font-medium'}`;
                    opt.textContent = text;
                    opt.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectOption(val, text);
                    });
                    return opt;
                };

                // Quick options
                customDropdown.appendChild(createOption('latest', latestMeetupText));
                customDropdown.appendChild(createOption('last4', 'Last 4 Meetups (Avg)'));
                customDropdown.appendChild(createOption('all', 'All Meetups (Avg)'));
                
                const divider = document.createElement('div');
                divider.className = "h-px bg-neutral-800 my-1";
                customDropdown.appendChild(divider);

                // Group dates
                const optgroups = {};
                const docLang = document.documentElement.lang || 'en';

                uniqueDates.forEach(dateStr => {
                    const d = new Date(dateStr);
                    const formattedDate = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                    const monthYear = d.toLocaleDateString(docLang, { month: 'long', year: 'numeric' });
                    const capMonthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);

                    if (!optgroups[capMonthYear]) {
                        const groupHeader = document.createElement('div');
                        groupHeader.className = "flex items-center justify-between p-3 bg-[#12121a] cursor-pointer text-sm font-medium text-blue-400 hover:bg-[#1a1a2e] transition-colors border-y border-neutral-800/50";
                        groupHeader.innerHTML = `<span>${capMonthYear}</span><i class="fas fa-chevron-down text-xs transition-transform duration-300"></i>`;
                        
                        const groupContainer = document.createElement('div');
                        groupContainer.className = "hidden flex flex-col";
                        
                        groupHeader.addEventListener('click', (e) => {
                            e.stopPropagation();
                            groupContainer.classList.toggle('hidden');
                            const icon = groupHeader.querySelector('i');
                            icon.style.transform = groupContainer.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                        });

                        customDropdown.appendChild(groupHeader);
                        customDropdown.appendChild(groupContainer);
                        
                        optgroups[capMonthYear] = groupContainer;
                    }

                    const n = getMeetupNumberFromDate(dateStr);
                    let nStr = n.toString();
                    if (i18n.meetupOption.includes("Weekly Meetup")) {
                        const s = ["th", "st", "nd", "rd"];
                        const v = n % 100;
                        nStr = n + (s[(v - 20) % 10] || s[v] || s[0]);
                    }

                    const text = i18n.meetupOption.replace('{n}', nStr).replace('{date}', formattedDate);
                    optgroups[capMonthYear].appendChild(createOption(dateStr, text, true));
                });
            }

            renderInstanceChart(latestDate);
        })
        .catch(err => console.error("Error loading instance stats", err));
});
