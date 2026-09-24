let previousSent = 0;
let previousReceived = 0;
let previousTime = Date.now();


function getStatus(value) {

    if (value < 70) {
        return "healthy";
    }

    if (value < 90) {
        return "warning";
    }

    return "critical";
}


function updateMetric(
    value,
    valueId,
    barId,
    statusId,
    messageId
) {

    const status = getStatus(value);

    document.getElementById(valueId)
        .innerText = value.toFixed(1);

    document.getElementById(barId)
        .style.width = value + "%";

    const statusElement =
        document.getElementById(statusId);

    statusElement.innerText = "●";

    const message =
        document.getElementById(messageId);


    if (status === "healthy") {

        statusElement.style.color = "#22c55e";

        message.innerText = "Normal";

    } else if (status === "warning") {

        statusElement.style.color = "#f59e0b";

        message.innerText = "Warning";

    } else {

        statusElement.style.color = "#ef4444";

        message.innerText = "Critical";

    }
}


async function updateHealth() {

    try {

        const response =
            await fetch("/api/health");

        const data =
            await response.json();


        updateMetric(
            data.cpu,
            "cpu",
            "cpu-bar",
            "cpu-status",
            "cpu-message"
        );


        updateMetric(
            data.memory,
            "memory",
            "memory-bar",
            "memory-status",
            "memory-message"
        );


        updateMetric(
            data.disk,
            "disk",
            "disk-bar",
            "disk-status",
            "disk-message"
        );


        updateNetwork(data);


        updateOverallStatus(
            data.cpu,
            data.memory,
            data.disk
        );


    } catch (error) {

        console.error(
            "Health API error:",
            error
        );

        setOffline();

    }
}


function updateNetwork(data) {

    const currentTime = Date.now();

    const elapsed =
        (currentTime - previousTime) / 1000;


    if (previousSent !== 0) {

        const uploadRate =
            (data.bytes_sent - previousSent)
            / elapsed;

        const downloadRate =
            (data.bytes_received - previousReceived)
            / elapsed;


        document.getElementById("upload")
            .innerText =
            formatBytes(uploadRate) + "/s";


        document.getElementById("download")
            .innerText =
            formatBytes(downloadRate) + "/s";
    }


    previousSent = data.bytes_sent;
    previousReceived = data.bytes_received;
    previousTime = currentTime;
}


function formatBytes(bytes) {

    if (bytes < 1024) {
        return bytes.toFixed(0) + " B";
    }

    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + " KB";
    }

    return (
        bytes / (1024 * 1024)
    ).toFixed(1) + " MB";
}


async function updateSystemInfo() {

    try {

        const response =
            await fetch("/api/system");

        const data =
            await response.json();


        document.getElementById("hostname")
            .innerText = data.hostname;

        document.getElementById("os")
            .innerText =
            data.os + " " + data.os_version;

        document.getElementById("cores")
            .innerText = data.cpu_cores;

        document.getElementById("processor")
            .innerText =
            data.processor || "Unknown";

        document.getElementById("uptime")
            .innerText = data.uptime;


    } catch (error) {

        console.error(
            "System API error:",
            error
        );
    }
}


async function updateProcesses() {

    try {

        const response =
            await fetch("/api/processes");

        const processes =
            await response.json();


        const table =
            document.getElementById(
                "process-table"
            );

        table.innerHTML = "";


        processes.forEach(process => {

            const row =
                document.createElement("tr");


            row.innerHTML = `
                <td>${process.pid}</td>
                <td>${process.name}</td>
                <td>${process.cpu.toFixed(1)}%</td>
                <td>${process.memory.toFixed(2)}%</td>
            `;


            table.appendChild(row);

        });


    } catch (error) {

        console.error(
            "Process API error:",
            error
        );
    }
}


function updateOverallStatus(
    cpu,
    memory,
    disk
) {

    const statusElement =
        document.getElementById(
            "overall-status"
        );


    const values = [
        cpu,
        memory,
        disk
    ];


    const maximum =
        Math.max(...values);


    if (maximum >= 90) {

        statusElement.innerText =
            "● CRITICAL";

        statusElement.className =
            "status critical";

    } else if (maximum >= 70) {

        statusElement.innerText =
            "● WARNING";

        statusElement.className =
            "status warning";

    } else {

        statusElement.innerText =
            "● HEALTHY";

        statusElement.className =
            "status healthy";
    }
}


function setOffline() {

    const statusElement =
        document.getElementById(
            "overall-status"
        );

    statusElement.innerText =
        "● OFFLINE";

    statusElement.className =
        "status critical";
}


function updateLastUpdated() {

    const now = new Date();

    document.getElementById(
        "last-update"
    ).innerText =
        now.toLocaleTimeString();
}


async function updateDashboard() {

    await updateHealth();

    await updateSystemInfo();

    await updateProcesses();

    updateLastUpdated();
}


/* Initial load */

updateDashboard();


/* Update every 3 seconds */

setInterval(
    updateDashboard,
    3000
);