import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_main/legal")({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "NeXusTC - Aviso Legal",
      },
    ],
  }),
});

function RouteComponent() {
  return (
    <article className="prose dark:prose-invert px-4">
      <h1>Aviso Legal</h1>

      <p>
        Última actualización: <strong>[FECHA DE ACTUALIZACIÓN]</strong>
      </p>

      <h2>1. Naturaleza del contenido</h2>
      <p>
        Este sitio web contiene material de carácter sexual explícito destinado
        exclusivamente a personas adultas. El acceso está prohibido a menores de
        edad según la legislación aplicable en su jurisdicción.
      </p>

      <h2>2. Origen del contenido</h2>
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

      <h2>3. Exención de responsabilidad</h2>
      <p>
        No garantizamos la exactitud, legalidad o idoneidad del contenido
        publicado por terceros. El uso del sitio es bajo su propio riesgo. No
        nos hacemos responsables de daños o perjuicios derivados del acceso o
        uso del contenido.
      </p>

      <h2>4. Enlaces a terceros</h2>
      <p>
        Este sitio puede contener enlaces a páginas externas. No tenemos control
        sobre el contenido o las políticas de privacidad de dichos sitios y no
        asumimos responsabilidad alguna por ellos.
      </p>

      <h2>5. Política de Retiro de Contenido (DMCA)</h2>
      <p>
        Respetamos los derechos de propiedad intelectual y cumplimos con la{" "}
        <strong>Digital Millennium Copyright Act (DMCA)</strong> y leyes
        internacionales equivalentes. Si usted es el titular de derechos de
        autor o está autorizado para actuar en nombre de uno, y considera que
        algún contenido alojado o enlazado en este sitio infringe sus derechos,
        puede enviar una solicitud de retiro.
      </p>

      <h3>5.1. Información requerida para solicitudes DMCA</h3>
      <p>Su notificación debe incluir:</p>
      <ul>
        <li>
          Identificación clara del material protegido por derechos de autor que
          reclama ha sido infringido.
        </li>
        <li>
          La URL exacta o enlace donde se encuentra el material en este sitio.
        </li>
        <li>
          Su nombre completo y datos de contacto (correo electrónico válido).
        </li>
        <li>
          Una declaración bajo juramento de que la información proporcionada es
          veraz y que usted es el titular de los derechos o está autorizado para
          actuar en su nombre.
        </li>
        <li>Su firma física o electrónica.</li>
      </ul>

      <h3>5.2. Envío de solicitudes</h3>
      <p>
        Las solicitudes de retiro deben enviarse a:{" "}
        <strong>[CORREO ELECTRÓNICO PARA DMCA]</strong>
      </p>

      <h3>5.3. Procedimiento</h3>
      <p>
        Una vez recibida una notificación válida, revisaremos la solicitud y, si
        corresponde, eliminaremos o deshabilitaremos el acceso al material en
        cuestión en un plazo razonable. También podremos notificar al usuario
        que subió el contenido para que pueda presentar una contranotificación
        si lo considera oportuno.
      </p>

      <h2>6. Legislación aplicable</h2>
      <p>
        Este Aviso Legal se regirá por las leyes de{" "}
        <strong>[PAÍS O JURISDICCIÓN]</strong>. Cualquier disputa será resuelta
        en los tribunales competentes de <strong>[CIUDAD O REGIÓN]</strong>.
      </p>
    </article>
  );
}
