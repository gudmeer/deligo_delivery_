$(function () {
  // 🔹 Cambiar clase del navbar al hacer scroll
  $(window).scroll(function () {
    if ($(this).scrollTop() < 50) {
      $("nav").removeClass("site-top-nav");
      $("#back-to-top").fadeOut();
    } else {
      $("nav").addClass("site-top-nav");
      $("#back-to-top").fadeIn();
    }
  });

  // Mostrar / ocultar carrito al hacer clic
  $(document).on("click", "#shopping-cart", function (e) {
    e.preventDefault();
    $("#cart-content").toggle("blind", "", 500);
  });

  // Botón "Back to top"
  $(document).on("click", "#back-to-top", function (e) {
    e.preventDefault();
    $("html, body").animate({ scrollTop: 0 }, 1000);
  });

  // Eliminar item del carrito
  $(document).on("click", ".btn-delete", function (e) {
    e.preventDefault();
    $(this).closest("tr").remove();
    updateTotal();
  });

  // Actualizar total del carrito
  function updateTotal() {
    let total = 0;
    $("#cart-content tbody tr").each(function () {
      const rowTotal = parseFloat($(this).find("td:nth-child(5)").text().replace("S/", "").trim());
      if (!isNaN(rowTotal)) {
        total += rowTotal;
      }
    });
    $("#cart-total").text("S/ " + total.toFixed(2));
  }

  // Inicializa el total al cargar
  updateTotal();
});
