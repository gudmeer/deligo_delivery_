const token = localStorage.getItem('token');
const API_URL = 'http://localhost:3000/api/productos';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

// Mostrar productos del negocio
async function cargarProductos() {
  const res = await fetch(`${API_URL}`, { headers });
  const productos = await res.json();

  const tbody = document.querySelector('#tabla-productos tbody');
  tbody.innerHTML = '';

  productos.forEach(p => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${p.nombre}</td>
      <td>${p.precio}</td>
      <td>${p.stock !== undefined ? p.stock : '-'}</td>
      <td>
        <button onclick="eliminarProducto(${p.id})">Eliminar</button>
      </td>`;
    tbody.appendChild(fila);
  });
}

// Crear producto
document.getElementById('form-producto').addEventListener('submit', async e => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const descripcion = document.getElementById('descripcion').value;
  const precio = parseFloat(document.getElementById('precio').value);
  const stock = parseInt(document.getElementById('stock').value, 10);

  const res = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ nombre, descripcion, precio, stock })
  });

  if (res.ok) {
    alert('Producto creado');
    cargarProductos();
  } else {
    const err = await res.json();
    alert('Error: ' + (err.mensaje || err.error || 'Error desconocido'));
  }
});

// Eliminar producto
async function eliminarProducto(id) {
  if (!confirm('¿Seguro que deseas eliminar este producto?')) return;

  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers
  });

  if (res.ok) {
    alert('Producto eliminado');
    cargarProductos();
  } else {
    alert('Error al eliminar');
  }
}

cargarProductos();