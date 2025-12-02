# CONTEXTO DEL PROYECTO
Basado en el contexto de /miniframework/tasks/task-001-initial-analysis.md y su salida: outputs/task-001-initial-analysis-output.md

# RESTRICCIONES TÉCNICAS
- Lenguaje: SSJS (ES3 solamente, NO ES5,ES6+)
- Entorno: Salesforce Marketing Cloud (stateless, sin memoria entre ejecuciones)
- Persistencia: Solo mediante Data Extensions
- Limitaciones: 30 min timeout, rate limits en API calls

# TU ROL
Actúa como el AGENTE ARQUITECTO siguiendo EXACTAMENTE las instrucciones 
del archivo 'agent-architect.md' que está en la carpeta /agents del proyecto.

# TAREA
Hay una versión muy inicial y base de un Factory o Loader para los Content Blocks de SFMC. Quiero que:

1. **Revisión OmegaFrameworkFactory.ssjs** (2-3 párrafos)
   - Viabilidad para ejecutar en Salesforce Marketing Cloud
   - Posibles problemas en implementación
   - Formas en las qeu tendría que trabajar el desarrollador para que, una vez implementado, usar el Framework.
   - Buscamos la manera más sencilla de cargar módulos dependientes, de que no haya cargas duplicadas y de abstraer al desarrollador de conocer el core del Framework para usarlo.

2. **Propuesta o Mejoras**
   - Una vez revisada el Factory heredado. Propón uno nuevo o indica posibles mejoras para tener en cuenta lo comentado anteriormente.
   - El Cargador de módulos tiene que ser algo sencillo de usar y teniendo en cuenta las LIMITACIONES de SFMC para importar otros bloques de código de SSJS.
   - Tener en cuenta que sobre todo, se va a usar en Scripts de Automation por lo que tendrá que ser 100% compatible.

3. **Especificación Detallada de la Propuesta #1**
   - Estado actual vs estado propuesto
   - Diagrama de arquitectura (ASCII)
   - Componentes afectados
   - Pasos de implementación del Factory para el agente con rol Desarrollador
   - Guía de uso para el desarrollador de la propuesta.

# FORMATO DE SALIDA
Markdown estructurado con secciones claras y código en bloques cuando sea necesario.
