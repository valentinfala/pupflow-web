# PupFlow web

Landing page de PupFlow (https://pupflowplan.netlify.app). Netlify publica esta carpeta tal cual, sin build.

Se genera desde `plan-mascotas/landing/src/make_publish.py` en el proyecto; no editar `index.html` a mano.

## Pago (PayPal)

`checkout.html` muestra los botones de PayPal; las funciones en `netlify/functions/` crean y verifican el pago y reciben el formulario (`form.html`). Configuración en Netlify > Environment variables: `PAYPAL_ENV`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `ORDER_SECRET`, `MAKE_WEBHOOK_URL` (detalle en `netlify/lib/shared.mjs`).

Cada formulario que llega a la automatización trae `payment_status` leído de PayPal en ese momento. Solo se arma el PDF si dice `COMPLETED`; si dice `PENDING`, hay que aceptar el pago en PayPal primero.
