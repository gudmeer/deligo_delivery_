/**
 * Manejo de formularios de registro y login para el frontend de Delivery.
 * ► Añadido:
 *   1) cargarPedidoActivo()   -> mantiene pedido pendiente tras volver a iniciar sesión
 *   2) reconstruirCarrito()  -> opcional: repone carrito local a partir del pedido activo
 */

/* ------------------------------------------------------------------ */
/* 1.  UI: modo sign‑in / sign‑up                                      */
/* ------------------------------------------------------------------ */
const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container   = document.querySelector(".container");

sign_up_btn?.addEventListener("click", () => container?.classList.add("sign-up-mode"));
sign_in_btn?.addEventListener("click", () => container?.classList.remove("sign-up-mode"));

/* ✅ Cambia esto según tu entorno (Render en producción) */
const API_BASE_URL = "https://deligo-delivery-4qa2.onrender.com";

/* ------------------------------------------------------------------ */
/* 2.  Registro                                                       */
/* ------------------------------------------------------------------ */
document.querySelector(".sign-up-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const [nombre, email, password, rolSelect] = e.target.elements;
  const rol = rolSelect.value;

  if (![nombre.value.trim(), email.value.trim(), password.value, rol].every(Boolean))
    return alert("Completa todos los campos.");

  try {
    const res  = await fetch(`${API_BASE_URL}/api/usuarios/registrar`, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({
        nombre : nombre.value.trim(),
        email  : email.value.trim(),
        password: password.value,
        rol
      })
    });

    const data = await res.json();
    res.ok ? (alert(data.msg || "Registro exitoso"), sign_in_btn?.click())
           :  alert(data.msg || "Error en registro");
  } catch (err) {
    console.error(err);
    alert("Error de red o servidor al registrar.");
  }
});

/* ------------------------------------------------------------------ */
/* 3.  Login + restaurar pedido pendiente                             */
/* ------------------------------------------------------------------ */
document.querySelector(".sign-in-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const [emailInput, passInput] = e.target.elements;
  const email    = emailInput.value.trim();
  const password = passInput.value;

  if (!email || !password) return alert("Completa todos los campos.");

  try {
    const res  = await fetch(`${API_BASE_URL}/api/usuarios/login`, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) return alert(data.msg || "Error en login");

    /* 🔑  Guardar credenciales */
    localStorage.setItem("token", data.token);
    localStorage.setItem("rol",   data.rol);

    /* 🛒  Si es cliente, restaurar pedido activo */
    if (data.rol === "cliente") await cargarPedidoActivo();

    /* 🚀  Redirección por rol */
    const destinos = {
      cliente   : "index.html",
      repartidor: "repartidor/repartidor-home.html",
      negocio   : "negocio/negocio-panel.html",
      admin     : "admin/admin-dashboard.html"
    };
    window.location.href = destinos[data.rol] ?? "index.html";

  } catch (err) {
    console.error(err);
    alert("Error de red o servidor al iniciar sesión.");
  }
});

/* ------------------------------------------------------------------ */
/* 4.  Recuperar pedido pendiente tras login                          */
/* ------------------------------------------------------------------ */
async function cargarPedidoActivo() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/pedidos/cliente/activo`, {
      headers: { Authorization: "Bearer " + token }
    });
    if (!res.ok) return; // nada pendiente

    const pedido = await res.json();
    if (!pedido) return;

    /* ⚙️  Persistir ID para estado-pedido.html */
    localStorage.setItem("ultimo_pedido_id", pedido.id);

    /* (Opcional) Reconstruir carrito para order.html */
    reconstruirCarrito(pedido.detallePedidos);

  } catch (err) {
    console.error("Error al recuperar pedido activo:", err);
  }
}

/* ------------------------------------------------------------------ */
/* 5.  Opcional: poblar localStorage.carrito desde el pedido          */
/* ------------------------------------------------------------------ */
function reconstruirCarrito(detalles) {
  if (!Array.isArray(detalles)) return;
  const carrito = detalles.map(d => ({
    id      : d.productoId,
    nombre  : d.producto?.nombre ?? "",
    precio  : d.precio_unitario,
    cantidad: d.cantidad,
    stock   : 999         // ajustar si manejas stock real
  }));
  localStorage.setItem("carrito", JSON.stringify(carrito));
}
