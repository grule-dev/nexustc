import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_main/terms")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <article className="prose dark:prose-invert px-4">
      <h1>Términos y Condiciones</h1>

      <p>
        Última actualización: <strong>[FECHA DE ACTUALIZACIÓN]</strong>
      </p>

      <h2>1. Aceptación de los términos</h2>
      <p>
        El acceso y uso de este sitio web <strong>[NOMBRE DEL SITIO]</strong>{" "}
        implica la aceptación plena y sin reservas de los presentes Términos y
        Condiciones. Si no está de acuerdo con alguno de estos términos, le
        recomendamos no utilizar nuestros servicios.
      </p>

      <h2>2. Advertencia de contenido adulto</h2>
      <p>
        Este sitio contiene material sexualmente explícito destinado
        exclusivamente a personas mayores de edad según la legislación aplicable
        en su jurisdicción. Al acceder, usted declara ser mayor de edad y que el
        acceso a este contenido no infringe ninguna ley local. Si es menor de
        edad o si este tipo de material le resulta ofensivo, debe abandonar el
        sitio inmediatamente.
      </p>

      <h2>3. Origen del contenido</h2>
      <p>
        Este sitio <strong>no actúa como productor primario</strong> de ningún
        contenido visual sexualmente explícito que aparezca en él. Todo el
        material disponible ha sido obtenido de sitios web de terceros y se
        encuentra disponible públicamente en Internet, o ha sido subido por
        usuarios que afirman tener los derechos correspondientes.
      </p>
      <p>
        El sitio actúa únicamente como un agregador o redistribuidor de
        contenido, y no mantiene control editorial sobre el material
        proporcionado por terceros.
      </p>

      <h2>4. Uso permitido</h2>
      <p>
        El usuario se compromete a utilizar el sitio y los servicios únicamente
        para fines legales y de acuerdo con estos términos. Queda prohibido:
      </p>
      <ul>
        <li>
          Publicar o compartir contenido ilegal o que infrinja derechos de
          terceros.
        </li>
        <li>Intentar acceder sin autorización a sistemas o datos del sitio.</li>
        <li>
          Utilizar el sitio para enviar spam, malware o realizar actividades
          ilícitas.
        </li>
      </ul>

      <h2>5. Propiedad intelectual</h2>
      <p>
        El contenido disponible en este sitio ha sido obtenido de fuentes de
        terceros y se encuentra disponible públicamente en Internet o ha sido
        subido por usuarios que afirman tener los derechos correspondientes. No
        reclamamos propiedad sobre dicho contenido, salvo el material propio del
        sitio (logotipos, diseño, código, etc.).
      </p>
      <p>
        Si considera que algún contenido infringe sus derechos de autor,
        consulte nuestra{" "}
        <Link to="/legal">Política de Retiro de Contenido (DMCA)</Link>.
      </p>

      <h2>6. Limitación de responsabilidad</h2>
      <p>
        No garantizamos la exactitud, legalidad o idoneidad del contenido
        publicado por terceros. El uso del sitio es bajo su propio riesgo. No
        nos hacemos responsables de daños o perjuicios derivados del acceso o
        uso del contenido, ni de la disponibilidad o funcionamiento del sitio.
      </p>

      <h2>7. Enlaces a terceros</h2>
      <p>
        Este sitio puede contener enlaces a páginas externas. No tenemos control
        sobre el contenido o las políticas de privacidad de dichos sitios y no
        asumimos responsabilidad alguna por ellos.
      </p>

      <h2>8. Política de Retiro de Contenido (DMCA)</h2>
      <p>
        Respetamos los derechos de propiedad intelectual y cumplimos con la{" "}
        <strong>Digital Millennium Copyright Act (DMCA)</strong> y leyes
        internacionales equivalentes. Si usted es el titular de derechos de
        autor o está autorizado para actuar en nombre de uno, y considera que
        algún contenido alojado o enlazado en este sitio infringe sus derechos,
        puede enviar una solicitud de retiro siguiendo las instrucciones
        detalladas en nuestra{" "}
        <Link to="/legal">Política de Retiro de Contenido</Link>.
      </p>

      <h2>9. Modificaciones</h2>
      <p>
        Nos reservamos el derecho de modificar estos términos en cualquier
        momento. Los cambios serán efectivos desde su publicación en{" "}
        <strong>[URL DEL SITIO]</strong>.
      </p>

      <h2>10. Legislación aplicable</h2>
      <p>
        Estos términos se regirán por las leyes de{" "}
        <strong>[PAÍS O JURISDICCIÓN]</strong>. Cualquier disputa será resuelta
        en los tribunales competentes de <strong>[CIUDAD O REGIÓN]</strong>.
      </p>
    </article>
  );
}
