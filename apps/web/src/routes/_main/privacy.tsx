import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_main/privacy")({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "NeXusTC - Política de Privacidad",
      },
    ],
  }),
});

function RouteComponent() {
  return (
    <article className="prose dark:prose-invert px-4">
      <h1>Política de Privacidad</h1>

      <p>
        Última actualización: <strong>[FECHA DE ACTUALIZACIÓN]</strong>
      </p>

      <p>
        En <strong>[NOMBRE DE LA EMPRESA O SITIO WEB]</strong>, nos
        comprometemos a proteger la privacidad de nuestros usuarios. Esta
        Política de Privacidad explica cómo recopilamos, usamos y protegemos su
        información personal cuando utiliza nuestro sitio web{" "}
        <strong>[URL DEL SITIO]</strong>.
      </p>

      <h2>1. Información que recopilamos</h2>
      <p>Podemos recopilar la siguiente información:</p>
      <ul>
        <li>
          Datos personales como nombre, correo electrónico, número de teléfono.
        </li>
        <li>
          Información de uso del sitio (páginas visitadas, tiempo de navegación,
          etc.).
        </li>
        <li>Dirección IP y datos de geolocalización aproximada.</li>
      </ul>

      <h2>2. Uso de la información</h2>
      <p>Utilizamos la información recopilada para:</p>
      <ul>
        <li>Proporcionar y mejorar nuestros servicios.</li>
        <li>Personalizar la experiencia del usuario.</li>
        <li>Enviar comunicaciones relacionadas con el servicio.</li>
        <li>Cumplir con obligaciones legales.</li>
      </ul>

      <h2>3. Cookies y tecnologías similares</h2>
      <p>
        Utilizamos cookies para mejorar la experiencia del usuario. Puede
        configurar su navegador para rechazar cookies, pero esto podría afectar
        el funcionamiento del sitio.
      </p>

      <h2>4. Compartir información con terceros</h2>
      <p>
        No vendemos ni alquilamos su información personal. Podemos compartir
        datos con:
      </p>
      <ul>
        <li>Proveedores de servicios que nos ayudan a operar el sitio.</li>
        <li>Autoridades legales cuando sea requerido por ley.</li>
      </ul>

      <h2>5. Seguridad de la información</h2>
      <p>
        Implementamos medidas de seguridad para proteger su información, aunque
        ningún sistema es 100% seguro.
      </p>

      <h2>6. Derechos del usuario</h2>
      <p>
        Usted tiene derecho a acceder, rectificar o eliminar sus datos
        personales, así como a oponerse a su tratamiento. Para ejercer estos
        derechos, contáctenos en{" "}
        <strong>[CORREO ELECTRÓNICO DE CONTACTO]</strong>.
      </p>

      <h2>7. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta Política de Privacidad en cualquier momento. Los
        cambios serán efectivos desde su publicación en{" "}
        <strong>[URL DEL SITIO]</strong>.
      </p>

      <h2>8. Contacto</h2>
      <p>
        Si tiene preguntas sobre esta política, puede escribirnos a{" "}
        <strong>[CORREO ELECTRÓNICO DE CONTACTO]</strong> o llamarnos al{" "}
        <strong>[NÚMERO DE TELÉFONO]</strong>.
      </p>
    </article>
  );
}
