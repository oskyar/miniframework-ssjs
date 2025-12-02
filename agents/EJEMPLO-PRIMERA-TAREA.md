# EJEMPLO PRÁCTICO: Primera Tarea con Claude Code

## 🎯 OBJETIVO
Analizar el estado actual del OmegaFramework y obtener roadmap de mejoras

## 📋 COMANDO PARA CLAUDE CODE

Copia y pega este comando en tu terminal:

```bash
claude chat "
# CONTEXTO DEL PROYECTO
Estoy trabajando en OmegaFramework, un miniframework SSJS para Salesforce Marketing Cloud.
Repositorio: https://github.com/oskyar/miniframework-ssjs

# RESTRICCIONES TÉCNICAS
- Lenguaje: SSJS (ES5 solamente, NO ES6+)
- Entorno: Salesforce Marketing Cloud (stateless, sin memoria entre ejecuciones)
- Persistencia: Solo mediante Data Extensions
- Limitaciones: 30 min timeout, rate limits en API calls

# TU ROL
Actúa como el AGENTE ARQUITECTO siguiendo EXACTAMENTE las instrucciones 
del archivo 'agent-architect.md' que está en la raíz del proyecto.

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
"
```

## 📝 ALTERNATIVA: Crear archivo de tarea

Si prefieres no usar comandos largos en terminal, crea este archivo:

**Archivo: `tasks/task-001-initial-analysis.md`**

```markdown
# Task 001: Análisis Inicial de Arquitectura

## Contexto
Proyecto: OmegaFramework  
Tipo: SSJS Framework para SFMC  
Estado: v2.0 en producción  

## Agente Requerido
Arquitecto (ver: agent-architect.md)

## Objetivo
Analizar estado actual y proponer roadmap de mejoras

## Entregables
1. Assessment arquitectónico (200-300 palabras)
2. Lista de 5 mejoras priorizadas con IDs
3. Especificación detallada de mejora #1 (más prioritaria)

## Consideraciones Especiales
- Framework ya en producción (evitar breaking changes)
- Usuarios actuales dependen de API estable
- Performance es crítico (SFMC tiene timeouts)
```

Luego ejecuta:

```bash
cd /path/to/miniframework-ssjs
claude chat < tasks/task-001-initial-analysis.md
```

## 🔄 FLUJO COMPLETO DE TRABAJO

### Paso 1: Análisis (Arquitecto)
```bash
# Guarda el output para referencia futura
claude chat "Rol: Arquitecto. Analiza OmegaFramework." > outputs/001-architecture-analysis.md
```

### Paso 2: Implementación (Desarrollador)
```bash
claude chat "
Rol: Desarrollador (agent-developer.md)

Basándote en el análisis en outputs/001-architecture-analysis.md,
implementa la mejora ARCH-001 (la más prioritaria).

Genera el código completo en SSJS (ES5) con:
- Implementación funcional
- JSDoc comments
- Ejemplos de uso
- Notas de implementación
" > outputs/002-implementation-arch-001.md
```

### Paso 3: Validación (Validador)
```bash
claude chat "
Rol: Validador SFMC (agent-validator.md)

Valida la implementación en outputs/002-implementation-arch-001.md

Verifica:
1. Sintaxis ES5 (no ES6+)
2. APIs disponibles en SFMC
3. Error handling robusto
4. Performance aceptable
5. Compatibilidad con código existente

Proporciona reporte de validación: PASS/FAIL con detalles.
" > outputs/003-validation-report.md
```

### Paso 4: Documentación (Documentador)
```bash
# Solo si la validación fue PASS
claude chat "
Rol: Documentador (agent-documenter.md)

Documenta la implementación validada de ARCH-001.

Genera:
1. API Reference completa
2. Guía de implementación con ejemplos
3. 10 casos de prueba (unit + integration)
4. Troubleshooting guide

Formato: Markdown estructurado
" > outputs/004-documentation-arch-001.md
```

## 🎮 COMANDO RÁPIDO PARA EMPEZAR AHORA

El más simple para probar todo el sistema:

```bash
claude chat "
Soy el desarrollador de OmegaFramework (SSJS para SFMC).

Actúa como Agente Arquitecto (agent-architect.md).

Dame un quick assessment: 
- 3 fortalezas del framework actual
- 3 mejoras que darían mayor impacto
- 1 quick win que pueda implementar hoy

Sé conciso (máximo 150 palabras).
"
```

## 🛠️ TIPS AVANZADOS

### Tip 1: Encadenar comandos
```bash
# Análisis + Implementación en un solo comando
claude chat "
FASE 1 - Rol: Arquitecto
Diseña sistema de logging para OmegaFramework.

FASE 2 - Rol: Desarrollador  
Implementa el diseño que acabas de crear.

Output: Primero el diseño, luego el código.
"
```

### Tip 2: Usar variables
```bash
FEATURE="Module Registry"

claude chat "
Rol: Arquitecto
Diseña ${FEATURE} para OmegaFramework con:
- Singleton pattern
- Prevención de duplicados
- Compatible con SFMC
"
```

### Tip 3: Iterar en sesión interactiva
```bash
# Inicia sesión interactiva
claude chat

# Luego dentro de la sesión:
> Rol: Arquitecto. Analiza ConnectionHandler.ssjs
[respuesta de Claude]

> Ahora como Desarrollador, implementa la mejora ARCH-001 que propusiste
[respuesta de Claude]

> Ahora como Validador, revisa el código que acabas de crear
[respuesta de Claude]
```

## 📊 ESTRUCTURA DE DIRECTORIO RECOMENDADA

```
miniframework-ssjs/
├── agent-architect.md
├── agent-developer.md
├── agent-validator.md
├── agent-documenter.md
├── orchestrator.md
├── .claude-omega-framework         # Configuración
├── tasks/                           # Archivos de tareas
│   ├── task-001-initial-analysis.md
│   ├── task-002-module-registry.md
│   └── task-003-circuit-breaker.md
├── outputs/                         # Outputs de Claude
│   ├── 001-architecture-analysis.md
│   ├── 002-implementation-*.md
│   ├── 003-validation-*.md
│   └── 004-documentation-*.md
├── core/                           # Código del framework
├── auth/
├── integrations/
└── tests/
```

## ⚡ COMANDO PARA CREAR ESTRUCTURA

```bash
# Desde la raíz del proyecto
mkdir -p tasks outputs

# Crea tu primera tarea
cat > tasks/task-001-initial-analysis.md << 'EOF'
Rol: Arquitecto (agent-architect.md)
Tarea: Análisis inicial del OmegaFramework
Output: Assessment + Top 5 mejoras priorizadas
EOF

# Ejecuta la tarea
claude chat < tasks/task-001-initial-analysis.md > outputs/001-analysis.md
```

## 🎬 ¿LISTO PARA EMPEZAR?

**Opción A - Quick Test (30 segundos)**
```bash
claude chat "Rol: Arquitecto. Dame 3 quick wins para OmegaFramework."
```

**Opción B - Análisis Completo (5 minutos)**
```bash
claude chat < tasks/task-001-initial-analysis.md > outputs/analysis.md
cat outputs/analysis.md
```

**Opción C - Flujo Completo (20 minutos)**
Ejecuta los 4 pasos del "Flujo Completo de Trabajo" arriba ⬆️

---

## ❓ PRÓXIMAS PREGUNTAS

Después de tu primer análisis, pregúntame:
- ¿Cuál mejora debería implementar primero?
- ¿Cómo implemento ARCH-XXX paso a paso?
- ¿Puedes validar este código antes de commit?
- ¿Cómo documento esta nueva feature?

**Simplemente indica el rol que necesitas y tu pregunta.**

¿Cuál opción quieres probar primero?
