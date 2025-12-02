# SISTEMA MULTI-AGENTE PARA OMEGAFRAMEWORK

## 📋 ÍNDICE

1. [Visión General](#visión-general)
2. [Los 4 Agentes](#los-4-agentes)
3. [Cómo Usar el Sistema](#cómo-usar-el-sistema)
4. [Casos de Uso](#casos-de-uso)
5. [Archivos de Configuración](#archivos-de-configuración)

---

## 🎯 VISIÓN GENERAL

Has creado un **sistema multi-agente especializado** para mejorar el OmegaFramework (tu miniframework SSJS para Salesforce Marketing Cloud). Este sistema coordina 4 agentes que trabajan juntos para:

1. **Diseñar** mejoras arquitectónicas
2. **Implementar** código SSJS de calidad
3. **Validar** que funcione en SFMC
4. **Documentar** todo el proceso

### Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                   TÚ (Usuario)                          │
│         Proporciona código y objetivos                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              ORQUESTADOR                                 │
│    Coordina el flujo entre agentes                      │
└────┬────────────┬─────────────┬──────────────┬─────────┘
     │            │             │              │
     ▼            ▼             ▼              ▼
┌─────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐
│Arquitecto│→│Desarrolla│→│Validador  │→│Documentador  │
│         │ │dor       │ │SFMC       │ │/ QA          │
└─────────┘ └──────────┘ └───────────┘ └──────────────┘
```

---

## 👥 LOS 4 AGENTES

### 1️⃣ AGENTE ARQUITECTO
**Archivo**: `agent-architect.md`

**Responsabilidad**: Diseño arquitectónico y decisiones de alto nivel

**Input**: Código actual del OmegaFramework

**Output**: 
- Análisis de arquitectura actual
- Lista priorizada de mejoras
- Especificaciones técnicas detalladas
- Diagramas de diseño

**Cuándo usar**:
- Inicio de proyecto (análisis inicial)
- Nueva funcionalidad mayor
- Refactorización significativa
- Decisiones de patrones de diseño

### 2️⃣ AGENTE DESARROLLADOR
**Archivo**: `agent-developer.md`

**Responsabilidad**: Implementación de código SSJS

**Input**: Especificaciones del Arquitecto

**Output**:
- Código SSJS implementado
- Ejemplos de uso
- Comentarios JSDoc
- Escenarios de prueba

**Cuándo usar**:
- Implementar nuevas features
- Refactorizar código existente
- Crear nuevos módulos
- Optimizar performance

### 3️⃣ AGENTE VALIDADOR SFMC
**Archivo**: `agent-validator.md`

**Responsabilidad**: Validación técnica para SFMC

**Input**: Código del Desarrollador

**Output**:
- Reporte de validación (pass/fail)
- Lista de issues encontrados
- Recomendaciones de corrección
- Aprobación para producción

**Cuándo usar**:
- Después de cada implementación
- Antes de deployment
- Validación de compatibilidad
- Testing de integración

### 4️⃣ AGENTE DOCUMENTADOR/QA
**Archivo**: `agent-documenter.md`

**Responsabilidad**: Documentación y casos de prueba

**Input**: Código validado

**Output**:
- Documentación de API
- Guías de implementación
- Casos de prueba
- Checklists de code review
- Troubleshooting guides

**Cuándo usar**:
- Después de validación exitosa
- Actualización de docs
- Creación de test suites
- Publicación de releases

---

## 🚀 CÓMO USAR EL SISTEMA

### Método 1: Uso Completo (Proyecto Nuevo)

```markdown
## PASO 1: Iniciar Análisis Arquitectónico

**Prompt para Claude**:
```
Actúa como el Agente Arquitecto usando las instrucciones en agent-architect.md.

Analiza el código actual del OmegaFramework en:
https://github.com/oskyar/miniframework-ssjs

Proporciona:
1. Assessment del estado actual
2. Lista de 10 mejoras priorizadas
3. Especificación detallada de las 3 mejoras más prioritarias
```

**Claude responderá con**:
- Análisis arquitectónico completo
- Roadmap priorizado
- Especificaciones técnicas

---

## PASO 2: Implementar Mejora

**Prompt para Claude**:
```
Actúa como el Agente Desarrollador usando las instrucciones en agent-developer.md.

Implementa la mejora ARCH-001 (Module Registry) especificada por el Arquitecto.

Usa el contexto de la especificación y genera:
1. Código completo en SSJS (ES5 compatible)
2. Ejemplos de uso
3. Comentarios JSDoc
```

**Claude responderá con**:
- Código implementado
- Ejemplos prácticos
- Notas de implementación

---

## PASO 3: Validar Implementación

**Prompt para Claude**:
```
Actúa como el Agente Validador SFMC usando las instrucciones en agent-validator.md.

Valida la implementación IMPL-001 del Desarrollador.

Verifica:
1. Compatibilidad SSJS (solo ES5)
2. APIs disponibles en SFMC
3. Límites de ejecución
4. Error handling
5. Performance
```

**Claude responderá con**:
- Reporte de validación
- Lista de issues (si hay)
- Recomendación de aprobación/rechazo

---

## PASO 4: Documentar

**Prompt para Claude**:
```
Actúa como el Agente Documentador usando las instrucciones en agent-documenter.md.

Documenta la implementación IMPL-001 que fue aprobada por el Validador.

Genera:
1. Documentación de API
2. Guía de implementación
3. Casos de prueba
4. Checklist de code review
```

**Claude responderá con**:
- Documentación completa
- Test cases
- Troubleshooting guide

---

### Método 2: Uso Individual (Un Solo Agente)

Puedes usar un agente individualmente para tareas específicas:

#### Ejemplo: Solo Análisis Arquitectónico
```
Actúa como el Agente Arquitecto (agent-architect.md).

Revisa el archivo core/ConnectionHandler.ssjs y sugiere mejoras 
de arquitectura considerando:
- Mejor manejo de errores
- Implementación de circuit breaker
- Logging más robusto
```

#### Ejemplo: Solo Implementación
```
Actúa como el Agente Desarrollador (agent-developer.md).

Implementa una función de retry con exponential backoff para 
HTTP requests en SSJS, siguiendo los estándares del OmegaFramework.
```

#### Ejemplo: Solo Validación
```
Actúa como el Agente Validador SFMC (agent-validator.md).

Valida este código SSJS para compatibilidad con Marketing Cloud:

[pega tu código aquí]
```

#### Ejemplo: Solo Documentación
```
Actúa como el Agente Documentador (agent-documenter.md).

Genera documentación de API para el módulo DataExtensionTokenCache.ssjs,
incluyendo ejemplos de uso y casos de prueba.
```

---

### Método 3: Con Orquestador (Recomendado)

```
Actúa como el Orquestador (orchestrator.md).

Coordina a los 4 agentes para implementar una mejora completa al OmegaFramework.

Objetivo: Implementar un sistema de Module Registry para prevenir cargas duplicadas.

Ejecuta el flujo completo:
1. Arquitecto: Diseña la solución
2. Desarrollador: Implementa el código
3. Validador: Verifica compatibilidad
4. Documentador: Genera documentación

Dame un reporte de progreso después de cada fase.
```

---

## 💼 CASOS DE USO

### Caso 1: Nueva Feature Completa

**Objetivo**: Agregar sistema de logging al framework

```markdown
**Fase 1 - Arquitecto**:
Prompt: "Actúa como Arquitecto. Diseña un sistema de logging para 
OmegaFramework que persista en Data Extensions y tenga niveles 
(DEBUG, INFO, WARN, ERROR)."

**Fase 2 - Desarrollador**:
Prompt: "Actúa como Desarrollador. Implementa el Logger.ssjs según 
la especificación del Arquitecto."

**Fase 3 - Validador**:
Prompt: "Actúa como Validador. Valida Logger.ssjs para producción SFMC."

**Fase 4 - Documentador**:
Prompt: "Actúa como Documentador. Documenta el Logger con ejemplos 
de uso y casos de prueba."
```

### Caso 2: Refactorización

**Objetivo**: Mejorar el ConnectionHandler existente

```markdown
**Paso 1**:
Prompt: "Actúa como Arquitecto. Analiza core/ConnectionHandler.ssjs 
y propón mejoras para:
- Circuit breaker pattern
- Mejor retry logic
- Monitoring de requests"

**Paso 2**:
Prompt: "Actúa como Desarrollador. Refactoriza ConnectionHandler 
implementando las mejoras del Arquitecto sin breaking changes."

**Paso 3**:
Prompt: "Actúa como Validador. Verifica que el ConnectionHandler 
refactorizado mantenga backward compatibility."

**Paso 4**:
Prompt: "Actúa como Documentador. Actualiza la documentación de 
ConnectionHandler y crea migration guide si es necesario."
```

### Caso 3: Bug Fix + Validation

**Objetivo**: Corregir un bug específico

```markdown
**Paso 1**:
Prompt: "Actúa como Desarrollador. Hay un bug en DataExtensionTokenCache 
donde tokens no se invalidan correctamente cuando expiran. 
Corrige el método get() para validar expiración."

**Paso 2**:
Prompt: "Actúa como Validador. Valida el fix del bug en 
DataExtensionTokenCache. Específicamente prueba el escenario 
de token expirado."

**Paso 3**:
Prompt: "Actúa como Documentador. Agrega un test case para 
prevenir regresión del bug de expiración de tokens."
```

### Caso 4: Code Review

**Objetivo**: Revisar código antes de merge

```markdown
Prompt: "Actúa como Validador SFMC. 

Revisa este código para aprobación:

[código aquí]

Valida:
1. Sintaxis SSJS (ES5)
2. Error handling
3. Performance
4. Best practices del OmegaFramework"
```

### Caso 5: Documentación de Feature Existente

**Objetivo**: Documentar módulo que no tiene docs

```markdown
Prompt: "Actúa como Documentador.

El módulo auth/OAuth2AuthStrategy.ssjs no tiene documentación.

Genera:
1. API reference completa
2. Ejemplos de uso
3. Troubleshooting guide
4. Test cases"
```

---

## 📁 ARCHIVOS DE CONFIGURACIÓN

Has generado estos archivos para el sistema:

```
/home/claude/
├── agent-architect.md      # Prompt del Agente Arquitecto
├── agent-developer.md      # Prompt del Agente Desarrollador
├── agent-validator.md      # Prompt del Agente Validador
├── agent-documenter.md     # Prompt del Agente Documentador
├── orchestrator.md         # Coordinador del sistema
└── README-MULTIAGENT.md    # Este archivo (guía maestra)
```

### Cómo usar estos archivos:

1. **Lee el archivo relevante** antes de hacer un prompt
2. **Referencia el archivo en tu prompt**: "Actúa como [Agente] usando [archivo.md]"
3. **Proporciona contexto específico** sobre qué quieres lograr
4. **Sigue el flujo** del Orquestador para proyectos completos

---

## 🎓 MEJORES PRÁCTICAS

### ✅ DO:
- Usa el Orquestador para mejoras completas
- Proporciona contexto específico en cada prompt
- Sigue el flujo: Arquitecto → Desarrollador → Validador → Documentador
- Itera basándote en feedback del Validador
- Documenta TODO al final

### ❌ DON'T:
- Saltar la fase de arquitectura para features grandes
- Implementar sin validar después
- Olvidar documentar
- Ignorar warnings del Validador
- Hacer breaking changes sin migration path

---

## 🔄 WORKFLOW TÍPICO

### Proyecto Grande (Nueva Feature)
```
1. Prompt Arquitecto → Obtener diseño
2. Prompt Desarrollador → Obtener código
3. Prompt Validador → Verificar calidad
   └─ Si rechazado: Volver a paso 2
4. Prompt Documentador → Obtener docs
5. Review manual final
6. Deploy a producción
```

### Mejora Pequeña (Bug Fix)
```
1. Prompt Desarrollador → Fix del bug
2. Prompt Validador → Verificar fix
3. Prompt Documentador → Test case para prevenir regresión
4. Deploy
```

### Solo Análisis
```
1. Prompt Arquitecto → Assessment y recomendaciones
2. Review manual y decisión
```

---

## 📊 MÉTRICAS DE ÉXITO

Para medir el éxito del sistema:

```javascript
var metrics = {
    // Calidad
    codeQuality: {
        criticalIssues: 0,
        warnings: "< 3 per improvement",
        testCoverage: "> 80%"
    },
    
    // Velocidad
    velocity: {
        timePerImprovement: "2-3 días",
        improvementsPerSprint: "4-5"
    },
    
    // Documentación
    documentation: {
        completeness: "100%",
        upToDate: true,
        examplesIncluded: true
    }
};
```

---

## 🆘 TROUBLESHOOTING

### Problema: Claude no sigue el formato del agente
**Solución**: Asegúrate de referenciar el archivo explícitamente:
```
"Actúa como el Agente [X] siguiendo EXACTAMENTE las instrucciones 
en [archivo].md"
```

### Problema: Output demasiado genérico
**Solución**: Proporciona más contexto específico del OmegaFramework:
```
"Considera que OmegaFramework usa:
- Data Extensions para token caching
- Strategy pattern para auth
- ResponseWrapper para responses
- ES5 syntax (no ES6+)"
```

### Problema: Validación rechaza todo
**Solución**: Usa el Desarrollador antes del Validador, no escribas código tú mismo sin pasar por el Desarrollador primero.

---

## 🎯 SIGUIENTE PASO

**Para empezar ahora mismo**:

```
Actúa como el Orquestador usando orchestrator.md.

Analiza el OmegaFramework actual en:
https://github.com/oskyar/miniframework-ssjs

Dame:
1. Assessment del estado actual
2. Top 5 mejoras recomendadas (priorizadas)
3. Plan de implementación para las próximas 2 semanas

Usa el Agente Arquitecto para el análisis.
```

---

## 📝 NOTAS FINALES

Este sistema multi-agente está diseñado específicamente para tu OmegaFramework y las peculiaridades de SFMC/SSJS. Los agentes entienden:

- Limitaciones de SSJS (solo ES5)
- Contextos de ejecución de SFMC
- Necesidad de persistencia en Data Extensions
- Rate limits y timeouts
- Patrones del framework actual

¡Úsalo para escalar el desarrollo del framework de manera sistemática y con calidad garantizada! 🚀
