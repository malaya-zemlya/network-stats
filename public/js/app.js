// Network Diagnostics Data Collection
let diagnosticsData = {};

// Load external resource with cache buster for timing diagnostics
async function loadTestResource(url, resourceType = 'resource') {
    const cacheBuster = Date.now();
    const separator = url.includes('?') ? '&' : '?';
    const resourceUrl = `${url}${separator}cb=${cacheBuster}`;

    try {
        const response = await fetch(resourceUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // We don't need to read the body, just making the request is enough
        console.log(`External ${resourceType} fetched for timing diagnostics: ${url}`);
        return resourceUrl;
    } catch (err) {
        console.warn(`External ${resourceType} fetch failed:`, err);
        throw err;
    }
}

// Utility Functions
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatTime(ms) {
    if (ms < 1000) return Math.round(ms) + ' ms';
    return (ms / 1000).toFixed(2) + ' s';
}

function getFileName(url) {
    try {
        const pathname = new URL(url).pathname;
        return pathname.split('/').pop() || pathname;
    } catch {
        return url;
    }
}

// Collect Browser and Client Information
function collectBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';

    // Detect Browser
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    return {
        browser,
        os,
        userAgent: ua,
        screen: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        pixelRatio: window.devicePixelRatio,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine
    };
}

// Collect Network Connection Information
function collectNetworkInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (connection) {
        return {
            type: connection.type || 'unknown',
            effectiveType: connection.effectiveType || 'unknown',
            downlink: connection.downlink || 0,
            downlinkMax: connection.downlinkMax || 0,
            rtt: connection.rtt || 0,
            saveData: connection.saveData || false
        };
    }

    return {
        type: 'not available',
        effectiveType: 'not available',
        downlink: 0,
        rtt: 0,
        saveData: false
    };
}

// Collect Navigation Timing
function collectNavigationTiming() {
    const timing = performance.timing;
    const navigation = performance.getEntriesByType('navigation')[0];

    if (!timing) return null;

    const dnsTime = timing.domainLookupEnd - timing.domainLookupStart;
    const tcpTime = timing.connectEnd - timing.connectStart;
    const tlsTime = timing.secureConnectionStart > 0 ? timing.connectEnd - timing.secureConnectionStart : 0;
    const ttfb = timing.responseStart - timing.requestStart;
    const domLoad = timing.domContentLoadedEventEnd - timing.navigationStart;
    const pageLoad = timing.loadEventEnd - timing.navigationStart;

    return {
        dnsTime,
        tcpTime,
        tlsTime,
        ttfb,
        domLoad,
        pageLoad,
        redirectTime: timing.redirectEnd - timing.redirectStart,
        responseTime: timing.responseEnd - timing.responseStart,
        domProcessing: timing.domComplete - timing.domLoading,
        navigationStart: timing.navigationStart,
        protocol: navigation ? navigation.nextHopProtocol : 'unknown'
    };
}

// Collect Resource Loading Information
function collectResourceTiming() {
    const resources = performance.getEntriesByType('resource');

    return resources.map(resource => ({
        name: getFileName(resource.name),
        fullUrl: resource.name,
        type: resource.initiatorType,
        size: resource.transferSize || 0,
        encodedSize: resource.encodedBodySize || 0,
        decodedSize: resource.decodedBodySize || 0,
        duration: resource.duration,
        startTime: resource.startTime,
        protocol: resource.nextHopProtocol || 'unknown',
        cached: resource.transferSize === 0 && resource.decodedBodySize > 0
    }));
}

// Collect All Diagnostics Data
async function collectAllDiagnostics() {
    // Load external resources with cache buster for cross-origin timing diagnostics
    try {
        await Promise.all([
            loadTestResource('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf', 'font'),
            loadTestResource('https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js', 'script')
        ]);
    } catch (err) {
        console.warn('Some external resources failed to load:', err);
    }

    // Wait a bit more to ensure timing data is available
    await new Promise(resolve => setTimeout(resolve, 200));

    diagnosticsData = {
        timestamp: new Date().toISOString(),
        browser: collectBrowserInfo(),
        network: collectNetworkInfo(),
        navigation: collectNavigationTiming(),
        resources: collectResourceTiming(),
        performance: {
            memory: performance.memory ? {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            } : null
        },
        url: window.location.href
    };

    return diagnosticsData;
}

// Display Data in Dashboard
function displayDashboard(data) {
    // Browser Info
    document.getElementById('browser').textContent = `${data.browser.browser} (${data.browser.language})`;
    document.getElementById('os').textContent = data.browser.os;
    document.getElementById('screen').textContent = data.browser.screen;
    document.getElementById('viewport').textContent = data.browser.viewport;

    // Network Info
    document.getElementById('connectionType').textContent = data.network.type;
    document.getElementById('effectiveType').textContent = data.network.effectiveType;
    document.getElementById('downlink').textContent = data.network.downlink > 0 ? data.network.downlink.toFixed(2) : 'N/A';
    document.getElementById('rtt').textContent = data.network.rtt > 0 ? data.network.rtt : 'N/A';

    // Navigation Timing
    if (data.navigation) {
        document.getElementById('dnsTime').textContent = formatTime(data.navigation.dnsTime);
        document.getElementById('tcpTime').textContent = formatTime(data.navigation.tcpTime);
        document.getElementById('tlsTime').textContent = data.navigation.tlsTime > 0 ? formatTime(data.navigation.tlsTime) : 'N/A';
        document.getElementById('ttfb').textContent = formatTime(data.navigation.ttfb);
        document.getElementById('domLoad').textContent = formatTime(data.navigation.domLoad);
        document.getElementById('pageLoad').textContent = formatTime(data.navigation.pageLoad);
    }

    // Resources Table
    const resourcesTable = document.getElementById('resourcesTable');
    if (data.resources && data.resources.length > 0) {
        resourcesTable.innerHTML = data.resources.map(resource => `
            <tr>
                <td title="${resource.fullUrl}">${resource.name}</td>
                <td>${resource.type}</td>
                <td>${formatBytes(resource.size)} ${resource.cached ? '(cached)' : ''}</td>
                <td>${formatTime(resource.duration)}</td>
                <td>${resource.protocol}</td>
            </tr>
        `).join('');
    } else {
        resourcesTable.innerHTML = '<tr><td colspan="5" style="text-align: center;">No resources found</td></tr>';
    }

    // Show dashboard, hide loading
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';
}

// Submit Diagnostics to Server
async function submitDiagnostics() {
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    statusMessage.style.display = 'none';

    try {
        const response = await fetch('/api/diagnostics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(diagnosticsData)
        });

        const result = await response.json();

        if (response.ok) {
            // Show success message
            statusMessage.className = 'status-message success';
            statusMessage.textContent = 'Diagnostics submitted successfully!';
            statusMessage.style.display = 'block';

            // Show reference ID
            document.getElementById('referenceIdValue').textContent = result.referenceId;
            document.getElementById('referenceIdSection').style.display = 'block';

            // Hide submit button
            submitBtn.style.display = 'none';
        } else {
            throw new Error(result.error || 'Failed to submit diagnostics');
        }
    } catch (error) {
        statusMessage.className = 'status-message error';
        statusMessage.textContent = `Error: ${error.message}`;
        statusMessage.style.display = 'block';

        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Diagnostics to Support';
    }
}

// Collapsible Sections
function setupCollapsible() {
    const resourcesHeader = document.getElementById('resourcesHeader');
    const resourcesContent = document.getElementById('resourcesContent');

    resourcesHeader.addEventListener('click', () => {
        resourcesHeader.classList.toggle('collapsed');
        resourcesContent.classList.toggle('collapsed');
    });
}

// Initialize on Page Load
window.addEventListener('load', async () => {
    // Wait a bit for all resources to load
    setTimeout(async () => {
        const data = await collectAllDiagnostics();
        displayDashboard(data);
        setupCollapsible();

        // Setup submit button
        document.getElementById('submitBtn').addEventListener('click', submitDiagnostics);

        console.log('Network diagnostics collected:', data);
    }, 500);
});

// Initialize
console.log('Network diagnostics dashboard initialized');
