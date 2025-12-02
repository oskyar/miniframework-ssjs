# 🚀 CHEATSHEET - Agentes OmegaFramework

## COMANDO BASE

```bash
claude chat "Rol: [AGENTE]. [TU TAREA]"
```

---

## 🎭 LOS 4 AGENTES

### 🏗️ ARQUITECTO
**Cuándo usar:** Diseño, patrones, decisiones arquitectónicas
```bash
claude chat "Rol: Arquitecto (agent-architect.md). [tarea de diseño]"
```

### 💻 DESARROLLADOR  
**Cuándo usar:** Implementar código SSJS
```bash
claude chat "Rol: Desarrollador (agent-developer.md). [tarea de código]"
```

### ✅ VALIDADOR
**Cuándo usar:** Verificar compatibilidad SFMC
```bash
claude chat "Rol: Validador (agent-validator.md). [tarea de validación]"
```

### 📚 DOCUMENTADOR
**Cuándo usar:** Docs, tests, troubleshooting
```bash
claude chat "Rol: Documentador (agent-documenter.md). [tarea de docs]"
```

---

## ⚡ COMANDOS RÁPIDOS

### Análisis rápido
```bash
claude chat "Rol: Arquitecto. Analiza [archivo] y dame 3 quick wins."
```

### Implementar feature
```bash
claude chat "Rol: Desarrollador. Implementa [feature] en SSJS (ES5)."
```

### Validar código
```bash
claude chat "Rol: Validador. Valida este código para SFMC: [código]"
```

### Documentar
```bash
claude chat "Rol: Documentador. Documenta [archivo] con API docs y ejemplos."
```

---

## 🔄 WORKFLOW COMPLETO

### 1️⃣ Diseñar
```bash
claude chat "Rol: Arquitecto. Diseña [feature]." > arch.md
```

### 2️⃣ Implementar
```bash
claude chat "Rol: Desarrollador. Implementa diseño en arch.md." > impl.md
```

### 3️⃣ Validar
```bash
claude chat "Rol: Validador. Valida código en impl.md." > val.md
```

### 4️⃣ Documentar
```bash
claude chat "Rol: Documentador. Documenta impl.md." > docs.md
```

---

## 🎯 EJEMPLOS ESPECÍFICOS

### Analizar módulo existente
```bash
claude chat "
Rol: Arquitecto
Analiza core/ConnectionHandler.ssjs
Propón 3 mejoras priorizadas
"
```

### Crear nuevo módulo
```bash
claude chat "
Rol: Desarrollador
Crea core/CircuitBreaker.ssjs
- Detectar fallos consecutivos
- Timeout configurable
- Compatible con ConnectionHandler
Output: Código completo SSJS (ES5)
"
```

### Fix de bug
```bash
claude chat "
Rol: Desarrollador
Bug en DataExtensionTokenCache línea 42
Tokens no expiran correctamente
Fix: Validar expiración con 5 min buffer
"
```

### Code review
```bash
claude chat "
Rol: Validador
Revisa este código para merge:

\`\`\`javascript
[código]
\`\`\`

Checklist:
- ES5 syntax
- Error handling
- Performance
- SFMC compatible
"
```

---

## 💡 TIPS

### ✅ Haz esto:
- Especifica el rol SIEMPRE
- Sé específico con tu tarea
- Guarda outputs en archivos
- Usa el contexto del framework

### ❌ Evita esto:
- No especificar el rol
- Tareas muy vagas
- Olvidar las restricciones de SSJS
- Mezclar roles en una tarea

---

## 🔥 COMANDOS MÁS USADOS

### Top 1: Quick Assessment
```bash
claude chat "Rol: Arquitecto. Quick assessment de OmegaFramework."
```

### Top 2: Implementar mejora
```bash
claude chat "Rol: Desarrollador. Implementa [ID de mejora]."
```

### Top 3: Validar antes de commit
```bash
claude chat "Rol: Validador. Valida cambios en [archivo]."
```

### Top 4: Generar docs
```bash
claude chat "Rol: Documentador. Docs para [módulo nuevo]."
```

---

## 📁 ESTRUCTURA RECOMENDADA

```
miniframework-ssjs/
├── agent-*.md              # Archivos de configuración
├── tasks/                  # Tareas planificadas
│   └── task-XXX.md
└── outputs/                # Outputs de Claude
    ├── XXX-analysis.md
    ├── XXX-implementation.md
    ├── XXX-validation.md
    └── XXX-documentation.md
```

---

## 🆘 TROUBLESHOOTING

### Claude no sigue el rol
**Fix:** Sé más explícito
```bash
claude chat "
IMPORTANTE: Actúa SOLO como [Agente].
Lee agent-[agente].md completo.
No mezcles otros roles.

[tu tarea]
"
```

### Output muy genérico
**Fix:** Agrega contexto del framework
```bash
claude chat "
Contexto: OmegaFramework usa:
- Data Extensions para cache
- Strategy pattern para auth
- ES5 (no ES6+)
- ResponseWrapper para responses

Rol: [Agente]
[tu tarea]
"
```

---

## 🎓 FORMATO DE PROMPT PERFECTO

```bash
claude chat "
# CONTEXTO
Proyecto: OmegaFramework (SSJS para SFMC)
Restricciones: ES5 only, stateless, Data Extensions

# ROL
[Arquitecto|Desarrollador|Validador|Documentador]
Referencia: agent-[X].md

# TAREA
[Descripción clara y específica]

# OUTPUT
[Formato deseado]
"
```

---

## 📞 COMANDOS DE EMERGENCIA

### Help rápido
```bash
claude chat "Rol: Arquitecto. ¿Cómo implemento [concepto] en SFMC?"
```

### Debug
```bash
claude chat "Rol: Validador. ¿Por qué este código falla en SFMC? [código]"
```

### Performance
```bash
claude chat "Rol: Arquitecto. ¿Cómo optimizo [operación] para SFMC?"
```

---

## 🎯 RECUERDA

1. **Siempre especifica el rol**
2. **Un agente = Una responsabilidad**
3. **Guarda los outputs**
4. **Itera basándote en feedback**
5. **Valida SIEMPRE antes de producción**

---

## 🚀 EMPEZAR AHORA

```bash
# Copia y pega esto para tu primera tarea:
claude chat "Rol: Arquitecto. Analiza el estado actual de OmegaFramework y dame Top 3 mejoras que pueda implementar esta semana."
```

**¡Eso es todo! Úsame con confianza.** 💪
