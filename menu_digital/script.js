// ======================================================
// CONFIGURACIÓN INICIAL
// Coloca aquí tu número de WhatsApp con clave de país (ej. México: 521 + 10 dígitos)
// ======================================================
const NUMERO_WHATSAPP = "5215512345678"; 

// Arreglo global en memoria para guardar los elementos que el cliente agrega
let carrito = [];

// ======================================================
// 1. FUNCIÓN PARA AGREGAR PRODUCTOS AL CARRITO
// ======================================================
function agregarAlPedido(nombre, precio) {
    const itemExistente = carrito.find(item => item.nombre === nombre);
    
    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carrito.push({ nombre, precio, cantidad: 1 });
    }

    actualizarBarraCarrito();
    
    const cartBar = document.getElementById('cartBar');
    cartBar.style.transform = 'scale(1.02)';
    setTimeout(() => cartBar.style.transform = 'scale(1)', 150);
}

// ======================================================
// 2. ACTUALIZACIÓN VISUAL DEL CONTADOR Y SUMA TOTAL
// ======================================================
function actualizarBarraCarrito() {
    const totalCount = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const totalPrice = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    document.getElementById('cartCount').textContent = `${totalCount} ${totalCount === 1 ? 'producto' : 'productos'}`;
    document.getElementById('cartTotal').textContent = `$${totalPrice.toFixed(2)}`;
}

// ======================================================
// 3. GENERADOR DE MENSAJE Y ENVÍO A WHATSAPP
// ======================================================
function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        alert("¡Tu pedido está vacío! Haz clic en 'Pedir' en cualquier botana para agregarla.");
        return;
    }

    let mensaje = "Hola *La Engordadera* 🍿🌶️, me gustaría hacer el siguiente pedido:\n\n";
    
    let total = 0;
    carrito.forEach((item) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        mensaje += `• *${item.cantidad}x* ${item.nombre} - $${subtotal.toFixed(2)}\n`;
    });

    mensaje += `\n*Total Estimado:* $${total.toFixed(2)}\n`;
    mensaje += "\n📍 *Dirección de Entrega / Recolección:* (Escribe aquí tu dirección o si pasas a sucursal)";

    const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// ======================================================
// 4. LÓGICA DE NAVEGACIÓN Y AUTOSCROLL HORIZONTAL DEL MENÚ
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    const navWrapper = document.querySelector('.nav-scroll-wrapper');

    // Función auxiliar para centrar horizontalmente cualquier botón activo
    function centrarBotonActivo(btn) {
        if (!navWrapper || !btn) return;

        // Calcula el centro exacto del contenedor contenedor horizontal
        const wrapperWidth = navWrapper.clientWidth;
        const btnOffsetLeft = btn.offsetLeft;
        const btnWidth = btn.clientWidth;

        // Posición calculada para dejar el botón en medio del celular
        const targetScrollLeft = btnOffsetLeft - (wrapperWidth / 2) + (btnWidth / 2);

        // Mueve el scroll horizontal del menú de forma fluida
        navWrapper.scrollTo({
            left: targetScrollLeft,
            behavior: 'smooth'
        });
    }

    // Evento de clic en cada botón del menú
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const targetId = button.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }

            // Centra el botón al hacer clic
            centrarBotonActivo(button);
        });
    });

    // Detecta la sección visible al hacer scroll vertical y mueve la barra horizontalmente
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('.menu-section');

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 140;
            if (window.pageYOffset >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navButtons.forEach(btn => {
            if (btn.getAttribute('data-target') === current) {
                if (!btn.classList.contains('active')) {
                    navButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Desplaza la barra horizontalmente al cambiar de sección activa
                    centrarBotonActivo(btn);
                }
            }
        });
    });
});
