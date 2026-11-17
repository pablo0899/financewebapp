/**
 * Gmail → Mis Finanzas
 *
 * Revisa cada 5 minutos los correos nuevos de los remitentes de SENDERS y los
 * manda completos (asunto + texto) a /api/ingest, donde caen en "Por confirmar".
 *
 * Instalación (script.google.com → Nuevo proyecto):
 *   1. Pega este archivo completo.
 *   2. ⚙️ Configuración del proyecto → Propiedades de la secuencia de comandos:
 *        INGEST_URL    = https://<tu-dominio>/api/ingest
 *        INGEST_TOKEN  = el token que generaste en /bandeja
 *   3. Elige la función `install` y dale ▶ Ejecutar. Acepta los permisos
 *      (Google avisa que la app "no está verificada": es tuya; Avanzado → Ir a…).
 *   Listo: corre sola. Para revisar errores: ⏰ Activadores / Ejecuciones.
 */

// Remitentes a leer: búsqueda de Gmail → nombre que se guarda como "app".
const SENDERS = {
  'from:(mercadopago.com OR mercadopago.com.mx)': 'Mercado Pago',
  // Agrega Plata cuando veas desde qué correo te escribe, ej.:
  // 'from:plata.com.mx': 'Plata',
};

const FIRST_RUN_LOOKBACK_DAYS = 2;
const MAX_BODY = 3500;

/** Crea el activador cada 5 minutos (una sola vez) y corre la primera revisión. */
function install() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('INGEST_URL') || !props.getProperty('INGEST_TOKEN')) {
    throw new Error('Falta INGEST_URL o INGEST_TOKEN en las propiedades del proyecto.');
  }
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'run')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('run').timeBased().everyMinutes(5).create();
  run();
}

function run() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('INGEST_URL');
  const token = props.getProperty('INGEST_TOKEN');
  const now = Date.now();
  const since = Number(props.getProperty('LAST_TS')) || now - FIRST_RUN_LOOKBACK_DAYS * 864e5;
  // Gmail filtra por segundos; un minuto de traslape por si un correo llega
  // con retraso. Los repetidos los ignora el servidor (por id de mensaje).
  const after = Math.floor((since - 60e3) / 1000);

  let sent = 0;
  for (const [query, app] of Object.entries(SENDERS)) {
    const threads = GmailApp.search(`${query} after:${after}`, 0, 50);
    for (const thread of threads) {
      for (const message of thread.getMessages()) {
        if (message.getDate().getTime() < since - 60e3) continue;
        send(url, token, app, message); // Si falla, lanza y no se avanza LAST_TS.
        sent++;
      }
    }
  }
  props.setProperty('LAST_TS', String(now));
  console.log(`Enviados: ${sent}`);
}

function send(url, token, app, message) {
  const body = message
    .getPlainBody()
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
    .slice(0, MAX_BODY);

  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${token}` },
    payload: JSON.stringify({
      source: 'email',
      app,
      title: message.getSubject(),
      text: body,
      received_at: message.getDate().toISOString(),
      id: `gmail:${message.getId()}`,
    }),
    muteHttpExceptions: true,
  });

  const code = res.getResponseCode();
  if (code === 401) throw new Error('Token inválido: genera uno nuevo en /bandeja y actualiza INGEST_TOKEN.');
  if (code >= 400) throw new Error(`Error ${code}: ${res.getContentText()}`);
}
