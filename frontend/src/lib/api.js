// src/lib/api.js
const BASE = "/api";

function getToken() { return localStorage.getItem("sh_token"); }

async function req(method, path, body) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  // Some endpoints or failures may return empty/non-JSON bodies.
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || text || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data ?? {};
}

export const api = {
  // Auth
  register:       (d) => req("POST", "/auth/register", d),
  login:          (d) => req("POST", "/auth/login", d),
  tokenCheck:     (k) => req("GET",  `/auth/token-check/${k}`),
  fundTestnet:    (k) => req("POST", "/auth/fund-testnet", { publicKey: k }),

  // Patients
  listPatients:   ()   => req("GET",  "/patients"),
  createPatient:  (d)  => req("POST", "/patients", d),
  getPatient:     (id) => req("GET",  `/patients/${id}`),
  addVitals:      (id, d) => req("POST", `/patients/${id}/vitals`, d),
  addVisit:       (id, d) => req("POST", `/patients/${id}/visits`, d),
  grantAccess:    (id, d) => req("POST", `/patients/${id}/grant`, d),
  getAudit:       (id)    => req("GET",  `/patients/${id}/audit`),
  deletePatient:  (id)    => req("DELETE", `/patients/${id}`),
};
