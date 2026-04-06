const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

async function handleResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error(payload.message || payload.error || "Request failed");
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function submitClaim(values) {
  const response = await fetch(`${API_BASE}/claims`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(values)
  });

  return handleResponse(response);
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE}/health`);
  return handleResponse(response);
}

function buildAuthHeader(credentials) {
  return `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
}

export async function fetchAdminDashboard(credentials) {
  const response = await fetch(`${API_BASE}/admin/dashboard`, {
    headers: {
      Authorization: buildAuthHeader(credentials)
    }
  });

  return handleResponse(response);
}

export async function pauseSystem(credentials) {
  const response = await fetch(`${API_BASE}/admin/pause`, {
    method: "POST",
    headers: {
      Authorization: buildAuthHeader(credentials)
    }
  });

  return handleResponse(response);
}

export async function resumeSystem(credentials) {
  const response = await fetch(`${API_BASE}/admin/resume`, {
    method: "POST",
    headers: {
      Authorization: buildAuthHeader(credentials)
    }
  });

  return handleResponse(response);
}

export async function downloadTamperReport(credentials) {
  const response = await fetch(`${API_BASE}/admin/report/download`, {
    headers: {
      Authorization: buildAuthHeader(credentials)
    }
  });

  if (!response.ok) {
    const payload = await response.json();
    const error = new Error(payload.message || payload.error || "Download failed");
    error.payload = payload;
    throw error;
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "civicshield-tamper-report.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function fetchRegistry(credentials) {
  const response = await fetch(`${API_BASE}/admin/registry`, {
    headers: {
      Authorization: buildAuthHeader(credentials)
    }
  });

  return handleResponse(response);
}
