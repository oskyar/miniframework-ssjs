# 🎯 SISTEMA MULTI-AGENTE PARA OMEGAFRAMEWORK

## 📦 ARCHIVOS INCLUIDOS

Has recibido **9 archivos** que configuran tu sistema multi-agente:

### 🎓 Guías y Referencias
1. **README-MULTIAGENT.md** (14 KB) - Guía maestra completa del sistema
2. **CHEATSHEET.md** (5.1 KB) - Referencia rápida de comandos
3. **EJEMPLO-PRIMERA-TAREA.md** (7.3 KB) - Tutorial paso a paso
4. **TEMPLATE-TAREA.md** (6.5 KB) - Template para crear nuevas tareas

### 🤖 Configuración de Agentes
5. **agent-architect.md** (6.3 KB) - Agente de Arquitectura
6. **agent-developer.md** (12 KB) - Agente de Desarrollo
7. **agent-validator.md** (14 KB) - Agente de Validación SFMC
8. **agent-documenter.md** (16 KB) - Agente de Documentación

### 🎮 Coordinador
9. **orchestrator.md** (13 KB) - Orquestador del sistema

**Total:** ~94 KB de configuración profesional para desarrollo con IA

---

## 🚀 SETUP RÁPIDO (5 MINUTOS)

### Paso 1: Copiar archivos a tu proyecto

```bash
# Desde el directorio donde descargaste los archivos
cp *.md /ruta/a/tu/miniframework-ssjs/

# O si estás en Cursor/VSCode, simplemente arrástralos a la raíz
```

### Paso 2: Crear estructura de directorios

```bash
cd /ruta/a/tu/miniframework-ssjs
mkdir -p tasks outputs
```

### Paso 3: Probar el sistema

```bash
# Desde la raíz de tu proyecto
claude chat "Rol: Arquitecto (agent-architect.md). Dame un quick assessment de OmegaFramework."
```

**¡Listo!** Ya estás usando el sistema multi-agente.

---

## 📚 CÓMO USAR ESTE SISTEMA

### Para Principiantes: Lee esto primero

1. **Lee:** `CHEATSHEET.md` (3 minutos) - Te da los comandos esenciales
2. **Prueba:** `EJEMPLO-PRIMERA-TAREA.md` (5 minutos) - Tu primera interacción
3. **Usa:** Los comandos del cheatsheet para tus tareas diarias

### Para Usuarios Avanzados: Profundiza

1. **Lee:** `README-MULTIAGENT.md` (15 minutos) - Sistema completo explicado
2. **Configura:** Templates y workflows personalizados
3. **Escala:** Usa el Orquestador para proyectos grandes

---

## 🎭 LOS 4 AGENTES

Cada agente tiene una especialidad:

### 🏗️ ARQUITECTO (`agent-architect.md`)
**Usa cuando necesites:**
- Diseñar nuevas features
- Tomar decisiones arquitectónicas
- Evaluar patrones y estrategias
- Analizar código existente
- Proponer refactorings

**Comando básico:**
```bash
claude chat "Rol: Arquitecto. [tu pregunta de diseño]"
```

---

### 💻 DESARROLLADOR (`agent-developer.md`)
**Usa cuando necesites:**
- Implementar código SSJS
- Crear nuevos módulos
- Refactorizar código existente
- Fix de bugs
- Optimizar performance

**Comando básico:**
```bash
claude chat "Rol: Desarrollador. [tu tarea de código]"
```

---

### ✅ VALIDADOR (`agent-validator.md`)
**Usa cuando necesites:**
- Verificar compatibilidad SFMC
- Validar sintaxis ES5
- Code review antes de merge
- Testing de límites y performance
- Aprobación para producción

**Comando básico:**
```bash
claude chat "Rol: Validador. [tu código a validar]"
```

---

### 📚 DOCUMENTADOR (`agent-documenter.md`)
**Usa cuando necesites:**
- Generar API docs
- Crear guías de uso
- Escribir test cases
- Troubleshooting guides
- Code review checklists

**Comando básico:**
```bash
claude chat "Rol: Documentador. [tu módulo a documentar]"
```

---

## 🎮 ORQUESTADOR (`orchestrator.md`)

El Orquestador coordina a los 4 agentes en flujos completos.

**Usa cuando:**
- Implementas una feature completa (diseño → código → validación → docs)
- Necesitas un proyecto que requiere múltiples fases
- Quieres automatizar el workflow completo

**Comando básico:**
```bash
claude chat "Rol: Orquestador. Implementa [feature] completa usando todos los agentes."
```

---

## ⚡ QUICK START - 3 COMANDOS ESENCIALES

### 1️⃣ Análisis Rápido
```bash
claude chat "Rol: Arquitecto. Analiza OmegaFramework y dame Top 3 mejoras."
```

### 2️⃣ Implementar Feature
```bash
claude chat "Rol: Desarrollador. Implementa [feature] en SSJS (ES5)."
```

### 3️⃣ Validar Código
```bash
claude chat "Rol: Validador. Valida este código para SFMC: [tu código]"
```

---

## 📖 GUÍAS DE LECTURA POR ROL

### Si eres Product Owner / Tech Lead
**Lee primero:**
1. `README-MULTIAGENT.md` - Entender el sistema completo
2. `orchestrator.md` - Cómo coordinar proyectos
3. `TEMPLATE-TAREA.md` - Cómo crear tareas para el equipo

### Si eres Developer
**Lee primero:**
1. `CHEATSHEET.md` - Comandos esenciales
2. `EJEMPLO-PRIMERA-TAREA.md` - Tu primer uso
3. `agent-developer.md` - Tu agente principal

### Si eres Architect
**Lee primero:**
1. `agent-architect.md` - Tu agente principal
2. `README-MULTIAGENT.md` - Casos de uso arquitectónicos
3. `orchestrator.md` - Coordinar implementaciones

### Si eres QA
**Lee primero:**
1. `agent-validator.md` - Validación técnica
2. `agent-documenter.md` - Testing y documentación
3. `TEMPLATE-TAREA.md` - Crear test cases

---

## 🎯 CASOS DE USO COMUNES

### Caso 1: "Necesito analizar mi código"
```bash
# Lee: CHEATSHEET.md
# Comando:
claude chat "Rol: Arquitecto. Analiza [archivo] y propón mejoras."
```

### Caso 2: "Necesito implementar una feature"
```bash
# Lee: EJEMPLO-PRIMERA-TAREA.md
# Flujo: Arquitecto → Desarrollador → Validador → Documentador
```

### Caso 3: "Necesito validar antes de merge"
```bash
# Lee: agent-validator.md
# Comando:
claude chat "Rol: Validador. Valida [archivo] para producción."
```

### Caso 4: "Necesito documentar un módulo"
```bash
# Lee: agent-documenter.md
# Comando:
claude chat "Rol: Documentador. Documenta [módulo] completo."
```

### Caso 5: "Proyecto completo de principio a fin"
```bash
# Lee: orchestrator.md
# Comando:
claude chat "Rol: Orquestador. Implementa [proyecto] completo."
```

---

## 📁 ESTRUCTURA RECOMENDADA

Después del setup, tu proyecto debería verse así:

```
miniframework-ssjs/
├── README.md
├── agent-architect.md          ← Configuración Arquitecto
├── agent-developer.md          ← Configuración Desarrollador
├── agent-validator.md          ← Configuración Validador
├── agent-documenter.md         ← Configuración Documentador
├── orchestrator.md             ← Coordinador
├── CHEATSHEET.md              ← Referencia rápida ⚡
├── README-MULTIAGENT.md       ← Guía maestra 📚
├── EJEMPLO-PRIMERA-TAREA.md   ← Tutorial 🎓
├── TEMPLATE-TAREA.md          ← Template 📝
│
├── tasks/                      ← Tareas planificadas
│   ├── task-001-module-registry.md
│   ├── task-002-circuit-breaker.md
│   └── task-003-enhanced-logging.md
│
├── outputs/                    ← Outputs de Claude
│   ├── 001-architecture-analysis.md
│   ├── 002-implementation-module-registry.md
│   ├── 003-validation-report.md
│   └── 004-documentation.md
│
├── core/                       ← Tu código del framework
├── auth/
├── integrations/
└── tests/
```

---

## 🔧 CONFIGURACIÓN OPCIONAL

### Alias en tu shell (opcional pero útil)

Agrega a tu `~/.bashrc` o `~/.zshrc`:

```bash
# OmegaFramework AI Agents
alias omega-arch='claude chat "Rol: Arquitecto (agent-architect.md)."'
alias omega-dev='claude chat "Rol: Desarrollador (agent-developer.md)."'
alias omega-val='claude chat "Rol: Validador (agent-validator.md)."'
alias omega-doc='claude chat "Rol: Documentador (agent-documenter.md)."'
alias omega-orch='claude chat "Rol: Orquestador (orchestrator.md)."'
```

Luego usa:
```bash
omega-arch "Analiza ConnectionHandler.ssjs"
omega-dev "Implementa circuit breaker"
omega-val "Valida los cambios"
```

---

## 💡 MEJORES PRÁCTICAS

### ✅ DO:
1. **Especifica el rol SIEMPRE** - "Rol: [Agente]"
2. **Guarda los outputs** - Usa `> output.md`
3. **Sigue el flujo** - Arquitecto → Desarrollador → Validador → Documentador
4. **Itera** - Usa feedback del Validador para mejorar
5. **Documenta TODO** - No omitas la fase de documentación

### ❌ DON'T:
1. No omitas especificar el rol
2. No mezcles responsabilidades de agentes
3. No ignores warnings del Validador
4. No olvides las restricciones de SSJS (ES5 only)
5. No hagas breaking changes sin migration path

---

## 🆘 TROUBLESHOOTING

### Problema: "Claude no sigue el agente correctamente"
**Solución:** Sé más explícito en tu prompt
```bash
claude chat "
IMPORTANTE: Actúa EXCLUSIVAMENTE como [Agente].
Sigue TODAS las instrucciones en agent-[X].md.
[tu tarea]
"
```

### Problema: "No encuentro los archivos"
**Solución:** Verifica que estén en la raíz del proyecto
```bash
ls -la agent-*.md orchestrator.md
```

### Problema: "Output muy genérico"
**Solución:** Agrega contexto específico del framework
```bash
claude chat "
Contexto: OmegaFramework usa ES5, Data Extensions, Strategy pattern.
Rol: [Agente]
[tu tarea]
"
```

### Problema: "Claude Code no funciona"
**Solución:** Verifica instalación
```bash
claude --version
# Si no funciona, instala: npm install -g @anthropic-ai/claude-code
```

---

## 📊 MÉTRICAS DE ÉXITO

Usa el sistema correctamente cuando veas:

✅ **Código de calidad:**
- Sin issues críticos del Validador
- Documentación completa
- Tests incluidos

✅ **Velocidad:**
- 1-2 días por feature completa
- Iteraciones rápidas con feedback

✅ **Consistencia:**
- Mismo flujo para todas las features
- Formato estandarizado
- Decisiones documentadas

---

## 🎓 PRÓXIMOS PASOS

### Nivel 1: Principiante (Hoy)
1. ✅ Lee `CHEATSHEET.md` (5 min)
2. ✅ Ejecuta `EJEMPLO-PRIMERA-TAREA.md` (10 min)
3. ✅ Usa un agente para una tarea real (30 min)

### Nivel 2: Intermedio (Esta semana)
1. Implementa una feature completa usando los 4 agentes
2. Crea tu primer archivo de tarea usando `TEMPLATE-TAREA.md`
3. Establece tu workflow personal

### Nivel 3: Avanzado (Este mes)
1. Lee `README-MULTIAGENT.md` completo
2. Usa el Orquestador para proyectos grandes
3. Customiza los agentes según tus necesidades

---

## 🚀 ¡EMPIEZA AHORA!

**Tu primer comando (copia y pega):**

```bash
cd /ruta/a/miniframework-ssjs
claude chat "Rol: Arquitecto. Dame un assessment de 2 minutos del OmegaFramework: 3 fortalezas, 3 mejoras prioritarias, 1 quick win para hoy."
```

**Después de eso, lee:** `CHEATSHEET.md` para ver más comandos.

---

## 📞 SOPORTE

- **Dudas generales:** Lee `README-MULTIAGENT.md`
- **Comandos rápidos:** Consulta `CHEATSHEET.md`
- **Primera vez:** Sigue `EJEMPLO-PRIMERA-TAREA.md`
- **Crear tareas:** Usa `TEMPLATE-TAREA.md`

---

## 🎉 RESUMEN

Tienes un **sistema profesional de 4 agentes IA** para desarrollar OmegaFramework:

1. **Arquitecto** - Diseña soluciones
2. **Desarrollador** - Implementa código SSJS
3. **Validador** - Verifica compatibilidad SFMC
4. **Documentador** - Genera docs y tests
5. **Orquestador** - Coordina todo

**Todo está listo. Solo necesitas empezar a usarlo.** 💪

---

**¿Listo? Ejecuta tu primer comando ahora.** 🚀
