// ======================================================
// 8. BOLETO DIGITAL CON MONITOREO NO DESTRUCTIVO
// ======================================================
async function mostrarBoletoTurno(pedido, esRestaurado = false) {
    whatsappEnviadoConfirmado = false;
    const badgeType = document.getElementById('ticketBadgeType');
    const paymentAlert = document.getElementById('ticketPaymentAlert');
    const onlinePaymentCard = document.getElementById('onlinePaymentContainer');
    const loyaltyBanner = document.getElementById('ticketLoyaltyBanner');
    const btnClose = document.getElementById('btnTicketModalClose');
    const countdownEl = document.getElementById('kioskCountdown');
    const btnFinishText = document.getElementById('btnFinishText');
    const btnWaText = document.getElementById('btnWaText');

    document.getElementById('ticketNumberDisplay').textContent = pedido.turno;
    document.getElementById('ticketClientName').textContent = `Cliente: ${pedido.cliente}`;

    if (pedido.puntos && pedido.puntos.puntosGanados > 0) {
        loyaltyBanner.style.display = 'block';
        if (pedido.puntos.premioDesbloqueado) {
            loyaltyBanner.innerHTML = `
                <div class="reward-unlocked-card">
                    <h4>🎁 ¡RECOMPENSA DE PUNTOS DESBLOQUEADA!</h4>
                    <p>¡Felicidades! Has alcanzado la meta. <strong>Reclama en mostrador: ${PREMIO_LEALTAD}</strong>.</p>
                </div>
            `;
        } else {
            loyaltyBanner.innerHTML = `
                <div style="background:#FEF9C3; border:1px solid #FDE047; border-radius:10px; padding:8px; font-size:0.8rem; color:#854D0E;">
                    ⭐ <strong>¡Sumaste +${pedido.puntos.puntosGanados} puntos!</strong> Llevas <strong>${pedido.puntos.puntosTotales} de ${PUNTOS_META_PREMIO} puntos</strong> en este cuatrimestre.
                </div>
            `;
        }
    } else {
        loyaltyBanner.style.display = 'none';
    }

    if (pedido.tipo === 'tienda') {
        badgeType.textContent = '🏪 CONSUMO EN TIENDA';
        badgeType.className = 'ticket-badge badge-tienda';
        paymentAlert.className = 'ticket-payment-alert alert-tienda';
        paymentAlert.innerHTML = `
            <strong>💵 Pago en Mostrador:</strong><br>
            Pagarás <strong>$${pedido.total.toFixed(2)}</strong> al momento de recibir tus botanas preparadas.
        `;
        if (onlinePaymentCard) onlinePaymentCard.style.display = 'none';
        if (btnClose) btnClose.style.display = 'block';
        if (btnWaText) btnWaText.textContent = 'Enviar Pedido a WhatsApp';
        if (btnFinishText) btnFinishText.textContent = 'Terminar y Hacer Nuevo Pedido';
        
        iniciarCuentaRegresivaKiosko(20);
    } else {
        if (temporizadorKiosko) clearInterval(temporizadorKiosko);
        if (countdownEl) countdownEl.textContent = '';
        if (btnClose) btnClose.style.display = 'none';

        badgeType.textContent = '🛍️ PARA RECOGER';
        badgeType.className = 'ticket-badge badge-recoger';
        paymentAlert.className = 'ticket-payment-alert alert-recoger';
        paymentAlert.innerHTML = `
            <strong>⏳ Pedido en Cola de Validación:</strong><br>
            Realiza tu pago en Mercado Pago para asegurar tu orden. En cuanto cocina la valide iniciará tu preparación.
        `;
        
        if (onlinePaymentCard) {
            onlinePaymentCard.style.display = 'block';
            document.getElementById('ticketGiantAmountDisplay').textContent = `$${pedido.total.toFixed(2)}`;
            document.getElementById('ticketMpTotal').textContent = `$${pedido.total.toFixed(2)}`;
            document.getElementById('bankTitularText').textContent = BANCO_TITULAR;
            document.getElementById('clabeNumberText').textContent = CLABE_BANCARIA;
            document.getElementById('transferConceptoTurno').textContent = pedido.turno;
        }

        if (btnWaText) btnWaText.textContent = '📲 Paso Final: Enviar Comprobante por WhatsApp';
        if (btnFinishText) btnFinishText.textContent = 'Ya envié mi comprobante (Cerrar)';

        solicitarLinkDinamicoMercadoPago(pedido);
        iniciarMonitoreoEstadoBoleto(pedido.turno);
    }

    document.getElementById('ticketModal').classList.add('active');
}

function iniciarMonitoreoEstadoBoleto(turno) {
    if (temporizadorMonitoreoCliente) clearInterval(temporizadorMonitoreoCliente);

    temporizadorMonitoreoCliente = setInterval(async () => {
        if (!WEB_APP_URL || WEB_APP_URL.includes("TU_SCRIPT_ID")) return;
        try {
            const res = await fetch(`${WEB_APP_URL}?action=consultar_estado_pedido&turno=${encodeURIComponent(turno)}`);
            const pedido = await res.json();
            const paymentAlert = document.getElementById('ticketPaymentAlert');
            const onlinePaymentCard = document.getElementById('onlinePaymentContainer');

            if (pedido && pedido.estado && paymentAlert) {
                const est = String(pedido.estado).toLowerCase().trim();
                
                if (est === 'preparando') {
                    paymentAlert.className = 'ticket-payment-alert alert-tienda';
                    paymentAlert.innerHTML = `<strong>🔥 ¡Orden Aceptada!</strong><br>Tus botanas ya están en preparación en cocina.`;
                } else if (est === 'listo') {
                    paymentAlert.className = 'ticket-payment-alert alert-tienda';
                    paymentAlert.innerHTML = `<strong>🎉 ¡Tu pedido está LISTO!</strong><br>Pasa al mostrador a recoger tus botanas.`;
                } else if (est === 'rechazado' || est === 'cancelado') {
                    paymentAlert.className = 'ticket-payment-alert';
                    paymentAlert.style.background = '#FEE2E2';
                    paymentAlert.style.borderColor = '#F87171';
                    paymentAlert.style.color = '#991B1B';
                    paymentAlert.innerHTML = `<strong>❌ Pedido No Disponible:</strong><br>Lo sentimos, no pudimos tomar tu orden. Si realizaste tu pago en línea, tu dinero ha sido devuelto a tu cuenta.`;
                    if (onlinePaymentCard) onlinePaymentCard.style.display = 'none';
                    clearInterval(temporizadorMonitoreoCliente);
                }
            }
        } catch (e) {}
    }, 5000);
}
