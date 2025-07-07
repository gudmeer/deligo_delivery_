const API_URL = `${window.location.origin}/api/productos`;
const token = localStorage.getItem('token');

if (!token) {
  alert('Debes iniciar sesión');
  window.location.href = '/login.html';
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

// Mostrar productos del negocio
async function cargarProductos() {
  try {
    const res = await fetch(API_URL, { headers });

    if (!res.ok) throw new Error('Error al obtener productos');

    const productos = await res.json();

    const tbody = document.querySelector('#tabla-productos tbody');
    tbody.innerHTML = '';

    if (!Array.isArray(productos) || productos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">No hay productos registrados</td></tr>';
      return;
    }

    productos.forEach(p => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${p.nombre}</td>
        <td>S/ ${Number(p.precio).toFixed(2)}</td>
        <td>${p.stock ?? '-'}</td>
        <td>
          <button onclick="eliminarProducto(${p.id})" style="color: red;">Eliminar</button>
        </td>
      `;
      tbody.appendChild(fila);
    });
  } catch (err) {
    console.error('Error al cargar productos:', err);
    alert('Error al cargar productos');
  }
}

// Crear producto
document.getElementById('form-producto').addEventListener('submit', async e => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();
  const precio = parseFloat(document.getElementById('precio').value);
  const stock = parseInt(document.getElementById('stock').value, 10);

  if (!nombre || isNaN(precio) || isNaN(stock)) {
    alert('Completa todos los campos correctamente');
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ nombre, descripcion, precio, stock })
    });

    const result = await res.json();

    if (res.ok) {
      alert('Producto creado exitosamente');
      document.getElementById('form-producto').reset();
      cargarProductos();
    } else {
      alert('Error: ' + (result.mensaje || result.error || 'Error desconocido'));
    }
  } catch (err) {
    console.error('Error al crear producto:', err);
    alert('Error al conectar con el servidor');
  }
});

// Eliminar producto
async function eliminarProducto(id) {
  if (!confirm('¿Seguro que deseas eliminar este producto?')) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers
    });

    const result = await res.json();

    if (res.ok) {
      alert('Producto eliminado correctamente');
      cargarProductos();
    } else {
      alert(result.mensaje || 'Error al eliminar producto');
    }
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    alert('Error de conexión');
  }
}

// Inicializar
cargarProductos();
