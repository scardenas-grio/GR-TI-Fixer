async function apiFetch(url, options = {}) {
  try {
    const headers = {
      ...(options.headers || {}),
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // ==========================================
    // LEER RESPUESTA
    // ==========================================
    const contentType = response.headers.get("content-type") || "";

    let data = null;
    let texto = "";

    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }
    } else {
      try {
        texto = await response.text();
      } catch (e) {
        texto = "";
      }
    }

    // ==========================================
    // ERROR HTTP
    // ==========================================
    if (!response.ok) {
      console.error("API ERROR:", response.status, data || texto);

      const mensaje =
        data?.msg ||
        data?.message ||
        texto ||
        `Error del servidor (HTTP ${response.status})`;

      mostrarToast(mensaje, "error");

      return null;
    }

    // ==========================================
    // RESPUESTA CORRECTA
    // ==========================================
    return data;
  } catch (error) {
    console.error("API ERROR:", error);

    mostrarToast("Error de conexión", "error");

    return null;
  }
}
