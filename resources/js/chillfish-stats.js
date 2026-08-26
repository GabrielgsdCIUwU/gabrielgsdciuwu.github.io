/**
 * @fileoverview Statistics charts controller for Chill.
 * Handles local date conversion, peak KPI metrics, and Chart.js instance/group visualizations.
 */

document.addEventListener('DOMContentLoaded', () => {
    initTimezoneConverters();
    initMeetupBadgeCounter();
    initGroupStatsChart();
    initInstanceStatsChart();
});

/**
 * Converts UTC schedules to local time and local day name strings for display.
 */
function initTimezoneConverters() {
    const documentLang = document.documentElement.lang || 'en';

    function calculateNextUtcDate(targetUtcDay, utcTimeStr) {
        const [hours, minutes] = utcTimeStr.split(':');
        const targetDate = new Date();
        targetDate.setUTCHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        const currentUtcDay = targetDate.getUTCDay();
        let daysOffset = targetUtcDay - currentUtcDay;

        if (daysOffset < -3) daysOffset += 7;
        if (daysOffset > 3) daysOffset -= 7;

        targetDate.setUTCDate(targetDate.getUTCDate() + daysOffset);
        return targetDate;
    }

    try {
        document.querySelectorAll('.local-time').forEach((element) => {
            const utcTime = element.getAttribute('data-utc-time') || element.getAttribute('data-utc');
            const utcDay = element.getAttribute('data-utc-day');

            if (utcTime) {
                let computedDate;
                if (utcDay !== null) {
                    computedDate = calculateNextUtcDate(parseInt(utcDay, 10), utcTime);
                } else {
                    const [hours, minutes] = utcTime.split(':');
                    computedDate = new Date();
                    computedDate.setUTCHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                }
                element.textContent = computedDate.toLocaleTimeString(documentLang, { hour: '2-digit', minute: '2-digit' });
            }
        });

        document.querySelectorAll('.local-day').forEach((element) => {
            const utcDay = element.getAttribute('data-utc-day');
            const utcTime = element.getAttribute('data-utc-time');

            if (utcDay !== null && utcTime) {
                const computedDate = calculateNextUtcDate(parseInt(utcDay, 10), utcTime);
                let localDayString = computedDate.toLocaleDateString(documentLang, { weekday: 'long' });

                if (documentLang === 'en') {
                    localDayString = localDayString.charAt(0).toUpperCase() + localDayString.slice(1);
                }
                element.textContent = localDayString;
            }
        });
    } catch (error) {
        console.error('Error converting timezone dates:', error);
    }
}

/**
 * Calculates current Meetup iteration based on start date anchor and updates badge template text.
 */
function initMeetupBadgeCounter() {
    const badgeElement = document.getElementById('nth-meetup-badge');
    if (!badgeElement) return;

    const startDateAnchor = new Date(Date.UTC(2026, 0, 31, 23, 0, 0));
    const now = new Date();
    const msInWeek = 7 * 24 * 60 * 60 * 1000;
    const elapsedWeeks = Math.floor((now.getTime() - startDateAnchor.getTime()) / msInWeek);
    const currentMeetupNumber = Math.max(1, elapsedWeeks + 1);

    const badgeTemplate = badgeElement.getAttribute('data-template');
    if (badgeTemplate) {
        badgeElement.textContent = badgeTemplate.replace('{n}', currentMeetupNumber);
    }
}

/**
 * Fetches and renders group membership growth line chart.
 */
function initGroupStatsChart() {
    const chartCanvas = document.getElementById('group-stats-chart');
    if (!chartCanvas) return;

    Chart.defaults.color = '#a3a3a3';
    Chart.defaults.borderColor = '#1f1f2e';
    Chart.defaults.font.family = "'Nunito Sans', sans-serif";

    const i18n = window.chillfishStatsi18n || { members: 'Members', time: 'Time / Date' };

    fetch('/api/chillfish/stats/group')
        .then((response) => response.json())
        .then((data) => {
            if (!Array.isArray(data) || data.length === 0) return;

            const peakGroupCount = Math.max(...data.map((item) => item.count));
            const peakElement = document.getElementById('stat-max-group');
            if (peakElement) peakElement.textContent = peakGroupCount;

            const chartContext = chartCanvas.getContext('2d');
            const dateLabels = data.map((item) => new Date(item.date).toLocaleDateString());
            const memberCounts = data.map((item) => item.count);

            new Chart(chartContext, {
                type: 'line',
                data: {
                    labels: dateLabels,
                    datasets: [{
                        label: i18n.members,
                        data: memberCounts,
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
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: i18n.members } },
                        x: { 
                            title: { display: true, text: i18n.time },
                            ticks: { maxTicksLimit: 8 }
                        }
                    }
                }
            });
        })
        .catch((error) => console.error('Error loading group stats:', error));
}

/**
 * Fetches and renders instance attendance bar chart with interactive meetup selection.
 */
function initInstanceStatsChart() {
    const chartCanvas = document.getElementById('instance-stats-chart');
    if (!chartCanvas) return;

    const chartContext = chartCanvas.getContext('2d');
    let instanceChart = null;
    let rawInstanceData = [];
    let uniqueMeetups = [];

    const i18n = window.chillfishStatsi18n || {
        members: 'Members',
        time: 'Time / Date',
        meetupOption: 'Meetup {n} ({date})',
        last4Option: 'Last 4 Meetups (Avg)',
        allOption: 'All Meetups (Avg)'
    };

    function renderInstanceChart(selectedFilter) {
        if (instanceChart) {
            instanceChart.destroy();
        }

        let timeLabels = [];
        let datasetList = [];

        if (selectedFilter === 'all' || selectedFilter === 'last4') {
            const last4List = uniqueMeetups.slice(0, 4);
            const timeMap = {};

            rawInstanceData.forEach((item) => {
                if (selectedFilter === 'last4' && !last4List.includes(item.meetup)) return;

                const dateObj = new Date(item.date);
                const utcHour = dateObj.getUTCHours();
                const utcMinute = dateObj.getUTCMinutes();
                const timeKey = `${utcHour.toString().padStart(2, '0')}:${utcMinute.toString().padStart(2, '0')}`;

                if (!timeMap[timeKey]) {
                    const sortOrderValue = (utcHour < 12 ? utcHour + 24 : utcHour) * 60 + utcMinute;
                    timeMap[timeKey] = { sum: 0, count: 0, sortOrderValue };
                }
                timeMap[timeKey].sum += item.count;
                timeMap[timeKey].count += 1;
            });

            const sortedKeys = Object.keys(timeMap).sort((a, b) => timeMap[a].sortOrderValue - timeMap[b].sortOrderValue);

            timeLabels = sortedKeys.map((key) => {
                const [h, m] = key.split(':');
                const tempDate = new Date();
                tempDate.setUTCHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
                return tempDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            });

            const averageCounts = sortedKeys.map((key) => Math.round(timeMap[key].sum / timeMap[key].count));

            datasetList.push({
                label: i18n.members,
                data: averageCounts,
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderRadius: 4,
                hoverBackgroundColor: '#818cf8'
            });
        } else {
            const filteredData = rawInstanceData.filter((item) => String(item.meetup) === String(selectedFilter));

            timeLabels = filteredData.map((item) => {
                const dateObj = new Date(item.date);
                return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            });

            const uniqueSessions = [...new Set(filteredData.map((item) => item.session || 0))];
            const sessionColors = [
                { bg: 'rgba(99, 102, 241, 0.8)', hover: '#818cf8', label: 'EU Session' },
                { bg: 'rgba(236, 72, 153, 0.8)', hover: '#f472b6', label: 'US Session' },
                { bg: 'rgba(52, 211, 153, 0.8)', hover: '#6ee7b7', label: 'Session 3' }
            ];

            if (uniqueSessions.length > 1) {
                uniqueSessions.forEach((sessionIndex, colorIndex) => {
                    const sessionData = timeLabels.map((_, index) => {
                        const item = filteredData[index];
                        return (item.session || 0) === sessionIndex ? item.count : null;
                    });

                    datasetList.push({
                        label: sessionColors[colorIndex]?.label || `Session ${sessionIndex + 1}`,
                        data: sessionData,
                        backgroundColor: sessionColors[colorIndex]?.bg || 'rgba(99, 102, 241, 0.8)',
                        borderRadius: 4,
                        hoverBackgroundColor: sessionColors[colorIndex]?.hover || '#818cf8'
                    });
                });
            } else {
                const counts = filteredData.map((item) => item.count);
                datasetList.push({
                    label: i18n.members,
                    data: counts,
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderRadius: 4,
                    hoverBackgroundColor: '#818cf8'
                });
            }
        }

        instanceChart = new Chart(chartContext, {
            type: 'bar',
            data: { labels: timeLabels, datasets: datasetList },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: datasetList.length > 1, labels: { color: '#a3a3a3' } }
                },
                scales: {
                    y: { stacked: true, beginAtZero: true, title: { display: true, text: i18n.members } },
                    x: { 
                        stacked: true, 
                        title: { display: true, text: i18n.time },
                        ticks: { maxTicksLimit: 10 }
                    }
                }
            }
        });
    }

    fetch('/api/chillfish/stats/instance')
        .then((response) => response.json())
        .then((data) => {
            if (!Array.isArray(data) || data.length === 0) return;
            rawInstanceData = data;

            const peakInstanceCount = Math.max(...data.map((item) => item.count));
            const peakInstanceEl = document.getElementById('stat-max-instance');
            if (peakInstanceEl) peakInstanceEl.textContent = peakInstanceCount;

            const averageAttendance = Math.round(data.reduce((sum, current) => sum + current.count, 0) / data.length);
            const averageInstanceEl = document.getElementById('stat-avg-instance');
            if (averageInstanceEl) averageInstanceEl.textContent = averageAttendance;

            uniqueMeetups = [...new Set(data.map((item) => item.meetup))].sort((a, b) => Number(b) - Number(a));
            const latestMeetupNumber = uniqueMeetups[0];

            const customDropdown = document.getElementById('custom-select-dropdown');
            const customBtn = document.getElementById('custom-select-btn');
            const customText = document.getElementById('custom-select-text');

            if (customBtn && customDropdown && customText) {
                const defaultTextValue = customText.textContent.trim();

                customBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const isHidden = customDropdown.classList.toggle('hidden');
                    customBtn.setAttribute('aria-expanded', String(!isHidden));
                });

                document.addEventListener('click', (e) => {
                    const container = document.getElementById('custom-dropdown-container');
                    if (container && !container.contains(e.target)) {
                        customDropdown.classList.add('hidden');
                        customBtn.setAttribute('aria-expanded', 'false');
                    }
                });

                function selectDropdownOption(val, textLabel) {
                    customText.innerHTML = `<i class="fas fa-list"></i> ${textLabel}`;
                    customDropdown.classList.add('hidden');
                    customBtn.setAttribute('aria-expanded', 'false');

                    if (val === 'latest') renderInstanceChart(latestMeetupNumber);
                    else renderInstanceChart(val);
                }

                const createOptionElement = (val, textLabel, isSubOption = false) => {
                    const optionDiv = document.createElement('div');
                    optionDiv.setAttribute('role', 'option');
                    optionDiv.className = `p-3 hover:bg-[#1f1f2e] cursor-pointer text-sm transition-colors text-white ${isSubOption ? 'pl-8 bg-[#0d1525]/40' : 'font-medium'}`;
                    optionDiv.textContent = textLabel;
                    optionDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectDropdownOption(val, textLabel);
                    });
                    return optionDiv;
                };

                customDropdown.appendChild(createOptionElement('latest', defaultTextValue));
                customDropdown.appendChild(createOptionElement('last4', i18n.last4Option));
                customDropdown.appendChild(createOptionElement('all', i18n.allOption));

                const divider = document.createElement('div');
                divider.className = 'h-px bg-neutral-800 my-1';
                customDropdown.appendChild(divider);

                const optionGroups = {};
                const documentLang = document.documentElement.lang || 'en';

                uniqueMeetups.forEach((meetupNum) => {
                    const targetMeetupData = rawInstanceData.find((item) => item.meetup === meetupNum);
                    if (!targetMeetupData) return;

                    const dateObj = new Date(targetMeetupData.date);
                    const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
                    const monthYearString = dateObj.toLocaleDateString(documentLang, { month: 'long', year: 'numeric' });
                    const capitalizedMonthYear = monthYearString.charAt(0).toUpperCase() + monthYearString.slice(1);

                    if (!optionGroups[capitalizedMonthYear]) {
                        const groupHeader = document.createElement('div');
                        groupHeader.className = 'flex items-center justify-between p-3 bg-[#12121a] cursor-pointer text-sm font-medium text-blue-400 hover:bg-[#1a1a2e] transition-colors border-y border-neutral-800/50';
                        groupHeader.innerHTML = `<span>${capitalizedMonthYear}</span><i class="fas fa-chevron-down text-xs transition-transform duration-300"></i>`;

                        const groupContainer = document.createElement('div');
                        groupContainer.className = 'hidden flex flex-col';

                        groupHeader.addEventListener('click', (e) => {
                            e.stopPropagation();
                            groupContainer.classList.toggle('hidden');
                            const icon = groupHeader.querySelector('i');
                            if (icon) {
                                icon.style.transform = groupContainer.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                            }
                        });

                        customDropdown.appendChild(groupHeader);
                        customDropdown.appendChild(groupContainer);
                        optionGroups[capitalizedMonthYear] = groupContainer;
                    }

                    let ordinalString = meetupNum.toString();
                    if (i18n.meetupOption.includes('Weekly Meetup')) {
                        const suffixes = ['th', 'st', 'nd', 'rd'];
                        const remainder = meetupNum % 100;
                        ordinalString = meetupNum + (suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]);
                    }

                    const optionText = i18n.meetupOption.replace('{n}', ordinalString).replace('{date}', formattedDate);
                    optionGroups[capitalizedMonthYear].appendChild(createOptionElement(meetupNum, optionText, true));
                });
            }

            renderInstanceChart(latestMeetupNumber);
        })
        .catch((error) => console.error('Error loading instance stats:', error));
}
