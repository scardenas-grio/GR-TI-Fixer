async function apiFetch(url, options = {}) {

  try {

    const headers = {
      ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();

  } catch (error) {

    console.error("API ERROR:", error);

    mostrarToast("Error de conexión", "error");

    return null;
  }
}