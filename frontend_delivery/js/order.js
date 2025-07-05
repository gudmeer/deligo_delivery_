// ========== FUNCIONES PARA LOCALSTORAGE ==========
function getCarrito() {
  return JSON.parse(localStorage.getItem('carrito')) || [];
}

function setCarrito(carrito) {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

function getTiendaId() {
  return localStorage.getItem('carrito_tiendaId');
}

// ========== FUNCIONES DE INTERFAZ ==========
function renderCarrito() {
  const carrito = getCarrito();
  const tbody = document.getElementById('pedido-items');
  const totalDisplay = document.getElementById('pedido-total');
  tbody.innerHTML = '';
  let total = 0;

  if (carrito.length === 0) {
    document.getElementById('form-pedido').style.display = 'none';
    tbody.innerHTML = `<tr><td colspan="6">Tu carrito está vacío. <a href="categories.html">Ir a tiendas</a></td></tr>`;
    totalDisplay.textContent = 'S/ 0.00';
    return;
  }

  carrito.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td><img src="${item.imagen || 'img/food/p1.jpg'}" alt="${item.nombre}" width="40"></td>
        <td>${item.nombre}</td>
        <td>S/ ${item.precio.toFixed(2)}</td>
        <td>
          <input type="number" min="1" value="${item.cantidad}" onchange="actualizarCantidad(${index}, this.value)">
        </td>
        <td>S/ ${subtotal.toFixed(2)}</td>
        <td><button onclick="eliminarItem(${index})">Eliminar</button></td>
      </tr>
    `;
  });

  totalDisplay.textContent = 'S/ ' + total.toFixed(2);
}

function actualizarCantidad(index, nuevaCantidad) {
  const carrito = getCarrito();
  nuevaCantidad = parseInt(nuevaCantidad, 10);
  if (isNaN(nuevaCantidad) || nuevaCantidad < 1) return;
  carrito[index].cantidad = nuevaCantidad;
  setCarrito(carrito);
  renderCarrito();
}

function eliminarItem(index) {
  const carrito = getCarrito();
  carrito.splice(index, 1);
  setCarrito(carrito);
  renderCarrito();
}

// ========== ENVÍO DE PEDIDO ==========
document.addEventListener('DOMContentLoaded', () => {
  renderCarrito();

  document.getElementById('form-pedido').addEventListener('submit', async function (e) {
    e.preventDefault();

    const carrito = getCarrito();
    const tiendaId = getTiendaId();
    const token = localStorage.getItem('token');

    if (!carrito.length || !tiendaId) {
      alert('El carrito está vacío o no hay tienda seleccionada.');
      return;
    }

    const productos = carrito.map(item => ({
      id: item.id,
      cantidad: item.cantidad,
      precio: item.precio
    }));

    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const direccion = document.getElementById('direccion').value.trim();

    try {
      const res = await fetch('http://localhost:5000/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? 'Bearer ' + token : ''
        },
        body: JSON.stringify({
          tiendaId,
          productos,
          nombre_cliente: nombre,
          telefono_cliente: telefono,
          correo_cliente: correo,
          direccion_entrega: direccion
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('Pedido creado correctamente');
        localStorage.removeItem('carrito');
        localStorage.removeItem('carrito_tiendaId');
        window.location.href = 'estado-pedido.html?pedidoId=' + data.pedidoId;
      } else {
        alert('Error al crear pedido: ' + (data.mensaje || data.error));
      }
    } catch (err) {
      console.error(err);
      alert('Error al conectar con el servidor');
    }
  });
});
