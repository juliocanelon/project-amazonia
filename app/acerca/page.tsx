/**
 * app/acerca/page.tsx — ruta `/acerca`: página de transparencia de alcance.
 *
 * QUÉ HACE: explica en detalle qué está implementado y qué no, la "frontera de
 * honestidad" (real / pre-calculado / simulado), cómo funciona la capa RAG, la
 * aclaración sobre el mercurio (proxies, no medición directa) y el listado
 * completo de fuentes del corpus (científicas y de prensa).
 *
 * ROL EN EL SISTEMA: es el cumplimiento explícito del requisito académico de
 * declarar el alcance real del prototipo. Complementa al banner permanente con
 * la versión extensa y verificable.
 *
 * DECISIÓN DE ARQUITECTURA: las listas bibliográficas se mantienen como datos en
 * este archivo (no se consultan a la BD) para que la página sea estática y
 * autocontenida; deben mantenerse en sincronía con `corpus/`.
 *
 * PARA EL INFORME: esta página es, en sí misma, evidencia del principio de
 * transparencia; su contenido puede citarse casi textualmente al describir el
 * alcance y las limitaciones del sistema.
 */
import EtiquetaOrigen from "@/components/EtiquetaOrigen";

export const metadata = {
  title: "Acerca del prototipo — Centinela Orinoco",
};

/**
 * Datos bibliográficos completos del corpus. Fuentes científicas (arbitradas) y
 * fuentes de prensa / informes no arbitrados, declaradas por separado.
 * Las marcadas con `verificada: false` no figuran en docs/referencias.json: sus
 * datos se tomaron directamente del propio documento durante el procesamiento.
 */
const FUENTES_CIENTIFICAS: {
  autores: string;
  anio: number;
  titulo: string;
  revista: string;
  doi: string | null;
  indexacion: string;
  verificada: boolean;
}[] = [
  { autores: "Camalan, S., Cui, K., Pauca, V. P., Alqahtani, S., Silman, M., Chan, R., Plemmons, R. J., Dethier, E. N., Fernandez, L. E., & Lutz, D. A.", anio: 2022, titulo: "Change detection of Amazonian alluvial gold mining using deep learning and Sentinel-2 imagery", revista: "Remote Sensing, 14(7), 1746", doi: "10.3390/rs14071746", indexacion: "Scopus, Web of Science", verificada: true },
  { autores: "Becerra, M., Villa, L., Nicolau, A. P., Herndon, K. E., Novoa, S., Martín-Arias, V., Dyson, K., Walker, K., Tenneson, K., & Saah, D.", anio: 2024, titulo: "Creating near real-time alerts of illegal gold mining in the Peruvian Amazon using Synthetic Aperture Radar", revista: "Environmental Research Communications, 6(12), 125022", doi: "10.1088/2515-7620/ad937e", indexacion: "Scopus, Web of Science (ESCI)", verificada: true },
  { autores: "Gallwey, J., Robiati, C., Coggan, J., Vogt, D., & Eyre, M.", anio: 2020, titulo: "A Sentinel-2 based multispectral convolutional neural network for detecting artisanal small-scale mining in Ghana: Applying deep learning to shallow mining", revista: "Remote Sensing of Environment, 248, 111970", doi: "10.1016/j.rse.2020.111970", indexacion: "Scopus, Web of Science (SCIE) — Q1", verificada: true },
  { autores: "Fonseca, A., Marshall, M. T., & Salama, S.", anio: 2024, titulo: "Enhanced detection of artisanal small-scale mining with spectral and textural segmentation of Landsat time series", revista: "Remote Sensing, 16(10), 1749", doi: "10.3390/rs16101749", indexacion: "Scopus, Web of Science (SCIE)", verificada: true },
  { autores: "Lobo, F. de L., Souza-Filho, P. W. M., Novo, E. M. L. de M., Carlos, F. M., & Barbosa, C. C. F.", anio: 2018, titulo: "Mapping mining areas in the Brazilian Amazon using MSI/Sentinel-2 imagery (2017)", revista: "Remote Sensing, 10(8), 1178", doi: "10.3390/rs10081178", indexacion: "Scopus, Web of Science (SCIE)", verificada: true },
  { autores: "Pacheco-Angulo, C., Plata-Rocha, W., Serrano, J., Vilanova, E., Monjardin-Armenta, S., González, A., & Camargo, C.", anio: 2021, titulo: "A low-cost and robust Landsat-based approach to study forest degradation and carbon emissions from selective logging in the Venezuelan Amazon", revista: "Remote Sensing, 13(8), 1435", doi: "10.3390/rs13081435", indexacion: "Scopus, Web of Science (SCIE)", verificada: true },
  { autores: "García-Sánchez, A., Contreras, F., Adams, M., & Santos-Francés, F.", anio: 2008, titulo: "Mercury contamination of surface water and fish in a gold mining region (Cuyuni river basin, Venezuela)", revista: "International Journal of Environment and Pollution, 33(2/3), 260-274", doi: "10.1504/IJEP.2008.019398", indexacion: "Scopus", verificada: true },
  { autores: "Ficili, I., Giacobbe, M., Tricomi, G., & Puliafito, A.", anio: 2025, titulo: "From sensors to data intelligence: Leveraging IoT, cloud, and edge computing with AI", revista: "Sensors, 25(6), 1763", doi: "10.3390/s25061763", indexacion: "Scopus, Web of Science (SCIE)", verificada: true },
  { autores: "Carrasquero-Durán, A., & Adams, M.", anio: 2003, titulo: "Fraccionamiento de mercurio en suelos de áreas contaminadas de El Callao, estado Bolívar-Venezuela", revista: "Agronomía Tropical, 53(3), Maracay", doi: null, indexacion: "SciELO Venezuela", verificada: false },
  { autores: "García-Sánchez, A., Contreras, F., Adams, M., & Santos, F.", anio: 2006, titulo: "Atmospheric mercury emissions from polluted gold mining areas (Venezuela)", revista: "Environmental Geochemistry and Health, 28, 529-540", doi: "10.1007/s10653-006-9049-x", indexacion: "Springer (Scopus/Web of Science)", verificada: false },
  { autores: "Garcia-Sanchez, A., Contreras, F., Adams, M., & Santos, F.", anio: 2006, titulo: "Airborne total gaseous mercury and exposure in a Venezuelan mining area", revista: "International Journal of Environmental Health Research, 16(5), 361-373", doi: "10.1080/09603120600869315", indexacion: "Taylor & Francis (Scopus/Web of Science)", verificada: false },
  { autores: "Álvarez Fermín, L. A., & Rojas, L. A.", anio: 2009, titulo: "Contenido de mercurio total en peces de consumo habitual en los asentamientos indígenas El Plomo y El Casabe - Estado Bolívar", revista: "Universidad, Ciencia y Tecnología, 13(51), Puerto Ordaz", doi: null, indexacion: "SciELO Venezuela", verificada: false },
  { autores: "Shrestha, K. P., & Ruiz de Quilarque, X.", anio: 1989, titulo: "A preliminary study of mercury contamination in the surface soil and river sediment of the Roscio District, Bolivar State, Venezuela", revista: "The Science of the Total Environment, 79, 233-239", doi: null, indexacion: "Elsevier (Scopus/Web of Science)", verificada: false },
  { autores: "Urbani, F., Grande, S., Goddard, D., & Mendi, D.", anio: 2012, titulo: "Revisión de la geología, minería e historia del yacimiento de mercurio de San Jacinto, Serranía de Baragua, estado Lara, Venezuela", revista: "Revista de la Facultad de Ingeniería Universidad Central de Venezuela, 27(2), Caracas", doi: null, indexacion: "SciELO Venezuela", verificada: false },
];

/** Fuentes de prensa e informes institucionales: NO arbitradas por pares. */
const FUENTES_PRENSA: {
  autores: string;
  anio: number;
  titulo: string;
  medio: string;
}[] = [
  { autores: "OACNUDH (Naciones Unidas)", anio: 2020, titulo: "Independence of the justice system and access to justice… and the situation of human rights in the Arco Minero del Orinoco region (A/HRC/44/54)", medio: "Consejo de Derechos Humanos de la ONU — informe institucional" },
  { autores: "Rendon, M., Sandin, L., & Fernandez, C.", anio: 2020, titulo: "Minería ilegal en Venezuela: muerte y devastación en las regiones del Amazonas y Orinoco", medio: "Center for Strategic and International Studies (CSIS) — think tank" },
  { autores: "Global Nature Watch (World Resources Institute)", anio: 2026, titulo: "Venezuela Deforestation Rates & Statistics", medio: "Panel de datos ambientales en línea" },
  { autores: "Redacción, Ya Es Hora Venezuela", anio: 2026, titulo: "El Arco Minero del Orinoco: explotación, impacto ambiental y corrupción", medio: "Ya Es Hora Venezuela — prensa" },
  { autores: "Transparencia Venezuela", anio: 2023, titulo: "Economías ilícitas en Venezuela: el Arco Minero del Orinoco, la legalización de lo ilícito", medio: "Transparencia Venezuela — sociedad civil" },
  { autores: "Transparencia Venezuela", anio: 2022, titulo: "El Arco Minero del Orinoco: concentración de ilícitos (Capítulo 2)", medio: "Transparencia Venezuela — informe de investigación" },
  { autores: "Pernalete, J.", anio: 2026, titulo: "Denuncian ante la CIDH expansión de la minería ilegal y control de grupos armados en Venezuela", medio: "Martí Noticias — prensa" },
  { autores: "Ruiz, S., & Belo, M.", anio: 2021, titulo: "El pueblo y los bosques venezolanos sufren a medida que avanza la minería de oro", medio: "Global Forest Watch Blog (hoy Global Nature Watch)" },
  { autores: "Moreno Parra, M. (Clima21)", anio: 2023, titulo: "Minería y racismo ambiental: los derechos humanos de los afrodescendientes frente al extractivismo minero", medio: "Clima21 — organización de derechos humanos" },
  { autores: "Clima21", anio: 2023, titulo: "Resumen de la situación de los derechos humanos ambientales en Venezuela 2022", medio: "Clima21 — organización de derechos humanos" },
];

export default function PaginaAcerca() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 text-texto-secundario">
      <h1 className="text-2xl font-semibold text-texto-primario">
        Acerca del prototipo
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed">
        <strong className="text-texto-primario">Centinela Orinoco</strong> es el
        prototipo funcional de un proyecto de maestría (UNEG — Arquitecturas de
        Datos Inteligentes). El proyecto completo diseña una arquitectura de
        datos inteligente para detectar y monitorear la minería ilegal en el
        Arco Minero del Orinoco (estado Bolívar, Amazonía venezolana). Este
        prototipo implementa <strong className="text-texto-primario">una sola
        capa</strong> de esa arquitectura: la capa de consumo con memoria
        semántica (RAG). El resto se documenta como diseño, no se implementa.
      </p>

      {/* Frontera de honestidad */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-texto-primario">
          Frontera de honestidad
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed">
          Este prototipo declara con transparencia qué es real y qué es
          demostrativo. No pretende ser un pipeline vivo que no existe.
        </p>
        <div className="mt-4 space-y-3">
          <FilaFrontera
            origen="real"
            titulo="Capa semántica RAG"
            descripcion="Corpus de artículos científicos verdaderos, embeddings, recuperación vectorial y respuestas generadas con citas verificables. Es totalmente funcional."
          />
          <FilaFrontera
            origen="pre-calculado"
            titulo="Detecciones de minería (polígonos)"
            descripcion="Se cargan desde un GeoJSON estático. En producción provendrían del modelo de detección satelital, orquestado por Airflow. La geometría de los polígonos es esquemática (exagerada para visibilidad); la superficie real la lleva el atributo superficie_ha."
          />
          <FilaFrontera
            origen="simulado"
            titulo="Telemetría de sensores IoT"
            descripcion="Turbidez, pH y conductividad generados sintéticamente con un pico sincronizado con la fecha de detección. En producción provendrían de nodos ESP32 vía MQTT/LoRaWAN."
          />
        </div>
      </section>

      {/* Arquitectura completa vs implementada */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-texto-primario">
          Arquitectura completa vs. lo implementado
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed">
          En un despliegue real, cada dato de este tablero provendría de un
          componente distinto de la arquitectura:
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-base-600 text-left text-texto-tenue">
                <th className="py-2 pr-3 font-medium">Componente</th>
                <th className="py-2 pr-3 font-medium">Tecnología de diseño</th>
                <th className="py-2 font-medium">Estado en el prototipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-700">
              <FilaTabla
                comp="Ingesta de datos"
                tec="Apache Kafka / Apache NiFi"
                estado="no-implementado"
                nota="Diseño documentado"
              />
              <FilaTabla
                comp="Almacenamiento (Lakehouse)"
                tec="Delta Lake sobre MinIO (S3)"
                estado="no-implementado"
                nota="Diseño documentado"
              />
              <FilaTabla
                comp="Orquestación"
                tec="Apache Airflow"
                estado="no-implementado"
                nota="Diseño documentado"
              />
              <FilaTabla
                comp="Detección satelital"
                tec="Modelo (SAR/óptico + deep learning)"
                estado="pre-calculado"
                nota="GeoJSON estático"
              />
              <FilaTabla
                comp="Sensores de agua (IoT)"
                tec="Nodos ESP32 · MQTT / LoRaWAN"
                estado="simulado"
                nota="telemetria.json sintético"
              />
              <FilaTabla
                comp="Base vectorial"
                tec="Supabase + pgvector"
                estado="real"
                nota="Operativa"
              />
              <FilaTabla
                comp="Embeddings"
                tec="Voyage AI (voyage-3.5-lite)"
                estado="real"
                nota="Operativa"
              />
              <FilaTabla
                comp="Generación (LLM)"
                tec="API de Anthropic"
                estado="real"
                nota="Operativa (configurable)"
              />
              <FilaTabla
                comp="Capa de consumo (este tablero)"
                tec="Next.js + MapLibre + Recharts"
                estado="real"
                nota="Operativa"
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* Cómo funciona el RAG */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-texto-primario">
          Cómo funciona la capa RAG
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[14px] leading-relaxed">
          <li>
            El corpus (24 fuentes reales: 14 artículos científicos y 10
            documentos de prensa e informes) se fragmenta y se convierte en
            vectores con Voyage AI, almacenados en Supabase/pgvector.
          </li>
          <li>
            Ante una consulta (o al abrir una alerta), se genera el embedding de
            la pregunta y se recuperan los fragmentos más similares por distancia
            coseno.
          </li>
          <li>
            El LLM redacta la respuesta anclada <em>exclusivamente</em> en esos
            fragmentos, con instrucciones estrictas de no inventar datos ni citas
            y de declarar cuando el corpus no cubre un aspecto.
          </li>
          <li>
            Cada respuesta muestra las fuentes consultadas (autor, año, revista),
            haciéndola verificable.
          </li>
        </ol>
      </section>

      {/* Aclaración sobre el mercurio */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-texto-primario">
          Aclaración importante sobre el mercurio
        </h2>
        <p className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] p-3 text-[14px] leading-relaxed text-amber-100/90">
          El sistema <strong>no mide mercurio en campo</strong>. El mercurio
          requiere análisis de laboratorio. Los sensores miden{" "}
          <strong>proxies</strong> —turbidez, pH y conductividad— que indican
          perturbación del agua asociada a la minería aluvial y orientan{" "}
          <em>dónde priorizar el muestreo analítico</em>. Las cifras de
          contaminación por mercurio que cita el asistente provienen del corpus
          científico (estudios de la cuenca del Cuyuní), no de mediciones en
          tiempo real de este prototipo.
        </p>
      </section>

      {/* Corpus */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-texto-primario">
          Sobre el corpus
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed">
          Los textos indexados son <strong className="text-texto-primario">resúmenes
          elaborados</strong> de las referencias reales del proyecto, no el
          texto literal de los artículos originales. El corpus puede incluir
          también fuentes de <strong>prensa</strong>, que se etiquetan
          visiblemente como <em>no arbitradas</em> y que el asistente distingue
          de la ciencia revisada por pares al citarlas.
        </p>
      </section>

      {/* Listado de fuentes científicas */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-texto-primario">
          Fuentes científicas del corpus (revisadas por pares)
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-texto-tenue">
          14 artículos arbitrados. Los marcados con{" "}
          <span className="rounded bg-sky-500/15 px-1 text-[11px] text-sky-300">
            no en referencias.json
          </span>{" "}
          son fuentes científicas arbitradas localizadas durante el procesamiento
          del corpus; sus datos bibliográficos se tomaron directamente del propio
          documento, no de la lista verificada del proyecto.
        </p>
        <ol className="mt-3 space-y-2 text-[13px] leading-relaxed">
          {FUENTES_CIENTIFICAS.map((f, i) => (
            <li key={f.doi ?? `${f.autores}-${f.anio}`} className="flex gap-2">
              <span className="shrink-0 font-mono text-[11px] text-texto-tenue">
                {i + 1}.
              </span>
              <span>
                <span className="text-texto-primario">{f.autores}</span> ({f.anio}).{" "}
                {f.titulo}. <span className="italic">{f.revista}</span>.
                {f.doi && (
                  <span className="text-texto-tenue">
                    {" "}
                    doi:{f.doi}
                  </span>
                )}
                <span className="text-texto-tenue"> · {f.indexacion}</span>
                {!f.verificada && (
                  <span className="ml-1 rounded bg-sky-500/15 px-1 text-[11px] text-sky-300">
                    no en referencias.json
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Listado de fuentes de prensa / no arbitradas */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-texto-primario">
          Fuentes de prensa e informes (no arbitradas)
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-texto-tenue">
          10 documentos de contexto (prensa, informes institucionales y de la
          sociedad civil). No son ciencia revisada por pares; el asistente las
          cita etiquetadas como{" "}
          <span className="rounded bg-amber-500/15 px-1 text-[11px] uppercase text-amber-300">
            prensa · no arbitrada
          </span>{" "}
          y las distingue de la evidencia científica.
        </p>
        <ol className="mt-3 space-y-2 text-[13px] leading-relaxed">
          {FUENTES_PRENSA.map((f, i) => (
            <li key={`${f.autores}-${f.anio}-${i}`} className="flex gap-2">
              <span className="shrink-0 font-mono text-[11px] text-texto-tenue">
                {i + 1}.
              </span>
              <span>
                <span className="text-texto-primario">{f.autores}</span> ({f.anio}).{" "}
                {f.titulo}. <span className="italic">{f.medio}</span>.
              </span>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-10 border-t border-base-700 pt-4 text-[12px] text-texto-tenue">
        Prototipo académico con fines demostrativos. Las detecciones y la
        telemetría mostradas no representan eventos reales verificados.
      </p>
    </div>
  );
}

function FilaFrontera({
  origen,
  titulo,
  descripcion,
}: {
  origen: "real" | "pre-calculado" | "simulado";
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-base-700 bg-base-800/40 p-3">
      <div className="pt-0.5">
        <EtiquetaOrigen origen={origen} />
      </div>
      <div>
        <div className="text-[14px] font-medium text-texto-primario">{titulo}</div>
        <div className="mt-0.5 text-[13px] leading-relaxed">{descripcion}</div>
      </div>
    </div>
  );
}

function FilaTabla({
  comp,
  tec,
  estado,
  nota,
}: {
  comp: string;
  tec: string;
  estado: "real" | "pre-calculado" | "simulado" | "no-implementado";
  nota: string;
}) {
  const estilo: Record<string, string> = {
    real: "text-emerald-300",
    "pre-calculado": "text-sky-300",
    simulado: "text-amber-300",
    "no-implementado": "text-texto-tenue",
  };
  const etiqueta: Record<string, string> = {
    real: "Real",
    "pre-calculado": "Pre-calculado",
    simulado: "Simulado",
    "no-implementado": "No implementado",
  };
  return (
    <tr>
      <td className="py-2 pr-3 text-texto-primario">{comp}</td>
      <td className="py-2 pr-3">{tec}</td>
      <td className="py-2">
        <span className={`font-medium ${estilo[estado]}`}>{etiqueta[estado]}</span>
        <span className="ml-1 text-texto-tenue">· {nota}</span>
      </td>
    </tr>
  );
}
