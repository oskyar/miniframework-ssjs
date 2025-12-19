# TEMPLATE DE TAREA - OmegaFramework

## 📋 INFORMACIÓN DE LA TAREA

**ID:** TASK-XXX  
**Fecha:** YYYY-MM-DD  
**Prioridad:** [Critical | High | Medium | Low]  
**Estimación:** [X horas/días]

---

## 🎯 OBJETIVO

[Describe en 1-2 frases qué quieres lograr]

Ejemplo: "Implementar sistema de circuit breaker para prevenir sobrecarga del API cuando hay fallos consecutivos."

---

## 🎭 AGENTE REQUERIDO

Marca el agente que necesitas:

- [ ] **Arquitecto** - Para diseño y decisiones arquitectónicas
- [ ] **Desarrollador** - Para implementación de código
- [ ] **Validador** - Para validación técnica
- [ ] **Documentador** - Para documentación y tests
- [ ] **Orquestador** - Para flujo completo (usa todos los agentes)

---

## 📝 DESCRIPCIÓN DETALLADA

### Contexto
[Explica el problema o la necesidad actual]

### Requisitos
- Requisito 1
- Requisito 2
- Requisito 3

### Restricciones
- ES5 syntax (no ES6+)
- Compatible con SFMC
- [Otras restricciones específicas]

### Componentes Afectados
- `path/to/file1.ssjs`
- `path/to/file2.ssjs`

---

## 🎯 CRITERIOS DE ÉXITO

- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

---

## 📦 ENTREGABLES ESPERADOS

### Si usas Arquitecto:
- [ ] Análisis arquitectónico
- [ ] Diseño de la solución
- [ ] Diagrama de componentes
- [ ] Especificación técnica con ID (ARCH-XXX)

### Si usas Desarrollador:
- [ ] Código implementado en SSJS (ES5)
- [ ] JSDoc comments
- [ ] Ejemplos de uso
- [ ] Notas de implementación

### Si usas Validador:
- [ ] Reporte de validación (Pass/Fail)
- [ ] Lista de issues (si hay)
- [ ] Recomendaciones
- [ ] Aprobación para producción

### Si usas Documentador:
- [ ] API Reference
- [ ] Guía de implementación
- [ ] Casos de prueba
- [ ] Troubleshooting guide

---

## 💻 COMANDO PARA CLAUDE CODE

### Opción 1: Comando directo
```bash
claude chat "
# CONTEXTO
Proyecto: OmegaFramework (SSJS para SFMC)
Restricciones: ES5 only, stateless execution, Data Extensions

# ROL
Actúa como [Arquitecto|Desarrollador|Validador|Documentador]
Referencia: agent-[X].md

# TAREA
[Copia aquí tu descripción detallada de arriba]

# ENTREGABLES
[Lista específica de lo que necesitas]

# FORMATO
Markdown estructurado con código en bloques cuando necesario
"
```

### Opción 2: Desde archivo
```bash
# Guarda esta tarea como: tasks/task-XXX-descripcion.md
# Luego ejecuta:
claude chat < tasks/task-XXX-descripcion.md > outputs/XXX-resultado.md
```

---

## 📊 SEGUIMIENTO

### Estado Actual
- [ ] Pendiente
- [ ] En progreso
- [ ] En revisión
- [ ] Bloqueado
- [ ] Completado

### Fases del Workflow
- [ ] Arquitectura (si aplica)
- [ ] Implementación
- [ ] Validación
- [ ] Documentación
- [ ] Deployment

### Notas de Progreso
[Agrega notas mientras trabajas en la tarea]

---

## 🔗 REFERENCIAS

### Archivos Relacionados
- [Archivo 1]
- [Archivo 2]

### Tareas Relacionadas
- TASK-XXX (dependencia)
- TASK-XXX (relacionada)

### Documentación Relevante
- [Link o archivo]

---

## 🚧 ISSUES Y BLOCKERS

### Issues Encontrados
[Lista de problemas que surgieron]

### Blockers
[Lista de bloqueos que impiden progreso]

### Soluciones Aplicadas
[Cómo se resolvieron]

---

## ✅ CHECKLIST DE CIERRE

Antes de marcar como completado:

- [ ] Código implementado y testeado
- [ ] Validación pasada (sin issues críticos)
- [ ] Documentación generada
- [ ] Tests creados
- [ ] Ejemplos de uso incluidos
- [ ] Code review hecho
- [ ] Merge a branch principal
- [ ] Actualizado CHANGELOG

---

## 📝 NOTAS ADICIONALES

[Cualquier información adicional relevante]

---

---

# EJEMPLO DE USO

## Tarea Real: Implementar Module Registry

**ID:** TASK-001  
**Fecha:** 2024-11-28  
**Prioridad:** High  
**Estimación:** 1 día

---

## 🎯 OBJETIVO

Implementar un sistema de registro de módulos que prevenga cargas duplicadas cuando se usan múltiples ContentBlockByName en SFMC.

---

## 🎭 AGENTE REQUERIDO

- [x] **Arquitecto** - Diseñar la solución
- [x] **Desarrollador** - Implementar el código
- [x] **Validador** - Verificar compatibilidad
- [x] **Documentador** - Documentar uso

**Usar Orquestador para flujo completo**

---

## 📝 DESCRIPCIÓN DETALLADA

### Contexto
Actualmente, si múltiples scripts cargan el mismo ContentBlock, el código se ejecuta varias veces. Esto causa:
- Performance degradado
- Posibles conflictos
- Desperdicio de recursos

### Requisitos
- Singleton pattern para registro global
- Tracking de módulos cargados
- Prevención de ejecución duplicada
- Compatible con ContentBlockByName existente
- Zero breaking changes

### Restricciones
- ES5 syntax only
- Stateless execution (sin variables globales persistentes entre ejecuciones)
- Debe funcionar en Script Activities y CloudPages

### Componentes Afectados
- Nuevo: `core/ModuleRegistry.ssjs`
- Modificar: Documentación de carga de módulos

---

## 🎯 CRITERIOS DE ÉXITO

- [x] Registry detecta cargas duplicadas
- [x] Performance mejorado (sin re-ejecución)
- [x] API simple y clara
- [x] Tests incluidos
- [x] Documentación completa

---

## 💻 COMANDO PARA CLAUDE CODE

```bash
claude chat "
Contexto: OmegaFramework (SSJS para SFMC)

Rol: Orquestador (orchestrator.md)

Tarea: Implementa Module Registry completo

Workflow:
1. Arquitecto: Diseña ModuleRegistry con singleton pattern
2. Desarrollador: Implementa core/ModuleRegistry.ssjs
3. Validador: Verifica compatibilidad SFMC
4. Documentador: Genera docs completas

Output: Todos los entregables en secuencia
" > outputs/001-module-registry-complete.md
```

---

## 📊 SEGUIMIENTO

### Estado Actual
- [x] Completado

### Fases del Workflow
- [x] Arquitectura - ARCH-001 generado
- [x] Implementación - IMPL-001 generado
- [x] Validación - VAL-001 aprobado
- [x] Documentación - DOC-001 generado
- [ ] Deployment - Pendiente

---

## ✅ RESULTADO

Implementación exitosa del Module Registry.

Archivos generados:
- `core/ModuleRegistry.ssjs` (125 líneas)
- `docs/api/ModuleRegistry.md` (documentación)
- `tests/ModuleRegistry.test.md` (15 test cases)

Performance mejora: ~40% en scripts que cargan múltiples módulos.

---

---

# INSTRUCCIONES PARA USAR ESTE TEMPLATE

1. **Copia este archivo** a `tasks/task-XXX-nombre.md`
2. **Completa todas las secciones** con tu información
3. **Ejecuta el comando** de Claude Code que generaste
4. **Guarda el output** en `outputs/XXX-resultado.md`
5. **Actualiza el seguimiento** según progresas
6. **Marca como completado** cuando termines

---

**¿Necesitas crear una tarea ahora? Usa este template y empieza!** 🚀
