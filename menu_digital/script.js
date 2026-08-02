
// NÚMERO DE WHATSAPP (Remplazar con tu número real de negocio)
const NUMERO_WHATSAPP = "5215512345678"; 

// ESTADO DEL PEDIDO (Carrito en memoria)
let carrito = [];

// FUNCIÓN PARA AÑADIR PRODUCTO
function agregarAlPedido(nombre, precio) {
    const itemExistente = carrito.find(item => item.nombre === nombre);
    
    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carrito.push({ nombre, precio, cantidad: 1 });
    }

    actualizarBarraCarrito();
    
    // Animación visual al agregar
    const cartBar = document.getElementById('cartBar');
    cartBar.style.transform = 'scale(1.02)';
    setTimeout(() => cartBar.style.transform = 'scale(1)', 150);
}

// ACTUALIZAR INTERFAZ DEL CARRITO FLOTANTE
function actualizarBarraCarrito() {
    const totalCount = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const totalPrice = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    document.getElementById('cartCount').textContent = `${totalCount} ${totalCount === 1 ? 'producto' : 'productos'}`;
    document.getElementById('cartTotal').textContent = `$${totalPrice.toFixed(2)}`;
}

// CONSTRUIR MENSAJE Y ABRIR WHATSAPP (Punto 4)
function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        alert("¡Tu pedido está vacío! Haz clic en 'Pedir' en cualquier botana para agregarla.");
        return;
    }

    let mensaje = "Hola *La Engordadera* 🍿🌶️, me gustaría hacer el siguiente pedido:\n\n";
    
    let total = 0;
    carrito.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        mensaje += `• *${item.cantidad}x* ${item.nombre} - $${subtotal.toFixed(2)}\n`;
    });

    mensaje += `\n*Total Estimado:* $${total.toFixed(2)}\n`;
    mensaje += "\n📍 *Dirección de Entrega / Recolección:* (Escribe aquí tu dirección o si pasas a sucursal)";

    // Codificar mensaje para URL
    const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// DESPLAZAMIENTO SUAVE Y MARCADOR DE BOTONES ACTIVOS (Punto 2 & 3)
document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover activo previo
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const targetId = button.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Detectar sección visible al hacer scroll
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('.menu-section');

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (pageYOffset >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-target') === current) {
                btn.classList.add('active');
            }
        });
    });
});
