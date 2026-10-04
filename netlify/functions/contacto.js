exports.handler = async (event) => {

  // Solo permitimos POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Método no permitido"
      })
    };
  }

  try {

    const data = JSON.parse(event.body);

    const { name, email, message } = data;

    // Validaciones básicas
    if (!name || !email || !message) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Todos los campos son obligatorios."
        })
      };
    }

    // Validación simple del email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "El correo electrónico no es válido."
        })
      };
    }

    // API Key guardada en las variables de entorno de Netlify
    const brevoApiKey = process.env.BREVO_API_KEY;
console.log("BREVO_API_KEY configurada:", !!brevoApiKey);
console.log("BREVO_SENDER_EMAIL:", process.env.BREVO_SENDER_EMAIL);
console.log("CONTACT_EMAIL:", process.env.CONTACT_EMAIL);
    if (!brevoApiKey) {
      console.error("BREVO_API_KEY no configurada.");

      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Error de configuración del servidor."
        })
      };
    }

    // Enviar correo mediante Brevo
    const brevoResponse = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",

        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json"
        },

        body: JSON.stringify({

          sender: {
            name: "Dyno - Fan Page",
            email: process.env.BREVO_SENDER_EMAIL
          },

          to: [
            {
              email: process.env.CONTACT_EMAIL,
              name: "Dyno"
            }
          ],

          replyTo: {
            email: email,
            name: name
          },

          subject: `Nueva consulta desde Dyno - ${name}`,

          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">

              <h2>Nueva consulta desde Dyno</h2>

              <p>
                Recibiste una nueva consulta desde la Fan Page de Dyno.
              </p>

              <hr>

              <p>
                <strong>Nombre:</strong><br>
                ${escapeHtml(name)}
              </p>

              <p>
                <strong>Correo electrónico:</strong><br>
                ${escapeHtml(email)}
              </p>

              <p>
                <strong>Consulta:</strong>
              </p>

              <div style="
                background: #f5f5f5;
                padding: 15px;
                border-radius: 5px;
                white-space: pre-line;
              ">
                ${escapeHtml(message)}
              </div>

              <hr>

              <p style="font-size: 12px; color: #777;">
                Este mensaje fue enviado desde la Fan Page de Dyno.
              </p>

            </div>
          `
        })
      }
    );

    const brevoData = await brevoResponse.json();

    if (!brevoResponse.ok) {

      console.error("Error de Brevo:", brevoData);

      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Brevo no pudo enviar el correo."
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: true,
        message: "Consulta enviada correctamente."
      })
    };

  } catch (error) {

    console.error("Error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Error interno del servidor."
      })
    };
  }
};


// Evita que HTML enviado por el usuario se interprete como código
function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}