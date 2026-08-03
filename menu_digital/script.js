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
    // Revisa si el producto ya existe en la lista
    const itemExistente = carrito.find(item => item.nombre === nombre);
    
    if (itemExistente) {
        // Si ya existe, incrementa su cantidad
        itemExistente.cantidad += 1;
    } else {
        // Si no existe, crea un nuevo objeto en el arreglo
        carrito.push({ nombre, precio, cantidad: 1 });
    }

    // Refresca los datos visibles en la barra inferior
    actualizarBarraCarrito();
    
    // Efecto visual de rebote ligero en la barra al presionar el botón "Pedir"
    const cartBar = document.getElementById('cartBar');
    cartBar.style.transform = 'scale(1.02)';
    setTimeout(() => cartBar.style.transform = 'scale(1)', 150);
}

// ======================================================
// 2. ACTUALIZACIÓN VISUAL DEL CONTADOR Y SUMA TOTAL
// ======================================================
function actualizarBarraCarrito() {
    // Suma total de unidades acumuladas
    const totalCount = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    // Suma total del monto en pesos
    const totalPrice = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    // Muestra en pantalla la cantidad de productos y el costo acumulado
    document.getElementById('cartCount').textContent = `${totalCount} ${totalCount === 1 ? 'producto' : 'productos'}`;
    document.getElementById('cartTotal').textContent = `$${totalPrice.toFixed(2)}`;
}

// ======================================================
// 3. GENERADOR DE MENSAJE Y ENVÍO A WHATSAPP
// ======================================================
function enviarPedidoWhatsApp() {
    // Validación por si la lista está vacía
    if (carrito.length === 0) {
        alert("¡Tu pedido está vacío! Haz clic en 'Pedir' en cualquier botana para agregarla.");
        return;
    }

    // Encabezado del mensaje
    let mensaje = "Hola *La Engordadera* 🍿🌶️, me gustaría hacer el siguiente pedido:\n\n";
    
    let total = 0;
    // Recorre el arreglo creando un texto con viñetas para cada item
    carrito.forEach((item) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        mensaje += `• *${item.cantidad}x* ${item.nombre} - $${subtotal.toFixed(2)}\n`;
    });

    // Cierre del texto con total y campo de dirección
    mensaje += `\n*Total Estimado:* $${total.toFixed(2)}\n`;
    mensaje += "\n📍 *Dirección de Entrega / Recolección:* (Escribe aquí tu dirección o si pasas a sucursal)";

    // Convierte el texto estructurado a formato seguro de URL y abre el enlace directo de WhatsApp
    const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// ======================================================
// 4. LÓGICA DE NAVEGACIÓN SUAVE Y AUTOSCROLL DEL MENÚ
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');

    // Asigna eventos de clic a cada botón de la barra superior
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remueve la clase 'active' del botón anterior
            navButtons.forEach(btn => btn.classList.remove('active'));
            // Activa el botón presionado
            button.classList.add('active');

            // Busca la sección correspondiente mediante su atributo data-target
            const targetId = button.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);

            // Desplaza suavemente la pantalla hasta la sección indicada
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Detecta qué sección está visible al desplazar la pantalla (scroll) y mueve el menú de botones
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('.menu-section');

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120; // Offset ideal para activación anticipada
            if (pageYOffset >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        // Marca como activo el botón cuya sección está en pantalla y desplaza la barra horizontalmente
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-target') === current) {
                btn.classList.add('active');
                
                // Centra automáticamente el botón activo dentro de la barra deslizable
                btn.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center',
                    block: 'nearest'
                });
            }
        });
    });
});
