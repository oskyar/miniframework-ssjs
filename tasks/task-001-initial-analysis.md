# CONTEXTO DEL PROYECTO
Estoy trabajando en OmegaFramework, un miniframework SSJS para Salesforce Marketing Cloud.
Repositorio: https://github.com/oskyar/miniframework-ssjs

# RESTRICCIONES TÉCNICAS
- Lenguaje: SSJS (ES3 solamente, NO ES5,ES6+)
- Entorno: Salesforce Marketing Cloud (stateless, sin memoria entre ejecuciones)
- Persistencia: Solo mediante Data Extensions
- Limitaciones: 30 min timeout, rate limits en API calls

# TU ROL
Actúa como el AGENTE ARQUITECTO siguiendo EXACTAMENTE las instrucciones 
del archivo 'agent-architect.md' que está en la carpeta agents del proyecto.

# TAREA
Analiza el OmegaFramework actual y proporciona:

1. **Assessment del Estado Actual** (2-3 párrafos)
   - Fortalezas de la arquitectura actual
   - Puntos débiles o áreas de mejora
   - Oportunidades de optimización

2. **Top 5 Mejoras Priorizadas**
   Para cada mejora proporciona:
   - ID: ARCH-XXX
   - Título descriptivo
   - Categoría: [Pattern Design | Modularity | Performance | Error Handling]
   - Prioridad: [Critical | High | Medium | Low]
   - Beneficio principal
   - Complejidad de implementación: [Low | Medium | High]

3. **Especificación Detallada de la Mejora #1**
   - Estado actual vs estado propuesto
   - Diagrama de arquitectura (ASCII)
   - Componentes afectados
   - Pasos de implementación
   - Criterios de éxito

# FORMATO DE SALIDA
Markdown estructurado con secciones claras y código en bloques cuando sea necesario.
