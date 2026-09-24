from flask import Flask, jsonify, render_template
import psutil
import platform
import time
from datetime import timedelta

app = Flask(__name__)

# Store the system boot time
BOOT_TIME = psutil.boot_time()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/health")
def health():
    """
    Return current CPU, memory, disk and network information.
    """

    cpu = psutil.cpu_percent(interval=0.5)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    network = psutil.net_io_counters()

    return jsonify({
        "cpu": cpu,
        "memory": memory.percent,
        "memory_used": round(memory.used / (1024 ** 3), 2),
        "memory_total": round(memory.total / (1024 ** 3), 2),
        "disk": disk.percent,
        "disk_used": round(disk.used / (1024 ** 3), 2),
        "disk_total": round(disk.total / (1024 ** 3), 2),
        "bytes_sent": network.bytes_sent,
        "bytes_received": network.bytes_recv
    })


@app.route("/api/system")
def system_info():
    """
    Return general system information.
    """

    uptime_seconds = int(time.time() - BOOT_TIME)

    return jsonify({
        "hostname": platform.node(),
        "os": platform.system(),
        "os_version": platform.version(),
        "processor": platform.processor(),
        "cpu_cores": psutil.cpu_count(logical=True),
        "uptime": str(timedelta(seconds=uptime_seconds))
    })


@app.route("/api/processes")
def processes():
    """
    Return the top processes by CPU usage.
    """

    process_list = []

    for process in psutil.process_iter(
        ["pid", "name", "cpu_percent", "memory_percent"]
    ):
        try:
            info = process.info

            process_list.append({
                "pid": info["pid"],
                "name": info["name"] or "Unknown",
                "cpu": info["cpu_percent"] or 0,
                "memory": round(info["memory_percent"] or 0, 2)
            })

        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    process_list.sort(
        key=lambda process: process["cpu"],
        reverse=True
    )

    return jsonify(process_list[:10])


@app.route("/health")
def health_check():
    """
    Kubernetes/Docker health-check endpoint.
    """

    return jsonify({
        "status": "healthy"
    }), 200


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )