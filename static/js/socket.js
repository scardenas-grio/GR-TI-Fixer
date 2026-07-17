const socket = io();

// =========================
// NOTIFICACIONES
// =========================

socket.on("actualizar_dashboard", async () => {
  if (typeof actualizarTablaActivos === "function") {
    await actualizarTablaActivos();
  }
});

socket.on("nueva_notificacion", (data) => {
  console.log("Nueva notificación", data);

  // toast visual
  mostrarToast(data.mensaje, "success");

  // actualizar badge
  actualizarBadgeNotificaciones();

  // refrescar panel
  cargarNotificaciones();
});

// =========================
// USUARIOS ONLINE
// =========================

socket.on("usuarios_online", (usuarios) => {
  console.log("Usuarios online:", usuarios);

  document
    .querySelectorAll("[data-online-user]")

    .forEach((el) => {
      const username = el.dataset.onlineUser;

      if (usuarios.includes(username)) {
        el.classList.add("online");

        el.classList.remove("offline");
      } else {
        el.classList.add("offline");

        el.classList.remove("online");
      }
    });
});

// =========================
// STREAM REALTIME
// =========================

socket.on("nuevo_movimiento", (data) => {

  console.log("STREAM:", data);

  const chartFechas = Chart.getChart("graficaFechas");

  if (!chartFechas) {
    return;
  }

  if (chartFechas.data.labels.length > 20) {

    chartFechas.data.labels.shift();

    chartFechas.data.datasets[0].data.shift();
  }

  const ultimaFecha =
    chartFechas.data.labels[
      chartFechas.data.labels.length - 1
    ];

  const valor =
    data.tipo === "resta"
      ? -data.puntos
      : data.puntos;

  if (ultimaFecha === data.fecha) {

    chartFechas.data.datasets[0].data[
      chartFechas.data.datasets[0].data.length - 1
    ] += valor;

  } else {

    chartFechas.data.labels.push(data.fecha);

    chartFechas.data.datasets[0].data.push(valor);
  }

  chartFechas.update("active");

});

// =========================
// ACTIVITY FEED LIVE
// =========================

socket.on("activity_feed", (data) => {
  const feed = document.getElementById("activityFeed");

  if (!feed) return;

  const vacio =
  lista.querySelector(
    ".notif-empty"
  );

  if (vacio) {
    vacio.remove();
  }

const li =
  document.createElement("li");

  li.classList.add("feed-item");

li.innerHTML = `

  <div class="feed-header">

    <div class="feed-avatar">
      <i class="fa-solid fa-bolt"></i>
    </div>

    <div>

      <div class="feed-msg">
        ${data.mensaje}
      </div>

      <div class="feed-time">
        ${data.hora}
      </div>

    </div>

  </div>
`;

  feed.prepend(li);

  // máximo 20 items
  while (feed.children.length > 20) {
    feed.removeChild(feed.lastChild);
  }
});

// =========================
// KPI REALTIME
// =========================

socket.on(
  "kpi_update",
  (data) => {

    const kpiPuntos =
      document.getElementById(
        "kpiPuntos"
      );

    const kpiMovimientos =
      document.getElementById(
        "kpiMovimientos"
      );

    if (kpiPuntos) {
      kpiPuntos.innerText =
        data.puntos;
    }

    if (kpiMovimientos) {
      kpiMovimientos.innerText =
        data.movimientos;
    }
});