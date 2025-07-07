const token = localStorage.getItem('token');
const socket = io('https://deligo-delivery-4qa2.onrender.com'); // ✅ Ruta corregida

socket.on('connect', () => {
  console.log('Conectado a Socket.io');
});

socket.on('pedido_actualizado', (data) => {
  console.log('Pedido actualizado:', data);
  cargarPedidos(); // función que recarga tabla de pedidos
});

// Funciones para cambiar estado
async function marcarEnCamino(pedidoId) {
  const res = await fetch(`https://deligo-delivery-4qa2.onrender.com/api/pedidos/${pedidoId}/en-camino`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  alert(data.mensaje);
  cargarPedidos();
}

async function marcarEntregado(pedidoId) {
  const res = await fetch(`https://deligo-delivery-4qa2.onrender.com/api/pedidos/${pedidoId}/entregar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  alert(data.mensaje);
  cargarPedidos();
}
