const token = localStorage.getItem('token');
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Conectado a Socket.io');
});

socket.on('pedido_actualizado', (data) => {
  console.log('Pedido actualizado:', data);
  cargarPedidos(); // función que recarga tabla de pedidos
});

// Funciones para cambiar estado
async function marcarEnCamino(pedidoId) {
  const res = await fetch(`http://localhost:5000/api/pedidos/${pedidoId}/en-camino`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  alert(data.mensaje);
  cargarPedidos();
}

async function marcarEntregado(pedidoId) {
  const res = await fetch(`http://localhost:5000/api/pedidos/${pedidoId}/entregar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  alert(data.mensaje);
  cargarPedidos();
}
