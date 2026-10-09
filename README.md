# PupFlow web

Landing page de PupFlow (https://pupflowplan.netlify.app). Netlify publica esta carpeta tal cual, sin build.

Se genera desde `plan-mascotas/landing/src/make_publish.py` en el proyecto; no editar `index.html` a mano.

## Pago (PayPal)

`checkout.html` muestra los botones de PayPal; las funciones en `netlify/functions/` crean y verifican el pago y reciben el formulario (`form.html`). Configuración en Netlify > Environment variables: `PAYPAL_ENV`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `ORDER_SECRET`, `MAKE_WEBHOOK_URL` (detalle en `netlify/lib/shared.mjs`).

Cada formulario se guarda en Netlify Blobs (`netlify/lib/orders.mjs`) con el `payment_status` leído de PayPal, y arranca el generador del plan (repositorio privado `pupflow-engine`, GitHub Actions). El generador solo arma el PDF si el pago dice `COMPLETED`. `engine-api` es la API privada del generador (clave `ENGINE_SECRET`) y `approve` son los botones del mail de revisión. Variables extra en Netlify: `ENGINE_SECRET`, `GITHUB_TOKEN`, `ENGINE_REPO`.

Las variables de Netlify se aplican en el próximo deploy: después de cambiar una, publicá de nuevo.
