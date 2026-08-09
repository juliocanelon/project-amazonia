---
id: "fonseca-2024"
autores: "Fonseca, A., Marshall, M. T., & Salama, S."
anio: 2024
titulo: "Enhanced detection of artisanal small-scale mining with spectral and textural segmentation of Landsat time series"
revista: "Remote Sensing, 16(10), 1749"
doi: "10.3390/rs16101749"
indexacion: "Scopus, Web of Science (SCIE)"
tipo: "resumen_elaborado"
---

NOTA: Resumen elaborado en español. No reproduce texto literal del original.

Este artículo, elaborado por investigadores de la Universidad de Twente (Países Bajos) y de IABG (Alemania), propone un método para detectar minería artesanal y de pequeña escala (ASM) en la cuenca del río Tapajós, una importante región aurífera de la Amazonía brasileña, combinando segmentación temporal de series de imágenes Landsat con análisis de textura y un clasificador de bosques aleatorios (Random Forest). El objetivo central es resolver un problema técnico recurrente en este tipo de estudios: las minas artesanales son pequeñas, de forma irregular y se confunden espectralmente con otros tipos de desmonte (agricultura, tala, quemas), lo que genera errores frecuentes cuando se usan únicamente índices espectrales convencionales como el NDVI.

La metodología se apoya en Google Earth Engine y en el algoritmo LandTrendr, que analiza pixel por pixel una serie temporal anual de imágenes Landsat 7 y 8 entre 2000 y 2019 para identificar quiebres abruptos o graduales en la trayectoria de la vegetación, típicos de una perturbación por minería. A diferencia de trabajos anteriores, que solo usan información espectral, los autores incorporaron 72 métricas de textura calculadas mediante matrices de co-ocurrencia de niveles de gris (GLCM) sobre cada banda espectral, además de ocho índices de vegetación y variables auxiliares como la distancia a ríos y carreteras, la pendiente y el índice topográfico de humedad. Con el conjunto resultante de 86 variables, aplicaron una técnica de selección de variables (VSURF) para eliminar las redundantes o poco informativas, reduciéndolas a 33, y entrenaron un modelo de Random Forest usando como referencia de verdad en terreno polígonos de minería de la Red Amazónica de Información Socioambiental (RAISG), complementados con digitalización manual sobre imágenes de muy alta resolución.

Los resultados muestran una exactitud global del modelo final de 92,6%, con un error fuera de bolsa (out-of-bag) de 3,73%, cifras comparables a estudios que mapean minería industrial de mayor tamaño. La variable más determinante fue el NDVI, seguida por varias métricas de textura calculadas en las bandas del infrarrojo cercano y de onda corta, lo que confirma que la heterogeneidad espacial dentro de un píxel minero (mezcla de pozas de agua, montículos de sedimento y vegetación residual) aporta información valiosa que los índices espectrales por sí solos no capturan. El análisis temporal también permitió observar que la expansión de la minería artesanal en la zona de estudio se aceleró después de la crisis económica global de 2008, evidenciando la sensibilidad de esta actividad a los precios internacionales del oro.

Para la vigilancia de la minería ilegal de oro en la Amazonía y en la cuenca del Orinoco venezolano, este trabajo aporta un antecedente metodológico relevante y de bajo costo, ya que se basa enteramente en datos Landsat de acceso gratuito y en la plataforma en la nube Google Earth Engine, sin requerir imágenes comerciales de mayor resolución. Su aporte más útil para el caso venezolano es demostrar que añadir información de textura a los índices espectrales tradicionales mejora sustancialmente la distinción entre minería artesanal y otras formas de desmonte forestal —un problema que también se presenta en el Arco Minero del Orinoco, donde la minería aurífera coexiste con la tala selectiva y la agricultura migratoria—, y sugiere que un sistema similar podría adaptarse a Venezuela si se cuenta con un conjunto de polígonos de referencia equivalente al de RAISG para entrenar el modelo.
