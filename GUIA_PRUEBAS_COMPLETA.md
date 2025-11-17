# 🚀 Guía Rápida: Prueba de Autenticación Frontend-Backend

## ✅ Estado Actual

### Backend (backend-smartcode)
- ✅ Entidad `AppUser` creada (JPA)
- ✅ Repositorio `UserRepository` creado
- ✅ Servicio `AuthService` implementado con lógica real
- ✅ Controlador `AuthController` actualizado para usar el servicio
- ✅ BCrypt configurado para hashear contraseñas
- ✅ Manejador de errores global configurado
- ⚠️ **PENDIENTE:** Compilar y ejecutar con perfil `dev`

### Frontend (FrontAndinaBus)
- ✅ `.env.local` configurado con URL del backend
- ✅ API service (`lib/api.ts`) listo
- ✅ Componentes Login y Register funcionales
- ✅ Manejo de tokens y sesión implementado
- ✅ Rutas de dashboard configuradas
- ✅ **LISTO PARA USAR**

---

## 📋 PASOS PARA EJECUTAR

### 🔴 IMPORTANTE: Orden de Ejecución

#### 1️⃣ Compilar el Backend
```powershell
cd "c:\Users\alexi\Desktop\Proyecto DAS\backend-smartcode"
.\mvnw.cmd clean package -DskipTests
```

#### 2️⃣ Iniciar el Backend con Perfil DEV
```powershell
# Opción 1: Directa
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev

# Opción 2: Desde el JAR compilado
java -jar -Dspring.profiles.active=dev target/backend-smartcode-0.0.1-SNAPSHOT.jar
```

**Espera a ver este mensaje:**
```
Started BackendSmartcodeApplication in X.XXX seconds
```

#### 3️⃣ Verificar que el Backend esté funcionando
Abre tu navegador y visita: `http://localhost:8080`

Deberías ver una página de error de Whitelabel (esto es normal, significa que Spring está corriendo).

#### 4️⃣ El Frontend ya está corriendo
Si el frontend ya está ejecutándose en `http://localhost:3000`, ¡no necesitas hacer nada más!

Si no está corriendo:
```powershell
cd "c:\Users\alexi\Desktop\Proyecto DAS\FrontAndinaBus"
npm run dev
```

---

## 🧪 PRUEBAS A REALIZAR

### ✅ PRUEBA 1: Registro de Usuario (Guarda en BD)

1. **Abre:** `http://localhost:3000/register`

2. **Completa el formulario:**
   ```
   Nombre:          Juan
   Apellido:        Pérez
   Cédula:          1234567890
   Email:           juan.perez@example.com
   Password:        Password123!
   Confirmar:       Password123!
   ```

3. **Click en:** "Registrarse"

4. **Resultado esperado:**
   - ✅ Redirige a `/dashboard/Cliente`
   - ✅ Token guardado en localStorage
   - ✅ Usuario guardado en PostgreSQL

5. **Verificar en PostgreSQL:**
   ```sql
   SELECT * FROM app_user WHERE email = 'juan.perez@example.com';
   ```
   
   Deberías ver:
   - `id`: Auto-generado
   - `email`: juan.perez@example.com
   - `password_hash`: Hash BCrypt (empieza con $2a$)
   - `nombres`: Juan
   - `apellidos`: Pérez
   - `rol`: CLIENTE
   - `activo`: true
   - `created_at`: Fecha actual

---

### ✅ PRUEBA 2: Login con Usuario Registrado

1. **Abre:** `http://localhost:3000/login`

2. **Ingresa las credenciales del usuario que acabas de registrar:**
   ```
   Email:     juan.perez@example.com
   Password:  Password123!
   ```

3. **Click en:** "Iniciar sesión"

4. **Resultado esperado:**
   - ✅ Redirige a `/dashboard/Cliente`
   - ✅ Token generado y guardado
   - ✅ Datos del usuario cargados desde la BD

---

### ✅ PRUEBA 3: Error - Email Duplicado

1. **Intenta registrar el mismo email de nuevo:**
   - Abre: `http://localhost:3000/register`
   - Email: `juan.perez@example.com`

2. **Resultado esperado:**
   - ❌ Error: "El email ya está registrado"
   - ✅ NO se crea usuario duplicado en BD

---

### ✅ PRUEBA 4: Error - Credenciales Incorrectas

1. **Abre:** `http://localhost:3000/login`

2. **Ingresa:**
   ```
   Email:     juan.perez@example.com
   Password:  ContraseñaIncorrecta
   ```

3. **Resultado esperado:**
   - ❌ Error: "Credenciales incorrectas"
   - ✅ NO se genera token

---

### ✅ PRUEBA 5: Verificar en DevTools

**Pestaña Network (F12):**

1. Después de hacer login/register, busca la petición
2. Verifica:
   ```
   Request URL: http://localhost:8080/auth/login o /auth/register
   Status Code: 200 (login) o 201 (register)
   Request Method: POST
   ```

3. En la pestaña **Response**, deberías ver:
   ```json
   {
     "token": "token-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
     "userId": 1,
     "email": "juan.perez@example.com",
     "rol": "CLIENTE",
     "nombres": "Juan",
     "apellidos": "Pérez"
   }
   ```

**Pestaña Application > Local Storage:**
- `token`: Token UUID generado
- `user`: JSON con datos del usuario

**Pestaña Console:**
- ✅ Sin errores de CORS
- ✅ Sin errores de conexión

---

## 🔍 VERIFICAR EN LA BASE DE DATOS

### Conectarse a PostgreSQL:
```powershell
psql -U postgres -d das_dev
```

### Consultas útiles:
```sql
-- Ver todos los usuarios
SELECT id, email, nombres, apellidos, rol, activo, created_at 
FROM app_user;

-- Ver el password hasheado de un usuario
SELECT email, password_hash 
FROM app_user 
WHERE email = 'juan.perez@example.com';

-- Contar usuarios por rol
SELECT rol, COUNT(*) 
FROM app_user 
GROUP BY rol;

-- Ver usuarios activos
SELECT email, nombres, apellidos, rol 
FROM app_user 
WHERE activo = true;
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Table 'app_user' doesn't exist"

**Causa:** El backend no está usando el perfil `dev`, por lo que Flyway no ejecutó las migraciones.

**Solución:**
```powershell
# Asegúrate de iniciar con perfil dev
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```

---

### Error: "Could not autowire UserRepository"

**Causa:** El backend no se compiló correctamente o falta la dependencia JPA.

**Solución:**
```powershell
.\mvnw.cmd clean compile
```

---

### Error: "Failed to fetch" en el Frontend

**Causa:** El backend no está corriendo o está en puerto incorrecto.

**Solución:**
1. Verifica que el backend esté corriendo: `http://localhost:8080`
2. Verifica que `.env.local` tenga: `NEXT_PUBLIC_API_URL=http://localhost:8080`
3. Reinicia el frontend si cambiaste el `.env.local`

---

### Error: "Credenciales incorrectas" pero el password es correcto

**Causa:** El usuario no existe en la BD o hay un problema con el hash.

**Solución:**
1. Verifica que el usuario exista:
   ```sql
   SELECT * FROM app_user WHERE email = 'tu@email.com';
   ```
2. Si no existe, regístralo de nuevo
3. Si existe pero no funciona, elimínalo y regístralo:
   ```sql
   DELETE FROM app_user WHERE email = 'tu@email.com';
   ```

---

### El password no se está hasheando

**Causa:** BCrypt no está configurado correctamente.

**Solución:**
1. Verifica que existe `SecurityConfig.java`
2. Verifica que el `pom.xml` tiene la dependencia `spring-security-crypto`
3. Recompila el proyecto

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de probar, asegúrate de que:

- [ ] PostgreSQL está corriendo
- [ ] Base de datos `das_dev` existe
- [ ] Backend compilado sin errores
- [ ] Backend iniciado con perfil `dev` (ver logs)
- [ ] Backend responde en `http://localhost:8080`
- [ ] Frontend corriendo en `http://localhost:3000`
- [ ] `.env.local` apunta a `http://localhost:8080`
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores de CORS

---

## 📊 FLUJO COMPLETO

```
Usuario completa registro
    ↓
Frontend: POST /auth/register { email, password, nombres, apellidos }
    ↓
Backend: AuthController recibe petición
    ↓
Backend: AuthService.register()
    ↓
Backend: Verifica si email existe (userRepository.existsByEmail)
    ↓
Backend: Hashea password con BCrypt
    ↓
Backend: Crea AppUser y guarda en BD (userRepository.save)
    ↓
Backend: Genera token UUID
    ↓
Backend: Retorna { token, userId, email, rol, nombres, apellidos }
    ↓
Frontend: Guarda token y user en localStorage
    ↓
Frontend: Redirige a /dashboard/Cliente
    ↓
✅ Usuario autenticado y datos en PostgreSQL
```

---

## 🎯 DIFERENCIAS: Mock vs Real

### Antes (Mock):
- ❌ Usuarios en memoria (se pierden al reiniciar)
- ❌ Password no se validaba
- ❌ Emails duplicados permitidos
- ❌ Token siempre "demo-token-client"

### Ahora (Real):
- ✅ Usuarios en PostgreSQL (persistentes)
- ✅ Password hasheado con BCrypt
- ✅ Validación de email único
- ✅ Token UUID único por sesión
- ✅ Validación de credenciales real

---

## 📝 NOTAS IMPORTANTES

1. **Tokens:** Actualmente usamos UUID simples. Para producción, implementa JWT.

2. **Endpoint /users/me:** Necesita mejorarse para validar tokens reales en lugar de usar datos demo.

3. **Roles:** Por ahora solo se crea "CLIENTE" al registrarse. Los roles ADMIN, COOPERATIVA, OFICINISTA deben asignarse manualmente en la BD.

4. **Perfil dev:** Recuerda siempre iniciar con `-Dspring-boot.run.profiles=dev` para que use PostgreSQL.

---

## ✨ PRÓXIMOS PASOS RECOMENDADOS

Una vez que verifiques que la autenticación funciona:

1. ✅ Implementar JWT tokens reales
2. ✅ Mejorar endpoint `/users/me` con validación de token
3. ✅ Agregar roles personalizados en registro
4. ✅ Implementar "Olvidé mi contraseña"
5. ✅ Conectar búsqueda de rutas con BD
6. ✅ Implementar módulo de ventas/reservas

---

**¿Funcionó todo?** ¡Excelente! Ahora tienes una autenticación completa con persistencia real.

**¿Hay errores?** Revisa la sección "Solución de Problemas" o consulta los logs del backend.
