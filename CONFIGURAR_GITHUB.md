# Configurar OmegaFramework en GitHub

## 🎯 Objetivo

Subir OmegaFramework a GitHub para que el instalador pueda descargar los archivos automáticamente. Esto hace el framework:
- ✅ **Más fácil de mantener**: Actualiza código en GitHub, no el instalador
- ✅ **Más escalable**: Cualquier cambio se refleja automáticamente
- ✅ **Más transparente**: El código es visible y auditable
- ✅ **Versionable**: Control de versiones integrado con Git

---

## 📋 Requisitos Previos

- Cuenta de GitHub (gratuita)
- Git instalado en tu computadora (opcional, también puedes usar la web)
- Acceso a tu proyecto OmegaFramework local

---

## 🚀 Opción 1: Subir vía GitHub Web (Más Fácil)

### Paso 1: Crear Repositorio

1. Ve a [github.com](https://github.com)
2. Haz clic en **"New repository"** (botón verde)
3. Configuración:
   ```
   Repository name: omegaframework
   Description: OmegaFramework v1.1 - SSJS Framework para Salesforce Marketing Cloud
   Visibility: ✅ Public (IMPORTANTE)
   ✅ Add a README file
   ✅ Add .gitignore (Node)
   License: MIT
   ```
4. Click **"Create repository"**

### Paso 2: Subir Archivos

1. En tu repositorio, haz clic en **"Add file" > "Upload files"**
2. Arrastra esta estructura de carpetas:

   ```
   📁 omegaframework/
   ├── 📁 src/
   │   ├── Core.ssjs
   │   ├── Settings.ssjs
   │   ├── ResponseWrapper.ssjs
   │   ├── AuthHandler.ssjs
   │   ├── ConnectionHandler.ssjs
   │   ├── EmailHandler.ssjs
   │   ├── DataExtensionHandler.ssjs
   │   ├── AssetHandler.ssjs
   │   ├── FolderHandler.ssjs
   │   ├── LogHandler.ssjs
   │   ├── AssetCreator.ssjs
   │   └── JourneyCreator.ssjs
   │
   ├── 📁 install/
   │   └── GitHubInstaller.html
   │
   ├── 📁 examples/
   │   ├── PracticalExample.ssjs
   │   └── TestExample.ssjs
   │
   ├── 📁 docs/
   │   └── CLAUDE.md
   │
   ├── 📁 config/
   │   ├── framework.json
   │   └── version.json
   │
   ├── README.md
   ├── GUIA_INSTALACION.md
   ├── MIGRACION_v1.1.md
   └── ANALISIS_COMPARATIVO.md
   ```

3. Escribe un commit message: "Initial commit - OmegaFramework v1.1"
4. Click **"Commit changes"**

### Paso 3: Obtener URL Raw

1. Navega a cualquier archivo, por ejemplo: `src/Core.ssjs`
2. Haz clic en el botón **"Raw"** (arriba a la derecha del código)
3. La URL se verá así:
   ```
   https://raw.githubusercontent.com/TU_USUARIO/omegaframework/main/src/Core.ssjs
   ```
4. **Tu URL base es**:
   ```
   https://raw.githubusercontent.com/TU_USUARIO/omegaframework/main/
   ```
   ⚠️ **IMPORTANTE**: Termina en `/` (slash final)

### Paso 4: Probar URL

Abre esta URL en tu navegador:
```
https://raw.githubusercontent.com/TU_USUARIO/omegaframework/main/src/Core.ssjs
```

Deberías ver el código SSJS, **NO** una página HTML de GitHub.

✅ **Correcto**: Ves código con `<script runat="server">`
❌ **Incorrecto**: Ves HTML con botones de GitHub

---

## 🔧 Opción 2: Subir vía Git CLI (Para Desarrolladores)

### Paso 1: Instalar Git

Si no tienes Git instalado:
- **Windows**: Descarga de [git-scm.com](https://git-scm.com/download/win)
- **Mac**: `brew install git` o descarga de [git-scm.com](https://git-scm.com/download/mac)
- **Linux**: `sudo apt install git` o `sudo yum install git`

### Paso 2: Configurar Git (Primera Vez)

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### Paso 3: Crear Repositorio en GitHub

1. Ve a [github.com/new](https://github.com/new)
2. Nombre: `omegaframework`
3. Visibilidad: **Public**
4. ✅ Add a README
5. Click "Create repository"

### Paso 4: Clonar e Inicializar

```bash
# Ir a tu carpeta de proyectos
cd ~/SFMC/

# Clonar tu nuevo repo
git clone https://github.com/TU_USUARIO/omegaframework.git

# Entrar al repo
cd omegaframework
```

### Paso 5: Copiar Archivos del Framework

```bash
# Copiar todos los archivos del miniframework al repo
# Asegúrate de mantener la estructura de carpetas

# Ejemplo en Linux/Mac:
cp -r /path/to/miniframework-ssjs/src ./
cp -r /path/to/miniframework-ssjs/install ./
cp -r /path/to/miniframework-ssjs/examples ./
cp -r /path/to/miniframework-ssjs/docs ./
cp -r /path/to/miniframework-ssjs/config ./
cp /path/to/miniframework-ssjs/*.md ./

# Ejemplo en Windows PowerShell:
Copy-Item -Path "C:\path\to\miniframework-ssjs\src" -Destination .\ -Recurse
Copy-Item -Path "C:\path\to\miniframework-ssjs\install" -Destination .\ -Recurse
# ... etc
```

### Paso 6: Crear .gitignore

```bash
# Crear archivo .gitignore
cat > .gitignore << 'EOF'
# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Temp
*.tmp
temp/
tmp/

# Credentials (NUNCA subir credenciales)
*credentials*
*secrets*
.env
EOF
```

### Paso 7: Commit y Push

```bash
# Ver archivos a subir
git status

# Agregar todos los archivos
git add .

# Crear commit
git commit -m "Initial commit - OmegaFramework v1.1.0"

# Subir a GitHub
git push origin main
```

### Paso 8: Verificar en GitHub

1. Ve a `https://github.com/TU_USUARIO/omegaframework`
2. Deberías ver todos tus archivos
3. Navega a `src/Core.ssjs`
4. Click en "Raw" para obtener la URL raw

---

## 🔐 Repositorio Privado (Opcional)

Si prefieres mantener el repositorio privado:

### Opción A: Personal Access Token

1. GitHub > Settings > Developer settings > Personal access tokens
2. Generate new token (classic)
3. Scopes: `repo` (full control)
4. Copia el token

**URL modificada**:
```
https://TOKEN@raw.githubusercontent.com/USER/REPO/main/
```

⚠️ **No recomendado**: El token queda visible en el instalador

### Opción B: GitHub Actions (Avanzado)

Puedes configurar un GitHub Action que publique los archivos en un bucket público (S3, Azure Blob, etc.) y usar esa URL en el instalador.

---

## ✅ Verificación Final

Antes de usar el instalador, verifica:

### Checklist:

- [ ] Repositorio es **público**
- [ ] Estructura de carpetas correcta (`src/`, `install/`, etc.)
- [ ] Todos los archivos `.ssjs` están subidos
- [ ] URL raw funciona en el navegador
- [ ] URL termina en `/` (slash final)

### Prueba Manual:

```bash
# Prueba descargar un archivo
curl https://raw.githubusercontent.com/TU_USUARIO/omegaframework/main/src/Core.ssjs

# Deberías ver el código SSJS
# Si ves "404", la URL es incorrecta
# Si ves HTML, no estás usando la URL "raw"
```

---

## 📝 Actualizar el Framework

Cuando hagas cambios al código:

### Vía Web:

1. Ve al archivo en GitHub
2. Click en el ícono del lápiz (Edit)
3. Haz cambios
4. Commit changes

### Vía Git:

```bash
# Hacer cambios locales
# ...

# Ver cambios
git status
git diff

# Commit
git add .
git commit -m "Descripción del cambio"

# Push
git push origin main
```

⚡ **Ventaja**: El instalador SIEMPRE descarga la última versión automáticamente!

---

## 🎯 URL Final para el Instalador

Tu URL completa será:

```
https://raw.githubusercontent.com/TU_USUARIO/omegaframework/main/
```

**Ejemplos reales**:
```
https://raw.githubusercontent.com/johndoe/omegaframework/main/
https://raw.githubusercontent.com/acme-corp/sfmc-framework/main/
https://raw.githubusercontent.com/marketing-team/omega-fw/main/
```

Copia esta URL y pégala en el campo "Repositorio GitHub" del instalador.

---

## 🆘 Problemas Comunes

### "404 Not Found" al acceder a archivos

**Causa**: Repositorio privado o URL incorrecta

**Solución**:
- Verifica que el repo sea público
- Asegúrate de usar `raw.githubusercontent.com`, no `github.com`
- Verifica que la rama sea `main` (no `master`)

### "Permission denied" al hacer push

**Causa**: Sin permisos o sin autenticación

**Solución**:
```bash
# Configurar credenciales
git config credential.helper store

# O usar SSH en lugar de HTTPS
git remote set-url origin git@github.com:USER/REPO.git
```

### El instalador descarga HTML en lugar de código

**Causa**: No estás usando la URL "raw"

**Solución**:
- Debe ser `raw.githubusercontent.com`
- NO debe ser `github.com`

### Archivos no se actualizan en el instalador

**Causa**: Cache del navegador o de SFMC

**Solución**:
- Espera 1-2 minutos
- Limpia cache del navegador
- Agrega `?v=2` al final de la URL en el instalador para forzar recarga

---

## 📚 Recursos Adicionales

- [GitHub Docs](https://docs.github.com)
- [Git Tutorial](https://git-scm.com/docs/gittutorial)
- [GitHub Desktop](https://desktop.github.com/) - GUI para Git

---

**¡Listo! Ahora puedes usar el instalador GitHubInstaller.html con tu repositorio configurado.** 🎉
